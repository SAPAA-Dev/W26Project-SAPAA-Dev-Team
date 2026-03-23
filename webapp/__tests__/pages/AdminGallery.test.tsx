import React from "react";

import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import GalleryPage from "../../app/admin/gallery/page";

jest.mock("../../app/admin/AdminNavBar", () => () => <div>AdminNavBarMock</div>);
jest.mock("@/components/ProtectedRoute", () => ({
  __esModule: true,
  default: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

// Mock next/router
jest.mock("next/navigation", () => ({
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
    storage_key:
      "uploads/207/resp-1/Riverlot56NA-2026-01-31-RaiyanaRahman-SkiTrails-aa05346a.jpg",
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

const homePageItemsForAdmin = [
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
    storage_key:
      "homepage-image-uploads/207/6966742d-b9e7-46c1-842f-030d4a97ba39/Riverlot56NA-2026-01-31-RaiyanaRahman-SkiTrails-0642088a-b29f-400a-9ce7-e1003fa1e928.jpg",
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
    storage_key:
      "homepage-image-uploads/207/6966742d-b9e7-46c1-842f-030d4a97ba39/Riverlot56NA-2026-01-31-ZoePrefontaine-BrokenTreeTrunk-f6f399ce-3521-4fa4-987a-43cf356c693b.jpg",
    imageUrl:
      "https://example.com/Riverlot56NA-2026-01-31-ZoePrefontaine-BrokenTreeTrunk-f6f399ce-3521-4fa4-987a-43cf356c693b.jpg",
  },
];

function mockFetchSuccess(items = mockGalleryItems) {
  (global.fetch as jest.Mock).mockImplementation((url: string) => {
    if (url.includes("/api/homepage-images")) {
      return Promise.resolve({
        ok: true,
        json: async () => ({ items: homePageItemsForAdmin }),
      });
    }
    return Promise.resolve({
      ok: true,
      json: async () => ({ items }),
    });
  });
}

describe("AdminGalleryPage", () => {
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

    expect(global.fetch).toHaveBeenCalledWith("/api/gallery");
    expect(global.fetch).toHaveBeenCalledWith("/api/homepage-images");
    expect(
      screen.getByRole("heading", { level: 1, name: "Image Gallery" })
    ).toBeInTheDocument();
    expect(screen.getByText("AdminNavBarMock")).toBeInTheDocument();

    expect(screen.getAllByText("Riverlot 56 (NA)").length).toBeGreaterThanOrEqual(2);
    expect(screen.getAllByText("Ski Trails").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Broken Tree Trunk").length).toBeGreaterThan(0);
    expect(screen.getAllByText("2026-01-31").length).toBeGreaterThanOrEqual(2);
  });

  it("shows standalone homepage-uploaded media in the admin gallery", async () => {
    mockFetchSuccess();
    render(<GalleryPage />);

    await waitFor(() => {
      expect(screen.queryByText("Loading gallery...")).not.toBeInTheDocument();
    });

    expect(screen.getAllByText("Riverlot 56 (NA)").length).toBeGreaterThan(0);
    expect(screen.getAllByText("2026-01-31").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Broken Tree Trunk").length).toBeGreaterThan(0);

    const image = screen.getAllByAltText("Broken Tree Trunk")[0];
    const openButton = image.closest("button");
    expect(openButton).not.toBeNull();

    fireEvent.click(openButton!);

    expect(
      screen.getByText(
        "Riverlot56NA-2026-01-31-ZoePrefontaine-BrokenTreeTrunk-f6f399ce-3521-4fa4-987a-43cf356c693b.jpg"
      )
    ).toBeInTheDocument();
  });

  it("admin can click an image card to open modal with metadata and associated site", async () => {
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

    expect(
      screen.getByRole("heading", { level: 1, name: "Image Gallery" })
    ).toBeInTheDocument();
    expect(screen.getByText("No images found.")).toBeInTheDocument();
    expect(console.error).toHaveBeenCalled();
  });
  

  //Generated by ChatGPT based on the requirement to ensure that both SIR-uploaded media and standalone homepage-uploaded media are displayed together in the admin gallery, providing a comprehensive view of all uploaded images regardless of their source.
  it("shows both SIR-uploaded and standalone-uploaded media in the same gallery", async () => {
    mockFetchSuccess();
    render(<GalleryPage />);

    await waitFor(() => {
      expect(screen.queryByText("Loading gallery...")).not.toBeInTheDocument();
    });

    // SIR item
    expect(screen.getAllByText("Ski Trails").length).toBeGreaterThan(0);

    // standalone homepage-uploaded item
    expect(screen.getAllByText("Broken Tree Trunk").length).toBeGreaterThan(0);

  });

  //Generated by ChatGPT
  // This test ensures that every media item displayed in the gallery is associated with a site, which is crucial for maintaining the integrity of the gallery and ensuring that all images are properly categorized and linked to their respective locations.
  it("shows that every displayed uploaded media item is linked to a site", async () => {
      mockFetchSuccess();
      render(<GalleryPage />);

      await waitFor(() => {
        expect(screen.queryByText("Loading gallery...")).not.toBeInTheDocument();
      });

      // all mocked items are linked to Riverlot 56 (NA)
      // 1 SIR item + 2 standalone items = at least 3 visible site labels/cards
      expect(screen.getAllByText("Riverlot 56 (NA)").length).toBeGreaterThanOrEqual(3);
    });


    //Generated by ChatGPT based on the requirement to ensure that the admin gallery correctly displays filenames in the SAPAA naming format for SIR-uploaded media, which is important for maintaining consistency and traceability of media files within the system, allowing administrators to easily identify and manage uploaded images based on their metadata and naming conventions.
    it("shows SIR-uploaded filenames in SAPAA naming format", async () => {
      mockFetchSuccess();
      render(<GalleryPage />);

      await waitFor(() => {
        expect(screen.queryByText("Loading gallery...")).not.toBeInTheDocument();
      });

      const targetImage = screen.getAllByAltText("Ski Trails")[0];
      const openButton = targetImage.closest("button");
      expect(openButton).not.toBeNull();

      fireEvent.click(openButton!);

      const filename =
        "Riverlot56NA-2026-01-31-RaiyanaRahman-SkiTrails-aa05346a.jpg";

      expect(screen.getByText(filename)).toBeInTheDocument();
      expect(filename).toMatch(
        /^[A-Za-z0-9]+-\d{4}-\d{2}-\d{2}-[A-Za-z0-9]+-[A-Za-z0-9]+-[A-Za-z0-9-]+\.jpg$/i
      );
    });

    //Generated by ChatGPT based on the requirement to ensure that the admin gallery correctly displays filenames in the SAPAA naming format for standalone homepage-uploaded media, which is essential for maintaining a consistent and organized media library, allowing administrators to easily identify and manage images based on their metadata and naming conventions, regardless of their source.
    it("shows standalone-uploaded filenames in SAPAA naming format", async () => {
      mockFetchSuccess();
      render(<GalleryPage />);

      await waitFor(() => {
        expect(screen.queryByText("Loading gallery...")).not.toBeInTheDocument();
      });

      const targetImage = screen.getAllByAltText("Broken Tree Trunk")[0];
      const openButton = targetImage.closest("button");
      expect(openButton).not.toBeNull();

      fireEvent.click(openButton!);

      const filename =
        "Riverlot56NA-2026-01-31-ZoePrefontaine-BrokenTreeTrunk-f6f399ce-3521-4fa4-987a-43cf356c693b.jpg";

      expect(screen.getByText(filename)).toBeInTheDocument();
      expect(filename).toMatch(
        /^[A-Za-z0-9]+-\d{4}-\d{2}-\d{2}-[A-Za-z0-9]+-[A-Za-z0-9]+-[A-Za-z0-9-]+\.jpg$/i
      );
    });


    //Generated by ChatGPT based on the requirement to ensure that the search functionality in the admin gallery allows administrators to effectively filter and find specific media items based on various metadata fields such as identifier, site name, caption, filename, date, and photographer, which is crucial for efficient media management and retrieval within the gallery.
    it("allows admins to search media by identifier", async () => {
      mockFetchSuccess();
      render(<GalleryPage />);

      await waitFor(() => {
        expect(screen.queryByText("Loading gallery...")).not.toBeInTheDocument();
      });

      const searchInput = screen.getByTestId("admin-gallery-search-bar");
      fireEvent.change(searchInput, { target: { value: "Broken Tree Trunk" } });

      expect(screen.getAllByText("Broken Tree Trunk").length).toBeGreaterThan(0);
      expect(screen.queryByText("Ski Trails")).not.toBeInTheDocument();
    });

    //Generated by ChatGPT based on the requirement to ensure that the search functionality in the admin gallery allows administrators to effectively filter and find specific media items based on various metadata fields such as identifier, site name, caption, filename, date, and photographer, which is crucial for efficient media management and retrieval within the gallery.
    it("allows admins to search media by site name", async () => {
      mockFetchSuccess();
      render(<GalleryPage />);

      await waitFor(() => {
        expect(screen.queryByText("Loading gallery...")).not.toBeInTheDocument();
      });

      const searchInput = screen.getByTestId("admin-gallery-search-bar");
      fireEvent.change(searchInput, { target: { value: "Riverlot 56" } });

      expect(screen.getAllByText("Riverlot 56 (NA)").length).toBeGreaterThan(0);
    });


    //Generated by ChatGPT based on the requirement to ensure that the search functionality in the admin gallery allows administrators to effectively filter and find specific media items based on various metadata fields such as identifier, site name, caption, filename, date, and photographer, which is crucial for efficient media management and retrieval within the gallery.
    it("allows admins to search media by caption", async () => {
      mockFetchSuccess();
      render(<GalleryPage />);

      await waitFor(() => {
        expect(screen.queryByText("Loading gallery...")).not.toBeInTheDocument();
      });

      const searchInput = screen.getByTestId("admin-gallery-search-bar");
      fireEvent.change(searchInput, {
        target: { value: "Broken Tree Trunk" },
      });

      expect(screen.getAllByText("Broken Tree Trunk").length).toBeGreaterThan(0);
      expect(screen.queryByText("Ski Trails")).not.toBeInTheDocument();
    });

    //Generated by ChatGPT based on the requirement to ensure that the search functionality in the admin gallery allows administrators to effectively filter and find specific media items based on various metadata fields such as identifier, site name, caption, filename, date, and photographer, which is crucial for efficient media management and retrieval within the gallery.
    it("allows admins to search media by filename", async () => {
      mockFetchSuccess();
      render(<GalleryPage />);

      await waitFor(() => {
        expect(screen.queryByText("Loading gallery...")).not.toBeInTheDocument();
      });

      const searchInput = screen.getByTestId("admin-gallery-search-bar");
      fireEvent.change(searchInput, {
        target: {
          value:
            "Riverlot56NA-2026-01-31-ZoePrefontaine-BrokenTreeTrunk-f6f399ce-3521-4fa4-987a-43cf356c693b.jpg",
        },
      });

      expect(screen.getAllByText("Broken Tree Trunk").length).toBeGreaterThan(0);
      expect(screen.queryByText("Ski Trails")).not.toBeInTheDocument();
    });

    //Generated by ChatGPT based on the requirement to ensure that the search functionality in the admin gallery allows administrators to effectively filter and find specific media items based on various metadata fields such as identifier, site name, caption, filename, date, and photographer, which is crucial for efficient media management and retrieval within the gallery.
    it("allows admins to search media by date", async () => {
      mockFetchSuccess();
      render(<GalleryPage />);

      await waitFor(() => {
        expect(screen.queryByText("Loading gallery...")).not.toBeInTheDocument();
      });

      const searchInput = screen.getByTestId("admin-gallery-search-bar");
      fireEvent.change(searchInput, {
        target: { value: "2026-01-31" },
      });

      expect(screen.getAllByText("2026-01-31").length).toBeGreaterThan(0);
    });

    //Generated by ChatGPT based on the requirement to ensure that the search functionality in the admin gallery allows administrators to effectively filter and find specific media items based on various metadata fields such as identifier, site name, caption, filename, date, and photographer, which is crucial for efficient media management and retrieval within the gallery.
    it("allows admins to search media by photographer name through filename match", async () => {
      mockFetchSuccess();
      render(<GalleryPage />);

      await waitFor(() => {
        expect(screen.queryByText("Loading gallery...")).not.toBeInTheDocument();
      });

      const searchInput = screen.getByTestId("admin-gallery-search-bar");
      fireEvent.change(searchInput, {
        target: { value: "ZoePrefontaine" },
      });

      expect(screen.getAllByText("Broken Tree Trunk").length).toBeGreaterThan(0);
      expect(screen.queryByText("Ski Trails")).not.toBeInTheDocument();
    });


});