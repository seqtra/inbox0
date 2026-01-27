/**
 * Cron job definitions and registration.
 * Stub handlers; extend with real logic (e.g. iterate users with tokens, call GmailService/TrendService).
 */

import cron, { type ScheduledTask } from 'node-cron';
import type { FastifyInstance } from 'fastify';

const tasks: ScheduledTask[] = [];

async function runEmailSync(): Promise<void> {
  // Stub: in a full implementation, iterate users with Google tokens and sync emails per user.
  console.log('[Cron] runEmailSync (stub)');
}

async function runTrendScout(): Promise<void> {
  // Stub: in a full implementation, call TrendService.findNewTopics() and persist to DB.
  console.log('[Cron] runTrendScout (stub)');
}

export function registerCronJobs(fastify: FastifyInstance): void {
  // Run trend scouting every 6 hours
  const trendTask = cron.schedule('0 */6 * * *', () => {
    runTrendScout().catch((err) => fastify.log.error(err, '[Cron] runTrendScout failed'));
  });
  tasks.push(trendTask);

  // Run email sync daily at 6:00 UTC
  const emailTask = cron.schedule('0 6 * * *', () => {
    runEmailSync().catch((err) => fastify.log.error(err, '[Cron] runEmailSync failed'));
  });
  tasks.push(emailTask);

  fastify.log.info('Cron jobs registered (trend: every 6h, email sync: daily 06:00 UTC)');
}

export function stopCronJobs(): void {
  for (const task of tasks) {
    task.stop();
  }
  tasks.length = 0;
}
