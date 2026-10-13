jest.mock("next/server", () => ({
  NextResponse: {
    json: jest.fn((body, init) => ({
      status: init?.status ?? 200,
      json: async () => body,
    })),
  },
}));

import axios from "axios";
import { GET } from "@/app/api/geocode/route";
import { createClient } from "@/utils/supabase/server";

jest.mock("axios", () => ({ __esModule: true, default: { get: jest.fn() } }));
jest.mock("@/utils/supabase/server", () => ({ createClient: jest.fn() }));

// Admin route auth checks (Sprint 2 dev task): the geocoder behind the admin dashboard heat map.
describe("GET /api/geocode", () => {
  const mockGetUser = jest.fn();
  const mockAxiosGet = axios.get as jest.Mock;
  const consoleSpy = jest.spyOn(console, "error").mockImplementation(() => {});
  const originalKey = process.env.OPENCAGE_API_KEY;

  beforeEach(() => {
    jest.clearAllMocks();
    process.env.OPENCAGE_API_KEY = "test-opencage-key";
    (createClient as jest.Mock).mockResolvedValue({ auth: { getUser: mockGetUser } });
    mockGetUser.mockResolvedValue({
      data: { user: { id: "admin-1", app_metadata: { role: "admin", authenticated: true } } },
      error: null,
    });
  });

  afterAll(() => {
    process.env.OPENCAGE_API_KEY = originalKey;
    consoleSpy.mockRestore();
  });

  const request = (query?: string) =>
    new Request(`http://localhost/api/geocode${query === undefined ? "" : `?q=${encodeURIComponent(query)}`}`);

  it("returns the coordinates of the first match, with a timeout on the call", async () => {
    mockAxiosGet.mockResolvedValue({ data: { results: [{ geometry: { lat: 53.5, lng: -113.5 } }] } });

    const response = await GET(request("Elk Island"));

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ latitude: 53.5, longitude: -113.5 });
    const [url, options] = mockAxiosGet.mock.calls[0];
    expect(url).toContain("q=Elk%20Island");
    expect(url).toContain("key=test-opencage-key");
    expect(options).toEqual({ timeout: expect.any(Number) });
  });

  it("returns null coordinates in the same shape when nothing matches", async () => {
    mockAxiosGet.mockResolvedValue({ data: { results: [] } });

    const response = await GET(request("Nowhere"));

    expect(await response.json()).toEqual({ latitude: null, longitude: null });
  });

  it("returns null coordinates when OpenCage answers without a results array", async () => {
    mockAxiosGet.mockResolvedValue({ data: {} });

    const response = await GET(request("Nowhere"));

    expect(await response.json()).toEqual({ latitude: null, longitude: null });
  });

  it.each([
    ["without a q param", undefined],
    ["with a blank q param", ""],
  ])("returns 400 %s", async (_label, query) => {
    const response = await GET(request(query));

    expect(response.status).toBe(400);
    expect(mockAxiosGet).not.toHaveBeenCalled();
  });

  it("returns 401 when the session check fails", async () => {
    mockGetUser.mockResolvedValue({ data: { user: null }, error: { message: "JWT expired" } });

    const response = await GET(request("Elk Island"));

    expect(response.status).toBe(401);
  });

  it("returns 401 when no one is signed in", async () => {
    mockGetUser.mockResolvedValue({ data: { user: null }, error: null });

    const response = await GET(request("Elk Island"));

    expect(response.status).toBe(401);
    expect(mockAxiosGet).not.toHaveBeenCalled();
  });

  it.each([
    ["a steward", { role: "steward", authenticated: true }],
    ["an admin who is not approved", { role: "admin", authenticated: false }],
  ])("returns 403 for %s", async (_label, appMetadata) => {
    mockGetUser.mockResolvedValue({ data: { user: { id: "user-1", app_metadata: appMetadata } }, error: null });

    const response = await GET(request("Elk Island"));

    expect(response.status).toBe(403);
    expect(mockAxiosGet).not.toHaveBeenCalled();
  });

  it("returns 500 and does not call OpenCage when the key is missing", async () => {
    delete process.env.OPENCAGE_API_KEY;

    const response = await GET(request("Elk Island"));

    expect(response.status).toBe(500);
    expect(mockAxiosGet).not.toHaveBeenCalled();
  });

  it("returns 500 when OpenCage fails or times out", async () => {
    mockAxiosGet.mockRejectedValue(new Error("timeout of 8000ms exceeded"));

    const response = await GET(request("Elk Island"));

    expect(response.status).toBe(500);
    expect(await response.json()).toEqual({ error: "timeout of 8000ms exceeded" });
  });

  it("returns a generic 500 message when OpenCage throws a non-Error value", async () => {
    mockAxiosGet.mockRejectedValue("network down");

    const response = await GET(request("Elk Island"));

    expect(response.status).toBe(500);
    expect(await response.json()).toEqual({ error: "Geocoding failed" });
  });
});
