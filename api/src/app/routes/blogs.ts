import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { PrismaClient, BlogPostStatus, BlogTopicStatus } from '@prisma/client';
import { getAIService } from '../../services/ai';
import { TrendService } from '../../services/trend.service';
import { SEOIntelligenceService } from '../../services/seo-intelligence.service';
import { z } from 'zod';

const prisma = new PrismaClient();
const ai = getAIService();

// Validation schemas
const GenerateBlogSchema = z.object({
  topicId: z.string().optional(), // Generate from an approved topic
  topic: z.string().min(1).max(500).optional(), // Or provide a custom topic
}).refine(data => data.topicId || data.topic, {
  message: 'Either topicId or topic must be provided'
});

const BlogDataSchema = z.object({
  title: z.string().min(1).max(200),
  slug: z.string().min(1).max(100).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  content: z.string().min(100),
  seoTitle: z.string().max(60).optional(),
  seoDescription: z.string().max(160).optional(),
  primaryKeyword: z.string().optional(),
  keywords: z.array(z.string()).optional(),
  faqSection: z.string().optional(),
  metaScore: z.number().min(0).max(100).optional(),
});

// Reference to fastify instance for the requireAdmin hook
let fastify: FastifyInstance;

// Admin-only authentication hook
async function requireAdmin(request: FastifyRequest, reply: FastifyReply) {
  await fastify.authenticate(request, reply);
  
  // Optional: Add role-based check here if you have admin roles
  // if (!request.user || request.user.role !== 'admin') {
  //   return reply.status(403).send({ error: 'Forbidden: Admin access required' });
  // }
}

// Helper: Generate unique slug with collision handling
async function generateUniqueSlug(baseSlug: string): Promise<string> {
  let slug = baseSlug;
  let counter = 1;
  
  while (await prisma.blogPost.findUnique({ where: { slug } })) {
    slug = `${baseSlug}-${counter}`;
    counter++;
    if (counter > 100) {
      throw new Error('Unable to generate unique slug after 100 attempts');
    }
  }
  
  return slug;
}

export default async function (instance: FastifyInstance) {
  fastify = instance;

  // 1. Generate Blog Post from Topic (Protected - Admin only)
  fastify.post('/admin/generate-blog', { preHandler: [requireAdmin] }, async (request, reply) => {
    // Validate input
    const parseResult = GenerateBlogSchema.safeParse(request.body);
    if (!parseResult.success) {
      return reply.status(400).send({ 
        error: 'Validation failed', 
        details: parseResult.error.flatten() 
      });
    }
    
    const { topicId, topic: customTopic } = parseResult.data;
    let topicText: string;
    let sourceTopic: { id: string } | null = null;
    let topicMeta: { primaryKeyword?: string; keywords?: string[]; clusterName?: string } = {};

    if (topicId) {
      const dbTopic = await prisma.blogTopic.findUnique({ where: { id: topicId } });
      if (!dbTopic) {
        return reply.status(404).send({ error: 'Topic not found' });
      }
      if (dbTopic.status !== BlogTopicStatus.APPROVED) {
        return reply.status(400).send({ error: 'Topic must be approved before generating' });
      }
      topicText = `${dbTopic.title}. Angle: ${dbTopic.angle || 'General coverage'}`;
      sourceTopic = { id: dbTopic.id };
      if (dbTopic.keywords?.length) topicMeta.keywords = dbTopic.keywords;
      if (dbTopic.clusterName) topicMeta.clusterName = dbTopic.clusterName;
    } else {
      topicText = customTopic!;
    }

    const keywordContext =
      topicMeta.primaryKeyword || topicMeta.keywords?.length
        ? ` Target keyword: ${topicMeta.primaryKeyword ?? topicMeta.keywords?.[0] ?? ''}. Related keywords: ${(topicMeta.keywords ?? []).join(', ')}.`
        : '';
    const clusterContext = topicMeta.clusterName ? ` Content cluster: ${topicMeta.clusterName}.` : '';

    const systemPrompt = `
      You are an expert SEO Content Writer for "Inbox0", an AI-powered email management app.
      Write a comprehensive, engaging blog post about the given topic.${keywordContext}${clusterContext}
      
      Return the response in JSON format with:
      - title: Compelling headline (max 100 chars)
      - slug: URL-friendly kebab-case (max 60 chars, lowercase letters, numbers, hyphens only)
      - content: Full article in Markdown with H2/H3, bullet points, actionable tips. Include a short "FAQ" or "Frequently Asked Questions" section at the end with 2-3 Q&A pairs when relevant.
      - seoTitle: Meta title optimized for Google (max 60 chars)
      - seoDescription: Meta description with call-to-action (max 160 chars)
      - primaryKeyword: (optional) main target keyword
      - keywords: (optional) array of 3-5 related keywords
      - metaScore: (optional) self-assessed SEO score 0-100
    `;

    try {
      const completion = await ai.chatCompletion({
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: `Topic: ${topicText}` }
        ],
        response_format: { type: 'json_object' }
      });

      const content = completion.choices[0].message.content;
      if (!content) {
        return reply.status(502).send({ error: 'No content returned from OpenAI' });
      }
      
      // Parse and validate OpenAI response
      let blogData: z.infer<typeof BlogDataSchema>;
      try {
        const parsed = JSON.parse(content);
        const validation = BlogDataSchema.safeParse(parsed);
        if (!validation.success) {
          console.error('OpenAI returned invalid blog data:', validation.error);
          return reply.status(502).send({ 
            error: 'OpenAI returned invalid data structure',
            details: validation.error.flatten()
          });
        }
        blogData = validation.data;
      } catch (parseError) {
        console.error('Failed to parse OpenAI response:', parseError);
        return reply.status(502).send({ error: 'Failed to parse OpenAI response as JSON' });
      }

      const uniqueSlug = await generateUniqueSlug(blogData.slug);
      const wordCount = blogData.content.split(/\s+/).filter(Boolean).length;
      const readingTime = Math.max(1, Math.ceil(wordCount / 200));

      const post = await prisma.$transaction(async (tx) => {
        const newPost = await tx.blogPost.create({
          data: {
            title: blogData.title,
            slug: uniqueSlug,
            content: blogData.content,
            seoTitle: blogData.seoTitle,
            seoDesc: blogData.seoDescription,
            status: BlogPostStatus.DRAFT,
            authorId: request.user?.id,
            topicId: sourceTopic?.id,
            primaryKeyword: blogData.primaryKeyword ?? topicMeta.primaryKeyword ?? undefined,
            keywords: blogData.keywords ?? topicMeta.keywords ?? [],
            clusterName: topicMeta.clusterName ?? undefined,
            wordCount,
            readingTime,
            metaScore: blogData.metaScore ?? undefined,
          }
        });
        if (sourceTopic) {
          await tx.blogTopic.update({
            where: { id: sourceTopic.id },
            data: { status: BlogTopicStatus.GENERATED }
          });
        }
        return newPost;
      });

      if (process.env['ENABLE_AUTO_INTERNAL_LINKING'] === 'true') {
        try {
          const seo = new SEOIntelligenceService(prisma, ai);
          const suggestions = await seo.getInternalLinkSuggestions(post.id, 5);
          await seo.applyInternalLinks(post.id, suggestions);
        } catch (linkErr) {
          console.warn('Internal linking failed (non-fatal):', linkErr);
        }
      }

      return post;
      
    } catch (error) {
      console.error('Blog generation failed:', error);
      if (error instanceof Error && error.message.includes('timeout')) {
        return reply.status(504).send({ error: 'OpenAI request timed out. Please try again.' });
      }
      throw error;
    }
  });

  // 2. Get All Published Posts (For the Blog Index page - Public)
  fastify.get('/blogs', async () => {
    return prisma.blogPost.findMany({ 
      where: { status: BlogPostStatus.PUBLISHED },
      orderBy: { publishedAt: 'desc' },
      select: {
        id: true,
        title: true,
        slug: true,
        seoTitle: true,
        seoDesc: true,
        publishedAt: true,
        createdAt: true,
      }
    });
  });

  // 3. Get Single Post (For the Article page - Public)
  fastify.get('/blogs/:slug', async (req, reply) => {
    const { slug } = req.params as { slug: string };
    const post = await prisma.blogPost.findUnique({ 
      where: { slug },
      select: {
        id: true,
        title: true,
        slug: true,
        content: true,
        seoTitle: true,
        seoDesc: true,
        status: true,
        publishedAt: true,
        createdAt: true,
        updatedAt: true,
      }
    });
    
    if (!post) {
      return reply.status(404).send({ error: 'Post not found' });
    }
    
    // Only return published posts to public
    if (post.status !== BlogPostStatus.PUBLISHED) {
      return reply.status(404).send({ error: 'Post not found' });
    }
    
    return post;
  });

  // 4. Get All Posts for Admin (Protected - includes drafts)
  fastify.get('/admin/posts', { preHandler: [requireAdmin] }, async (request) => {
    const { status } = request.query as { status?: string };
    
    return prisma.blogPost.findMany({
      where: status ? { status: status as BlogPostStatus } : undefined,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        title: true,
        slug: true,
        status: true,
        seoTitle: true,
        seoDesc: true,
        publishedAt: true,
        createdAt: true,
        updatedAt: true,
      }
    });
  });

  // 5. Scout Trends - Find new blog topics (Protected - Admin only)
  fastify.get('/admin/scout-trends', { preHandler: [requireAdmin] }, async (request, reply) => {
    const trendService = new TrendService(ai, prisma);

    try {
      const ideas = await trendService.findNewTopics();
      
      if (ideas.relevant_stories.length === 0) {
        return { success: true, count: 0, message: 'No relevant stories found' };
      }

      // Use transaction with upsert for deduplication
      const results = await prisma.$transaction(async (tx) => {
        const created: string[] = [];
        const skipped: string[] = [];
        
        for (const idea of ideas.relevant_stories) {
          // Skip if we already have this source URL
          if (idea.source_url) {
            const existing = await tx.blogTopic.findUnique({
              where: { sourceUrl: idea.source_url }
            });
            if (existing) {
              skipped.push(idea.blog_idea_title);
              continue;
            }
          }
          
          await tx.blogTopic.create({
            data: {
              title: idea.blog_idea_title,
              angle: idea.angle,
              sourceUrl: idea.source_url,
              sourceHeadline: idea.original_headline,
              status: BlogTopicStatus.PENDING,
            }
          });
          created.push(idea.blog_idea_title);
        }
        
        return { created, skipped };
      });

      return { 
        success: true, 
        created: results.created.length,
        skipped: results.skipped.length,
        topics: results.created 
      };
      
    } catch (error) {
      console.error('Trend scouting failed:', error);
      
      // Check if it's an OpenAI quota/billing error
      const isOpenAIError = error && typeof error === 'object' && 'code' in error;
      const isQuotaError = isOpenAIError && (error.code === 'insufficient_quota' || error.code === 'invalid_api_key');
      
      if (isQuotaError) {
        return reply.status(500).send({ 
          error: 'OpenAI API error',
          message: error instanceof Error ? error.message : 'OpenAI API quota exceeded or invalid API key. Please check your OpenAI account billing and API key configuration.',
          details: 'RSS feeds were fetched successfully, but AI analysis failed. Check your OpenAI account at https://platform.openai.com/account/billing'
        });
      }
      
      return reply.status(500).send({ 
        error: 'Failed to scout trends',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // 5. List pending topics for admin review (Protected)
  fastify.get('/admin/topics', { preHandler: [requireAdmin] }, async (request) => {
    const { status } = request.query as { status?: string };
    
    return prisma.blogTopic.findMany({
      where: status ? { status: status as BlogTopicStatus } : undefined,
      orderBy: { createdAt: 'desc' },
    });
  });

  // 6. Approve/Reject a topic (Protected)
  fastify.patch('/admin/topics/:id', { preHandler: [requireAdmin] }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const { status, rejectedReason } = request.body as { 
      status: 'APPROVED' | 'REJECTED'; 
      rejectedReason?: string 
    };
    
    if (!['APPROVED', 'REJECTED'].includes(status)) {
      return reply.status(400).send({ error: 'Status must be APPROVED or REJECTED' });
    }
    
    const topic = await prisma.blogTopic.findUnique({ where: { id } });
    if (!topic) {
      return reply.status(404).send({ error: 'Topic not found' });
    }
    
    if (topic.status !== BlogTopicStatus.PENDING) {
      return reply.status(400).send({ error: 'Only pending topics can be approved/rejected' });
    }
    
    return prisma.blogTopic.update({
      where: { id },
      data: {
        status: status as BlogTopicStatus,
        approvedBy: status === 'APPROVED' ? request.user?.id : null,
        approvedAt: status === 'APPROVED' ? new Date() : null,
        rejectedReason: status === 'REJECTED' ? rejectedReason : null,
      }
    });
  });

  // 7. Publish/Unpublish a post (Protected)
  fastify.patch('/admin/posts/:id/publish', { preHandler: [requireAdmin] }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const { publish } = request.body as { publish: boolean };
    
    const post = await prisma.blogPost.findUnique({ where: { id } });
    if (!post) {
      return reply.status(404).send({ error: 'Post not found' });
    }
    
    return prisma.blogPost.update({
      where: { id },
      data: {
        status: publish ? BlogPostStatus.PUBLISHED : BlogPostStatus.DRAFT,
        publishedAt: publish ? new Date() : null,
      }
    });
  });

  // ============================================================
  // DEVELOPMENT TEST ENDPOINT - Remove in production!
  // ============================================================
  const isProduction = process.env['NODE_ENV'] === 'production';
  if (!isProduction) {
    /**
     * GET /dev/test-blog-flow
     * 
     * Tests the entire blog creation flow without authentication:
     * 1. Creates a test topic
     * 2. Approves it
     * 3. Generates a blog post via OpenAI
     * 4. Publishes it
     * 5. Returns the published post
     * 
     * Query params:
     * - topic: Custom topic (default: "5 AI Email Productivity Tips for 2024")
     * - skipOpenAI: If "true", creates a mock post without calling OpenAI
     */
    fastify.get('/dev/test-blog-flow', async (request, reply) => {
      const { topic: customTopic, skipOpenAI } = request.query as { 
        topic?: string; 
        skipOpenAI?: string 
      };
      
      const testTopic = customTopic || '5 AI Email Productivity Tips for 2024';
      const shouldSkipOpenAI = skipOpenAI === 'true';
      
      console.log('🧪 Starting blog flow test...');
      console.log(`   Topic: ${testTopic}`);
      console.log(`   Skip OpenAI: ${shouldSkipOpenAI}`);
      
      try {
        // Step 1: Create a test topic
        console.log('📝 Step 1: Creating test topic...');
        const topic = await prisma.blogTopic.create({
          data: {
            title: testTopic,
            angle: 'Showcase how Inbox0 implements these tips',
            sourceUrl: `https://test.example.com/${Date.now()}`, // Unique URL to avoid duplicates
            sourceHeadline: 'Test headline for development',
            status: BlogTopicStatus.PENDING,
          }
        });
        console.log(`   ✅ Topic created: ${topic.id}`);
        
        // Step 2: Approve the topic
        console.log('✅ Step 2: Approving topic...');
        const approvedTopic = await prisma.blogTopic.update({
          where: { id: topic.id },
          data: {
            status: BlogTopicStatus.APPROVED,
            approvedAt: new Date(),
          }
        });
        console.log(`   ✅ Topic approved`);
        
        // Step 3: Generate blog post
        console.log('🤖 Step 3: Generating blog post...');
        
        let blogData: {
          title: string;
          slug: string;
          content: string;
          seoTitle: string;
          seoDescription: string;
        };
        
        if (shouldSkipOpenAI) {
          // Mock data for faster testing without OpenAI
          blogData = {
            title: testTopic,
            slug: `test-${Date.now()}`,
            content: `# ${testTopic}\n\nThis is a test blog post generated for development testing.\n\n## Introduction\n\nLorem ipsum dolor sit amet, consectetur adipiscing elit.\n\n## Key Points\n\n- Point 1: Test content\n- Point 2: More test content\n- Point 3: Even more test content\n\n## Conclusion\n\nThis concludes our test post.`,
            seoTitle: testTopic.substring(0, 60),
            seoDescription: `Learn about ${testTopic}. Discover tips and strategies from Inbox0.`,
          };
          console.log('   ⏭️  Skipped OpenAI, using mock data');
        } else {
          // Call OpenAI for real content
          const systemPrompt = `
            You are an expert SEO Content Writer for "Inbox0", an AI-powered email management app.
            Write a comprehensive, engaging blog post about the given topic.
            
            Return the response in JSON format with:
            - title: Compelling headline (max 100 chars)
            - slug: URL-friendly kebab-case (max 60 chars, lowercase letters, numbers, hyphens only)
            - content: Full article in Markdown format with H2/H3 headers, bullet points, and actionable tips
            - seoTitle: Meta title optimized for Google (max 60 chars)
            - seoDescription: Meta description with call-to-action (max 160 chars)
          `;
          
          const completion = await ai.chatCompletion({
            messages: [
              { role: 'system', content: systemPrompt },
              { role: 'user', content: `Topic: ${approvedTopic.title}. Angle: ${approvedTopic.angle}` }
            ],
            response_format: { type: 'json_object' }
          });
          
          const content = completion.choices[0].message.content;
          if (!content) {
            throw new Error('No content returned from OpenAI');
          }
          
          blogData = JSON.parse(content);
          console.log('   ✅ OpenAI generated content');
        }
        
        // Generate unique slug
        const uniqueSlug = await generateUniqueSlug(blogData.slug);
        
        // Create the blog post
        const post = await prisma.$transaction(async (tx) => {
          const newPost = await tx.blogPost.create({
            data: {
              title: blogData.title,
              slug: uniqueSlug,
              content: blogData.content,
              seoTitle: blogData.seoTitle,
              seoDesc: blogData.seoDescription,
              status: BlogPostStatus.DRAFT,
              topicId: approvedTopic.id,
            }
          });
          
          await tx.blogTopic.update({
            where: { id: approvedTopic.id },
            data: { status: BlogTopicStatus.GENERATED }
          });
          
          return newPost;
        });
        console.log(`   ✅ Blog post created: ${post.id}`);
        
        // Step 4: Publish the post
        console.log('🚀 Step 4: Publishing post...');
        const publishedPost = await prisma.blogPost.update({
          where: { id: post.id },
          data: {
            status: BlogPostStatus.PUBLISHED,
            publishedAt: new Date(),
          }
        });
        console.log(`   ✅ Post published!`);
        
        // Return summary
        return {
          success: true,
          message: 'Blog flow test completed successfully!',
          steps: {
            topicCreated: topic.id,
            topicApproved: true,
            postGenerated: post.id,
            postPublished: true,
          },
          post: {
            id: publishedPost.id,
            title: publishedPost.title,
            slug: publishedPost.slug,
            url: `/blog/${publishedPost.slug}`,
            apiUrl: `/blogs/${publishedPost.slug}`,
          },
          cleanup: {
            note: 'To delete test data, run:',
            command: `curl -X DELETE http://localhost:3333/dev/cleanup-test/${publishedPost.id}`,
          }
        };
        
      } catch (error) {
        console.error('❌ Blog flow test failed:', error);
        return reply.status(500).send({
          success: false,
          error: 'Blog flow test failed',
          message: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    });

    // Cleanup endpoint for test data
    fastify.delete('/dev/cleanup-test/:postId', async (request, reply) => {
      const { postId } = request.params as { postId: string };
      
      try {
        const post = await prisma.blogPost.findUnique({
          where: { id: postId },
          include: { topic: true }
        });
        
        if (!post) {
          return reply.status(404).send({ error: 'Post not found' });
        }
        
        // Delete in correct order (post first, then topic)
        await prisma.blogPost.delete({ where: { id: postId } });
        
        if (post.topicId) {
          await prisma.blogTopic.delete({ where: { id: post.topicId } });
        }
        
        return { 
          success: true, 
          message: 'Test data cleaned up',
          deleted: {
            postId,
            topicId: post.topicId,
          }
        };
      } catch (error) {
        return reply.status(500).send({
          error: 'Cleanup failed',
          message: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    });

    // ============================================================
    // DEV ADMIN ENDPOINTS (No Auth) - For testing admin UI locally
    // ============================================================
    
    // Dev: List all topics (no auth)
    fastify.get('/dev/admin/topics', async (request) => {
      request.log.info({ url: request.url }, 'Blog route hit: GET /dev/admin/topics');
      const { status } = request.query as { status?: string };
      return prisma.blogTopic.findMany({
        where: status ? { status: status as BlogTopicStatus } : undefined,
        orderBy: { createdAt: 'desc' },
      });
    });

    // Dev: Approve/Reject topic (no auth)
    fastify.patch('/dev/admin/topics/:id', async (request, reply) => {
      const { id } = request.params as { id: string };
      const { status, rejectedReason } = request.body as { 
        status: 'APPROVED' | 'REJECTED'; 
        rejectedReason?: string 
      };
      
      if (!['APPROVED', 'REJECTED'].includes(status)) {
        return reply.status(400).send({ error: 'Status must be APPROVED or REJECTED' });
      }
      
      const topic = await prisma.blogTopic.findUnique({ where: { id } });
      if (!topic) {
        return reply.status(404).send({ error: 'Topic not found' });
      }
      
      if (topic.status !== BlogTopicStatus.PENDING) {
        return reply.status(400).send({ error: 'Only pending topics can be approved/rejected' });
      }
      
      return prisma.blogTopic.update({
        where: { id },
        data: {
          status: status as BlogTopicStatus,
          approvedAt: status === 'APPROVED' ? new Date() : null,
          rejectedReason: status === 'REJECTED' ? rejectedReason : null,
        }
      });
    });

    // Dev: List all posts (no auth)
    fastify.get('/dev/admin/posts', async (request) => {
      const { status } = request.query as { status?: string };
      return prisma.blogPost.findMany({
        where: status ? { status: status as BlogPostStatus } : undefined,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          title: true,
          slug: true,
          status: true,
          seoTitle: true,
          seoDesc: true,
          publishedAt: true,
          createdAt: true,
          updatedAt: true,
        }
      });
    });

    // Dev: Generate blog (no auth)
    fastify.post('/dev/admin/generate-blog', async (request, reply) => {
      const parseResult = GenerateBlogSchema.safeParse(request.body);
      if (!parseResult.success) {
        return reply.status(400).send({ 
          error: 'Validation failed', 
          details: parseResult.error.flatten() 
        });
      }
      
      const { topicId, topic: customTopic } = parseResult.data;
      let topicText: string;
      let sourceTopic: { id: string } | null = null;
      
      if (topicId) {
        const dbTopic = await prisma.blogTopic.findUnique({ where: { id: topicId } });
        if (!dbTopic) {
          return reply.status(404).send({ error: 'Topic not found' });
        }
        if (dbTopic.status !== BlogTopicStatus.APPROVED) {
          return reply.status(400).send({ error: 'Topic must be approved before generating' });
        }
        topicText = `${dbTopic.title}. Angle: ${dbTopic.angle || 'General coverage'}`;
        sourceTopic = { id: dbTopic.id };
      } else {
        topicText = customTopic!;
      }

      const systemPrompt = `
        You are an expert SEO Content Writer for "Inbox0", an AI-powered email management app.
        Write a comprehensive, engaging blog post about the given topic.
        
        Return the response in JSON format with:
        - title: Compelling headline (max 100 chars)
        - slug: URL-friendly kebab-case (max 60 chars, lowercase letters, numbers, hyphens only)
        - content: Full article in Markdown format with H2/H3 headers, bullet points, and actionable tips
        - seoTitle: Meta title optimized for Google (max 60 chars)
        - seoDescription: Meta description with call-to-action (max 160 chars)
      `;

      try {
        const completion = await ai.chatCompletion({
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: `Topic: ${topicText}` }
          ],
          response_format: { type: 'json_object' }
        });

        const content = completion.choices[0].message.content;
        if (!content) {
          return reply.status(502).send({ error: 'No content returned from OpenAI' });
        }
        
        let blogData: z.infer<typeof BlogDataSchema>;
        try {
          const parsed = JSON.parse(content);
          const validation = BlogDataSchema.safeParse(parsed);
          if (!validation.success) {
            return reply.status(502).send({ 
              error: 'OpenAI returned invalid data structure',
              details: validation.error.flatten()
            });
          }
          blogData = validation.data;
        } catch {
          return reply.status(502).send({ error: 'Failed to parse OpenAI response as JSON' });
        }

        const uniqueSlug = await generateUniqueSlug(blogData.slug);

        const post = await prisma.$transaction(async (tx) => {
          const newPost = await tx.blogPost.create({
            data: {
              title: blogData.title,
              slug: uniqueSlug,
              content: blogData.content,
              seoTitle: blogData.seoTitle,
              seoDesc: blogData.seoDescription,
              status: BlogPostStatus.DRAFT,
              topicId: sourceTopic?.id,
            }
          });
          
          if (sourceTopic) {
            await tx.blogTopic.update({
              where: { id: sourceTopic.id },
              data: { status: BlogTopicStatus.GENERATED }
            });
          }
          
          return newPost;
        });

        return post;
        
      } catch (error) {
        console.error('Blog generation failed:', error);
        throw error;
      }
    });

    // Dev: Scout trends (no auth) - with demo mode support
    fastify.get('/dev/admin/scout-trends', async (request, reply) => {
      const { demo } = request.query as { demo?: string };
      
      // Demo mode: Return realistic mock data instantly for presentations
      // Simulates RSS feed scraping + AI analysis for keywords: Email Productivity, OpenAI, Remote Work
      if (demo === 'true') {
        const mockTopics = [
          {
            blog_idea_title: 'How AI Email Assistants Are Revolutionizing Workplace Productivity',
            original_headline: 'New AI Tools Transform Business Communication - TechCrunch',
            angle: 'Showcase how Inbox0 compares to other AI email tools and what makes us unique',
            source_url: 'https://techcrunch.com/2024/ai-email-tools-productivity'
          },
          {
            blog_idea_title: 'OpenAI Releases New Email Automation Features: What It Means for Your Inbox',
            original_headline: 'OpenAI Expands Enterprise Email Solutions - Hacker News',
            angle: 'Compare OpenAI\'s approach to email automation with Inbox0\'s WhatsApp integration strategy',
            source_url: 'https://news.ycombinator.com/item?id=openai-email-features'
          },
          {
            blog_idea_title: 'Remote Work Email Overload: 5 Strategies That Actually Work',
            original_headline: 'Remote Workers Struggle with 40% More Email - Lifehacker',
            angle: 'Position Inbox0 as the solution for remote teams drowning in email',
            source_url: 'https://lifehacker.com/remote-work-email-overload-solutions'
          },
          {
            blog_idea_title: 'Email Productivity Tools: ChatGPT vs. Specialized AI Assistants',
            original_headline: 'ChatGPT for Email: Pros and Cons - Product Hunt',
            angle: 'Explain why specialized tools like Inbox0 outperform general AI for email management',
            source_url: 'https://www.producthunt.com/posts/chatgpt-email-assistant'
          },
          {
            blog_idea_title: 'The Future of Work: How AI Is Eliminating Email Overload',
            original_headline: 'AI Email Management Becomes Essential for Remote Teams',
            angle: 'Show how Inbox0 represents the next generation of email productivity tools',
            source_url: 'https://techcrunch.com/ai-email-management-future'
          }
        ];

        const results = await prisma.$transaction(async (tx) => {
          const created: string[] = [];
          const skipped: string[] = [];
          
          for (const idea of mockTopics) {
            // Check for duplicates
            if (idea.source_url) {
              const existing = await tx.blogTopic.findUnique({
                where: { sourceUrl: idea.source_url }
              });
              if (existing) {
                skipped.push(idea.blog_idea_title);
                continue;
              }
            }
            
            await tx.blogTopic.create({
              data: {
                title: idea.blog_idea_title,
                angle: idea.angle,
                sourceUrl: idea.source_url,
                sourceHeadline: idea.original_headline,
                status: BlogTopicStatus.PENDING,
              }
            });
            created.push(idea.blog_idea_title);
          }
          
          return { created, skipped };
        });

        return { 
          success: true, 
          created: results.created.length,
          skipped: results.skipped.length,
          topics: results.created,
          demo: true
        };
      }

      // Real mode: Use actual RSS feeds and OpenAI
      const trendService = new TrendService(ai, prisma);

      try {
        const ideas = await trendService.findNewTopics();
        
        if (ideas.relevant_stories.length === 0) {
          return { success: true, count: 0, message: 'No relevant stories found' };
        }

        const results = await prisma.$transaction(async (tx) => {
          const created: string[] = [];
          const skipped: string[] = [];
          
          for (const idea of ideas.relevant_stories) {
            if (idea.source_url) {
              const existing = await tx.blogTopic.findUnique({
                where: { sourceUrl: idea.source_url }
              });
              if (existing) {
                skipped.push(idea.blog_idea_title);
                continue;
              }
            }
            
            await tx.blogTopic.create({
              data: {
                title: idea.blog_idea_title,
                angle: idea.angle,
                sourceUrl: idea.source_url,
                sourceHeadline: idea.original_headline,
                status: BlogTopicStatus.PENDING,
              }
            });
            created.push(idea.blog_idea_title);
          }
          
          return { created, skipped };
        });

        return { 
          success: true, 
          created: results.created.length,
          skipped: results.skipped.length,
          topics: results.created 
        };
        
      } catch (error) {
        console.error('Trend scouting failed:', error);
        
        // Check if it's an OpenAI quota/billing error
        const isOpenAIError = error && typeof error === 'object' && 'code' in error;
        const isQuotaError = isOpenAIError && (error.code === 'insufficient_quota' || error.code === 'invalid_api_key');
        
        if (isQuotaError) {
          return reply.status(500).send({ 
            error: 'OpenAI API error',
            message: error instanceof Error ? error.message : 'OpenAI API quota exceeded or invalid API key. Please check your OpenAI account billing and API key configuration.',
            details: 'RSS feeds were fetched successfully, but AI analysis failed. Check your OpenAI account at https://platform.openai.com/account/billing'
          });
        }
        
        return reply.status(500).send({ 
          error: 'Failed to scout trends',
          message: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    });

    // Dev: Publish/Unpublish post (no auth)
    fastify.patch('/dev/admin/posts/:id/publish', async (request, reply) => {
      const { id } = request.params as { id: string };
      const { publish } = request.body as { publish: boolean };
      
      const post = await prisma.blogPost.findUnique({ where: { id } });
      if (!post) {
        return reply.status(404).send({ error: 'Post not found' });
      }
      
      return prisma.blogPost.update({
        where: { id },
        data: {
          status: publish ? BlogPostStatus.PUBLISHED : BlogPostStatus.DRAFT,
          publishedAt: publish ? new Date() : null,
        }
      });
    });

    // Seed demo data endpoint - Creates topics AND blog posts for demo
    fastify.post('/dev/admin/seed-demo', async (request, reply) => {
      try {
        // Create some pending topics for demo
        const demoTopics = [
          {
            title: 'How AI Email Assistants Are Revolutionizing Workplace Productivity',
            angle: 'Showcase how Inbox0 compares to other AI email tools and what makes us unique',
            sourceUrl: 'https://techcrunch.com/example-ai-email-tools',
            sourceHeadline: 'New AI Tools Transform Business Communication',
            status: BlogTopicStatus.PENDING,
          },
          {
            title: '5 Email Management Mistakes That Cost You 10 Hours Per Week',
            angle: 'Position Inbox0 as the solution to these common problems',
            sourceUrl: 'https://lifehacker.com/email-productivity-mistakes',
            sourceHeadline: 'Productivity Experts Reveal Common Email Mistakes',
            status: BlogTopicStatus.PENDING,
          },
          {
            title: 'Why WhatsApp Integration Is the Future of Business Communication',
            angle: 'Explain how Inbox0 bridges the gap between email and messaging',
            sourceUrl: 'https://news.ycombinator.com/item?id=example-whatsapp',
            sourceHeadline: 'Messaging Apps Replace Email for Internal Communication',
            status: BlogTopicStatus.PENDING,
          },
          {
            title: 'The Hidden Cost of Email Overload: Mental Health and Burnout',
            angle: 'Show how Inbox0 helps reduce stress and improve work-life balance',
            sourceUrl: 'https://example.com/email-burnout-study',
            sourceHeadline: 'Study Links Email Overload to Increased Stress Levels',
            status: BlogTopicStatus.PENDING,
          },
          {
            title: 'Automation vs. Personal Touch: Finding the Balance in Email Management',
            angle: 'Discuss how Inbox0 uses AI while maintaining human oversight',
            sourceUrl: 'https://example.com/automation-balance',
            sourceHeadline: 'Businesses Struggle with Automation in Communication',
            status: BlogTopicStatus.PENDING,
          },
        ];

        // Create some draft blog posts ready for review
        const demoPosts = [
          {
            title: '10 Email Productivity Hacks That Actually Work in 2024',
            slug: '10-email-productivity-hacks-2024',
            content: `# 10 Email Productivity Hacks That Actually Work in 2024

Email overload is a real problem. The average professional receives 120+ emails per day, and it's only getting worse. But there's hope! Here are 10 proven strategies that will help you reclaim your inbox.

## 1. Use the Two-Minute Rule

If an email takes less than two minutes to respond to, do it immediately. This prevents small tasks from piling up and becoming overwhelming.

## 2. Batch Process Your Emails

Instead of checking email constantly, set specific times during the day to process your inbox. Most people find success with three sessions: morning, after lunch, and end of day.

## 3. Unsubscribe Aggressively

Be ruthless with newsletters and promotional emails. If you haven't opened an email from a sender in 30 days, unsubscribe. Your future self will thank you.

## 4. Use Email Templates

Create templates for common responses. This saves time and ensures consistency in your communication.

## 5. Leverage AI Tools

Modern AI email assistants can help prioritize, summarize, and even draft responses. Tools like Inbox0 use AI to filter what matters and deliver summaries to WhatsApp.

## 6. Archive, Don't Delete

Use archiving instead of deleting. This way you can search for old emails without cluttering your inbox.

## 7. Set Clear Expectations

Use auto-responders to set expectations about response times. This reduces pressure and helps manage sender expectations.

## 8. Use Labels and Filters

Organize emails automatically with labels and filters. This helps you find important messages quickly.

## 9. Schedule Email Sending

Don't send emails immediately. Schedule them for business hours to respect recipients' time and improve response rates.

## 10. Review and Reflect Weekly

Spend 15 minutes each week reviewing your email habits. What's working? What needs improvement? Continuous optimization is key.

## Conclusion

Email productivity isn't about working harder—it's about working smarter. By implementing these strategies, you can reduce email stress and focus on what truly matters.

*Ready to take your email productivity to the next level? Try Inbox0 and see how AI can help you achieve inbox zero.*`,
            seoTitle: '10 Email Productivity Hacks for 2024 | Inbox0',
            seoDesc: 'Discover proven email productivity strategies that actually work. Learn how to manage your inbox efficiently and reduce email stress.',
            status: BlogPostStatus.DRAFT,
          },
          {
            title: 'How Remote Work Changed Email Forever (And What to Do About It)',
            slug: 'remote-work-email-changes',
            content: `# How Remote Work Changed Email Forever (And What to Do About It)

The shift to remote work didn't just change where we work—it fundamentally transformed how we communicate. Email volume exploded, boundaries blurred, and the 9-to-5 inbox became a 24/7 reality.

## The Remote Work Email Explosion

When teams went remote, email became the primary communication channel. Video calls replaced hallway conversations, and Slack messages became email threads. The result? A 40% increase in email volume for remote workers.

## The New Challenges

### 1. Always-On Culture

Without physical office boundaries, the expectation of immediate email responses grew. Many remote workers feel pressure to respond at all hours.

### 2. Context Switching

Remote work means more interruptions. Each email notification pulls you away from deep work, reducing overall productivity.

### 3. Information Overload

With fewer face-to-face interactions, everything becomes an email. Status updates, questions, and decisions all land in your inbox.

## Solutions for the Remote Era

### Set Clear Boundaries

Use email scheduling and auto-responders to communicate your availability. Just because you're working from home doesn't mean you're always available.

### Use AI to Filter Noise

AI email assistants can help prioritize what matters. Tools like Inbox0 analyze your emails and deliver only the important summaries to WhatsApp, reducing inbox noise.

### Batch Process

Designate specific times for email. Don't let notifications control your day. Batch processing helps maintain focus and reduces context switching.

### Create Communication Guidelines

Establish team norms around email. When should you email vs. message? What requires immediate response? Clear guidelines reduce unnecessary emails.

## The Future of Remote Email

As remote work becomes permanent, email management tools are evolving. AI-powered solutions that understand context, prioritize intelligently, and integrate with messaging platforms are becoming essential.

## Conclusion

Remote work changed email forever, but that doesn't mean you have to drown in your inbox. By setting boundaries, using smart tools, and establishing clear communication norms, you can thrive in the remote email era.

*Struggling with remote work email overload? Inbox0 uses AI to help you stay on top of what matters, no matter where you work.*`,
            seoTitle: 'Remote Work Email Management Guide | Inbox0',
            seoDesc: 'Learn how remote work changed email communication and discover strategies to manage your inbox effectively in the remote work era.',
            status: BlogPostStatus.DRAFT,
          },
          {
            title: 'OpenAI and the Future of Email: What GPT Means for Your Inbox',
            slug: 'openai-gpt-email-future',
            content: `# OpenAI and the Future of Email: What GPT Means for Your Inbox

The rise of OpenAI's GPT models has sparked a revolution in how we interact with technology. But what does this mean for your email inbox? The answer might surprise you.

## The AI Email Revolution

GPT and similar language models are transforming email from a manual task into an intelligent, automated system. Here's what's changing:

### Smart Summarization

AI can now read and summarize long email threads in seconds. No more scrolling through 50-reply chains to find the key decision.

### Intelligent Prioritization

AI understands context. It can identify urgent emails, flag important messages, and filter out noise based on your actual priorities, not just keywords.

### Automated Responses

GPT-powered tools can draft contextual responses that sound human. While you should always review, this dramatically speeds up email processing.

## Real-World Applications

### Inbox0: AI Email Management

Tools like Inbox0 leverage OpenAI's technology to analyze your emails and deliver smart summaries directly to WhatsApp. This means you can stay on top of important messages without constantly checking your inbox.

### Smart Filtering

AI can learn your communication patterns and automatically categorize emails. Important client emails? Flagged. Newsletter promotions? Filtered. Meeting requests? Organized.

### Context-Aware Assistance

Modern AI email tools understand relationships, deadlines, and priorities. They can surface relevant information from past emails and suggest actions.

## The Privacy Question

With AI reading your emails, privacy is a valid concern. Look for tools that:
- Process emails securely
- Don't store sensitive data
- Give you control over what AI sees
- Comply with GDPR and privacy regulations

## What This Means for You

The future of email isn't about more features—it's about intelligence. AI will handle the routine, so you can focus on what requires human judgment.

### Immediate Benefits

- Less time in your inbox
- Better prioritization
- Faster response times
- Reduced email stress

### Long-Term Impact

As AI improves, email will become more like a smart assistant than a task list. Your inbox will proactively help you, not just store messages.

## Getting Started

If you're ready to experience AI-powered email management:

1. **Start with Summarization**: Use AI to summarize long threads
2. **Enable Smart Filtering**: Let AI learn your priorities
3. **Try Integrated Solutions**: Tools like Inbox0 combine AI analysis with convenient delivery

## Conclusion

OpenAI's GPT models are just the beginning. The future of email is intelligent, automated, and designed to help you focus on what matters. The question isn't whether AI will change email—it's how quickly you'll adapt.

*Ready to experience the future of email? Inbox0 uses OpenAI technology to help you achieve inbox zero.*`,
            seoTitle: 'OpenAI GPT Email Revolution | Inbox0 Blog',
            seoDesc: 'Discover how OpenAI and GPT models are transforming email management. Learn about AI-powered inbox solutions and the future of email.',
            status: BlogPostStatus.DRAFT,
          },
        ];

        const created = await prisma.$transaction(async (tx) => {
          const topicResults = [];
          const postResults = [];
          
          // Create topics
          for (const topic of demoTopics) {
            if (topic.sourceUrl) {
              const existing = await tx.blogTopic.findUnique({
                where: { sourceUrl: topic.sourceUrl }
              });
              if (existing) continue;
            }
            
            const newTopic = await tx.blogTopic.create({ data: topic });
            topicResults.push(newTopic);
          }
          
          // Create blog posts
          for (const post of demoPosts) {
            // Check if slug already exists
            const existing = await tx.blogPost.findUnique({
              where: { slug: post.slug }
            });
            if (existing) continue;
            
            const newPost = await tx.blogPost.create({ data: post });
            postResults.push(newPost);
          }
          
          return { topics: topicResults, posts: postResults };
        });

        return {
          success: true,
          message: `Created ${created.topics.length} demo topics and ${created.posts.length} demo blog posts`,
          topics: created.topics.map(t => ({ id: t.id, title: t.title })),
          posts: created.posts.map(p => ({ id: p.id, title: p.title, slug: p.slug }))
        };
      } catch (error) {
        return reply.status(500).send({
          error: 'Failed to seed demo data',
          message: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    });

    console.log('⚠️  Development endpoints enabled:');
    console.log('   - /dev/test-blog-flow, /dev/cleanup-test/:postId');
    console.log('   - /dev/admin/topics, /dev/admin/posts, /dev/admin/scout-trends');
    console.log('   - /dev/admin/generate-blog, /dev/admin/posts/:id/publish');
    console.log('   - /dev/admin/seed-demo (creates demo topics + blog posts)');
  }
}