/**
 * Model-agnostic AI service interface.
 * Implementations can use OpenAI, Anthropic, or other providers.
 */

import type { Email, EmailSummary } from '@email-whatsapp-bridge/shared';

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface ChatCompletionOptions {
  messages: ChatMessage[];
  response_format?: { type: 'json_object' | 'text' };
  model?: string;
}

export interface ChatCompletionResult {
  choices: Array<{
    message: {
      content?: string;
    };
  }>;
}

export interface AIService {
  analyzeEmail(email: Email): Promise<EmailSummary>;
  chatCompletion(options: ChatCompletionOptions): Promise<ChatCompletionResult>;
}
