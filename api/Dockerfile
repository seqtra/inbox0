##
# Multi-stage Dockerfile for Fastify Backend API
#
# This Dockerfile creates an optimized production image for the Fastify API.
# It uses multi-stage builds to keep the final image small and secure.
#
# Stages:
# 1. deps: Install all dependencies
# 2. builder: Build the application
# 3. runner: Run the application in production
##

FROM node:20-alpine AS deps

# Install dependencies needed for native modules
RUN apk add --no-cache libc6-compat python3 make g++

WORKDIR /app

# Copy package files for all workspaces
COPY package*.json ./
COPY api/package*.json ./api/
COPY libs/shared/package*.json ./libs/shared/

# Install all dependencies (including dev dependencies for build)
RUN npm install
##
# Build Stage
##
FROM node:20-alpine AS builder

WORKDIR /app

# Copy dependencies from deps stage
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/package*.json ./

# Copy source code
COPY . .

# Build the API using NX
# This will compile TypeScript and bundle the application
RUN npx nx build api
##
# Production Stage
##
FROM node:20-alpine AS runner

# Install dumb-init for proper signal handling
RUN apk add --no-cache dumb-init

WORKDIR /app

ENV NODE_ENV production

# Create a non-root user for security
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 fastify

# Copy built application from builder
COPY --from=builder --chown=fastify:nodejs /app/api/dist ./
COPY --from=builder --chown=fastify:nodejs /app/node_modules ./node_modules

# Switch to non-root user
USER fastify

# Expose port 3000 (Fastify default)
EXPOSE 3000

ENV HOST=0.0.0.0
ENV PORT=3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/api/health', (r) => process.exit(r.statusCode === 200 ? 0 : 1))"

# Use dumb-init to handle signals properly
ENTRYPOINT ["dumb-init", "--"]

# Start the application
CMD ["node", "main.js"]
