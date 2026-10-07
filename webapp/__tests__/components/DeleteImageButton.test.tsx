import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import DeleteImageButton from "@/components/DeleteImageButton";

describe("DeleteImageButton", () => {
  const mockFetch = jest.fn();
  const consoleSpy = jest.spyOn(console, "error").mockImplementation(() => {});

  beforeEach(() => {
    jest.clearAllMocks();
    global.fetch = mockFetch;
  });

  afterAll(() => {
    consoleSpy.mockRestore();
  });

  it("shows only the delete button before confirmation", () => {
    render(<DeleteImageButton attachmentId="14" onDeleted={jest.fn()} />);

    expect(screen.getByTestId("delete-image-14")).toBeInTheDocument();
    expect(screen.queryByTestId("confirm-delete-image-14")).not.toBeInTheDocument();
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it("asks for confirmation before deleting", () => {
    render(<DeleteImageButton attachmentId="14" onDeleted={jest.fn()} />);

    fireEvent.click(screen.getByTestId("delete-image-14"));

    expect(screen.getByTestId("confirm-delete-image-14")).toBeInTheDocument();
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it("sends the DELETE request and reports the deleted id", async () => {
    mockFetch.mockResolvedValueOnce({ ok: true });
    const onDeleted = jest.fn();
    render(<DeleteImageButton attachmentId="14" onDeleted={onDeleted} />);

    fireEvent.click(screen.getByTestId("delete-image-14"));
    fireEvent.click(screen.getByTestId("confirm-delete-image-14"));

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith("/api/site-images?id=14&kind=attachments", {
        method: "DELETE",
      });
    });
    expect(onDeleted).toHaveBeenCalledWith("14");
  });

  it("sends the homepage kind for homepage uploads", async () => {
    mockFetch.mockResolvedValueOnce({ ok: true });
    const onDeleted = jest.fn();
    render(<DeleteImageButton attachmentId="7" imageKind="homepage_image_uploads" onDeleted={onDeleted} />);

    fireEvent.click(screen.getByTestId("delete-image-7"));
    fireEvent.click(screen.getByTestId("confirm-delete-image-7"));

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith("/api/site-images?id=7&kind=homepage_image_uploads", {
        method: "DELETE",
      });
    });
    expect(onDeleted).toHaveBeenCalledWith("7");
  });

  it("shows an error and deletes nothing when the request fails", async () => {
    mockFetch.mockResolvedValueOnce({ ok: false });
    const onDeleted = jest.fn();
    render(<DeleteImageButton attachmentId="14" onDeleted={onDeleted} />);

    fireEvent.click(screen.getByTestId("delete-image-14"));
    fireEvent.click(screen.getByTestId("confirm-delete-image-14"));

    await waitFor(() => {
      expect(screen.getByText("Delete failed. Try again.")).toBeInTheDocument();
    });
    expect(onDeleted).not.toHaveBeenCalled();
  });

  it("returns to the plain button when cancelled", () => {
    render(<DeleteImageButton attachmentId="14" onDeleted={jest.fn()} />);

    fireEvent.click(screen.getByTestId("delete-image-14"));
    fireEvent.click(screen.getByText("Cancel"));

    expect(screen.getByTestId("delete-image-14")).toBeInTheDocument();
    expect(mockFetch).not.toHaveBeenCalled();
  });
});
