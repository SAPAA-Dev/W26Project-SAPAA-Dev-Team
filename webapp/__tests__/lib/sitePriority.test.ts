import {
  arePriorityPointsStale,
  computeVisitPriority,
  parsePriorityScores,
} from "../../lib/sitePriority";

describe("computeVisitPriority (2.0.12 AT2, AT3)", () => {
  it("adds the three scores", () => {
    expect(computeVisitPriority({ abuses: 2, biological: 3, time: 5 })).toBe(10);
  });

  it("gives the same priority for the same scores, whatever the order they were typed in", () => {
    expect(computeVisitPriority({ abuses: 1, biological: 4, time: 2 }))
      .toBe(computeVisitPriority({ time: 2, abuses: 1, biological: 4 }));
  });
});

describe("parsePriorityScores (2.0.12 AT1)", () => {
  it("accepts whole numbers from 0 to 5", () => {
    expect(parsePriorityScores({ abuses: 0, biological: 5, time: 3 })).toEqual({ abuses: 0, biological: 5, time: 3 });
  });

  it.each([
    ["a score above 5", { abuses: 6, biological: 1, time: 1 }],
    ["a negative score", { abuses: -1, biological: 1, time: 1 }],
    ["a fraction", { abuses: 1.5, biological: 1, time: 1 }],
    ["a string", { abuses: "3", biological: 1, time: 1 }],
    ["a missing score", { abuses: 1, biological: 1 }],
    ["null", null],
  ])("refuses %s", (_name, input) => {
    expect(parsePriorityScores(input)).toBeNull();
  });
});

describe("arePriorityPointsStale (2.0.13 AT1, AT2)", () => {
  const now = new Date("2026-10-24T12:00:00Z");

  it("is true when the points were saved more than one year ago", () => {
    expect(arePriorityPointsStale("2025-10-23T11:59:59Z", now)).toBe(true);
  });

  it("is false when the points were saved less than one year ago", () => {
    expect(arePriorityPointsStale("2025-10-25T00:00:00Z", now)).toBe(false);
  });

  it("is false for a site that has no scores", () => {
    expect(arePriorityPointsStale(null, now)).toBe(false);
  });
});
