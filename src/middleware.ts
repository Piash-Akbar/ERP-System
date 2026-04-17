import { auth } from '@/server/auth/config';
import { NextResponse } from 'next/server';

const PUBLIC_PREFIXES = ['/login', '/forgot-password'];

export default auth((req) => {
  const { pathname } = req.nextUrl;

  if (PUBLIC_PREFIXES.some((p) => pathname.startsWith(p))) {
    return NextResponse.next();
  }

  if (!req.auth) {
    const url = req.nextUrl.clone();
    url.pathname = '/login';
    url.searchParams.set('callbackUrl', pathname);
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
});

export const config = {
  matcher: ['/((?!_next|api/auth|favicon.ico|.*\\..*).*)'],
};
