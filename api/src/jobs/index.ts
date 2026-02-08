/**
 * Cron job definitions and registration.
 * Trend/blog jobs use TrendService, TrendDiscoveryService, TrendSourceManager, SEOIntelligenceService.
 */

import cron, { type ScheduledTask } from 'node-cron';
import { PrismaClient } from '@prisma/client';
import type { FastifyInstance } from 'fastify';
import { getAIService } from '../services/ai';
import { TrendService } from '../services/trend.service';
import { TrendDiscoveryService } from '../services/trend-discovery.service';
import { TrendSourceManager } from '../services/trend-source-manager';
import { SEOIntelligenceService } from '../services/seo-intelligence.service';
import { BlogTopicStatus } from '@prisma/client';

const tasks: ScheduledTask[] = [];
const prisma = new PrismaClient();
const ai = getAIService();

async function runEmailSync(): Promise<void> {
  console.log('[Cron] runEmailSync (stub)');
}

async function runTrendScout(): Promise<void> {
  try {
    const trendService = new TrendService(ai, prisma);
    const result = await trendService.findNewTopics();
    if (result.relevant_stories.length === 0) {
      console.log('[Cron] runTrendScout: No relevant stories found');
      return;
    }
    for (const idea of result.relevant_stories) {
      const existing = idea.source_url
        ? await prisma.blogTopic.findUnique({ where: { sourceUrl: idea.source_url } })
        : null;
      if (existing) continue;
      await prisma.blogTopic.create({
        data: {
          title: idea.blog_idea_title,
          angle: idea.angle,
          sourceUrl: idea.source_url ?? undefined,
          sourceHeadline: idea.original_headline,
          status: BlogTopicStatus.PENDING,
        },
      });
    }
    console.log(`[Cron] runTrendScout complete: ${result.relevant_stories.length} topics found`);
  } catch (err) {
    console.error('[Cron] runTrendScout failed', err);
    throw err;
  }
}

async function runKeywordRefresh(): Promise<void> {
  try {
    console.log('[Cron] Starting keyword refresh...');
    const discovery = new TrendDiscoveryService(prisma, ai);
    const result = await discovery.runDiscovery();
    console.log(`[Cron] Keyword refresh complete: ${result.persisted} persisted, ${result.deactivated} deactivated`);
    if (result.errors.length) console.warn('[Cron] Keyword refresh errors:', result.errors);
  } catch (err) {
    console.error('[Cron] runKeywordRefresh failed', err);
    throw err;
  }
}

async function runSourceMonitoring(): Promise<void> {
  try {
    console.log('[Cron] Starting source monitoring...');
    const manager = new TrendSourceManager(prisma);
    const deactivated = await manager.deactivateUnderperformers(20, 0.1);
    console.log(`[Cron] Source monitoring complete: ${deactivated} underperforming sources deactivated`);
  } catch (err) {
    console.error('[Cron] runSourceMonitoring failed', err);
    throw err;
  }
}

async function runContentRefresh(): Promise<void> {
  if (process.env['ENABLE_CONTENT_REFRESH'] !== 'true') {
    console.log('[Cron] Content refresh skipped (ENABLE_CONTENT_REFRESH not set)');
    return;
  }
  try {
    console.log('[Cron] Starting content refresh...');
    const seo = new SEOIntelligenceService(prisma, ai);
    const stale = await seo.getStalePosts(2);
    for (const p of stale) {
      const r = await seo.refreshPost(p.id);
      console.log(`[Cron] Content refresh ${p.id}: ${r.success ? 'ok' : r.error}`);
    }
    console.log('[Cron] Content refresh complete');
  } catch (err) {
    console.error('[Cron] runContentRefresh failed', err);
    throw err;
  }
}

export function registerCronJobs(fastify: FastifyInstance): void {
  const trendTask = cron.schedule('0 */6 * * *', () => {
    runTrendScout().catch((err) => fastify.log.error(err, '[Cron] runTrendScout failed'));
  });
  tasks.push(trendTask);

  const emailTask = cron.schedule('0 6 * * *', () => {
    runEmailSync().catch((err) => fastify.log.error(err, '[Cron] runEmailSync failed'));
  });
  tasks.push(emailTask);

  const keywordTask = cron.schedule('0 2 * * *', () => {
    runKeywordRefresh().catch((err) => fastify.log.error(err, '[Cron] runKeywordRefresh failed'));
  });
  tasks.push(keywordTask);

  const sourceTask = cron.schedule('0 3 * * *', () => {
    runSourceMonitoring().catch((err) => fastify.log.error(err, '[Cron] runSourceMonitoring failed'));
  });
  tasks.push(sourceTask);

  const refreshTask = cron.schedule('0 3 * * 0', () => {
    runContentRefresh().catch((err) => fastify.log.error(err, '[Cron] runContentRefresh failed'));
  });
  tasks.push(refreshTask);

  fastify.log.info(
    'Cron jobs registered (trend: every 6h, email: daily 06:00, keyword refresh: daily 02:00, source monitor: daily 03:00, content refresh: Sun 03:00)'
  );
}

export function stopCronJobs(): void {
  for (const task of tasks) {
    task.stop();
  }
  tasks.length = 0;
}
