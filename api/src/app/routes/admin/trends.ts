/**
 * Admin routes for trend-driven blog: keywords, sources, SEO gaps, internal links, content refresh.
 */

import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { PrismaClient } from '@prisma/client';
import { TrendDiscoveryService } from '../../../services/trend-discovery.service';
import { TrendSourceManager } from '../../../services/trend-source-manager';
import { SEOIntelligenceService } from '../../../services/seo-intelligence.service';
import { getAIService } from '../../../services/ai';

const prisma = new PrismaClient();
const ai = getAIService();

let fastifyRef: FastifyInstance;

async function requireAdmin(request: FastifyRequest, reply: FastifyReply) {
  await fastifyRef.authenticate(request, reply);
}

export default async function (instance: FastifyInstance) {
  fastifyRef = instance;

  // GET /admin/keywords – view active keywords with performance
  fastifyRef.get('/admin/keywords', { preHandler: [requireAdmin] }, async () => {
    const keywords = await prisma.trendKeyword.findMany({
      where: { isActive: true },
      orderBy: [{ relevanceScore: 'desc' }, { usageCount: 'desc' }],
    });
    const total = await prisma.trendKeyword.count({ where: { isActive: true } });
    return { total, keywords };
  });

  // POST /admin/keywords/refresh – manually trigger keyword discovery
  fastifyRef.post('/admin/keywords/refresh', { preHandler: [requireAdmin] }, async (request, reply) => {
    try {
      const discovery = new TrendDiscoveryService(prisma, ai);
      const result = await discovery.runDiscovery();
      return { success: true, ...result };
    } catch (e) {
      request.log.error(e);
      return reply.status(500).send({
        error: 'Keyword refresh failed',
        message: e instanceof Error ? e.message : String(e),
      });
    }
  });

  // GET /admin/sources – view all trend sources
  fastifyRef.get('/admin/sources', { preHandler: [requireAdmin] }, async () => {
    const sources = await prisma.trendSource.findMany({
      orderBy: [{ priority: 'desc' }, { name: 'asc' }],
    });
    return { sources };
  });

  // POST /admin/sources – add new source
  fastifyRef.post('/admin/sources', { preHandler: [requireAdmin] }, async (request, reply) => {
    const body = request.body as { name: string; type: string; url: string; isActive?: boolean; priority?: number };
    if (!body.name || !body.type || !body.url) {
      return reply.status(400).send({ error: 'name, type, and url are required' });
    }
    const manager = new TrendSourceManager(prisma);
    const { id } = await manager.addSource({
      name: body.name,
      type: body.type as 'rss' | 'api' | 'social',
      url: body.url,
      isActive: body.isActive ?? true,
      priority: body.priority ?? 0,
    });
    return { success: true, id };
  });

  // PATCH /admin/sources/:id – update source (e.g. activate/deactivate)
  fastifyRef.patch('/admin/sources/:id', { preHandler: [requireAdmin] }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const body = request.body as { isActive?: boolean; priority?: number; name?: string; url?: string };
    const manager = new TrendSourceManager(prisma);
    try {
      await manager.updateSource(id, body);
      return { success: true };
    } catch (e) {
      return reply.status(404).send({ error: 'Source not found' });
    }
  });

  // GET /admin/seo/gaps – content gap opportunities
  fastifyRef.get('/admin/seo/gaps', { preHandler: [requireAdmin] }, async (request) => {
    const limit = parseInt((request.query as { limit?: string }).limit ?? '20', 10);
    const seo = new SEOIntelligenceService(prisma, ai);
    const gaps = await seo.getContentGaps(limit);
    return { gaps };
  });

  // GET /admin/seo/internal-links/:postId – link suggestions for a post
  fastifyRef.get('/admin/seo/internal-links/:postId', { preHandler: [requireAdmin] }, async (request, reply) => {
    const { postId } = request.params as { postId: string };
    const seo = new SEOIntelligenceService(prisma, ai);
    const suggestions = await seo.getInternalLinkSuggestions(postId, 10);
    return { suggestions };
  });

  // POST /admin/posts/:id/refresh – refresh stale content
  fastifyRef.post('/admin/posts/:id/refresh', { preHandler: [requireAdmin] }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const seo = new SEOIntelligenceService(prisma, ai);
    const result = await seo.refreshPost(id);
    if (!result.success) return reply.status(400).send({ error: result.error });
    return result;
  });

  // POST /admin/seed-trend-foundation – seed initial keywords and sources (idempotent)
  fastifyRef.post('/admin/seed-trend-foundation', { preHandler: [requireAdmin] }, async () => {
    const defaultKeywords = [
      'email productivity',
      'email management',
      'inbox zero',
      'email automation',
      'time management',
      'executive productivity',
      'business communication',
      'workflow efficiency',
    ];
    const defaultSources = [
      { name: 'Google News (email productivity)', type: 'rss', url: 'https://news.google.com/rss/search?q=email+productivity+tips+OR+inbox+zero+strategies&hl=en-US&gl=US&ceid=US:en', priority: 10 },
      { name: 'Google News (executive time management)', type: 'rss', url: 'https://news.google.com/rss/search?q=executive+time+management+OR+business+communication+efficiency&hl=en-US&gl=US&ceid=US:en', priority: 10 },
      { name: 'Lifehacker', type: 'rss', url: 'https://lifehacker.com/rss', priority: 5 },
    ];
    let keywordsCreated = 0;
    let sourcesCreated = 0;
    for (const kw of defaultKeywords) {
      try {
        await prisma.trendKeyword.upsert({
          where: { keyword: kw },
          create: { keyword: kw, relevanceScore: 0.8, isActive: true, discoverySource: 'seed' },
          update: {},
        });
        keywordsCreated++;
      } catch {
        // already exists
      }
    }
    for (const s of defaultSources) {
      const existing = await prisma.trendSource.findFirst({ where: { url: s.url } });
      if (!existing) {
        await prisma.trendSource.create({ data: s });
        sourcesCreated++;
      }
    }
    return { success: true, keywordsCreated, sourcesCreated };
  });

  // GET /admin/dashboard/seo-metrics – overall SEO dashboard
  fastifyRef.get('/admin/dashboard/seo-metrics', { preHandler: [requireAdmin] }, async () => {
    const [keywordCount, sourceCount, publishedCount, avgMetaScore, linksCount] = await Promise.all([
      prisma.trendKeyword.count({ where: { isActive: true } }),
      prisma.trendSource.count({ where: { isActive: true } }),
      prisma.blogPost.count({ where: { status: 'PUBLISHED' } }),
      prisma.blogPost.aggregate({
        where: { status: 'PUBLISHED', metaScore: { not: null } },
        _avg: { metaScore: true },
      }),
      prisma.internalLink.count(),
    ]);
    return {
      activeKeywords: keywordCount,
      activeSources: sourceCount,
      publishedPosts: publishedCount,
      avgMetaScore: avgMetaScore._avg.metaScore ?? null,
      internalLinksCount: linksCount,
    };
  });
}
