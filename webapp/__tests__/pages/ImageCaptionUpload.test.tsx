import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import MainContent from "../../app/detail/[namesite]/new-report/MainContent";

const mockGetQuestionsOnline = jest.fn();

jest.mock("@/utils/supabase/queries", () => ({
  getQuestionsOnline: (...args: any[]) => mockGetQuestionsOnline(...args),
}));

const IMAGE_QUESTION_ID = 811;
const PREVIEW_URL = "blob:preview-image-1";
const FIXED_IMAGE_ID = "image-uuid-1";

const imageQuestions = [
  {
    id: IMAGE_QUESTION_ID,
    title: "Upload Images, GPS Files, etc. (Q81)",
    text: "Upload supporting images for your site inspection.",
    question_type: "image",
    section: 3,
    answers: [],
    formorder: 1,
    is_required: false,
    sectionTitle: "Digital File Management",
    sectionDescription: "Upload files and optional metadata.",
    sectionHeader: "Close",
  },
];

function getLatestResponses(mockOnChange: jest.Mock) {
  const calls = mockOnChange.mock.calls;
  return calls[calls.length - 1][0] as Record<number, any>;
}

async function renderImageMainContent(mockOnChange: jest.Mock) {
  mockGetQuestionsOnline.mockResolvedValue(imageQuestions);

  function ControlledMainContent() {
    const [responses, setResponses] = React.useState<Record<number, any>>({});

    const handleChange = (nextResponses: Record<number, any>) => {
      setResponses(nextResponses);
      mockOnChange(nextResponses);
    };

    return <MainContent responses={responses} onResponsesChange={handleChange} />;
  }

  const view = render(<ControlledMainContent />);

  await waitFor(() => {
    expect(
      screen.getByRole("heading", { level: 3, name: "Upload Images, GPS Files, etc." })
    ).toBeInTheDocument();
  });

  return view;
}

describe("US 1.0.18 - Image Caption Behavior in Upload Question", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();

    (global.URL.createObjectURL as any) = jest.fn(() => PREVIEW_URL);
    (global.URL.revokeObjectURL as any) = jest.fn();
    jest.spyOn(global.crypto, "randomUUID").mockReturnValue(FIXED_IMAGE_ID);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("shows optional caption input after uploading an image", async () => {
    const mockOnChange = jest.fn();
    const { container } = await renderImageMainContent(mockOnChange);

    const file = new File(["image-data"], "RiverLot56_01-31-2026_ZoeP_HangingTree.jpg", {
      type: "image/jpeg",
    });

    const input = container.querySelector(
      `#image-upload-${IMAGE_QUESTION_ID}`
    ) as HTMLInputElement;
    fireEvent.change(input, { target: { files: [file] } });

    await waitFor(() => {
      expect(screen.getByText("RiverLot56_01-31-2026_ZoeP_HangingTree.jpg")).toBeInTheDocument();
    });

    const captionInput = screen.getByPlaceholderText("Caption (optional)") as HTMLInputElement;
    expect(captionInput).toBeInTheDocument();
    expect(captionInput.value).toBe("");
    expect(screen.getByText("1 image selected")).toBeInTheDocument();

    const latestResponses = getLatestResponses(mockOnChange);
    expect(latestResponses[IMAGE_QUESTION_ID][0]).toMatchObject({
      id: FIXED_IMAGE_ID,
      file,
      caption: "",
      description: "",
      previewUrl: PREVIEW_URL,
    });
  });

  it("allows adding caption when initially empty", async () => {
    const mockOnChange = jest.fn();
    const { container } = await renderImageMainContent(mockOnChange);

    const file = new File(["image-data"], "RiverLot56_01-31-2026_ZoeP_HangingTree.jpg", {
      type: "image/jpeg",
    });
    const input = container.querySelector(
      `#image-upload-${IMAGE_QUESTION_ID}`
    ) as HTMLInputElement;
    fireEvent.change(input, { target: { files: [file] } });

    const captionInput = await screen.findByPlaceholderText("Caption (optional)");
    fireEvent.change(captionInput, { target: { value: "Hanging broken tree" } });

    const latestResponses = getLatestResponses(mockOnChange);
    expect(latestResponses[IMAGE_QUESTION_ID][0].caption).toBe("Hanging broken tree");
  });

  it("allows editing the image caption before submitting", async () => {
    const mockOnChange = jest.fn();
    const { container } = await renderImageMainContent(mockOnChange);

    const file = new File(["image-data"], "RiverLot56_01-31-2026_ZoeP_HangingTree.jpg", {
      type: "image/jpeg",
    });
    const input = container.querySelector(
      `#image-upload-${IMAGE_QUESTION_ID}`
    ) as HTMLInputElement;
    fireEvent.change(input, { target: { files: [file] } });

    const captionInput = await screen.findByPlaceholderText("Caption (optional)");
    fireEvent.change(captionInput, { target: { value: "Initial caption" } });
    fireEvent.change(captionInput, { target: { value: "Edited caption" } });

    const latestResponses = getLatestResponses(mockOnChange);
    expect(latestResponses[IMAGE_QUESTION_ID][0].caption).toBe("Edited caption");
  });

  it("allows deleting the image caption before submitting", async () => {
    const mockOnChange = jest.fn();
    const { container } = await renderImageMainContent(mockOnChange);

    const file = new File(["image-data"], "RiverLot56_01-31-2026_ZoeP_HangingTree.jpg", {
      type: "image/jpeg",
    });
    const input = container.querySelector(
      `#image-upload-${IMAGE_QUESTION_ID}`
    ) as HTMLInputElement;
    fireEvent.change(input, { target: { files: [file] } });

    const captionInput = await screen.findByPlaceholderText("Caption (optional)");
    fireEvent.change(captionInput, { target: { value: "Temporary caption" } });
    fireEvent.change(captionInput, { target: { value: "" } });

    const latestResponses = getLatestResponses(mockOnChange);
    expect(latestResponses[IMAGE_QUESTION_ID][0].caption).toBe("");
  });

  it("removing image clears uploaded entry and revokes object URL", async () => {
    const mockOnChange = jest.fn();
    const { container } = await renderImageMainContent(mockOnChange);

    const file = new File(["image-data"], "RiverLot56_01-31-2026_ZoeP_HangingTree.jpg", {
      type: "image/jpeg",
    });
    const input = container.querySelector(
      `#image-upload-${IMAGE_QUESTION_ID}`
    ) as HTMLInputElement;
    fireEvent.change(input, { target: { files: [file] } });

    const removeButton = await screen.findByRole("button", { name: "Remove" });
    fireEvent.click(removeButton);

    const latestResponses = getLatestResponses(mockOnChange);
    expect(latestResponses[IMAGE_QUESTION_ID]).toEqual([]);
    expect(global.URL.revokeObjectURL).toHaveBeenCalledWith(PREVIEW_URL);
  });
});
