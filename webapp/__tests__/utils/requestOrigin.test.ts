import { requestOrigin } from '@/utils/requestOrigin';

function makeRequest(headers: Record<string, string>) {
  return {
    url: 'http://localhost:3000/auth/callback',
    headers: { get: (name: string) => headers[name] ?? null },
  };
}

describe('requestOrigin (US 5.0.2)', () => {
  const env = process.env as Record<string, string | undefined>;
  const saved = { nodeEnv: env.NODE_ENV, siteUrl: env.SITE_URL };

  beforeEach(() => {
    env.NODE_ENV = 'production';
    delete env.SITE_URL;
  });

  afterAll(() => {
    env.NODE_ENV = saved.nodeEnv;
    if (saved.siteUrl === undefined) delete env.SITE_URL;
    else env.SITE_URL = saved.siteUrl;
  });

  it('uses the forwarded host in production', () => {
    expect(requestOrigin(makeRequest({ 'x-forwarded-host': 'sapaa.example.org' }) as never)).toBe('https://sapaa.example.org');
  });

  it('keeps only the first forwarded host', () => {
    expect(requestOrigin(makeRequest({ 'x-forwarded-host': 'sapaa.example.org, evil.example' }) as never)).toBe('https://sapaa.example.org');
  });

  it('ignores a forwarded host that is not a plain host name', () => {
    const origin = requestOrigin(makeRequest({ 'x-forwarded-host': 'evil.example/path?x=1' }) as never);

    expect(origin).toBe('http://localhost:3000');
  });

  it('prefers SITE_URL over any forwarded host', () => {
    env.SITE_URL = 'https://sapaa.example.org/some/path';

    expect(requestOrigin(makeRequest({ 'x-forwarded-host': 'evil.example' }) as never)).toBe('https://sapaa.example.org');
  });
});
