import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import GalleryPage from "../../app/admin/gallery/page";

jest.mock("../../app/admin/AdminNavBar", () => () => <div>AdminNavBarMock</div>);
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
    caption: "Haging Broken Tree",
    description:
      "A tree we saw that seems to be broken, but hanging above the ground by the branches of surrounding trees.",
    storage_key: "uploads/RiverLot56_01-31-2026_ZoeP_HangingTree.jpg",
    content_type: "image/jpeg",
    file_size_bytes: 123456,
    filename: "RiverLot56_01-31-2026_ZoeP_HangingTree.jpg",
    site_id: "site-1",
    site_name: "Riverlot 56 (NA)",
    imageUrl: "https://example.com/RiverLot56_01-31-2026_ZoeP_HangingTree.jpg",
  },
  {
    id: "img-2",
    response_id: "resp-2",
    question_id: "q-2",
    caption: "Cracked Tree",
    description: "Large crack running up the trunk of a tree.",
    storage_key: "uploads/RiverLot56_01-31-2026_ZoeP_CrackedTree.jpg",
    content_type: "image/jpeg",
    file_size_bytes: 654321,
    filename: "RiverLot56_01-31-2026_ZoeP_CrackedTree.jpg",
    site_id: "site-2",
    site_name: "Riverlot 56 (NA)",
    imageUrl: "https://example.com/RiverLot56_01-31-2026_ZoeP_CrackedTree.jpg",
  },
];

const homePageItemsForAdmin = [
  {
    id: "img-4",
    site_id: "site-1",
    site_name: "Riverlot 56 (NA)",
    date: "2026-01-31",
    photographer: "Vishal Sivakumar",
    caption: "CMPUT401W26 Visit",
    description: "Riverlot56 Visit with Frank Potter!",
    storage_key: "homepage-image-uploads/site-1/user-1/RiverLot56-2026-01-31-Vishal-CMPUT401Visit-1A2B3C4D.jpg",
    filename: "RiverLot56-2026-01-31-Vishal-CMPUT401Visit-1A2B3C4D.jpg",
    file_size_bytes: 111111,
    imageUrl: "https://example.com/RiverLot56-2026-01-31-Vishal-CMPUT401Visit-1A2B3C4D.jpg",
  },
]

function mockFetchSuccess(items = mockGalleryItems) {
  (global.fetch as jest.Mock).mockImplementation((url: string) => {
    if (url.includes("/api/homepage-images")) {
      return Promise.resolve({ ok: true, json: async () => ({ items: homePageItemsForAdmin }) });
    }
    return Promise.resolve({ ok: true, json: async () => ({ items }) });
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
    expect(screen.getByRole("heading", { level: 1, name: "Image Gallery" })).toBeInTheDocument();
    expect(screen.getByText("AdminNavBarMock")).toBeInTheDocument();
  
    // Inspection images
    expect(screen.getByText("Haging Broken Tree")).toBeInTheDocument();
    expect(screen.getByText("Cracked Tree")).toBeInTheDocument();
    expect(screen.getAllByText("Riverlot 56 (NA)").length).toBeGreaterThanOrEqual(2);
    expect(screen.getByText("A tree we saw that seems to be broken, but hanging above the ground by the branches of surrounding trees.")).toBeInTheDocument();
    expect(screen.getByText("Large crack running up the trunk of a tree.")).toBeInTheDocument();
  
    // Homepage image
    expect(screen.getByText("CMPUT401W26 Visit")).toBeInTheDocument();
    expect(screen.getByText("Riverlot56 Visit with Frank Potter!")).toBeInTheDocument();
  });

  it("admin can click an image card to open modal with metadata and associated site", async () => {
    mockFetchSuccess();
    render(<GalleryPage />);

    await waitFor(() => {
      expect(screen.queryByText("Loading gallery...")).not.toBeInTheDocument();
    });

    const targetImage = screen.getByAltText("Haging Broken Tree");
    const openButton = targetImage.closest("button");
    expect(openButton).not.toBeNull();

    fireEvent.click(openButton!);

    expect(screen.getByText("Site")).toBeInTheDocument();
    expect(screen.getByText("Caption")).toBeInTheDocument();
    expect(screen.getByText("Description")).toBeInTheDocument();
    expect(screen.getByText("Filename")).toBeInTheDocument();

    expect(screen.getAllByText("Riverlot 56 (NA)").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Haging Broken Tree").length).toBeGreaterThan(0);
    expect(
      screen.getAllByText(
        "A tree we saw that seems to be broken, but hanging above the ground by the branches of surrounding trees."
      ).length
    ).toBeGreaterThan(0);
    expect(screen.getByText("RiverLot56_01-31-2026_ZoeP_HangingTree.jpg")).toBeInTheDocument();

    const fullImageLink = screen.getByRole("link", { name: "Open full image in new tab" });
    expect(fullImageLink).toHaveAttribute(
      "href",
      "https://example.com/RiverLot56_01-31-2026_ZoeP_HangingTree.jpg"
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
