jest.mock("next/server", () => ({
  NextResponse: {
    json: jest.fn((body, init) => ({
      status: init?.status ?? 200,
      json: async () => body,
    })),
  },
}));

import { GET } from "@/app/api/heatmap/route";
import { createClient } from "@/utils/supabase/server";

jest.mock("@/utils/supabase/server", () => ({
  createClient: jest.fn(),
}));

// Admin route auth checks (Sprint 2 dev task): the heat map search on the admin dashboard.
describe("GET /api/heatmap", () => {
  const mockGetUser = jest.fn();
  const mockIlike = jest.fn();
  const mockSelect = jest.fn(() => ({ ilike: mockIlike }));
  const mockFrom = jest.fn(() => ({ select: mockSelect }));
  const consoleSpy = jest.spyOn(console, "error").mockImplementation(() => {});

  const approvedAdmin = { id: "admin-1", app_metadata: { role: "admin", authenticated: true } };

  beforeEach(() => {
    jest.clearAllMocks();
    (createClient as jest.Mock).mockResolvedValue({
      auth: { getUser: mockGetUser },
      from: mockFrom,
    });
    mockGetUser.mockResolvedValue({ data: { user: approvedAdmin }, error: null });
    mockIlike.mockResolvedValue({ data: [], error: null });
  });

  afterAll(() => consoleSpy.mockRestore());

  const request = (keyword: string) =>
    new Request(`http://localhost/api/heatmap?keyword=${encodeURIComponent(keyword)}`);

  it("returns 401 when no one is signed in", async () => {
    mockGetUser.mockResolvedValue({ data: { user: null }, error: null });

    const response = await GET(request("park"));

    expect(response.status).toBe(401);
    expect(mockFrom).not.toHaveBeenCalled();
  });

  it.each([
    ["a steward", { role: "steward", authenticated: true }],
    ["an admin who is not approved", { role: "admin", authenticated: false }],
    ["a user whose admin role is only in user_metadata", {}],
  ])("returns 403 for %s", async (_label, appMetadata) => {
    mockGetUser.mockResolvedValue({
      data: { user: { id: "user-1", app_metadata: appMetadata, user_metadata: { role: "admin" } } },
      error: null,
    });

    const response = await GET(request("park"));

    expect(response.status).toBe(403);
    expect(mockFrom).not.toHaveBeenCalled();
  });

  it("counts the reports of each matching site, most first", async () => {
    mockIlike.mockResolvedValue({
      data: [{ namesite: "Elk Park" }, { namesite: "Bow Park" }, { namesite: "Bow Park" }, { namesite: null }],
      error: null,
    });

    const response = await GET(request("park"));

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({
      data: [
        { namesite: "Bow Park", count: 2 },
        { namesite: "Elk Park", count: 1 },
      ],
    });
    expect(mockSelect).toHaveBeenCalledWith("namesite");
  });

  it("escapes LIKE wildcards and drops * so the keyword matches only itself", async () => {
    await GET(request("50%_off*\\"));

    expect(mockIlike).toHaveBeenCalledWith("namesite", "%50\\%\\_off\\\\%");
  });

  it("returns an empty list and skips the query for a keyword of only *", async () => {
    const response = await GET(request("**"));

    expect(await response.json()).toEqual({ data: [] });
    expect(mockGetUser).not.toHaveBeenCalled();
  });

  it("returns at most 50 sites", async () => {
    mockIlike.mockResolvedValue({
      data: Array.from({ length: 60 }, (_, index) => ({ namesite: `Site ${index}` })),
      error: null,
    });

    const response = await GET(request("site"));

    expect((await response.json()).data).toHaveLength(50);
  });

  it("returns an empty list and a message when no site matches", async () => {
    const response = await GET(request("park"));

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ data: [], message: "No sites found" });
  });

  it("treats a null result as no match", async () => {
    mockIlike.mockResolvedValue({ data: null, error: null });

    const response = await GET(request("park"));

    expect(await response.json()).toEqual({ data: [], message: "No sites found" });
  });

  it.each([
    ["an Error", new Error("connection reset"), "connection reset"],
    ["a non-Error value", "boom", "Heatmap request failed"],
  ])("returns 500 when the Supabase client throws %s", async (_label, thrown, message) => {
    (createClient as jest.Mock).mockRejectedValue(thrown);

    const response = await GET(request("park"));

    expect(response.status).toBe(500);
    expect(await response.json()).toEqual({ error: message });
  });

  it("returns 500 when the database query fails", async () => {
    mockIlike.mockResolvedValue({ data: null, error: { message: "relation does not exist" } });

    const response = await GET(request("park"));

    expect(response.status).toBe(500);
    expect(await response.json()).toEqual({ error: "relation does not exist" });
  });
});
