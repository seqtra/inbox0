# Email-WhatsApp Bridge

A full-stack application that analyzes emails from Gmail and delivers notifications via WhatsApp using Twilio. Built with modern technologies and deployed on AWS.

## Table of Contents

- [Overview](#overview)
- [Architecture](#architecture)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Prerequisites](#prerequisites)
- [Getting Started](#getting-started)
- **[Full setup guide (frontend, backend, Postgres, sign-in, admin)](SETUP.md)** — step-by-step for running and testing everything locally
- [Development](#development)
- [Deployment](#deployment)
- [Learning Resources](#learning-resources)
- [API Documentation](#api-documentation)

## Overview

This application bridges your Gmail inbox with WhatsApp notifications:

1. **Email Sync**: Fetches emails from Gmail using OAuth2 authentication
2. **Analysis**: Processes and categorizes emails
3. **Notification**: Sends summaries via WhatsApp through Twilio
4. **Management**: Web interface to configure preferences and view history

Perfect for staying on top of important emails while on the go!

## Architecture

```
┌─────────────────┐
│   User's Gmail  │
└────────┬────────┘
         │ Gmail API
         ↓
┌─────────────────┐      ┌──────────────┐
│  Fastify API    │←────→│  PostgreSQL  │
│  (Backend)      │      │  Database    │
└────────┬────────┘      └──────────────┘
         │
         │ REST API
         ↓
┌─────────────────┐
│   Next.js       │
│   Frontend      │
└─────────────────┘

         ↓ Twilio API
┌─────────────────┐
│    WhatsApp     │
│    (User)       │
└─────────────────┘
```

### Data Flow

1. User authenticates with Gmail OAuth2
2. Backend periodically fetches new emails
3. Emails stored in PostgreSQL
4. Backend sends WhatsApp notifications via Twilio
5. User manages preferences through web interface

## Tech Stack

### Frontend
- **Next.js 14**: React framework with App Router
- **TypeScript**: Type-safe development
- **shadcn/ui**: Beautiful UI components built on Radix UI
- **Tailwind CSS**: Utility-first styling
- **Redux Toolkit**: State management
- **RTK Query**: Data fetching and caching

### Backend
- **Fastify**: Fast Node.js web framework
- **TypeScript**: Type-safe development
- **PostgreSQL**: Relational database
- **Gmail API**: Google APIs Node.js client
- **Twilio**: WhatsApp messaging

### Infrastructure
- **Docker**: Containerization
- **Docker Compose**: Local orchestration
- **Terraform**: Infrastructure as Code for AWS
- **LocalStack**: Local AWS cloud simulation
- **AWS Services**: ECS, RDS, ALB, S3, SQS

### Monorepo
- **NX**: Build system and monorepo tools
- **Shared Library**: Common types and utilities

## Project Structure

```
email-whatsapp-bridge/
├── apps/
│   ├── frontend/              # Next.js application
│   │   ├── src/
│   │   │   ├── app/           # Next.js App Router pages
│   │   │   ├── components/    # React components
│   │   │   ├── store/         # Redux store and RTK Query
│   │   │   └── lib/           # Utilities
│   │   └── Dockerfile
│   └── frontend-e2e/          # E2E tests
│
├── api/                       # Fastify backend
│   ├── src/
│   │   ├── app/              # Fastify app configuration
│   │   ├── services/         # Gmail, Twilio services
│   │   └── main.ts           # Entry point
│   └── Dockerfile
│
├── libs/
│   └── shared/               # Shared TypeScript library
│       └── src/
│           ├── lib/
│           │   ├── types.ts  # Common type definitions
│           │   └── utils.ts  # Shared utilities
│           └── index.ts
│
├── terraform/                # AWS infrastructure
│   ├── modules/              # Terraform modules
│   ├── main.tf               # Main configuration
│   ├── variables.tf          # Input variables
│   └── outputs.tf            # Output values
│
├── scripts/                  # Helper scripts
│   └── init-db.sql          # Database schema
│
├── docker-compose.yml        # Local development stack
├── .env.example              # Environment variables template
└── README.md                 # This file
```

## Prerequisites

### Required

- **Node.js 20+**: [Download](https://nodejs.org/)
- **npm**: Comes with Node.js
- **Docker**: [Download](https://www.docker.com/products/docker-desktop)
- **Docker Compose**: Included with Docker Desktop

### For Gmail Integration

1. **Google Cloud Account**: [Sign up](https://console.cloud.google.com/)
2. **Gmail API enabled**: Enable in Google Cloud Console
3. **OAuth 2.0 Credentials**: Create in Google Cloud Console

### For WhatsApp Integration

1. **Twilio Account**: [Sign up](https://www.twilio.com/try-twilio)
2. **WhatsApp Sandbox**: Enable in Twilio Console
3. **Twilio Phone Number**: WhatsApp-enabled number

### For AWS Deployment (Optional)

1. **AWS Account**: [Sign up](https://aws.amazon.com/)
2. **AWS CLI**: [Install](https://aws.amazon.com/cli/)
3. **Terraform**: [Install](https://www.terraform.io/downloads)

## Getting Started

### 1. Clone the Repository

```bash
cd email-whatsapp-bridge
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Configure Environment Variables

Copy the example environment file:

```bash
cp .env.example .env
```

Edit `.env` and fill in your credentials:

```env
# Gmail API (from Google Cloud Console)
GMAIL_CLIENT_ID=your-client-id.apps.googleusercontent.com
GMAIL_CLIENT_SECRET=your-client-secret

# Twilio (from Twilio Console)
TWILIO_ACCOUNT_SID=your-account-sid
TWILIO_AUTH_TOKEN=your-auth-token
TWILIO_WHATSAPP_NUMBER=whatsapp:+14155238886

# Database
DATABASE_URL=postgresql://devuser:devpassword@localhost:5432/email_whatsapp_bridge

# JWT Secret (generate with: openssl rand -base64 32)
JWT_SECRET=your-secret-key
```

### 4. Start Services with Docker Compose

```bash
docker-compose up
```

This starts:
- PostgreSQL database (port 5432)
- LocalStack for AWS simulation (port 4566)
- Backend API (port 3000)
- Frontend (port 4200)

### 5. Access the Application

- **Frontend**: http://localhost:4200
- **API**: http://localhost:3000
- **LocalStack**: http://localhost:4566

## Development

### Running Individual Services

Instead of Docker Compose, you can run services individually:

```bash
# Start database only
docker-compose up postgres

# Run backend in dev mode
npx nx serve api

# Run frontend in dev mode
npx nx serve frontend
```

### Building the Project

```bash
# Build all apps
npm run build

# Build specific app
npx nx build api
npx nx build frontend

# Build shared library
npx nx build shared
```

### Testing

```bash
# Run all tests
npm run test

# Run specific tests
npx nx test api
npx nx test frontend
npx nx test shared
```

### Code Quality

```bash
# Lint all code
npm run lint

# Format code
npm run format

# Type check
npm run type-check
```

## Understanding the Codebase

### NX Monorepo

This project uses NX, a powerful build system for monorepos:

- **Apps**: Frontend and backend applications live in `apps/`
- **Libs**: Shared code lives in `libs/`
- **Task Caching**: NX caches build outputs for speed
- **Dependency Graph**: `npx nx graph` shows relationships

Learn more: [NX Documentation](https://nx.dev)

### Shared Library

The `libs/shared` library contains:

- **Types**: TypeScript interfaces used by both frontend and backend
- **Utilities**: Common functions (phone formatting, email validation, etc.)

Both apps import from `@email-whatsapp-bridge/shared`:

```typescript
import { Email, formatPhoneNumber } from '@email-whatsapp-bridge/shared';
```

### Redux & RTK Query

Frontend uses Redux Toolkit for state management:

- **Store**: `apps/frontend/src/store/index.ts`
- **API Slice**: `apps/frontend/src/store/api.ts` defines all endpoints
- **Hooks**: Auto-generated hooks like `useGetEmailsQuery()`

RTK Query automatically handles:
- Loading states
- Error handling
- Data caching
- Automatic refetching

Learn more: [RTK Query Docs](https://redux-toolkit.js.org/rtk-query/overview)

### shadcn/ui

UI components from shadcn/ui:

- **Customizable**: Components are copied to your project
- **Accessible**: Built on Radix UI primitives
- **Themeable**: Uses CSS variables for theming

Add new components:

```bash
npx shadcn-ui@latest add button
```

Learn more: [shadcn/ui Docs](https://ui.shadcn.com)

### Gmail API Integration

The Gmail service (`api/src/services/gmail.service.ts`):

1. **OAuth Flow**: User authenticates via Google
2. **Token Storage**: Access and refresh tokens stored in database
3. **Email Fetching**: Periodically polls for new emails
4. **Parsing**: Converts Gmail format to our Email type

Key concepts:
- **OAuth 2.0**: User grants permission to access Gmail
- **Refresh Tokens**: Long-lived tokens to renew access
- **Scopes**: Specific permissions (read emails, labels)

Learn more: [Gmail API Docs](https://developers.google.com/gmail/api)

### Twilio WhatsApp Integration

The Twilio service (`api/src/services/twilio.service.ts`):

1. **Opt-in**: Users must send a message to your Twilio number first
2. **24-Hour Window**: Can message users for 24 hours after opt-in
3. **Message Formatting**: Converts emails to WhatsApp format
4. **Status Tracking**: Monitors delivery status

Key concepts:
- **E.164 Format**: Phone numbers as +[country][number]
- **whatsapp: Prefix**: Twilio requires this prefix
- **Message Templates**: Pre-approved messages for 24hr+ window

Learn more: [Twilio WhatsApp Docs](https://www.twilio.com/docs/whatsapp)

## Deployment

### Prerequisites

1. Build and push Docker images to Amazon ECR:

```bash
# Login to ECR
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin <account-id>.dkr.ecr.us-east-1.amazonaws.com

# Build images
docker build -t email-whatsapp-api -f api/Dockerfile .
docker build -t email-whatsapp-frontend -f apps/frontend/Dockerfile .

# Tag images
docker tag email-whatsapp-api:latest <account-id>.dkr.ecr.us-east-1.amazonaws.com/email-whatsapp-api:latest
docker tag email-whatsapp-frontend:latest <account-id>.dkr.ecr.us-east-1.amazonaws.com/email-whatsapp-frontend:latest

# Push images
docker push <account-id>.dkr.ecr.us-east-1.amazonaws.com/email-whatsapp-api:latest
docker push <account-id>.dkr.ecr.us-east-1.amazonaws.com/email-whatsapp-frontend:latest
```

### Deploy with Terraform

```bash
cd terraform

# Configure variables
cp terraform.tfvars.example terraform.tfvars
# Edit terraform.tfvars with your values

# Initialize Terraform
terraform init

# Plan deployment
terraform plan

# Deploy infrastructure
terraform apply

# Get outputs (ALB URL, database endpoint, etc.)
terraform output
```

See [terraform/README.md](terraform/README.md) for detailed instructions.

## Learning Resources

### NX Monorepo
- [NX Documentation](https://nx.dev)
- [NX Tutorial](https://nx.dev/getting-started/intro)

### Next.js
- [Next.js Docs](https://nextjs.org/docs)
- [App Router Guide](https://nextjs.org/docs/app)

### Fastify
- [Fastify Docs](https://www.fastify.io/docs/latest/)
- [Fastify Guides](https://www.fastify.io/docs/latest/Guides/)

### Redux Toolkit
- [Redux Toolkit Docs](https://redux-toolkit.js.org/)
- [RTK Query Tutorial](https://redux-toolkit.js.org/tutorials/rtk-query)

### shadcn/ui
- [shadcn/ui Docs](https://ui.shadcn.com)
- [Radix UI](https://www.radix-ui.com/)

### Tailwind CSS
- [Tailwind Docs](https://tailwindcss.com/docs)
- [Tailwind UI Components](https://tailwindui.com/)

### PostgreSQL
- [PostgreSQL Tutorial](https://www.postgresqltutorial.com/)
- [PostgreSQL Docs](https://www.postgresql.org/docs/)

### Docker
- [Docker Get Started](https://docs.docker.com/get-started/)
- [Docker Compose](https://docs.docker.com/compose/)

### Terraform
- [Terraform Docs](https://www.terraform.io/docs)
- [AWS Provider](https://registry.terraform.io/providers/hashicorp/aws/latest/docs)

### Gmail API
- [Gmail API Guide](https://developers.google.com/gmail/api/guides)
- [OAuth 2.0](https://developers.google.com/identity/protocols/oauth2)

### Twilio WhatsApp
- [Twilio WhatsApp Docs](https://www.twilio.com/docs/whatsapp)
- [WhatsApp Templates](https://www.twilio.com/docs/whatsapp/tutorial/send-whatsapp-notification-messages-templates)

## API Documentation

### Authentication Endpoints

#### `GET /auth/google`
Initiates Gmail OAuth flow. Redirects user to Google consent screen.

#### `GET /auth/google/callback`
OAuth callback. Exchanges code for tokens and creates user session.

### Email Endpoints

#### `GET /api/emails`
Get list of emails with optional filters.

**Query Parameters:**
- `isUnread` (boolean): Filter unread emails
- `from` (string): Filter by sender
- `label` (string): Filter by Gmail label

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "msg123",
      "subject": "Hello World",
      "from": "sender@example.com",
      "date": "2024-01-15T10:30:00Z",
      "snippet": "Email preview...",
      "isRead": false
    }
  ]
}
```

#### `GET /api/emails/:id`
Get single email by ID.

#### `POST /api/emails/sync`
Manually trigger Gmail sync.

### WhatsApp Endpoints

#### `POST /api/whatsapp/send`
Send WhatsApp message.

**Body:**
```json
{
  "to": "+1234567890",
  "message": "Hello from the app!",
  "emailId": "optional-email-id"
}
```

#### `GET /api/whatsapp/messages`
Get WhatsApp message history.

### User Endpoints

#### `GET /api/user/me`
Get current user information.

#### `PATCH /api/user/preferences`
Update user notification preferences.

**Body:**
```json
{
  "notifyOnNewEmail": true,
  "digestMode": false,
  "quietHoursStart": "22:00",
  "quietHoursEnd": "08:00"
}
```

## Troubleshooting

### Gmail API Issues

**Issue**: "Invalid OAuth credentials"
- Verify `GMAIL_CLIENT_ID` and `GMAIL_CLIENT_SECRET` in `.env`
- Check redirect URI matches Google Cloud Console

**Issue**: "Insufficient permissions"
- User needs to re-authenticate with correct scopes
- Delete and recreate OAuth credentials

### Twilio WhatsApp Issues

**Issue**: "Not opted in"
- User must send a message to Twilio number first
- Check Twilio sandbox configuration

**Issue**: "Message failed to send"
- Verify Twilio credentials
- Check account balance
- Ensure phone number format is correct

### Database Issues

**Issue**: "Connection refused"
- Ensure PostgreSQL container is running: `docker-compose ps`
- Check `DATABASE_URL` in `.env`
- Verify port 5432 is not in use

### Docker Issues

**Issue**: "Port already in use"
- Change ports in `docker-compose.yml`
- Stop conflicting services

**Issue**: "Out of disk space"
- Clean up Docker: `docker system prune -a`

## Contributing

This is a learning project! Suggestions and improvements welcome.

## License

MIT License - feel free to use this for learning and projects.

---

Built with ❤️ as a learning exercise in modern full-stack development.
