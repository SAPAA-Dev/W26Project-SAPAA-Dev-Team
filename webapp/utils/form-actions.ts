'use server';

import { createServerSupabase, createClient as createUserClient } from './supabase/server';

// Every write below runs with the service role, so each one checks the caller
// first. The check reads the signed-in session, never a value the caller sends.
async function requireApprovedAdmin(): Promise<void> {
  const supabase = await createUserClient();
  const { data, error } = await supabase.auth.getUser();
  const approved = !error
    && data.user?.app_metadata?.role === 'admin'
    && data.user?.app_metadata?.authenticated === true;
  if (!approved) throw new Error('Only admins can edit the form.');
}

// ─── Types ───────────────────────────────────────────────────────────
export interface FormSection {
  id: number;
  title: string;
  description: string | null;
  header: string | null;
}

export interface QuestionOption {
  id: number;
  option_text: string;
  is_active: boolean;
}

export interface FormQuestion {
  id: number;
  form_question: string;
  subtext: string | null;
  question_type: string;
  is_required: boolean;
  is_active: boolean;
  section_id: number;
  autofill_key: string | null;
  question_key_id: number | null;
  formorder: number | null;
  options: QuestionOption[];
}

// ─── Form Editor Queries ─────────────────────────────────────────────

export async function fetchFormSections(): Promise<FormSection[]> {
  await requireApprovedAdmin();
  const supabase = createServerSupabase();
  const { data, error } = await supabase
    .from("form_sections")
    .select("id, title, description, header")
    .order("id", { ascending: true });

  if (error) throw new Error("Failed to load sections: " + error.message);
  return data || [];
}


export async function fetchFormQuestions(): Promise<FormQuestion[]> {
  await requireApprovedAdmin();
  const supabase = createServerSupabase();
  const { data, error } = await supabase
    .from("questions")
    .select(`
      id,
      form_question,
      subtext,
      question_type,
      is_required,
      is_active,
      section_id,
      autofill_key,
      question_key_id,
      formorder,
      question_options (
        id,
        option_text,
        is_active
      )
    `)
  .order("formorder", { ascending: true })
  .order('position', { referencedTable: 'question_options', ascending: true });
  if (error) throw new Error("Failed to load questions: " + error.message);
  

  return (data || []).map((q: Omit<FormQuestion, 'is_required' | 'options'> & { is_required: boolean | null; question_options: QuestionOption[] | null }) => ({
    id: q.id,
    form_question: q.form_question,
    subtext: q.subtext,
    question_type: q.question_type,
    is_required: q.is_required ?? false,
    is_active: q.is_active,
    section_id: q.section_id,
    autofill_key: q.autofill_key,
    question_key_id: q.question_key_id,
    formorder: q.formorder ?? null,
    options: (q.question_options || []).filter((o: QuestionOption) => o.is_active),
  }));
}

export async function getMaxFormOrder(): Promise<number> {
  await requireApprovedAdmin();
  const supabase = createServerSupabase();

  const { data } = await supabase
    .from("questions")
    .select("formorder")
    .order("formorder", { ascending: false })
    .limit(1)
    .single();

  return data?.formorder ?? 0;
}


// Returned, not thrown: Next.js hides the message of an error thrown by a server action in production.
export type FormActionResult = { success: true } | { success: false; error: string };

export async function saveQuestion(question: FormQuestion): Promise<FormActionResult> {
  await requireApprovedAdmin();
  const supabase = createServerSupabase();

  // 1. Update the question
  const { error: editingError } = await supabase
    .from("questions")
    .update({
      form_question: question.form_question,
      subtext: question.subtext,
      question_type: question.question_type,
      is_required: question.is_required,
      section_id: question.section_id,
      autofill_key: question.autofill_key,
    })
    .eq("id", question.id);

  if (editingError) {
    console.error("saveQuestion: question update failed:", editingError);
    return { success: false, error: "The question was not saved. Try again." };
  }

  const optionsNotSaved = { success: false, error: "Some answer options were not saved. Try again." } as const;

  // 2. Soft-delete options that were removed. This runs before step 3, or it could
  // also deactivate an option that step 3 has just inserted.
  const existingOptionIds = question.options
    .filter((o) => o.id > 0)
    .map((o) => o.id);

  if (existingOptionIds.length > 0) {
    const { error: softDeleteError } = await supabase
      .from("question_options")
      .update({ is_active: false })
      .eq("question_id", question.id)
      .eq("is_active", true)
      .not("id", "in", `(${existingOptionIds.join(",")})`);

    if (softDeleteError) {
      console.error(`saveQuestion: option soft delete failed for question ${question.id}:`, softDeleteError);
      return optionsNotSaved;
    }
  }

  // 3. Update or insert each option, with its index as its position
  const optionResults = await Promise.all(question.options.map((opt, i) =>
    opt.id > 0
      ? supabase
        .from("question_options")
        .update({ option_text: opt.option_text, is_active: opt.is_active, position: i })
        .eq("id", opt.id)
      : supabase.from("question_options").insert({
        question_id: question.id,
        option_text: opt.option_text,
        is_active: true,
        position: i,
      })
  ));

  const failures = optionResults.flatMap((result, i) =>
    result.error ? [{ option: question.options[i].option_text, error: result.error }] : []
  );
  if (failures.length > 0) {
    console.error(`saveQuestion: option update/insert failed for question ${question.id}:`, failures);
    return optionsNotSaved;
  }
  return { success: true };
}

// Admin should only be able to toggle question visibility and never delete questions (request from client)
export async function toggleQuestionActive(questionId: number, currentState: boolean) {
  await requireApprovedAdmin();
  const supabase = createServerSupabase();
  const { error } = await supabase
    .from("questions")
    .update({ is_active: !currentState }) // Flip the status
    .eq("id", questionId);

  if (error) throw new Error("Failed to update question status: " + error.message);
}

export async function addQuestion(
  sectionId: number,
  newQuestion: {
    form_question: string;
    subtext: string;
    question_type: string;
    is_required: boolean;
    options: string[];
    question_key: string;
  }
): Promise<FormActionResult> {
  await requireApprovedAdmin();
  const supabase = createServerSupabase();

  // 1. Work out the derived columns.
  // category: the first digit of the question number, so "Biological Observations (Q52)" gives "5".
  const questionNumber = newQuestion.form_question.split('(Q')[1]?.replace(')', '') ?? '';
  const category = questionNumber.charAt(0) || null;
  // comment: the question has a text box.
  const comment = newQuestion.question_type === "text" || newQuestion.question_type === "image";
  const hasOptions = newQuestion.question_type === "option" || newQuestion.question_type === "selectall";
  // obs_value and obs_comm: true for the answer columns the question uses, otherwise null.
  const obsValue = hasOptions || !comment ? true : null;
  const obsComm = hasOptions || comment ? true : null;

  // 2. Insert the question_keys row, the questions row (at the end of the form) and its options
  // in one transaction, so a failed step leaves no orphan question_keys row behind.
  const { error } = await supabase.rpc("add_question_atomically", {
    p_section_id: sectionId,
    p_form_question: newQuestion.form_question,
    p_subtext: newQuestion.subtext,
    p_question_type: newQuestion.question_type,
    p_is_required: newQuestion.is_required,
    p_question_key: newQuestion.question_key,
    p_category: category,
    p_comment: comment,
    p_obs_value: obsValue,
    p_obs_comm: obsComm,
    p_options: hasOptions ? newQuestion.options : [],
  });

  if (error) {
    console.error("addQuestion: add_question_atomically failed:", JSON.stringify(error));
    return {
      success: false,
      error: error.code === "23505"
        ? "This question key or one of its options already exists."
        : "The question was not added. Try again.",
    };
  }
  return { success: true };
}

export async function reorderQuestions(
  updates: { questionId: number; questionName: string; newOrder: number }[]
) {
  await requireApprovedAdmin();
  const supabase = createServerSupabase();

  for (const update of updates) {
    const { error } = await supabase
      .from("questions")
      .update({ formorder: update.newOrder })
      .eq("id", update.questionId);

    if (error) {
      throw new Error(
        `Failed to update question ${update.questionId}: ${error.message}`
      );
    }
  }
}
