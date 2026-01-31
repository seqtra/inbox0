# CLAUDE.md - AI Assistant Context

This document provides context for AI assistants working with this codebase.

## Project Overview

**inbox-0** is a full-stack email management application that:
- Fetches emails from Gmail via OAuth2
- Analyzes/summarizes emails using Claude AI (Anthropic)
- Sends notifications via WhatsApp (Twilio)
- Includes a blog CMS with AI-generated content from RSS trends
- Integrates with Trello for task management

## Tech Stack

### Frontend (`apps/frontend/`)
- **Next.js 16** with App Router
- **React 19** with TypeScript
- **Redux Toolkit + RTK Query** for state/data fetching
- **Tailwind CSS** for styling
- **shadcn/ui** components (Radix UI based)
- **NextAuth.js** for authentication (Google OAuth)

### Backend (`api/`)
- **Fastify 5** web framework
- **TypeScript** with esbuild bundling
- **Prisma** ORM with PostgreSQL
- **Anthropic SDK** (Claude AI) for email analysis
- **googleapis** for Gmail API
- **Twilio SDK** for WhatsApp
- **node-cron** for scheduled jobs

### Shared Library (`libs/shared/`)
- Common TypeScript types (re-exports from Prisma)
- Utility functions (phone formatting, email validation, etc.)
- Prisma schema definition

### Infrastructure
- **NX monorepo** with workspace-level dependencies
- **Docker Compose** for local development and production
- **Terraform** for AWS deployment (ECS, RDS, ALB, etc.)
- **PostgreSQL 16** database

## Project Structure

```
inbox0/
├── api/                    # Fastify backend
│   ├── src/
│   │   ├── app/
│   │   │   ├── plugins/    # Fastify plugins (auth, sensible)
│   │   │   └── routes/     # API endpoints (emails, users, blogs, trello)
│   │   ├── jobs/           # Cron job definitions
│   │   └── services/       # Business logic (gmail, twilio, ai/)
│   └── Dockerfile
├── apps/
│   ├── frontend/           # Next.js application
│   │   ├── src/
│   │   │   ├── app/        # App Router pages
│   │   │   ├── components/ # UI components (landing/, dashboard/)
│   │   │   ├── entities/   # RTK Query API slices (email, user, trello)
│   │   │   ├── features/   # Feature components (inbox/)
│   │   │   └── shared/     # Shared utilities (api/, lib/, ui/)
│   │   └── Dockerfile
│   └── frontend-e2e/       # Playwright E2E tests
├── libs/shared/            # Shared TypeScript library
│   ├── prisma/schema.prisma
│   └── src/lib/
│       ├── types.ts        # Shared type definitions
│       └── utils.ts        # Utility functions
├── terraform/              # AWS infrastructure as code
├── nginx/                  # Nginx reverse proxy config
└── scripts/                # Helper scripts (init-db.sql)
```

## Key Conventions

### Import Paths
- Shared library: `import { ... } from '@email-whatsapp-bridge/shared'`
- Frontend aliases: `@/components/...`, `@/features/...`, `@/shared/...`

### API Response Format
```typescript
interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: { code: string; message: string; details?: Record<string, unknown> };
  timestamp: string;
}
```

### Authentication Flow
1. Frontend uses NextAuth.js with Google OAuth provider
2. Session stored in PostgreSQL via Prisma adapter
3. Backend validates `next-auth.session-token` cookie against DB
4. User attached to request: `request.user = { id, email }`

### Database Access
- Prisma schema in `libs/shared/prisma/schema.prisma`
- Generate client: `npx prisma generate --schema=libs/shared/prisma/schema.prisma`
- Push schema: `npx prisma db push --schema=libs/shared/prisma/schema.prisma`
- Migrations: `npx prisma migrate dev --schema=libs/shared/prisma/schema.prisma`

### Testing
- Jest for unit tests
- Playwright for E2E tests
- Test files: `*.spec.ts` or `*.spec.tsx`
- Run: `npx nx test <project>` (e.g., `npx nx test api`)

### Code Style
- ESLint with NX plugin
- Prettier for formatting
- Conventional Commits for git messages

## Common Commands

```bash
# Install dependencies
npm install

# Development
npx nx serve api              # Start backend (port 3000)
npx nx dev frontend           # Start frontend (port 4200)
docker-compose up -d postgres # Start database only

# Full Docker development environment
docker-compose -f docker-compose.dev.yml up

# Building
npx nx build api
npx nx build frontend

# Testing
npx nx test api
npx nx test frontend
npx nx e2e frontend-e2e

# Linting
npx nx lint api
npx nx lint frontend

# Database
npx prisma generate --schema=libs/shared/prisma/schema.prisma
npx prisma db push --schema=libs/shared/prisma/schema.prisma
npx prisma studio --schema=libs/shared/prisma/schema.prisma

# NX utilities
npx nx graph                  # Visualize project dependencies
npx nx affected:test          # Test affected projects
```

## Environment Variables

Key variables (see `.env.example`):

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | PostgreSQL connection string |
| `NEXTAUTH_URL` | Frontend URL (http://localhost:4200) |
| `NEXTAUTH_SECRET` | Secret for NextAuth sessions |
| `GMAIL_CLIENT_ID` | Google OAuth client ID |
| `GMAIL_CLIENT_SECRET` | Google OAuth client secret |
| `ANTHROPIC_API_KEY` | Claude AI API key |
| `TWILIO_ACCOUNT_SID` | Twilio account SID |
| `TWILIO_AUTH_TOKEN` | Twilio auth token |
| `TWILIO_WHATSAPP_NUMBER` | Twilio WhatsApp number |
| `TRELLO_API_KEY` | Trello API key |
| `TRELLO_TOKEN` | Trello access token |

## Key Files

| Purpose | Location |
|---------|----------|
| Prisma schema | `libs/shared/prisma/schema.prisma` |
| Shared types | `libs/shared/src/lib/types.ts` |
| API entry | `api/src/main.ts` |
| API routes | `api/src/app/routes/*.ts` |
| Auth config | `apps/frontend/src/app/api/auth/[...nextauth]/route.ts` |
| RTK Query base | `apps/frontend/src/shared/api/api.ts` |
| Email API slice | `apps/frontend/src/entities/email/api/emailApi.ts` |
| Redux store | `apps/frontend/src/app/providers/store.ts` |
| AI service | `api/src/services/ai/anthropic.service.ts` |
| Gmail service | `api/src/services/gmail.service.ts` |

## Gotchas & Notes

1. **Monorepo Dependencies**: All major dependencies are in root `package.json`. Sub-packages have minimal deps.

2. **Prisma Binary Targets**: Schema includes targets for native, linux-musl-openssl (Docker AMD64), and linux-musl-arm64 (Docker ARM64).

3. **React Version**: Uses React 19. Webpack aliases in `next.config.js` ensure single React instance.

4. **Docker DATABASE_URL**: In Docker Compose, `DATABASE_URL` must use `postgres` hostname (not `localhost`).

5. **NextAuth URL**: Must match exactly how you access the app (localhost vs 127.0.0.1).

6. **AI Service Pattern**: Uses factory pattern via `getAIService()` for easy provider switching.

7. **Cron Jobs**: Defined in `api/src/jobs/index.ts`, currently stubs for email sync and trend scouting.

8. **Frontend Ports**: Development runs on 4200, production uses Nginx on port 80.

## AI Features

The application uses Claude AI (Anthropic) for:
- **Email Analysis**: Extracts summary, priority, category, action items, sentiment
- **Inbox Digest**: Generates overview of multiple emails with highlights
- **Blog Generation**: Creates blog posts from trending topics (RSS)

AI service implementation: `api/src/services/ai/anthropic.service.ts`
