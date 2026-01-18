import { FastifyInstance } from 'fastify';

export default async function (fastify: FastifyInstance) {
  // Existing root route
  fastify.get('/', async function () {
    return { message: 'Hello API' };
  });

  // NEW: Health check route for Docker
  fastify.get('/api/health', async function () {
    return { status: 'ok' };
  });
}