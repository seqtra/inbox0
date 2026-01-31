// api/src/app/routes/emails.ts

import { PrismaClient } from '@prisma/client';
import { FastifyInstance } from 'fastify';
import { GmailService } from '../../services/gmail.service';
import { getAIService } from '../../services/ai';
import type { Email } from '@email-whatsapp-bridge/shared';

const prisma = new PrismaClient();

/** Get Google OAuth tokens for a user from the Account table */
async function getGoogleTokens(userId: string): Promise<{
  access_token: string;
  refresh_token: string | null;
} | null> {
  const account = await prisma.account.findFirst({
    where: {
      userId,
      provider: 'google',
    },
  });
  if (!account?.access_token) {
    return null;
  }
  return {
    access_token: account.access_token,
    refresh_token: account.refresh_token ?? null,
  };
}

export default async function (fastify: FastifyInstance) {
  fastify.addHook('preHandler', fastify.authenticate);

  /**
   * GET /api/emails
   * Returns the authenticated user's emails from Gmail (last 10).
   */
  fastify.get('/', async (request, reply) => {
    const userId = request.user?.id;
    if (!userId) {
      return reply.status(401).send({ error: 'Unauthorized' });
    }

    const tokens = await getGoogleTokens(userId);
    if (!tokens) {
      return reply.status(400).send({
        error: 'Google account not linked.',
        message: 'Sign in with Google to access your emails.',
      });
    }

    try {
      const gmailService = new GmailService(
        tokens.access_token,
        tokens.refresh_token ?? undefined
      );
      const emails = await gmailService.fetchEmails(undefined, 10);
      return { success: true, data: emails };
    } catch (error) {
      request.log.error(error);
      return reply.status(500).send({ error: 'Failed to fetch emails from Gmail' });
    }
  });

  /**
   * POST /api/emails/sync
   * Syncs emails from Gmail (fetches last 20). Returns count for now.
   */
  fastify.post('/sync', async (request, reply) => {
    const userId = request.user?.id;
    if (!userId) {
      return reply.status(401).send({ error: 'Unauthorized' });
    }

    const tokens = await getGoogleTokens(userId);
    if (!tokens) {
      return reply.status(400).send({
        error: 'Google account not linked.',
        message: 'Sign in with Google to sync your emails.',
      });
    }

    try {
      const gmailService = new GmailService(
        tokens.access_token,
        tokens.refresh_token ?? undefined
      );
      const emails = await gmailService.fetchEmails(undefined, 20);
      return { success: true, data: { count: emails.length } };
    } catch (error) {
      request.log.error(error);
      return reply.status(500).send({ error: 'Failed to sync emails from Gmail' });
    }
  });

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
      const analysis = await getAIService().analyzeEmail(email);
      return { success: true, data: analysis };
    } catch (error) {
      request.log.error(error);
      return reply.status(500).send({ error: 'Failed to analyze email' });
    }
  });

  /**
   * POST /api/emails/summarize
   * Fetches the last 20 emails and generates an AI-powered inbox digest.
   * Returns: InboxSummary
   */
  fastify.post('/summarize', async (request, reply) => {
    const userId = request.user?.id;
    if (!userId) {
      return reply.status(401).send({ error: 'Unauthorized' });
    }

    const tokens = await getGoogleTokens(userId);
    if (!tokens) {
      return reply.status(400).send({
        error: 'Google account not linked.',
        message: 'Sign in with Google to summarize your emails.',
      });
    }

    try {
      const gmailService = new GmailService(
        tokens.access_token,
        tokens.refresh_token ?? undefined
      );
      const emails = await gmailService.fetchEmails(undefined, 20);
      const summary = await getAIService().summarizeInbox(emails);
      return { success: true, data: summary };
    } catch (error) {
      request.log.error(error);
      return reply.status(500).send({ error: 'Failed to summarize inbox' });
    }
  });
}