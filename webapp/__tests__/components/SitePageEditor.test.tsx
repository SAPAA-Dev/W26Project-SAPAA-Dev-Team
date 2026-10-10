import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import SitePageEditor from "../../app/detail/[namesite]/SitePageEditor";
import { updateSitePageFields } from "../../utils/supabase/queries";

jest.mock("../../utils/supabase/queries", () => ({
  updateSitePageFields: jest.fn(),
}));

const storedFields = [
  { fieldKey: "sapaa_website", value: "https://sapaastewards.com/bilby", isVisible: true },
  { fieldKey: "inaturalist", value: "https://www.inaturalist.org/places/bilby", isVisible: false },
];

function openEditor(onSaved = jest.fn()) {
  render(<SitePageEditor siteId={7} fields={storedFields} onSaved={onSaved} />);
  fireEvent.click(screen.getByTestId("edit-site-page-button"));
  return onSaved;
}

describe("SitePageEditor", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (updateSitePageFields as jest.Mock).mockResolvedValue({ ok: true });
  });

  it("enters edit mode with every field from the list", () => {
    openEditor();

    expect(screen.getByTestId("site-page-editor")).toBeInTheDocument();
    expect(screen.getByTestId("site-page-field-sapaa_website")).toBeInTheDocument();
    expect(screen.getByTestId("site-page-field-inaturalist")).toBeInTheDocument();
    expect(screen.getByTestId("site-page-field-designated_steward")).toBeInTheDocument();
  });

  it("US 2.0.10: starts a site with no saved links from the default links (M2)", () => {
    render(<SitePageEditor siteId={7} fields={[]} onSaved={jest.fn()} />);
    fireEvent.click(screen.getByTestId("edit-site-page-button"));

    expect(screen.getByLabelText("SAPAA website")).toHaveValue("https://sapaastewards.com/");
    expect(screen.getByLabelText("iNaturalist")).toHaveValue("https://www.inaturalist.org/");
  });

  it("marks each field as shown or hidden", () => {
    openEditor();

    expect(screen.getByTestId("site-page-visibility-sapaa_website")).toHaveTextContent("Shown");
    expect(screen.getByTestId("site-page-visibility-inaturalist")).toHaveTextContent("Hidden");
    expect(screen.getByTestId("site-page-visibility-designated_steward")).toHaveTextContent("Shown");
  });

  it("saves edited values and visibility, then reports the save", async () => {
    const onSaved = openEditor();

    fireEvent.change(screen.getByLabelText("SAPAA website"), { target: { value: "https://sapaastewards.com/new" } });
    fireEvent.click(screen.getByTestId("site-page-visibility-inaturalist"));
    fireEvent.click(screen.getByTestId("site-page-save-button"));

    await waitFor(() => expect(onSaved).toHaveBeenCalled());
    expect(updateSitePageFields).toHaveBeenCalledWith(7, [
      { fieldKey: "sapaa_website", value: "https://sapaastewards.com/new", isVisible: true },
      { fieldKey: "inaturalist", value: "https://www.inaturalist.org/places/bilby", isVisible: true },
      { fieldKey: "designated_steward", value: "", isVisible: true },
    ]);
    expect(screen.queryByTestId("site-page-editor")).not.toBeInTheDocument();
  });

  it("US 2.0.5 (M8): shows the error the action returns and stays in edit mode", async () => {
    (updateSitePageFields as jest.Mock).mockResolvedValue({ ok: false, error: "Links must start with http:// or https://" });
    const onSaved = openEditor();

    fireEvent.click(screen.getByTestId("site-page-save-button"));

    expect(await screen.findByRole("alert")).toHaveTextContent("Links must start with http:// or https://");
    expect(screen.getByTestId("site-page-editor")).toBeInTheDocument();
    expect(onSaved).not.toHaveBeenCalled();
  });
});
