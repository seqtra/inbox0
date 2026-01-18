##
# Multi-stage Dockerfile for Next.js Frontend
#
# This Dockerfile creates an optimized production image for the Next.js application.
# It uses multi-stage builds to keep the final image small.
#
# Stages:
# 1. deps: Install dependencies
# 2. builder: Build the application
# 3. runner: Run the application
##

FROM node:20-alpine AS deps

# Install dependencies only when needed
RUN apk add --no-cache libc6-compat

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY apps/frontend/package*.json ./apps/frontend/
COPY libs/shared/package*.json ./libs/shared/

# Install dependencies
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

# Build the frontend application
# NX will build both the shared library and the frontend
RUN npx nx build frontend
##
# Production Stage
##
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV production
ENV NEXT_TELEMETRY_DISABLED 1

# Create a non-root user for security
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy necessary files from builder
COPY --from=builder /app/public ./apps/frontend/public
COPY --from=builder --chown=nextjs:nodejs /app/dist/apps/frontend/.next ./apps/frontend/.next
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package*.json ./

# Switch to non-root user
USER nextjs

# Expose port 4200 (default NX Next.js port)
EXPOSE 4200

ENV PORT 4200

# Start the application
CMD ["npm", "run", "start:frontend"]
