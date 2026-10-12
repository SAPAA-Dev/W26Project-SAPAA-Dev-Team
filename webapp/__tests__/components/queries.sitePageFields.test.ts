import * as queries from "../../utils/supabase/queries";
import { createServerSupabase, createClient } from "../../utils/supabase/server";

jest.mock("../../utils/supabase/server", () => ({
  createServerSupabase: jest.fn(),
  createClient: jest.fn(),
}));

const mockUserFrom = jest.fn();

function mockCaller(role: string, approved = true) {
  (createClient as jest.Mock).mockResolvedValue({
    auth: {
      getUser: jest.fn().mockResolvedValue({
        data: { user: { id: "user-uuid", app_metadata: { role, authenticated: approved } } },
        error: null,
      }),
    },
    from: mockUserFrom,
  });
}

describe("site page fields (US 2.0.5)", () => {
  const mockFrom = jest.fn();
  const mockUpsert = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    mockCaller("admin");
    mockUpsert.mockResolvedValue({ error: null });
    mockFrom.mockReturnValue({ upsert: mockUpsert });
    (createServerSupabase as jest.Mock).mockReturnValue({ from: mockFrom });
  });

  it("updateSitePageFields rejects a steward and touches nothing (2.0.5 AT2)", async () => {
    mockCaller("steward");

    await expect(
      queries.updateSitePageFields(7, [{ fieldKey: "inaturalist", value: "https://example.org", isVisible: true }])
    ).resolves.toEqual({ ok: false, error: "Only admins can edit sites." });
    expect(mockFrom).not.toHaveBeenCalled();
  });

  it("updateSitePageFields saves links and keeps a hidden field's value (2.0.5 AT4)", async () => {
    await queries.updateSitePageFields(7, [
      { fieldKey: "sapaa_website", value: "  https://sapaastewards.com/bilby  ", isVisible: true },
      { fieldKey: "inaturalist", value: "https://www.inaturalist.org/places/bilby", isVisible: false },
    ]);

    expect(mockFrom).toHaveBeenCalledWith("site_page_fields");
    const [rows, options] = mockUpsert.mock.calls[0];
    expect(options).toEqual({ onConflict: "site_id,field_key" });
    expect(rows).toEqual([
      expect.objectContaining({ site_id: 7, field_key: "sapaa_website", value: "https://sapaastewards.com/bilby", is_visible: true, updated_by: "user-uuid" }),
      expect.objectContaining({ site_id: 7, field_key: "inaturalist", value: "https://www.inaturalist.org/places/bilby", is_visible: false }),
    ]);
  });

  it("updateSitePageFields stores no value for the designated steward field", async () => {
    await queries.updateSitePageFields(7, [{ fieldKey: "designated_steward", value: "anything", isVisible: false }]);

    expect(mockUpsert.mock.calls[0][0][0]).toEqual(
      expect.objectContaining({ field_key: "designated_steward", value: null, is_visible: false })
    );
  });

  it("updateSitePageFields refuses a field that is not on the list", async () => {
    await expect(
      queries.updateSitePageFields(7, [{ fieldKey: "secret_notes", value: "x", isVisible: true }])
    ).resolves.toEqual({ ok: false, error: "Unknown site page field: secret_notes" });
    expect(mockUpsert).not.toHaveBeenCalled();
  });

  it("updateSitePageFields refuses a link that is not http or https", async () => {
    await expect(
      queries.updateSitePageFields(7, [{ fieldKey: "inaturalist", value: "javascript:alert(1)", isVisible: true }])
    ).resolves.toEqual({ ok: false, error: "Links must start with http:// or https://" });
    expect(mockUpsert).not.toHaveBeenCalled();
  });

  it.each([
    ["a site id that is not a positive integer", () => queries.updateSitePageFields(1.5, []), "A valid site ID is required."],
    ["fields that are not a list", () => queries.updateSitePageFields(7, null as never), "The site page fields are not valid."],
    [
      "a field listed twice",
      () => queries.updateSitePageFields(7, [
        { fieldKey: "inaturalist", value: "https://a.org", isVisible: true },
        { fieldKey: "inaturalist", value: "https://b.org", isVisible: false },
      ]),
      "Site page field listed twice: inaturalist",
    ],
    [
      "a visibility that is not a boolean",
      () => queries.updateSitePageFields(7, [{ fieldKey: "inaturalist", value: null, isVisible: "yes" as never }]),
      "Visibility must be true or false: inaturalist",
    ],
  ])("US 2.0.5: updateSitePageFields refuses %s and saves nothing (L18)", async (_name, call, message) => {
    await expect(call()).resolves.toEqual({ ok: false, error: message });
    expect(mockUpsert).not.toHaveBeenCalled();
  });

  it("getSiteLinks returns only links that are shown (2.0.5 AT4)", async () => {
    mockUserFrom.mockReturnValue({
      select: jest.fn().mockReturnValue({
        eq: jest.fn().mockResolvedValue({
          data: [
            { field_key: "sapaa_website", value: "https://sapaastewards.com/bilby", is_visible: true },
            { field_key: "inaturalist", value: "https://www.inaturalist.org/places/bilby", is_visible: false },
          ],
          error: null,
        }),
      }),
    });

    await expect(queries.getSiteLinks(7)).resolves.toEqual({
      sapaaWebsiteUrl: "https://sapaastewards.com/bilby",
      iNaturalistUrl: null,
    });
    expect(mockUserFrom).toHaveBeenCalledWith("site_page_fields");
  });

  it("US 2.0.10: getSiteLinks shows the default links for a site with no saved rows (M2)", async () => {
    mockUserFrom.mockReturnValue({
      select: jest.fn().mockReturnValue({ eq: jest.fn().mockResolvedValue({ data: [], error: null }) }),
    });

    await expect(queries.getSiteLinks(7)).resolves.toEqual({
      sapaaWebsiteUrl: "https://sapaastewards.com/",
      iNaturalistUrl: "https://www.inaturalist.org/",
    });
  });

  it("US 2.0.10: getSiteLinks keeps a link the admin cleared or hid empty (M2)", async () => {
    mockUserFrom.mockReturnValue({
      select: jest.fn().mockReturnValue({
        eq: jest.fn().mockResolvedValue({
          data: [
            { field_key: "sapaa_website", value: null, is_visible: true },
            { field_key: "inaturalist", value: null, is_visible: false },
          ],
          error: null,
        }),
      }),
    });

    await expect(queries.getSiteLinks(7)).resolves.toEqual({ sapaaWebsiteUrl: null, iNaturalistUrl: null });
  });
});
