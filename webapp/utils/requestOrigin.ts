import type { NextRequest } from 'next/server';

/**
 * The site origin as the client sees it. In development Next.js reports its own
 * origin (localhost) in request.url even when the browser uses 127.0.0.1, which
 * sends auth links and redirects to another host and drops the PKCE verifier cookie.
 * Prefer the forwarded host (production proxy), then the Host header, then request.url.
 */
export function requestOrigin(request: NextRequest): string {
  const forwardedHost = request.headers.get('x-forwarded-host');
  if (process.env.NODE_ENV !== 'development' && forwardedHost) {
    return `https://${forwardedHost}`;
  }
  const host = request.headers.get('host');
  if (process.env.NODE_ENV === 'development' && host) {
    return `http://${host}`;
  }
  return new URL(request.url).origin;
}
