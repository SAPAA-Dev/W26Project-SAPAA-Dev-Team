import { render, screen, waitFor } from "@testing-library/react";
import SubmittedBy from "@/app/detail/[namesite]/SubmittedBy";
import { getPersonByAuthUserId } from "@/utils/steward-actions";

jest.mock("@/utils/steward-actions", () => ({ getPersonByAuthUserId: jest.fn() }));
const getPersonMock = getPersonByAuthUserId as jest.Mock;

describe("SubmittedBy", () => {
  beforeEach(() => getPersonMock.mockReset());

  it("links the inspection to the submitter's profile (1.0.1 AT3)", async () => {
    getPersonMock.mockResolvedValue({ id: 3, displayName: "Ann Lee" });
    render(<SubmittedBy userId="user-uuid" />);

    const link = await screen.findByTestId("inspection-submitter-link");
    expect(getPersonMock).toHaveBeenCalledWith("user-uuid");
    expect(link).toHaveTextContent("Ann Lee");
    expect(link).toHaveAttribute("href", "/people/3");
  });

  it("shows nothing for a report with no user", () => {
    const { container } = render(<SubmittedBy userId={null} />);
    expect(getPersonMock).not.toHaveBeenCalled();
    expect(container).toBeEmptyDOMElement();
  });

  it("shows nothing when the lookup fails", async () => {
    getPersonMock.mockRejectedValue(new Error("boom"));
    const { container } = render(<SubmittedBy userId="user-uuid" />);
    await waitFor(() => expect(getPersonMock).toHaveBeenCalled());
    expect(container).toBeEmptyDOMElement();
  });
});
