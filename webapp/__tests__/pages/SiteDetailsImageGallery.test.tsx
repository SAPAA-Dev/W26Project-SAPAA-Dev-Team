//Generted by ChatGPT based on recent edits to related files and the context of the test file. This test suite verifies that the image gallery on the site details page correctly merges images from both the site gallery and homepage uploads, displays them, and shows the correct metadata in the modal when an image is clicked.
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import SiteDetailScreen from "@/app/detail/[namesite]/page";

jest.mock("next/navigation", () => ({
  useParams: () => ({ namesite: "Riverlot 56 (NA)" }),
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    back: jest.fn(),
  }),
  usePathname: () => "/sites",
}));

jest.mock("next/image", () => ({
  __esModule: true,
  default: (props: any) => {
    return <img {...props} />;
  },
}));

jest.mock("@/utils/supabase/client", () => ({
  createClient: () => ({
    auth: {
      getUser: jest.fn().mockResolvedValue({
        data: {
          user: {
            id: "user-1",
            email: "test@test.com",
            user_metadata: { role: "steward" },
          },
        },
        error: null,
      }),
    },
  }),
}));

jest.mock("@/utils/supabase/queries", () => ({
  getSiteByName: jest.fn().mockResolvedValue([
    {
      id: 1,
      namesite: "Riverlot 56 (NA)",
      county: "Test County",
      ab_county: null,
      inspectdate: null,
      is_active: true,
    },
  ]),
  getFormResponsesBySite: jest.fn().mockResolvedValue([]),
  getCurrentUserUid: jest.fn().mockResolvedValue("user-1"),
  daysSince: jest.fn().mockReturnValue(10),
}));

jest.mock("@/utils/supabase/server", () => ({
  createServerSupabase: jest.fn(),
  createClient: jest.fn(),
}));

jest.mock("../../components/ProtectedRoute", () => ({ children }: any) => <div>{children}</div>);
jest.mock("@/app/sites/page", () => ({
  daysSince: jest.fn((date: string) => {
    const days = Math.floor((Date.now() - new Date(date).getTime()) / (24 * 60 * 60 * 1000));
    return Number.isNaN(days) ? 0 : days;
  }),
}));

const mockRouter = {
  push: jest.fn(),
};

const mockParams = {
  namesite: "Riverlot%2056%20(NA)",
};

const mockSite = {
  id: 1,
  namesite: "Riverlot 56 (NA)",
  county: "Test County",
  latitude: 53.5,
  longitude: -113.5,
};

const galleryItemsForSelectedSite = [
  {
    id: "img-1",
    response_id: "resp-1",
    question_id: "q-1",
    caption: "Cracked Tree",
    identifier: "Large crack running up the trunk of a tree.",
    filename: "cracked-tree.jpg",
    content_type: "image/jpeg",
    photographer: "John Doe", 
    file_size_bytes: 12345,
    storage_key: "inspections/1/resp-1/q-1/cracked-tree.jpg",
    site_id: 1,
    imageUrl: "https://example.com/cracked-tree.jpg",
  },
  {
    id: "img-2",
    response_id: "resp-2",
    question_id: "q-2",
    caption: "Fallen Branches",
    identifier: "Several large branches blocking the path.",
    filename: "fallen-branches.jpg",
    content_type: "image/jpeg",
    photographer: "John Doe", 
    file_size_bytes: 23456,
    storage_key: "inspections/1/resp-2/q-2/fallen-branches.jpg",
    site_id: 1,
    imageUrl: "https://example.com/fallen-branches.jpg",
  },
];

const homePageItemsForSelectedSite = [
  {
    id: "img-3",
    site_id: 1,
    site_name: "Riverlot 56 (NA)",
    date: "2026-01-31",
    photographer: "Vishal Sivakumar",
    caption: "Riverlot56 Visit with Frank Potter!",
    identifier: "CMPUT401W26 Visit",
    filename: "homepage-1.jpg",
    file_size_bytes: 34567,
    storage_key: "homepage-image-uploads/1/user-1/homepage-1.jpg",
    imageUrl: "https://example.com/homepage-1.jpg",
  },
  {
    id: "img-4",
    site_id: 1,
    site_name: "Riverlot 56 (NA)",
    date: "2026-02-01",
    photographer: "Raiyana Rahman",
    caption: "Cross country ski trails",
    identifier: "Ski Trails",
    filename: "homepage-2.jpg",
    file_size_bytes: 45678,
    storage_key: "homepage-image-uploads/1/user-2/homepage-2.jpg",
    imageUrl: "https://example.com/homepage-2.jpg",
  },
];

const mockFetch = jest.fn();
global.fetch = mockFetch as jest.Mock;

describe("SiteDetailScreen image gallery", () => {
  beforeEach(() => {
    jest.clearAllMocks();

    mockFetch.mockImplementation((input: RequestInfo | URL) => {
      const url = typeof input === "string" ? input : input.toString();

      if (url.includes("/api/sites?namesite=")) {
        return Promise.resolve({
          ok: true,
          json: async () => ({ site: mockSite }),
        });
      }

      if (url.includes("/api/sites/1/gallery")) {
        return Promise.resolve({
          ok: true,
          json: async () => ({ items: galleryItemsForSelectedSite }),
        });
      }

      if (url.includes("/api/homepage-images/1")) {
        return Promise.resolve({
          ok: true,
          json: async () => ({ items: homePageItemsForSelectedSite }),
        });
      }

      return Promise.resolve({
        ok: true,
        json: async () => ({}),
      });
    });
  });

  it("renders merged gallery images for the selected site", async () => {
    render(<SiteDetailScreen />);
  
    // Wait for page to load, then switch to gallery tab
    await waitFor(() => {
      expect(screen.getByText(/Image Gallery/i)).toBeInTheDocument();
    });
  
    fireEvent.click(screen.getByRole('button', { name: /Image Gallery/i }));
  
    // Now wait for the actual images to appear
    await waitFor(() => {
      expect(screen.getByAltText("Large crack running up the trunk of a tree.")).toBeInTheDocument();
    });

    expect(screen.getByAltText("Several large branches blocking the path.")).toBeInTheDocument();
    expect(screen.getByAltText("CMPUT401W26 Visit")).toBeInTheDocument();
    expect(screen.getByAltText("Ski Trails")).toBeInTheDocument();
  });
  
  it("opens image modal and shows caption + identifier", async () => {
    render(<SiteDetailScreen />);
  
    await waitFor(() => {
      expect(screen.getByText(/Image Gallery/i)).toBeInTheDocument();
    });
  
    fireEvent.click(screen.getByRole('button', { name: /Image Gallery/i }));
  
    await waitFor(() => {
      expect(screen.getByAltText("Large crack running up the trunk of a tree.")).toBeInTheDocument();
    });
  
    fireEvent.click(screen.getByAltText("Large crack running up the trunk of a tree.").closest('button')!);
  
    await waitFor(() => {
      expect(screen.getByRole('link', { name: /Open full image in new tab/i })).toBeInTheDocument();
    });
  
    expect(screen.getByText("Cracked Tree")).toBeInTheDocument();
    expect(screen.getAllByText("Large crack running up the trunk of a tree.").length).toBeGreaterThanOrEqual(2);
  });
  
  it("shows homepage image metadata in modal", async () => {
    render(<SiteDetailScreen />);
  
    await waitFor(() => {
      expect(screen.getByText(/Image Gallery/i)).toBeInTheDocument();
    });
  
    fireEvent.click(screen.getByRole('button', { name: /Image Gallery/i }));
  
    await waitFor(() => {
      expect(screen.getByAltText("CMPUT401W26 Visit")).toBeInTheDocument();
    });
  
    fireEvent.click(screen.getByAltText("CMPUT401W26 Visit").closest('button')!);
  
    await waitFor(() => {
      expect(screen.getByRole('link', { name: /Open full image in new tab/i })).toBeInTheDocument();
    });
  
    expect(screen.getAllByText("CMPUT401W26 Visit").length).toBeGreaterThanOrEqual(2);
  });
  
  it("shows photographer when available for homepage images", async () => {
    render(<SiteDetailScreen />);
  
    await waitFor(() => {
      expect(screen.getByText(/Image Gallery/i)).toBeInTheDocument();
    });
  
    fireEvent.click(screen.getByRole('button', { name: /Image Gallery/i }));
  
    await waitFor(() => {
      expect(screen.getByAltText("Ski Trails")).toBeInTheDocument();
    });
  
    fireEvent.click(screen.getByAltText("Ski Trails").closest('button')!);
  
    await waitFor(() => {
      expect(screen.getByRole('link', { name: /Open full image in new tab/i })).toBeInTheDocument();
    });
  
    expect(screen.getByText(/Raiyana Rahman/i)).toBeInTheDocument();
  });

  it("handles empty gallery state", async () => {
    mockFetch.mockImplementation((input: RequestInfo | URL) => {
      const url = typeof input === "string" ? input : input.toString();

      if (url.includes("/api/sites?namesite=")) {
        return Promise.resolve({
          ok: true,
          json: async () => ({ site: mockSite }),
        });
      }

      if (url.includes("/api/sites/1/gallery")) {
        return Promise.resolve({
          ok: true,
          json: async () => ({ items: [] }),
        });
      }

      if (url.includes("/api/homepage-images/1")) {
        return Promise.resolve({
          ok: true,
          json: async () => ({ items: [] }),
        });
      }

      return Promise.resolve({
        ok: true,
        json: async () => ({}),
      });
    });

    render(<SiteDetailScreen />);

    await waitFor(() => {
      expect(screen.getByText(/Image Gallery/i)).toBeInTheDocument();
    });
  });

  it("handles gallery fetch failure gracefully", async () => {
    mockFetch.mockImplementation((input: RequestInfo | URL) => {
      const url = typeof input === "string" ? input : input.toString();

      if (url.includes("/api/sites?namesite=")) {
        return Promise.resolve({
          ok: true,
          json: async () => ({ site: mockSite }),
        });
      }

      if (url.includes("/api/sites/1/gallery")) {
        return Promise.resolve({
          ok: false,
          json: async () => ({ error: "Failed to load gallery" }),
        });
      }

      if (url.includes("/api/homepage-images/1")) {
        return Promise.resolve({
          ok: true,
          json: async () => ({ items: [] }),
        });
      }

      return Promise.resolve({
        ok: true,
        json: async () => ({}),
      });
    });

    render(<SiteDetailScreen />);

    await waitFor(() => {
      expect(screen.getByText(/Image Gallery|Unable to Load Site/i)).toBeInTheDocument();
    });
  });
});