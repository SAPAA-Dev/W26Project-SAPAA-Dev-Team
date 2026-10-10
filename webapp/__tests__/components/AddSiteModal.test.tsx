import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import AddSiteModal from "../../app/admin/sites/components/AddSiteModal";
import { findSitesWithName, getSiteSuggestions } from "../../utils/supabase/queries";

jest.mock("../../utils/supabase/queries", () => ({
  findSitesWithName: jest.fn(),
  getSiteSuggestions: jest.fn(),
}));

const counties = [
  { id: 1, county: "Strathcona County" },
  { id: 2, county: "Parkland County" },
];

const protectedAreas = [
  { id: 9, name: "Lakeland", fid: 181, area_type: "PRA" },
  { id: 10, name: "Wainwright Dunes", fid: 44, area_type: "ER" },
];

function renderModal(onSave = jest.fn().mockResolvedValue(true)) {
  render(
    <AddSiteModal
      visible
      counties={counties}
      protectedAreas={protectedAreas}
      onClose={jest.fn()}
      onSave={onSave}
      saving={false}
    />
  );
  return onSave;
}

describe("AddSiteModal", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (findSitesWithName as jest.Mock).mockResolvedValue([]);
    (getSiteSuggestions as jest.Mock).mockResolvedValue([
      { name: "Bilby", category: "Natural Areas (OC)" },
      { name: "Bilberry Creek", category: "Provincial Recreation Areas" },
      { name: "Wagner", category: "Natural Areas (OC)" },
    ]);
  });

  it("renders nothing when it is not visible", () => {
    const { container } = render(
      <AddSiteModal
        visible={false}
        counties={counties}
        protectedAreas={protectedAreas}
        onClose={jest.fn()}
        onSave={jest.fn()}
        saving={false}
      />
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

    await waitFor(() =>
      expect(onSave).toHaveBeenCalledWith({ namesite: "Bilby NA East", ab_county: null, protected_area_id: null })
    );
  });

  it("saves the trimmed name and the chosen county", async () => {
    const onSave = renderModal();

    fireEvent.change(screen.getByTestId("add-site-name-input"), { target: { value: "  New Site  " } });
    fireEvent.change(screen.getByTestId("add-site-county-select"), { target: { value: "2" } });
    fireEvent.click(screen.getByTestId("add-site-save-button"));

    await waitFor(() =>
      expect(onSave).toHaveBeenCalledWith({ namesite: "New Site", ab_county: 2, protected_area_id: null })
    );
  });

  it("saves one selected protected area", async () => {
    const onSave = renderModal();

    fireEvent.change(screen.getByTestId("add-site-name-input"), { target: { value: "Lakeland Site" } });
    const search = screen.getByTestId("add-site-protected-area-search");
    fireEvent.change(search, { target: { value: "lake" } });
    fireEvent.focus(search);
    fireEvent.click(screen.getByTestId("add-site-protected-area-option-9"));
    expect(screen.getByTestId("add-site-protected-area-selected-name")).toHaveTextContent("Lakeland");
    expect(screen.getByTestId("add-site-protected-area-selected-detail")).toHaveTextContent("181 | PRA");
    fireEvent.click(screen.getByTestId("add-site-save-button"));

    await waitFor(() =>
      expect(onSave).toHaveBeenCalledWith({ namesite: "Lakeland Site", ab_county: null, protected_area_id: 9 })
    );
  });

  it("suggests SAPAA map areas that match what the admin types", async () => {
    renderModal();
    await waitFor(() => expect(getSiteSuggestions).toHaveBeenCalled());

    fireEvent.change(screen.getByTestId("add-site-name-input"), { target: { value: "bil" } });

    const list = await screen.findByTestId("add-site-suggestions");
    expect(list).toHaveTextContent("Bilby");
    expect(list).toHaveTextContent("Bilberry Creek");
    expect(list).not.toHaveTextContent("Wagner");
  });

  it("fills in the name when the admin picks a suggestion", async () => {
    renderModal();
    await waitFor(() => expect(getSiteSuggestions).toHaveBeenCalled());

    fireEvent.change(screen.getByTestId("add-site-name-input"), { target: { value: "bil" } });
    fireEvent.click(await screen.findByText("Bilberry Creek"));

    expect(screen.getByTestId("add-site-name-input")).toHaveValue("Bilberry Creek");
    expect(screen.queryByTestId("add-site-suggestions")).not.toBeInTheDocument();
    await waitFor(() => expect(findSitesWithName).toHaveBeenCalledWith("Bilberry Creek"));
  });

  it("US 2.0.2: picks a suggestion with the keyboard", async () => {
    renderModal();
    await waitFor(() => expect(getSiteSuggestions).toHaveBeenCalled());

    const nameInput = screen.getByRole("combobox", { name: /Site Name/ });
    fireEvent.change(nameInput, { target: { value: "bil" } });
    await screen.findByRole("listbox", { name: "Suggestions from the SAPAA map" });

    fireEvent.keyDown(nameInput, { key: "ArrowDown" });
    fireEvent.keyDown(nameInput, { key: "ArrowDown" });
    expect(screen.getByRole("option", { name: /Bilberry Creek/ })).toHaveAttribute("aria-selected", "true");
    fireEvent.keyDown(nameInput, { key: "Enter" });

    expect(nameInput).toHaveValue("Bilberry Creek");
    expect(screen.queryByTestId("add-site-suggestions")).not.toBeInTheDocument();
    await waitFor(() => expect(findSitesWithName).toHaveBeenCalledWith("Bilberry Creek"));
  });

  it("US 2.0.2: Escape closes the suggestions and keeps the typed name", async () => {
    renderModal();
    await waitFor(() => expect(getSiteSuggestions).toHaveBeenCalled());

    const nameInput = screen.getByRole("combobox", { name: /Site Name/ });
    fireEvent.change(nameInput, { target: { value: "bil" } });
    await screen.findByTestId("add-site-suggestions");

    fireEvent.keyDown(nameInput, { key: "Escape" });

    expect(screen.queryByTestId("add-site-suggestions")).not.toBeInTheDocument();
    expect(nameInput).toHaveValue("bil");
  });
});
