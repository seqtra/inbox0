/**
 * Shared Types for Email-WhatsApp Bridge
 *
 * This file contains common TypeScript types and interfaces used across
 * both the frontend and backend applications.
 */

// ===== Email Types =====

/**
 * Represents an email from Gmail API
 */
export interface Email {
  id: string;
  threadId: string;
  subject: string;
  from: string;
  to: string;
  date: string;
  snippet: string;
  body: string;
  labels: string[];
  isRead: boolean;
  hasAttachments: boolean;
}

/**
 * Filters for querying emails
 */
export interface EmailFilters {
  isUnread?: boolean;
  label?: string;
  from?: string;
  subject?: string;
  after?: string;  // Date in YYYY/MM/DD format
  before?: string; // Date in YYYY/MM/DD format
  hasAttachment?: boolean;
}

// ===== WhatsApp Types =====

/**
 * Represents a WhatsApp message sent via Twilio
 */
export interface WhatsAppMessage {
  id: string;
  to: string;          // Phone number in E.164 format (+1234567890)
  from: string;        // Twilio WhatsApp number
  body: string;
  status: WhatsAppMessageStatus;
  timestamp: string;
  emailId?: string;    // Reference to the email this message relates to
}

/**
 * Status of a WhatsApp message in the Twilio pipeline
 */
export type WhatsAppMessageStatus =
  | 'queued'
  | 'sending'
  | 'sent'
  | 'delivered'
  | 'read'
  | 'failed'
  | 'undelivered';

/**
 * Request to send a WhatsApp message
 */
export interface SendWhatsAppMessageRequest {
  to: string;
  message: string;
  emailId?: string;
}

// ===== User Types =====

/**
 * User account with authentication and notification preferences
 */
export interface User {
  id: string;
  email: string;
  phoneNumber: string;
  isActive: boolean;
  gmailAccessToken?: string;
  gmailRefreshToken?: string;
  preferences: UserPreferences;
  createdAt: string;
  updatedAt: string;
}

/**
 * User notification preferences
 */
export interface UserPreferences {
  notifyOnNewEmail: boolean;
  notifyOnSpecificSenders: string[];
  notifyOnLabels: string[];
  digestMode: boolean;          // Send summary instead of individual emails
  digestFrequency?: 'hourly' | 'daily' | 'weekly';
  quietHoursStart?: string;     // HH:MM format
  quietHoursEnd?: string;       // HH:MM format
}

// ===== API Response Types =====

/**
 * Standard API response wrapper
 */
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: ApiError;
  timestamp: string;
}

/**
 * API error details
 */
export interface ApiError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
}

// ===== Email Analysis Types =====

/**
 * AI-generated summary of an email
 */
export interface EmailSummary {
  emailId: string;
  summary: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  category: EmailCategory;
  actionItems: string[];
  sentiment: 'positive' | 'neutral' | 'negative';
}

/**
 * Email categories for classification
 */
export type EmailCategory =
  | 'work'
  | 'personal'
  | 'newsletter'
  | 'promotional'
  | 'social'
  | 'finance'
  | 'travel'
  | 'other';

// ===== Configuration Types =====

/**
 * Gmail API configuration
 */
export interface GmailConfig {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
  scopes: string[];
}

/**
 * Twilio WhatsApp configuration
 */
export interface TwilioConfig {
  accountSid: string;
  authToken: string;
  whatsappNumber: string;
}

/**
 * Database configuration
 */
export interface DatabaseConfig {
  host: string;
  port: number;
  database: string;
  username: string;
  password: string;
  ssl: boolean;
}

/**
 * AWS configuration
 */
export interface AwsConfig {
  region: string;
  accessKeyId?: string;
  secretAccessKey?: string;
  useLocalStack: boolean;
  localStackEndpoint?: string;
}
