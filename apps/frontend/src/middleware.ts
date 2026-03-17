import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  // Phase 1 (local dev unblock): allow all /admin/* traffic.
  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*'],
};

