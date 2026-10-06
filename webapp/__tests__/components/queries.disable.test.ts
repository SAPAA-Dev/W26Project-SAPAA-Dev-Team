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

describe("Supabase disable site functions", () => {
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

      mockFrom.mockReturnValueOnce({
        select: jest.fn().mockReturnThis(),
        order: jest.fn().mockResolvedValue({ data: mockData, error: null }),
      });

      const result = await queries.getAllSites();

      expect(result).toEqual([
        { id: 1, namesite: "Active Site", county: "County1", ab_county: 10, inspectdate: "2025-11-30", is_active: true },
        { id: 2, namesite: "Inactive Site", county: null, ab_county: null, inspectdate: null, is_active: false },
      ]);
    });

    it("throws error if Supabase fails", async () => {
      mockFrom.mockReturnValueOnce({
        select: jest.fn().mockReturnThis(),
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
    it("sets site to inactive", async () => {
      const mockEq = jest.fn().mockResolvedValue({ error: null });
      const mockUpdate = jest.fn().mockReturnValue({ eq: mockEq });
      mockFrom.mockReturnValueOnce({ update: mockUpdate });

      await expect(queries.toggleSiteActive(1, false)).resolves.toBeUndefined();
      expect(mockFrom).toHaveBeenCalledWith("sites_pa");
      expect(mockUpdate).toHaveBeenCalledWith({ is_active: false });
      expect(mockEq).toHaveBeenCalledWith("id", 1);
    });

    it("sets site to active", async () => {
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

    it("rejects a steward and writes nothing", async () => {
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
