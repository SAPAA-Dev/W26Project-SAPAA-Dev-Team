jest.mock('next/server', () => ({
  NextResponse: {
    json: jest.fn((body: unknown, init?: { status?: number }) => ({
      status: init?.status ?? 200,
      json: async () => body,
    })),
  },
}));

import { GET } from '@/app/api/openapi/route';
import { openApiSpec } from '@/lib/swagger';

describe('GET /api/openapi', () => {
  it('serves the OpenAPI document that the /api-docs page renders', async () => {
    const res = await GET();
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body).toBe(openApiSpec);
    expect(body.openapi).toMatch(/^3\./);
    expect(Object.keys(body.paths).length).toBeGreaterThan(0);
  });
});
