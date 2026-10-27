/** @jest-environment node */
import { unzipSync, strFromU8 } from "fflate";

const mockSend = jest.fn();
jest.mock("@aws-sdk/client-s3", () => ({
  S3Client: jest.fn(() => ({ send: mockSend })),
  GetObjectCommand: jest.fn((input) => ({ type: "get", input })),
  HeadObjectCommand: jest.fn((input) => ({ type: "head", input })),
  PutObjectCommand: jest.fn((input) => ({ type: "put", input })),
}));
jest.mock("../../utils/supabase/server", () => ({ createServerSupabase: jest.fn() }));
jest.mock("../../lib/s3/client", () => ({ s3Client: { send: (...args: unknown[]) => mockSend(...args) } }));

import {
  buildExportZip,
  collectExportEntries,
  MAX_EXPORT_BYTES,
  processExportJob,
  zipPathFor,
} from "../../lib/export/processExportJob";
import { createServerSupabase } from "../../utils/supabase/server";

// A query builder: every method returns the builder, and awaiting it gives the rows of one page.
function tableBuilder(pages: unknown[][], error: unknown = null) {
  let page = 0;
  const b: Record<string, jest.Mock> & { then?: unknown } = {};
  for (const m of ["select", "order", "eq", "not"]) b[m] = jest.fn(() => b);
  b.range = jest.fn(() => ({
    then: (resolve: (v: unknown) => unknown) => Promise.resolve({ data: pages[page++] ?? [], error }).then(resolve),
  }));
  return b;
}

function jobTable(created_by = "admin-uuid", updateErrors: Array<{ message: string } | null> = []) {
  const update = jest.fn(() => ({ eq: jest.fn(() => Promise.resolve({ error: updateErrors.shift() ?? null })) }));
  const b: Record<string, jest.Mock> = {};
  b.select = jest.fn(() => b);
  b.eq = jest.fn(() => b);
  b.single = jest.fn(async () => ({ data: { created_by }, error: null }));
  b.update = update;
  return { builder: b, update };
}

const bytes = (text: string) => new TextEncoder().encode(text);

function s3NotFound(): Error {
  return Object.assign(new Error("The specified key does not exist."), {
    name: "NoSuchKey",
    $metadata: { httpStatusCode: 404 },
  });
}

describe("zipPathFor", () => {
  it("puts the key under its folder", () => {
    expect(zipPathFor("images/inspections", "inspections/5/9/photo.jpg")).toBe("images/inspections/inspections/5/9/photo.jpg");
  });

  it("drops empty, dot and dot-dot segments so a key cannot leave its folder", () => {
    expect(zipPathFor("pdfs", "/../a//./b.pdf")).toBe("pdfs/a/b.pdf");
  });

  it("treats a backslash as a separator, so a Windows path cannot leave its folder", () => {
    expect(zipPathFor("gpx", "x\\..\\..\\start.gpx")).toBe("gpx/x/start.gpx");
    expect(zipPathFor("gpx", "..\\..\\start.gpx")).toBe("gpx/start.gpx");
  });

  it("drops segments of only dots, however many", () => {
    expect(zipPathFor("gpx", "a/.../....../b.gpx")).toBe("gpx/a/b.gpx");
  });

  it("replaces characters outside A-Z, a-z, 0-9, dot, underscore and hyphen", () => {
    expect(zipPathFor("images/inspections", "u/photo 1:?*<>|\"é.jpg")).toBe("images/inspections/u/photo_1________.jpg");
  });

  it("never gives a path with a backslash or a leading slash", () => {
    const path = zipPathFor("pdfs", "C:\\Windows\\..\\evil.pdf");
    expect(path).not.toContain("\\");
    expect(path.startsWith("pdfs/")).toBe(true);
    expect(path.split("/")).not.toContain("..");
  });
});

describe("collectExportEntries (3.0.3 AT2)", () => {
  it("lists images, GPX files and finished PDFs, once each", async () => {
    const tables: Record<string, ReturnType<typeof tableBuilder>> = {
      attachments: tableBuilder([[{ storage_key: "a/1.jpg" }, { storage_key: "a/1.jpg" }]]),
      homepage_image_uploads: tableBuilder([[{ storage_key: "h/2.jpg" }]]),
      gpx_tracks: tableBuilder([[{ storage_path: "u/t/walk.gpx" }]]),
      S26_pdf_jobs: tableBuilder([[{ storage_path: "pdf-exports/u/j/r.pdf" }]]),
    };
    const supabase = { from: (table: string) => tables[table] };

    const entries = await collectExportEntries(supabase as never);

    expect(entries.map((entry) => entry.zipPath).sort()).toEqual([
      "gpx/u/t/walk.gpx",
      "images/homepage/h/2.jpg",
      "images/inspections/a/1.jpg",
      "pdfs/pdf-exports/u/j/r.pdf",
    ]);
    expect(tables.S26_pdf_jobs.eq).toHaveBeenCalledWith("status", "complete");
  });

  it("reads a table past the 1000 row limit of one request", async () => {
    const firstPage = Array.from({ length: 1000 }, (_, index) => ({ storage_key: `k/${index}.jpg` }));
    const attachments = tableBuilder([firstPage, [{ storage_key: "k/last.jpg" }]]);
    const empty = () => tableBuilder([[]]);
    const supabase = { from: (table: string) => (table === "attachments" ? attachments : empty()) };

    const entries = await collectExportEntries(supabase as never);

    expect(entries).toHaveLength(1001);
    expect(attachments.range).toHaveBeenNthCalledWith(2, 1000, 1999);
  });

  it("keeps both files when two keys give the same name after the clean-up", async () => {
    const tables: Record<string, ReturnType<typeof tableBuilder>> = {
      attachments: tableBuilder([[{ storage_key: "a b/1.jpg" }, { storage_key: "a_b/1.jpg" }, { storage_key: "a:b/1.jpg" }]]),
      homepage_image_uploads: tableBuilder([[]]),
      gpx_tracks: tableBuilder([[]]),
      S26_pdf_jobs: tableBuilder([[]]),
    };

    const entries = await collectExportEntries({ from: (table: string) => tables[table] } as never);

    expect(entries.map((entry) => entry.zipPath)).toEqual([
      "images/inspections/a_b/1.jpg",
      "images/inspections/a_b/1_2.jpg",
      "images/inspections/a_b/1_3.jpg",
    ]);
    expect(entries.map((entry) => entry.key)).toEqual(["a b/1.jpg", "a_b/1.jpg", "a:b/1.jpg"]);
  });

  it("fails when a table cannot be read", async () => {
    const supabase = { from: () => tableBuilder([[]], { message: "timeout" }) };
    await expect(collectExportEntries(supabase as never)).rejects.toThrow("Could not read");
  });
});

describe("buildExportZip (3.0.3 AT1, AT2)", () => {
  const s3 = { send: mockSend } as never;
  beforeEach(() => mockSend.mockReset());

  it("puts every S3 and GPX file in one zip with its content", async () => {
    mockSend.mockImplementation(async (command) => command.type === "head"
      ? { ContentLength: bytes(`s3:${command.input.Key}`).length }
      : { Body: { transformToByteArray: async () => bytes(`s3:${command.input.Key}`) } });
    const supabase = { storage: { from: jest.fn(() => ({ download: jest.fn(async () => ({ data: new Blob(["<gpx/>"]), error: null })) })) } };

    const { zip, missing } = await buildExportZip([
      { source: "s3", key: "a/1.jpg", zipPath: "images/inspections/a/1.jpg" },
      { source: "gpx", key: "u/t/walk.gpx", zipPath: "gpx/u/t/walk.gpx" },
    ], supabase as never, s3);

    expect(missing).toEqual([]);
    const files = unzipSync(zip);
    expect(Object.keys(files).sort()).toEqual(["gpx/u/t/walk.gpx", "images/inspections/a/1.jpg"]);
    expect(strFromU8(files["images/inspections/a/1.jpg"])).toBe("s3:a/1.jpg");
    expect(strFromU8(files["gpx/u/t/walk.gpx"])).toBe("<gpx/>");
  });

  it("makes a valid empty zip when no file is stored", async () => {
    const { zip, missing } = await buildExportZip([], {} as never, s3);
    expect(Object.keys(unzipSync(zip))).toEqual([]);
    expect(missing).toEqual([]);
  });

  it("skips a missing file among several and lists it in MISSING.txt", async () => {
    mockSend.mockImplementation(async (command) => command.type === "head"
      ? (command.input.Key === "a/missing.jpg" ? Promise.reject(s3NotFound()) : { ContentLength: 4 })
      : { Body: { transformToByteArray: async () => bytes("data") } });

    const { zip, missing } = await buildExportZip([
      { source: "s3", key: "a/1.jpg", zipPath: "images/inspections/a/1.jpg" },
      { source: "s3", key: "a/missing.jpg", zipPath: "images/inspections/a/missing.jpg" },
      { source: "s3", key: "a/2.jpg", zipPath: "images/inspections/a/2.jpg" },
    ], {} as never, s3);

    expect(missing).toEqual(["images/inspections/a/missing.jpg"]);
    const files = unzipSync(zip);
    expect(Object.keys(files).sort()).toEqual(["MISSING.txt", "images/inspections/a/1.jpg", "images/inspections/a/2.jpg"]);
    expect(strFromU8(files["MISSING.txt"])).toBe("images/inspections/a/missing.jpg\n");
  });

  it("lists every missing file in MISSING.txt", async () => {
    mockSend.mockRejectedValue(s3NotFound());
    const entries = Array.from({ length: 12 }, (_, index) => ({ source: "s3" as const, key: `k${index}`, zipPath: `images/k${index}` }));

    const { missing } = await buildExportZip(entries, {} as never, s3);

    expect(missing).toEqual(entries.map((entry) => entry.zipPath));
  });

  it("fails when S3 answers with an error other than not found", async () => {
    mockSend.mockRejectedValue(new Error("Please reduce your request rate"));

    await expect(buildExportZip([
      { source: "s3", key: "a/1.jpg", zipPath: "images/inspections/a/1.jpg" },
    ], {} as never, s3)).rejects.toThrow("Please reduce your request rate");
  });

  it("fails when the bucket does not exist, instead of reporting every file as missing", async () => {
    mockSend.mockRejectedValue(Object.assign(new Error("The specified bucket does not exist."), {
      name: "NoSuchBucket",
      $metadata: { httpStatusCode: 404 },
    }));

    await expect(buildExportZip([
      { source: "s3", key: "a/1.jpg", zipPath: "images/inspections/a/1.jpg" },
    ], {} as never, s3)).rejects.toThrow("The specified bucket does not exist");
  });

  it("skips a GPX object that is not in storage and lists it in MISSING.txt", async () => {
    const supabase = { storage: { from: jest.fn(() => ({ download: jest.fn(async () => ({ data: null, error: new Error("Object not found") })) })) } };

    const { zip, missing } = await buildExportZip([
      { source: "gpx", key: "u/t/gone.gpx", zipPath: "gpx/u/t/gone.gpx" },
    ], supabase as never, s3);

    expect(missing).toEqual(["gpx/u/t/gone.gpx"]);
    expect(strFromU8(unzipSync(zip)["MISSING.txt"])).toBe("gpx/u/t/gone.gpx\n");
  });

  it("fails when Supabase storage answers with an error other than not found", async () => {
    const supabase = { storage: { from: jest.fn(() => ({ download: jest.fn(async () => ({ data: null, error: new Error("Internal storage error") })) })) } };

    await expect(buildExportZip([
      { source: "gpx", key: "u/t/walk.gpx", zipPath: "gpx/u/t/walk.gpx" },
    ], supabase as never, s3)).rejects.toThrow("Internal storage error");
  });

  it("fails with a clear message when the files are larger than the cap, before the download", async () => {
    mockSend.mockImplementation(async (command) => command.type === "head"
      ? { ContentLength: MAX_EXPORT_BYTES + 1 }
      : { Body: { transformToByteArray: async () => { throw new Error("the file must not be downloaded"); } } });

    await expect(buildExportZip([
      { source: "s3", key: "big.bin", zipPath: "images/big.bin" },
    ], {} as never, s3)).rejects.toThrow("larger than 500 MB");
    expect(mockSend.mock.calls.some(([command]) => command.type === "get")).toBe(false);
  });
});

describe("processExportJob", () => {
  beforeEach(() => {
    mockSend.mockReset();
    jest.spyOn(console, "error").mockImplementation(() => undefined);
  });

  function supabaseFor(job: ReturnType<typeof jobTable>, rowsByTable: Record<string, unknown[]> = {}) {
    return {
      from: (table: string) => (table === "export_jobs" ? job.builder : tableBuilder([rowsByTable[table] ?? []])),
      storage: { from: jest.fn() },
    };
  }

  it("uploads the zip and records it as complete", async () => {
    const job = jobTable();
    (createServerSupabase as jest.Mock).mockReturnValue(supabaseFor(job, { attachments: [{ storage_key: "a/1.jpg" }] }));
    mockSend.mockImplementation(async (command) => command.type === "head"
      ? { ContentLength: 3 }
      : command.type === "get"
        ? { Body: { transformToByteArray: async () => bytes("img") } }
        : {});

    await processExportJob("job-1");

    const put = mockSend.mock.calls.map(([command]) => command).find((command) => command.type === "put");
    expect(put.input.Key).toMatch(/^exports\/admin-uuid\/job-1\/SAPAA_All_Files_\d{4}-\d{2}-\d{2}\.zip$/);
    expect(put.input.ContentType).toBe("application/zip");
    expect(Object.keys(unzipSync(put.input.Body))).toEqual(["images/inspections/a/1.jpg"]);
    expect(job.update).toHaveBeenLastCalledWith(expect.objectContaining({
      status: "complete", storage_path: put.input.Key, file_count: 1, missing_count: 0,
    }));
  });

  it("skips a missing file, puts it in MISSING.txt and records the count", async () => {
    const job = jobTable();
    (createServerSupabase as jest.Mock).mockReturnValue(supabaseFor(job, { attachments: [{ storage_key: "a/1.jpg" }, { storage_key: "a/gone.jpg" }] }));
    mockSend.mockImplementation(async (command) => command.type === "head"
      ? (command.input.Key === "a/gone.jpg" ? Promise.reject(s3NotFound()) : { ContentLength: 3 })
      : command.type === "get"
        ? { Body: { transformToByteArray: async () => bytes("img") } }
        : {});

    await processExportJob("job-1");

    const put = mockSend.mock.calls.map(([command]) => command).find((command) => command.type === "put");
    const files = unzipSync(put.input.Body);
    expect(Object.keys(files).sort()).toEqual(["MISSING.txt", "images/inspections/a/1.jpg"]);
    expect(strFromU8(files["MISSING.txt"])).toBe("images/inspections/a/gone.jpg\n");
    expect(job.update).toHaveBeenLastCalledWith(expect.objectContaining({
      status: "complete", storage_path: put.input.Key, file_count: 2, missing_count: 1,
    }));
  });

  it("records failure, not missing files, when S3 answers with an error other than not found", async () => {
    const job = jobTable();
    (createServerSupabase as jest.Mock).mockReturnValue(supabaseFor(job, { attachments: [{ storage_key: "a/1.jpg" }] }));
    mockSend.mockRejectedValue(new Error("Please reduce your request rate"));

    await processExportJob("job-1");

    expect(mockSend.mock.calls.some(([command]) => command.type === "put")).toBe(false);
    expect(job.update).toHaveBeenLastCalledWith(expect.objectContaining({
      status: "failed", error: "The export failed. Try again.",
    }));
  });

  it("keeps an unexpected error out of the stored message", async () => {
    const job = jobTable();
    (createServerSupabase as jest.Mock).mockReturnValue({
      from: (table: string) => (table === "export_jobs" ? job.builder : tableBuilder([[]], { message: "relation public.attachments does not exist" })),
    });

    await processExportJob("job-1");

    expect(job.update).toHaveBeenLastCalledWith(expect.objectContaining({ status: "failed", error: "The export failed. Try again." }));
  });

  it("records failure and does not upload when the processing update fails", async () => {
    const job = jobTable("admin-uuid", [{ message: "database unavailable" }]);
    (createServerSupabase as jest.Mock).mockReturnValue(supabaseFor(job));

    await processExportJob("job-1");

    expect(mockSend).not.toHaveBeenCalled();
    expect(job.update).toHaveBeenLastCalledWith(expect.objectContaining({ status: "failed" }));
  });

  it("records failure when the ZIP uploads but the completion update fails", async () => {
    const job = jobTable("admin-uuid", [null, { message: "private database error" }]);
    (createServerSupabase as jest.Mock).mockReturnValue(supabaseFor(job));
    mockSend.mockResolvedValue({});

    await processExportJob("job-1");

    expect(job.update).toHaveBeenLastCalledWith(expect.objectContaining({
      status: "failed", error: "The export failed. Try again.",
    }));
  });

  it("rejects when the failure state cannot be saved", async () => {
    const failure = { message: "failure state could not be saved" };
    const job = jobTable("admin-uuid", [null, { message: "completion update failed" }, failure]);
    (createServerSupabase as jest.Mock).mockReturnValue(supabaseFor(job, { attachments: [{ storage_key: "a.jpg" }] }));
    mockSend.mockImplementation(async (command) => command.type === "head"
      ? { ContentLength: 1 }
      : command.type === "get"
        ? { Body: { transformToByteArray: async () => bytes("a") } }
        : {});

    await expect(processExportJob("job-1")).rejects.toEqual(failure);
  });
});
