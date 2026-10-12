import { rollbackSiteInspectionSubmission } from "../../utils/supabase/queries";
import { createClient, createServerSupabase } from "../../utils/supabase/server";
import { deleteObjectsByKeys } from "../../utils/media/s3Delete";

jest.mock("../../utils/supabase/server", () => ({
  createServerSupabase: jest.fn(),
  createClient: jest.fn(),
}));

jest.mock("../../utils/media/s3Delete", () => ({
  deleteObjectsByKeys: jest.fn(),
}));

describe("rollbackSiteInspectionSubmission (US 7.0.5)", () => {
  const mockFrom = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    (createServerSupabase as jest.Mock).mockReturnValue({
      from: mockFrom,
    });
    (deleteObjectsByKeys as jest.Mock).mockResolvedValue(undefined);
    mockCaller("owner-uuid");
  });

  function mockCaller(id: string, role = "steward") {
    (createClient as jest.Mock).mockResolvedValue({
      auth: {
        getUser: jest.fn().mockResolvedValue({
          data: { user: { id, app_metadata: { role, authenticated: true } } },
          error: null,
        }),
      },
    });
  }

  // The owner check reads the report before anything is deleted.
  function mockReport(row: unknown = { user_id: "owner-uuid", site_id: 207, created_at: new Date().toISOString() }) {
    const maybeSingle = jest.fn().mockResolvedValue({ data: row, error: null });
    const is = jest.fn().mockReturnValue({ maybeSingle });
    const eq = jest.fn().mockReturnValue({ is });
    mockFrom.mockReturnValueOnce({ select: jest.fn().mockReturnValue({ eq }) });
    return { eq, is };
  }

  function mockSelect(rows: unknown) {
    const eqMock = jest.fn().mockResolvedValue({ data: rows, error: null });
    const selectMock = jest.fn().mockReturnValue({ eq: eqMock });
    mockFrom.mockReturnValueOnce({ select: selectMock });
  }

  function mockDelete() {
    const eqMock = jest.fn().mockResolvedValue({ data: null, error: null });
    const deleteMock = jest.fn().mockReturnValue({ eq: eqMock });
    mockFrom.mockReturnValueOnce({ delete: deleteMock });
    return eqMock;
  }

  it("deletes the database rows before the response files from S3 (7.0.5 AT5)", async () => {
    mockReport();
    mockSelect([
      { storage_key: "inspections/207/3226/27/file1.jpg" },
      { storage_key: "inspections/207/3226/27/file2.jpg" },
    ]);
    const attachmentsDeleteEq = mockDelete();
    const answersDeleteEq = mockDelete();
    const responseDeleteEq = mockDelete();

    await rollbackSiteInspectionSubmission(3226);

    expect(deleteObjectsByKeys).toHaveBeenCalledWith([
      "inspections/207/3226/27/file1.jpg",
      "inspections/207/3226/27/file2.jpg",
    ]);
    expect(attachmentsDeleteEq).toHaveBeenCalledWith("response_id", 3226);
    expect(responseDeleteEq.mock.invocationCallOrder[0]).toBeLessThan(
      (deleteObjectsByKeys as jest.Mock).mock.invocationCallOrder[0]
    );
    expect(answersDeleteEq).toHaveBeenCalledWith("response_id", 3226);
  });

  it("removes the database rows before the S3 delete fails (7.0.5 AT5)", async () => {
    mockReport();
    mockSelect([{ storage_key: "inspections/207/3226/27/file1.jpg" }]);
    mockDelete();
    mockDelete();
    mockDelete();
    (deleteObjectsByKeys as jest.Mock).mockRejectedValueOnce(new Error("S3 down"));

    await expect(rollbackSiteInspectionSubmission(3226)).rejects.toThrow("S3 down");
    expect(mockFrom).toHaveBeenCalledTimes(5);
  });

  it("still removes rows when the response has no files (7.0.5 AT5)", async () => {
    mockReport();
    mockSelect([]);

    const attachmentsDeleteEq = mockDelete();
    mockDelete();
    mockDelete();

    await rollbackSiteInspectionSubmission(3226);

    expect(deleteObjectsByKeys).toHaveBeenCalledWith([]);
    expect(attachmentsDeleteEq).toHaveBeenCalledWith("response_id", 3226);
  });

  it("US 7.0.8 AT4: refuses a different user and deletes nothing", async () => {
    mockCaller("other-uuid");
    mockReport();

    await expect(rollbackSiteInspectionSubmission(3226)).rejects.toThrow(
      "You are not allowed to change this report."
    );
    expect(mockFrom).toHaveBeenCalledTimes(1);
    expect(deleteObjectsByKeys).not.toHaveBeenCalled();
  });

  it("US 7.0.8 AT4: refuses an unapproved caller before reading the report", async () => {
    (createClient as jest.Mock).mockResolvedValue({
      auth: {
        getUser: jest.fn().mockResolvedValue({
          data: { user: { id: "owner-uuid", app_metadata: { role: "steward", authenticated: false } } },
          error: null,
        }),
      },
    });

    await expect(rollbackSiteInspectionSubmission(3226)).rejects.toThrow(
      "You are not allowed to change this report."
    );
    expect(mockFrom).not.toHaveBeenCalled();
  });

  it("US 7.0.8 AT4: refuses an archived report, which the owner check does not find", async () => {
    const { is } = mockReport(null);

    await expect(rollbackSiteInspectionSubmission(3226)).rejects.toThrow(
      "You are not allowed to change this report."
    );
    expect(is).toHaveBeenCalledWith("archived_at", null);
    expect(deleteObjectsByKeys).not.toHaveBeenCalled();
  });

  it("refuses the owner once the report is older than the rollback window", async () => {
    mockReport({ user_id: "owner-uuid", site_id: 207, created_at: "2026-01-01T00:00:00Z" });

    await expect(rollbackSiteInspectionSubmission(3226)).rejects.toThrow(
      "You are not allowed to change this report."
    );
    expect(mockFrom).toHaveBeenCalledTimes(1);
  });

  it("allows an approved admin to roll back another user's new report", async () => {
    mockCaller("admin-uuid", "admin");
    mockReport();
    mockSelect([]);
    mockDelete();
    mockDelete();
    const responseDeleteEq = mockDelete();

    await rollbackSiteInspectionSubmission(3226);

    expect(responseDeleteEq).toHaveBeenCalledWith("id", 3226);
  });
});
