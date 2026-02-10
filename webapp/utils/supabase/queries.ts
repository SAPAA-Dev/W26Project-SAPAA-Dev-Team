'use server';

import { createServerSupabase } from './server';

export interface SiteSummary {
  id: number;
  namesite: string;
  county: string | null;
  inspectdate: string | null;
}


export interface InspectionDetail {
  id: number;
  namesite: string;
  _type: string | null;
  county: string | null;
  _naregion: string | null;
  inspectdate: string | null;
  naturalness_score: string | null;
  naturalness_details: string | null;
  notes: string | null;
}


export interface InpsectionFrom {
  id: number;
  namesite: string;
  questions: Array<question> | null;
  sections: Array<string>
  inspectdate: string | null;
}

export interface question {
  id: number;
  section: number | null;
  title: string | null;
  text: string | null;
  question_type: string | null;
  answers: Array<string> | null;
}

export async function getQuestionsOnline(): Promise<question[]> {
  const supabase = createServerSupabase();

  const { data, error } = await supabase
    .from('W26_questions')
    .select(`
      id,
      subtext,
      question_type,
      section_id,
      form_question,
      W26_question_options (
        option_text
      )
    `)
    .eq('is_active', true)
    .eq('W26_question_options.is_active', true);

  if (error) {
    throw new Error(error.message || 'Failed to fetch questions');
  }

  return (data ?? []).map((q: any) => ({
    id: q.id,
    text: q.subtext,
    title: q.form_question,
    question_type: q.question_type,
    section: q.section_id,
    answers: q.W26_question_options?.map(
      (opt: any) => opt.option_text
    ) ?? null,
  }));
}

export async function getSitesOnline(): Promise<SiteSummary[]> {
  const supabase = createServerSupabase();

  const { data, error } = await supabase
    .from('sites_list_fnr')
    .select('namesite, county, inspectdate')
    .order('namesite', { ascending: true });

  if (error) throw new Error(error.message || 'Failed to fetch sites');

  return (data ?? []).map((site: any, i: number) => ({
    id: i + 1,
    namesite: site.namesite,
    county: site.county,
    inspectdate: site.inspectdate,
  }));
}

export async function getSiteByName(namesite: string): Promise<SiteSummary[]> {
  const supabase = createServerSupabase();

  const { data, error } = await supabase
    .from('sites_list_fnr')
    .select('namesite, county, inspectdate')
    .eq('namesite', namesite)
    .order('inspectdate', { ascending: false })
    .limit(1);

  if (error) throw new Error(error.message || 'Failed to fetch site');

  return (data ?? []).map((site: any, i: number) => ({
    id: i + 1,
    namesite: site.namesite,
    county: site.county,
    inspectdate: site.inspectdate,
  }));
}

export async function getInspectionDetailsOnline(namesite: string): Promise<InspectionDetail[]> {
  const supabase = createServerSupabase();

  const { data, error } = await supabase
    .from('sites_detail_fnr_test')
    .select('namesite, _type, county, _naregion, inspectdate, naturalness_score, naturalness_details, notes')
    .eq('namesite', namesite)
    .order('inspectdate', { ascending: false });

  if (error) throw new Error(error.message || 'Failed to fetch inspection details');

  return (data ?? []).map((insp: any, i: number) => ({
    id: i + 1,
    namesite: insp.namesite,
    _type: insp._type,
    county: insp.county,
    _naregion: insp._naregion,
    inspectdate: insp.inspectdate,
    naturalness_score: insp.naturalness_score,
    naturalness_details: insp.naturalness_details,
    notes: insp.notes,
  }));
}