import { getSitePriority, saveSitePriorityScores } from "../../utils/site-priority-actions";
import { createClient, createServerSupabase } from "../../utils/supabase/server";

jest.mock("../../utils/supabase/server", () => ({
  createClient: jest.fn(),
  createServerSupabase: jest.fn(),
}));

// A chainable query builder whose final await resolves to `result`.
function builder(result: unknown) {
  const b: Record<string, jest.Mock> & { then?: unknown } = {};
  for (const m of ["select", "update", "eq", "maybeSingle", "overrideTypes"]) {
    b[m] = jest.fn(() => b);
  }
  b.then = (resolve: (v: unknown) => unknown) => Promise.resolve(result).then(resolve);
  return b;
}

const SCORED_ROW = {
  priority_abuses: 2,
  priority_biological: 3,
  priority_time: 4,
  priority_saved_at: new Date().toISOString(),
};

describe("site-priority-actions", () => {
  let userFrom: jest.Mock;
  let serviceFrom: jest.Mock;

  function setup(role: string | null, approved = true) {
    userFrom = jest.fn();
    serviceFrom = jest.fn();
    const user = role === null ? null : { id: "user-uuid", app_metadata: { role, authenticated: approved } };
    (createClient as jest.Mock).mockResolvedValue({
      auth: { getUser: jest.fn().mockResolvedValue({ data: { user }, error: null }) },
      from: userFrom,
    });
    (createServerSupabase as jest.Mock).mockReturnValue({ from: serviceFrom });
  }

  beforeEach(() => jest.clearAllMocks());

  describe("saveSitePriorityScores", () => {
    it("saves the three scores, the date and the admin, and returns the priority (2.0.12 AT1, AT2)", async () => {
      setup("admin");
      const write = builder({ data: SCORED_ROW, error: null });
      serviceFrom.mockReturnValue(write);

      const result = await saveSitePriorityScores(7, { abuses: 2, biological: 3, time: 4 });

      expect(result).toMatchObject({ success: true, priority: { priority: 9, needsReassessment: false } });
      expect(write.update).toHaveBeenCalledWith(expect.objectContaining({
        priority_abuses: 2,
        priority_biological: 3,
        priority_time: 4,
        priority_saved_by: "user-uuid",
        priority_saved_at: expect.any(String),
      }));
      expect(write.eq).toHaveBeenCalledWith("id", 7);
    });

    it("refuses a steward and writes nothing (2.0.12 AT5)", async () => {
      setup("steward");

      const result = await saveSitePriorityScores(7, { abuses: 1, biological: 1, time: 1 });

      expect(result).toEqual({ success: false, error: "Only an Admin can change the scores." });
      expect(serviceFrom).not.toHaveBeenCalled();
    });

    it.each([
      ["no session", null, true],
      ["an unapproved admin", "admin", false],
    ])("refuses %s", async (_name, role, approved) => {
      setup(role as string | null, approved as boolean);
      const result = await saveSitePriorityScores(7, { abuses: 1, biological: 1, time: 1 });
      expect(result.success).toBe(false);
      expect(serviceFrom).not.toHaveBeenCalled();
    });

    it.each([
      ["a score above 5", { abuses: 6, biological: 1, time: 1 }],
      ["a fraction", { abuses: 1.5, biological: 1, time: 1 }],
      ["a missing score", { abuses: 1, biological: 1 }],
    ])("refuses %s and writes nothing", async (_name, scores) => {
      setup("admin");
      const result = await saveSitePriorityScores(7, scores);
      expect(result).toEqual({ success: false, error: "Each score must be a whole number from 0 to 5." });
      expect(serviceFrom).not.toHaveBeenCalled();
    });

    it("refuses an invalid site id", async () => {
      setup("admin");
      const result = await saveSitePriorityScores(0, { abuses: 1, biological: 1, time: 1 });
      expect(result).toEqual({ success: false, error: "Invalid site." });
    });

    it("keeps the database error out of the message", async () => {
      setup("admin");
      jest.spyOn(console, "error").mockImplementation(() => undefined);
      serviceFrom.mockReturnValue(builder({ data: null, error: { message: "violates constraint sites_pa_priority_scores_valid" } }));

      const result = await saveSitePriorityScores(7, { abuses: 1, biological: 1, time: 1 });

      expect(result).toEqual({ success: false, error: "The scores were not saved. Try again." });
    });
  });

  describe("getSitePriority", () => {
    it("returns the priority and the three scores to a steward, without the reminder (2.0.12 AT4, 2.0.13 AT4)", async () => {
      setup("steward");
      const old = { ...SCORED_ROW, priority_saved_at: "2020-01-01T00:00:00Z" };
      userFrom.mockReturnValue(builder({ data: old, error: null }));

      const result = await getSitePriority(7);

      expect(result).toEqual({
        scores: { abuses: 2, biological: 3, time: 4 },
        priority: 9,
        savedAt: "2020-01-01T00:00:00Z",
        needsReassessment: false,
      });
    });

    it("tells an admin to reassess points saved more than a year ago (2.0.13 AT1)", async () => {
      setup("admin");
      userFrom.mockReturnValue(builder({ data: { ...SCORED_ROW, priority_saved_at: "2020-01-01T00:00:00Z" }, error: null }));
      expect((await getSitePriority(7))?.needsReassessment).toBe(true);
    });

    it("gives an admin no reminder for points saved this year (2.0.13 AT2)", async () => {
      setup("admin");
      userFrom.mockReturnValue(builder({ data: SCORED_ROW, error: null }));
      expect((await getSitePriority(7))?.needsReassessment).toBe(false);
    });

    it("gives two sites with the same scores the same priority (2.0.12 AT3)", async () => {
      setup("steward");
      userFrom.mockReturnValue(builder({ data: SCORED_ROW, error: null }));
      const first = await getSitePriority(1);
      const second = await getSitePriority(2);
      expect(first?.priority).toBe(second?.priority);
    });

    it("returns no scores and no priority for a site that was never scored", async () => {
      setup("admin");
      const empty = { priority_abuses: null, priority_biological: null, priority_time: null, priority_saved_at: null };
      userFrom.mockReturnValue(builder({ data: empty, error: null }));
      expect(await getSitePriority(7)).toEqual({ scores: null, priority: null, savedAt: null, needsReassessment: false });
    });

    it("returns null with no valid session", async () => {
      setup(null);
      expect(await getSitePriority(7)).toBeNull();
      expect(userFrom).not.toHaveBeenCalled();
    });
  });
});
