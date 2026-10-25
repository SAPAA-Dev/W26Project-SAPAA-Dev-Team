import * as queries from "../../utils/supabase/queries";
import { createServerSupabase, createClient } from "../../utils/supabase/server";

jest.mock("../../utils/supabase/server", () => ({
  createServerSupabase: jest.fn(),
  createClient: jest.fn(),
}));

function mockCaller(role: string, approved = true) {
  (createClient as jest.Mock).mockResolvedValue({
    auth: {
      getUser: jest.fn().mockResolvedValue({
        data: { user: { id: "user-uuid", app_metadata: { role, authenticated: approved } } },
        error: null,
      }),
    },
    from: jest.fn(),
  });
}

const eq = jest.fn();
const update = jest.fn();
const from = jest.fn();

function mockUpdateResult(result: { error: unknown; count: number | null }) {
  eq.mockResolvedValue(result);
  update.mockReturnValue({ eq });
  from.mockReturnValue({ update });
  (createServerSupabase as jest.Mock).mockReturnValue({ from });
}

describe("boundary colors (admin)", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUpdateResult({ error: null, count: 1 });
  });

  it("stores a site color on one protected area and normalizes the hex value", async () => {
    mockCaller("admin");

    const result = await queries.setSiteBoundaryColor(7, "#AABBCC");

    expect(result).toEqual({ ok: true });
    expect(from).toHaveBeenCalledWith("protected_areas");
    expect(update).toHaveBeenCalledWith(
      { boundary_color: "#aabbcc" },
      { count: "exact" }
    );
    expect(eq).toHaveBeenCalledWith("id", 7);
  });

  it("stores a site-type color on every area of that type", async () => {
    mockCaller("admin");

    const result = await queries.setSiteTypeBoundaryColor(" NA ", "#00ff00");

    expect(result).toEqual({ ok: true });
    expect(from).toHaveBeenCalledWith("protected_areas");
    expect(update).toHaveBeenCalledWith(
      { boundary_color: "#00ff00" },
      { count: "exact" }
    );
    expect(eq).toHaveBeenCalledWith("area_type", "NA");
  });

  it("reports an error when the row or type no longer exists", async () => {
    mockCaller("admin");
    mockUpdateResult({ error: null, count: 0 });

    await expect(queries.setSiteBoundaryColor(7, "#aabbcc")).resolves.toEqual({
      ok: false,
      error: "The color could not be saved.",
    });
  });

  it("does not send a database message to the client", async () => {
    mockCaller("admin");
    mockUpdateResult({ error: { message: "permission denied for table protected_areas" }, count: null });

    await expect(queries.setSiteTypeBoundaryColor("NA", "#aabbcc")).resolves.toEqual({
      ok: false,
      error: "The color could not be saved.",
    });
  });

  it.each([
    ["a short hex value", "#abc"],
    ["a name", "red"],
    ["an empty value", ""],
  ])("rejects %s without writing", async (_label, color) => {
    mockCaller("admin");

    const result = await queries.setSiteBoundaryColor(7, color);

    expect(result).toEqual({ ok: false, error: "The color is not valid." });
    expect(update).not.toHaveBeenCalled();
  });

  it.each([0, -1, 1.5])("rejects the invalid protected area id %p", async (id) => {
    mockCaller("admin");

    const result = await queries.setSiteBoundaryColor(id, "#aabbcc");

    expect(result).toEqual({ ok: false, error: "The protected area is not valid." });
    expect(update).not.toHaveBeenCalled();
  });

  it("rejects a blank site type without writing", async () => {
    mockCaller("admin");

    const result = await queries.setSiteTypeBoundaryColor("   ", "#aabbcc");

    expect(result).toEqual({ ok: false, error: "A site type is required." });
    expect(update).not.toHaveBeenCalled();
  });

  it("rejects a steward before it creates the service-role client", async () => {
    mockCaller("steward");

    const result = await queries.setSiteBoundaryColor(7, "#aabbcc");

    expect(result).toEqual({ ok: false, error: "Only admins can change boundary colors." });
    expect(createServerSupabase).not.toHaveBeenCalled();
  });

  it("rejects an admin who is not approved", async () => {
    mockCaller("admin", false);

    const result = await queries.setSiteTypeBoundaryColor("NA", "#aabbcc");

    expect(result).toEqual({ ok: false, error: "Only admins can change boundary colors." });
    expect(createServerSupabase).not.toHaveBeenCalled();
  });
});
