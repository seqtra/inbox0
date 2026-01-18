/**
 * Gmail Service
 *
 * Handles all Gmail API interactions including:
 * - OAuth2 authentication
 * - Fetching emails
 * - Parsing email content
 * - Managing Gmail labels
 *
 * Uses the Google APIs Node.js client library (googleapis)
 */

import { google, gmail_v1 } from 'googleapis';
import type { Email, EmailFilters } from '@email-whatsapp-bridge/shared';
import { buildGmailQuery } from '@email-whatsapp-bridge/shared';

// OAuth2 credentials from environment variables
const GMAIL_CLIENT_ID = process.env.GMAIL_CLIENT_ID || '';
const GMAIL_CLIENT_SECRET = process.env.GMAIL_CLIENT_SECRET || '';
const GMAIL_REDIRECT_URI = process.env.GMAIL_REDIRECT_URI || 'http://localhost:3000/api/auth/google/callback';/**
 * Gmail Service Class
 *
 * Provides methods for interacting with Gmail API.
 * Each instance is tied to a specific user's OAuth tokens.
 */
export class GmailService {
  private oauth2Client: any;
  private gmail: gmail_v1.Gmail;

  /**
   * Initialize Gmail service with user's OAuth tokens
   *
   * @param accessToken - OAuth2 access token
   * @param refreshToken - OAuth2 refresh token for renewing access
   */
  constructor(accessToken: string, refreshToken?: string) {
    // Create OAuth2 client with credentials
    this.oauth2Client = new google.auth.OAuth2(
      GMAIL_CLIENT_ID,
      GMAIL_CLIENT_SECRET,
      GMAIL_REDIRECT_URI
    );

    // Set user's tokens
    this.oauth2Client.setCredentials({
      access_token: accessToken,
      refresh_token: refreshToken,
    });

    // Initialize Gmail API client
    this.gmail = google.gmail({ version: 'v1', auth: this.oauth2Client });
  }

  /**
   * Generate OAuth2 authorization URL for user consent
   *
   * @returns URL to redirect user for Gmail authorization
   */
  static getAuthUrl(): string {
    const oauth2Client = new google.auth.OAuth2(
      GMAIL_CLIENT_ID,
      GMAIL_CLIENT_SECRET,
      GMAIL_REDIRECT_URI
    );

    // Define scopes (permissions) we need
    const scopes = [
      'https://www.googleapis.com/auth/gmail.readonly', // Read emails
      'https://www.googleapis.com/auth/gmail.labels',   // Read labels
      'https://www.googleapis.com/auth/userinfo.email', // Get user email
    ];

    return oauth2Client.generateAuthUrl({
      access_type: 'offline', // Get refresh token
      scope: scopes,
      prompt: 'consent', // Force consent screen to get refresh token
    });
  }

  /**
   * Exchange authorization code for access tokens
   *
   * @param code - Authorization code from OAuth callback
   * @returns Object with access_token and refresh_token
   */
  static async getTokensFromCode(code: string): Promise<{
    access_token: string;
    refresh_token: string;
    email: string;
  }> {
    const oauth2Client = new google.auth.OAuth2(
      GMAIL_CLIENT_ID,
      GMAIL_CLIENT_SECRET,
      GMAIL_REDIRECT_URI
    );

    // Exchange code for tokens
    const { tokens } = await oauth2Client.getToken(code);
    oauth2Client.setCredentials(tokens);

    // Get user email
    const oauth2 = google.oauth2({ version: 'v2', auth: oauth2Client });
    const userInfo = await oauth2.userinfo.get();

    return {
      access_token: tokens.access_token!,
      refresh_token: tokens.refresh_token!,
      email: userInfo.data.email!,
    };
  }

  /**
   * Fetch emails from Gmail based on filters
   *
   * @param filters - Criteria for filtering emails
   * @param maxResults - Maximum number of emails to fetch (default: 50)
   * @returns Array of parsed Email objects
   */
  async fetchEmails(filters?: EmailFilters, maxResults: number = 50): Promise<Email[]> {
    try {
      // Build Gmail query string from filters
      const query = filters ? buildGmailQuery(filters) : '';

      // List messages matching the query
      const response = await this.gmail.users.messages.list({
        userId: 'me',
        q: query,
        maxResults,
      });

      const messages = response.data.messages || [];

      // Fetch full details for each message
      const emails = await Promise.all(
        messages.map((message) => this.fetchEmailById(message.id!))
      );

      return emails.filter((email): email is Email => email !== null);
    } catch (error) {
      console.error('Error fetching emails:', error);
      throw new Error('Failed to fetch emails from Gmail');
    }
  }

  /**
   * Fetch a single email by ID
   *
   * @param messageId - Gmail message ID
   * @returns Parsed Email object or null if not found
   */
  async fetchEmailById(messageId: string): Promise<Email | null> {
    try {
      const response = await this.gmail.users.messages.get({
        userId: 'me',
        id: messageId,
        format: 'full', // Get full message details
      });

      const message = response.data;
      return this.parseGmailMessage(message);
    } catch (error) {
      console.error(`Error fetching email ${messageId}:`, error);
      return null;
    }
  }

  /**
   * Parse Gmail message into our Email format
   *
   * @param message - Raw Gmail message object
   * @returns Parsed Email object
   */
  private parseGmailMessage(message: gmail_v1.Schema$Message): Email {
    const headers = message.payload?.headers || [];

    // Helper to get header value
    const getHeader = (name: string): string => {
      const header = headers.find((h) => h.name?.toLowerCase() === name.toLowerCase());
      return header?.value || '';
    };

    // Extract plain text body
    const body = this.extractBody(message.payload);

    // Check if message has attachments
    const hasAttachments = this.hasAttachments(message.payload);

    return {
      id: message.id!,
      threadId: message.threadId!,
      subject: getHeader('subject'),
      from: getHeader('from'),
      to: getHeader('to'),
      date: getHeader('date'),
      snippet: message.snippet || '',
      body,
      labels: message.labelIds || [],
      isRead: !message.labelIds?.includes('UNREAD'),
      hasAttachments,
    };
  }

  /**
   * Extract plain text body from Gmail message payload
   *
   * Gmail uses a MIME structure that can be nested.
   * This recursively searches for the plain text part.
   *
   * @param payload - Gmail message payload
   * @returns Plain text body content
   */
  private extractBody(payload: gmail_v1.Schema$MessagePart | undefined): string {
    if (!payload) return '';

    // If this part has a body with data, decode it
    if (payload.body?.data) {
      return Buffer.from(payload.body.data, 'base64').toString('utf-8');
    }

    // If multipart, recursively check parts
    if (payload.parts) {
      // Prefer text/plain, fallback to text/html
      const textPart = payload.parts.find((part) => part.mimeType === 'text/plain');
      if (textPart) {
        return this.extractBody(textPart);
      }

      const htmlPart = payload.parts.find((part) => part.mimeType === 'text/html');
      if (htmlPart) {
        // Strip HTML tags (basic implementation)
        const html = this.extractBody(htmlPart);
        return html.replace(/<[^>]*>/g, '');
      }

      // Recursively check nested parts
      for (const part of payload.parts) {
        const body = this.extractBody(part);
        if (body) return body;
      }
    }

    return '';
  }

  /**
   * Check if message has attachments
   *
   * @param payload - Gmail message payload
   * @returns True if message has attachments
   */
  private hasAttachments(payload: gmail_v1.Schema$MessagePart | undefined): boolean {
    if (!payload) return false;

    // Check if this part is an attachment
    if (payload.filename && payload.filename.length > 0) {
      return true;
    }

    // Recursively check parts
    if (payload.parts) {
      return payload.parts.some((part) => this.hasAttachments(part));
    }

    return false;
  }

  /**
   * Get list of all labels in user's Gmail account
   *
   * @returns Array of label objects
   */
  async getLabels(): Promise<Array<{ id: string; name: string }>> {
    try {
      const response = await this.gmail.users.labels.list({
        userId: 'me',
      });

      return (response.data.labels || []).map((label) => ({
        id: label.id!,
        name: label.name!,
      }));
    } catch (error) {
      console.error('Error fetching labels:', error);
      throw new Error('Failed to fetch Gmail labels');
    }
  }
}
