import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import SiteSteward from "@/app/detail/[namesite]/SiteSteward";
import { assignSiteSteward, getSiteSteward, searchStewards } from "@/utils/steward-actions";

jest.mock("@/utils/steward-actions", () => ({
  getSiteSteward: jest.fn(),
  searchStewards: jest.fn(),
  assignSiteSteward: jest.fn(),
}));

describe("SiteSteward", () => {
  beforeEach(() => jest.clearAllMocks());

  it("shows the steward with a link to their profile (3.0.2 AT3)", async () => {
    (getSiteSteward as jest.Mock).mockResolvedValue({ id: 3, displayName: "Ann Lee" });
    render(<SiteSteward siteId={7} isAdmin={false} />);

    const link = await screen.findByTestId("site-steward-link");
    expect(link).toHaveTextContent("Ann Lee");
    expect(link).toHaveAttribute("href", "/people/3");
    expect(screen.queryByTestId("site-steward-edit")).not.toBeInTheDocument();
  });

  it("shows that no steward is assigned (3.0.2 AT3)", async () => {
    (getSiteSteward as jest.Mock).mockResolvedValue(null);
    render(<SiteSteward siteId={7} isAdmin={false} />);
    expect(await screen.findByText("No steward assigned")).toBeInTheDocument();
  });

  it("shows an error, not 'No steward assigned', when the steward lookup fails", async () => {
    (getSiteSteward as jest.Mock).mockRejectedValue(new Error("network"));
    render(<SiteSteward siteId={7} isAdmin={false} />);

    expect(await screen.findByText("The steward could not be loaded.")).toBeInTheDocument();
    expect(screen.queryByText("No steward assigned")).not.toBeInTheDocument();
  });

  it("lets an admin search and assign a steward (3.0.2 AT1, AT2)", async () => {
    (getSiteSteward as jest.Mock).mockResolvedValue({ id: 3, displayName: "Ann Lee" });
    (searchStewards as jest.Mock).mockResolvedValue([{ id: 4, displayName: "Bo Chan" }]);
    (assignSiteSteward as jest.Mock).mockResolvedValue({ success: true });
    render(<SiteSteward siteId={7} isAdmin />);

    fireEvent.click(await screen.findByText("Change"));
    fireEvent.change(screen.getByTestId("site-steward-search"), { target: { value: "bo" } });
    fireEvent.click(screen.getByText("Search"));
    fireEvent.click(await screen.findByText("Bo Chan"));

    await waitFor(() => expect(screen.getByTestId("site-steward-link")).toHaveTextContent("Bo Chan"));
    expect(searchStewards).toHaveBeenCalledWith("bo");
    expect(assignSiteSteward).toHaveBeenCalledWith(7, 4);
  });

  it("shows the server's refusal and keeps the old steward (3.0.2 AT4)", async () => {
    (getSiteSteward as jest.Mock).mockResolvedValue({ id: 3, displayName: "Ann Lee" });
    (searchStewards as jest.Mock).mockResolvedValue([{ id: 4, displayName: "Bo Chan" }]);
    (assignSiteSteward as jest.Mock).mockResolvedValue({ success: false, error: "Only admins can assign a steward." });
    render(<SiteSteward siteId={7} isAdmin />);

    fireEvent.click(await screen.findByText("Change"));
    fireEvent.change(screen.getByTestId("site-steward-search"), { target: { value: "bo" } });
    fireEvent.click(screen.getByText("Search"));
    fireEvent.click(await screen.findByText("Bo Chan"));

    expect(await screen.findByRole("alert")).toHaveTextContent("Only admins can assign a steward.");
    expect(screen.getByTestId("site-steward-link")).toHaveTextContent("Ann Lee");
  });

  it("shows a message when the search request fails (3.0.2 AT1)", async () => {
    (getSiteSteward as jest.Mock).mockResolvedValue(null);
    (searchStewards as jest.Mock).mockRejectedValue(new Error("network"));
    render(<SiteSteward siteId={7} isAdmin />);

    fireEvent.click(await screen.findByText("Assign steward"));
    fireEvent.change(screen.getByTestId("site-steward-search"), { target: { value: "bo" } });
    fireEvent.click(screen.getByText("Search"));

    expect(await screen.findByRole("alert")).toHaveTextContent("The search failed. Try again.");
  });

  it("disables the choices while an assignment is saving and reports a failed request (3.0.2 AT2)", async () => {
    (getSiteSteward as jest.Mock).mockResolvedValue({ id: 3, displayName: "Ann Lee" });
    (searchStewards as jest.Mock).mockResolvedValue([{ id: 4, displayName: "Bo Chan" }]);
    let rejectAssign: (reason: unknown) => void = () => {};
    (assignSiteSteward as jest.Mock).mockReturnValue(new Promise((_, reject) => { rejectAssign = reject; }));
    render(<SiteSteward siteId={7} isAdmin />);

    fireEvent.click(await screen.findByText("Change"));
    fireEvent.change(screen.getByTestId("site-steward-search"), { target: { value: "bo" } });
    fireEvent.click(screen.getByText("Search"));
    const choice = await screen.findByText("Bo Chan");
    fireEvent.click(choice);

    await waitFor(() => expect(choice).toBeDisabled());
    fireEvent.click(choice);
    expect(assignSiteSteward).toHaveBeenCalledTimes(1);

    rejectAssign(new Error("network"));
    expect(await screen.findByRole("alert")).toHaveTextContent("The steward was not assigned. Try again.");
    expect(screen.getByTestId("site-steward-link")).toHaveTextContent("Ann Lee");
    expect(choice).toBeEnabled();
  });
});
