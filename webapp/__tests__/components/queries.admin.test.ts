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

describe("Supabase admin-only actions", () => {
  const mockFrom = jest.fn();
  const mockRpc = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    mockCaller("admin");
    (createServerSupabase as jest.Mock).mockReturnValue({
      from: mockFrom,
      rpc: mockRpc,
    });
  });

  it.each([
    ["setFormResponseActive", () => queries.setFormResponseActive(1, false)],
    ["getFormResponsesBySiteAdmin", () => queries.getFormResponsesBySiteAdmin("Elk Island")],
    ["getNaturalnessDistribution", () => queries.getNaturalnessDistribution()],
    ["getTopSitesDistribution", () => queries.getTopSitesDistribution()],
    ["getSiteByNameAdmin", () => queries.getSiteByNameAdmin("Elk Island")],
  ])("%s rejects a steward and touches nothing", async (_name, call) => {
    mockCaller("steward");

    await expect(call()).rejects.toThrow("Only admins can edit sites.");
    expect(mockFrom).not.toHaveBeenCalled();
    expect(mockRpc).not.toHaveBeenCalled();
  });

  it.each([
    ["setFormResponseActive", () => queries.setFormResponseActive(1, false)],
    ["getFormResponsesBySiteAdmin", () => queries.getFormResponsesBySiteAdmin("Elk Island")],
    ["getNaturalnessDistribution", () => queries.getNaturalnessDistribution()],
    ["getTopSitesDistribution", () => queries.getTopSitesDistribution()],
    ["getSiteByNameAdmin", () => queries.getSiteByNameAdmin("Elk Island")],
  ])("%s rejects an admin whose approval was revoked", async (_name, call) => {
    mockCaller("admin", false);

    await expect(call()).rejects.toThrow("Only admins can edit sites.");
    expect(mockFrom).not.toHaveBeenCalled();
    expect(mockRpc).not.toHaveBeenCalled();
  });

  it("lets an approved admin through", async () => {
    const mockIs = jest.fn().mockResolvedValue({ error: null });
    const mockEq = jest.fn().mockReturnValue({ is: mockIs });
    mockFrom.mockReturnValue({ update: jest.fn().mockReturnValue({ eq: mockEq }) });

    await expect(queries.setFormResponseActive(1, false)).resolves.toBeUndefined();
    expect(mockFrom).toHaveBeenCalledWith("form_responses");
    expect(mockIs).toHaveBeenCalledWith("archived_at", null);
  });

  it("returns an inactive site for an approved admin (2.0.3 AT4)", async () => {
  const mockLimit = jest.fn().mockResolvedValue({
    data: [
      {
        id: 7,
        namesite: "Inactive Site",
        ab_county: null,
        is_active: false,
        ab_counties: null,
        form_responses: [],
      },
    ],
    error: null,
  });

  const mockEq = jest.fn().mockReturnValue({
    limit: mockLimit,
  });

  mockFrom.mockReturnValueOnce({
    select: jest.fn().mockReturnValue({
      eq: mockEq,
    }),
  });

  const result = await queries.getSiteByNameAdmin("Inactive Site");

  expect(result).toEqual([
    {
      id: 7,
      namesite: "Inactive Site",
      county: null,
      ab_county: null,
      inspectdate: null,
      is_active: false,
      archived_at: null,
    },
  ]);

  expect(mockEq).toHaveBeenCalledTimes(1);
  expect(mockEq).toHaveBeenCalledWith(
    "namesite",
    "Inactive Site"
  );
});
});
