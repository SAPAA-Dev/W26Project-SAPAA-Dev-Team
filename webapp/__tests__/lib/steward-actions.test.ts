import {
  searchStewards,
  assignSiteSteward,
  getSiteSteward,
  getSitesForSteward,
  getPersonByAuthUserId,
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

function mockUser(role: string | null, approved: boolean) {
  const user = role === null ? null : { id: "admin-uuid", app_metadata: { role, authenticated: approved } };
  return { data: { user }, error: null };
}

describe("steward-actions", () => {
  let userFrom: jest.Mock;
  let serviceFrom: jest.Mock;

  function setup(role: string | null, approved = true) {
    userFrom = jest.fn();
    serviceFrom = jest.fn();
    (createClient as jest.Mock).mockResolvedValue({
      auth: { getUser: jest.fn().mockResolvedValue(mockUser(role, approved)) },
      from: userFrom,
    });
    (createServerSupabase as jest.Mock).mockReturnValue({ from: serviceFrom });
  }

  beforeEach(() => jest.clearAllMocks());

  describe("assignSiteSteward", () => {
    it("rejects a steward and writes nothing (3.0.2 AT4)", async () => {
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

    it("rejects an admin whose approval was revoked (3.0.2 AT4)", async () => {
      setup("admin", false);
      const result = await assignSiteSteward(1, 2);
      expect(result).toEqual({ success: false, error: "Only admins can assign a steward." });
      expect(serviceFrom).not.toHaveBeenCalled();
    });

    it("rejects invalid ids", async () => {
      setup("admin");
      expect((await assignSiteSteward(0, 2)).success).toBe(false);
      expect((await assignSiteSteward(1, 2.5)).success).toBe(false);
      expect(serviceFrom).not.toHaveBeenCalled();
    });

    it("upserts on site_id so a new steward replaces the old one (3.0.2 AT2)", async () => {
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
    it("returns nothing for non-admins (3.0.2 AT1)", async () => {
      setup("steward");
      expect(await searchStewards("ann")).toEqual([]);
      expect(userFrom).not.toHaveBeenCalled();
    });

    it("returns nothing for an admin whose approval was revoked", async () => {
      setup("admin", false);
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

    it("matches %, _ and \\ as plain characters (3.0.2 AT1)", async () => {
      setup("admin");
      const b = builder({ data: [], error: null });
      userFrom.mockReturnValue(b);

      await searchStewards("50%_a\\b");
      expect(b.ilike).toHaveBeenCalledWith("display_name", "%50\\%\\_a\\\\b%");
    });

    it("does not treat * as a wildcard (3.0.2 AT1)", async () => {
      setup("admin");
      expect(await searchStewards("*")).toEqual([]);
      expect(userFrom).not.toHaveBeenCalled();

      const b = builder({ data: [], error: null });
      userFrom.mockReturnValue(b);
      await searchStewards("a*n");
      expect(b.ilike).toHaveBeenCalledWith("display_name", "%an%");
    });
  });

  describe("getSiteSteward", () => {
    it("returns the assigned steward (3.0.2 AT3)", async () => {
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
    it("returns the steward's sites (3.0.2 AT3)", async () => {
      setup("steward");
      userFrom.mockReturnValue(builder({ data: [{ site_id: 7, sites_pa: { namesite: "Elk Island" } }], error: null }));
      expect(await getSitesForSteward(3)).toEqual([{ siteId: 7, namesite: "Elk Island", isActive: true }]);
    });

    it("US 2.0.3: marks a deactivated site so the profile does not link to it (M25)", async () => {
      setup("steward");
      userFrom.mockReturnValue(builder({
        data: [{ site_id: 8, sites_pa: { namesite: "Duck Lake", archived_at: null, is_active: false } }],
        error: null,
      }));
      expect(await getSitesForSteward(3)).toEqual([{ siteId: 8, namesite: "Duck Lake", isActive: false }]);
    });
  });

  describe("getPersonByAuthUserId", () => {
    it("returns the person who submitted an inspection (1.0.1 AT3)", async () => {
      setup("steward");
      userFrom.mockReturnValue(builder({ data: { id: 3, display_name: "Ann Lee" }, error: null }));
      expect(await getPersonByAuthUserId("user-uuid")).toEqual({ id: 3, displayName: "Ann Lee" });
      expect(userFrom).toHaveBeenCalledWith("people");
    });

    it("returns null when the user has no person record", async () => {
      setup("steward");
      userFrom.mockReturnValue(builder({ data: null, error: null }));
      expect(await getPersonByAuthUserId("user-uuid")).toBeNull();
    });
  });
});
