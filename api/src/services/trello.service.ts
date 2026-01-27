/**
 * Trello Service
 *
 * Handles interactions with the Trello REST API:
 * - Creating cards on a list
 * - Uses API key + token authentication (from env)
 *
 * @see https://developer.atlassian.com/cloud/trello/rest/api-group-cards/
 */

import type { TrelloCard, CreateTrelloCardRequest } from '@email-whatsapp-bridge/shared';

const TRELLO_API_KEY = process.env.TRELLO_API_KEY || '';
const TRELLO_TOKEN = process.env.TRELLO_TOKEN || '';
const TRELLO_BASE = 'https://api.trello.com/1';

/**
 * Trello Service Class
 *
 * Provides methods for interacting with Trello boards/lists/cards.
 */
export class TrelloService {
  private apiKey: string;
  private token: string;

  /**
   * Initialize Trello client with credentials from environment
   */
  constructor() {
    if (!TRELLO_API_KEY || !TRELLO_TOKEN) {
      throw new Error(
        'Trello credentials not configured. Set TRELLO_API_KEY and TRELLO_TOKEN.'
      );
    }
    this.apiKey = TRELLO_API_KEY;
    this.token = TRELLO_TOKEN;
  }

  /**
   * Build query string for Trello API (key + token on every request)
   */
  private authParams(): string {
    return `key=${encodeURIComponent(this.apiKey)}&token=${encodeURIComponent(this.token)}`;
  }

  /**
   * Create a card on a Trello list
   *
   * @param listId - ID of the list (column) to create the card in
   * @param card - Card content: title and description
   * @returns Created Trello card
   */
  async createCard(
    listId: string,
    card: { title: string; description: string }
  ): Promise<TrelloCard> {
    try {
      const url = `${TRELLO_BASE}/cards?${this.authParams()}`;
      const body = {
        idList: listId,
        name: card.title,
        desc: card.description ?? '',
      };

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const text = await response.text();
        console.error('Trello API error:', response.status, text);
        throw new Error(`Trello API error: ${response.status} - ${text}`);
      }

      const data = (await response.json()) as Record<string, unknown>;
      return this.mapResponseToCard(data);
    } catch (error) {
      if (error instanceof Error) {
        console.error('Error creating Trello card:', error.message);
        throw error;
      }
      console.error('Error creating Trello card:', error);
      throw new Error('Failed to create Trello card');
    }
  }

  /**
   * Map Trello API response to our TrelloCard type
   */
  private mapResponseToCard(data: Record<string, unknown>): TrelloCard {
    return {
      id: data.id as string,
      name: (data.name as string) ?? '',
      desc: (data.desc as string) ?? '',
      idList: data.idList as string,
      url: (data.url as string) ?? '',
      shortUrl: (data.shortUrl as string) ?? '',
      closed: (data.closed as boolean) ?? false,
      dateLastActivity: (data.dateLastActivity as string) ?? new Date().toISOString(),
    };
  }
}
