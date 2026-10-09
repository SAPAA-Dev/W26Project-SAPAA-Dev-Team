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
    expect(mockInsert).toHaveBeenCalledWith({
      namesite: "New Site",
      ab_county: 3,
      is_active: true,
      protected_area_id: null,
    });
  });

  it("createSite refuses an empty name without touching the database", async () => {
    await expect(queries.createSite("   ", null)).rejects.toThrow("Site name is required.");
    expect(mockFrom).not.toHaveBeenCalled();
  });

  it("createSite saves the selected protected area", async () => {
    const mockInsert = jest.fn().mockResolvedValue({ error: null });
    mockFrom.mockReturnValue({ insert: mockInsert });

    await queries.createSite("Lakeland Site", null, 9);

    expect(mockInsert).toHaveBeenCalledWith({
      namesite: "Lakeland Site",
      ab_county: null,
      is_active: true,
      protected_area_id: 9,
    });
  });

  it("createSite refuses a protected area id that is not a positive integer", async () => {
    await expect(queries.createSite("New Site", null, 1.5)).rejects.toThrow("The protected area is not valid.");
    expect(mockFrom).not.toHaveBeenCalled();
  });

  it("createSite explains a missing protected area", async () => {
    mockFrom.mockReturnValue({
      insert: jest.fn().mockResolvedValue({ error: { code: "23503", message: "foreign key" } }),
    });

    await expect(queries.createSite("Lakeland Site", null, 9)).rejects.toThrow(
      "The selected protected area does not exist."
    );
  });

  it("createSite explains a protected area that is already linked", async () => {
    mockFrom.mockReturnValue({
      insert: jest.fn().mockResolvedValue({
        error: { code: "23505", message: 'duplicate key value violates unique constraint "sites_pa_protected_area_id_key"' },
      }),
    });

    await expect(queries.createSite("Lakeland Site", null, 9)).rejects.toThrow(
      "That protected area is already linked to a site."
    );
  });

  it("createSite explains a duplicate name", async () => {
    mockFrom.mockReturnValue({
      insert: jest.fn().mockResolvedValue({ error: { code: "23505", message: "duplicate key" } }),
    });

    await expect(queries.createSite("Bilby NA", null)).rejects.toThrow("A site with this name already exists.");
  });

  it("findSitesWithName warns on the same name, ignoring case", async () => {
    mockFrom.mockReturnValue({
      select: jest.fn().mockResolvedValue({ data: [{ namesite: "Bilby NA" }, { namesite: "Elk Island" }], error: null }),
    });

    await expect(queries.findSitesWithName(" bilby na ")).resolves.toEqual(["Bilby NA"]);
  });

  it("findSitesWithName warns when one name contains the other", async () => {
    mockFrom.mockReturnValue({
      select: jest.fn().mockResolvedValue({
        data: [{ namesite: "Bilby Natural Area" }, { namesite: "Wagner Natural Area" }],
        error: null,
      }),
    });

    await expect(queries.findSitesWithName("Bilby")).resolves.toEqual(["Bilby Natural Area"]);
    await expect(queries.findSitesWithName("Bilby Natural Area East")).resolves.toEqual(["Bilby Natural Area"]);
  });

  it("findSitesWithName ignores containment for very short names", async () => {
    mockFrom.mockReturnValue({
      select: jest.fn().mockResolvedValue({ data: [{ namesite: "Elk Island" }], error: null }),
    });

    await expect(queries.findSitesWithName("Elk")).resolves.toEqual([]);
  });

  it("findSitesWithName returns nothing for an empty name", async () => {
    await expect(queries.findSitesWithName("  ")).resolves.toEqual([]);
    expect(mockFrom).not.toHaveBeenCalled();
  });

  it("getSiteSuggestions rejects a steward and touches nothing", async () => {
    mockCaller("steward");

    await expect(queries.getSiteSuggestions()).rejects.toThrow("Only admins can edit sites.");
    expect(mockFrom).not.toHaveBeenCalled();
  });

  it("getSiteSuggestions returns map areas that are not sites yet, once each, sorted", async () => {
    mockFrom.mockImplementation((table: string) => ({
      select: jest.fn().mockResolvedValue(
        table === "protected_areas"
          ? {
              data: [
                { name: "Wagner", folder: "Natural Areas (OC)" },
                { name: "Bilby", folder: "Natural Areas (OC)" },
                { name: "Alexo", folder: "Provincial Recreation Areas" },
                { name: "Alexo", folder: "Protective Notations (PNT)" },
              ],
              error: null,
            }
          : { data: [{ namesite: "WAGNER" }], error: null }
      ),
    }));

    await expect(queries.getSiteSuggestions()).resolves.toEqual([
      { name: "Alexo", category: "Provincial Recreation Areas" },
      { name: "Bilby", category: "Natural Areas (OC)" },
    ]);
  });


});