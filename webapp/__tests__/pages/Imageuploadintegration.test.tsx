import { TextEncoder, TextDecoder } from "util";
import { ReadableStream, TransformStream } from "stream/web";
import { MessageChannel } from "worker_threads";
import { NextRequest } from "next/server";

Object.assign(global, {
  TextEncoder,
  TextDecoder,
  ReadableStream,
  TransformStream,
  MessageChannel,
  MessagePort: MessageChannel.prototype.port1?.constructor || require("worker_threads").MessagePort,
  MessageEvent: class MessageEvent extends Event {
    data: any;
    constructor(type: string, init?: any) {
      super(type);
      this.data = init?.data;
    }
  },
});

import { fetch, Headers, Request, Response, FormData } from "undici";
Object.assign(global, { fetch, Headers, Request, Response, FormData });

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

// --- Mock Data ---
const mockAttachments = [
  { id: "att-1", response_id: "resp-1", question_id: "q-1", caption: "Hanging Tree", description: "A broken tree hanging above the ground.", storage_key: "inspections/site-1/resp-1/q-1/uuid-1.jpg", content_type: "image/jpeg", file_size_bytes: 123456, filename: "hanging-tree.jpg", site_id: "site-1" },
  { id: "att-2", response_id: "resp-2", question_id: "q-2", caption: "Cracked Tree", description: "Large crack running up the trunk.", storage_key: "inspections/site-2/resp-2/q-2/uuid-2.jpg", content_type: "image/jpeg", file_size_bytes: 654321, filename: "cracked-tree.jpg", site_id: "site-2" },
];

const mockSites = [
  { id: "site-1", namesite: "Riverlot 56 (NA)" },
  { id: "site-2", namesite: "Cooking Lake" },
];

function mockGalleryFrom(table: string) {
  if (table === "W26_attachments") {
    return { select: jest.fn().mockReturnThis(), in: jest.fn().mockReturnThis(), order: jest.fn().mockResolvedValue({ data: mockAttachments, error: null }) };
  }
  if (table === "W26_sites-pa") {
    return { select: jest.fn().mockReturnThis(), in: jest.fn().mockResolvedValue({ data: mockSites, error: null }) };
  }
  return { select: jest.fn().mockReturnThis() };
}

function mockAuthenticatedUser() {
  mockCreateClient.mockResolvedValue({ auth: { getUser: jest.fn().mockResolvedValue({ data: { user: { id: "user-123", email: "admin@example.com" } }, error: null }) }, from: mockGalleryFrom });
}

function mockUnauthenticated() {
  mockCreateClient.mockResolvedValue({ auth: { getUser: jest.fn().mockResolvedValue({ data: { user: null }, error: { message: "Not authenticated" } }) }, from: jest.fn() });
}

function makePresignRequest(body: object) {
  return new NextRequest("http://localhost/api/s3/presign", {
    method: "POST",
    body: JSON.stringify(body),
    headers: { "Content-Type": "application/json" },
  });
}

// --- Acceptance Test 1 ---
describe("Acceptance Test 1 – Images are stored in AWS S3", () => {
  beforeEach(() => { jest.clearAllMocks(); mockAuthenticatedUser(); });

  it("returns a presigned S3 upload URL for a valid image", async () => {
    const fakeUploadUrl = "https://s3.amazonaws.com/bucket/key?X-Amz-Signature=abc";
    mockGetSignedUrl.mockResolvedValue(fakeUploadUrl);

    const req = makePresignRequest({ filename: "photo.jpg", contentType: "image/jpeg", fileSize: 500000, responseId: "resp-1", questionId: "q-1", siteId: "site-1" });

    const res = await POST(req as any);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.uploadUrl).toBe(fakeUploadUrl);
    expect(body.key).toMatch(/^inspections\/site-1\/resp-1\/q-1\/.+\.jpg$/);
  });

  it("rejects unsupported file types", async () => {
    const req = makePresignRequest({ filename: "doc.pdf", contentType: "application/pdf", fileSize: 1000, responseId: "resp-1", questionId: "q-1", siteId: "site-1" });
    const res = await POST(req as any);
    expect(res.status).toBe(400);
  });

  it("rejects files over 10MB", async () => {
    const req = makePresignRequest({ filename: "huge.jpg", contentType: "image/jpeg", fileSize: 11*1024*1024, responseId: "resp-1", questionId: "q-1", siteId: "site-1" });
    const res = await POST(req as any);
    expect(res.status).toBe(400);
  });
});

// --- Acceptance Test 2 ---
describe("Acceptance Test 2 – Image metadata stored in DB", () => {
  beforeEach(() => { jest.clearAllMocks(); mockAuthenticatedUser(); });

  it("S3 key embeds siteId, responseId, and questionId", async () => {
    mockGetSignedUrl.mockResolvedValue("https://s3.amazonaws.com/signed-url");
    const req = makePresignRequest({ filename: "photo.jpg", contentType: "image/jpeg", fileSize: 500000, responseId: "resp-42", questionId: "q-7", siteId: "site-99" });
    const res = await POST(req as any);
    const body = await res.json();
    expect(body.key).toContain("site-99");
    expect(body.key).toContain("resp-42");
    expect(body.key).toContain("q-7");
  });
});

// --- Acceptance Test 3 ---
describe("Acceptance Test 3 – Images accessible in app", () => {
  beforeEach(() => { jest.clearAllMocks(); mockAuthenticatedUser(); });

  it("gallery returns a signed S3 URL for each image", async () => {
    mockGetSignedUrl.mockResolvedValue("https://s3.amazonaws.com/bucket/key?X-Amz-Signature=abc");
    const res = await GET();
    const body = await res.json();
    body.items.forEach((item: any) => expect(item.imageUrl).toContain("s3.amazonaws.com"));
  });
});