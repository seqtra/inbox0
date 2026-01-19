import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import fp from 'fastify-plugin';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// 1. Augment Fastify Types
declare module 'fastify' {
  interface FastifyInstance {
    authenticate(request: FastifyRequest, reply: FastifyReply): Promise<void>;
  }
  interface FastifyRequest {
    user?: { id: string; email: string };
  }
}

export default fp(async (fastify: FastifyInstance) => {
  fastify.decorate('authenticate', async (request: FastifyRequest, reply: FastifyReply) => {
    // 2. Get session token (Access cookies safely)
    const cookies = request.cookies || {};
    const sessionToken = cookies['next-auth.session-token'] || 
                         cookies['__Secure-next-auth.session-token'];

    if (!sessionToken) {
      return reply.status(401).send({ error: 'Unauthorized' });
    }

    // 3. Validate against Database
    const session = await prisma.session.findUnique({
      where: { sessionToken },
      include: { user: true },
    });

    if (!session || session.expires < new Date()) {
      return reply.status(401).send({ error: 'Session expired' });
    }

    // 4. Attach user to request
    request.user = { id: session.user.id, email: session.user.email };
  });
});