/**
 * Twilio WhatsApp Service
 *
 * Handles sending WhatsApp messages via Twilio's WhatsApp API.
 *
 * How Twilio WhatsApp works:
 * 1. You get a WhatsApp-enabled Twilio phone number
 * 2. Users must opt-in by sending a message to your number first
 * 3. You can then send messages to opted-in users for 24 hours
 * 4. After 24 hours, user needs to opt-in again (unless using templates)
 *
 * Learn more: https://www.twilio.com/docs/whatsapp
 */

import twilio from 'twilio';
import type {
  WhatsAppMessage,
  SendWhatsAppMessageRequest,
  WhatsAppMessageStatus,
} from '@email-whatsapp-bridge/shared';
import { formatPhoneNumber, sanitizeForWhatsApp } from '@email-whatsapp-bridge/shared';

// Twilio credentials from environment variables
const TWILIO_ACCOUNT_SID = process.env.TWILIO_ACCOUNT_SID || '';
const TWILIO_AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN || '';
const TWILIO_WHATSAPP_NUMBER = process.env.TWILIO_WHATSAPP_NUMBER || 'whatsapp:+14155238886';

/**
 * Twilio WhatsApp Service Class
 *
 * Provides methods for sending WhatsApp messages through Twilio.
 */
export class TwilioService {
  private client: twilio.Twilio;

  /**
   * Initialize Twilio client with credentials
   */
  constructor() {
    if (!TWILIO_ACCOUNT_SID || !TWILIO_AUTH_TOKEN) {
      throw new Error('Twilio credentials not configured. Set TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN.');
    }

    this.client = twilio(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN);
  }

  /**
   * Send a WhatsApp message to a user
   *
   * @param request - Message details (to, message, emailId)
   * @returns WhatsApp message object with Twilio message SID
   */
  async sendMessage(request: SendWhatsAppMessageRequest): Promise<WhatsAppMessage> {
    try {
      // Format phone number to E.164 format
      const formattedNumber = formatPhoneNumber(request.to);
      if (!formattedNumber) {
        throw new Error(`Invalid phone number: ${request.to}`);
      }

      // Sanitize message content
      const sanitizedMessage = sanitizeForWhatsApp(request.message);

      // WhatsApp numbers must be prefixed with 'whatsapp:'
      const toWhatsApp = `whatsapp:${formattedNumber}`;

      // Send message via Twilio
      const message = await this.client.messages.create({
        from: TWILIO_WHATSAPP_NUMBER,
        to: toWhatsApp,
        body: sanitizedMessage,
      });

      // Return our WhatsApp message format
      return {
        id: message.sid, // Use Twilio SID as our ID initially
        to: formattedNumber,
        from: TWILIO_WHATSAPP_NUMBER.replace('whatsapp:', ''),
        body: sanitizedMessage,
        status: this.mapTwilioStatus(message.status),
        timestamp: new Date().toISOString(),
        emailId: request.emailId,
      };
    } catch (error) {
      console.error('Error sending WhatsApp message:', error);
      throw new Error('Failed to send WhatsApp message');
    }
  }

  /**
   * Send email notification as WhatsApp message
   *
   * Formats an email into a WhatsApp-friendly message
   *
   * @param to - Recipient phone number
   * @param email - Email object to send
   * @returns WhatsApp message object
   */
  async sendEmailNotification(
    to: string,
    email: { subject: string; from: string; snippet: string; id: string }
  ): Promise<WhatsAppMessage> {
    // Format email as WhatsApp message
    const message = this.formatEmailForWhatsApp(email);

    return this.sendMessage({
      to,
      message,
      emailId: email.id,
    });
  }

  /**
   * Format email into WhatsApp message
   *
   * @param email - Email details
   * @returns Formatted message string
   */
  private formatEmailForWhatsApp(email: {
    subject: string;
    from: string;
    snippet: string;
  }): string {
    return `
📧 *New Email*

*From:* ${email.from}
*Subject:* ${email.subject}

${email.snippet}
    `.trim();
  }

  /**
   * Get message status from Twilio
   *
   * Useful for checking delivery status of sent messages
   *
   * @param messageSid - Twilio message SID
   * @returns Message status
   */
  async getMessageStatus(messageSid: string): Promise<WhatsAppMessageStatus> {
    try {
      const message = await this.client.messages(messageSid).fetch();
      return this.mapTwilioStatus(message.status);
    } catch (error) {
      console.error(`Error fetching message status for ${messageSid}:`, error);
      throw new Error('Failed to fetch message status');
    }
  }

  /**
   * Map Twilio message status to our status enum
   *
   * Twilio statuses:
   * - queued: Message accepted but not yet sent
   * - sending: Currently sending
   * - sent: Successfully sent to carrier
   * - delivered: Delivered to recipient's device
   * - undelivered: Failed to deliver
   * - failed: Failed at any stage
   *
   * @param twilioStatus - Status from Twilio API
   * @returns Our WhatsApp message status
   */
  private mapTwilioStatus(twilioStatus: string): WhatsAppMessageStatus {
    const statusMap: Record<string, WhatsAppMessageStatus> = {
      queued: 'queued',
      sending: 'sending',
      sent: 'sent',
      delivered: 'delivered',
      read: 'read',
      undelivered: 'undelivered',
      failed: 'failed',
    };

    return statusMap[twilioStatus] || 'failed';
  }

  /**
   * Send a digest of multiple emails
   *
   * Useful for digest mode where we batch notifications
   *
   * @param to - Recipient phone number
   * @param emails - Array of emails to include in digest
   * @returns WhatsApp message object
   */
  async sendEmailDigest(
    to: string,
    emails: Array<{ subject: string; from: string; id: string }>
  ): Promise<WhatsAppMessage> {
    // Format digest message
    const message = `
📧 *Email Digest* - ${emails.length} new emails

${emails
  .slice(0, 5) // Limit to 5 emails to avoid WhatsApp message length limits
  .map(
    (email, index) => `
${index + 1}. *${email.subject}*
   From: ${email.from}
`
  )
  .join('\n')}

${emails.length > 5 ? `\n...and ${emails.length - 5} more emails` : ''}
    `.trim();

    return this.sendMessage({
      to,
      message,
    });
  }

  /**
   * Validate WhatsApp number is opted-in
   *
   * Note: This requires storing opt-in status in your database.
   * Twilio doesn't provide an API to check opt-in status.
   *
   * @param phoneNumber - Phone number to validate
   * @returns True if opted-in (placeholder implementation)
   */
  async isOptedIn(phoneNumber: string): Promise<boolean> {
    // TODO: Implement actual opt-in checking via database
    // For now, assume all numbers are opted-in
    return true;
  }

  /**
   * Get account balance
   *
   * Useful for monitoring Twilio credit usage
   *
   * @returns Account balance in USD
   */
  async getAccountBalance(): Promise<number> {
    try {
      const account = await this.client.balance.fetch();
      return parseFloat(account.balance);
    } catch (error) {
      console.error('Error fetching account balance:', error);
      throw new Error('Failed to fetch Twilio account balance');
    }
  }
}
