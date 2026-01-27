import { AnthropicAIService } from './anthropic.service';
import type { Email } from '@email-whatsapp-bridge/shared';

const mockCreate = jest.fn();

jest.mock('@anthropic-ai/sdk', () => ({
  __esModule: true,
  default: jest.fn().mockImplementation(() => ({
    messages: {
      create: mockCreate,
    },
  })),
}));

describe('AnthropicAIService', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.clearAllMocks();
    process.env = { ...originalEnv, ANTHROPIC_API_KEY: 'test-key' };
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  describe('chatCompletion', () => {
    it('returns choices shape compatible with existing consumers', async () => {
      mockCreate.mockResolvedValue({
        content: [{ type: 'text', text: 'Hello' }],
      });

      const service = new AnthropicAIService();
      const result = await service.chatCompletion({
        messages: [{ role: 'user', content: 'Hi' }],
      });

      expect(result.choices).toHaveLength(1);
      expect(result.choices[0].message.content).toBe('Hello');
      expect(mockCreate).toHaveBeenCalled();
    });

    it('throws when API key is missing', async () => {
      process.env.ANTHROPIC_API_KEY = '';
      const service = new AnthropicAIService();
      await expect(
        service.chatCompletion({ messages: [{ role: 'user', content: 'Hi' }] })
      ).rejects.toThrow('Anthropic API key is missing');
    });
  });

  describe('analyzeEmail', () => {
    const stubEmail: Email = {
      id: 'id1',
      threadId: 't1',
      subject: 'Test',
      from: 'a@b.com',
      to: 'c@d.com',
      date: 'Wed, 1 Jan 2025 00:00:00',
      snippet: 'Snippet',
      body: 'Body text',
      labels: [],
      isRead: false,
      hasAttachments: false,
    };

    it('returns valid EmailSummary when API returns valid JSON', async () => {
      mockCreate.mockResolvedValue({
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              summary: 'A summary',
              priority: 'high',
              category: 'work',
              actionItems: ['Reply'],
              sentiment: 'neutral',
            }),
          },
        ],
      });

      const service = new AnthropicAIService();
      const result = await service.analyzeEmail(stubEmail);

      expect(result.emailId).toBe('id1');
      expect(result.summary).toBe('A summary');
      expect(result.priority).toBe('high');
      expect(result.category).toBe('work');
      expect(result.actionItems).toEqual(['Reply']);
      expect(result.sentiment).toBe('neutral');
    });

    it('returns fallback EmailSummary when API throws', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      mockCreate.mockRejectedValue(new Error('Network error'));

      const service = new AnthropicAIService();
      const result = await service.analyzeEmail(stubEmail);
      consoleSpy.mockRestore();

      expect(result.emailId).toBe('id1');
      expect(result.summary).toContain('Could not generate summary');
      expect(result.priority).toBe('medium');
      expect(result.category).toBe('other');
      expect(result.actionItems).toEqual([]);
      expect(result.sentiment).toBe('neutral');
    });
  });
});
