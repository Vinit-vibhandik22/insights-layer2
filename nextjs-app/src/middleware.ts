import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Only apply Clerk middleware when the key is configured
const CLERK_PUBLISHABLE_KEY = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;

export async function middleware(req: NextRequest) {
  if (!CLERK_PUBLISHABLE_KEY) {
    // Clerk not configured — allow all requests through
    return NextResponse.next();
  }

  const { clerkMiddleware, createRouteMatcher } = await import('@clerk/nextjs/server');

  const isPublicRoute = createRouteMatcher([
    '/(.*)',       // All routes are public — auth is optional in this app
    '/sign-in(.*)',
    '/sign-up(.*)',
    '/api/(.*)',
  ]);

  return clerkMiddleware()(req as any, {} as any);
}

export const config = {
  matcher: ['/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)'],
};
