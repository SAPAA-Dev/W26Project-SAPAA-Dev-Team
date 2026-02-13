'use server';

import { createServerSupabase, createClient } from './server';

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
  is_required: boolean | null;
  answers: Array<string> | null;
  formorder?: number | null; 
  sectionTitle?: string | null;
  sectionDescription?: string | null;
  sectionHeader?: string | null;
}

export async function addSiteInspectionReport(siteId: number, userId: any) {
  const supabase = createServerSupabase();

  const { data, error } = await supabase
    .from('W26_form_responses')
    .insert({
      site_id: siteId,
      user_id: userId,})
    .select('id')
    .single();
  
  if (error) {
    throw new Error(error.message || 'Failed to add site inspection report');
  }
  return data;
}

export async function getCurrentUserUid() {
    const supabase = await createClient();

    const { data: { user }, error } = await supabase.auth.getUser();

    if (error) {
      throw new Error(error.message);
    }
    return user?.id;
}

export async function getCurrentSiteId(siteName: string) {
  const supabase = await createServerSupabase();

  const { data, error } = await supabase
    .from('W26_sites-pa')
    .select('id')
    .eq('namesite', siteName)
    .single();

  if (error) {
    throw new Error(error.message || 'Failed to get site ID');
  }
  return data?.id;
}

//for legacy, consult group if we want to edit old tables
export async function addSiteInspection(namesite: string, responses: Record<number, any>): Promise<{ inspectno: string; id: number } | null> {
  const supabase = createServerSupabase();

  try {
    //Get the latest inspection for this year to determine the next number
    const currentYear = new Date().getFullYear();
    const yearPrefix = `${currentYear}-`;

    const { data: latestInspections, error: fetchError } = await supabase
      .from('sites_list_fnr')
      .select('inspectno')
      .eq('namesite', namesite)

    if (fetchError) throw new Error(fetchError.message || 'Failed to fetch latest inspection');

    let nextNumber = 1;
    if (latestInspections && latestInspections.length > 0) {
      const latestInspectno = latestInspections[0].inspectno;
      const currentNumber = parseInt(latestInspectno.split('-')[1], 10);
      nextNumber = currentNumber + 1;
    }

    const newInspectno = `${currentYear}-${nextNumber}`;

    const inspectionData: any = {
      namesite: namesite,
      inspectno: newInspectno,
      inspectdate: new Date().toISOString().split('T')[0], // Current date in YYYY-MM-DD format
    };

    if (responses[31] !== undefined && responses[31] !== null && responses[31] !== '') {
      inspectionData.naturalness_score = responses[31];
    }

    if (responses[32] !== undefined && responses[32] !== null && responses[32] !== '') {
      inspectionData.naturalness_details = responses[32];
    }

    const { data: insertedData, error: insertError } = await supabase
      .from('sites_list_fnr')
      .insert([inspectionData])
      .select('id, inspectno')
      .single();

    if (insertError) throw new Error(insertError.message || 'Failed to insert inspection');

    return insertedData;
  } catch (error) {
    console.error('Error adding site inspection:', error);
    throw error;
  }
}

export async function getQuestionsOnline(): Promise<question[]> {
  const supabase = createServerSupabase();

  const { data, error } = await supabase
    .from('W26_questions')
    .select(`
      id,
      subtext,
      question_type,
      is_required,
      section_id,
      form_question,
      W26_question_options (
        option_text
      ),
      W26_question_keys!W26_questions_question_key_id_fkey (
        formorder
      ),
      W26_form_sections!W26_questions_section_id_fkey (
        title,
        description,
        header
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
    is_required: q.is_required ?? null,
    section: q.section_id,
    answers: q.W26_question_options?.map(
      (opt: any) => opt.option_text
    ) ?? null,
    formorder: q.W26_question_keys?.formorder ?? null,
    sectionTitle: q.W26_form_sections?.title ?? null,
    sectionDescription: q.W26_form_sections?.description ?? null,
    sectionHeader: q.W26_form_sections?.header ?? null,
  }));
}

export async function isSteward(userEmail: string): Promise<boolean> {
  const supabase = createServerSupabase();
  const { data, error } = await supabase
    .from('luperson')
    .select('id')
    .eq('email', userEmail)
    .maybeSingle()

  if (error) {
    throw error
  }

  return !!data
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