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

describe("getProtectedAreaBoundaries (US 2.0.6)", () => {
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

  const mockLinksIs = jest.fn();

  interface MockQueryBuilder {
    not: jest.Mock;
    is: jest.Mock;
    order: jest.Mock;
    limit: jest.Mock;
    then: (resolve: (value: unknown) => unknown) => Promise<unknown>;
  }

  function mockLinks(rows: unknown[]) {
    const builder = {} as MockQueryBuilder;
    builder.not = jest.fn(() => builder);
    builder.is = jest.fn((column: string, value: unknown) => {
      // Keep the archived filter visible to the test that checks it.
      if (column === "archived_at") mockLinksIs(column, value);
      return builder;
    });
    builder.order = jest.fn(() => builder);
    builder.limit = jest.fn(() => builder);
    builder.then = (resolve) => Promise.resolve({ data: rows, error: null }).then(resolve);

    mockAdminFrom.mockReturnValue({
      select: jest.fn(() => builder),
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

  it("attaches the county and active flag from the linked site (2.0.6 AT1)", async () => {
    mockAreas([area]);
    mockLinks([{ protected_area_id: 7, is_active: false, ab_counties: { county: "Parkland" } }]);

    const collection = await queries.getProtectedAreaBoundaries();

    expect(collection.features[0].properties.county).toBe("Parkland");
    expect(collection.features[0].properties.is_active).toBe(false);
  });

  it("maps the admin-chosen boundary color into the feature", async () => {
    mockAreas([{ ...area, boundary_color: "#AABBCC" }]);
    mockLinks([]);

    const collection = await queries.getProtectedAreaBoundaries();

    expect(collection.features[0].properties.boundary_color).toBe("#AABBCC");
  });

  it("leaves the boundary color null when the column is empty", async () => {
    mockAreas([area]);
    mockLinks([]);

    const collection = await queries.getProtectedAreaBoundaries();

    expect(collection.features[0].properties.boundary_color).toBeNull();
  });

  it("reads links only from sites that are not archived (M10)", async () => {
    mockAreas([area]);
    mockLinks([]);

    await queries.getProtectedAreaBoundaries();

    expect(mockLinksIs).toHaveBeenCalledWith("archived_at", null);
  });

  it("treats a linked site with a null active flag as active (L21)", async () => {
    mockAreas([area]);
    mockLinks([{ protected_area_id: 7, is_active: null, ab_counties: { county: "Parkland" } }]);

    const collection = await queries.getProtectedAreaBoundaries();

    expect(collection.features[0].properties.is_active).toBe(true);
  });

  it("leaves county and status empty when no site joins the protected area (2.0.6 AT1)", async () => {
    mockAreas([area]);
    mockLinks([]);

    const collection = await queries.getProtectedAreaBoundaries();

    expect(collection.features[0].properties.county).toBeNull();
    expect(collection.features[0].properties.is_active).toBeNull();
  });

  it("attaches the site name and inspection date from the linked site (US 2.0.8 AT2)", async () => {
    mockAreas([area]);
    mockLinks([
      {
        protected_area_id: 7,
        is_active: true,
        namesite: "Wainwright Dunes",
        ab_counties: { county: "Parkland" },
        latest_dated: [
          { inspection_date: "2024-03-15", created_at: "2024-03-16T10:00:00Z", archived_at: null },
        ],
        latest_undated: [],
      },
    ]);

    const collection = await queries.getProtectedAreaBoundaries();

    expect(collection.features[0].properties.site_name).toBe("Wainwright Dunes");
    expect(collection.features[0].properties.last_inspection_date).toBe("2024-03-15");
  });

  it("uses created_at for the newest report with no inspection date (US 2.0.8 AT2)", async () => {
    mockAreas([area]);
    mockLinks([
      {
        protected_area_id: 7,
        is_active: true,
        namesite: "Wainwright Dunes",
        ab_counties: null,
        latest_dated: [],
        latest_undated: [
          { inspection_date: null, created_at: "2024-04-01T09:00:00Z", archived_at: null },
        ],
      },
    ]);

    const collection = await queries.getProtectedAreaBoundaries();

    expect(collection.features[0].properties.last_inspection_date).toBe("2024-04-01T09:00:00Z");
  });

  it("leaves the site name and date null when no site joins the area (US 2.0.8 AT2)", async () => {
    mockAreas([area]);
    mockLinks([]);

    const collection = await queries.getProtectedAreaBoundaries();

    expect(collection.features[0].properties.site_name).toBeNull();
    expect(collection.features[0].properties.last_inspection_date).toBeNull();
  });

  it("ignores an archived report when it sets the date (US 2.0.8 AT2)", async () => {
    mockAreas([area]);
    mockLinks([
      {
        protected_area_id: 7,
        is_active: true,
        namesite: "Wainwright Dunes",
        ab_counties: null,
        latest_dated: [
          { inspection_date: "2024-03-15", created_at: "2024-03-16T10:00:00Z", archived_at: "2024-05-01T00:00:00Z" },
        ],
        latest_undated: [],
      },
    ]);

    const collection = await queries.getProtectedAreaBoundaries();

    expect(collection.features[0].properties.last_inspection_date).toBeNull();
  });

  it("omits an inactive site for a steward (2.0.3 AT2)", async () => {
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
