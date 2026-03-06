'use server';

import { createClient } from '@supabase/supabase-js';
import { createServerSupabase } from './server';
import { Truck } from 'lucide-react';

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
  form_question: string | null;
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

interface questionOptions {
  question_id: number;
  option_text: string;
  is_active: boolean;
  position: number;
}

// ─── Form Editor Queries ─────────────────────────────────────────────

export async function fetchFormSections(): Promise<FormSection[]> {
  const supabase = createServerSupabase();
  const { data, error } = await supabase
    .from("W26_form_sections")
    .select("id, title, description, header")
    .order("id", { ascending: true });

    console.log("Fetched sections:", data);

  if (error) throw new Error("Failed to load sections: " + error.message);
  return data || [];
}


export async function fetchFormQuestions(): Promise<FormQuestion[]> {
  const supabase = createServerSupabase();
  const { data, error } = await supabase
    .from("W26_questions")
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
      W26_question_options (
        id,
        option_text,
        is_active
      )
    `);

  if (error) throw new Error("Failed to load questions: " + error.message);

  return (data || []).map((q: any) => ({
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
    options: (q.W26_question_options || []).filter((o: any) => o.is_active),
  }));
}

export async function saveQuestion(question: FormQuestion): Promise<void> {
  const supabase = createServerSupabase();

  const { error: editingError } = await supabase
    .from("W26_questions")
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
    console.error("Error updating question:", editingError);
    throw new Error(editingError.message);
  }

  // Soft-delete options that were removed
  const existingOptionIds = question.options
    .filter((o) => o.id > 0)
    .map((o) => o.id);

  if (existingOptionIds.length > 0) {
    await supabase
      .from("W26_question_options")
      .update({ is_active: false })
      .eq("question_id", question.id)
      .eq("is_active", true)
      .not("id", "in", `(${existingOptionIds.join(",")})`);
  }

  // 3. Upsert options with the correct position
  // We use the index in the .map() or forEach() to set the order
  for (let i = 0; i < question.options.length; i++) {
    const opt = question.options[i];
    
    if (opt.id > 0) {
      // Update existing option with new text, active status, AND position
      await supabase
        .from("W26_question_options")
        .update({ 
          option_text: opt.option_text, 
          is_active: opt.is_active, // Matches your 'X' button logic
          position: i 
        })
        .eq("id", opt.id);
    } else {
      // Insert new option with the current index as position
      await supabase.from("W26_question_options").insert({
        question_id: question.id,
        option_text: opt.option_text,
        is_active: true,
        position: i,
      });
    }
  }
}

export async function deleteQuestion(questionId: number): Promise<void> {
  const supabase = createServerSupabase();
  const { error } = await supabase
    .from("W26_questions")
    .update({ is_active: false })
    .eq("id", questionId);

  if (error) throw error;
}

export async function toggleQuestionActive(questionId: number, currentState: boolean) {
  const supabase = createServerSupabase();
  const { error } = await supabase
    .from("W26_questions")
    .update({ is_active: !currentState }) // Flip the status
    .eq("id", questionId);

  if (error) throw new Error("Failed to update question status: " + error.message);
}

export async function addQuestion(
  sectionId: number,
  maxFormorder: number,
  newQuestion: {
    form_question: string;
    subtext: string;
    question_type: string;
    is_required: boolean;
    options: string[];
    question_key: string;
  }
): Promise<void> {
  const supabase = createServerSupabase();

  // create query to insert a row into W26_question_keys
	// id: autogenerated
	// category: foreign key to W26_questions_category that frank chooses from a dropdown maybe
	// question key: typed in by frank depending on what he wants but MUST be in the right format (e.g. Q52_Biological)
	// comment: TRUE or FALSE based on whether the question has a textbox option
	// definition: i think this can be left NULL
  const questionNumber = newQuestion.form_question.split('(Q')[1]?.replace(')', '') ?? '';
  const category = questionNumber.charAt(0) || null;

  let comment = false;
  if (newQuestion.question_type === "text" || newQuestion.question_type === "image") {
    comment = true;
  }

  // Create question key first
  const { data: keyData, error: keyError } = await supabase
    .from("W26_question_keys")
    .insert({
      category: category,
      "question key": newQuestion.question_key,
      comment: comment,
      definition: null,
    })
    .select("id")
    .single();

  if (keyError) {
    console.error("Supabase keyError:", JSON.stringify(keyError));
    throw new Error(keyError.message);
  }

  // create query to insert a row into W26_questions
  // 	id: autogenerated i think
  // 	form_question: typed in by frank but should be in the right format (e.g. Biological Observations (Q52))
  // 	question key: foreign key to W26_question_keys' question key column
  // 	obs_value: TRUE if question has no textbox, NULL otherwise (except in some cases)
  // 	obs_comm: TRUE if question has textbox, NULL otherwise
  // 	question_key_id: foreign key to W26_question_keys's id column
  // 	question_type: determined by which option frank selected
  // 	is_active: set to TRUE
  // 	section_id: based on which section the question was added to
  // 	is_required: TRUE or FALSE based on whether the checkbox is clicked
  // 	subtext: typed in by frank
  // 	autofill_key: i think just set this to NULL
  // 	formorder: determined by where the new question is placed in (might be messy because need to update formorder for all subsequent questions)

  let question_obs_value = null;
  let question_obs_comm = null;
  if (newQuestion.question_type === "option" || newQuestion.question_type === "selectall") {
    question_obs_value = true;
    question_obs_comm = true;
  }
  else if (comment) {
    question_obs_comm = true;
  }
  else {
    question_obs_value = true;
  }

  // Next, create question
  const { data: questionData, error: questionError } = await supabase
    .from("W26_questions")
    .insert({
      form_question: newQuestion.form_question,
      "question key": newQuestion.question_key,
      obs_value: question_obs_value,
      obs_comm: question_obs_comm,
      question_key_id: keyData.id,
      question_type: newQuestion.question_type,
      is_active: true,
      section_id: sectionId,
      is_required: newQuestion.is_required,
      subtext: newQuestion.subtext,
      autofill_key: null,
      formorder: null // TODO once it is setup for the other questions
    })
    .select("id")
    .single();

  if (questionError) {
    console.error("Supabase keyError:", JSON.stringify(questionError));
    throw new Error(questionError.message);
  }

  // if the question has multiple choices, create query to insert however many rows into W26_question_options as necessary
  // 	id: autogenerated i think
  // 	question_id: foreign key to W26_questions' id column
  //  option_text: whatever frank types in as the text
  //  is_active: set to TRUE
  //  position: the relative position of this question option to the other question options in the question (if that makes sense)

  // if the question has multiple choices, create query to insert however many rows into W26_question_options as necessary

  if (newQuestion.question_type === "option" || newQuestion.question_type === "selectall") {
    let optionsArray: questionOptions[] = [];
    for (const option of newQuestion.options) {
      optionsArray.push({
          question_id: questionData.id,
          option_text: option,
          is_active: true,
          position: newQuestion.options.indexOf(option)
      });
    }

    const { data: optionsData, error: optionsError } = await supabase
    .from("W26_question_options")
    .insert(optionsArray);

    if (optionsError) {
      console.error("Supabase keyError:", JSON.stringify(optionsError));
      throw new Error(optionsError.message);
    }
  }
}

export async function swapQuestionOrder(
  keyId1: number,
  order1: number | null,
  keyId2: number,
  order2: number | null
): Promise<void> {
  const supabase = createServerSupabase();
  await Promise.all([
    supabase
      .from("W26_questions")
      .update({ formorder: order2 })
      .eq("id", keyId1),
    supabase
      .from("W26_questions")
      .update({ formorder: order1 })
      .eq("id", keyId2),
  ]);
}

// export async function reorderQuestions(
//   updates: { questionId: number; newOrder: number }[]
// ): Promise<void> {
//   const supabase = createServerSupabase();
//   await Promise.all(
//     updates.map(({ questionId, newOrder }) =>
//       supabase
//         .from("W26_questions")
//         .update({ formorder: newOrder })
//         .eq("id", questionId)
//     )
//   );
// }

// export async function reorderQuestions(
//   updates: { questionId: number; newOrder: number }[]
// ): Promise<void> {
//   const supabase = createServerSupabase();

//   // We perform all updates in parallel
//   // This ensures every question gets its unique index assigned
//   const results = await Promise.all(
//     updates.map(({ questionId, newOrder }) =>
//       supabase
//         .from("W26_questions")
//         .update({ formorder: newOrder })
//         .eq("id", questionId)
//     )
//   );

//   const error = results.find((r) => r.error);
//   if (error) {
//     console.error("Error in reorderQuestions:", error);
//     throw new Error("Could not update question order.");
//   }
// }

export async function reorderQuestions(
  updates: { questionName: string | null; questionId: number; newOrder: number }[]
): Promise<void> {
  // const supabase = createServerSupabase();
  console.log("these are the updates for reordering:");
  console.log(updates);
  // 1. Move all affected questions to a temporary "negative" order.
  // This clears the 'positive' slots (1, 2, 3...) so no conflicts occur.
  // const tempResults = await Promise.all(
  //   updates.map(({ questionId, newOrder }) =>
  //     supabase
  //       .from("W26_questions")
  //       .update({ formorder: -newOrder }) // Temporary negative value
  //       .eq("id", questionId)
  //   )
  // );

  // if (tempResults.find(r => r.error)) {
  //   throw new Error("Failed during temporary reorder phase");
  // }

  // // 2. Move them to their final positive positions.
  // const finalResults = await Promise.all(
  //   updates.map(({ questionId, newOrder }) =>
  //     supabase
  //       .from("W26_questions")
  //       .update({ formorder: newOrder }) 
  //       .eq("id", questionId)
  //   )
  // );

  // const error = finalResults.find((r) => r.error);
  // if (error) {
  //   console.error("Error in reorderQuestions:", error);
  //   throw new Error("Could not update question order.");
  // }
}

export async function moveQuestionToSection(
  questionId: number,
  newSectionId: number,
  newOrder: number
): Promise<void> {
  const supabase = createServerSupabase();
  const { error } = await supabase
    .from("W26_questions")
    .update({ section_id: newSectionId, formorder: newOrder })
    .eq("id", questionId);

  if (error) throw new Error("Failed to move question: " + error.message);
}

export async function addFormSection(section: {
  title: string;
  description: string | null;
  header: string;
}): Promise<number> {
  const supabase = createServerSupabase();
  const { data, error } = await supabase
    .from("W26_form_sections")
    .insert(section)
    .select("id")
    .single();

  if (error) throw error;
  return data.id;
}
