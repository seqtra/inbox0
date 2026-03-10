# CRON Feature Plan

> **Status:** Planning  
> **Last updated:** 2025-03-10

## Executive Summary

The inbox0 app has two distinct cron systems that are **not yet connected**:

1. **System cron jobs** – Global, fixed-schedule jobs (trend scouting, keyword refresh, etc.) – mostly implemented
2. **User CronJob model** – Per-user schedules stored in DB (`cronExpression`, `nextRunAt`, `timezone`) – **never executed**

The main gap: **no job runs at each user's scheduled time** to sync emails, generate digests, or send WhatsApp notifications.

---

## Current State

### System Cron Jobs (`api/src/jobs/index.ts`)

| Job | Schedule | Status | Purpose |
|-----|----------|--------|---------|
| `runTrendScout` | Every 6h (`0 */6 * * *`) | ✅ Implemented | Find new blog topics from RSS trends |
| `runKeywordRefresh` | Daily 02:00 | ✅ Implemented | Refresh trend keywords via TrendDiscoveryService |
| `runSourceMonitoring` | Daily 03:00 | ✅ Implemented | Deactivate underperforming RSS sources |
| `runContentRefresh` | Sundays 03:00 | ✅ Implemented | Refresh stale blog posts (gated by `ENABLE_CONTENT_REFRESH`) |
| **`runEmailSync`** | Daily 06:00 | ❌ **STUB** | Should sync emails for all users – does nothing |

### User CronJob Model (`libs/shared/prisma/schema.prisma`)

- Each user has a `CronJob` record: `cronExpression`, `nextRunAt`, `lastRunAt`, `isActive`
- Users set schedule via `POST /api/users/me/schedule` with `{ cronExpression, timezone }`
- **Problem:** Nothing reads `CronJob.nextRunAt` or triggers work at that time

### User Preferences (relevant to cron)

- `digestMode` – whether user wants digest summaries
- `digestFrequency` – `'hourly' | 'daily' | 'weekly'`
- `notifyOnNewEmail` – real-time vs batched
- `phoneNumber` – for WhatsApp delivery
- `quietHoursStart` / `quietHoursEnd` – when to avoid notifications

---

## Architecture Decisions

### 1. User-scheduled vs system-scheduled

**Option A: Single ticker (recommended)**  
- One cron job runs every 5–15 minutes (e.g. `*/5 * * * *`)
- On each tick: query `CronJob` where `nextRunAt <= now()` and `isActive`
- For each user: run digest/sync, update `nextRunAt` / `lastRunAt`

**Option B: Per-user cron expressions**  
- Dynamically create/remove `node-cron` tasks when users change schedules  
- Pros: exact timing per user  
- Cons: complex, many schedules, hard to scale

**Recommendation:** Option A. Simpler, scales well, and 5–15 min granularity is acceptable for digests.

### 2. What `runEmailSync` should do

**Option A: Global batch sync (current intent)**  
- Run at fixed 06:00 UTC
- For all users with Gmail linked: fetch emails, optionally store in DB (if you add an Email model)

**Option B: Per-user sync**  
- Sync happens as part of the user digest job (when their `nextRunAt` fires)
- No separate global email sync

**Recommendation:** Option B. Sync is tied to user schedule; no need for a separate global sync unless you want a "background sync" (e.g. cache emails for faster UI).

### 3. Digest delivery flow

```
User CronJob.nextRunAt fires
  → Fetch user preferences (digestMode, phoneNumber, timezone)
  → If digestMode: fetch emails (GmailService) → summarize (AI) → send (Twilio or in-app)
  → Update UsageStat
  → Compute nextRunAt from cronExpression + timezone, update CronJob
```

### 4. OAuth token refresh

- Gmail API client auto-refreshes when `refresh_token` is set
- **Important:** NextAuth refreshes tokens on web requests; cron runs in API process only
- You may need to explicitly refresh tokens before Gmail calls (e.g. use `google-auth-library` or similar to refresh and persist to `Account` table)

---

## Implementation Phases

### Phase 1: User digest scheduler (core)

**Goal:** Run digest for users at their scheduled time.

1. **Add ticker job**  
   - New cron: `*/5 * * * *` (every 5 min)  
   - Query: `CronJob` where `nextRunAt <= now()`, `isActive`, user has Gmail linked

2. **Implement digest runner**  
   - For each user:  
     - Check `preferences.digestMode`  
     - If enabled: fetch emails → summarize → send (WhatsApp if `phoneNumber`, else store for in-app)  
     - Respect `quietHours` if sending WhatsApp  
     - Update `CronJob.lastRunAt`, `nextRunAt`  
     - Update `UsageStat`

3. **Token refresh**  
   - Ensure refresh token is used and refreshed tokens are persisted to `Account` before Gmail calls

**Files:**  
- `api/src/jobs/index.ts` – add ticker, digest runner  
- `api/src/services/digest.service.ts` (new) – orchestrate fetch + summarize + send

### Phase 2: Implement `runEmailSync` (or remove)

**Option A – Remove:**  
- Delete `runEmailSync` if sync is fully handled by digest job

**Option B – Keep as global sync:**  
- Implement: for all users with Gmail, fetch last N emails (e.g. for caching or analytics)  
- Decide: store in DB? (no Email model today – emails are fetched on demand)

**Recommendation:** Start with Option A; add global sync only if you introduce an Email cache model.

### Phase 3: Respect user preferences

- `digestFrequency`: map to cron expression (e.g. daily → `0 9 * * *`, weekly → `0 9 * * 1`)

- `quietHours`: skip WhatsApp send if current time is in quiet hours; optionally store digest for later

- `notifyOnNewEmail`: if true and not digestMode, consider a separate "new email" flow (e.g. webhook or push). Out of scope for initial cron plan.

### Phase 4: Observability

- Structured logging (job name, user id, success/failure)
- Metrics: digest runs, failures, latency
- Optional: Admin endpoint to list recent cron runs

---

## Environment & Configuration

| Variable | Purpose |
|----------|---------|
| `ENABLE_CONTENT_REFRESH` | Already used – gate content refresh job |
| `ENABLE_USER_DIGEST` | Optional – gate user digest ticker (e.g. `true` in prod) |
| `CRON_TICK_INTERVAL_MINUTES` | Optional – override default 5 min |

---

## Testing Strategy

1. **Unit tests**  
   - `DigestService`: mock Gmail, AI, Twilio; assert correct calls and `nextRunAt` logic

2. **Integration tests**  
   - Seed user with `CronJob` where `nextRunAt` is in the past  
   - Run ticker once  
   - Assert `lastRunAt` updated, `nextRunAt` advanced, UsageStat updated

3. **Manual**  
   - Set `nextRunAt` to 1 min from now, watch logs, verify digest runs

---

## Files to Create/Modify

| Action | File |
|--------|------|
| Create | `api/src/services/digest.service.ts` (orchestrate fetch + summarize + send) |
| Modify | `api/src/jobs/index.ts` (ticker job, digest runner, remove or implement `runEmailSync`) |
| Modify | `api/src/app/routes/users.ts` (ensure `nextRunAt` is set correctly on schedule update) |
| Create | `api/src/services/digest.service.spec.ts` |
| Modify | `api/src/jobs/index.spec.ts` (if exists) or add job tests |

---

## Risks & Considerations

1. **Token expiry:** Cron runs without user session; ensure refresh token is used and persisted.
2. **Rate limits:** Gmail API, Anthropic, Twilio – add backoff/retries for bulk jobs.
3. **Docker:** Cron runs inside API container; no separate worker process.
4. **Multi-instance:** If you run multiple API replicas, each will run the ticker – consider idempotency or a distributed lock (e.g. DB row lock, Redis) for user digest.

---

## Next Steps

1. Decide: Option A (ticker) vs Option B (per-user cron) for user digests  
2. Implement Phase 1 (ticker + digest runner)  
3. Add token refresh handling if needed  
4. Decide fate of `runEmailSync` (remove vs implement)
