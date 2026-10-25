import { collectTagOptions, matchExistingTag, suggestSimilarTags } from "../../lib/profileTags";

describe("collectTagOptions (1.0.6 AT1)", () => {
  it("lists each value once, sorted", () => {
    expect(collectTagOptions([["Mosses", "Bird ID"], ["Bird ID"], null])).toEqual(["Bird ID", "Mosses"]);
  });

  it("merges spellings that differ only by case and keeps the most used one", () => {
    expect(collectTagOptions([["bird id"], ["Bird ID"], ["Bird ID"]])).toEqual(["Bird ID"]);
  });

  it("drops blank values", () => {
    expect(collectTagOptions([["  ", "Wetlands "]])).toEqual(["Wetlands"]);
  });
});

describe("suggestSimilarTags (1.0.6 AT2)", () => {
  const options = ["Bird ID", "Wetlands", "Grasslands", "Mosses"];

  it("suggests values that contain the typed text", () => {
    expect(suggestSimilarTags(options, "land")).toEqual(["Wetlands", "Grasslands"]);
  });

  it("suggests a value for a typo", () => {
    expect(suggestSimilarTags(options, "Wetlnds")).toEqual(["Wetlands"]);
  });

  it("ignores case", () => {
    expect(suggestSimilarTags(options, "bird")).toEqual(["Bird ID"]);
  });

  it("suggests nothing for empty text or for text that matches no value", () => {
    expect(suggestSimilarTags(options, "  ")).toEqual([]);
    expect(suggestSimilarTags(options, "Photography")).toEqual([]);
  });

  it("returns at most the limit", () => {
    expect(suggestSimilarTags(["aa1", "aa2", "aa3"], "aa", 2)).toHaveLength(2);
  });
});

describe("matchExistingTag", () => {
  it("uses the existing spelling for a value that differs only by case", () => {
    expect(matchExistingTag(["Bird ID"], " bird id ")).toBe("Bird ID");
  });

  it("keeps a new value as typed, trimmed", () => {
    expect(matchExistingTag(["Bird ID"], " Lichens ")).toBe("Lichens");
  });
});
