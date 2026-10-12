import { isAllowedStorageKey } from "@/utils/media/storageKeys";

const USER = "11111111-1111-4111-8111-111111111111";

describe("isAllowedStorageKey", () => {
  it.each([
    "inspections/207/3226/27/Riverlot56-2026-03-21-Ann-A1-uuid.jpg",
    `homepage-image-uploads/207/${USER}/Riverlot56-2026-03-21-Ann-A1-uuid.webp`,
    "seed/ducks/duck01.jpg",
  ])("accepts %s", (key) => {
    expect(isAllowedStorageKey(key)).toBe(true);
  });

  it.each([
    ["a PDF export", "pdf-exports/user-1/job-1/report.pdf"],
    ["an empty key", ""],
    ["a key that is not a string", 42],
    ["a missing folder", "inspections/207/3226/file.jpg"],
    ["an extra folder", "inspections/207/3226/27/x/file.jpg"],
    ["a text id", "inspections/abc/3226/27/file.jpg"],
    ["a zero id", "inspections/0/3226/27/file.jpg"],
    ["a parent folder name", "inspections/207/3226/27/.."],
    ["a space in the name", "inspections/207/3226/27/my file.jpg"],
    ["a homepage key with no user id", "homepage-image-uploads/207/user-1/file.jpg"],
    ["a prototype name as the prefix", "constructor/a/b"],
  ])("refuses %s", (_label, key) => {
    expect(isAllowedStorageKey(key)).toBe(false);
  });

  it("checks the leading parts against the expected ids", () => {
    const key = "inspections/207/3226/27/file.jpg";
    expect(isAllowedStorageKey(key, "inspections", 207, 3226, 27)).toBe(true);
    expect(isAllowedStorageKey(key, "inspections", 207, 9999, 27)).toBe(false);
    expect(isAllowedStorageKey(`homepage-image-uploads/207/${USER}/f.jpg`, "homepage-image-uploads", 207, USER)).toBe(true);
    expect(isAllowedStorageKey(`homepage-image-uploads/207/${USER}/f.jpg`, "homepage-image-uploads", 207, "other")).toBe(false);
  });
});
