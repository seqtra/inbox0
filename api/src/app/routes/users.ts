import { FastifyInstance } from 'fastify';
import { PrismaClient } from '@prisma/client';
import cronParser from 'cron-parser'; 

const prisma = new PrismaClient();

export default async function (fastify: FastifyInstance) {
  
  // Apply Auth Middleware to all routes in this scope
  fastify.addHook('preHandler', fastify.authenticate);

  // GET /me - Get full user context
  fastify.get('/me', async (request, reply) => {
    const userId = request.user!.id;

    // Fetch user with relations
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { preferences: true, cronJob: true }
    });

    // Lazy initialization if records missing
    if (user && !user.preferences) {
        await prisma.userPreferences.create({ data: { userId } });
        // Re-fetch or manually attach (omitted for brevity)
    }
    if (user && !user.cronJob) {
        const defaultCron = "0 9 * * *"; // 9 AM
        
        // Calculate next run
        const interval = cronParser.parseExpression(defaultCron, { utc: true });
        const nextRun = interval.next().toDate();

        await prisma.cronJob.create({ 
            data: { 
              userId, 
              cronExpression: defaultCron,
              nextRunAt: nextRun 
            } 
        });
    }

    return { success: true, data: user };
  });

  // PATCH /me/preferences
  fastify.patch('/me/preferences', async (request, reply) => {
    const userId = request.user!.id;
    const body = request.body as any;

    const updated = await prisma.userPreferences.update({
      where: { userId },
      data: {
        ...body,
        // Prevent ID injection
        id: undefined, userId: undefined 
      }
    });

    return { success: true, data: updated };
  });

  // POST /me/schedule
  fastify.post('/me/schedule', async (request, reply) => {
    const userId = request.user!.id;
    const { cronExpression, timezone } = request.body as any;

    // 1. Fetch current preferences to get the correct timezone if not provided
    // We need the timezone to calculate the cron accurately (e.g. 9 AM in London vs 9 AM in NYC)
    const existingPrefs = await prisma.userPreferences.findUnique({ where: { userId }});
    const targetTimezone = timezone || existingPrefs?.timezone || 'UTC';

    // Update Timezone if provided
    if (timezone) {
        await prisma.userPreferences.update({
            where: { userId },
            data: { timezone, isManualTz: true }
        });
    }

    // [FIX]: Calculate accurate nextRunAt
    try {
      const interval = cronParser.parseExpression(cronExpression, {
        tz: targetTimezone, // Use the user's timezone!
      });
      
      const nextRunAt = interval.next().toDate();

      const updatedCron = await prisma.cronJob.update({
          where: { userId },
          data: { 
              cronExpression,
              nextRunAt: nextRunAt 
          }
      });

      return { success: true, data: updatedCron };

    } catch (err) {
      // Handle invalid cron expression
      return reply.status(400).send({ success: false, error: "Invalid Cron Expression" });
    }
  });

  // GET /me/stats
  fastify.get('/me/stats', async (request, reply) => {
      const stats = await prisma.usageStat.findMany({
          where: { userId: request.user!.id },
          orderBy: { date: 'desc' },
          take: 30 // Last 30 days
      });
      return { success: true, data: stats };
  });
}