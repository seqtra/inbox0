import { TrendService } from './trend.service';
import type { AIService } from './ai/types';

const mockParseURL = jest.fn();

jest.mock('rss-parser', () => {
  return jest.fn().mockImplementation(() => ({
    parseURL: mockParseURL,
  }));
});

describe('TrendService', () => {
  const mockAI: AIService = {
    analyzeEmail: jest.fn(),
    chatCompletion: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockParseURL.mockResolvedValue({
      items: [
        { title: 'email productivity tips for busy executives', link: 'https://example.com/1' },
        { title: 'inbox zero strategies that work', link: 'https://example.com/2' },
      ],
    });
  });

  it('findNewTopics returns relevant_stories from AI response', async () => {
    const storiesPayload = JSON.stringify({
      relevant_stories: [
        {
          original_headline: 'Headline',
          blog_idea_title: 'Blog idea',
          angle: 'Angle',
          source_url: 'https://example.com',
          relevance_score: 8,
        },
      ],
    });
    (mockAI.chatCompletion as jest.Mock).mockResolvedValue({
      choices: [{ message: { content: storiesPayload } }],
    });

    const service = new TrendService(mockAI);
    const result = await service.findNewTopics();

    expect(result.relevant_stories).toHaveLength(1);
    expect(result.relevant_stories[0].original_headline).toBe('Headline');
    expect(result.relevant_stories[0].relevance_score).toBe(8);
  });

  it('findNewTopics returns empty array when AI returns no relevant stories', async () => {
    (mockAI.chatCompletion as jest.Mock).mockResolvedValue({
      choices: [
        {
          message: {
            content: JSON.stringify({ relevant_stories: [] }),
          },
        },
      ],
    });

    const service = new TrendService(mockAI);
    const result = await service.findNewTopics();

    expect(result.relevant_stories).toEqual([]);
  });

  it('findNewTopics returns empty array when AI throws', async () => {
    (mockAI.chatCompletion as jest.Mock).mockRejectedValue(new Error('API error'));

    const service = new TrendService(mockAI);
    const result = await service.findNewTopics();

    expect(result.relevant_stories).toEqual([]);
  });

  it('findNewTopics filters out stories with relevance_score < 7', async () => {
    const payload = JSON.stringify({
      relevant_stories: [
        { original_headline: 'High', blog_idea_title: 'B', angle: 'A', relevance_score: 8 },
        { original_headline: 'Low', blog_idea_title: 'B', angle: 'A', relevance_score: 5 },
      ],
    });
    (mockAI.chatCompletion as jest.Mock).mockResolvedValue({
      choices: [{ message: { content: payload } }],
    });

    const service = new TrendService(mockAI);
    const result = await service.findNewTopics();

    expect(result.relevant_stories).toHaveLength(1);
    expect(result.relevant_stories[0].original_headline).toBe('High');
  });
});
