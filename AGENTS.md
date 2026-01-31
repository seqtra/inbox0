# AGENTS.md - AI Coding Agent Instructions

This document provides actionable instructions for AI coding agents working in this repository.

## Quick Start

Before making changes, ensure you understand:
1. This is an **NX monorepo** with frontend, api, and shared library
2. Dependencies are at the **root level** (`package.json`)
3. Prisma schema is in `libs/shared/prisma/schema.prisma`

## Development Workflow

### Starting the Development Environment

```bash
# Option 1: Manual (recommended for development)
docker-compose up -d postgres           # Database
npx nx serve api                        # Backend (terminal 1)
npx nx dev frontend                     # Frontend (terminal 2)

# Option 2: Full Docker
docker-compose -f docker-compose.dev.yml up
```

### After Code Changes

```bash
# Run tests
npx nx test api
npx nx test frontend

# Lint
npx nx lint api
npx nx lint frontend
```

## Common Tasks

### Adding a New API Endpoint

1. Create or edit route file in `api/src/app/routes/`
2. Register in `api/src/app/app.ts` if new file
3. Add types to `libs/shared/src/lib/types.ts` if needed

**Example route structure:**
```typescript
// api/src/app/routes/example.ts
import { FastifyInstance } from 'fastify';

export default async function (fastify: FastifyInstance) {
  // Protected route
  fastify.addHook('preHandler', fastify.authenticate);
  
  fastify.get('/', async (request, reply) => {
    const userId = request.user?.id;
    // ...
    return { success: true, data: result };
  });
}
```

### Adding a New Frontend Feature

1. Create feature directory in `apps/frontend/src/features/<feature-name>/`
2. Add RTK Query API slice in `apps/frontend/src/entities/<entity>/api/`
3. Create components in the feature directory
4. Add page in `apps/frontend/src/app/` using App Router

**RTK Query slice pattern:**
```typescript
// apps/frontend/src/entities/example/api/exampleApi.ts
import { api } from '@/shared/api/api';

export const exampleApi = api.injectEndpoints({
  endpoints: (builder) => ({
    getItems: builder.query<ApiResponse<Item[]>, void>({
      query: () => '/items',
      providesTags: ['Item'],
    }),
    createItem: builder.mutation<ApiResponse<Item>, CreateItemRequest>({
      query: (body) => ({ url: '/items', method: 'POST', body }),
      invalidatesTags: ['Item'],
    }),
  }),
});

export const { useGetItemsQuery, useCreateItemMutation } = exampleApi;
```

### Adding a Database Model

1. Edit `libs/shared/prisma/schema.prisma`
2. Run migrations:
   ```bash
   npx prisma migrate dev --schema=libs/shared/prisma/schema.prisma --name <migration-name>
   ```
3. Add TypeScript types to `libs/shared/src/lib/types.ts`
4. Export from `libs/shared/src/index.ts` if needed

### Adding a New Service

1. Create service file in `api/src/services/`
2. Follow existing patterns (class-based with dependency injection via constructor)
3. Add tests in `*.spec.ts` file

**Service pattern:**
```typescript
// api/src/services/example.service.ts
import type { SomeType } from '@email-whatsapp-bridge/shared';

export class ExampleService {
  constructor(private config: ExampleConfig) {}

  async doSomething(): Promise<SomeType> {
    // Implementation
  }
}
```

### Adding Environment Variables

1. Add to `.env.example` with placeholder
2. Access via `process.env.VARIABLE_NAME`
3. Document in README or CLAUDE.md

### Adding Dependencies

```bash
# Add to root (preferred for shared deps)
npm install <package>

# Add dev dependency
npm install -D <package>
```

## File Naming Conventions

| Type | Pattern | Example |
|------|---------|---------|
| React Component | PascalCase | `EmailList.tsx` |
| API Route | kebab-case | `emails.ts` |
| Service | kebab-case.service | `gmail.service.ts` |
| Test | same-name.spec | `gmail.service.spec.ts` |
| Types | PascalCase | `types.ts` |
| Utility | kebab-case | `utils.ts` |

## Code Patterns

### API Error Handling
```typescript
try {
  const result = await someOperation();
  return { success: true, data: result };
} catch (error) {
  request.log.error(error);
  return reply.status(500).send({ error: 'Operation failed' });
}
```

### Protected Routes
```typescript
// In route file
fastify.addHook('preHandler', fastify.authenticate);

// Access user
const userId = request.user?.id;
if (!userId) {
  return reply.status(401).send({ error: 'Unauthorized' });
}
```

### Frontend Data Fetching
```typescript
// Using RTK Query hooks
const { data, isLoading, isError } = useGetItemsQuery();

// Mutations
const [createItem, { isLoading: isCreating }] = useCreateItemMutation();
```

### Server Components vs Client Components
```typescript
// Server Component (default in App Router)
// apps/frontend/src/app/page/page.tsx
import { getServerSession } from 'next-auth';
export default async function Page() {
  const session = await getServerSession(authOptions);
  // ...
}

// Client Component
// apps/frontend/src/features/feature/Component.tsx
'use client';
import { useState } from 'react';
```

## Testing Guidelines

### Unit Tests
- Mock external services
- Use Jest matchers
- Test happy path and error cases

```typescript
// api/src/services/example.service.spec.ts
jest.mock('external-lib');

describe('ExampleService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should do something', async () => {
    const service = new ExampleService(mockConfig);
    const result = await service.doSomething();
    expect(result).toBeDefined();
  });
});
```

### E2E Tests
- Located in `apps/frontend-e2e/`
- Use Playwright
- Run with `npx nx e2e frontend-e2e`

## Git Commit Guidelines

Use Conventional Commits:
- `feat:` New feature
- `fix:` Bug fix
- `docs:` Documentation
- `style:` Formatting
- `refactor:` Code restructuring
- `test:` Adding tests
- `chore:` Maintenance

Example: `feat(api): add email summarization endpoint`

## Troubleshooting

### Prisma Issues
```bash
# Regenerate client
npx prisma generate --schema=libs/shared/prisma/schema.prisma

# Reset database (DESTRUCTIVE)
npx prisma migrate reset --schema=libs/shared/prisma/schema.prisma
```

### Port Conflicts
- Frontend: 4200
- API: 3000
- PostgreSQL: 5432

### Module Resolution Issues
```bash
# Clear NX cache
npx nx reset

# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install
```

### Docker Issues
```bash
# Rebuild containers
docker-compose -f docker-compose.dev.yml up --build

# Reset volumes (DESTRUCTIVE)
docker-compose down -v
```

## Architecture Decisions

1. **Why NX?** - Monorepo tooling, incremental builds, dependency graph
2. **Why RTK Query?** - Built-in caching, loading states, auto-generated hooks
3. **Why Fastify?** - Performance, TypeScript support, plugin system
4. **Why Prisma?** - Type safety, migrations, studio UI
5. **Why Anthropic Claude?** - Superior reasoning for email analysis

## Security Considerations

- Never commit `.env` files
- Use `request.user` from auth middleware, not request body
- Validate all inputs with Zod schemas
- OAuth tokens stored encrypted in database
- Session tokens validated against database on each request

## Performance Notes

- RTK Query caches API responses
- Use `tagTypes` for cache invalidation
- Prisma includes query optimization
- esbuild for fast API builds
- Next.js automatic code splitting
