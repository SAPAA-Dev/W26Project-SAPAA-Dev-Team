jest.mock("next/server", () => ({
  NextResponse: {
    json: jest.fn((body, init) => ({
      status: init?.status ?? 200,
      json: async () => body,
    })),
  },
}));

import { DELETE } from "@/app/api/site-images/route";
import { createClient } from "@/utils/supabase/server";
import { deleteObjectsByKeys } from "@/utils/media/s3Delete";

jest.mock("@/utils/supabase/server", () => ({
  createClient: jest.fn(),
}));

jest.mock("@aws-sdk/client-s3", () => ({
  S3Client: jest.fn().mockImplementation(() => ({})),
  GetObjectCommand: jest.fn().mockImplementation((input) => ({ input })),
}));

jest.mock("@aws-sdk/s3-request-presigner", () => ({
  getSignedUrl: jest.fn(),
}));

jest.mock("@/utils/media/s3Delete", () => ({
  deleteObjectsByKeys: jest.fn(),
}));

describe("DELETE /api/site-images (US 7.0.5)", () => {
  const mockGetUser = jest.fn();
  const mockFrom = jest.fn();
  const consoleSpy = jest.spyOn(console, "error").mockImplementation(() => {});

  const adminUser = {
    id: "admin-1",
    app_metadata: { role: "admin", authenticated: true },
  };

  beforeEach(() => {
    jest.clearAllMocks();

    (createClient as jest.Mock).mockResolvedValue({
      auth: {
        getUser: mockGetUser,
      },
      from: mockFrom,
    });

    mockGetUser.mockResolvedValue({
      data: { user: adminUser },
      error: null,
    });

    (deleteObjectsByKeys as jest.Mock).mockResolvedValue(undefined);
  });

  afterAll(() => {
    consoleSpy.mockRestore();
  });

  function mockAttachmentRow(row: unknown, error: unknown = null) {
    const singleMock = jest.fn().mockResolvedValue({ data: row, error });
    const eqMock = jest.fn().mockReturnValue({ single: singleMock });
    const selectMock = jest.fn().mockReturnValue({ eq: eqMock });
    mockFrom.mockReturnValueOnce({ select: selectMock });
    return { eqMock };
  }

  function mockAttachmentDelete(rows: unknown, error: unknown = null) {
    const selectMock = jest.fn().mockResolvedValue({ data: rows, error });
    const eqMock = jest.fn().mockReturnValue({ select: selectMock });
    const deleteMock = jest.fn().mockReturnValue({ eq: eqMock });
    mockFrom.mockReturnValueOnce({ delete: deleteMock });
    return { eqMock };
  }

  function deleteRequest(id: string | null, kind?: string) {
    const params = new URLSearchParams();
    if (id !== null) params.set("id", id);
    if (kind !== undefined) params.set("kind", kind);
    const query = params.toString();
    return new Request(`http://localhost/api/site-images${query ? `?${query}` : ""}`);
  }

  it("returns 401 when the user is not signed in", async () => {
    mockGetUser.mockResolvedValue({ data: { user: null }, error: null });

    const response = await DELETE(deleteRequest("14"));
    const body = await response.json();

    expect(response.status).toBe(401);
    expect(body).toEqual({ error: "Unauthorized" });
    expect(deleteObjectsByKeys).not.toHaveBeenCalled();
  });

  it("returns 403 for a non-admin user and deletes nothing (7.0.5 AT2)", async () => {
    mockGetUser.mockResolvedValue({
      data: { user: { id: "user-1", app_metadata: { role: "steward", authenticated: true } } },
      error: null,
    });

    const response = await DELETE(deleteRequest("14"));
    const body = await response.json();

    expect(response.status).toBe(403);
    expect(body).toEqual({ error: "Forbidden" });
    expect(mockFrom).not.toHaveBeenCalled();
    expect(deleteObjectsByKeys).not.toHaveBeenCalled();
  });

  it("returns 403 when only user_metadata claims admin and deletes nothing (7.0.5 AT2)", async () => {
    mockGetUser.mockResolvedValue({
      data: { user: { id: "user-1", user_metadata: { role: "admin" }, app_metadata: { role: "steward", authenticated: true } } },
      error: null,
    });

    const response = await DELETE(deleteRequest("14"));
    const body = await response.json();

    expect(response.status).toBe(403);
    expect(body).toEqual({ error: "Forbidden" });
    expect(mockFrom).not.toHaveBeenCalled();
    expect(deleteObjectsByKeys).not.toHaveBeenCalled();
  });

  it("returns 403 for an unapproved admin and deletes nothing (7.0.5 AT2)", async () => {
    mockGetUser.mockResolvedValue({
      data: { user: { id: "user-1", app_metadata: { role: "admin", authenticated: false } } },
      error: null,
    });

    const response = await DELETE(deleteRequest("14"));
    const body = await response.json();

    expect(response.status).toBe(403);
    expect(body).toEqual({ error: "Forbidden" });
    expect(mockFrom).not.toHaveBeenCalled();
    expect(deleteObjectsByKeys).not.toHaveBeenCalled();
  });

  it("returns 400 when the id is missing", async () => {
    const response = await DELETE(deleteRequest(null));
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body).toEqual({ error: "Provide a numeric attachment id" });
    expect(deleteObjectsByKeys).not.toHaveBeenCalled();
  });

  it("returns 400 when the id is not numeric", async () => {
    const response = await DELETE(deleteRequest("abc"));
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body).toEqual({ error: "Provide a numeric attachment id" });
    expect(deleteObjectsByKeys).not.toHaveBeenCalled();
  });

  it("returns 404 when the attachment row is missing", async () => {
    mockAttachmentRow(null, { message: "No rows" });

    const response = await DELETE(deleteRequest("14"));
    const body = await response.json();

    expect(response.status).toBe(404);
    expect(body).toEqual({ error: "Attachment not found" });
    expect(deleteObjectsByKeys).not.toHaveBeenCalled();
  });

  it("deletes the row before the S3 file on success (7.0.5 AT1, 7.0.5 AT3)", async () => {
    mockAttachmentRow({ id: 14, storage_key: "inspections/207/3226/27/file1.jpg" });
    const { eqMock } = mockAttachmentDelete([{ id: 14 }]);

    const response = await DELETE(deleteRequest("14"));
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toEqual({ deleted: true, storageCleanupComplete: true });
    expect(deleteObjectsByKeys).toHaveBeenCalledWith([
      "inspections/207/3226/27/file1.jpg",
    ]);
    expect(eqMock).toHaveBeenCalledWith("id", 14);
    expect(eqMock.mock.invocationCallOrder[0]).toBeLessThan(
      (deleteObjectsByKeys as jest.Mock).mock.invocationCallOrder[0]
    );
  });

  it("US 7.0.5 AT3: returns 200 with storageCleanupComplete false when the S3 delete fails after the row delete", async () => {
    mockAttachmentRow({ id: 14, storage_key: "inspections/207/3226/27/file1.jpg" });
    mockAttachmentDelete([{ id: 14 }]);
    (deleteObjectsByKeys as jest.Mock).mockRejectedValueOnce(new Error("S3 down"));

    const response = await DELETE(deleteRequest("14"));
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toEqual({ deleted: true, storageCleanupComplete: false });
    expect(mockFrom).toHaveBeenCalledTimes(2);
    expect(deleteObjectsByKeys).toHaveBeenCalledWith([
      "inspections/207/3226/27/file1.jpg",
    ]);
    expect(consoleSpy).toHaveBeenCalledWith(
      "Image S3 cleanup failed after database deletion.",
      expect.objectContaining({ storageKey: "inspections/207/3226/27/file1.jpg" })
    );
  });

  it("returns 500 when the row delete fails", async () => {
    mockAttachmentRow({ id: 14, storage_key: "inspections/207/3226/27/file1.jpg" });
    mockAttachmentDelete(null, { message: "DB down" });

    const response = await DELETE(deleteRequest("14"));
    const body = await response.json();

    expect(response.status).toBe(500);
    expect(body).toEqual({ error: "Failed to delete site image" });
  });

  it("returns 500 when the row delete silently removes nothing", async () => {
    mockAttachmentRow({ id: 14, storage_key: "inspections/207/3226/27/file1.jpg" });
    mockAttachmentDelete([]);

    const response = await DELETE(deleteRequest("14"));
    const body = await response.json();

    expect(response.status).toBe(500);
    expect(body).toEqual({ error: "Failed to delete site image" });
  });

  it("reads and deletes from the attachments table when kind is missing", async () => {
    mockAttachmentRow({ id: 14, storage_key: "inspections/207/3226/27/file1.jpg" });
    mockAttachmentDelete([{ id: 14 }]);

    const response = await DELETE(deleteRequest("14"));
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toEqual({ deleted: true, storageCleanupComplete: true });
    expect(mockFrom).toHaveBeenNthCalledWith(1, "attachments");
    expect(mockFrom).toHaveBeenNthCalledWith(2, "attachments");
  });

  it("deletes a homepage upload row and its S3 file when kind is homepage_image_uploads (7.0.5 AT1, 7.0.5 AT3)", async () => {
    mockAttachmentRow({ id: 7, storage_key: "homepage-image-uploads/207/0b1c2d3e-4f50-4a6b-8c7d-9e0f1a2b3c4d/file2.jpg" });
    mockAttachmentDelete([{ id: 7 }]);

    const response = await DELETE(deleteRequest("7", "homepage_image_uploads"));
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toEqual({ deleted: true, storageCleanupComplete: true });
    expect(mockFrom).toHaveBeenNthCalledWith(1, "homepage_image_uploads");
    expect(mockFrom).toHaveBeenNthCalledWith(2, "homepage_image_uploads");
    expect(deleteObjectsByKeys).toHaveBeenCalledWith(["homepage-image-uploads/207/0b1c2d3e-4f50-4a6b-8c7d-9e0f1a2b3c4d/file2.jpg"]);
  });

  it("returns 422 and deletes nothing when the storage key is outside the image folders", async () => {
    mockAttachmentRow({ id: 14, storage_key: "exports/207/report.pdf" });

    const response = await DELETE(deleteRequest("14"));

    expect(response.status).toBe(422);
    expect(mockFrom).toHaveBeenCalledTimes(1);
    expect(deleteObjectsByKeys).not.toHaveBeenCalled();
  });

  it("returns 404 when the homepage upload row is missing", async () => {
    mockAttachmentRow(null, { message: "No rows" });

    const response = await DELETE(deleteRequest("7", "homepage_image_uploads"));
    const body = await response.json();

    expect(response.status).toBe(404);
    expect(body).toEqual({ error: "Homepage image not found" });
    expect(deleteObjectsByKeys).not.toHaveBeenCalled();
  });

  it("returns 400 for an unknown kind and deletes nothing", async () => {
    const response = await DELETE(deleteRequest("14", "sites_pa"));
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body).toEqual({ error: "Provide a valid image kind" });
    expect(mockFrom).not.toHaveBeenCalled();
    expect(deleteObjectsByKeys).not.toHaveBeenCalled();
  });
});
