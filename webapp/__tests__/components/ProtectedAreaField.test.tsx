import React, { useState } from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import ProtectedAreaField from "../../app/admin/sites/components/ProtectedAreaField";

const areas = [
  { id: 9, name: "Lakeland", fid: 181, area_type: "PRA" },
  { id: 10, name: "Wainwright Dunes", fid: 44, area_type: "ER" },
];

function renderField(selectedId: number | null = null, onChange = jest.fn()) {
  render(
    <ProtectedAreaField
      areas={areas}
      selectedId={selectedId}
      onChange={onChange}
      disabled={false}
      testIdPrefix="protected-area"
    />
  );
  return onChange;
}

describe("ProtectedAreaField", () => {
  it("filters by name, FID, and type, and shows the detail under the name", () => {
    renderField();

    const search = screen.getByTestId("protected-area-search");
    fireEvent.focus(search);
    expect(screen.getByText("Lakeland")).toBeInTheDocument();
    expect(screen.getByText("181 | PRA")).toBeInTheDocument();

    fireEvent.change(search, { target: { value: "er" } });
    expect(screen.queryByText("Lakeland")).not.toBeInTheDocument();
    expect(screen.getByText("Wainwright Dunes")).toBeInTheDocument();
    expect(screen.getByText("44 | ER")).toBeInTheDocument();
  });

  it("keeps one choice and replaces it when another area is selected", () => {
    function Harness() {
      const [selectedId, setSelectedId] = useState<number | null>(null);
      return (
        <ProtectedAreaField
          areas={areas}
          selectedId={selectedId}
          onChange={setSelectedId}
          disabled={false}
          testIdPrefix="protected-area"
        />
      );
    }

    render(<Harness />);

    const search = screen.getByTestId("protected-area-search");
    fireEvent.focus(search);
    fireEvent.click(screen.getByTestId("protected-area-option-9"));
    expect(screen.getByTestId("protected-area-selected-name")).toHaveTextContent("Lakeland");
    expect(screen.queryByTestId("protected-area-search")).not.toBeInTheDocument();

    fireEvent.click(screen.getByTestId("protected-area-clear"));
    fireEvent.focus(screen.getByTestId("protected-area-search"));
    fireEvent.click(screen.getByTestId("protected-area-option-10"));

    expect(screen.getByTestId("protected-area-selected-name")).toHaveTextContent("Wainwright Dunes");
    expect(screen.getByTestId("protected-area-selected-detail")).toHaveTextContent("44 | ER");
    expect(screen.queryByText("Lakeland")).not.toBeInTheDocument();
  });

  it("US 2.0.2: picks an area with the arrow keys and Enter", () => {
    const onChange = renderField();

    const search = screen.getByRole("combobox", { name: "Search protected areas" });
    fireEvent.focus(search);
    expect(search).toHaveAttribute("aria-expanded", "true");
    expect(screen.getAllByRole("option")).toHaveLength(2);

    fireEvent.keyDown(search, { key: "ArrowDown" });
    fireEvent.keyDown(search, { key: "ArrowDown" });
    const second = screen.getByRole("option", { name: /Wainwright Dunes/ });
    expect(second).toHaveAttribute("aria-selected", "true");
    expect(search).toHaveAttribute("aria-activedescendant", second.id);

    fireEvent.keyDown(search, { key: "Enter" });
    expect(onChange).toHaveBeenCalledWith(10);
  });

  it("US 2.0.2: wraps from the first option to the last with ArrowUp", () => {
    const onChange = renderField();

    const search = screen.getByRole("combobox", { name: "Search protected areas" });
    fireEvent.focus(search);
    fireEvent.keyDown(search, { key: "ArrowUp" });
    fireEvent.keyDown(search, { key: "Enter" });

    expect(onChange).toHaveBeenCalledWith(10);
  });

  it("US 2.0.2: closes the list with Escape and picks nothing", () => {
    const onChange = renderField();

    const search = screen.getByRole("combobox", { name: "Search protected areas" });
    fireEvent.focus(search);
    fireEvent.keyDown(search, { key: "ArrowDown" });
    fireEvent.keyDown(search, { key: "Escape" });

    expect(search).toHaveAttribute("aria-expanded", "false");
    expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
    fireEvent.keyDown(search, { key: "Enter" });
    expect(onChange).not.toHaveBeenCalled();
  });

  it("shows the saved id when the area is not in the list", () => {
    renderField(12);
    expect(screen.getByTestId("protected-area-selected-name")).toHaveTextContent("Unknown protected area");
    expect(screen.getByTestId("protected-area-selected-detail")).toHaveTextContent("Id 12");
  });
});
