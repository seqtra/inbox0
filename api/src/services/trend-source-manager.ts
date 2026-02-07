/**
 * Trend Source Manager – manages dynamic RSS/API sources and builds feed URLs from keywords.
 */

import type { PrismaClient } from '@prisma/client';

const GOOGLE_NEWS_RSS_BASE = 'https://news.google.com/rss/search';

export interface TrendSourceConfig {
  name: string;
  type: 'rss' | 'api' | 'social';
  url: string;
  isActive?: boolean;
  priority?: number;
}

export class TrendSourceManager {
  constructor(private prisma: PrismaClient) {}

  /**
   * Get all active sources ordered by priority.
   */
  async getActiveSources(): Promise<Array<{ id: string; name: string; type: string; url: string; priority: number }>> {
    const sources = await this.prisma.trendSource.findMany({
      where: { isActive: true },
      orderBy: { priority: 'desc' },
      select: { id: true, name: true, type: true, url: true, priority: true },
    });
    return sources;
  }

  /**
   * Build Google News RSS URLs for the top N active keywords.
   */
  async getGoogleNewsUrlsFromKeywords(limit: number = 10): Promise<string[]> {
    const keywords = await this.prisma.trendKeyword.findMany({
      where: { isActive: true },
      orderBy: { relevanceScore: 'desc' },
      take: limit,
      select: { keyword: true },
    });
    return keywords.map(
      (k) =>
        `${GOOGLE_NEWS_RSS_BASE}?q=${encodeURIComponent(k.keyword)}&hl=en-US&gl=US&ceid=US:en`
    );
  }

  /**
   * Get all URLs to fetch: static TrendSource URLs plus dynamic Google News from keywords.
   */
  async getFetchUrls(opts?: { includeDynamicGoogleNews?: boolean; dynamicKeywordLimit?: number }): Promise<string[]> {
    const includeDynamic = opts?.includeDynamicGoogleNews !== false;
    const limit = opts?.dynamicKeywordLimit ?? 10;

    const [sources, dynamicUrls] = await Promise.all([
      this.getActiveSources(),
      includeDynamic ? this.getGoogleNewsUrlsFromKeywords(limit) : Promise.resolve([]),
    ]);

    const fromDb = sources.map((s) => s.url);
    const combined = [...fromDb];
    for (const u of dynamicUrls) {
      if (!combined.includes(u)) combined.push(u);
    }
    return combined;
  }

  /**
   * Record that a source was used (articlesFound += count, optionally articlesUsed).
   */
  async recordSourceStats(sourceUrl: string, articlesFound: number, articlesUsed?: number): Promise<void> {
    const source = await this.prisma.trendSource.findFirst({
      where: { url: sourceUrl },
    });
    if (!source) return;
    await this.prisma.trendSource.update({
      where: { id: source.id },
      data: {
        articlesFound: { increment: articlesFound },
        ...(typeof articlesUsed === 'number' ? { articlesUsed: { increment: articlesUsed } } : {}),
      },
    });
  }

  /**
   * Add a new source.
   */
  async addSource(config: TrendSourceConfig): Promise<{ id: string }> {
    const created = await this.prisma.trendSource.create({
      data: {
        name: config.name,
        type: config.type,
        url: config.url,
        isActive: config.isActive ?? true,
        priority: config.priority ?? 0,
      },
    });
    return { id: created.id };
  }

  /**
   * Update source (e.g. activate/deactivate).
   */
  async updateSource(
    id: string,
    data: { isActive?: boolean; priority?: number; name?: string; url?: string }
  ): Promise<void> {
    await this.prisma.trendSource.update({
      where: { id },
      data,
    });
  }

  /**
   * Deactivate sources with success rate < 10% after at least 20 articles found.
   */
  async deactivateUnderperformers(thresholdArticles: number = 20, minSuccessRate: number = 0.1): Promise<number> {
    const sources = await this.prisma.trendSource.findMany({
      where: { isActive: true, articlesFound: { gte: thresholdArticles } },
    });
    let deactivated = 0;
    for (const s of sources) {
      const rate = s.articlesFound > 0 ? s.articlesUsed / s.articlesFound : 0;
      if (rate < minSuccessRate) {
        await this.prisma.trendSource.update({
          where: { id: s.id },
          data: { isActive: false },
        });
        deactivated++;
      }
    }
    return deactivated;
  }
}
