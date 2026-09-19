import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import MainContent from "../../app/detail/[namesite]/new-report/MainContent";

const mockGetQuestionsOnline = jest.fn();

jest.mock("@/utils/supabase/queries", () => ({
  getQuestionsOnline: (...args: any[]) => mockGetQuestionsOnline(...args),
}));

const START_QUESTION_ID = 101;
const IMAGE_QUESTION_ID = 811;
const PREVIEW_URL = "blob:image-preview-1";
const FIXED_IMAGE_ID = "image-id-1";

const sectionPersistenceQuestions = [
  {
    id: START_QUESTION_ID,
    title: "Site Access Notes",
    text: "Placeholder non-image question to validate section switching.",
    question_type: "text",
    section: 3,
    answers: [],
    formorder: 1,
    is_required: false,
    sectionTitle: "Site Basics",
    sectionDescription: "Basic site details.",
    sectionHeader: "Start",
  },
  {
    id: IMAGE_QUESTION_ID,
    title: "Upload Images, GPS Files, etc.",
    text: "Upload supporting photos for this inspection.",
    question_type: "image",
    section: 4,
    answers: [],
    formorder: 1,
    is_required: false,
    sectionTitle: "Evidence Uploads",
    sectionDescription: "Upload supporting image evidence.",
    sectionHeader: "Close",
  },
];

async function renderImagePersistenceForm(mockOnChange: jest.Mock = jest.fn()) {
  mockGetQuestionsOnline.mockResolvedValue(sectionPersistenceQuestions);

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
    expect(screen.getByRole("button", { name: /Start/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Close/i })).toBeInTheDocument();
  });

  return { ...view, mockOnChange };
}

async function goToCloseSection() {
  fireEvent.click(screen.getByRole("button", { name: /Close/i }));
  await waitFor(() => {
    expect(
      screen.getByRole("heading", { level: 3, name: "Upload Images, GPS Files, etc." })
    ).toBeInTheDocument();
  });
}

async function goToStartSection() {
  fireEvent.click(screen.getByRole("button", { name: /Start/i }));
  await waitFor(() => {
    expect(screen.getByRole("heading", { level: 3, name: "Site Access Notes" })).toBeInTheDocument();
  });
}

function uploadOneImage(container: HTMLElement, fileName: string) {
  const fileInput = container.querySelector(
    `#image-upload-${IMAGE_QUESTION_ID}`
  ) as HTMLInputElement;

  expect(fileInput).toBeInTheDocument();

  const file = new File(["image-bytes"], fileName, { type: "image/jpeg" });
  fireEvent.change(fileInput, { target: { files: [file] } });
}

describe("US 2.0.2 - Image Metadata", () => {
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

  it("keeps uploaded image visible after switching sections and returning", async () => {
    const { container } = await renderImagePersistenceForm();

    await goToCloseSection();

    const fileName = "section-switch-persistence.jpg";
    uploadOneImage(container, fileName);

    await waitFor(() => {
      expect(screen.getByText(fileName)).toBeInTheDocument();
      expect(screen.getByText("1 image total")).toBeInTheDocument();
    });

    await goToStartSection();
    await goToCloseSection();

    expect(screen.getByText(fileName)).toBeInTheDocument();
    expect(screen.getByText("1 image total")).toBeInTheDocument();
  });

  it("keeps caption and identifier values after switching sections and returning", async () => {
    const { container } = await renderImagePersistenceForm();

    await goToCloseSection();
    uploadOneImage(container, "metadata-persistence.jpg");

    const captionInput = (await screen.findByPlaceholderText(
      "Longer Description"
    )) as HTMLInputElement;
    const identifierInput = (await screen.findByPlaceholderText(
      "Short Description"
    )) as HTMLInputElement;

    fireEvent.change(captionInput, { target: { value: "Broken tree near river path" } });
    fireEvent.change(identifierInput, { target: { value: "Tree-01" } });

    expect(captionInput.value).toBe("Broken tree near river path");
    expect(identifierInput.value).toBe("Tree-01");

    await goToStartSection();
    await goToCloseSection();

    expect((screen.getByPlaceholderText("Longer Description") as HTMLInputElement).value).toBe(
      "Broken tree near river path"
    );
    expect((screen.getByPlaceholderText("Short Description") as HTMLInputElement).value).toBe(
      "Tree-01"
    );
  });
});
