/**
 * Anthropic (Claude) implementation of AIService.
 */

import Anthropic from '@anthropic-ai/sdk';
import { z } from 'zod';
import type { Email, EmailSummary, InboxSummary, EmailCategory } from '@email-whatsapp-bridge/shared';
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

const InboxSummarySchema = z.object({
  summary: z.string(),
  highlights: z.array(z.string()),
  urgentItems: z.array(z.string()),
  categoryCounts: z.record(z.string(), z.number()),
  topSenders: z.array(z.string()),
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
  }

  async summarizeInbox(emails: Email[]): Promise<InboxSummary> {
    const defaultCategories: Record<EmailCategory, number> = {
      work: 0,
      personal: 0,
      newsletter: 0,
      promotional: 0,
      social: 0,
      finance: 0,
      travel: 0,
      other: 0,
    };

    if (!getApiKey()) {
      throw new Error('Anthropic API key is missing');
    }

    if (emails.length === 0) {
      return {
        totalEmails: 0,
        summary: 'No emails to summarize.',
        highlights: [],
        urgentItems: [],
        categoryCounts: defaultCategories,
        topSenders: [],
        generatedAt: new Date().toISOString(),
      };
    }

    // Build a condensed view of all emails for the AI
    const emailsContext = emails
      .map(
        (email, idx) =>
          `[${idx + 1}] From: ${email.from} | Subject: ${email.subject} | Date: ${email.date}\nSnippet: ${email.snippet.substring(0, 200)}`
      )
      .join('\n\n');

    const systemPrompt = `You are an intelligent executive assistant. Analyze the following list of emails and provide a comprehensive inbox digest.

Respond with a single JSON object only (no markdown, no code fence), with these exact keys:
- "summary": string, a 2-3 sentence overview of the inbox state and key themes
- "highlights": array of strings, 3-5 most important items or themes from these emails
- "urgentItems": array of strings, any time-sensitive or urgent matters that need immediate attention
- "categoryCounts": object with counts for each category (work, personal, newsletter, promotional, social, finance, travel, other)
- "topSenders": array of strings, the top 3-5 most frequent or important senders`;

    const result = await this.chatCompletion({
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: `Here are ${emails.length} recent emails:\n\n${emailsContext}` },
      ],
      response_format: { type: 'json_object' },
    });

    const raw = result.choices[0]?.message?.content;
    if (!raw) {
      throw new Error('Empty AI response');
    }

    const parsed = JSON.parse(raw);
    const validated = InboxSummarySchema.parse(parsed);

    return {
      totalEmails: emails.length,
      summary: validated.summary,
      highlights: validated.highlights,
      urgentItems: validated.urgentItems,
      categoryCounts: { ...defaultCategories, ...validated.categoryCounts } as Record<EmailCategory, number>,
      topSenders: validated.topSenders,
      generatedAt: new Date().toISOString(),
    };
  }
}
