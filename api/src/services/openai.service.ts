/**
 * OpenAI Service
 *
 * Handles AI analysis of emails using OpenAI's API.
 * Uses "Structured Outputs" to ensure the AI returns data strictly matching our schema.
 */

import OpenAI from 'openai';
import { z } from 'zod';
import { zodResponseFormat } from 'openai/helpers/zod';
import type { Email, EmailSummary } from '@email-whatsapp-bridge/shared';

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

// Define the Zod schema that matches our EmailSummary interface
const EmailSummarySchema = z.object({
  summary: z.string().describe("A concise 1-2 sentence summary of the email content."),
  priority: z.enum(['low', 'medium', 'high', 'urgent']).describe("The urgency/importance of the email."),
  category: z.enum([
    'work',
    'personal',
    'newsletter',
    'promotional',
    'social',
    'finance',
    'travel',
    'other'
  ]).describe("The classification category of the email."),
  actionItems: z.array(z.string()).describe("A list of specific tasks or actions required from this email."),
  sentiment: z.enum(['positive', 'neutral', 'negative']).describe("The overall tone/sentiment of the email.")
});

export class OpenAIService {
  private client: OpenAI;

  constructor() {
    if (!OPENAI_API_KEY) {
      console.warn('⚠️ OPENAI_API_KEY is not set. OpenAI features will fail.');
    }

    this.client = new OpenAI({
      apiKey: OPENAI_API_KEY,
    });
  }

  /**
   * Analyze an email to generate a summary, priority, and action items.
   *
   * @param email - The email object to analyze
   * @returns Structured analysis of the email
   */
  async analyzeEmail(email: Email): Promise<EmailSummary> {
    try {
      if (!OPENAI_API_KEY) {
        throw new Error('OpenAI API key is missing');
      }

      // Construct a clean prompt context
      const emailContext = `
        From: ${email.from}
        Subject: ${email.subject}
        Date: ${email.date}
        Content: ${email.snippet} \n ${email.body.substring(0, 3000)} 
        (Content truncated to first 3000 chars for efficiency)
      `.trim();

      const completion = await this.client.beta.chat.completions.parse({
        model: "gpt-4o-2024-08-06", // Use a model that supports Structured Outputs
        messages: [
          { 
            role: "system", 
            content: "You are an intelligent personal executive assistant. Analyze the following email and extract structured data including a summary, priority level, category, and action items." 
          },
          { 
            role: "user", 
            content: emailContext 
          },
        ],
        response_format: zodResponseFormat(EmailSummarySchema, "email_analysis"),
      });

      const result = completion.choices[0].message.parsed;

      if (!result) {
        throw new Error("Failed to parse AI response");
      }

      // Return combined result with the original emailId
      return {
        emailId: email.id,
        ...result,
      };

    } catch (error) {
      console.error('Error analyzing email with OpenAI:', error);
      // Fallback object in case of failure to prevent app crash
      return {
        emailId: email.id,
        summary: "Could not generate summary due to an error.",
        priority: 'medium',
        category: 'other',
        actionItems: [],
        sentiment: 'neutral'
      };
    }
  }
}