// api/src/app/routes/emails.ts

import { FastifyInstance } from 'fastify';
import { OpenAIService } from '../../services/openai.service';
import type { Email } from '@email-whatsapp-bridge/shared';

// Initialize Service
const openAI = new OpenAIService();

export default async function (fastify: FastifyInstance) {
  // Protect all routes in this file
  fastify.addHook('preHandler', fastify.authenticate);

  /**
   * POST /api/emails/analyze
   * Body: Email object
   * Returns: EmailSummary
   */
  fastify.post('/analyze', async (request, reply) => {
    const email = request.body as Email;

    if (!email || !email.body) {
      return reply.status(400).send({ error: 'Invalid email data' });
    }

    try {
      const analysis = await openAI.analyzeEmail(email);
      return { success: true, data: analysis };
    } catch (error) {
      request.log.error(error);
      return reply.status(500).send({ error: 'Failed to analyze email' });
    }
  });
}