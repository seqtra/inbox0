#!/bin/bash

##
# LocalStack Initialization Script
#
# This script runs when LocalStack starts and sets up AWS resources
# for local development. It creates:
# - S3 buckets for email attachments
# - SQS queues for async processing
# - Secrets for API keys
##

echo "🚀 Initializing LocalStack resources..."

# Wait for LocalStack to be fully ready
echo "⏳ Waiting for LocalStack to be ready..."
while ! awslocal s3 ls > /dev/null 2>&1; do
  sleep 1
done

echo "✅ LocalStack is ready!"

# =====================
# S3 Buckets
# =====================
echo "📦 Creating S3 buckets..."

# Bucket for email attachments
awslocal s3 mb s3://email-attachments 2>/dev/null || echo "  ✓ Bucket 'email-attachments' already exists"

# Bucket for processed emails (archive)
awslocal s3 mb s3://email-archive 2>/dev/null || echo "  ✓ Bucket 'email-archive' already exists"

# Configure bucket policies (public read for attachments)
awslocal s3api put-bucket-cors --bucket email-attachments --cors-configuration '{
  "CORSRules": [{
    "AllowedOrigins": ["*"],
    "AllowedMethods": ["GET", "HEAD"],
    "AllowedHeaders": ["*"],
    "MaxAgeSeconds": 3600
  }]
}' 2>/dev/null || echo "  ✓ CORS already configured"

echo "✅ S3 buckets created!"

# =====================
# SQS Queues
# =====================
echo "📬 Creating SQS queues..."

# Queue for processing new emails
awslocal sqs create-queue --queue-name email-processing-queue 2>/dev/null || echo "  ✓ Queue 'email-processing-queue' already exists"

# Dead letter queue for failed messages
awslocal sqs create-queue --queue-name email-processing-dlq 2>/dev/null || echo "  ✓ Queue 'email-processing-dlq' already exists"

# Queue for sending WhatsApp messages
awslocal sqs create-queue --queue-name whatsapp-sending-queue 2>/dev/null || echo "  ✓ Queue 'whatsapp-sending-queue' already exists"

echo "✅ SQS queues created!"

# =====================
# Secrets Manager
# =====================
echo "🔐 Creating secrets..."

# Create secret for Gmail API credentials (if not exists)
awslocal secretsmanager create-secret \
  --name gmail-api-credentials \
  --secret-string '{"clientId":"placeholder","clientSecret":"placeholder"}' \
  2>/dev/null || echo "  ✓ Secret 'gmail-api-credentials' already exists"

# Create secret for Twilio credentials (if not exists)
awslocal secretsmanager create-secret \
  --name twilio-credentials \
  --secret-string '{"accountSid":"placeholder","authToken":"placeholder","whatsappNumber":"placeholder"}' \
  2>/dev/null || echo "  ✓ Secret 'twilio-credentials' already exists"

echo "✅ Secrets created!"

# =====================
# Display Resources
# =====================
echo ""
echo "📋 LocalStack Resources Summary:"
echo "--------------------------------"
echo "S3 Buckets:"
awslocal s3 ls
echo ""
echo "SQS Queues:"
awslocal sqs list-queues
echo ""
echo "Secrets:"
awslocal secretsmanager list-secrets --query 'SecretList[*].Name' --output text
echo ""
echo "✅ LocalStack initialization complete!"
echo "🌐 LocalStack endpoint: http://localhost:4566"
