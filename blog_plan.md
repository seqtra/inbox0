# Dynamic Trend-Driven Blog System with Advanced SEO

## Context

The current blog service uses **8 hardcoded keywords** and **3 static RSS feeds** to generate blog content. This limits content discovery to predefined topics and prevents the system from adapting to emerging trends in the email productivity space.

**Current Limitations:**
- Static keywords in [trend.service.ts:34-43](api/src/services/trend.service.ts#L34-L43): `['email productivity', 'inbox zero', 'email automation', ...]`
- Fixed RSS sources (2 Google News searches, Lifehacker)
- No keyword performance tracking or optimization
- No competitor analysis or content gap identification
- Manual-only SEO optimization

**Business Goal:**
Transform the blog into a dynamic, trend-driven content engine that:
- Discovers and adapts to emerging trends automatically
- Expands reach beyond predefined topics
- Maximizes SEO visibility and rankings
- Attracts more potential customers through high-quality, timely content

## Implementation Approach

### Phase 1: Database Foundation (Week 1-2)

**New Prisma Models** in [libs/shared/prisma/schema.prisma](libs/shared/prisma/schema.prisma):

1. **TrendKeyword** - Dynamic keyword management with performance tracking
   - Fields: keyword, category, searchVolume, competition, relevanceScore, trendScore, trendDirection, isActive, usageCount, discoverySource
   - Replaces hardcoded keyword array

2. **TrendSource** - Dynamic RSS/API source management
   - Fields: name, type (rss/api/social), url, isActive, priority, avgRelevanceScore, articlesFound, articlesUsed
   - Enables adding/removing sources based on performance

3. **KeywordCluster** - Content pillar organization
   - Fields: name, description, primaryKeywords, priority, totalPosts
   - Groups related keywords into topic clusters (e.g., "Email Productivity", "AI Automation")

4. **InternalLink** - Automated internal linking
   - Fields: fromPostId, toPostId, anchorText, linkType
   - Improves SEO through contextual linking between related posts

**Extend Existing Models:**
- BlogTopic: Add `keywords[]`, `clusterName`, `searchVolume`, `difficulty`
- BlogPost: Add `primaryKeyword`, `keywords[]`, `clusterName`, `wordCount`, `readingTime`, `metaScore`, `lastRefreshedAt`

**Migration Strategy:**
- Seed initial TrendKeyword records from existing hardcoded keywords
- Seed initial TrendSource records from existing RSS feeds
- All new fields are optional for backward compatibility

### Phase 2: Trend Discovery Service (Week 3-4)

**New Service:** [api/src/services/trend-discovery.service.ts](api/src/services/trend-discovery.service.ts)

**External API Integrations:**
1. **Google Trends** (via google-trends-api npm package)
   - Discover rising keywords related to email productivity
   - Identify related queries and trending topics
   - Estimate search volume ranges

2. **NewsAPI.org** (Free tier: 100 requests/day)
   - Search for articles: "email productivity", "inbox management", "AI automation"
   - Extract trending terms from headlines
   - Track topic momentum

3. **Reddit API** (Free)
   - Monitor: r/productivity, r/emailmarketing, r/GetMotivated, r/entrepreneur
   - Extract keywords from high-engagement posts (upvotes > 100)

4. **Hacker News API** (Free)
   - Fetch top stories from "Ask HN", "Show HN"
   - Filter for productivity, email, automation topics

5. **AI-Generated Keywords** (Claude)
   - Ask Claude: "What are emerging keywords in email productivity that executives search for in 2026?"
   - Identify gaps and creative opportunities

**Keyword Discovery Algorithm:**
```
1. Fetch keywords from all sources (parallel)
2. Consolidate and deduplicate
3. AI scoring: Rate each keyword's relevance to Inbox0 (0.0-1.0)
4. Filter: Only keep keywords with relevanceScore >= 0.6
5. Cluster: Group into content pillars using AI
6. Persist to TrendKeyword table
7. Deactivate underperforming keywords (unused for 60+ days)
```

**Daily Cron Job:** Refresh keywords at 2 AM
- Discover new keywords
- Update trend scores
- Deactivate poor performers
- Maintain 30-50 active keywords

**Cost:** ~25K tokens/day for keyword scoring = ~$0.20/month (using Claude Haiku)

### Phase 3: Dynamic Source Expansion (Week 5-6)

**New Service:** [api/src/services/trend-source-manager.ts](api/src/services/trend-source-manager.ts)

**Source Discovery Strategy:**
1. Generate Google News RSS feeds dynamically from top 10 keywords
   - Example: `https://news.google.com/rss/search?q=email+automation&hl=en-US`

2. Add curated high-authority blogs:
   - Harvard Business Review, Fast Company, MIT Tech Review, TechCrunch, The Verge
   - Stored in TrendSource table with priority scores

3. Reddit RSS endpoints:
   - `https://www.reddit.com/r/productivity/hot.json?limit=25`
   - Auto-discover trending subreddits

4. Hacker News API:
   - `https://hacker-news.firebaseio.com/v0/topstories.json`

**Source Performance Monitoring:**
- Track: articlesFound, articlesUsed, avgRelevanceScore
- Deactivate sources with < 10% success rate after 20 articles
- Rotate underperforming sources quarterly

**Refactor [api/src/services/trend.service.ts](api/src/services/trend.service.ts):**
- Replace `private keywords = [...]` with database query: `prisma.trendKeyword.findMany({ where: { isActive: true } })`
- Replace `private sources = [...]` with: `prisma.trendSource.findMany({ where: { isActive: true } })`
- Enhanced AI prompt to reference current high-priority keywords

### Phase 4: SEO Intelligence (Week 7-9)

**New Service:** [api/src/services/seo-intelligence.service.ts](api/src/services/seo-intelligence.service.ts)

**Key Features:**

1. **Keyword Difficulty Analysis**
   - Estimate competition using NewsAPI article count
   - Score difficulty: 0.0 (easy) to 1.0 (hard)
   - Store in BlogTopic.difficulty field

2. **Content Gap Identification**
   - Scrape competitor blog keywords (Superhuman, Front, Boomerang)
   - Compare with our active keywords
   - Suggest high-opportunity gaps
   - Admin endpoint: `GET /admin/seo/gaps`

3. **Automated Internal Linking**
   - Find related posts by keywords and cluster
   - Use Claude to suggest natural anchor text
   - Auto-insert 3-5 contextual links per post
   - Store in InternalLink table

4. **Featured Snippet Optimization**
   - Structure content with Q&A format headers
   - Add FAQ sections at end of posts
   - Use tables, bullet points, numbered lists
   - Generate FAQ structured data for Google

5. **Content Refresh Strategy**
   - Identify posts older than 6 months
   - Update statistics, tools, trends with Claude
   - Add new sections based on emerging keywords
   - Weekly cron: Refresh 1-2 posts/week

**Enhanced Blog Generation** in [api/src/app/routes/blogs.ts](api/src/app/routes/blogs.ts):
- Updated system prompt to include: target keyword, related keywords, cluster name, search intent
- Request FAQ section for structured data
- Calculate SEO score (metaScore) based on: keyword placement, readability, structure
- Auto-generate internal links after post creation

**Cron Jobs** in [api/src/jobs/index.ts](api/src/jobs/index.ts):
```typescript
// Daily at 2 AM: Refresh keywords
cron.schedule('0 2 * * *', runKeywordRefresh);

// Daily at 3 AM: Monitor source performance
cron.schedule('0 3 * * *', runSourceMonitoring);

// Weekly on Sunday at 3 AM: Refresh 2 stale posts
cron.schedule('0 3 * * 0', runContentRefresh);

// Every 6 hours: Scout for new trending topics (existing)
cron.schedule('0 */6 * * *', runTrendScout);
```

### Phase 5: Admin Interface (Week 10-11)

**New Admin Endpoints:**

```typescript
GET /admin/keywords              // View active keywords with performance
POST /admin/keywords/refresh     // Manually trigger keyword discovery
GET /admin/sources               // View all trend sources
POST /admin/sources              // Add new source
PATCH /admin/sources/:id         // Update source (activate/deactivate)
GET /admin/seo/gaps              // View content gap opportunities
GET /admin/seo/internal-links/:postId  // View link suggestions
POST /admin/posts/:id/refresh    // Refresh stale content
GET /admin/dashboard/seo-metrics // Overall SEO dashboard
```

**Frontend Admin Pages** (Optional):
- `/admin/keywords` - Keyword management interface
- `/admin/sources` - Source management interface
- Enhanced `/admin/blog` with SEO metrics

### Phase 6: Testing & Optimization (Week 12)

**Testing:**
- Unit tests: TrendDiscoveryService, SEOIntelligenceService
- Integration tests: End-to-end trend discovery → blog generation
- Load tests: Cron job performance with 50+ keywords, 20+ sources

**Performance Optimization:**
- Cache Google Trends data (1 hour TTL)
- Cache NewsAPI responses (6 hours TTL)
- Rate limiting for external APIs
- Database indexing: `@@index([isActive, relevanceScore])` on TrendKeyword

**Monitoring:**
- Keywords discovered per day (target: 5-10 new keywords/day)
- Active keyword count (target: 30-50)
- Blog topics generated per week (target: 10-15 vs. current 3-5)
- Cron job success rate (target: > 95%)

## Rollout Strategy (Phased with Feature Flags)

**Week 1-2: Foundation**
- Deploy database migrations
- No user-facing changes
- Seed initial data from existing keywords/sources

**Week 3-4: Monitoring Phase**
- Deploy TrendDiscoveryService
- Run keyword discovery but don't use yet (`ENABLE_DYNAMIC_KEYWORDS=false`)
- Monitor keyword quality in admin dashboard
- Manual approval of first 50 keywords

**Week 5-6: Gradual Enable**
- Enable dynamic keywords (`ENABLE_DYNAMIC_KEYWORDS=true`)
- Keep static keywords as fallback
- Add 5 new RSS sources, monitor performance

**Week 7-9: SEO Features**
- Enable internal linking automation
- Start content refresh (1 post/week)
- Test with 2-3 posts before full rollout

**Week 10-12: Full Production**
- Deploy admin interface
- Enable all features
- Weekly monitoring and optimization

## Critical Files to Modify

| File | Changes | Priority |
|------|---------|----------|
| [libs/shared/prisma/schema.prisma](libs/shared/prisma/schema.prisma) | Add 4 new models (TrendKeyword, TrendSource, KeywordCluster, InternalLink), extend BlogTopic/BlogPost | P0 |
| [api/src/services/trend-discovery.service.ts](api/src/services/trend-discovery.service.ts) | **NEW FILE** - Core keyword discovery logic | P0 |
| [api/src/services/trend.service.ts](api/src/services/trend.service.ts) | Replace hardcoded keywords/sources with DB queries | P0 |
| [api/src/services/seo-intelligence.service.ts](api/src/services/seo-intelligence.service.ts) | **NEW FILE** - SEO features (linking, gaps, refresh) | P1 |
| [api/src/services/trend-source-manager.ts](api/src/services/trend-source-manager.ts) | **NEW FILE** - Dynamic source discovery | P1 |
| [api/src/jobs/index.ts](api/src/jobs/index.ts) | Add 3 new cron jobs (keyword refresh, source monitoring, content refresh) | P0 |
| [api/src/app/routes/blogs.ts](api/src/app/routes/blogs.ts) | Enhanced blog generation with SEO optimization | P1 |
| [api/src/app/routes/admin/trends.ts](api/src/app/routes/admin/trends.ts) | **NEW FILE** - Admin endpoints for keywords/sources | P2 |

## Environment Variables

Add to `.env`:
```bash
# External API Keys
NEWS_API_KEY=your_key                      # https://newsapi.org (free tier)
REDDIT_CLIENT_ID=your_id                   # Reddit API (free)
REDDIT_CLIENT_SECRET=your_secret

# Feature Flags
ENABLE_DYNAMIC_KEYWORDS=false              # Start disabled, enable in Week 5
ENABLE_AUTO_INTERNAL_LINKING=false         # Enable in Week 7
ENABLE_CONTENT_REFRESH=false               # Enable in Week 8

# Configuration
TREND_REFRESH_INTERVAL=24h                 # Daily keyword refresh
MIN_KEYWORD_RELEVANCE_SCORE=0.6            # Minimum AI score
MAX_ACTIVE_KEYWORDS=50                     # Keyword pool limit
```

## Cost Analysis

**Monthly Costs:**
- Claude AI: ~800K tokens/month = $6-8 (mostly for blog generation)
- NewsAPI: $0 (free tier: 100 req/day)
- Google Trends: $0 (unofficial API)
- Reddit API: $0 (free)
- Hacker News API: $0 (free)

**Total: ~$6-10/month** (negligible increase from current costs)

**Cost Optimization:**
- Use Claude Haiku for keyword scoring (10x cheaper than Sonnet)
- Batch keyword scoring (50 keywords in one request)
- Aggressive caching (1-24 hours for trend data)
- Free APIs only (no paid subscriptions)

## Expected Results

**Keyword Diversity:**
- Before: 8 static keywords
- After: 30-50 active, rotating keywords

**Content Production:**
- Before: 3-5 blog topics/week
- After: 10-15 blog topics/week (3x increase)

**Content Freshness:**
- Before: No automatic updates
- After: 1-2 posts refreshed weekly (80% posts < 6 months old)

**SEO Improvements:**
- Internal linking: 3-5 contextual links per post
- Featured snippet optimization: FAQ sections, Q&A structure
- Content gap coverage: Target competitor keywords
- Dynamic adaptation: Trending topics within 24 hours

**Long-term Impact:**
- Higher search rankings for long-tail keywords
- Broader topic coverage = more entry points
- Fresh content = better Google rankings
- Internal linking = better crawlability and authority flow

## Verification Steps

After implementation:

1. **Database:**
   ```bash
   npx prisma db push --schema=libs/shared/prisma/schema.prisma
   npx prisma generate --schema=libs/shared/prisma/schema.prisma
   npx prisma studio --schema=libs/shared/prisma/schema.prisma
   # Verify new tables: TrendKeyword, TrendSource, KeywordCluster, InternalLink
   ```

2. **Keyword Discovery:**
   ```bash
   # Trigger manual keyword refresh
   curl -X POST http://localhost:3000/admin/keywords/refresh \
     -H "Authorization: Bearer <token>"

   # View discovered keywords
   curl http://localhost:3000/admin/keywords \
     -H "Authorization: Bearer <token>"

   # Expected: 30-50 keywords with relevanceScore >= 0.6
   ```

3. **Trend Scouting:**
   ```bash
   # Scout for new topics (should now use dynamic keywords)
   curl http://localhost:3000/admin/scout-trends \
     -H "Authorization: Bearer <token>"

   # Verify BlogTopic records have keywords[] populated
   ```

4. **Blog Generation:**
   ```bash
   # Generate blog from approved topic
   curl -X POST http://localhost:3000/admin/generate-blog \
     -H "Authorization: Bearer <token>" \
     -d '{"topicId": "..."}'

   # Verify BlogPost has: primaryKeyword, keywords[], wordCount, metaScore
   # Verify InternalLink records created
   ```

5. **Cron Jobs:**
   ```bash
   # Check logs for scheduled jobs
   docker logs inbox0-api | grep "\[Cron\]"

   # Expected output (daily):
   # [Cron] Starting keyword refresh...
   # [Cron] Keyword refresh complete: 47 keywords updated
   # [Cron] Starting source monitoring...
   # [Cron] Deactivated 2 underperforming sources
   ```

6. **SEO Intelligence:**
   ```bash
   # Get content gap opportunities
   curl http://localhost:3000/admin/seo/gaps \
     -H "Authorization: Bearer <token>"

   # Get internal link suggestions
   curl http://localhost:3000/admin/seo/internal-links/<postId> \
     -H "Authorization: Bearer <token>"
   ```

7. **Frontend:**
   - Visit `/blog` - verify posts render correctly
   - Check blog post - verify internal links present
   - Inspect page source - verify structured data includes FAQ schema
   - Check `/sitemap.xml` - verify all published posts listed

8. **End-to-End Test:**
   ```bash
   # Full flow test
   1. Run keyword refresh
   2. Scout trends (should find 10+ new topics)
   3. Approve a topic
   4. Generate blog post
   5. Verify post has SEO metadata and internal links
   6. Publish post
   7. Verify visible on /blog
   ```

## Risk Mitigation

**Technical Risks:**
- **External API failures**: Graceful degradation, fallback to cached data
- **Claude rate limits**: Batch requests, use Haiku for cheap operations
- **Poor keyword quality**: AI scoring with 0.6 minimum threshold, admin review

**Business Risks:**
- **Content quality**: Maintain admin approval for topics
- **SEO penalties**: Avoid keyword stuffing, natural linking only
- **Cost overruns**: Monitor Claude usage, set budget alerts

**Rollback Plan:**
- Feature flags allow instant disable
- Database backward compatible (new fields optional)
- Static keywords remain as fallback
- No breaking changes to existing blog posts

## Success Metrics (30-day targets)

- Active keywords: 40+ (vs. 8 static)
- Blog topics/week: 12+ (vs. 3-5)
- Avg internal links/post: 4+ (vs. 0)
- Posts refreshed: 8+ in 30 days
- Content clusters: 5-7 pillar topics
- SEO score (avg): 80+ (metaScore)
