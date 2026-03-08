import { TextEncoder, TextDecoder } from "util";
import { ReadableStream, TransformStream } from "stream/web";
import { MessageChannel } from "worker_threads";

Object.assign(global, {
  TextEncoder,
  TextDecoder,
  ReadableStream,
  TransformStream,
  MessageChannel,
  // MessagePort comes automatically from MessageChannel
  MessageEvent: class MessageEvent extends Event {
    data: any;
    constructor(type: string, init?: any) {
      super(type);
      this.data = init?.data;
    }
  },
});

const fetch = require("cross-fetch");
const { Request, Response, Headers } = fetch;
Object.assign(global, { fetch, Request, Response, Headers });


jest.mock("@aws-sdk/s3-request-presigner", () => ({
  getSignedUrl: jest.fn(),
}));

jest.mock("@aws-sdk/client-s3", () => ({
  S3Client: jest.fn().mockImplementation(() => ({})),
  PutObjectCommand: jest.fn(),
  GetObjectCommand: jest.fn(),
}));

jest.mock("@/utils/supabase/server", () => ({
  createClient: jest.fn(),
}));

import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { createClient } from "@/utils/supabase/server";
import { POST } from "../../app/api/s3/presign/route";
import { GET } from "../../app/api/gallery/route";

const mockGetSignedUrl = getSignedUrl as jest.Mock;
const mockCreateClient = createClient as jest.Mock;

const mockAttachments = [
  {
    id: "att-1",
    response_id: "resp-1",
    question_id: "q-1",
    caption: "Hanging Tree",
    description: "A broken tree hanging above the ground.",
    storage_key: "inspections/site-1/resp-1/q-1/uuid-1.jpg",
    content_type: "image/jpeg",
    file_size_bytes: 123456,
    filename: "hanging-tree.jpg",
    site_id: "site-1",
  },
  {
    id: "att-2",
    response_id: "resp-2",
    question_id: "q-2",
    caption: "Cracked Tree",
    description: "Large crack running up the trunk.",
    storage_key: "inspections/site-2/resp-2/q-2/uuid-2.jpg",
    content_type: "image/jpeg",
    file_size_bytes: 654321,
    filename: "cracked-tree.jpg",
    site_id: "site-2",
  },
];

const mockSites = [
  { id: "site-1", namesite: "Riverlot 56 (NA)" },
  { id: "site-2", namesite: "Cooking Lake" },
];

function mockGalleryFrom(table: string) {
  if (table === "W26_attachments") {
    return {
      select: jest.fn().mockReturnThis(),
      in: jest.fn().mockReturnThis(),
      order: jest.fn().mockResolvedValue({ data: mockAttachments, error: null }),
    };
  }
  if (table === "W26_sites-pa") {
    return {
      select: jest.fn().mockReturnThis(),
      in: jest.fn().mockResolvedValue({ data: mockSites, error: null }),
    };
  }
  return { select: jest.fn().mockReturnThis() };
}

function mockAuthenticatedUser() {
  mockCreateClient.mockResolvedValue({
    auth: {
      getUser: jest.fn().mockResolvedValue({
        data: { user: { id: "user-123", email: "admin@example.com" } },
        error: null,
      }),
    },
    from: mockGalleryFrom,
  });
}

function mockUnauthenticated() {
  mockCreateClient.mockResolvedValue({
    auth: {
      getUser: jest.fn().mockResolvedValue({
        data: { user: null },
        error: { message: "Not authenticated" },
      }),
    },
    from: jest.fn(),
  });
}

function makePresignRequest(body: object) {
  return new Request("http://localhost/api/s3/presign", {
    method: "POST",
    body: JSON.stringify(body),
    headers: { "Content-Type": "application/json" },
  });
}

// ══════════════════════════════════════════════════════════════════════════════
// Acceptance Test 1: Uploaded images are stored in an AWS S3 bucket
// ══════════════════════════════════════════════════════════════════════════════
describe("Acceptance Test 1 – Images are stored in AWS S3", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockAuthenticatedUser();
  });

  it("returns a presigned S3 upload URL for a valid image", async () => {
    const fakeUploadUrl = "https://s3.amazonaws.com/bucket/key?X-Amz-Signature=abc";
    mockGetSignedUrl.mockResolvedValue(fakeUploadUrl);

    const req = makePresignRequest({
      filename: "photo.jpg",
      contentType: "image/jpeg",
      fileSize: 500000,
      responseId: "resp-1",
      questionId: "q-1",
      siteId: "site-1",
    });

    const res = await POST(req as any);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.uploadUrl).toBe(fakeUploadUrl);
    expect(body.key).toMatch(/^inspections\/site-1\/resp-1\/q-1\/.+\.jpg$/);
  });

  it("generates a unique S3 key for each upload", async () => {
    mockGetSignedUrl
      .mockResolvedValueOnce("https://s3.amazonaws.com/url1")
      .mockResolvedValueOnce("https://s3.amazonaws.com/url2");

    const req1 = makePresignRequest({
      filename: "photo1.jpg", contentType: "image/jpeg", fileSize: 100000,
      responseId: "resp-1", questionId: "q-1", siteId: "site-1",
    });
    const req2 = makePresignRequest({
      filename: "photo2.jpg", contentType: "image/jpeg", fileSize: 100000,
      responseId: "resp-1", questionId: "q-1", siteId: "site-1",
    });

    const [res1, res2] = await Promise.all([POST(req1 as any), POST(req2 as any)]);
    const [body1, body2] = await Promise.all([res1.json(), res2.json()]);

    expect(body1.key).not.toBe(body2.key);
  });

  it("rejects unsupported file types (e.g. PDF)", async () => {
    const req = makePresignRequest({
      filename: "document.pdf", contentType: "application/pdf", fileSize: 100000,
      responseId: "resp-1", questionId: "q-1", siteId: "site-1",
    });

    const res = await POST(req as any);
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toMatch(/unsupported file type/i);
  });

  it("rejects files over 10MB", async () => {
    const req = makePresignRequest({
      filename: "huge.jpg", contentType: "image/jpeg", fileSize: 11 * 1024 * 1024,
      responseId: "resp-1", questionId: "q-1", siteId: "site-1",
    });

    const res = await POST(req as any);
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toMatch(/file too large/i);
  });

  it("rejects unauthenticated upload requests", async () => {
    mockUnauthenticated();

    const req = makePresignRequest({
      filename: "photo.jpg", contentType: "image/jpeg", fileSize: 500000,
      responseId: "resp-1", questionId: "q-1", siteId: "site-1",
    });

    const res = await POST(req as any);
    expect(res.status).toBe(401);
  });

  it("accepts all allowed image types (jpeg, png, webp)", async () => {
    mockGetSignedUrl.mockResolvedValue("https://s3.amazonaws.com/signed-url");

    for (const contentType of ["image/jpeg", "image/png", "image/webp"]) {
      const req = makePresignRequest({
        filename: "photo", contentType, fileSize: 100000,
        responseId: "resp-1", questionId: "q-1", siteId: "site-1",
      });
      const res = await POST(req as any);
      expect(res.status).toBe(200);
    }
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// Acceptance Test 2: Image metadata and references are stored in the database
// ══════════════════════════════════════════════════════════════════════════════
describe("Acceptance Test 2 – Image metadata is stored in the database", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockAuthenticatedUser();
  });

  it("S3 key embeds siteId, responseId, and questionId for DB traceability", async () => {
    mockGetSignedUrl.mockResolvedValue("https://s3.amazonaws.com/signed-url");

    const req = makePresignRequest({
      filename: "photo.jpg", contentType: "image/jpeg", fileSize: 500000,
      responseId: "resp-42", questionId: "q-7", siteId: "site-99",
    });

    const res = await POST(req as any);
    const body = await res.json();

    expect(body.key).toContain("site-99");
    expect(body.key).toContain("resp-42");
    expect(body.key).toContain("q-7");
  });

  it("returns 400 when responseId is missing", async () => {
    const req = makePresignRequest({
      filename: "photo.jpg", contentType: "image/jpeg", fileSize: 500000,
      questionId: "q-1", siteId: "site-1",
    });
    const res = await POST(req as any);
    expect(res.status).toBe(400);
    expect((await res.json()).error).toMatch(/missing ids/i);
  });

  it("returns 400 when questionId is missing", async () => {
    const req = makePresignRequest({
      filename: "photo.jpg", contentType: "image/jpeg", fileSize: 500000,
      responseId: "resp-1", siteId: "site-1",
    });
    const res = await POST(req as any);
    expect(res.status).toBe(400);
    expect((await res.json()).error).toMatch(/missing ids/i);
  });

  it("returns 400 when siteId is missing", async () => {
    const req = makePresignRequest({
      filename: "photo.jpg", contentType: "image/jpeg", fileSize: 500000,
      responseId: "resp-1", questionId: "q-1",
    });
    const res = await POST(req as any);
    expect(res.status).toBe(400);
    expect((await res.json()).error).toMatch(/missing ids/i);
  });

  it("gallery returns attachments with DB metadata fields populated", async () => {
    mockGetSignedUrl.mockResolvedValue("https://s3.amazonaws.com/signed-url");

    const res = await GET();
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.items.length).toBeGreaterThan(0);

    const item = body.items[0];
    expect(item).toHaveProperty("id");
    expect(item).toHaveProperty("response_id");
    expect(item).toHaveProperty("question_id");
    expect(item).toHaveProperty("storage_key");
    expect(item).toHaveProperty("content_type");
    expect(item).toHaveProperty("filename");
    expect(item).toHaveProperty("site_id");
  });

  it("gallery links each image to its site name from the database", async () => {
    mockGetSignedUrl.mockResolvedValue("https://s3.amazonaws.com/signed-url");

    const res = await GET();
    const body = await res.json();

    const item1 = body.items.find((i: any) => i.site_id === "site-1");
    const item2 = body.items.find((i: any) => i.site_id === "site-2");

    expect(item1?.site_name).toBe("Riverlot 56 (NA)");
    expect(item2?.site_name).toBe("Cooking Lake");
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// Acceptance Test 3: Uploaded images are accessible through the application
// ══════════════════════════════════════════════════════════════════════════════
describe("Acceptance Test 3 – Uploaded images are accessible through the application", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockAuthenticatedUser();
  });

  it("gallery returns a signed S3 URL for each image", async () => {
    mockGetSignedUrl.mockResolvedValue(
      "https://s3.amazonaws.com/bucket/key?X-Amz-Signature=abc"
    );

    const res = await GET();
    const body = await res.json();

    expect(res.status).toBe(200);
    body.items.forEach((item: any) => {
      expect(item.imageUrl).toBeTruthy();
      expect(item.imageUrl).toContain("s3.amazonaws.com");
    });
  });

  it("gallery only returns items that have a valid signed URL", async () => {
    mockGetSignedUrl
      .mockResolvedValueOnce("https://s3.amazonaws.com/valid-url")
      .mockRejectedValueOnce(new Error("S3 error"));

    const res = await GET();
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.items).toHaveLength(1);
    expect(body.items[0].imageUrl).toBe("https://s3.amazonaws.com/valid-url");
  });

  it("gallery returns 401 for unauthenticated requests", async () => {
    mockUnauthenticated();
    const res = await GET();
    expect(res.status).toBe(401);
  });

  it("gallery returns 500 if the database query fails", async () => {
    mockCreateClient.mockResolvedValue({
      auth: {
        getUser: jest.fn().mockResolvedValue({
          data: { user: { id: "user-123" } },
          error: null,
        }),
      },
      from: (table: string) => {
        if (table === "W26_attachments") {
          return {
            select: jest.fn().mockReturnThis(),
            in: jest.fn().mockReturnThis(),
            order: jest.fn().mockResolvedValue({
              data: null,
              error: { message: "DB connection failed" },
            }),
          };
        }
        return { select: jest.fn().mockReturnThis() };
      },
    });

    const res = await GET();
    expect(res.status).toBe(500);
  });

  it("presigned upload URL expires in 3 minutes", async () => {
    mockGetSignedUrl.mockResolvedValue("https://s3.amazonaws.com/signed-url");

    const req = makePresignRequest({
      filename: "photo.jpg", contentType: "image/jpeg", fileSize: 500000,
      responseId: "resp-1", questionId: "q-1", siteId: "site-1",
    });

    await POST(req as any);

    expect(mockGetSignedUrl).toHaveBeenCalledWith(
      expect.anything(),
      expect.anything(),
      expect.objectContaining({ expiresIn: 180 })
    );
  });

  it("gallery signed URLs are valid for 1 hour", async () => {
    mockGetSignedUrl.mockResolvedValue("https://s3.amazonaws.com/signed-url");

    await GET();

    expect(mockGetSignedUrl).toHaveBeenCalledWith(
      expect.anything(),
      expect.anything(),
      expect.objectContaining({ expiresIn: 3600 })
    );
  });
});