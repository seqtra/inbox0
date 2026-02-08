#!/usr/bin/env bash
# Smoke test for Docker stack behind Nginx.
# Usage:
#   ./scripts/docker-smoke-test.sh           # assume stack is already running
#   ./scripts/docker-smoke-test.sh --build   # build and start stack, then test

set -e

BASE_URL="${BASE_URL:-http://localhost}"
BUILD=false
if [[ "${1:-}" == "--build" ]]; then
  BUILD=true
fi

if [[ "$BUILD" == "true" ]]; then
  echo "Building and starting stack (detached)..."
  docker compose up --build -d
  echo "Waiting for services (polling ${BASE_URL}/api/health)..."
  for i in {1..30}; do
    if curl -sf "${BASE_URL}/api/health" >/dev/null 2>&1; then
      echo "API is up."
      break
    fi
    if [[ $i -eq 30 ]]; then
      echo "Timeout waiting for API. Check: docker compose logs api"
      exit 1
    fi
    sleep 1
  done
  # Give Next.js a bit more time
  sleep 3
fi

FAIL=0

# Frontend root -> 200
CODE=$(curl -s -o /dev/null -w "%{http_code}" "${BASE_URL}/")
if [[ "$CODE" == "200" ]]; then
  echo "OK  GET ${BASE_URL}/  -> $CODE"
else
  echo "FAIL GET ${BASE_URL}/  -> $CODE (expected 200)"
  FAIL=1
fi

# Backend health -> 200 and body contains "ok"
BODY=$(curl -s "${BASE_URL}/api/health")
if [[ "$BODY" == *"ok"* ]]; then
  echo "OK  GET ${BASE_URL}/api/health  -> 200  body contains status"
else
  echo "FAIL GET ${BASE_URL}/api/health  -> body: $BODY"
  FAIL=1
fi

# NextAuth sign-in page (Next.js route) -> 200
CODE=$(curl -s -o /dev/null -w "%{http_code}" "${BASE_URL}/api/auth/signin")
if [[ "$CODE" == "200" ]]; then
  echo "OK  GET ${BASE_URL}/api/auth/signin  -> $CODE"
else
  echo "FAIL GET ${BASE_URL}/api/auth/signin  -> $CODE (expected 200)"
  FAIL=1
fi

# Protected API route without auth -> 401 (or 403)
CODE=$(curl -s -o /dev/null -w "%{http_code}" "${BASE_URL}/api/emails")
if [[ "$CODE" == "401" || "$CODE" == "403" ]]; then
  echo "OK  GET ${BASE_URL}/api/emails (no auth)  -> $CODE"
else
  echo "FAIL GET ${BASE_URL}/api/emails (no auth)  -> $CODE (expected 401 or 403)"
  FAIL=1
fi

if [[ $FAIL -eq 0 ]]; then
  echo ""
  echo "All smoke tests passed."
  exit 0
else
  echo ""
  echo "One or more smoke tests failed."
  exit 1
fi
