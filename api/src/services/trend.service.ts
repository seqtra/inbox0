import Parser from 'rss-parser';
import type { AIService } from './ai/types';

// Response type for trend scouting
export interface TrendStory {
  original_headline: string;
  blog_idea_title: string;
  angle: string;
  source_url?: string;
  relevance_score: number; // 1-10, where 7+ is considered relevant
}

export interface TrendResult {
  relevant_stories: TrendStory[];
}

// RSS fetch timeout in milliseconds
const RSS_TIMEOUT_MS = 10000;

export class TrendService {
  private parser = new Parser({
    timeout: RSS_TIMEOUT_MS,
  });
  private ai: AIService;

  // Google News RSS search queries targeting our niche: busy professionals and executives
  private sources = [
    'https://news.google.com/rss/search?q=email+productivity+tips+OR+inbox+zero+strategies&hl=en-US&gl=US&ceid=US:en',
    'https://news.google.com/rss/search?q=executive+time+management+OR+business+communication+efficiency&hl=en-US&gl=US&ceid=US:en',
    'https://lifehacker.com/rss', // Keep Lifehacker as it's often relevant
  ];

  // Keywords to search for in headlines (still useful for pre-filtering)
  private keywords = [
    'email productivity',
    'email management',
    'inbox zero',
    'email automation',
    'time management',
    'executive productivity',
    'business communication',
    'workflow efficiency',
  ];

  constructor(aiService: AIService) {
    this.ai = aiService;
  }

  async findNewTopics(): Promise<TrendResult> {
    const allItems: Array<{ title: string; link: string; source: string }> = [];
    const errors: string[] = [];
    const sourceStats: Record<string, number> = {};

    // 1. Fetch Headlines with timeout handling and debugging
    console.log(`[TrendService] Starting RSS fetch from ${this.sources.length} sources...`);
    
    const fetchPromises = this.sources.map(async (source) => {
      const sourceName = source.includes('google.com') 
        ? `Google News (${source.split('q=')[1]?.split('&')[0] || 'unknown query'})`
        : source;
      
      try {
        console.log(`[TrendService] Fetching from: ${sourceName}`);
        const feed = await this.parser.parseURL(source);
        const items = feed.items
          .slice(0, 20) // Get more items from Google News (they're already filtered)
          .filter((item): item is typeof item & { title: string; link: string } => 
            Boolean(item.title && item.link)
          )
          .map(item => ({ title: item.title, link: item.link, source: sourceName }));
        
        sourceStats[sourceName] = items.length;
        console.log(`[TrendService] ✓ ${sourceName}: Found ${items.length} items`);
        
        return items;
      } catch (e) {
        const errorMsg = e instanceof Error ? e.message : 'Unknown error';
        console.error(`[TrendService] ✗ Failed to parse ${sourceName}: ${errorMsg}`);
        errors.push(`${sourceName}: ${errorMsg}`);
        sourceStats[sourceName] = 0;
        return [];
      }
    });

    const results = await Promise.allSettled(fetchPromises);
    
    for (const result of results) {
      if (result.status === 'fulfilled') {
        allItems.push(...result.value);
      } else {
        console.error(`[TrendService] Promise rejected:`, result.reason);
      }
    }

    console.log(`[TrendService] Total raw items fetched: ${allItems.length}`);
    console.log(`[TrendService] Source breakdown:`, sourceStats);

    // If no items fetched, return early (don't waste OpenAI call)
    if (allItems.length === 0) {
      console.warn('[TrendService] No RSS items fetched. Errors:', errors);
      return { relevant_stories: [] };
    }

    // 2. Pre-filter by keywords (faster than sending everything to AI)
    const keywordFiltered = allItems.filter(item => {
      const titleLower = item.title.toLowerCase();
      return this.keywords.some(keyword => titleLower.includes(keyword.toLowerCase()));
    });

    console.log(`[TrendService] After keyword filtering: ${keywordFiltered.length} items (from ${allItems.length} total)`);

    // Use keyword-filtered items, or fall back to all items if none match
    const itemsToAnalyze = keywordFiltered.length > 0 ? keywordFiltered : allItems.slice(0, 30);

    // 3. The Analyst: Ask AI to filter relevant ones
    const headlines = itemsToAnalyze.map(i => `- ${i.title} | URL: ${i.link}`).join('\n');
    
    console.log(`[TrendService] Sending ${itemsToAnalyze.length} headlines to OpenAI for analysis...`);
    console.log(`[TrendService] Sample headlines being analyzed:\n${headlines.substring(0, 500)}...`);

    const prompt = `
      You are a Content Strategist for "Inbox0", an AI-powered email and WhatsApp management app.
      
      Our target audience: C-level executives, busy managers, and professionals who struggle with email overload and need actionable time-saving strategies.
      
      Analyze these news headlines from RSS feeds (pre-filtered from Google News searches for email productivity, inbox zero, executive time management, and business communication efficiency).
      
      **CRITICAL FILTERING REQUIREMENTS:**
      
      **INCLUDE stories that offer:**
      - High-value advice for C-level executives and managers
      - Actionable email management strategies and techniques
      - Time-saving automation for business professionals
      - Executive productivity tips and frameworks
      - Business communication efficiency improvements
      - Inbox zero methodologies and best practices
      - Email workflow optimization for busy professionals
      
      **EXPLICITLY REJECT these types of stories:**
      - General software updates (e.g., "Windows 11 update released", "iOS 17 features")
      - Coding tutorials or developer-focused content
      - Generic startup funding news (unless specifically about email/productivity tools)
      - Politics, current events, or non-business news
      - Consumer gadget reviews (unless specifically about email/productivity apps)
      - Generic tech industry news without actionable business value
      
      **Scoring Guidelines:**
      - Rate each story's relevance_score from 1-10
      - Only include stories with relevance_score >= 7
      - 7-8: Relevant but not perfect fit
      - 9-10: Highly relevant, perfect for our audience
      
      For each relevant story (relevance_score >= 7), return a JSON object with:
      - "original_headline": The exact news title
      - "source_url": The URL of the original article
      - "blog_idea_title": A catchy blog title for our brand based on this news (make it compelling and SEO-friendly, targeting executives)
      - "angle": One sentence on how we should frame this for our executive audience (e.g., "Show how Inbox0 implements this strategy" or "Explain how this trend affects busy executives' email management")
      - "relevance_score": A number from 1-10 indicating how relevant this is to our target audience
      
      Return the response as JSON: { "relevant_stories": [...] }
      If no stories meet the relevance threshold (score >= 7), return: { "relevant_stories": [] }
    `;

    try {
      const result = await this.ai.chatCompletion({
        messages: [{ role: 'user', content: prompt + '\n\nHeadlines:\n' + headlines }],
        response_format: { type: 'json_object' }
      });

      const content = result.choices[0].message.content;
      if (!content) {
        console.warn('OpenAI returned empty content for trend analysis');
        return { relevant_stories: [] };
      }

      const parsed = JSON.parse(content) as TrendResult;
      
      // Validate the response structure
      if (!Array.isArray(parsed.relevant_stories)) {
        console.error('[TrendService] OpenAI returned invalid structure:', parsed);
        return { relevant_stories: [] };
      }

      // Filter by relevance_score >= 7
      const filtered = parsed.relevant_stories.filter(story => {
        const score = story.relevance_score || 0;
        if (score < 7) {
          console.log(`[TrendService] Filtered out story with score ${score}: "${story.original_headline}"`);
        }
        return score >= 7;
      });

      console.log(`[TrendService] OpenAI returned ${parsed.relevant_stories.length} stories, ${filtered.length} passed relevance threshold (>=7)`);
      
      return { relevant_stories: filtered };
      
    } catch (error) {
      console.error('OpenAI trend analysis failed:', error);
      // Don't throw - return empty to allow graceful degradation
      return { relevant_stories: [] };
    }
  }
}