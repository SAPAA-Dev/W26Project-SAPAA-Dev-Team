import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import GalleryPage from "../../app/admin/gallery/page";

jest.mock("../../app/admin/AdminNavBar", () => () => <div>AdminNavBarMock</div>);
jest.mock("@/components/ProtectedRoute", () => ({
  __esModule: true,
  default: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

const mockGalleryItems = [
  {
    id: "img-1",
    response_id: "resp-1",
    question_id: "q-1",
    caption: "Haging Broken Tree",
    identifier: "Tree-01",
    date: "2026-01-31",
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
    identifier: "Tree-02",
    date: "2026-02-02",
    storage_key: "uploads/RiverLot56_01-31-2026_ZoeP_CrackedTree.jpg",
    content_type: "image/jpeg",
    file_size_bytes: 654321,
    filename: "RiverLot56_01-31-2026_ZoeP_CrackedTree.jpg",
    site_id: "site-2",
    site_name: "Riverlot 56 (NA)",
    imageUrl: "https://example.com/RiverLot56_01-31-2026_ZoeP_CrackedTree.jpg",
  },
];

function mockFetchSuccess(items = mockGalleryItems) {
  (global.fetch as jest.Mock).mockImplementation((url: string) => {
    if (url.includes("/api/homepage-images")) {
      return Promise.resolve({ ok: true, json: async () => ({ items: [] }) });
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
    expect(screen.getByRole("heading", { level: 1, name: "Image Gallery" })).toBeInTheDocument();
    expect(screen.getByText("AdminNavBarMock")).toBeInTheDocument();

    expect(screen.getAllByText("Riverlot 56 (NA)").length).toBeGreaterThanOrEqual(2);
    expect(screen.getAllByText("Tree-01").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Tree-02").length).toBeGreaterThan(0);
    expect(screen.getByText("2026-01-31")).toBeInTheDocument();
    expect(screen.getByText("2026-02-02")).toBeInTheDocument();
  });

  it("admin can click an image card to open modal with metadata and associated site", async () => {
    mockFetchSuccess();
    render(<GalleryPage />);

    await waitFor(() => {
      expect(screen.queryByText("Loading gallery...")).not.toBeInTheDocument();
    });

    const targetImage = screen.getByAltText("Tree-01");
    const openButton = targetImage.closest("button");
    expect(openButton).not.toBeNull();

    fireEvent.click(openButton!);

    expect(screen.getByText("Site")).toBeInTheDocument();
    expect(screen.getByText("Caption")).toBeInTheDocument();
    expect(screen.getByText("Identifier")).toBeInTheDocument();
    expect(screen.getByText("Date")).toBeInTheDocument();
    expect(screen.getByText("Filename")).toBeInTheDocument();

    expect(screen.getAllByText("Riverlot 56 (NA)").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Haging Broken Tree").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Tree-01").length).toBeGreaterThan(0);
    expect(screen.getAllByText("2026-01-31").length).toBeGreaterThan(0);
    expect(screen.getByText("RiverLot56_01-31-2026_ZoeP_HangingTree.jpg")).toBeInTheDocument();

    const fullImageLink = screen.getByRole("link", { name: "Open full image in new tab" });
    expect(fullImageLink).toHaveAttribute(
      "href",
      "https://example.com/RiverLot56_01-31-2026_ZoeP_HangingTree.jpg"
    );
    expect(fullImageLink).toHaveAttribute("target", "_blank");
  });

  it("shows empty state when API returns no images", async () => {
    mockFetchSuccess([]);
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
