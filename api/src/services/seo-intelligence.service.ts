/**
 * SEO Intelligence Service – keyword difficulty, content gaps, internal linking, content refresh.
 */

import { BlogPostStatus, type PrismaClient } from '@prisma/client';
import type { AIService } from './ai/types';

const NEWS_API_KEY = process.env['NEWS_API_KEY'];

export interface ContentGapSuggestion {
  keyword: string;
  opportunity: 'high' | 'medium' | 'low';
  reason: string;
}

export interface InternalLinkSuggestion {
  toPostId: string;
  toSlug: string;
  toTitle: string;
  anchorText: string;
  linkType: string;
}

export interface RefreshResult {
  postId: string;
  success: boolean;
  wordCount?: number;
  metaScore?: number;
  error?: string;
}

export class SEOIntelligenceService {
  constructor(
    private prisma: PrismaClient,
    private ai: AIService
  ) {}

  /**
   * Estimate keyword difficulty (0.0-1.0) using NewsAPI article count as proxy for competition.
   */
  async estimateDifficulty(keyword: string): Promise<number> {
    if (!NEWS_API_KEY) return 0.5;
    try {
      const res = await fetch(
        `https://newsapi.org/v2/everything?q=${encodeURIComponent(keyword)}&language=en&pageSize=1&apiKey=${NEWS_API_KEY}`,
        { signal: AbortSignal.timeout(5000) }
      );
      if (!res.ok) return 0.5;
      const data = (await res.json()) as { totalResults?: number };
      const total = data.totalResults ?? 0;
      // Map to 0-1: few articles = easy (0.2), many = hard (0.9)
      if (total <= 10) return 0.2;
      if (total <= 100) return 0.4;
      if (total <= 1000) return 0.6;
      if (total <= 10000) return 0.8;
      return 0.95;
    } catch {
      return 0.5;
    }
  }

  /**
   * Get content gap opportunities: keywords we don't yet cover well (simplified: active keywords with no/few posts).
   */
  async getContentGaps(limit: number = 20): Promise<ContentGapSuggestion[]> {
    const keywords = await this.prisma.trendKeyword.findMany({
      where: { isActive: true },
      orderBy: { relevanceScore: 'desc' },
      take: limit * 2,
      select: { keyword: true, relevanceScore: true },
    });
    const suggestions: ContentGapSuggestion[] = [];
    for (const kw of keywords) {
      const postsWithKeyword = await this.prisma.blogPost.count({
        where: {
          status: BlogPostStatus.PUBLISHED,
          OR: [
            { primaryKeyword: { equals: kw.keyword, mode: 'insensitive' } },
            { keywords: { has: kw.keyword } },
          ],
        },
      });
      if (postsWithKeyword === 0) {
        suggestions.push({
          keyword: kw.keyword,
          opportunity: (kw.relevanceScore ?? 0) >= 0.8 ? 'high' : kw.relevanceScore >= 0.6 ? 'medium' : 'low',
          reason: 'No published post targets this keyword',
        });
      }
      if (suggestions.length >= limit) break;
    }
    return suggestions;
  }

  /**
   * Find related posts for a given post and suggest internal links (anchor text via AI).
   */
  async getInternalLinkSuggestions(postId: string, maxLinks: number = 5): Promise<InternalLinkSuggestion[]> {
    const post = await this.prisma.blogPost.findUnique({
      where: { id: postId },
      select: { id: true, title: true, content: true, primaryKeyword: true, keywords: true, clusterName: true },
    });
    if (!post) return [];

    const existingToIds = await this.prisma.internalLink.findMany({
      where: { fromPostId: postId },
      select: { toPostId: true },
    });
    const excludeIds = new Set([postId, ...existingToIds.map((l) => l.toPostId)]);

    const orConditions: Array<{ primaryKeyword?: { equals: string; mode: 'insensitive' }; clusterName?: string; keywords?: { hasSome: string[] } }> = [];
    if (post.primaryKeyword) orConditions.push({ primaryKeyword: { equals: post.primaryKeyword, mode: 'insensitive' } });
    if (post.clusterName) orConditions.push({ clusterName: post.clusterName });
    if (post.keywords?.length) orConditions.push({ keywords: { hasSome: post.keywords.slice(0, 3) } });

    const related = await this.prisma.blogPost.findMany({
      where: {
        status: BlogPostStatus.PUBLISHED,
        id: { notIn: [...excludeIds] },
        ...(orConditions.length > 0 ? { OR: orConditions } : {}),
      },
      orderBy: { publishedAt: 'desc' },
      take: maxLinks + 5,
      select: { id: true, title: true, slug: true },
    });

    if (related.length === 0) return [];

    const toSuggest = related.slice(0, maxLinks);
    const titles = toSuggest.map((p) => `${p.id}: ${p.title}`).join('\n');
    try {
      const result = await this.ai.chatCompletion({
        messages: [
          {
            role: 'user',
            content: `Our blog post is titled: "${post.title}". Suggest short, natural anchor text (2-6 words) for linking to each of these related posts. Return a JSON object mapping post id to anchor text, e.g. { "id1": "anchor one", "id2": "anchor two" }.\nRelated posts (id: title):\n${titles}`,
          },
        ],
        response_format: { type: 'json_object' },
      });
      const content = result.choices[0]?.message?.content;
      if (!content) return toSuggest.map((p) => ({ toPostId: p.id, toSlug: p.slug, toTitle: p.title, anchorText: p.title, linkType: 'related' }));
      const parsed = JSON.parse(content) as Record<string, string>;
      return toSuggest.map((p) => ({
        toPostId: p.id,
        toSlug: p.slug,
        toTitle: p.title,
        anchorText: parsed[p.id] ?? p.title,
        linkType: 'contextual',
      }));
    } catch {
      return toSuggest.map((p) => ({ toPostId: p.id, toSlug: p.slug, toTitle: p.title, anchorText: p.title, linkType: 'related' }));
    }
  }

  /**
   * Create internal link records from suggestions (only if ENABLE_AUTO_INTERNAL_LINKING is true).
   */
  async applyInternalLinks(fromPostId: string, suggestions: InternalLinkSuggestion[]): Promise<number> {
    if (process.env['ENABLE_AUTO_INTERNAL_LINKING'] !== 'true') return 0;
    let created = 0;
    for (const s of suggestions.slice(0, 5)) {
      try {
        await this.prisma.internalLink.upsert({
          where: {
            fromPostId_toPostId: { fromPostId, toPostId: s.toPostId },
          },
          create: {
            fromPostId,
            toPostId: s.toPostId,
            anchorText: s.anchorText,
            linkType: s.linkType,
          },
          update: { anchorText: s.anchorText, linkType: s.linkType },
        });
        created++;
      } catch {
        // skip duplicate or invalid
      }
    }
    return created;
  }

  /**
   * Refresh a single post: update content/statistics with AI, set lastRefreshedAt, wordCount, metaScore.
   */
  async refreshPost(postId: string): Promise<RefreshResult> {
    const post = await this.prisma.blogPost.findUnique({
      where: { id: postId },
      select: { id: true, title: true, content: true, slug: true },
    });
    if (!post) return { postId, success: false, error: 'Post not found' };

    try {
      const result = await this.ai.chatCompletion({
        messages: [
          {
            role: 'user',
            content: `Refresh and update this blog post. Keep the same structure and slug. Update statistics, tool names, and trends to current date. Return JSON: { "content": "full markdown content", "wordCount": number, "metaScore": number (0-100) }. Post title: ${post.title}\n\nCurrent content:\n${post.content.slice(0, 12000)}`,
          },
        ],
        response_format: { type: 'json_object' },
      });
      const raw = result.choices[0]?.message?.content;
      if (!raw) return { postId, success: false, error: 'No content from AI' };
      const parsed = JSON.parse(raw) as { content?: string; wordCount?: number; metaScore?: number };
      const content = parsed.content ?? post.content;
      const wordCount = typeof parsed.wordCount === 'number' ? parsed.wordCount : (content.split(/\s+/).length ?? 0);
      const metaScore = typeof parsed.metaScore === 'number' ? Math.min(100, Math.max(0, parsed.metaScore)) : null;

      await this.prisma.blogPost.update({
        where: { id: postId },
        data: {
          content,
          wordCount,
          metaScore: metaScore ?? undefined,
          lastRefreshedAt: new Date(),
        },
      });
      return { postId, success: true, wordCount, metaScore: metaScore ?? undefined };
    } catch (e) {
      return { postId, success: false, error: e instanceof Error ? e.message : String(e) };
    }
  }

  /**
   * Find stale posts (older than 6 months, not refreshed recently) for content refresh.
   */
  async getStalePosts(limit: number = 2): Promise<Array<{ id: string; title: string; slug: string }>> {
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
    const posts = await this.prisma.blogPost.findMany({
      where: {
        status: BlogPostStatus.PUBLISHED,
        publishedAt: { lt: sixMonthsAgo },
        OR: [{ lastRefreshedAt: null }, { lastRefreshedAt: { lt: sixMonthsAgo } }],
      },
      orderBy: { publishedAt: 'asc' },
      take: limit,
      select: { id: true, title: true, slug: true },
    });
    return posts;
  }
}
