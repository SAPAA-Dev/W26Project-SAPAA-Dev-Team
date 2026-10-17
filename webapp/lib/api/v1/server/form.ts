import type { FormQuestion, FormSection, QuestionType } from '../types';
import { db } from './db';

interface QuestionRow {
  id: number;
  'question key': string;
  form_question: string;
  subtext: string | null;
  question_type: string;
  is_required: boolean | null;
  autofill_key: string | null;
  formorder: number | null;
  section_id: number;
  question_options: { id: number; option_text: string }[] | null;
  form_sections: { id: number; title: string; description: string | null } | null;
}

/** The new-report form: the same query as getQuestionsOnline, plus question keys and option ids. */
export async function getForm(): Promise<FormSection[]> {
  const { data, error } = await db()
    .from('questions')
    .select(`
      id, "question key", form_question, subtext, question_type, is_required, autofill_key, formorder, section_id,
      question_options (id, option_text),
      form_sections!questions_section_id_fkey (id, title, description)
    `)
    .eq('is_active', true)
    .eq('question_options.is_active', true)
    .order('position', { referencedTable: 'question_options', ascending: true });
  if (error) throw new Error(error.message);

  const rows = ((data ?? []) as unknown as QuestionRow[]).sort(
    (a, b) => (a.formorder ?? Infinity) - (b.formorder ?? Infinity) || a.id - b.id
  );
  // Sections follow the order of their first question.
  const sections = new Map<number, FormSection>();
  for (const row of rows) {
    const section = sections.get(row.section_id) ?? {
      id: row.section_id,
      title: row.form_sections?.title ?? '',
      description: row.form_sections?.description ?? null,
      questions: [] as FormQuestion[],
    };
    section.questions.push({
      id: row.id,
      key: row['question key'],
      title: row.form_question.replace(/\s*\(Q\d+[A-Za-z]?\)\s*$/, ''),
      subtext: row.subtext,
      type: row.question_type as QuestionType,
      required: row.is_required === true,
      autofill: row.autofill_key,
      options: (row.question_options ?? []).map((o) => ({ id: o.id, text: o.option_text })),
    });
    sections.set(row.section_id, section);
  }
  return [...sections.values()];
}
