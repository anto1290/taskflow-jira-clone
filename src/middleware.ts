import type { NextRequest } from 'next/server';

// Simple middleware to forward auth token via header
// In production this would verify JWT and set user context
export function middleware(request: NextRequest) {
  const token = request.cookies.get('token')?.value;
  if (!token) return null; // let route-level guards handle it

  const url = request.nextUrl.clone();
  url.headers.set('authorization', `Bearer ${token}`);
  return null; // continue without redirect
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
