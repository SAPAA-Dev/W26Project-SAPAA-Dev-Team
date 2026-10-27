import * as queries from "../../utils/supabase/queries";
import { createServerSupabase, createClient } from "../../utils/supabase/server";

jest.mock("../../utils/supabase/server", () => ({
  createServerSupabase: jest.fn(),
  createClient: jest.fn(),
}));

function mockCaller(role: string | null, approved = true) {
  const user = role === null ? null : { id: "admin-uuid", app_metadata: { role, authenticated: approved } };
  (createClient as jest.Mock).mockResolvedValue({
    auth: { getUser: jest.fn().mockResolvedValue({ data: { user }, error: null }) },
  });
}

describe("Supabase disable site functions (US 2.0.3)", () => {
  const mockFrom = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    mockCaller("admin");
    (createServerSupabase as jest.Mock).mockReturnValue({
      from: mockFrom,
    });
  });

  describe("getAllSites", () => {
    it("returns all sites including inactive ones", async () => {
      const mockData = [
        {
          id: 1,
          namesite: "Active Site",
          ab_county: 10,
          is_active: true,
          ab_counties: { county: "County1" },
          form_responses: [{ created_at: "2025-11-30" }],
        },
        {
          id: 2,
          namesite: "Inactive Site",
          ab_county: null,
          is_active: false,
          ab_counties: null,
          form_responses: [],
        },
      ];

      const mockIs = jest.fn().mockReturnThis();
      mockFrom.mockReturnValueOnce({
        select: jest.fn().mockReturnThis(),
        is: mockIs,
        order: jest.fn().mockResolvedValue({ data: mockData, error: null }),
      });

      const result = await queries.getAllSites();

      expect(mockIs).toHaveBeenCalledWith("archived_at", null);
      expect(result).toEqual([
        { id: 1, namesite: "Active Site", county: "County1", ab_county: 10, inspectdate: "2025-11-30", is_active: true, archived_at: null, protected_area_id: null },
        { id: 2, namesite: "Inactive Site", county: null, ab_county: null, inspectdate: null, is_active: false, archived_at: null, protected_area_id: null },
      ]);
    });

    it("(6.0.1 AT2) returns the boundary link or null for each site", async () => {
      const mockData = [
        {
          id: 1,
          namesite: "Linked Site",
          ab_county: 10,
          is_active: true,
          protected_area_id: 42,
          ab_counties: { county: "County1" },
          form_responses: [],
        },
        {
          id: 2,
          namesite: "Free Site",
          ab_county: null,
          is_active: true,
          protected_area_id: null,
          ab_counties: null,
          form_responses: [],
        },
      ];

      const mockIs = jest.fn().mockReturnThis();
      mockFrom.mockReturnValueOnce({
        select: jest.fn().mockReturnThis(),
        is: mockIs,
        order: jest.fn().mockResolvedValue({ data: mockData, error: null }),
      });

      const result = await queries.getAllSites();

      expect(result.map((site) => site.protected_area_id)).toEqual([42, null]);
    });

    it("throws error if Supabase fails", async () => {
      mockFrom.mockReturnValueOnce({
        select: jest.fn().mockReturnThis(),
        is: jest.fn().mockReturnThis(),
        order: jest.fn().mockResolvedValue({ data: null, error: { message: "Failed" } }),
      });

      await expect(queries.getAllSites()).rejects.toThrow("Failed");
    });

    it("rejects a steward and reads nothing", async () => {
      mockCaller("steward");

      await expect(queries.getAllSites()).rejects.toThrow("Only admins can edit sites.");
      expect(mockFrom).not.toHaveBeenCalled();
    });

    it("rejects an admin whose approval was revoked", async () => {
      mockCaller("admin", false);

      await expect(queries.getAllSites()).rejects.toThrow("Only admins can edit sites.");
      expect(mockFrom).not.toHaveBeenCalled();
    });
  });

  describe("toggleSiteActive", () => {
    it("sets site to inactive (2.0.3 AT1)", async () => {
      const mockEq = jest.fn().mockResolvedValue({ error: null });
      const mockUpdate = jest.fn().mockReturnValue({ eq: mockEq });
      mockFrom.mockReturnValueOnce({ update: mockUpdate });

      await expect(queries.toggleSiteActive(1, false)).resolves.toBeUndefined();
      expect(mockFrom).toHaveBeenCalledWith("sites_pa");
      expect(mockUpdate).toHaveBeenCalledWith({ is_active: false });
      expect(mockEq).toHaveBeenCalledWith("id", 1);
    });

    it("sets site to active (2.0.3 AT1)", async () => {
      const mockEq = jest.fn().mockResolvedValue({ error: null });
      const mockUpdate = jest.fn().mockReturnValue({ eq: mockEq });
      mockFrom.mockReturnValueOnce({ update: mockUpdate });

      await expect(queries.toggleSiteActive(1, true)).resolves.toBeUndefined();
      expect(mockUpdate).toHaveBeenCalledWith({ is_active: true });
    });

    it("throws error if Supabase fails", async () => {
      const mockEq = jest.fn().mockResolvedValue({ error: { message: "Toggle failed" } });
      const mockUpdate = jest.fn().mockReturnValue({ eq: mockEq });
      mockFrom.mockReturnValueOnce({ update: mockUpdate });

      await expect(queries.toggleSiteActive(1, false)).rejects.toThrow("Toggle failed");
    });

    it("rejects a steward and writes nothing (2.0.3 AT1)", async () => {
      mockCaller("steward");

      await expect(queries.toggleSiteActive(1, false)).rejects.toThrow("Only admins can edit sites.");
      expect(mockFrom).not.toHaveBeenCalled();
    });

    it("rejects an admin whose approval was revoked", async () => {
      mockCaller("admin", false);

      await expect(queries.toggleSiteActive(1, false)).rejects.toThrow("Only admins can edit sites.");
      expect(mockFrom).not.toHaveBeenCalled();
    });
  });
});
