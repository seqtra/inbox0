import { 
  User as PrismaUser, 
  UserPreferences as PrismaUserPreferences, 
  CronJob as PrismaCronJob,
  UsageStat as PrismaUsageStat,
  Account as PrismaAccount
} from '@prisma/client';

// ==========================================
// Database Models (Source: Prisma)
// ==========================================

// Re-export specific types to be used by Frontend and Backend
export type User = PrismaUser;
export type UserPreferences = PrismaUserPreferences;
export type CronJob = PrismaCronJob;
export type UsageStat = PrismaUsageStat;
export type Account = PrismaAccount;

// Extended User type including relations for Frontend use
export type UserWithPreferences = User & {
  preferences: UserPreferences | null;
  cronJob: CronJob | null;
};

// ==========================================
// External API Types (Gmail, WhatsApp, etc.)
// ==========================================

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

// ===== Trello Types =====

/**
 * Trello card (board item)
 */
export interface TrelloCard {
  id: string;
  name: string;
  desc: string;
  idList: string;
  url: string;
  shortUrl: string;
  closed: boolean;
  dateLastActivity: string;
}

/**
 * Trello list (column on a board)
 */
export interface TrelloList {
  id: string;
  name: string;
  idBoard: string;
  pos: number;
  closed: boolean;
}

/**
 * Trello API configuration
 */
export interface TrelloConfig {
  apiKey: string;
  token: string;
}

/**
 * Request body for creating a Trello card
 */
export interface CreateTrelloCardRequest {
  listId: string;
  title: string;
  description: string;
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