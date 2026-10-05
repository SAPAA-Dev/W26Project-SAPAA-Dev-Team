import {
  searchStewards,
  assignSiteSteward,
  getSiteSteward,
  getSitesForSteward,
} from "../../utils/steward-actions";
import { createClient, createServerSupabase } from "../../utils/supabase/server";

jest.mock("../../utils/supabase/server", () => ({
  createClient: jest.fn(),
  createServerSupabase: jest.fn(),
}));

// A chainable query builder whose final await resolves to `result`.
function builder(result: unknown) {
  const b: Record<string, jest.Mock> & { then?: unknown } = {};
  for (const m of ["select", "ilike", "order", "limit", "eq", "upsert", "maybeSingle"]) {
    b[m] = jest.fn(() => b);
  }
  b.then = (resolve: (v: unknown) => unknown) => Promise.resolve(result).then(resolve);
  return b;
}

function mockUser(role: string | null) {
  const user = role === null ? null : { id: "admin-uuid", user_metadata: { role } };
  return { data: { user }, error: null };
}

describe("steward-actions", () => {
  let userFrom: jest.Mock;
  let serviceFrom: jest.Mock;

  function setup(role: string | null) {
    userFrom = jest.fn();
    serviceFrom = jest.fn();
    (createClient as jest.Mock).mockResolvedValue({
      auth: { getUser: jest.fn().mockResolvedValue(mockUser(role)) },
      from: userFrom,
    });
    (createServerSupabase as jest.Mock).mockReturnValue({ from: serviceFrom });
  }

  beforeEach(() => jest.clearAllMocks());

  describe("assignSiteSteward", () => {
    it("rejects a steward and writes nothing (AT4)", async () => {
      setup("steward");
      const result = await assignSiteSteward(1, 2);
      expect(result).toEqual({ success: false, error: "Only admins can assign a steward." });
      expect(serviceFrom).not.toHaveBeenCalled();
    });

    it("rejects a signed-out caller", async () => {
      setup(null);
      const result = await assignSiteSteward(1, 2);
      expect(result.success).toBe(false);
      expect(serviceFrom).not.toHaveBeenCalled();
    });

    it("rejects invalid ids", async () => {
      setup("admin");
      expect((await assignSiteSteward(0, 2)).success).toBe(false);
      expect((await assignSiteSteward(1, 2.5)).success).toBe(false);
      expect(serviceFrom).not.toHaveBeenCalled();
    });

    it("upserts on site_id so a new steward replaces the old one (AT2)", async () => {
      setup("admin");
      const b = builder({ error: null });
      serviceFrom.mockReturnValue(b);

      const result = await assignSiteSteward(7, 3);

      expect(result).toEqual({ success: true });
      expect(serviceFrom).toHaveBeenCalledWith("site_stewards");
      expect(b.upsert).toHaveBeenCalledWith(
        expect.objectContaining({ site_id: 7, steward_id: 3, assigned_by: "admin-uuid" }),
        { onConflict: "site_id" }
      );
    });

    it("returns the database error", async () => {
      setup("admin");
      serviceFrom.mockReturnValue(builder({ error: { message: "fk violation" } }));
      expect(await assignSiteSteward(7, 3)).toEqual({ success: false, error: "fk violation" });
    });
  });

  describe("searchStewards", () => {
    it("returns nothing for non-admins (AT1)", async () => {
      setup("steward");
      expect(await searchStewards("ann")).toEqual([]);
      expect(userFrom).not.toHaveBeenCalled();
    });

    it("returns nothing for a blank query", async () => {
      setup("admin");
      expect(await searchStewards("   ")).toEqual([]);
      expect(userFrom).not.toHaveBeenCalled();
    });

    it("searches people by name for admins", async () => {
      setup("admin");
      const b = builder({ data: [{ id: 3, display_name: "Ann Lee" }], error: null });
      userFrom.mockReturnValue(b);

      expect(await searchStewards(" ann ")).toEqual([{ id: 3, displayName: "Ann Lee" }]);
      expect(userFrom).toHaveBeenCalledWith("people");
      expect(b.ilike).toHaveBeenCalledWith("display_name", "%ann%");
    });
  });

  describe("getSiteSteward", () => {
    it("returns the assigned steward (AT3)", async () => {
      setup("steward");
      userFrom.mockReturnValue(builder({ data: { people: { id: 3, display_name: "Ann Lee" } }, error: null }));
      expect(await getSiteSteward(7)).toEqual({ id: 3, displayName: "Ann Lee" });
    });

    it("returns null when no steward is assigned", async () => {
      setup("steward");
      userFrom.mockReturnValue(builder({ data: null, error: null }));
      expect(await getSiteSteward(7)).toBeNull();
    });
  });

  describe("getSitesForSteward", () => {
    it("returns the steward's sites (AT3)", async () => {
      setup("steward");
      userFrom.mockReturnValue(builder({ data: [{ site_id: 7, sites_pa: { namesite: "Elk Island" } }], error: null }));
      expect(await getSitesForSteward(3)).toEqual([{ siteId: 7, namesite: "Elk Island" }]);
    });
  });
});
