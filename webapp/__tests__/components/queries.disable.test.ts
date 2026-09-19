import * as queries from "../../utils/supabase/queries";
import { createServerSupabase } from "../../utils/supabase/server";

jest.mock("../../utils/supabase/server", () => ({
  createServerSupabase: jest.fn(),
}));

describe("Supabase disable site functions", () => {
  const mockFrom = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
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
          W26_ab_counties: { county: "County1" },
          W26_form_responses: [{ created_at: "2025-11-30" }],
        },
        {
          id: 2,
          namesite: "Inactive Site",
          ab_county: null,
          is_active: false,
          W26_ab_counties: null,
          W26_form_responses: [],
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
  });

  describe("toggleSiteActive", () => {
    it("sets site to inactive", async () => {
      const mockEq = jest.fn().mockResolvedValue({ error: null });
      const mockUpdate = jest.fn().mockReturnValue({ eq: mockEq });
      mockFrom.mockReturnValueOnce({ update: mockUpdate });

      await expect(queries.toggleSiteActive(1, false)).resolves.toBeUndefined();
      expect(mockFrom).toHaveBeenCalledWith("W26_sites-pa");
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
  });
});
