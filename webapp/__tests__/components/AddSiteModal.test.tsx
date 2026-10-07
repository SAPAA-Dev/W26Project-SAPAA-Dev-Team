import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import AddSiteModal from "../../app/admin/sites/components/AddSiteModal";
import { findSitesWithName } from "../../utils/supabase/queries";

jest.mock("../../utils/supabase/queries", () => ({
  findSitesWithName: jest.fn(),
}));

const counties = [
  { id: 1, county: "Strathcona County" },
  { id: 2, county: "Parkland County" },
];

function renderModal(onSave = jest.fn().mockResolvedValue(true)) {
  render(
    <AddSiteModal visible counties={counties} onClose={jest.fn()} onSave={onSave} saving={false} />
  );
  return onSave;
}

describe("AddSiteModal", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (findSitesWithName as jest.Mock).mockResolvedValue([]);
  });

  it("renders nothing when it is not visible", () => {
    const { container } = render(
      <AddSiteModal visible={false} counties={counties} onClose={jest.fn()} onSave={jest.fn()} saving={false} />
    );
    expect(container).toBeEmptyDOMElement();
  });

  it("blocks saving and highlights the name when it is empty", async () => {
    const onSave = renderModal();

    fireEvent.click(screen.getByTestId("add-site-save-button"));

    expect(await screen.findByText("Site name is required.")).toBeInTheDocument();
    expect(screen.getByTestId("add-site-name-input")).toHaveAttribute("aria-invalid", "true");
    expect(onSave).not.toHaveBeenCalled();
  });

  it("shows a possible-duplicate warning when the name already exists", async () => {
    (findSitesWithName as jest.Mock).mockResolvedValue(["Bilby NA"]);
    renderModal();

    const nameInput = screen.getByTestId("add-site-name-input");
    fireEvent.change(nameInput, { target: { value: "bilby na" } });
    fireEvent.blur(nameInput);

    expect(await screen.findByTestId("add-site-duplicate-warning")).toHaveTextContent("Bilby NA");
    expect(findSitesWithName).toHaveBeenCalledWith("bilby na");
  });

  it("still lets the admin save after the duplicate warning", async () => {
    (findSitesWithName as jest.Mock).mockResolvedValue(["Bilby NA"]);
    const onSave = renderModal();

    const nameInput = screen.getByTestId("add-site-name-input");
    fireEvent.change(nameInput, { target: { value: "Bilby NA East" } });
    fireEvent.blur(nameInput);
    await screen.findByTestId("add-site-duplicate-warning");
    fireEvent.click(screen.getByTestId("add-site-save-button"));

    await waitFor(() => expect(onSave).toHaveBeenCalledWith({ namesite: "Bilby NA East", ab_county: null }));
  });

  it("saves the trimmed name and the chosen county", async () => {
    const onSave = renderModal();

    fireEvent.change(screen.getByTestId("add-site-name-input"), { target: { value: "  New Site  " } });
    fireEvent.change(screen.getByTestId("add-site-county-select"), { target: { value: "2" } });
    fireEvent.click(screen.getByTestId("add-site-save-button"));

    await waitFor(() => expect(onSave).toHaveBeenCalledWith({ namesite: "New Site", ab_county: 2 }));
  });
});