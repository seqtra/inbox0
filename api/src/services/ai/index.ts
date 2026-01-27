/**
 * AI service factory. Returns the configured provider (default: Anthropic).
 */

import type { AIService } from './types';
import { AnthropicAIService } from './anthropic.service';

let instance: AIService | null = null;

export function getAIService(): AIService {
  if (!instance) {
    instance = new AnthropicAIService();
  }
  return instance;
}

export type { AIService, ChatCompletionOptions, ChatCompletionResult, ChatMessage } from './types';
export { AnthropicAIService } from './anthropic.service';
