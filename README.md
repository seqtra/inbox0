# inbox0

A full-stack email management application that fetches emails from Gmail, analyzes them using Claude AI (Anthropic), and delivers intelligent notifications via WhatsApp. Built with modern technologies and deployed on AWS.

## Table of Contents

- [Overview](#overview)
- [Architecture](#architecture)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Prerequisites](#prerequisites)
- [Getting Started](#getting-started)
- [Development](#development)
- [AI Features](#ai-features)
- [Deployment](#deployment)
- [API Documentation](#api-documentation)
- [Troubleshooting](#troubleshooting)
- [Learning Resources](#learning-resources)

## Documentation

| Document | Description |
|----------|-------------|
| **[SETUP.md](SETUP.md)** | Step-by-step guide for running and testing locally (sign-in, dashboard, admin) |
| **[CLAUDE.md](CLAUDE.md)** | AI assistant context for working with this codebase |
| **[AGENTS.md](AGENTS.md)** | Instructions for AI coding agents |

## Overview

inbox0 helps you stay on top of your email with AI-powered analysis:

1. **Email Sync**: Fetches emails from Gmail using OAuth2 authentication
2. **AI Analysis**: Summarizes and categorizes emails using Claude AI (Anthropic)
3. **Notification**: Sends intelligent summaries via WhatsApp through Twilio
4. **Management**: Web interface to view inbox, configure preferences, and manage integrations
5. **Blog CMS**: AI-generated blog content from RSS trend analysis

## Architecture

```
┌─────────────────┐
│   User's Gmail  │
└────────┬────────┘
         │ Gmail API
         ↓
┌─────────────────┐      ┌──────────────┐      ┌──────────────┐
│  Fastify API    │←────→│  PostgreSQL  │      │  Claude AI   │
│  (Backend)      │      │  Database    │←────→│  (Anthropic) │
└────────┬────────┘      └──────────────┘      └──────────────┘
         │
         │ REST API
         ↓
┌─────────────────┐
│   Next.js       │
│   Frontend      │
└────────┬────────┘
         │
         ↓ Twilio API
┌─────────────────┐
│    WhatsApp     │
│    (User)       │
└─────────────────┘
```

### Data Flow

1. User authenticates with Google OAuth2 via NextAuth.js
2. Backend fetches emails from Gmail API
3. Claude AI analyzes emails (summary, priority, category, sentiment)
4. Emails and analysis stored in PostgreSQL
5. Backend sends WhatsApp notifications via Twilio
6. User manages preferences through the web dashboard

## Tech Stack

### Frontend (`apps/frontend/`)
- **Next.js 16** with App Router
- **React 19** with TypeScript
- **Redux Toolkit + RTK Query** for state management and data fetching
- **shadcn/ui** components (Radix UI based)
- **Tailwind CSS** for styling
- **NextAuth.js** for authentication (Google OAuth)
- **PostHog** for analytics (optional)

### Backend (`api/`)
- **Fastify 5** web framework
- **TypeScript** with esbuild bundling
- **Prisma** ORM with PostgreSQL
- **Anthropic SDK** (Claude AI) for email analysis
- **googleapis** for Gmail API
- **Twilio SDK** for WhatsApp messaging
- **node-cron** for scheduled jobs

### Shared Library (`libs/shared/`)
- Common TypeScript types (re-exports from Prisma)
- Utility functions (phone formatting, email validation, etc.)
- Prisma schema definition

### Infrastructure
- **NX monorepo** with workspace-level dependencies
- **Docker Compose** for local development and production
- **Nginx** reverse proxy for production
- **Terraform** for AWS deployment (ECS, RDS, ALB, etc.)
- **PostgreSQL 16** database

## Project Structure

```
inbox0/
├── apps/
│   ├── frontend/              # Next.js 16 application
│   │   ├── src/
│   │   │   ├── app/           # App Router pages
│   │   │   │   ├── dashboard/ # User dashboard
│   │   │   │   ├── admin/     # Admin panel & blog CMS
│   │   │   │   └── api/auth/  # NextAuth.js endpoints
│   │   │   ├── components/    # React components
│   │   │   │   ├── landing/   # Landing page components
│   │   │   │   └── dashboard/ # Dashboard components
│   │   │   ├── entities/      # RTK Query API slices
│   │   │   ├── features/      # Feature components (inbox, whatsapp)
│   │   │   └── shared/        # Shared utilities & UI
│   │   ├── server.js          # Custom dev server
│   │   └── Dockerfile
│   └── frontend-e2e/          # Playwright E2E tests
│
├── api/                       # Fastify 5 backend
│   ├── src/
│   │   ├── app/
│   │   │   ├── plugins/       # Fastify plugins (auth, sensible)
│   │   │   └── routes/        # API endpoints
│   │   ├── jobs/              # Cron job definitions
│   │   └── services/          # Business logic
│   │       ├── ai/            # Anthropic AI service
│   │       ├── gmail.service.ts
│   │       ├── twilio.service.ts
│   │       └── trello.service.ts
│   └── Dockerfile
│
├── libs/
│   └── shared/                # Shared TypeScript library
│       ├── prisma/schema.prisma
│       └── src/lib/
│           ├── types.ts       # Shared type definitions
│           └── utils.ts       # Utility functions
│
├── terraform/                 # AWS infrastructure as code
├── nginx/                     # Nginx reverse proxy config
├── scripts/                   # Helper scripts
├── docker-compose.yml         # Production Docker stack
├── docker-compose.dev.yml     # Development Docker stack
└── README.md
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
   - Add redirect URI: `http://localhost:4200/api/auth/callback/google`

### For AI Features

- **Anthropic API Key**: [Sign up](https://www.anthropic.com/) for Claude AI access

### For WhatsApp Integration (Optional)

1. **Twilio Account**: [Sign up](https://www.twilio.com/try-twilio)
2. **WhatsApp Sandbox**: Enable in Twilio Console
3. **Twilio Phone Number**: WhatsApp-enabled number

## Getting Started

### Quick Start (Recommended)

For a complete step-by-step guide including Google OAuth setup, see **[SETUP.md](SETUP.md)**.

### 1. Clone and Install

```bash
git clone <repo-url>
cd inbox0
npm install
```

### 2. Configure Environment

```bash
cp .env.example .env
```

Edit `.env` with your credentials:

```env
# Required for authentication
NEXTAUTH_URL=http://localhost:4200
NEXTAUTH_SECRET=<run: openssl rand -base64 32>

# Google OAuth (from Google Cloud Console)
GMAIL_CLIENT_ID=your-client-id.apps.googleusercontent.com
GMAIL_CLIENT_SECRET=your-client-secret

# Database
DATABASE_URL=postgresql://devuser:devpassword@localhost:5432/email_whatsapp_bridge

# AI Features (optional but recommended)
ANTHROPIC_API_KEY=your-anthropic-api-key

# API URL
NEXT_PUBLIC_API_URL=http://localhost:3000/api
```

### 3. Start Development Environment

**Option A: Docker Compose (Recommended for first-time setup)**

```bash
# Start everything with hot reloading
docker-compose -f docker-compose.dev.yml up
```

This starts:
- PostgreSQL database (port 5432)
- Backend API with hot reload (port 3000)
- Frontend with hot reload (port 4200)

**Option B: Manual (More control)**

```bash
# Terminal 1: Start database
docker-compose up -d postgres

# Wait for database, then run migrations
npx prisma generate --schema=libs/shared/prisma/schema.prisma
npx prisma db push --schema=libs/shared/prisma/schema.prisma

# Terminal 2: Start backend
npx nx serve api

# Terminal 3: Start frontend
npx nx dev frontend
```

### 4. Access the Application

| Service | URL | Description |
|---------|-----|-------------|
| Frontend | http://localhost:4200 | Web application |
| API | http://localhost:3000/api | REST API |
| API Health | http://localhost:3000/api/health | Health check |

## Development

### Docker Compose Development Environment

The `docker-compose.dev.yml` provides a complete development environment with hot reloading:

```bash
# Start all services
docker-compose -f docker-compose.dev.yml up

# Start in background
docker-compose -f docker-compose.dev.yml up -d

# Rebuild after dependency changes
docker-compose -f docker-compose.dev.yml up --build

# View logs
docker-compose -f docker-compose.dev.yml logs -f api
docker-compose -f docker-compose.dev.yml logs -f frontend

# Stop all services
docker-compose -f docker-compose.dev.yml down

# Reset database (destructive)
docker-compose -f docker-compose.dev.yml down -v
```

### Manual Development (Alternative)

```bash
# Start database only
docker-compose up -d postgres

# Run backend in dev mode (terminal 1)
npx nx serve api

# Run frontend in dev mode (terminal 2)
npx nx dev frontend
```

### Building

```bash
# Build all apps
npx nx build api
npx nx build frontend

# Build for production
npx nx build api --configuration=production
npx nx build frontend --configuration=production
```

### Testing

```bash
# Run all tests
npx nx test api
npx nx test frontend

# Run E2E tests
npx nx e2e frontend-e2e

# Run tests with coverage
npx nx test api --coverage
```

### Linting

```bash
# Lint all projects
npx nx lint api
npx nx lint frontend

# Format code
npm run format
```

### Database Management

```bash
# Generate Prisma client
npx prisma generate --schema=libs/shared/prisma/schema.prisma

# Push schema changes (development)
npx prisma db push --schema=libs/shared/prisma/schema.prisma

# Create migration
npx prisma migrate dev --schema=libs/shared/prisma/schema.prisma --name <migration-name>

# Apply migrations (production)
npx prisma migrate deploy --schema=libs/shared/prisma/schema.prisma

# Open Prisma Studio (database browser)
npx prisma studio --schema=libs/shared/prisma/schema.prisma

# Reset database (destructive)
npx prisma migrate reset --schema=libs/shared/prisma/schema.prisma
```

### NX Workspace

```bash
# Visualize project dependencies
npx nx graph

# Run affected tests (based on git changes)
npx nx affected:test

# Clear NX cache
npx nx reset
```

## AI Features

inbox0 uses Claude AI (Anthropic) for intelligent email processing:

### Email Analysis
- **Summary**: Concise overview of email content
- **Priority**: High/Medium/Low classification
- **Category**: Auto-categorization (work, personal, newsletter, etc.)
- **Action Items**: Extracted tasks and to-dos
- **Sentiment**: Positive/Neutral/Negative analysis

### Inbox Digest
- Daily/weekly summaries of your inbox
- Highlights important emails
- Groups emails by category

### Blog Generation
- AI-generated blog posts from RSS trend analysis
- Content suggestions based on trending topics
- SEO optimization

The AI service is implemented in `api/src/services/ai/anthropic.service.ts`.

## Deployment

### Production Docker Compose

```bash
# Build and start production stack
docker-compose up --build -d

# View logs
docker-compose logs -f
```

Production stack includes:
- PostgreSQL (internal)
- Backend API
- Frontend
- Nginx reverse proxy (port 80)

Access via: http://localhost

### Deploy to AWS with Terraform

See [terraform/README.md](terraform/README.md) for detailed AWS deployment instructions.

```bash
cd terraform

# Configure variables
cp terraform.tfvars.example terraform.tfvars

# Initialize and deploy
terraform init
terraform plan
terraform apply
```

### Deploy Frontend to Vercel

1. Set **Root Directory** to `apps/frontend` in Vercel settings
2. Enable **"Include source files outside of the Root Directory"**
3. Set environment variables: `NEXTAUTH_SECRET`, `NEXTAUTH_URL`, `DATABASE_URL`, etc.

See [SETUP.md](SETUP.md#11-deploy-frontend-to-vercel) for detailed Vercel instructions.

## API Documentation

### Authentication

The frontend uses NextAuth.js with Google OAuth. The backend validates sessions via the database.

### Email Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/emails` | List emails with filters |
| GET | `/api/emails/:id` | Get single email |
| POST | `/api/emails/sync` | Trigger Gmail sync |
| GET | `/api/emails/digest` | Get AI-generated digest |

**Query Parameters for `/api/emails`:**
- `isUnread` (boolean): Filter unread emails
- `from` (string): Filter by sender
- `label` (string): Filter by Gmail label

### User Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/user/me` | Get current user |
| PATCH | `/api/user/preferences` | Update preferences |

### Trello Integration

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/trello/boards` | List boards |
| POST | `/api/trello/cards` | Create card from email |

### Health Check

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/health` | API health status |

## Troubleshooting

### Common Issues

**"redirect_uri_mismatch" (Google OAuth)**
- Add exact redirect URI in Google Cloud: `http://localhost:4200/api/auth/callback/google`
- Ensure `NEXTAUTH_URL` matches how you access the app
- Restart frontend after changing `.env`

**"Can't reach database server at localhost:5432"**
- Start PostgreSQL: `docker-compose up -d postgres`
- Check `DATABASE_URL` in `.env`
- If using Docker Compose dev, ensure you wait for postgres to be healthy

**"Module not found" errors**
```bash
# Clear NX cache and reinstall
npx nx reset
rm -rf node_modules package-lock.json
npm install
```

**Docker issues**
```bash
# Rebuild containers
docker-compose -f docker-compose.dev.yml up --build

# Reset volumes (destructive)
docker-compose -f docker-compose.dev.yml down -v
```

**Port conflicts**
- Frontend: 4200
- API: 3000
- PostgreSQL: 5432
- Nginx (production): 80

Check for conflicting processes and stop them or change ports in docker-compose files.

### Getting Help

See [SETUP.md](SETUP.md#9-troubleshooting) for more detailed troubleshooting steps.

## Learning Resources

### Core Technologies

| Technology | Documentation |
|------------|---------------|
| NX Monorepo | [nx.dev](https://nx.dev) |
| Next.js 16 | [nextjs.org/docs](https://nextjs.org/docs) |
| Fastify 5 | [fastify.dev](https://fastify.dev) |
| Redux Toolkit | [redux-toolkit.js.org](https://redux-toolkit.js.org) |
| Prisma | [prisma.io/docs](https://prisma.io/docs) |
| shadcn/ui | [ui.shadcn.com](https://ui.shadcn.com) |
| Tailwind CSS | [tailwindcss.com](https://tailwindcss.com) |

### APIs & Services

| Service | Documentation |
|---------|---------------|
| Anthropic Claude | [docs.anthropic.com](https://docs.anthropic.com) |
| Gmail API | [developers.google.com/gmail/api](https://developers.google.com/gmail/api) |
| Twilio WhatsApp | [twilio.com/docs/whatsapp](https://www.twilio.com/docs/whatsapp) |
| NextAuth.js | [next-auth.js.org](https://next-auth.js.org) |

### Infrastructure

| Tool | Documentation |
|------|---------------|
| Docker | [docs.docker.com](https://docs.docker.com) |
| Terraform | [terraform.io/docs](https://www.terraform.io/docs) |
| PostgreSQL | [postgresql.org/docs](https://www.postgresql.org/docs/) |

## Contributing

Contributions are welcome! Please follow:

1. Use Conventional Commits format (feat, fix, docs, etc.)
2. Run tests before submitting: `npx nx test api && npx nx test frontend`
3. Ensure linting passes: `npx nx lint api && npx nx lint frontend`

## License

MIT License - feel free to use this for learning and projects.

---

Built with modern technologies for intelligent email management.
