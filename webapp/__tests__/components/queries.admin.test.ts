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
  ])("%s rejects an admin whose approval was revoked", async (_name, call) => {
    mockCaller("admin", false);

    await expect(call()).rejects.toThrow("Only admins can edit sites.");
    expect(mockFrom).not.toHaveBeenCalled();
    expect(mockRpc).not.toHaveBeenCalled();
  });

  it("lets an approved admin through", async () => {
    const mockEq = jest.fn().mockResolvedValue({ error: null });
    mockFrom.mockReturnValue({ update: jest.fn().mockReturnValue({ eq: mockEq }) });

    await expect(queries.setFormResponseActive(1, false)).resolves.toBeUndefined();
    expect(mockFrom).toHaveBeenCalledWith("form_responses");
  });
});
