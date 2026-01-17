/**
 * Shared Utility Functions
 *
 * Common utility functions used across frontend and backend
 */

/**
 * Formats a phone number to E.164 format
 * E.164 is the international phone number format: +[country code][number]
 *
 * @param phoneNumber - Phone number in various formats
 * @returns Formatted phone number or null if invalid
 *
 * @example
 * formatPhoneNumber('1234567890') // '+11234567890'
 * formatPhoneNumber('+1-234-567-8900') // '+12345678900'
 */
export function formatPhoneNumber(phoneNumber: string): string | null {
  // Remove all non-digit characters
  const digits = phoneNumber.replace(/\D/g, '');

  // If it starts with country code, ensure + prefix
  if (digits.length >= 10) {
    return `+${digits}`;
  }

  return null;
}

/**
 * Validates an email address format
 *
 * @param email - Email address to validate
 * @returns True if valid email format
 *
 * @example
 * isValidEmail('user@example.com') // true
 * isValidEmail('invalid-email') // false
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Truncates text to a specified length and adds ellipsis
 *
 * @param text - Text to truncate
 * @param maxLength - Maximum length before truncation
 * @returns Truncated text with ellipsis if needed
 *
 * @example
 * truncateText('This is a long message', 10) // 'This is a...'
 */
export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) {
    return text;
  }
  return text.slice(0, maxLength) + '...';
}

/**
 * Formats a date string to a human-readable format
 *
 * @param dateString - ISO date string
 * @returns Formatted date string
 *
 * @example
 * formatDate('2024-01-15T10:30:00Z') // 'Jan 15, 2024 at 10:30 AM'
 */
export function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
}

/**
 * Sanitizes text for WhatsApp message sending
 * Removes potentially problematic characters and formatting
 *
 * @param text - Text to sanitize
 * @returns Sanitized text safe for WhatsApp
 */
export function sanitizeForWhatsApp(text: string): string {
  // Remove HTML tags
  let sanitized = text.replace(/<[^>]*>/g, '');

  // Decode common HTML entities
  sanitized = sanitized
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");

  // Normalize whitespace
  sanitized = sanitized.replace(/\s+/g, ' ').trim();

  return sanitized;
}

/**
 * Extracts the domain from an email address
 *
 * @param email - Email address
 * @returns Domain part of the email
 *
 * @example
 * getEmailDomain('user@example.com') // 'example.com'
 */
export function getEmailDomain(email: string): string {
  const parts = email.split('@');
  return parts.length === 2 ? parts[1] : '';
}

/**
 * Checks if current time is within quiet hours
 *
 * @param quietHoursStart - Start time in HH:MM format
 * @param quietHoursEnd - End time in HH:MM format
 * @returns True if currently in quiet hours
 */
export function isInQuietHours(
  quietHoursStart: string,
  quietHoursEnd: string
): boolean {
  const now = new Date();
  const currentMinutes = now.getHours() * 60 + now.getMinutes();

  const [startHour, startMin] = quietHoursStart.split(':').map(Number);
  const startMinutes = startHour * 60 + startMin;

  const [endHour, endMin] = quietHoursEnd.split(':').map(Number);
  const endMinutes = endHour * 60 + endMin;

  // Handle overnight quiet hours (e.g., 22:00 to 08:00)
  if (startMinutes > endMinutes) {
    return currentMinutes >= startMinutes || currentMinutes <= endMinutes;
  }

  return currentMinutes >= startMinutes && currentMinutes <= endMinutes;
}

/**
 * Builds a Gmail API query string from filters
 *
 * @param filters - Email filter criteria
 * @returns Gmail API query string
 *
 * @example
 * buildGmailQuery({ isUnread: true, from: 'boss@company.com' })
 * // 'is:unread from:boss@company.com'
 */
export function buildGmailQuery(filters: {
  isUnread?: boolean;
  label?: string;
  from?: string;
  subject?: string;
  after?: string;
  before?: string;
  hasAttachment?: boolean;
}): string {
  const queryParts: string[] = [];

  if (filters.isUnread) {
    queryParts.push('is:unread');
  }

  if (filters.label) {
    queryParts.push(`label:${filters.label}`);
  }

  if (filters.from) {
    queryParts.push(`from:${filters.from}`);
  }

  if (filters.subject) {
    queryParts.push(`subject:${filters.subject}`);
  }

  if (filters.after) {
    queryParts.push(`after:${filters.after}`);
  }

  if (filters.before) {
    queryParts.push(`before:${filters.before}`);
  }

  if (filters.hasAttachment) {
    queryParts.push('has:attachment');
  }

  return queryParts.join(' ');
}

/**
 * Generates a random ID string
 *
 * @returns Random alphanumeric string
 */
export function generateId(): string {
  return Math.random().toString(36).substring(2, 15) +
    Math.random().toString(36).substring(2, 15);
}
