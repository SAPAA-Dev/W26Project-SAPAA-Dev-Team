import * as queries from "../../utils/supabase/queries";
import { createServerSupabase, createClient } from "../../utils/supabase/server";

jest.mock("../../utils/supabase/server", () => ({
  createServerSupabase: jest.fn(),
  createClient: jest.fn(),
}));

function mockCaller(role: string, approved = true) {
  (createClient as jest.Mock).mockResolvedValue({
    auth: {
      getUser: jest.fn().mockResolvedValue({
        data: { user: { id: "user-uuid", app_metadata: { role, authenticated: approved } } },
        error: null,
      }),
    },
  });
}

describe("createSite and findSitesWithName", () => {
  const mockFrom = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    mockCaller("admin");
    (createServerSupabase as jest.Mock).mockReturnValue({ from: mockFrom });
  });

  it.each([
    ["createSite", () => queries.createSite("New Site", null)],
    ["findSitesWithName", () => queries.findSitesWithName("New Site")],
  ])("%s rejects a steward and touches nothing", async (_name, call) => {
    mockCaller("steward");

    await expect(call()).rejects.toThrow("Only admins can edit sites.");
    expect(mockFrom).not.toHaveBeenCalled();
  });

  it("createSite rejects an admin whose approval was revoked", async () => {
    mockCaller("admin", false);

    await expect(queries.createSite("New Site", null)).rejects.toThrow("Only admins can edit sites.");
    expect(mockFrom).not.toHaveBeenCalled();
  });

  it("createSite saves a trimmed, active site with its county", async () => {
    const mockInsert = jest.fn().mockResolvedValue({ error: null });
    mockFrom.mockReturnValue({ insert: mockInsert });

    await expect(queries.createSite("  New Site  ", 3)).resolves.toBeUndefined();

    expect(mockFrom).toHaveBeenCalledWith("sites_pa");
    expect(mockInsert).toHaveBeenCalledWith({ namesite: "New Site", ab_county: 3, is_active: true });
  });

  it("createSite refuses an empty name without touching the database", async () => {
    await expect(queries.createSite("   ", null)).rejects.toThrow("Site name is required.");
    expect(mockFrom).not.toHaveBeenCalled();
  });

  it("createSite explains a duplicate name", async () => {
    mockFrom.mockReturnValue({
      insert: jest.fn().mockResolvedValue({ error: { code: "23505", message: "duplicate key" } }),
    });

    await expect(queries.createSite("Bilby NA", null)).rejects.toThrow("A site with this name already exists.");
  });

  it("findSitesWithName returns the matching names, ignoring case", async () => {
    const mockIlike = jest.fn().mockResolvedValue({ data: [{ namesite: "Bilby NA" }], error: null });
    mockFrom.mockReturnValue({ select: jest.fn().mockReturnValue({ ilike: mockIlike }) });

    await expect(queries.findSitesWithName(" bilby na ")).resolves.toEqual(["Bilby NA"]);
    expect(mockIlike).toHaveBeenCalledWith("namesite", "bilby na");
  });

  it("findSitesWithName escapes wildcard characters", async () => {
    const mockIlike = jest.fn().mockResolvedValue({ data: [], error: null });
    mockFrom.mockReturnValue({ select: jest.fn().mockReturnValue({ ilike: mockIlike }) });

    await queries.findSitesWithName("50%_site");

    expect(mockIlike).toHaveBeenCalledWith("namesite", "50\\%\\_site");
  });

  it("findSitesWithName returns nothing for an empty name", async () => {
    await expect(queries.findSitesWithName("  ")).resolves.toEqual([]);
    expect(mockFrom).not.toHaveBeenCalled();
  });
});