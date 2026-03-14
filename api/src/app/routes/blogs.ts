import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { BlogPostStatus, PrismaClient } from '@prisma/client';
import { z } from 'zod';
import { getAIService } from '../../services/ai';

const prisma = new PrismaClient();
const ai = getAIService();

type ApiErrorCode =
  | 'UNAUTHORIZED'
  | 'FORBIDDEN'
  | 'VALIDATION_ERROR'
  | 'NOT_FOUND'
  | 'AI_ERROR'
  | 'UNSPLASH_ERROR'
  | 'INTERNAL_ERROR';

function nowIso() {
  return new Date().toISOString();
}

function ok<T>(data: T) {
  return { success: true as const, data, timestamp: nowIso() };
}

function fail(code: ApiErrorCode, message: string, details?: Record<string, unknown>) {
  return { success: false as const, error: { code, message, ...(details ? { details } : {}) }, timestamp: nowIso() };
}

async function requireAdmin(request: FastifyRequest, reply: FastifyReply) {
  const fastify = request.server as FastifyInstance;
  await fastify.authenticate(request, reply);
  if (reply.sent) return;

  const userId = request.user?.id;
  if (!userId) {
    return reply.status(403).send(fail('FORBIDDEN', 'Admin access required'));
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { isAdmin: true },
  });

  if (!user?.isAdmin) {
    return reply.status(403).send(fail('FORBIDDEN', 'Admin access required'));
  }
}

function slugify(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/['"]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80) // keep room for -2, -3, etc.
    .replace(/-+$/g, '');
}

async function generateUniqueSlug(baseSlug: string, excludePostId?: string): Promise<string> {
  const safeBase = baseSlug || `post-${Date.now()}`;
  let slug = safeBase;
  let counter = 1;

  // eslint-disable-next-line no-constant-condition
  while (true) {
    const existing = await prisma.blogPost.findFirst({
      where: excludePostId ? { slug, NOT: { id: excludePostId } } : { slug },
      select: { id: true },
    });
    if (!existing) return slug;
    slug = `${safeBase}-${counter}`;
    counter++;
    if (counter > 100) throw new Error('Unable to generate unique slug after 100 attempts');
  }
}

const GetBlogsQuerySchema = z.object({
  published: z.enum(['true', 'false', 'all']).optional(),
});

const PutBlogSchema = z.object({
  title: z.string().min(1).max(200),
  contentMarkdown: z.string().min(1),
  isPublished: z.boolean(),
});

const GenerateSchema = z
  .object({
    mode: z.enum(['auto', 'topic', 'custom']).optional(),
    topic: z.string().min(1).max(500).optional(),
    customContent: z.string().min(1).max(50_000).optional(),
    systemPromptOverride: z.string().max(10_000).optional(),
  })
  .superRefine((val, ctx) => {
    const mode = val.mode ?? 'auto';
    if (mode === 'topic' && !val.topic) {
      ctx.addIssue({ code: 'custom', path: ['topic'], message: 'topic is required when mode="topic"' });
    }
    if (mode === 'custom' && !val.customContent) {
      ctx.addIssue({
        code: 'custom',
        path: ['customContent'],
        message: 'customContent is required when mode="custom"',
      });
    }
  });

const AiBlogOutputSchema = z.object({
  title: z.string().min(1).max(200),
  contentMarkdown: z.string().min(200),
  imageSearchTerm: z.string().min(1).max(120),
});

type GenerateMode = 'auto' | 'topic' | 'custom';

async function fetchUnsplashImageUrl(searchTerm: string): Promise<string | null> {
  const key = process.env.UNSPLASH_ACCESS_KEY;
  if (!key) throw new Error('UNSPLASH_ACCESS_KEY is not set');

  const url = new URL('https://api.unsplash.com/search/photos');
  url.searchParams.set('query', searchTerm);
  url.searchParams.set('orientation', 'landscape');
  url.searchParams.set('per_page', '10');

  const res = await fetch(url.toString(), {
    headers: {
      Authorization: `Client-ID ${key}`,
      'Accept-Version': 'v1',
    },
  });

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`Unsplash error ${res.status}: ${text.slice(0, 500)}`);
  }

  const json = (await res.json()) as {
    results?: Array<{ urls?: { regular?: string } }>;
  };
  const image = json.results?.find((r) => r.urls?.regular)?.urls?.regular ?? null;
  return image;
}

function truncateForPrompt(input: string, maxChars: number) {
  if (input.length <= maxChars) return input;
  return `${input.slice(0, maxChars)}\n\n(Truncated)`;
}

async function getStyleContextPosts() {
  // Deep context: last 3 published posts (title + markdown)
  return prisma.blogPost.findMany({
    where: { status: BlogPostStatus.PUBLISHED },
    orderBy: [{ publishedAt: 'desc' }, { createdAt: 'desc' }],
    take: 3,
    select: { title: true, content: true },
  });
}

function buildSystemPrompt(input: {
  mode: GenerateMode;
  systemPromptOverride?: string;
  contextPosts: { title: string; content: string }[];
}) {
  const defaultPersona =
    "You are an elite B2B SaaS copywriter and productivity expert for 'inbox0', a modern app designed to help professionals conquer email overload and achieve Inbox Zero. Your tone is sharp, modern, highly actionable, and tech-savvy. Use formatting like H2s, bullet points, and code-like precision.";

  const basePrompt =
    input.systemPromptOverride && input.systemPromptOverride.trim().length > 0
      ? input.systemPromptOverride.trim()
      : defaultPersona;

  const contextBlock =
    input.contextPosts.length === 0
      ? 'No prior published posts found.'
      : input.contextPosts
          .map(
            (p, i) =>
              `---\nReferencePost_${i + 1}_Title: ${p.title}\nReferencePost_${i + 1}_Markdown:\n${truncateForPrompt(
                p.content,
                3500
              )}\n---`
          )
          .join('\n\n');

  const outputContract = `Return a single JSON object only (no markdown, no code fence) with EXACT keys:\n{\n  \"title\": string,\n  \"contentMarkdown\": string,\n  \"imageSearchTerm\": string\n}`;

  const baseGuidelines = `The output contentMarkdown must be written in Markdown and include:\n- A short hook\n- Multiple H2 sections\n- Bullet points where useful\n- A crisp conclusion with a CTA for inbox0.\n\nMatch the tone and formatting patterns found in the reference posts.`;

  return `${basePrompt}\n\n${outputContract}\n\n${baseGuidelines}\n\nReference posts:\n${contextBlock}\n`;
}

async function generateBlogDraft(input: {
  mode: GenerateMode;
  topic?: string;
  customContent?: string;
  systemPromptOverride?: string;
}) {
  const contextPosts = await getStyleContextPosts();

  const systemPrompt = buildSystemPrompt({
    mode: input.mode,
    systemPromptOverride: input.systemPromptOverride,
    contextPosts,
  });

  let userPrompt: string;
  if (input.mode === 'auto') {
    userPrompt = `Mode: auto\n\n1) Brainstorm a fresh, highly relevant B2B SaaS topic for inbox0.\n2) Write the full post.\n3) Choose an imageSearchTerm that will yield a high-quality, modern, tech/productivity landscape image.\n\nDo NOT mention that you were given reference posts.`;
  } else if (input.mode === 'topic') {
    userPrompt = `Mode: topic\n\nWrite a full post about this topic:\n${input.topic}\n\nUse the reference posts to match style.\nChoose an imageSearchTerm that yields a modern, relevant landscape image.`;
  } else {
    userPrompt = `Mode: custom\n\nYou are an editor. Take the following raw draft and transform it into a polished, well-structured Markdown blog post for inbox0.\n- Fix typos and tighten prose\n- Add H2s, bullet points, and clear structure\n- Preserve the author's intent but improve clarity and punch\n- Generate a catchy title\n- Choose an imageSearchTerm for a modern, relevant landscape image\n\nRaw draft:\n${input.customContent}`;
  }

  const completion = await ai.chatCompletion({
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ],
    response_format: { type: 'json_object' },
  });

  const raw = completion.choices[0]?.message?.content;
  if (!raw) throw new Error('Empty AI response');

  const parsed = JSON.parse(raw);
  const validated = AiBlogOutputSchema.parse(parsed);
  return validated;
}

export default async function blogsRoutes(fastify: FastifyInstance) {
  // GET /api/blogs?published=true|false|all
  fastify.get('/blogs', async (request, reply) => {
    const q = GetBlogsQuerySchema.safeParse(request.query ?? {});
    if (!q.success) {
      return reply.status(400).send(fail('VALIDATION_ERROR', 'Invalid query', q.error.flatten() as any));
    }

    const published = q.data.published ?? 'true';
    const isAdminRequest = published === 'all' || published === 'false';
    if (isAdminRequest) {
      await requireAdmin(request, reply);
      if (reply.sent) return;
    }

    const where =
      published === 'true'
        ? { status: BlogPostStatus.PUBLISHED }
        : published === 'false'
          ? { status: BlogPostStatus.DRAFT }
          : undefined;

    const posts = await prisma.blogPost.findMany({
      where,
      orderBy: published === 'true' ? { publishedAt: 'desc' } : { updatedAt: 'desc' },
      select: {
        id: true,
        title: true,
        slug: true,
        content: isAdminRequest ? true : false,
        imageUrl: true,
        status: true,
        seoTitle: true,
        seoDesc: true,
        publishedAt: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return reply.send(ok(posts));
  });

  // GET /api/blogs/:slug (public, published only)
  fastify.get('/blogs/:slug', async (request, reply) => {
    const { slug } = request.params as { slug: string };
    const post = await prisma.blogPost.findUnique({
      where: { slug },
      select: {
        id: true,
        title: true,
        slug: true,
        content: true,
        imageUrl: true,
        status: true,
        seoTitle: true,
        seoDesc: true,
        publishedAt: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!post || post.status !== BlogPostStatus.PUBLISHED) {
      return reply.status(404).send(fail('NOT_FOUND', 'Post not found'));
    }

    return reply.send(ok(post));
  });

  // PUT /api/blogs/:id (admin)
  fastify.put('/blogs/:id', { preHandler: [requireAdmin] }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const body = PutBlogSchema.safeParse(request.body);
    if (!body.success) {
      return reply.status(400).send(fail('VALIDATION_ERROR', 'Invalid body', body.error.flatten() as any));
    }

    const existing = await prisma.blogPost.findUnique({ where: { id } });
    if (!existing) return reply.status(404).send(fail('NOT_FOUND', 'Post not found'));

    const baseSlug = slugify(body.data.title);
    const nextSlug =
      baseSlug && baseSlug !== existing.slug ? await generateUniqueSlug(baseSlug, existing.id) : existing.slug;

    const nextStatus = body.data.isPublished ? BlogPostStatus.PUBLISHED : BlogPostStatus.DRAFT;
    const nextPublishedAt =
      nextStatus === BlogPostStatus.PUBLISHED ? existing.publishedAt ?? new Date() : null;

    const updated = await prisma.blogPost.update({
      where: { id },
      data: {
        title: body.data.title,
        slug: nextSlug,
        content: body.data.contentMarkdown,
        status: nextStatus,
        publishedAt: nextPublishedAt,
      },
      select: {
        id: true,
        title: true,
        slug: true,
        content: true,
        imageUrl: true,
        status: true,
        publishedAt: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return reply.send(ok(updated));
  });

  // PATCH /api/blogs/:id/publish (toggle publish state)
  fastify.patch('/blogs/:id/publish', { preHandler: [requireAdmin] }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const { publish } = (request.body ?? {}) as { publish?: boolean };

    const existing = await prisma.blogPost.findUnique({ where: { id } });
    if (!existing) return reply.status(404).send(fail('NOT_FOUND', 'Post not found'));

    const nextStatus = publish ? BlogPostStatus.PUBLISHED : BlogPostStatus.DRAFT;
    const nextPublishedAt = publish ? new Date() : null;

    const updated = await prisma.blogPost.update({
      where: { id },
      data: {
        status: nextStatus,
        publishedAt: nextPublishedAt,
      },
      select: {
        id: true,
        title: true,
        slug: true,
        content: true,
        imageUrl: true,
        status: true,
        publishedAt: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return reply.send(ok(updated));
  });

  // POST /api/blogs/generate (admin)
  fastify.post('/blogs/generate', { preHandler: [requireAdmin] }, async (request, reply) => {
    const body = GenerateSchema.safeParse(request.body ?? {});
    if (!body.success) {
      return reply.status(400).send(fail('VALIDATION_ERROR', 'Invalid body', body.error.flatten() as any));
    }

    try {
      const mode = body.data.mode ?? 'auto';
      const aiOut = await generateBlogDraft({
        mode,
        topic: body.data.topic,
        customContent: body.data.customContent,
        systemPromptOverride: body.data.systemPromptOverride,
      });
      const imageUrl = await fetchUnsplashImageUrl(aiOut.imageSearchTerm).catch(() => null);
      const baseSlug = slugify(aiOut.title);
      const slug = await generateUniqueSlug(baseSlug);

      const created = await prisma.blogPost.create({
        data: {
          title: aiOut.title,
          slug,
          content: aiOut.contentMarkdown,
          imageUrl,
          status: BlogPostStatus.DRAFT,
          authorId: request.user?.id,
        },
        select: {
          id: true,
          title: true,
          slug: true,
          content: true,
          imageUrl: true,
          status: true,
          publishedAt: true,
          createdAt: true,
          updatedAt: true,
        },
      });

      return reply.send(ok(created));
    } catch (err) {
      request.log.error({ err }, 'AI blog generation failed');
      return reply.status(502).send(fail('AI_ERROR', err instanceof Error ? err.message : 'AI generation failed'));
    }
  });

  // POST /api/blogs/:id/regenerate (admin)
  fastify.post('/blogs/:id/regenerate', { preHandler: [requireAdmin] }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const body = GenerateSchema.safeParse(request.body ?? {});
    if (!body.success) {
      return reply.status(400).send(fail('VALIDATION_ERROR', 'Invalid body', body.error.flatten() as any));
    }

    const existing = await prisma.blogPost.findUnique({ where: { id } });
    if (!existing) return reply.status(404).send(fail('NOT_FOUND', 'Post not found'));

    try {
      const mode = body.data.mode ?? 'auto';
      // For regenerate, reuse the same generator but default to a topic-based rewrite when unspecified.
      const aiOut = await generateBlogDraft({
        mode: mode === 'custom' ? 'custom' : 'topic',
        topic: body.data.topic ?? existing.title,
        customContent: body.data.customContent ?? existing.content,
      });
      const imageUrl = await fetchUnsplashImageUrl(aiOut.imageSearchTerm).catch(() => null);
      const baseSlug = slugify(aiOut.title);
      const slug = await generateUniqueSlug(baseSlug, existing.id);

      const updated = await prisma.blogPost.update({
        where: { id: existing.id },
        data: {
          title: aiOut.title,
          slug,
          content: aiOut.contentMarkdown,
          imageUrl,
          status: BlogPostStatus.DRAFT,
          publishedAt: null,
        },
        select: {
          id: true,
          title: true,
          slug: true,
          content: true,
          imageUrl: true,
          status: true,
          publishedAt: true,
          createdAt: true,
          updatedAt: true,
        },
      });

      return reply.send(ok(updated));
    } catch (err) {
      request.log.error({ err }, 'AI blog regeneration failed');
      return reply.status(502).send(fail('AI_ERROR', err instanceof Error ? err.message : 'AI regeneration failed'));
    }
  });

  // POST /api/blogs/:id/image/regenerate (admin)
  fastify.post('/blogs/:id/image/regenerate', { preHandler: [requireAdmin] }, async (request, reply) => {
    const { id } = request.params as { id: string };

    const existing = await prisma.blogPost.findUnique({
      where: { id },
      select: {
        id: true,
        title: true,
        content: true,
        imageUrl: true,
        status: true,
        publishedAt: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!existing) {
      return reply.status(404).send(fail('NOT_FOUND', 'Post not found'));
    }

    const searchTerm = `${existing.title} email productivity inbox zero blog hero`;
    const imageUrl = await fetchUnsplashImageUrl(searchTerm).catch(() => null);

    if (!imageUrl) {
      return reply.status(502).send(fail('UNSPLASH_ERROR', 'Failed to fetch image from Unsplash'));
    }

    const updated = await prisma.blogPost.update({
      where: { id: existing.id },
      data: { imageUrl },
      select: {
        id: true,
        title: true,
        slug: true,
        content: true,
        imageUrl: true,
        status: true,
        publishedAt: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return reply.send(ok(updated));
  });

  // POST /api/blogs/:id/image/upload (admin, JSON base64 data URL)
  fastify.post('/blogs/:id/image/upload', { preHandler: [requireAdmin] }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const body = (request.body ?? {}) as { dataUrl?: string };

    if (!body.dataUrl || typeof body.dataUrl !== 'string') {
      return reply.status(400).send(fail('VALIDATION_ERROR', 'dataUrl is required'));
    }

    const dataUrl = body.dataUrl;
    const match = /^data:(image\/(png|jpeg|webp));base64,[a-zA-Z0-9+/=]+$/.exec(dataUrl);
    if (!match) {
      return reply
        .status(400)
        .send(fail('VALIDATION_ERROR', 'dataUrl must be a valid base64 PNG, JPEG, or WEBP image data URI'));
    }

    const existing = await prisma.blogPost.findUnique({
      where: { id },
      select: { id: true },
    });

    if (!existing) {
      return reply.status(404).send(fail('NOT_FOUND', 'Post not found'));
    }

    const updated = await prisma.blogPost.update({
      where: { id: existing.id },
      data: { imageUrl: dataUrl },
      select: {
        id: true,
        title: true,
        slug: true,
        content: true,
        imageUrl: true,
        status: true,
        publishedAt: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return reply.send(ok(updated));
  });
}