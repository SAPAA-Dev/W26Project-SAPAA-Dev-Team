import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import GalleryPage from "../../app/gallery/page";

jest.mock("../../app/UserNavBar", () => () => <div>UserNavBarMock</div>);
jest.mock("@/components/ProtectedRoute", () => ({
  __esModule: true,
  default: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

// Mock next/router
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}));

const mockGalleryItems = [
  {
    id: "img-1",
    response_id: "resp-1",
    question_id: "q-1",
    caption: "Cross Country skil trails",
    identifier: "Ski Trails",
    date: "2026-01-31",
    content_type: "image/jpeg",
    photographer: "Raiyana Rahman",
    file_size_bytes: 506701,
    filename:
      "Riverlot56NA-2026-01-31-RaiyanaRahman-SkiTrails-aa05346a.jpg",
    site_id: 207,
    site_name: "Riverlot 56 (NA)",
    imageUrl:
      "https://example.com/Riverlot56NA-2026-01-31-RaiyanaRahman-SkiTrails-aa05346a.jpg",
  },
];

const homePageItemsForUser = [
  {
    id: 16,
    site_id: 207,
    site_name: "Riverlot 56 (NA)",
    date: "2026-01-31",
    photographer: "Raiyana Rahman",
    caption: "Cross Country skil trails",
    identifier: "Ski Trails",
    filename:
      "Riverlot56NA-2026-01-31-RaiyanaRahman-SkiTrails-0642088a-b29f-400a-9ce7-e1003fa1e928.jpg",
    file_size_bytes: 506701,
    imageUrl:
      "https://example.com/Riverlot56NA-2026-01-31-RaiyanaRahman-SkiTrails-0642088a-b29f-400a-9ce7-e1003fa1e928.jpg",
  },
  {
    id: 21,
    site_id: 207,
    site_name: "Riverlot 56 (NA)",
    date: "2026-01-31",
    photographer: "Zoe Prefontaine",
    caption:
      "A partially broken tree trunk hanging among surrounding tree likely damaged by weather or decay. CMPUT 401 team",
    identifier: "Broken Tree Trunk",
    filename:
      "Riverlot56NA-2026-01-31-ZoePrefontaine-BrokenTreeTrunk-f6f399ce-3521-4fa4-987a-43cf356c693b.jpg",
    file_size_bytes: 1852012,
    imageUrl:
      "https://example.com/Riverlot56NA-2026-01-31-ZoePrefontaine-BrokenTreeTrunk-f6f399ce-3521-4fa4-987a-43cf356c693b.jpg",
  },
];

function mockFetchSuccess(items = mockGalleryItems) {
  (global.fetch as jest.Mock).mockImplementation((url: string) => {
    if (url.includes("/api/user-gallery/homepage-upload")) {
      return Promise.resolve({ ok: true, json: async () => ({ items: homePageItemsForUser }) });
    }
    return Promise.resolve({ ok: true, json: async () => ({ items }) });
  });
}

describe("UserGalleryPage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    global.fetch = jest.fn();
    jest.spyOn(console, "log").mockImplementation(() => {});
    jest.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("renders all uploaded image cards after fetch", async () => {
    mockFetchSuccess();
    render(<GalleryPage />);
  
    expect(screen.getByText("Loading gallery...")).toBeInTheDocument();
  
    await waitFor(() => {
      expect(screen.queryByText("Loading gallery...")).not.toBeInTheDocument();
    });
 
    expect(global.fetch).toHaveBeenCalledWith("/api/user-gallery/sir-upload");
    expect(global.fetch).toHaveBeenCalledWith("/api/user-gallery/homepage-upload");
    expect(
      screen.getByRole("heading", { level: 1, name: "Image Gallery" })
    ).toBeInTheDocument();
    expect(screen.getByText("UserNavBarMock")).toBeInTheDocument();

    expect(screen.getAllByText("Riverlot 56 (NA)").length).toBeGreaterThanOrEqual(2);
    expect(screen.getAllByText("Ski Trails").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Broken Tree Trunk").length).toBeGreaterThan(0);
    expect(screen.getAllByText("2026-01-31").length).toBeGreaterThanOrEqual(2);
  });

  it("user can click an image card to open modal with metadata and associated site", async () => {
    mockFetchSuccess();
    render(<GalleryPage />);

    await waitFor(() => {
      expect(screen.queryByText("Loading gallery...")).not.toBeInTheDocument();
    });

    const targetImage = screen.getAllByAltText("Ski Trails")[0];
    const openButton = targetImage.closest("button");
    expect(openButton).not.toBeNull();

    fireEvent.click(openButton!);

    expect(screen.getByText("Site")).toBeInTheDocument();
    expect(screen.getByText("Caption")).toBeInTheDocument();
    expect(screen.getByText("Identifier")).toBeInTheDocument();
    expect(screen.getByText("Date")).toBeInTheDocument();
    expect(screen.getByText("Filename")).toBeInTheDocument();

    expect(screen.getAllByText("Riverlot 56 (NA)").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Cross Country skil trails").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Ski Trails").length).toBeGreaterThan(0);
    expect(screen.getAllByText("2026-01-31").length).toBeGreaterThan(0);
    expect(
      screen.getByText("Riverlot56NA-2026-01-31-RaiyanaRahman-SkiTrails-aa05346a.jpg")
    ).toBeInTheDocument();

    const fullImageLink = screen.getByRole("link", {
      name: "Open full image in new tab",
    });
    expect(fullImageLink).toHaveAttribute(
      "href",
      "https://example.com/Riverlot56NA-2026-01-31-RaiyanaRahman-SkiTrails-aa05346a.jpg"
    );
    expect(fullImageLink).toHaveAttribute("target", "_blank");
  });

  it("shows empty state when API returns no images", async () => {
    (global.fetch as jest.Mock).mockImplementation(() =>
      Promise.resolve({ ok: true, json: async () => ({ items: [] }) })
    );
    render(<GalleryPage />);

    await waitFor(() => {
      expect(screen.queryByText("Loading gallery...")).not.toBeInTheDocument();
    });

    expect(screen.getByText("No images found.")).toBeInTheDocument();
  });

  it("handles API error response without crashing", async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: false,
      json: async () => ({ error: "Failed to load gallery" }),
    });

    render(<GalleryPage />);

    await waitFor(() => {
      expect(screen.queryByText("Loading gallery...")).not.toBeInTheDocument();
    });

    expect(screen.getByRole("heading", { level: 1, name: "Image Gallery" })).toBeInTheDocument();
    expect(screen.getByText("No images found.")).toBeInTheDocument();
    expect(console.error).toHaveBeenCalled();
  });
});
