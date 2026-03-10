import { FastifyInstance } from 'fastify';
import { PrismaClient, type UserPreferences as PrismaUserPreferences } from '@prisma/client';
import { CronExpressionParser } from 'cron-parser';

const prisma = new PrismaClient();
const DEFAULT_CRON = '0 9 * * *';

type UserPreferencesUpdateBody = Partial<
  Omit<PrismaUserPreferences, 'id' | 'userId'>
>;

function getNextRunAt(cronExpression: string, timezone: string): Date {
  const interval = CronExpressionParser.parse(cronExpression, { tz: timezone });
  return interval.next().toDate();
}

export default async function (fastify: FastifyInstance) {
  
  // Apply Auth Middleware to all routes in this scope
  fastify.addHook('preHandler', fastify.authenticate);

  // GET /me - Get full user context
  fastify.get('/me', async (request, reply) => {
    const userId = request.user?.id;
    if (!userId) {
      return reply.status(401).send({ error: 'Unauthorized' });
    }

    // Fetch user with relations
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { preferences: true, cronJob: true }
    });

    if (!user) {
      return reply.status(404).send({ error: 'User not found' });
    }

    // Lazy initialization if records missing
    let preferences = user.preferences;
    if (!preferences) {
        preferences = await prisma.userPreferences.create({ data: { userId } });
    }
    
    let cronJob = user.cronJob;
    if (!cronJob) {
        const defaultCron = DEFAULT_CRON; // 9 AM
        // Note: Defaulting to UTC is acceptable for initial lazy-create
        const nextRun = getNextRunAt(defaultCron, 'UTC');

        cronJob = await prisma.cronJob.create({ 
            data: { 
              userId, 
              cronExpression: defaultCron,
              nextRunAt: nextRun 
            } 
        });
    }

    // Return the updated structures, effectively "attaching" them
    return { 
      success: true, 
      data: { 
        ...user, 
        preferences, 
        cronJob 
      } 
    };
  });
  // PATCH /me/preferences
  fastify.patch('/me/preferences', async (request, reply) => {
    const userId = request.user?.id;
    if (!userId) {
      return reply.status(401).send({ error: 'Unauthorized' });
    }
    const body = request.body as UserPreferencesUpdateBody;

    const updated = await prisma.userPreferences.upsert({
      where: { userId },
      create: {
        userId,
        ...body,
      },
      update: body,
    });

    return { success: true, data: updated };
  });

  // POST /me/schedule
  fastify.post('/me/schedule', async (request, reply) => {
    const userId = request.user?.id;
    if (!userId) {
      return reply.status(401).send({ error: 'Unauthorized' });
    }
    const { cronExpression, timezone } = request.body as {
      cronExpression: string;
      timezone?: string;
    };

    // 1. Fetch current preferences to get the correct timezone if not provided
    // We need the timezone to calculate the cron accurately (e.g. 9 AM in London vs 9 AM in NYC)
    const existingPrefs = await prisma.userPreferences.findUnique({ where: { userId }});
    const targetTimezone = timezone || existingPrefs?.timezone || 'UTC';

    // Update Timezone if provided
    if (timezone) {
        await prisma.userPreferences.upsert({
          where: { userId },
          create: {
            userId,
            timezone,
            isManualTz: true,
          },
          update: { timezone, isManualTz: true }
        });
    }

    // [FIX]: Calculate accurate nextRunAt
    try {
      const nextRunAt = getNextRunAt(cronExpression, targetTimezone);

      const updatedCron = await prisma.cronJob.upsert({
          where: { userId },
          create: {
            userId,
            cronExpression,
            nextRunAt,
            isActive: true,
          },
          update: { 
            cronExpression,
            nextRunAt,
            isActive: true,
          }
      });

      return { success: true, data: updatedCron };

    } catch {
      // Handle invalid cron expression
      return reply.status(400).send({ success: false, error: "Invalid Cron Expression" });
    }
  });

  // GET /me/stats
  fastify.get('/me/stats', async (request, reply) => {
      const userId = request.user?.id;
      if (!userId) {
        return reply.status(401).send({ success: false, error: 'Unauthorized' });
      }
      const stats = await prisma.usageStat.findMany({
          where: { userId },
          orderBy: { date: 'desc' },
          take: 30 // Last 30 days
      });
      return { success: true, data: stats };
  });
}
