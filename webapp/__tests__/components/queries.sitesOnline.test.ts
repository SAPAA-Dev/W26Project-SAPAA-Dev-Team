import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { getSitesOnline } from "../../utils/supabase/queries";
import { createClient, createServerSupabase } from "../../utils/supabase/server";

jest.mock("../../utils/supabase/server", () => ({
  createServerSupabase: jest.fn(),
  createClient: jest.fn(),
}));

// The sites page showed the latest inspection date of each site by
// fetching every report of every site. This builds the real PostgREST request to check that
// it now fetches at most one dated and one undated report per site.
describe("getSitesOnline request", () => {
  const mockFetch = jest.fn();

  const signedInAs = (appMetadata: Record<string, unknown> | null) =>
    (createClient as jest.Mock).mockResolvedValue({
      auth: {
        getUser: jest.fn().mockResolvedValue({
          data: { user: appMetadata ? { id: "user-1", app_metadata: appMetadata } : null },
          error: null,
        }),
      },
    });

  beforeEach(() => {
    jest.clearAllMocks();
    signedInAs({ role: "steward", authenticated: true });
    (createServerSupabase as jest.Mock).mockReturnValue(
      createSupabaseClient("http://localhost:54321", "test-key", {
        global: { fetch: mockFetch },
        auth: { persistSession: false },
      })
    );
  });

  function respondWith(status: number, body: unknown) {
    mockFetch.mockResolvedValue(
      new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } })
    );
  }

  function requestedParams() {
    const url = new URL(String(mockFetch.mock.calls[0][0]));
    expect(url.pathname).toBe("/rest/v1/sites_pa");
    return url.searchParams;
  }

  it("asks for the newest active report of each kind, not every report", async () => {
    respondWith(200, []);

    await getSitesOnline();

    const params = requestedParams();
    expect(params.get("select")?.replace(/\s/g, "")).toBe(
      "id,namesite,ab_county,is_active,archived_at,ab_counties(county)," +
        "latest_dated:form_responses(inspection_date,created_at,archived_at)," +
        "latest_undated:form_responses(inspection_date,created_at,archived_at)"
    );
    expect(params.get("latest_dated.archived_at")).toBe("is.null");
    expect(params.get("latest_dated.inspection_date")).toBe("not.is.null");
    expect(params.get("latest_dated.order")).toBe("inspection_date.desc");
    expect(params.get("latest_dated.limit")).toBe("1");
    expect(params.get("latest_undated.archived_at")).toBe("is.null");
    expect(params.get("latest_undated.inspection_date")).toBe("is.null");
    expect(params.get("latest_undated.order")).toBe("created_at.desc");
    expect(params.get("latest_undated.limit")).toBe("1");
    expect(params.get("archived_at")).toBe("is.null");
    expect(params.get("order")).toBe("namesite.asc");
  });

  it("US 2.0.3 AT2: leaves deactivated sites out of the search list and the site pickers", async () => {
    respondWith(200, []);

    await getSitesOnline();

    // A site with no is_active value counts as active (US 2.0.3 AT5).
    expect(requestedParams().get("or")).toBe("(is_active.eq.true,is_active.is.null)");
  });

  it("uses the newer of the dated and the undated report", async () => {
    respondWith(200, [
      {
        id: 1,
        namesite: "Alpha",
        ab_county: 10,
        is_active: true,
        archived_at: null,
        ab_counties: { county: "County1" },
        latest_dated: [{ inspection_date: "2025-06-01", created_at: "2025-06-02T00:00:00Z", archived_at: null }],
        latest_undated: [{ inspection_date: null, created_at: "2025-09-15T00:00:00Z", archived_at: null }],
      },
      {
        id: 2,
        namesite: "Beta",
        ab_county: null,
        is_active: null,
        archived_at: null,
        ab_counties: null,
        latest_dated: [{ inspection_date: "2025-10-01", created_at: "2025-01-01T00:00:00Z", archived_at: null }],
        latest_undated: [],
      },
    ]);

    expect(await getSitesOnline()).toEqual([
      { id: 1, namesite: "Alpha", county: "County1", ab_county: 10, inspectdate: "2025-09-15T00:00:00Z", is_active: true, archived_at: null },
      { id: 2, namesite: "Beta", county: null, ab_county: null, inspectdate: "2025-10-01", is_active: true, archived_at: null },
    ]);
  });

  it("throws when PostgREST refuses the request", async () => {
    respondWith(400, { message: "Could not find a relationship", code: "PGRST200" });

    await expect(getSitesOnline()).rejects.toThrow("Could not find a relationship");
  });

  it.each([
    ["a signed-out caller", null],
    ["an unapproved user", { role: "steward", authenticated: false }],
  ])("refuses %s before querying (#251)", async (_label, appMetadata) => {
    signedInAs(appMetadata);

    await expect(getSitesOnline()).rejects.toThrow("Only approved users can view this data.");
    expect(mockFetch).not.toHaveBeenCalled();
  });
});
