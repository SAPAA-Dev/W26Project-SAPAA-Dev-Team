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

describe("site page fields", () => {
  const mockFrom = jest.fn();
  const mockUpsert = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    mockCaller("admin");
    mockUpsert.mockResolvedValue({ error: null });
    mockFrom.mockReturnValue({ upsert: mockUpsert });
    (createServerSupabase as jest.Mock).mockReturnValue({ from: mockFrom });
  });

  it("updateSitePageFields rejects a steward and touches nothing", async () => {
    mockCaller("steward");

    await expect(
      queries.updateSitePageFields(7, [{ fieldKey: "inaturalist", value: "https://example.org", isVisible: true }])
    ).rejects.toThrow("Only admins can edit sites.");
    expect(mockFrom).not.toHaveBeenCalled();
  });

  it("updateSitePageFields saves links and keeps a hidden field's value", async () => {
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
    ).rejects.toThrow("Unknown site page field: secret_notes");
    expect(mockUpsert).not.toHaveBeenCalled();
  });

  it("updateSitePageFields refuses a link that is not http or https", async () => {
    await expect(
      queries.updateSitePageFields(7, [{ fieldKey: "inaturalist", value: "javascript:alert(1)", isVisible: true }])
    ).rejects.toThrow("Links must start with http:// or https://");
    expect(mockUpsert).not.toHaveBeenCalled();
  });

  it("getSiteLinks returns only links that are shown", async () => {
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
});
