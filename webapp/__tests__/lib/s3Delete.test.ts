const mockSend = jest.fn();

jest.mock("@aws-sdk/client-s3", () => ({
  S3Client: jest.fn().mockImplementation(() => ({
    send: mockSend,
  })),
  DeleteObjectsCommand: jest.fn().mockImplementation((input) => ({ input })),
}));

import { deleteObjectsByKeys } from "@/utils/media/s3Delete";
import { DeleteObjectsCommand } from "@aws-sdk/client-s3";

describe("deleteObjectsByKeys (US 7.0.5)", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockSend.mockResolvedValue({ Errors: [] });
  });

  it("sends one DeleteObjectsCommand with the given keys (7.0.5 AT3)", async () => {
    await deleteObjectsByKeys(["seed/ducks/duck01.jpg", "seed/ducks/duck02.jpg"]);

    expect(DeleteObjectsCommand).toHaveBeenCalledTimes(1);
    expect(DeleteObjectsCommand).toHaveBeenCalledWith({
      Bucket: process.env.AWS_S3_BUCKET_NAME,
      Delete: {
        Objects: [{ Key: "seed/ducks/duck01.jpg" }, { Key: "seed/ducks/duck02.jpg" }],
      },
    });
    expect(mockSend).toHaveBeenCalledTimes(1);
  });

  it("skips empty keys and sends nothing when no keys remain", async () => {
    await deleteObjectsByKeys([null, "", null]);

    expect(mockSend).not.toHaveBeenCalled();
    expect(DeleteObjectsCommand).not.toHaveBeenCalled();
  });

  it("throws when S3 reports per-object errors", async () => {
    mockSend.mockResolvedValueOnce({
      Errors: [{ Key: "seed/ducks/duck01.jpg", Message: "AccessDenied" }],
    });

    await expect(deleteObjectsByKeys(["seed/ducks/duck01.jpg"])).rejects.toThrow(
      "AccessDenied"
    );
  });

  it("splits more than 1000 keys into several commands", async () => {
    const keys = Array.from({ length: 1001 }, (_, index) => `key-${index}`);

    await deleteObjectsByKeys(keys);

    expect(DeleteObjectsCommand).toHaveBeenCalledTimes(2);
    expect(mockSend).toHaveBeenCalledTimes(2);
  });
});
