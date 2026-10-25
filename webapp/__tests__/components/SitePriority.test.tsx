import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import SitePriority from "@/app/detail/[namesite]/SitePriority";
import { getSitePriority, saveSitePriorityScores } from "@/utils/site-priority-actions";

jest.mock("@/utils/site-priority-actions", () => ({
  getSitePriority: jest.fn(),
  saveSitePriorityScores: jest.fn(),
}));

const SCORED = {
  scores: { abuses: 2, biological: 3, time: 4 },
  priority: 9,
  savedAt: "2026-10-01T00:00:00Z",
  needsReassessment: false,
};

describe("SitePriority", () => {
  beforeEach(() => jest.clearAllMocks());

  it("shows a steward the priority and the three scores, with no edit control (2.0.12 AT4)", async () => {
    (getSitePriority as jest.Mock).mockResolvedValue(SCORED);
    render(<SitePriority siteId={7} isAdmin={false} />);

    expect(await screen.findByTestId("site-priority-value")).toHaveTextContent("9");
    const scores = screen.getByTestId("site-priority-scores");
    expect(scores).toHaveTextContent("Abuses: 2");
    expect(scores).toHaveTextContent("Biological imperatives: 3");
    expect(scores).toHaveTextContent("Time since the last visit: 4");
    expect(screen.queryByTestId("site-priority-edit")).not.toBeInTheDocument();
  });

  it("says that a site has no scores yet", async () => {
    (getSitePriority as jest.Mock).mockResolvedValue({ scores: null, priority: null, savedAt: null, needsReassessment: false });
    render(<SitePriority siteId={7} isAdmin={false} />);
    expect(await screen.findByText("To-visit priority not scored yet")).toBeInTheDocument();
  });

  it("shows an error, not 'not scored yet', when the lookup fails", async () => {
    (getSitePriority as jest.Mock).mockRejectedValue(new Error("network"));
    render(<SitePriority siteId={7} isAdmin />);

    expect(await screen.findByText("The to-visit priority could not be loaded.")).toBeInTheDocument();
    expect(screen.queryByText("To-visit priority not scored yet")).not.toBeInTheDocument();
    expect(screen.queryByTestId("site-priority-edit")).not.toBeInTheDocument();
  });

  it("lets an admin enter the three scores and shows the new priority (2.0.12 AT1, AT2)", async () => {
    (getSitePriority as jest.Mock).mockResolvedValue({ scores: null, priority: null, savedAt: null, needsReassessment: false });
    (saveSitePriorityScores as jest.Mock).mockResolvedValue({ success: true, priority: SCORED });
    render(<SitePriority siteId={7} isAdmin />);

    fireEvent.click(await screen.findByTestId("site-priority-edit"));
    fireEvent.change(screen.getByTestId("site-priority-input-abuses"), { target: { value: "2" } });
    fireEvent.change(screen.getByTestId("site-priority-input-biological"), { target: { value: "3" } });
    fireEvent.change(screen.getByTestId("site-priority-input-time"), { target: { value: "4" } });
    fireEvent.click(screen.getByTestId("site-priority-save"));

    await waitFor(() => expect(screen.getByTestId("site-priority-value")).toHaveTextContent("9"));
    expect(saveSitePriorityScores).toHaveBeenCalledWith(7, { abuses: 2, biological: 3, time: 4 });
    expect(screen.queryByTestId("site-priority-save")).not.toBeInTheDocument();
  });

  it("starts the form from the saved scores", async () => {
    (getSitePriority as jest.Mock).mockResolvedValue(SCORED);
    render(<SitePriority siteId={7} isAdmin />);

    fireEvent.click(await screen.findByText("Edit scores"));
    expect(screen.getByTestId("site-priority-input-abuses")).toHaveValue(2);
    expect(screen.getByTestId("site-priority-input-time")).toHaveValue(4);
  });

  it("shows the server's refusal and keeps the old priority (2.0.12 AT5)", async () => {
    (getSitePriority as jest.Mock).mockResolvedValue(SCORED);
    (saveSitePriorityScores as jest.Mock).mockResolvedValue({ success: false, error: "Only an Admin can change the scores." });
    render(<SitePriority siteId={7} isAdmin />);

    fireEvent.click(await screen.findByText("Edit scores"));
    fireEvent.click(screen.getByTestId("site-priority-save"));

    expect(await screen.findByRole("alert")).toHaveTextContent("Only an Admin can change the scores.");
    fireEvent.click(screen.getByText("Cancel"));
    expect(screen.getByTestId("site-priority-value")).toHaveTextContent("9");
  });

  it("sends an empty field as null so the server refuses the save", async () => {
    (getSitePriority as jest.Mock).mockResolvedValue({ scores: null, priority: null, savedAt: null, needsReassessment: false });
    (saveSitePriorityScores as jest.Mock).mockResolvedValue({ success: false, error: "Each score must be a whole number from 0 to 5." });
    render(<SitePriority siteId={7} isAdmin />);

    fireEvent.click(await screen.findByTestId("site-priority-edit"));
    fireEvent.change(screen.getByTestId("site-priority-input-abuses"), { target: { value: "2" } });
    fireEvent.click(screen.getByTestId("site-priority-save"));

    expect(await screen.findByRole("alert")).toHaveTextContent("Each score must be a whole number from 0 to 5.");
    expect(saveSitePriorityScores).toHaveBeenCalledWith(7, { abuses: 2, biological: null, time: null });
  });

  describe("one-year reminder (2.0.13)", () => {
    it("shows the reminder when the server flags old points (AT1)", async () => {
      (getSitePriority as jest.Mock).mockResolvedValue({ ...SCORED, savedAt: "2025-01-01T00:00:00Z", needsReassessment: true });
      render(<SitePriority siteId={7} isAdmin />);
      expect(await screen.findByTestId("site-priority-reminder")).toHaveTextContent("Reassess them");
    });

    it("hides the reminder when the server does not flag the points (AT2, AT4)", async () => {
      (getSitePriority as jest.Mock).mockResolvedValue(SCORED);
      render(<SitePriority siteId={7} isAdmin />);
      await screen.findByTestId("site-priority-value");
      expect(screen.queryByTestId("site-priority-reminder")).not.toBeInTheDocument();
    });

    it("removes the reminder after the admin saves new points (AT3)", async () => {
      (getSitePriority as jest.Mock).mockResolvedValue({ ...SCORED, savedAt: "2025-01-01T00:00:00Z", needsReassessment: true });
      (saveSitePriorityScores as jest.Mock).mockResolvedValue({ success: true, priority: SCORED });
      render(<SitePriority siteId={7} isAdmin />);

      fireEvent.click(await screen.findByText("Edit scores"));
      fireEvent.click(screen.getByTestId("site-priority-save"));

      await waitFor(() => expect(screen.queryByTestId("site-priority-reminder")).not.toBeInTheDocument());
    });
  });
});
