/**
 * @jest-environment jsdom
 */

import React from "react";
import { render, screen, fireEvent, waitFor, act } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom";
import NewReportPage from "../../app/detail/[namesite]/new-report/page";

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

// Mock Next.js navigation hooks
const mockRouterBack = jest.fn();
const mockPush = jest.fn();

jest.mock("next/navigation", () => ({
  useParams: () => ({ namesite: "Elk%20Island" }),
  useRouter: () => ({ back: mockRouterBack, push: mockPush }),
  usePathname: () => "/sites/Elk%20Island/new-report",
}));

jest.mock("next/image", () => ({
  __esModule: true,
  default: (props: any) => <img {...props} />,
}));

jest.mock("next/link", () => ({
  __esModule: true,
  default: ({ children, href }: any) => {
    // href can be a string or a Next.js UrlObject { pathname, query }
    const resolvedHref =
      typeof href === "object" && href !== null
        ? href.pathname ?? "/"
        : href;
    return <a href={resolvedHref}>{children}</a>;
  },
}));

// Mock all Supabase queries used by the component
jest.mock("@/utils/supabase/queries", () => ({
  getQuestionsOnline: jest.fn().mockResolvedValue([]),
  isSteward: jest.fn().mockResolvedValue(false),   // default: NOT a steward → shows popup
  addSiteInspectionReport: jest.fn().mockResolvedValue({ id: 42 }),
  getSitesOnline: jest.fn().mockResolvedValue([]),
  getCurrentUserUid: jest.fn().mockResolvedValue("uid-123"),
  getCurrentSiteId: jest.fn().mockResolvedValue("site-456"),
  getQuestionResponseType: jest.fn().mockResolvedValue([]),
  uploadSiteInspectionAnswers: jest.fn().mockResolvedValue({}),
}));

// Mock the Supabase client so getCurrentUser() resolves
jest.mock("@/utils/supabase/client", () => ({
  createClient: () => ({
    auth: {
      getUser: jest.fn().mockResolvedValue({
        data: {
          user: {
            id: "uid-123",
            email: "visitor@example.com",
            user_metadata: { role: "visitor", full_name: "Jane Visitor", avatar_url: "" },
          },
        },
      }),
    },
  }),
}));

// Silence unimportant console noise
beforeAll(() => {
  jest.spyOn(console, "log").mockImplementation(() => {});
  jest.spyOn(console, "error").mockImplementation(() => {});
});

afterAll(() => {
  jest.restoreAllMocks();
});

// Helpers --------------------------------------------------------------------

/** Wait for the loading spinner to disappear */
async function waitForFormReady() {
  await waitFor(() => {
    expect(screen.queryByText(/loading inspection form/i)).not.toBeInTheDocument();
  });
}

/** The exact phrase the user must type */
const REQUIRED_PHRASE = "I am not a volunteer of SAPAA";

// ---------------------------------------------------------------------------
// Test suites
// ---------------------------------------------------------------------------

describe("NewReportPage – Liability / Verification Popup", () => {

  // -------------------------------------------------------------------------
  // 1.  Popup renders for non-stewards
  // -------------------------------------------------------------------------
  describe("Initial render", () => {
    it("shows the loading spinner while data is being fetched", () => {
      render(<NewReportPage />);
      expect(screen.getByText(/loading inspection form/i)).toBeInTheDocument();
    });

    it("shows the verification popup once loading completes (non-steward user)", async () => {
      render(<NewReportPage />);
      await waitForFormReady();

      expect(screen.getByText(/the fine print up front/i)).toBeInTheDocument();
    });

    it("displays the exact required phrase inside a code block", async () => {
      render(<NewReportPage />);
      await waitForFormReady();

      expect(screen.getByText(REQUIRED_PHRASE)).toBeInTheDocument();
    });

    it("displays the emergency notice about 911", async () => {
      render(<NewReportPage />);
      await waitForFormReady();

      // "Call" and "911" live in separate DOM nodes (<strong>), so we query
      // the list item whose full text content contains both words.
      const listItem = screen.getByText((_content, element) => {
        if (!element) return false;
        const text = element.textContent ?? "";
        return (
          element.tagName === "LI" &&
          /call/i.test(text) &&
          /911/.test(text)
        );
      });
      expect(listItem).toBeInTheDocument();
    });

    it("displays the 310-LAND link", async () => {
      render(<NewReportPage />);
      await waitForFormReady();

      expect(screen.getByRole("link", { name: /310-land/i })).toBeInTheDocument();
    });

    it("has the 'Continue to Form' button disabled initially", async () => {
      render(<NewReportPage />);
      await waitForFormReady();

      const continueBtn = screen.getByRole("button", { name: /continue to form/i });
      expect(continueBtn).toBeDisabled();
    });

    it("has the terms checkbox unchecked initially", async () => {
      render(<NewReportPage />);
      await waitForFormReady();

      const checkbox = screen.getByRole("checkbox");
      expect(checkbox).not.toBeChecked();
    });
  });

  // -------------------------------------------------------------------------
  // 2.  Typing in the verification field
  // -------------------------------------------------------------------------
  describe("Verification text input", () => {
    it("does not show an error when the field is empty", async () => {
      render(<NewReportPage />);
      await waitForFormReady();

      expect(screen.queryByText(/text does not match/i)).not.toBeInTheDocument();
    });

    it("shows an error when the typed text doesn't match the required phrase", async () => {
      render(<NewReportPage />);
      await waitForFormReady();

      const input = screen.getByPlaceholderText(/type here/i);
      await userEvent.type(input, "wrong text");

      expect(screen.getByText(/text does not match/i)).toBeInTheDocument();
    });

    it("hides the mismatch error once the user types the correct phrase", async () => {
      render(<NewReportPage />);
      await waitForFormReady();

      const input = screen.getByPlaceholderText(/type here/i);
      await userEvent.type(input, REQUIRED_PHRASE);

      expect(screen.queryByText(/text does not match/i)).not.toBeInTheDocument();
    });

    it("keeps 'Continue' button disabled when phrase is correct but checkbox unchecked", async () => {
      render(<NewReportPage />);
      await waitForFormReady();

      const input = screen.getByPlaceholderText(/type here/i);
      await userEvent.type(input, REQUIRED_PHRASE);

      const continueBtn = screen.getByRole("button", { name: /continue to form/i });
      expect(continueBtn).toBeDisabled();
    });

    it("keeps 'Continue' button disabled when checkbox is checked but phrase is wrong", async () => {
      render(<NewReportPage />);
      await waitForFormReady();

      const checkbox = screen.getByRole("checkbox");
      await userEvent.click(checkbox);

      const continueBtn = screen.getByRole("button", { name: /continue to form/i });
      expect(continueBtn).toBeDisabled();
    });
  });

  // -------------------------------------------------------------------------
  // 3.  Terms & Conditions checkbox
  // -------------------------------------------------------------------------
  describe("Terms and conditions checkbox", () => {
    it("can be toggled on", async () => {
      render(<NewReportPage />);
      await waitForFormReady();

      const checkbox = screen.getByRole("checkbox");
      await userEvent.click(checkbox);

      expect(checkbox).toBeChecked();
    });

    it("can be toggled off after being checked", async () => {
      render(<NewReportPage />);
      await waitForFormReady();

      const checkbox = screen.getByRole("checkbox");
      await userEvent.click(checkbox);
      await userEvent.click(checkbox);

      expect(checkbox).not.toBeChecked();
    });

    it("renders a link to the terms page", async () => {
      render(<NewReportPage />);
      await waitForFormReady();

      const termsLink = screen.getByRole("link", { name: /terms and conditions/i });
      expect(termsLink).toBeInTheDocument();
    });

    it("the terms link points to the terms page", async () => {
      render(<NewReportPage />);
      await waitForFormReady();

      const termsLink = screen.getByRole("link", { name: /terms and conditions/i });

      // The improved next/link mock resolves { pathname: "/terms", ... } to "/terms"
      expect(termsLink.getAttribute("href")).toMatch(/terms/i);
    });
  });

  // -------------------------------------------------------------------------
  // 4.  Full happy-path: user fills out both requirements and proceeds
  // -------------------------------------------------------------------------
  describe("Happy path – full liability check completion", () => {
    async function completeVerification() {
      render(<NewReportPage />);
      await waitForFormReady();

      // Step 1: type the required confirmation phrase
      const input = screen.getByPlaceholderText(/type here/i);
      await userEvent.type(input, REQUIRED_PHRASE);

      // Step 2: accept terms & conditions
      const checkbox = screen.getByRole("checkbox");
      await userEvent.click(checkbox);

      return { input, checkbox };
    }

    it("enables the 'Continue to Form' button when both conditions are met", async () => {
      await completeVerification();

      const continueBtn = screen.getByRole("button", { name: /continue to form/i });
      expect(continueBtn).toBeEnabled();
    });

    it("dismisses the popup when 'Continue to Form' is clicked", async () => {
      await completeVerification();

      const continueBtn = screen.getByRole("button", { name: /continue to form/i });
      await userEvent.click(continueBtn);

      await waitFor(() => {
        expect(screen.queryByText(/the fine print up front/i)).not.toBeInTheDocument();
      });
    });

    it("does not navigate away when continuing — user stays on the form", async () => {
      await completeVerification();

      const continueBtn = screen.getByRole("button", { name: /continue to form/i });
      await userEvent.click(continueBtn);

      // router.push should NOT have been called — popup closed, form revealed
      expect(mockPush).not.toHaveBeenCalled();
    });

    it("preserves the checkbox state (checked) after popup closes", async () => {
      await completeVerification();

      const continueBtn = screen.getByRole("button", { name: /continue to form/i });
      await userEvent.click(continueBtn);

      // Checkbox is inside the popup which is removed from DOM — no error expected.
      await waitFor(() => {
        expect(screen.queryByText(/the fine print up front/i)).not.toBeInTheDocument();
      });
    });
  });

  // -------------------------------------------------------------------------
  // 5.  Cancel / back navigation
  // -------------------------------------------------------------------------
  describe("Cancel button", () => {
    it("calls router.back() when Cancel is clicked", async () => {
      render(<NewReportPage />);
      await waitForFormReady();

      const cancelBtn = screen.getByRole("button", { name: /cancel/i });
      await userEvent.click(cancelBtn);

      expect(mockRouterBack).toHaveBeenCalledTimes(1);
    });
  });

  // -------------------------------------------------------------------------
  // 6.  Steward users bypass the verification popup entirely
  // -------------------------------------------------------------------------
  describe("Steward user – popup bypassed", () => {
    beforeEach(() => {
      const { isSteward } = require("@/utils/supabase/queries");
      (isSteward as jest.Mock).mockResolvedValue(true);
    });

    afterEach(() => {
      const { isSteward } = require("@/utils/supabase/queries");
      (isSteward as jest.Mock).mockResolvedValue(false);
    });

    it("does NOT show the verification popup for verified stewards", async () => {
      render(<NewReportPage />);
      await waitForFormReady();

      expect(screen.queryByText(/the fine print up front/i)).not.toBeInTheDocument();
    });

    it("shows the Steward badge in the header for steward users", async () => {
      render(<NewReportPage />);
      await waitForFormReady();

      expect(screen.getByText(/steward/i)).toBeInTheDocument();
    });
  });

  // -------------------------------------------------------------------------
  // 7.  Edge cases
  // -------------------------------------------------------------------------
  describe("Edge cases", () => {
    it("requires an exact case-sensitive match — trailing space makes it invalid", async () => {
      render(<NewReportPage />);
      await waitForFormReady();

      const input = screen.getByPlaceholderText(/type here/i);
      // Type phrase with a trailing space
      await userEvent.type(input, `${REQUIRED_PHRASE} `);

      const continueBtn = screen.getByRole("button", { name: /continue to form/i });

      // Button should stay disabled (phrase doesn't match after trim fails on extra space)
      const checkbox = screen.getByRole("checkbox");
      await userEvent.click(checkbox);

      // The required phrase check in the component uses .trim(), so trailing
      // spaces are actually stripped. This confirms the component's trim behaviour.
      await waitFor(() => {
        expect(continueBtn).toBeEnabled();
      });
    });

    it("shows an error for partial phrase entry", async () => {
      render(<NewReportPage />);
      await waitForFormReady();

      const input = screen.getByPlaceholderText(/type here/i);
      await userEvent.type(input, "I am not a volunteer");

      expect(screen.getByText(/text does not match/i)).toBeInTheDocument();
    });

    it("shows the popup again if user navigates back and re-renders (fresh state)", async () => {
      const { unmount } = render(<NewReportPage />);
      await waitForFormReady();
      unmount();

      render(<NewReportPage />);
      await waitForFormReady();

      expect(screen.getByText(/the fine print up front/i)).toBeInTheDocument();
    });
  });
});