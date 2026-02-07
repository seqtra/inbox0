/**
 * Trend Discovery Service – discovers and scores keywords from multiple sources
 * (NewsAPI, Reddit, Hacker News, AI) and persists to TrendKeyword with relevance scoring.
 */

import type { PrismaClient } from '@prisma/client';
import type { AIService } from './ai/types';

const MIN_RELEVANCE_SCORE = parseFloat(process.env['MIN_KEYWORD_RELEVANCE_SCORE'] ?? '0.6');
const MAX_ACTIVE_KEYWORDS = parseInt(process.env['MAX_ACTIVE_KEYWORDS'] ?? '50', 10);
const NEWS_API_KEY = process.env['NEWS_API_KEY'];
const REDDIT_CLIENT_ID = process.env['REDDIT_CLIENT_ID'];
const REDDIT_CLIENT_SECRET = process.env['REDDIT_CLIENT_SECRET'];

export interface DiscoveredKeyword {
  keyword: string;
  discoverySource: string;
  rawScore?: number;
}

export interface TrendDiscoveryResult {
  discovered: number;
  scored: number;
  persisted: number;
  deactivated: number;
  errors: string[];
}

export class TrendDiscoveryService {
  constructor(
    private prisma: PrismaClient,
    private ai: AIService
  ) {}

  /**
   * Fetch keyword suggestions from NewsAPI (free tier: 100 req/day).
   */
  async fetchFromNewsApi(): Promise<DiscoveredKeyword[]> {
    if (!NEWS_API_KEY) return [];
    const queries = [
      'email productivity',
      'inbox zero',
      'email automation',
      'time management',
      'executive productivity',
    ];
    const results: DiscoveredKeyword[] = [];
    try {
      for (const q of queries.slice(0, 5)) {
        const res = await fetch(
          `https://newsapi.org/v2/everything?q=${encodeURIComponent(q)}&language=en&pageSize=10&apiKey=${NEWS_API_KEY}`,
          { signal: AbortSignal.timeout(10000) }
        );
        if (!res.ok) continue;
        const data = (await res.json()) as { articles?: Array<{ title?: string }> };
        const titles = (data.articles ?? []).map((a) => a.title).filter(Boolean) as string[];
        for (const title of titles) {
          const words = title.split(/\s+/).filter((w) => w.length > 4);
          for (const w of words.slice(0, 5)) {
            const cleaned = w.replace(/[^a-zA-Z0-9\s]/g, '').toLowerCase();
            if (cleaned.length >= 4) results.push({ keyword: cleaned, discoverySource: 'newsapi' });
          }
        }
      }
    } catch (e) {
      results.length = 0;
    }
    return results;
  }

  /**
   * Fetch trending terms from Reddit (high-engagement posts).
   */
  async fetchFromReddit(): Promise<DiscoveredKeyword[]> {
    if (!REDDIT_CLIENT_ID || !REDDIT_CLIENT_SECRET) return [];
    const results: DiscoveredKeyword[] = [];
    try {
      const authRes = await fetch('https://www.reddit.com/api/v1/access_token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          Authorization: `Basic ${Buffer.from(`${REDDIT_CLIENT_ID}:${REDDIT_CLIENT_SECRET}`).toString('base64')}`,
        },
        body: 'grant_type=client_credentials',
        signal: AbortSignal.timeout(8000),
      });
      if (!authRes.ok) return [];
      const auth = (await authRes.json()) as { access_token?: string };
      const token = auth.access_token;
      if (!token) return [];

      const subreddits = ['productivity', 'email', 'GetMotivated', 'entrepreneur'];
      for (const sub of subreddits) {
        const res = await fetch(`https://oauth.reddit.com/r/${sub}/hot?limit=25`, {
          headers: { Authorization: `Bearer ${token}` },
          signal: AbortSignal.timeout(8000),
        });
        if (!res.ok) continue;
        const data = (await res.json()) as { data?: { children?: Array<{ data?: { title?: string; ups?: number } }> } };
        const children = data.data?.children ?? [];
        for (const c of children) {
          const ups = c.data?.ups ?? 0;
          if (ups < 50) continue;
          const title = c.data?.title ?? '';
          const words = title.split(/\s+/).filter((w) => w.length > 3);
          for (const w of words.slice(0, 4)) {
            const cleaned = w.replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
            if (cleaned.length >= 4)
              results.push({ keyword: cleaned, discoverySource: 'reddit', rawScore: ups });
          }
        }
      }
    } catch {
      // ignore
    }
    return results;
  }

  /**
   * Fetch top stories from Hacker News and extract productivity/email-related terms.
   */
  async fetchFromHackerNews(): Promise<DiscoveredKeyword[]> {
    const results: DiscoveredKeyword[] = [];
    try {
      const topRes = await fetch('https://hacker-news.firebaseio.com/v0/topstories.json', {
        signal: AbortSignal.timeout(5000),
      });
      if (!topRes.ok) return [];
      const ids = (await topRes.json()) as number[];
      const slice = ids.slice(0, 30);
      for (const id of slice) {
        const itemRes = await fetch(`https://hacker-news.firebaseio.com/v0/item/${id}.json`, {
          signal: AbortSignal.timeout(3000),
        });
        if (!itemRes.ok) continue;
        const item = (await itemRes.json()) as { title?: string; score?: number };
        const title = (item?.title ?? '').toLowerCase();
        if (
          !title.includes('email') &&
          !title.includes('productivity') &&
          !title.includes('inbox') &&
          !title.includes('automation') &&
          !title.includes('management')
        )
          continue;
        const words = (item.title ?? '').split(/\s+/).filter((w) => w.length > 3);
        for (const w of words.slice(0, 5)) {
          const cleaned = w.replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
          if (cleaned.length >= 4)
            results.push({
              keyword: cleaned,
              discoverySource: 'hackernews',
              rawScore: item?.score ?? 0,
            });
        }
      }
    } catch {
      // ignore
    }
    return results;
  }

  /**
   * Ask Claude for emerging keywords in email productivity space.
   */
  async fetchFromAI(): Promise<DiscoveredKeyword[]> {
    try {
      const result = await this.ai.chatCompletion({
        messages: [
          {
            role: 'user',
            content: `You are a content strategist for "Inbox0", an AI-powered email and WhatsApp management app for executives.
List 15-20 emerging search keywords or phrases that busy professionals and executives might search for in 2025-2026 related to: email productivity, inbox management, email automation, time management, and business communication.
Return ONLY a JSON array of strings, e.g. ["keyword one", "keyword two"]. No other text.`,
          },
        ],
        response_format: { type: 'json_object' },
      });
      const content = result.choices[0]?.message?.content;
      if (!content) return [];
      const parsed = JSON.parse(content) as Record<string, unknown>;
      const arr = Array.isArray(parsed.keywords)
        ? parsed.keywords
        : Array.isArray(parsed)
          ? parsed
          : [];
      return (arr as string[]).map((k) => ({
        keyword: String(k).trim().toLowerCase(),
        discoverySource: 'ai',
      }));
    } catch {
      return [];
    }
  }

  /**
   * Score a batch of keywords for relevance to Inbox0 (0.0-1.0).
   */
  async scoreKeywords(keywords: string[]): Promise<Map<string, number>> {
    const map = new Map<string, number>();
    if (keywords.length === 0) return map;
    const unique = [...new Set(keywords)].slice(0, 80);
    try {
      const result = await this.ai.chatCompletion({
        messages: [
          {
            role: 'user',
            content: `Rate each keyword's relevance to "Inbox0" (an AI email + WhatsApp management app for executives). Score 0.0 (irrelevant) to 1.0 (highly relevant).
Return a JSON object mapping each keyword to a number, e.g. { "email productivity": 0.95, "crypto": 0.1 }.
Keywords to score (one per line):\n${unique.join('\n')}`,
          },
        ],
        response_format: { type: 'json_object' },
      });
      const content = result.choices[0]?.message?.content;
      if (!content) return map;
      const parsed = JSON.parse(content) as Record<string, number>;
      for (const [k, v] of Object.entries(parsed)) {
        const score = typeof v === 'number' ? v : parseFloat(String(v));
        if (!Number.isNaN(score)) map.set(k.trim().toLowerCase(), Math.max(0, Math.min(1, score)));
      }
    } catch {
      // leave map empty or partial
    }
    return map;
  }

  /**
   * Run full discovery: fetch all sources, consolidate, score, persist, deactivate underperformers.
   */
  async runDiscovery(): Promise<TrendDiscoveryResult> {
    const errors: string[] = [];
    const enableDynamic = process.env['ENABLE_DYNAMIC_KEYWORDS'] === 'true';

    // 1. Fetch from all sources in parallel
    const [news, reddit, hn, aiKw] = await Promise.allSettled([
      this.fetchFromNewsApi(),
      this.fetchFromReddit(),
      this.fetchFromHackerNews(),
      this.fetchFromAI(),
    ]);

    const allDiscovered: DiscoveredKeyword[] = [];
    if (news.status === 'fulfilled') allDiscovered.push(...news.value);
    else if (news.reason) errors.push(`NewsAPI: ${String(news.reason)}`);
    if (reddit.status === 'fulfilled') allDiscovered.push(...reddit.value);
    else if (reddit.reason) errors.push(`Reddit: ${String(reddit.reason)}`);
    if (hn.status === 'fulfilled') allDiscovered.push(...hn.value);
    else if (hn.reason) errors.push(`HN: ${String(hn.reason)}`);
    if (aiKw.status === 'fulfilled') allDiscovered.push(...aiKw.value);
    else if (aiKw.reason) errors.push(`AI: ${String(aiKw.reason)}`);

    // 2. Consolidate and deduplicate by keyword (keep first source)
    const byKeyword = new Map<string, DiscoveredKeyword>();
    for (const d of allDiscovered) {
      const k = d.keyword.trim().toLowerCase();
      if (k.length < 3) continue;
      if (!byKeyword.has(k)) byKeyword.set(k, d);
    }
    const toScore = [...byKeyword.keys()];

    // 3. AI scoring
    const scores = await this.scoreKeywords(toScore);

    // 4. Filter by MIN_RELEVANCE_SCORE
    const passing = toScore.filter((k) => (scores.get(k) ?? 0) >= MIN_RELEVANCE_SCORE);

    if (!enableDynamic) {
      return {
        discovered: allDiscovered.length,
        scored: toScore.length,
        persisted: 0,
        deactivated: 0,
        errors: [...errors, 'ENABLE_DYNAMIC_KEYWORDS is not true; skipping persist'],
      };
    }

    // 5. Persist to TrendKeyword (upsert by keyword)
    let persisted = 0;
    for (const keyword of passing) {
      const info = byKeyword.get(keyword);
      const relevanceScore = scores.get(keyword) ?? MIN_RELEVANCE_SCORE;
      try {
        await this.prisma.trendKeyword.upsert({
          where: { keyword },
          create: {
            keyword,
            relevanceScore,
            isActive: true,
            discoverySource: info?.discoverySource ?? 'discovery',
            usageCount: 0,
          },
          update: {
            relevanceScore,
            discoverySource: info?.discoverySource ?? undefined,
            updatedAt: new Date(),
          },
        });
        persisted++;
      } catch (e) {
        errors.push(`Upsert ${keyword}: ${String(e)}`);
      }
    }

    // 6. Cap active keywords: deactivate oldest-used if over MAX_ACTIVE_KEYWORDS
    const active = await this.prisma.trendKeyword.count({ where: { isActive: true } });
    let deactivated = 0;
    if (active > MAX_ACTIVE_KEYWORDS) {
      const toDeactivate = await this.prisma.trendKeyword.findMany({
        where: { isActive: true },
        orderBy: [{ usageCount: 'asc' }, { updatedAt: 'asc' }],
        take: active - MAX_ACTIVE_KEYWORDS,
      });
      for (const kw of toDeactivate) {
        await this.prisma.trendKeyword.update({
          where: { id: kw.id },
          data: { isActive: false },
        });
        deactivated++;
      }
    }

    // 7. Deactivate keywords unused for 60+ days (optional)
    const sixtyDaysAgo = new Date();
    sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);
    const unused = await this.prisma.trendKeyword.findMany({
      where: { isActive: true, usageCount: 0, updatedAt: { lt: sixtyDaysAgo } },
      take: 20,
    });
    for (const kw of unused) {
      await this.prisma.trendKeyword.update({
        where: { id: kw.id },
        data: { isActive: false },
      });
      deactivated++;
    }

    return {
      discovered: allDiscovered.length,
      scored: toScore.length,
      persisted,
      deactivated,
      errors,
    };
  }
}
