import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";

jest.mock("next/navigation", () => ({
  useRouter: jest.fn(() => ({ push: jest.fn() })),
}));

jest.mock("@/utils/supabase/queries", () => ({
  getSitesOnline: jest.fn(),
  getCurrentUserUid: jest.fn(),
  insertHomepageImageUpload: jest.fn(),
}));

global.URL.createObjectURL = jest.fn(() => "blob:mock-url");
global.URL.revokeObjectURL = jest.fn();

import UploadImages from "@/components/UploadImages";
import { getSitesOnline, getCurrentUserUid, insertHomepageImageUpload } from "@/utils/supabase/queries";
import { useRouter } from "next/navigation";

const mockSites = [
  { id: 207, namesite: "Riverlot 56 (NA)", county: "Sturgeon County" },
];

function makeFile(name = "test.jpg", type = "image/jpeg") {
  return new File(["content"], name, { type });
}

describe("US 2.0.8 - User Upload of Standalone Site Images", () => {
  const mockPush = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    (getSitesOnline as jest.Mock).mockResolvedValue(mockSites);
    (getCurrentUserUid as jest.Mock).mockResolvedValue("user-uuid-123");
    (insertHomepageImageUpload as jest.Mock).mockResolvedValue([]);
    (useRouter as jest.Mock).mockReturnValue({ push: mockPush });

    global.fetch = jest.fn().mockImplementation((url: string) => {
      if (url.includes("presign-homepage-images")) {
        return Promise.resolve({
          ok: true,
          json: async () => ({
            uploadUrl: "https://s3.example.com/upload",
            key: "homepage-image-uploads/207/user-uuid-123/test-mock-uuid.jpg",
          }),
        });
      }
      return Promise.resolve({ ok: true });
    });
  });

  it("opens modal and shows dropzone when FAB is clicked", async () => {
    render(<UploadImages />);
    fireEvent.click(screen.getByText("Upload Images"));
    await waitFor(() => {
      expect(screen.getByText("Upload Site Images")).toBeInTheDocument();
      expect(screen.getByText(/Drop images here/i)).toBeInTheDocument();
    });
  });

  it("shows image editor and disables upload when file is added but fields are empty", async () => {
    render(<UploadImages />);
    fireEvent.click(screen.getByText("Upload Images"));
    await waitFor(() => expect(screen.getByText(/Drop images here/i)).toBeInTheDocument());

    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    fireEvent.change(fileInput, { target: { files: [makeFile()] } });

    await waitFor(() => {
      expect(screen.getByText(/Image 1 of 1/i)).toBeInTheDocument();
      expect(screen.getByText(/1 image selected · 0 complete/i)).toBeInTheDocument();
      expect(screen.getByTestId("upload-submit-btn")).toBeDisabled();
    });
  });

  it("shows character limit warning when photographer or identifier hits max chars", async () => {
    render(<UploadImages />);
    fireEvent.click(screen.getByText("Upload Images"));

    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    fireEvent.change(fileInput, { target: { files: [makeFile()] } });
    await waitFor(() => expect(screen.getByText(/Image 1 of 1/i)).toBeInTheDocument());

    fireEvent.change(screen.getByPlaceholderText("Owner of Digital File"), {
      target: { value: "abcdefghijklmnopqrstuvwxy" }, // 25 non-space chars
    });
    fireEvent.change(screen.getByPlaceholderText("Short Description"), {
      target: { value: "abcdefghijklmnopqrst" }, // 20 non-space chars
    });

    await waitFor(() => {
      expect(screen.getAllByText("Character limit reached")).toHaveLength(2);
    });
  });

  it("closes modal and returns to dropzone when cancel is clicked", async () => {
    render(<UploadImages />);
    fireEvent.click(screen.getByText("Upload Images"));
    await waitFor(() => expect(screen.getByText("Cancel")).toBeInTheDocument());

    fireEvent.click(screen.getByText("Cancel"));

    await waitFor(() => {
      expect(screen.queryByText("Upload Site Images")).not.toBeInTheDocument();
    });
  });

  it("submits and redirects to /sites after all fields are filled", async () => {
    render(<UploadImages />);
    fireEvent.click(screen.getByText("Upload Images"));

    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    fireEvent.change(fileInput, { target: { files: [makeFile()] } });
    await waitFor(() => expect(screen.getByText(/Image 1 of 1/i)).toBeInTheDocument());

    fireEvent.change(screen.getByPlaceholderText("Search by site name or county..."), {
      target: { value: "Riverlot" },
    });
    await waitFor(() => expect(screen.getByText("Riverlot 56 (NA)")).toBeInTheDocument());
    fireEvent.mouseDown(screen.getByText("Riverlot 56 (NA)"));

    fireEvent.change(screen.getByPlaceholderText("Owner of Digital File"), { target: { value: "Vishal" } });
    fireEvent.change(screen.getByPlaceholderText("Short Description"), { target: { value: "ATV Track" } });
    fireEvent.change(screen.getByPlaceholderText("Longer Description. What is it, why is it important?"), { target: { value: "Some description" } });

    await waitFor(() => expect(screen.getByTestId("upload-submit-btn")).not.toBeDisabled());
    fireEvent.click(screen.getByTestId("upload-submit-btn"));

    await waitFor(() => {
      expect(insertHomepageImageUpload).toHaveBeenCalled();
      expect(mockPush).toHaveBeenCalledWith("/sites?image-upload=true");
    });
  });
});