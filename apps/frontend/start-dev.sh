#!/bin/bash
# Workaround for macOS Next.js network interface detection issue

# Set environment variables to bypass network detection
export HOSTNAME=127.0.0.1
export PORT=4200

# Start Next.js with explicit hostname
cd "$(dirname "$0")"
npx next dev -p 4200 -H 127.0.0.1
