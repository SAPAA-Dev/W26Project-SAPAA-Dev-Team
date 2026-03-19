import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { useParams, useRouter } from "next/navigation";
import SiteDetailScreen from "../../app/detail/[namesite]/page";
import * as supabaseQueries from "@/utils/supabase/queries";

jest.mock("next/navigation");
jest.mock("@/utils/supabase/queries");
jest.mock("@/utils/supabase/client", () => ({
  createClient: () => ({
    auth: {
      getUser: jest.fn().mockResolvedValue({ data: { user: { id: "user-123" } } }),
    },
  }),
}));
jest.mock("next/image", () => ({
  __esModule: true,
  default: (props: any) => {
    // eslint-disable-next-line jsx-a11y/alt-text
    return <img {...props} />;
  },
}));
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
  county: "Athabasca",
  inspectdate: "2026-01-31",
};

const mockInspections = [
  {
    id: 901,
    user_id: "user-123",
    created_at: "2026-01-31T10:00:00.000Z",
    inspection_no: null,
    naturalness_score: "3 = Good",
    naturalness_details: "Stable site condition",
    steward: "Zoe P",
    answers: [],
  },
];

const galleryItemsForSelectedSite = [
  {
    id: "img-1",
    response_id: "resp-1",
    question_id: "q-1",
    caption: "Cracked Tree",
    description: "Large crack running up the trunk of a tree.",
    storage_key: "uploads/RiverLot56_01-31-2026_ZoeP_CrackedTree.jpg",
    content_type: "image/jpeg",
    file_size_bytes: 654321,
    filename: "RiverLot56_01-31-2026_ZoeP_CrackedTree.jpg",
    site_id: "1",
    site_name: "Riverlot 56 (NA)",
    imageUrl: "https://example.com/RiverLot56_01-31-2026_ZoeP_CrackedTree.jpg",
  },
  {
    id: "img-2",
    response_id: "resp-2",
    question_id: "q-2",
    caption: "Hanging Broken Tree",
    description:
      "A tree we saw that seems to be broken, but hanging above the ground by the branches of surrounding trees.",
    storage_key: "uploads/RiverLot56_01-31-2026_ZoeP_HangingTree.jpg",
    content_type: "image/jpeg",
    file_size_bytes: 123456,
    filename: "RiverLot56_01-31-2026_ZoeP_HangingTree.jpg",
    site_id: "1",
    site_name: "Riverlot 56 (NA)",
    imageUrl: "https://example.com/RiverLot56_01-31-2026_ZoeP_HangingTree.jpg",
  },
  {
    id: "img-3",
    response_id: "resp-3",
    question_id: "q-3",
    caption: "cross-country ski trails",
    description: null,
    storage_key: "uploads/RiverLot56_02-01-2026_ZoeP_SkiTrail.jpg",
    content_type: "image/jpeg",
    file_size_bytes: 777000,
    filename: "RiverLot56_02-01-2026_ZoeP_SkiTrail.jpg",
    site_id: "1",
    site_name: "Riverlot 56 (NA)",
    imageUrl: "https://example.com/RiverLot56_02-01-2026_ZoeP_SkiTrail.jpg",
  },
];

const homePageItemsForSelectedSite = [
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

function mockGalleryFetchSuccess(items = galleryItemsForSelectedSite) {
  (global.fetch as jest.Mock).mockImplementation((url: string) => {
    if (url.includes("/api/homepage-images/")) {
      return Promise.resolve({ ok: true, json: async () => ({ items: homePageItemsForSelectedSite }) });
    }
    return Promise.resolve({ ok: true, json: async () => ({ items }) });
  });
}

async function renderSiteDetailsGallery() {
  render(<SiteDetailScreen />);

  await waitFor(() => {
    expect(screen.getByText("Riverlot 56 (NA)")).toBeInTheDocument();
  });

  fireEvent.click(screen.getByRole("button", { name: /Image Gallery/i }));

  await waitFor(() => {
    expect(screen.getByText("Image Gallery (4 images)")).toBeInTheDocument();
  });
}

describe("SiteDetailScreen Image Gallery", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    global.fetch = jest.fn();
    jest.spyOn(console, "log").mockImplementation(() => {});
    jest.spyOn(console, "error").mockImplementation(() => {});

    (useRouter as jest.Mock).mockReturnValue(mockRouter);
    (useParams as jest.Mock).mockReturnValue(mockParams);
    (supabaseQueries.getSiteByName as jest.Mock).mockResolvedValue([mockSite]);
    (supabaseQueries.getFormResponsesBySite as jest.Mock).mockResolvedValue(mockInspections);
    (supabaseQueries.getCurrentUserUid as jest.Mock).mockResolvedValue("user-123");
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("renders multiple site images in gallery layout", async () => {
    mockGalleryFetchSuccess();
    await renderSiteDetailsGallery();
  
    expect(screen.getByText("Cracked Tree")).toBeInTheDocument();
    expect(screen.getByText("Hanging Broken Tree")).toBeInTheDocument();
    expect(screen.getByText("cross-country ski trails")).toBeInTheDocument();
    expect(screen.getByText("CMPUT401W26 Visit")).toBeInTheDocument();
    expect(screen.getByText("Riverlot56 Visit with Frank Potter!")).toBeInTheDocument();
  
    expect(screen.getByAltText("Cracked Tree").closest("button")).toBeInTheDocument();
    expect(screen.getByAltText("Hanging Broken Tree").closest("button")).toBeInTheDocument();
    expect(screen.getByAltText("cross-country ski trails").closest("button")).toBeInTheDocument();
    expect(screen.getByAltText("CMPUT401W26 Visit").closest("button")).toBeInTheDocument();
  });
  
  it("uses site-scoped gallery endpoint for selected site", async () => {
    mockGalleryFetchSuccess();
    await renderSiteDetailsGallery();
  
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith("/api/sites/1/gallery");
      expect(global.fetch).toHaveBeenCalledWith("/api/homepage-images/1");
    });
  
    expect(screen.getByText("Cracked Tree")).toBeInTheDocument();
    expect(screen.getByText("Hanging Broken Tree")).toBeInTheDocument();
    expect(screen.getByText("cross-country ski trails")).toBeInTheDocument();
    expect(screen.getByText("CMPUT401W26 Visit")).toBeInTheDocument();
    expect(screen.queryByText("Trail entrance")).not.toBeInTheDocument();
  });

  it("opens image detail modal with metadata from selected card", async () => {
    mockGalleryFetchSuccess();
    await renderSiteDetailsGallery();

    const targetImage = screen.getByAltText("Hanging Broken Tree");
    const openButton = targetImage.closest("button");
    expect(openButton).not.toBeNull();
    fireEvent.click(openButton!);

    expect(screen.getByText("Site")).toBeInTheDocument();
    expect(screen.getByText("Caption")).toBeInTheDocument();
    expect(screen.getByText("Description")).toBeInTheDocument();
    expect(screen.getByText("Filename")).toBeInTheDocument();

    expect(screen.getAllByText("Riverlot 56 (NA)").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Hanging Broken Tree").length).toBeGreaterThan(0);
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

  it("switches detailed view when another image is opened", async () => {
    mockGalleryFetchSuccess();
    await renderSiteDetailsGallery();

    const firstImage = screen.getByAltText("Cracked Tree");
    const firstButton = firstImage.closest("button");
    expect(firstButton).not.toBeNull();
    fireEvent.click(firstButton!);

    expect(screen.getByText("RiverLot56_01-31-2026_ZoeP_CrackedTree.jpg")).toBeInTheDocument();

    const modalOverlay = document.querySelector('div[class*="fixed inset-0 z-50"]') as HTMLElement;
    expect(modalOverlay).toBeTruthy();
    fireEvent.click(modalOverlay);

    await waitFor(() => {
      expect(screen.queryByText("RiverLot56_01-31-2026_ZoeP_CrackedTree.jpg")).not.toBeInTheDocument();
    });

    const secondImage = screen.getByAltText("Hanging Broken Tree");
    const secondButton = secondImage.closest("button");
    expect(secondButton).not.toBeNull();
    fireEvent.click(secondButton!);

    expect(screen.getByText("RiverLot56_01-31-2026_ZoeP_HangingTree.jpg")).toBeInTheDocument();
    expect(screen.queryByText("RiverLot56_01-31-2026_ZoeP_CrackedTree.jpg")).not.toBeInTheDocument();
  });
});
