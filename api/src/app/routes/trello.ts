// api/src/app/routes/trello.ts

import { FastifyInstance } from 'fastify';
import { TrelloService } from '../../services/trello.service';
import type { CreateTrelloCardRequest } from '@email-whatsapp-bridge/shared';

let trelloService: TrelloService;

function getTrelloService(): TrelloService {
  if (!trelloService) {
    trelloService = new TrelloService();
  }
  return trelloService;
}

export default async function (fastify: FastifyInstance) {
  // Protect all routes in this file
  fastify.addHook('preHandler', fastify.authenticate);

  /**
   * POST /api/trello/cards
   * Body: CreateTrelloCardRequest { listId, title, description }
   * Returns: TrelloCard
   */
  fastify.post<{ Body: CreateTrelloCardRequest }>('/cards', async (request, reply) => {
    const body = request.body;

    if (!body?.listId || !body?.title) {
      return reply.status(400).send({
        error: 'Invalid request',
        message: 'listId and title are required',
      });
    }

    try {
      const service = getTrelloService();
      const card = await service.createCard(body.listId, {
        title: body.title,
        description: body.description ?? '',
      });
      return reply.status(201).send({ success: true, data: card });
    } catch (error) {
      request.log.error(error);
      return reply.status(500).send({
        error: 'Failed to create Trello card',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  });
}
