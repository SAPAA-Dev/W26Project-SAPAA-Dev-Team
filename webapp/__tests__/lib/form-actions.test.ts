import {
  saveQuestion,
  toggleQuestionActive,
  addQuestion,
  reorderQuestions,
  fetchFormSections,
  fetchFormQuestions,
  getMaxFormOrder,
  FormQuestion,
} from "../../utils/form-actions";
import { createClient, createServerSupabase } from "../../utils/supabase/server";

jest.mock("../../utils/supabase/server", () => ({
  createClient: jest.fn(),
  createServerSupabase: jest.fn(),
}));

function mockCaller(role: string | null, approved = true) {
  const user = role === null ? null : { id: "admin-uuid", app_metadata: { role, authenticated: approved } };
  (createClient as jest.Mock).mockResolvedValue({
    auth: { getUser: jest.fn().mockResolvedValue({ data: { user }, error: null }) },
  });
}

const sampleQuestion: FormQuestion = {
  id: 1,
  form_question: "Sample (Q1)",
  subtext: null,
  question_type: "text",
  is_required: false,
  is_active: true,
  section_id: 1,
  autofill_key: null,
  question_key_id: null,
  formorder: null,
  options: [],
};

describe("form-actions authorization", () => {
  let serviceFrom: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    serviceFrom = jest.fn();
    (createServerSupabase as jest.Mock).mockReturnValue({ from: serviceFrom });
  });

  it.each([
    ["saveQuestion", () => saveQuestion(sampleQuestion)],
    ["toggleQuestionActive", () => toggleQuestionActive(1, true)],
    ["addQuestion", () => addQuestion(1, { form_question: "Q", subtext: "", question_type: "text", is_required: false, options: [], question_key: "Q1" })],
    ["reorderQuestions", () => reorderQuestions([{ questionId: 1, questionName: "Q", newOrder: 1 }])],
  ])("%s rejects a steward and writes nothing", async (_name, call) => {
    mockCaller("steward");

    await expect(call()).rejects.toThrow("Only admins can edit the form.");
    expect(serviceFrom).not.toHaveBeenCalled();
  });

  it.each([
    ["saveQuestion", () => saveQuestion(sampleQuestion)],
    ["toggleQuestionActive", () => toggleQuestionActive(1, true)],
    ["addQuestion", () => addQuestion(1, { form_question: "Q", subtext: "", question_type: "text", is_required: false, options: [], question_key: "Q1" })],
    ["reorderQuestions", () => reorderQuestions([{ questionId: 1, questionName: "Q", newOrder: 1 }])],
  ])("%s rejects an admin whose approval was revoked", async (_name, call) => {
    mockCaller("admin", false);

    await expect(call()).rejects.toThrow("Only admins can edit the form.");
    expect(serviceFrom).not.toHaveBeenCalled();
  });

  it("rejects a signed-out caller", async () => {
    mockCaller(null);

    await expect(toggleQuestionActive(1, true)).rejects.toThrow("Only admins can edit the form.");
    expect(serviceFrom).not.toHaveBeenCalled();
  });

  it("lets an approved admin through", async () => {
    mockCaller("admin");
    const mockEq = jest.fn().mockResolvedValue({ error: null });
    serviceFrom.mockReturnValue({ update: jest.fn().mockReturnValue({ eq: mockEq }) });

    await expect(toggleQuestionActive(1, true)).resolves.toBeUndefined();
    expect(serviceFrom).toHaveBeenCalledWith("questions");
  });

  it.each([
    ["fetchFormSections", () => fetchFormSections()],
    ["fetchFormQuestions", () => fetchFormQuestions()],
    ["getMaxFormOrder", () => getMaxFormOrder()],
  ])("%s rejects a steward and reads nothing", async (_name, call) => {
    mockCaller("steward");

    await expect(call()).rejects.toThrow("Only admins can edit the form.");
    expect(serviceFrom).not.toHaveBeenCalled();
  });

  it.each([
    ["fetchFormSections", () => fetchFormSections()],
    ["fetchFormQuestions", () => fetchFormQuestions()],
    ["getMaxFormOrder", () => getMaxFormOrder()],
  ])("%s rejects an admin whose approval was revoked", async (_name, call) => {
    mockCaller("admin", false);

    await expect(call()).rejects.toThrow("Only admins can edit the form.");
    expect(serviceFrom).not.toHaveBeenCalled();
  });

  it("lets an approved admin read sections", async () => {
    mockCaller("admin");
    const sections = [{ id: 1, title: "General", description: null, header: null }];
    serviceFrom.mockReturnValue({
      select: jest.fn().mockReturnThis(),
      order: jest.fn().mockResolvedValue({ data: sections, error: null }),
    });

    await expect(fetchFormSections()).resolves.toEqual(sections);
    expect(serviceFrom).toHaveBeenCalledWith("form_sections");
  });
});
