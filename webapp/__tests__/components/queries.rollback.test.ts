import { rollbackSiteInspectionSubmission } from "../../utils/supabase/queries";
import { createServerSupabase } from "../../utils/supabase/server";
import { deleteObjectsByKeys } from "../../utils/media/s3Delete";

jest.mock("../../utils/supabase/server", () => ({
  createServerSupabase: jest.fn(),
}));

jest.mock("../../utils/media/s3Delete", () => ({
  deleteObjectsByKeys: jest.fn(),
}));

describe("rollbackSiteInspectionSubmission", () => {
  const mockFrom = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    (createServerSupabase as jest.Mock).mockReturnValue({
      from: mockFrom,
    });
    (deleteObjectsByKeys as jest.Mock).mockResolvedValue(undefined);
  });

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

  it("deletes the database rows before the response files from S3", async () => {
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

  it("removes the database rows before the S3 delete fails", async () => {
    mockSelect([{ storage_key: "inspections/207/3226/27/file1.jpg" }]);
    mockDelete();
    mockDelete();
    mockDelete();
    (deleteObjectsByKeys as jest.Mock).mockRejectedValueOnce(new Error("S3 down"));

    await expect(rollbackSiteInspectionSubmission(3226)).rejects.toThrow("S3 down");
    expect(mockFrom).toHaveBeenCalledTimes(4);
  });

  it("still removes rows when the response has no files", async () => {
    mockSelect([]);

    const attachmentsDeleteEq = mockDelete();
    mockDelete();
    mockDelete();

    await rollbackSiteInspectionSubmission(3226);

    expect(deleteObjectsByKeys).toHaveBeenCalledWith([]);
    expect(attachmentsDeleteEq).toHaveBeenCalledWith("response_id", 3226);
  });
});
