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

// A chainable Supabase query stub. Awaiting it resolves to `result`.
function query(result: { error: unknown }) {
  const q: Record<string, jest.Mock> & { then?: (resolve: (r: unknown) => void) => void } = {};
  for (const method of ["update", "insert", "eq", "not"]) q[method] = jest.fn(() => q);
  q.then = (resolve) => resolve(result);
  return q;
}

const ok = { error: null };
const failed = { error: { code: "XX000", message: "write failed" } };

describe("saveQuestion option writes (#273)", () => {
  let serviceFrom: jest.Mock;
  let consoleError: jest.SpyInstance;

  const withOptions: FormQuestion = {
    ...sampleQuestion,
    question_type: "option",
    options: [
      { id: 11, option_text: "Good", is_active: true },
      { id: 12, option_text: "Poor", is_active: true },
      { id: -1, option_text: "New", is_active: true },
    ],
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockCaller("admin");
    serviceFrom = jest.fn();
    (createServerSupabase as jest.Mock).mockReturnValue({ from: serviceFrom });
    consoleError = jest.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => consoleError.mockRestore());

  // Call order: question update, soft delete, then one write per option.
  function mockWrites(...results: { error: unknown }[]) {
    const queries = results.map(query);
    queries.forEach((q) => serviceFrom.mockReturnValueOnce(q));
    return queries;
  }

  it("saves the question and every option with its position", async () => {
    const [questionQ, softDeleteQ, firstQ, secondQ, insertQ] = mockWrites(ok, ok, ok, ok, ok);

    await expect(saveQuestion(withOptions)).resolves.toEqual({ success: true });

    expect(questionQ.update).toHaveBeenCalledWith(expect.objectContaining({ form_question: "Sample (Q1)" }));
    expect(softDeleteQ.not).toHaveBeenCalledWith("id", "in", "(11,12)");
    expect(firstQ.update).toHaveBeenCalledWith({ option_text: "Good", is_active: true, position: 0 });
    expect(secondQ.update).toHaveBeenCalledWith({ option_text: "Poor", is_active: true, position: 1 });
    expect(insertQ.insert).toHaveBeenCalledWith({ question_id: 1, option_text: "New", is_active: true, position: 2 });
    expect(consoleError).not.toHaveBeenCalled();
  });

  it.each([
    ["the soft delete", [ok, failed, ok, ok, ok]],
    ["an option update", [ok, ok, ok, failed, ok]],
    ["an option insert", [ok, ok, ok, ok, failed]],
  ])("reports failure when %s fails", async (_step, results) => {
    mockWrites(...results);

    await expect(saveQuestion(withOptions)).resolves.toEqual({
      success: false,
      error: "Some answer options were not saved. Try again.",
    });
    expect(consoleError).toHaveBeenCalledWith(expect.stringContaining("saveQuestion"), expect.anything());
  });

  it("starts every option write even when one fails", async () => {
    const queries = mockWrites(ok, ok, failed, ok, ok);

    await saveQuestion(withOptions);

    expect(queries[3].update).toHaveBeenCalled();
    expect(queries[4].insert).toHaveBeenCalled();
  });

  it("reports failure and writes no option when the question update fails", async () => {
    mockWrites(failed);

    await expect(saveQuestion(withOptions)).resolves.toEqual({
      success: false,
      error: "The question was not saved. Try again.",
    });
    expect(serviceFrom).toHaveBeenCalledTimes(1);
    expect(consoleError).toHaveBeenCalledWith(expect.stringContaining("question update"), expect.anything());
  });
});

describe("addQuestion (#273)", () => {
  let serviceFrom: jest.Mock;
  let rpc: jest.Mock;
  let consoleError: jest.SpyInstance;

  const newQuestion = {
    form_question: "Water Quality (Q52)",
    subtext: "How clear is the water?",
    question_type: "option",
    is_required: true,
    options: ["Good", "Poor"],
    question_key: "Q52_Water",
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockCaller("admin");
    serviceFrom = jest.fn();
    rpc = jest.fn();
    (createServerSupabase as jest.Mock).mockReturnValue({ from: serviceFrom, rpc });
    consoleError = jest.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => consoleError.mockRestore());

  it("adds the key, question and options in one database call", async () => {
    rpc.mockResolvedValue({ data: 99, error: null });

    await expect(addQuestion(3, newQuestion)).resolves.toEqual({ success: true });

    expect(rpc).toHaveBeenCalledTimes(1);
    expect(rpc).toHaveBeenCalledWith("add_question_atomically", {
      p_section_id: 3,
      p_form_question: "Water Quality (Q52)",
      p_subtext: "How clear is the water?",
      p_question_type: "option",
      p_is_required: true,
      p_question_key: "Q52_Water",
      p_category: "5",
      p_comment: false,
      p_obs_value: true,
      p_obs_comm: true,
      p_options: ["Good", "Poor"],
    });
    // No separate insert, so a failed step cannot leave a question_keys row behind.
    expect(serviceFrom).not.toHaveBeenCalled();
  });

  it("sends no options for a text question", async () => {
    rpc.mockResolvedValue({ data: 99, error: null });

    await addQuestion(3, { ...newQuestion, question_type: "text", options: ["ignored"] });

    expect(rpc).toHaveBeenCalledWith("add_question_atomically", expect.objectContaining({
      p_comment: true,
      p_obs_value: null,
      p_obs_comm: true,
      p_options: [],
    }));
  });

  it("reports failure without an orphan key, and a retry then succeeds", async () => {
    rpc
      .mockResolvedValueOnce({ data: null, error: { code: "23503", message: "questions insert failed" } })
      .mockResolvedValueOnce({ data: 99, error: null });

    await expect(addQuestion(3, newQuestion)).resolves.toEqual({
      success: false,
      error: "The question was not added. Try again.",
    });
    expect(consoleError).toHaveBeenCalledWith(expect.stringContaining("add_question_atomically"), expect.anything());
    expect(serviceFrom).not.toHaveBeenCalled();

    await expect(addQuestion(3, newQuestion)).resolves.toEqual({ success: true });
  });

  it("tells the admin when the key or an option already exists", async () => {
    rpc.mockResolvedValue({ data: null, error: { code: "23505", message: "duplicate key value" } });

    await expect(addQuestion(3, newQuestion)).resolves.toEqual({
      success: false,
      error: "This question key or one of its options already exists.",
    });
  });
});
