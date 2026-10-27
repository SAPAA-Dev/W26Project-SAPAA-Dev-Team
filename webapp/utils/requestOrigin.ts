import type { NextRequest } from 'next/server';

/**
 * The site origin as the client sees it. In development Next.js reports its own
 * origin (localhost) in request.url even when the browser uses 127.0.0.1, which
 * sends auth links and redirects to another host and drops the PKCE verifier cookie.
 * Prefer SITE_URL when it is set, then the forwarded host (production proxy), then the Host header,
 * then request.url. A forwarded host that is not a plain host name is ignored.
 */
const HOST_PATTERN = /^[a-z0-9.-]+(:\d{1,5})?$/i;

export function requestOrigin(request: NextRequest): string {
  if (process.env.NODE_ENV !== 'development' && process.env.SITE_URL) {
    try {
      return new URL(process.env.SITE_URL).origin;
    } catch {
      // A bad SITE_URL falls through to the headers below.
    }
  }
  const forwardedHost = request.headers.get('x-forwarded-host')?.split(',')[0].trim();
  if (process.env.NODE_ENV !== 'development' && forwardedHost && HOST_PATTERN.test(forwardedHost)) {
    return `https://${forwardedHost}`;
  }
  const host = request.headers.get('host');
  if (process.env.NODE_ENV === 'development' && host) {
    return `http://${host}`;
  }
  return new URL(request.url).origin;
}
