import { FastifyInstance } from 'fastify';
import { PrismaClient } from '@prisma/client';

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
        await prisma.cronJob.create({ 
            data: { userId, nextRunAt: new Date() /* Logic to calc next run */ } 
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

    // 1. Update Timezone
    if (timezone) {
        await prisma.userPreferences.update({
            where: { userId },
            data: { timezone, isManualTz: true }
        });
    }

    // 2. Update Cron
    // Here you would also update your actual Job Queue (e.g., BullMQ)
    const updatedCron = await prisma.cronJob.update({
        where: { userId },
        data: { 
            cronExpression,
            // Recalculate nextRunAt based on new expression + timezone
            nextRunAt: new Date() // Placeholder logic
        }
    });

    return { success: true, data: updatedCron };
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