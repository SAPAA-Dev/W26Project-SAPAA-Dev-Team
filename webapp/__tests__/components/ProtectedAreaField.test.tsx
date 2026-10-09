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
    fireEvent.mouseDown(screen.getByTestId("protected-area-option-9"));
    expect(screen.getByTestId("protected-area-selected-name")).toHaveTextContent("Lakeland");
    expect(screen.queryByTestId("protected-area-search")).not.toBeInTheDocument();

    fireEvent.click(screen.getByTestId("protected-area-clear"));
    fireEvent.focus(screen.getByTestId("protected-area-search"));
    fireEvent.mouseDown(screen.getByTestId("protected-area-option-10"));

    expect(screen.getByTestId("protected-area-selected-name")).toHaveTextContent("Wainwright Dunes");
    expect(screen.getByTestId("protected-area-selected-detail")).toHaveTextContent("44 | ER");
    expect(screen.queryByText("Lakeland")).not.toBeInTheDocument();
  });

  it("shows the saved id when the area is not in the list", () => {
    renderField(12);
    expect(screen.getByTestId("protected-area-selected-name")).toHaveTextContent("Unknown protected area");
    expect(screen.getByTestId("protected-area-selected-detail")).toHaveTextContent("Id 12");
  });
});
