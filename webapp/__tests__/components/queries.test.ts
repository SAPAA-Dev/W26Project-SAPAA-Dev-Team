import * as queries from "../../utils/supabase/queries"; // adjust path
import { createServerSupabase } from "../../utils/supabase/server";

jest.mock("../../utils/supabase/server", () => ({
  createServerSupabase: jest.fn(),
}));

describe("Supabase site functions", () => {
  const mockFrom = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    (createServerSupabase as jest.Mock).mockReturnValue({
      from: mockFrom,
    });
  });

  describe("getSitesOnline", () => {
    it("returns mapped sites on success", async () => {
      const mockData = [
        { namesite: "Alpha", county: "County1", inspectdate: "2025-11-30" },
        { namesite: "Beta", county: null, inspectdate: null },
      ];

      mockFrom.mockReturnValueOnce({
        select: jest.fn().mockReturnThis(),
        order: jest.fn().mockResolvedValue({ data: mockData, error: null }),
      });

      const result = await queries.getSitesOnline();

      expect(result).toEqual([
        { id: 1, namesite: "Alpha", county: "County1", inspectdate: "2025-11-30" },
        { id: 2, namesite: "Beta", county: null, inspectdate: null },
      ]);
    });

    it("throws error if Supabase returns error", async () => {
      mockFrom.mockReturnValueOnce({
        select: jest.fn().mockReturnThis(),
        order: jest.fn().mockResolvedValue({ data: null, error: { message: "Failed" } }),
      });

      await expect(queries.getSitesOnline()).rejects.toThrow("Failed");
    });
  });

  describe("getSiteByName", () => {
    it("returns site filtered by name", async () => {
      const mockData = [{ namesite: "Alpha", county: "County1", inspectdate: "2025-11-30" }];

      mockFrom.mockReturnValueOnce({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue({ data: mockData, error: null }),
      });

      const result = await queries.getSiteByName("Alpha");
      expect(result).toEqual([{ id: 1, namesite: "Alpha", county: "County1", inspectdate: "2025-11-30" }]);
    });

    it("throws error if Supabase fails", async () => {
      mockFrom.mockReturnValueOnce({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue({ data: null, error: { message: "Error" } }),
      });

      await expect(queries.getSiteByName("Alpha")).rejects.toThrow("Error");
    });
  });

  describe("getInspectionDetailsOnline", () => {
    it("returns mapped inspection details", async () => {
      const mockData = [
        {
          namesite: "Alpha",
          _type: "Type1",
          county: "County1",
          _naregion: "Region1",
          inspectdate: "2025-11-30",
          naturalness_score: "High",
          naturalness_details: "Some details",
          notes: "Notes here",
        },
      ];

      mockFrom.mockReturnValueOnce({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        order: jest.fn().mockResolvedValue({ data: mockData, error: null }),
      });

      const result = await queries.getInspectionDetailsOnline("Alpha");

      expect(result).toEqual([
        {
          id: 1,
          namesite: "Alpha",
          _type: "Type1",
          county: "County1",
          _naregion: "Region1",
          inspectdate: "2025-11-30",
          naturalness_score: "High",
          naturalness_details: "Some details",
          notes: "Notes here",
        },
      ]);
    });

    it("throws error if Supabase fails", async () => {
      mockFrom.mockReturnValueOnce({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        order: jest.fn().mockResolvedValue({ data: null, error: { message: "Failed" } }),
      });

      await expect(queries.getInspectionDetailsOnline("Alpha")).rejects.toThrow("Failed");
    });
  });

  describe("getQuestionsOnline", () => {
    it("maps is_required values from the database", async () => {
      const mockData = [
        {
          id: 1,
          subtext: "Required question",
          question_type: "text",
          is_required: true,
          section_id: 6,
          form_question: "Question 1",
          W26_question_options: [{ option_text: "A" }],
          W26_question_keys: { formorder: 1 },
          W26_form_sections: { title: "S1", description: "D1", header: "H1" },
        },
        {
          id: 2,
          subtext: "Optional question",
          question_type: "option",
          is_required: false,
          section_id: 6,
          form_question: "Question 2",
          W26_question_options: [{ option_text: "B" }],
          W26_question_keys: { formorder: 2 },
          W26_form_sections: { title: "S1", description: "D1", header: "H1" },
        },
        {
          id: 3,
          subtext: "Null required flag",
          question_type: "text",
          is_required: null,
          section_id: 7,
          form_question: "Question 3",
          W26_question_options: [{ option_text: "C" }],
          W26_question_keys: { formorder: 3 },
          W26_form_sections: { title: "S2", description: "D2", header: "H2" },
        },
      ];

      const eqSecond = jest.fn().mockResolvedValue({ data: mockData, error: null });
      const eqFirst = jest.fn().mockReturnValue({ eq: eqSecond });
      const select = jest.fn().mockReturnValue({ eq: eqFirst });

      mockFrom.mockReturnValueOnce({ select });

      const result = await queries.getQuestionsOnline();

      expect(eqFirst).toHaveBeenCalledWith("is_active", true);
      expect(eqSecond).toHaveBeenCalledWith("W26_question_options.is_active", true);
      expect(result.map((question) => question.is_required)).toEqual([true, false, null]);
    });

    it("throws error if Supabase fails", async () => {
      const eqSecond = jest.fn().mockResolvedValue({ data: null, error: { message: "Failed questions" } });
      const eqFirst = jest.fn().mockReturnValue({ eq: eqSecond });
      const select = jest.fn().mockReturnValue({ eq: eqFirst });

      mockFrom.mockReturnValueOnce({ select });

      await expect(queries.getQuestionsOnline()).rejects.toThrow("Failed questions");
    });
  });
});
