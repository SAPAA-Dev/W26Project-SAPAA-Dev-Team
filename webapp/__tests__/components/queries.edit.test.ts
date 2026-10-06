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

describe("Supabase edit site functions", () => {
  const mockFrom = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    mockCaller("admin");
    (createServerSupabase as jest.Mock).mockReturnValue({
      from: mockFrom,
    });
  });

  describe("getCounties", () => {
    it("returns sorted list of counties", async () => {
      const mockData = [
        { id: 1, county: "Brazeau County" },
        { id: 2, county: "Clearwater County" },
      ];

      mockFrom.mockReturnValueOnce({
        select: jest.fn().mockReturnThis(),
        order: jest.fn().mockResolvedValue({ data: mockData, error: null }),
      });

      const result = await queries.getCounties();
      expect(result).toEqual([
        { id: 1, county: "Brazeau County" },
        { id: 2, county: "Clearwater County" },
      ]);
    });

    it("returns empty array when no counties exist", async () => {
      mockFrom.mockReturnValueOnce({
        select: jest.fn().mockReturnThis(),
        order: jest.fn().mockResolvedValue({ data: [], error: null }),
      });

      const result = await queries.getCounties();
      expect(result).toEqual([]);
    });

    it("throws error if Supabase fails", async () => {
      mockFrom.mockReturnValueOnce({
        select: jest.fn().mockReturnThis(),
        order: jest.fn().mockResolvedValue({ data: null, error: { message: "Failed counties" } }),
      });

      await expect(queries.getCounties()).rejects.toThrow("Failed counties");
    });

    it("rejects a steward and reads nothing", async () => {
      mockCaller("steward");

      await expect(queries.getCounties()).rejects.toThrow("Only admins can edit sites.");
      expect(mockFrom).not.toHaveBeenCalled();
    });

    it("rejects an admin whose approval was revoked", async () => {
      mockCaller("admin", false);

      await expect(queries.getCounties()).rejects.toThrow("Only admins can edit sites.");
      expect(mockFrom).not.toHaveBeenCalled();
    });
  });

  describe("updateSite", () => {
    it("updates site name and county successfully", async () => {
      const mockUpdate = jest.fn().mockReturnThis();
      const mockEq = jest.fn().mockResolvedValue({ error: null });
      mockFrom.mockReturnValueOnce({
        update: mockUpdate,
        eq: mockEq,
      });
      // Chain: from().update().eq()
      mockUpdate.mockReturnValue({ eq: mockEq });

      await expect(queries.updateSite(1, "New Name", 5)).resolves.toBeUndefined();
      expect(mockFrom).toHaveBeenCalledWith("sites_pa");
      expect(mockUpdate).toHaveBeenCalledWith({ namesite: "New Name", ab_county: 5 });
      expect(mockEq).toHaveBeenCalledWith("id", 1);
    });

    it("updates site with null county", async () => {
      const mockEq = jest.fn().mockResolvedValue({ error: null });
      const mockUpdate = jest.fn().mockReturnValue({ eq: mockEq });
      mockFrom.mockReturnValueOnce({ update: mockUpdate });

      await expect(queries.updateSite(1, "Name", null)).resolves.toBeUndefined();
      expect(mockUpdate).toHaveBeenCalledWith({ namesite: "Name", ab_county: null });
    });

    it("throws error if Supabase fails", async () => {
      const mockEq = jest.fn().mockResolvedValue({ error: { message: "Update failed" } });
      const mockUpdate = jest.fn().mockReturnValue({ eq: mockEq });
      mockFrom.mockReturnValueOnce({ update: mockUpdate });

      await expect(queries.updateSite(1, "Name", 5)).rejects.toThrow("Update failed");
    });

    it("rejects a steward and writes nothing", async () => {
      mockCaller("steward");

      await expect(queries.updateSite(1, "Name", 5)).rejects.toThrow("Only admins can edit sites.");
      expect(mockFrom).not.toHaveBeenCalled();
    });

    it("rejects an admin whose approval was revoked", async () => {
      mockCaller("admin", false);

      await expect(queries.updateSite(1, "Name", 5)).rejects.toThrow("Only admins can edit sites.");
      expect(mockFrom).not.toHaveBeenCalled();
    });
  });
});
