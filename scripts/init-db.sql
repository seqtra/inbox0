--
-- Database Initialization Script
--
-- This script creates the initial database schema for the Email-WhatsApp Bridge.
-- It's automatically run when PostgreSQL container starts for the first time.
--

-- Enable UUID extension for generating unique IDs
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================
-- Users Table
-- =====================
-- Stores user accounts and authentication information
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email VARCHAR(255) UNIQUE NOT NULL,
  phone_number VARCHAR(20) NOT NULL,
  is_active BOOLEAN DEFAULT true,

  -- Gmail OAuth tokens (encrypted in production!)
  gmail_access_token TEXT,
  gmail_refresh_token TEXT,

  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,

  -- Indexes for common queries
  CONSTRAINT email_valid CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$')
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_is_active ON users(is_active);

-- =====================
-- User Preferences Table
-- =====================
-- Stores notification preferences and settings for each user
CREATE TABLE IF NOT EXISTS user_preferences (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  -- Notification settings
  notify_on_new_email BOOLEAN DEFAULT true,
  notify_on_specific_senders TEXT[], -- Array of email addresses
  notify_on_labels TEXT[], -- Array of Gmail labels

  -- Digest mode settings
  digest_mode BOOLEAN DEFAULT false,
  digest_frequency VARCHAR(20) CHECK (digest_frequency IN ('hourly', 'daily', 'weekly')),

  -- Quiet hours (format: HH:MM)
  quiet_hours_start VARCHAR(5),
  quiet_hours_end VARCHAR(5),

  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,

  UNIQUE(user_id)
);

CREATE INDEX idx_user_preferences_user_id ON user_preferences(user_id);

-- =====================
-- Emails Table
-- =====================
-- Stores email metadata and content fetched from Gmail
CREATE TABLE IF NOT EXISTS emails (
  id VARCHAR(255) PRIMARY KEY, -- Gmail message ID
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  thread_id VARCHAR(255) NOT NULL,

  -- Email metadata
  subject TEXT,
  from_address VARCHAR(255) NOT NULL,
  to_address VARCHAR(255) NOT NULL,
  email_date TIMESTAMP WITH TIME ZONE NOT NULL,
  snippet TEXT,
  body TEXT,

  -- Gmail-specific fields
  labels TEXT[],
  is_read BOOLEAN DEFAULT false,
  has_attachments BOOLEAN DEFAULT false,

  -- Timestamps
  fetched_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_emails_user_id ON emails(user_id);
CREATE INDEX idx_emails_thread_id ON emails(thread_id);
CREATE INDEX idx_emails_from_address ON emails(from_address);
CREATE INDEX idx_emails_email_date ON emails(email_date DESC);
CREATE INDEX idx_emails_is_read ON emails(is_read);
CREATE INDEX idx_emails_labels ON emails USING GIN(labels);

-- =====================
-- WhatsApp Messages Table
-- =====================
-- Stores WhatsApp messages sent via Twilio
CREATE TABLE IF NOT EXISTS whatsapp_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  email_id VARCHAR(255) REFERENCES emails(id) ON DELETE SET NULL,

  -- Twilio message details
  twilio_message_sid VARCHAR(255) UNIQUE,
  to_number VARCHAR(20) NOT NULL,
  from_number VARCHAR(20) NOT NULL,
  body TEXT NOT NULL,

  -- Message status
  status VARCHAR(20) NOT NULL DEFAULT 'queued'
    CHECK (status IN ('queued', 'sending', 'sent', 'delivered', 'read', 'failed', 'undelivered')),

  -- Error information (if failed)
  error_code VARCHAR(50),
  error_message TEXT,

  -- Timestamps
  sent_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  delivered_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_whatsapp_messages_user_id ON whatsapp_messages(user_id);
CREATE INDEX idx_whatsapp_messages_email_id ON whatsapp_messages(email_id);
CREATE INDEX idx_whatsapp_messages_status ON whatsapp_messages(status);
CREATE INDEX idx_whatsapp_messages_sent_at ON whatsapp_messages(sent_at DESC);

-- =====================
-- Sync Logs Table
-- =====================
-- Tracks Gmail sync operations for monitoring and debugging
CREATE TABLE IF NOT EXISTS sync_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  -- Sync details
  sync_type VARCHAR(50) NOT NULL, -- 'manual', 'scheduled', 'webhook'
  emails_fetched INTEGER DEFAULT 0,
  new_emails INTEGER DEFAULT 0,

  -- Status
  status VARCHAR(20) NOT NULL DEFAULT 'started'
    CHECK (status IN ('started', 'completed', 'failed')),
  error_message TEXT,

  -- Timing
  started_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  completed_at TIMESTAMP WITH TIME ZONE,
  duration_ms INTEGER
);

CREATE INDEX idx_sync_logs_user_id ON sync_logs(user_id);
CREATE INDEX idx_sync_logs_started_at ON sync_logs(started_at DESC);
CREATE INDEX idx_sync_logs_status ON sync_logs(status);

-- =====================
-- Triggers for updated_at
-- =====================
-- Automatically update updated_at timestamp when records are modified

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_preferences_updated_at BEFORE UPDATE ON user_preferences
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_whatsapp_messages_updated_at BEFORE UPDATE ON whatsapp_messages
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================
-- Sample Data (Optional)
-- =====================
-- Uncomment to insert sample data for testing

-- INSERT INTO users (email, phone_number) VALUES
--   ('test@example.com', '+1234567890');

-- Get the user ID for preferences
-- WITH test_user AS (
--   SELECT id FROM users WHERE email = 'test@example.com'
-- )
-- INSERT INTO user_preferences (user_id, notify_on_new_email, digest_mode)
-- SELECT id, true, false FROM test_user;

COMMIT;
