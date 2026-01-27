/**
 * Anthropic (Claude) implementation of AIService.
 */

import Anthropic from '@anthropic-ai/sdk';
import { z } from 'zod';
import type { Email, EmailSummary } from '@email-whatsapp-bridge/shared';
import type { AIService, ChatCompletionOptions, ChatCompletionResult } from './types';

const DEFAULT_MODEL = 'claude-sonnet-4-20250514';

function getApiKey(): string | undefined {
  return process.env.ANTHROPIC_API_KEY;
}

const EmailSummarySchema = z.object({
  summary: z.string(),
  priority: z.enum(['low', 'medium', 'high', 'urgent']),
  category: z.enum([
    'work',
    'personal',
    'newsletter',
    'promotional',
    'social',
    'finance',
    'travel',
    'other',
  ]),
  actionItems: z.array(z.string()),
  sentiment: z.enum(['positive', 'neutral', 'negative']),
});

export class AnthropicAIService implements AIService {
  private client: Anthropic;

  constructor() {
    const key = getApiKey();
    if (!key) {
      console.warn('⚠️ ANTHROPIC_API_KEY is not set. AI features will fail.');
    }
    this.client = new Anthropic({ apiKey: key ?? '' });
  }

  async chatCompletion(options: ChatCompletionOptions): Promise<ChatCompletionResult> {
    if (!getApiKey()) {
      throw new Error('Anthropic API key is missing');
    }

    const systemMessage = options.messages.find((m) => m.role === 'system');
    const otherMessages = options.messages.filter((m) => m.role !== 'system');

    const anthropicMessages: { role: 'user' | 'assistant'; content: string }[] = [];
    for (const m of otherMessages) {
      if (m.role === 'assistant') {
        anthropicMessages.push({ role: 'assistant', content: m.content });
      } else {
        anthropicMessages.push({ role: 'user', content: m.content });
      }
    }

    const system = systemMessage?.content;
    const messages =
      anthropicMessages.length > 0
        ? anthropicMessages
        : ([{ role: 'user' as const, content: 'Continue.' }] as const);

    const response = await this.client.messages.create({
      model: options.model ?? DEFAULT_MODEL,
      max_tokens: 4096,
      ...(system ? { system } : {}),
      messages: [...messages],
    });
    const text =
      response.content
        .filter((block): block is { type: 'text'; text: string } => block.type === 'text')
        .map((b) => b.text)
        .join('') ?? '';

    return {
      choices: [
        {
          message: { content: text },
        },
      ],
    };
  }

  async analyzeEmail(email: Email): Promise<EmailSummary> {
    try {
      if (!getApiKey()) {
        throw new Error('Anthropic API key is missing');
      }

      const emailContext = `
From: ${email.from}
Subject: ${email.subject}
Date: ${email.date}
Content: ${email.snippet}

${email.body.substring(0, 3000)}
(Content truncated to first 3000 chars.)
      `.trim();

      const systemPrompt = `You are an intelligent personal executive assistant. Analyze the following email and extract structured data.

Respond with a single JSON object only (no markdown, no code fence), with these exact keys:
- "summary": string, concise 1-2 sentence summary
- "priority": one of "low" | "medium" | "high" | "urgent"
- "category": one of "work" | "personal" | "newsletter" | "promotional" | "social" | "finance" | "travel" | "other"
- "actionItems": array of strings (specific tasks or actions)
- "sentiment": one of "positive" | "neutral" | "negative"`;

      const result = await this.chatCompletion({
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: emailContext },
        ],
        response_format: { type: 'json_object' },
      });

      const raw = result.choices[0]?.message?.content;
      if (!raw) {
        throw new Error('Empty AI response');
      }

      const parsed = JSON.parse(raw);
      const validated = EmailSummarySchema.parse(parsed);
      return {
        emailId: email.id,
        ...validated,
      };
    } catch (error) {
      console.error('Error analyzing email with Anthropic:', error);
      return {
        emailId: email.id,
        summary: 'Could not generate summary due to an error.',
        priority: 'medium',
        category: 'other',
        actionItems: [],
        sentiment: 'neutral',
      };
    }
  }
}
