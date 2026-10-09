import * as queries from "../../utils/supabase/queries";
import { createServerSupabase, createClient } from "../../utils/supabase/server";

jest.mock("../../utils/supabase/server", () => ({
  createServerSupabase: jest.fn(),
  createClient: jest.fn(),
}));

const SQUARE = {
  type: "MultiPolygon",
  coordinates: [[[
    [0, 0],
    [1, 0],
    [1, 1],
    [0, 1],
    [0, 0],
  ]]],
};

function mockCaller(role: string, approved = true) {
  const userFrom = jest.fn();
  (createClient as jest.Mock).mockResolvedValue({
    auth: {
      getUser: jest.fn().mockResolvedValue({
        data: { user: { id: "user-uuid", app_metadata: { role, authenticated: approved } } },
        error: null,
      }),
    },
    from: userFrom,
  });
  return userFrom;
}

describe("getProtectedAreaBoundaries", () => {
  const mockAdminFrom = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    (createServerSupabase as jest.Mock).mockReturnValue({ from: mockAdminFrom });
  });

  function mockAreas(rows: unknown[]) {
    const userFrom = mockCaller("admin");
    userFrom.mockReturnValue({
      select: jest.fn().mockResolvedValue({ data: rows, error: null }),
    });
  }

  function mockLinks(rows: unknown[]) {
    mockAdminFrom.mockReturnValue({
      select: jest.fn().mockReturnValue({
        not: jest.fn().mockResolvedValue({ data: rows, error: null }),
      }),
    });
  }

  const area = {
    id: 7,
    name: "Wainwright Dunes",
    fid: 12,
    area_type: "ER",
    subtype: null,
    iucn: null,
    oc_no: null,
    acres: null,
    hectares: null,
    oc_date: null,
    date_est: null,
    oc_name: null,
    notes: null,
    geometry: SQUARE,
  };

  it("attaches the county and active flag from the linked site", async () => {
    mockAreas([area]);
    mockLinks([{ protected_area_id: 7, is_active: false, ab_counties: { county: "Parkland" } }]);

    const collection = await queries.getProtectedAreaBoundaries();

    expect(collection.features[0].properties.county).toBe("Parkland");
    expect(collection.features[0].properties.is_active).toBe(false);
  });

  it("leaves county and status empty when no site joins the protected area", async () => {
    mockAreas([area]);
    mockLinks([]);

    const collection = await queries.getProtectedAreaBoundaries();

    expect(collection.features[0].properties.county).toBeNull();
    expect(collection.features[0].properties.is_active).toBeNull();
  });

  it("omits an inactive site for a steward", async () => {
    const userFrom = mockCaller("steward");
    userFrom.mockReturnValue({
      select: jest.fn().mockResolvedValue({ data: [area], error: null }),
    });
    mockLinks([{ protected_area_id: 7, is_active: false, ab_counties: { county: "Parkland" } }]);

    const collection = await queries.getProtectedAreaBoundaries();

    expect(collection.features).toEqual([]);
  });

  it("rejects a user who is not approved and reads nothing", async () => {
    const userFrom = mockCaller("steward", false);

    await expect(queries.getProtectedAreaBoundaries()).rejects.toThrow(
      "You must be signed in to view site boundaries."
    );
    expect(userFrom).not.toHaveBeenCalled();
    expect(mockAdminFrom).not.toHaveBeenCalled();
  });
});
