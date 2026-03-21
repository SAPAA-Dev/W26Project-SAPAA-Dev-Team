'use server';

import { UniqueIdentifier } from '@dnd-kit/core';
import { createServerSupabase, createClient } from './server';

export interface SiteSummary {
  id: number;
  namesite: string;
  county: string | null;
  ab_county: number | null;
  inspectdate: string | null;
  is_active: boolean;
}

export interface County {
  id: number;
  county: string;
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
  steward: string | null;
}

export interface InspectionForm {
  id: number;
  namesite: string;
  questions: Array<question> | null;
  sections: Array<string>
  inspectdate: string | null;
}

export interface question {
  id: number;
  section: number;
  title: string | null;
  text: string | null;
  question_type: string;
  is_required: boolean | null;
  answers: Array<string>;
  formorder?: number | null; 
  sectionTitle?: string | null;
  sectionDescription?: string | null;
  sectionHeader?: string | null;
}

interface SupabaseAnswer {
  response_id: number; 
  question_id: number;
  obs_value: string | null;
  obs_comm: string | null;
}



export interface FormResponse {
  id: number;
  user_id: string | null;
  created_at: string | null;
  inspection_no: string | null;
  naturalness_score: string | null;
  naturalness_details: string | null;  
  steward: string | null;
  answers: FormAnswer[];
}

export interface FormAnswer {
  question_id: number;
  question_text: string;
  obs_value: string | null;
  obs_comm: string | null;
  section_id: number | null;
  section_title: string | null;
}

export async function uploadSiteInspectionAnswers(batchArray: SupabaseAnswer[]) {
  const supabase = createServerSupabase();
  const { data, error } = await supabase
    .from('W26_answers')
    .insert(batchArray);

  if (error) {
    throw new Error(error.message || 'Failed to add site inspection answers');
  }
  return data;
}

export async function getQuestionResponseType() {
  const supabase = createServerSupabase();

  const { data, error } = await supabase
    .from('W26_questions')
    .select('id, obs_value, obs_comm')
    .eq('is_active', true);

  if (error) {
    throw new Error(error.message || 'Failed to fetch question response types');
  }

  return (data ?? []).map((q: any) => ({
    question_id: q.id,
    obs_value: q.obs_value,
    obs_comm: q.obs_comm,
  }));
}

export async function addSiteInspectionReport(siteId: number, userId: any) {
  const supabase = createServerSupabase();

  const { data, error } = await supabase
    .from('W26_form_responses')
    .insert({
      site_id: siteId,
      user_id: userId,
    })
    .select('id')
    .single();
  
  if (error) {
    throw new Error(error.message || 'Failed to add site inspection report');
  }
  return data;
}

export async function rollbackSiteInspectionSubmission(responseId: number) {
  const supabase = createServerSupabase();

  const { error: attachmentsError } = await supabase
    .from('W26_attachments')
    .delete()
    .eq('response_id', responseId);

  if (attachmentsError) {
    throw new Error(attachmentsError.message || 'Failed to remove inspection attachments');
  }

  const { error: answersError } = await supabase
    .from('W26_answers')
    .delete()
    .eq('response_id', responseId);

  if (answersError) {
    throw new Error(answersError.message || 'Failed to remove inspection answers');
  }

  const { error: responseError } = await supabase
    .from('W26_form_responses')
    .delete()
    .eq('id', responseId);

  if (responseError) {
    throw new Error(responseError.message || 'Failed to remove site inspection report');
  }
}

export async function deactivateFormResponse(responseId: number) {
  const supabase = createServerSupabase();

  const { error } = await supabase
    .from('W26_form_responses')
    .update({ is_active: false })
    .eq('id', responseId);

  if (error) {
    throw new Error(error.message || 'Failed to deactivate form response');
  }
}

export async function getCurrentUserUid() {
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error) throw new Error(error.message);
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

export async function addSiteInspection(namesite: string, responses: Record<number, any>): Promise<{ inspectno: string; id: number } | null> {
  const supabase = createServerSupabase();

  try {
    const currentYear = new Date().getFullYear();

    const { data: latestInspections, error: fetchError } = await supabase
      .from('sites_list_fnr')
      .select('inspectno')
      .eq('namesite', namesite);

    if (fetchError) throw new Error(fetchError.message || 'Failed to fetch latest inspection');

    let nextNumber = 1;
    if (latestInspections && latestInspections.length > 0) {
      const latestInspectno = latestInspections[0].inspectno;
      const currentNumber = parseInt(latestInspectno.split('-')[1], 10);
      nextNumber = currentNumber + 1;
    }

    const newInspectno = `${currentYear}-${nextNumber}`;
    const inspectionData: any = {
      namesite,
      inspectno: newInspectno,
      inspectdate: new Date().toISOString().split('T')[0],
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
      autofill_key,
      W26_question_options (
        option_text
      ),
      formorder,
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
    autofill_key: q.autofill_key ?? null,
    answers: q.W26_question_options?.map((opt: any) => opt.option_text) ?? null,
    formorder: q.formorder ?? null,
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
    .maybeSingle();

  if (error) throw error;
  return !!data;
}

export async function getSitesOnline(): Promise<SiteSummary[]> {
  const supabase = createServerSupabase();

  const { data, error } = await supabase
    .from('W26_sites-pa')
    .select(`
      id,
      namesite,
      ab_county,
      is_active,
      W26_ab_counties (
        county
      ),
      W26_form_responses (
        created_at
      )
    `)
    .eq('is_active', true)
    .order('namesite', { ascending: true });

  if (error) throw new Error(error.message || 'Failed to fetch sites');

  return (data ?? []).map((site: any, i: number) => {
    const responses = site.W26_form_responses ?? [];
    const latestDate = responses.length > 0
      ? responses.sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0].created_at
      : null;

    return {
      id: site.id,
      namesite: site.namesite,
      county: site.W26_ab_counties?.county ?? null,
      ab_county: site.ab_county ?? null,
      inspectdate: latestDate,
      is_active: site.is_active ?? true,
    };
  });
}

export async function getAllSites(): Promise<SiteSummary[]> {
  const supabase = createServerSupabase();

  const { data, error } = await supabase
    .from('W26_sites-pa')
    .select(`
      id,
      namesite,
      ab_county,
      is_active,
      W26_ab_counties (
        county
      ),
      W26_form_responses (
        created_at
      )
    `)
    .order('namesite', { ascending: true });

  if (error) throw new Error(error.message || 'Failed to fetch sites');

  return (data ?? []).map((site: any) => {
    const responses = site.W26_form_responses ?? [];
    const latestDate = responses.length > 0
      ? responses.sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0].created_at
      : null;

    return {
      id: site.id,
      namesite: site.namesite,
      county: site.W26_ab_counties?.county ?? null,
      ab_county: site.ab_county ?? null,
      inspectdate: latestDate,
      is_active: site.is_active ?? true,
    };
  });
}

export async function getCounties(): Promise<County[]> {
  const supabase = createServerSupabase();

  const { data, error } = await supabase
    .from('W26_ab_counties')
    .select('id, county')
    .order('county', { ascending: true });

  if (error) throw new Error(error.message || 'Failed to fetch counties');
  return data ?? [];
}

export async function updateSite(
  id: number,
  namesite: string,
  ab_county: number | null
): Promise<void> {
  const supabase = createServerSupabase();

  const { error } = await supabase
    .from('W26_sites-pa')
    .update({ namesite, ab_county })
    .eq('id', id);

  if (error) throw new Error(error.message || 'Failed to update site');
}

export async function toggleSiteActive(
  id: number,
  is_active: boolean
): Promise<void> {
  const supabase = createServerSupabase();

  const { error } = await supabase
    .from('W26_sites-pa')
    .update({ is_active })
    .eq('id', id);

  if (error) throw new Error(error.message || 'Failed to update site status');
}

export async function getSiteByName(namesite: string): Promise<SiteSummary[]> {
  const supabase = createServerSupabase();

  const { data, error } = await supabase
    .from('W26_sites-pa')
    .select(`
      id,
      namesite,
      ab_county,
      is_active,
      W26_ab_counties (
        county
      ),
      W26_form_responses (
        created_at
      )
    `)
    .eq('namesite', namesite)
    .eq('is_active', true)
    .limit(1);

  if (error) throw new Error(error.message || 'Failed to fetch site');

  return (data ?? []).map((site: any) => {
    const responses = site.W26_form_responses ?? [];
    const latestDate = responses.length > 0
      ? responses.sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0].created_at
      : null;

    return {
      id: site.id,
      namesite: site.namesite,
      county: site.W26_ab_counties?.county ?? null,
      ab_county: site.ab_county ?? null,
      inspectdate: latestDate,
      is_active: site.is_active ?? true,
    };
  });
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
    steward: insp.steward,
  }));
}


export async function insertInspectionAttachments(rows: Array<{
  response_id: number;
  question_id: number;
  storage_key: string; // placeholder for now
  filename?: string | null;
  content_type?: string | null;
  file_size_bytes?: number | null;
  caption?: string | null;
  description?: string | null;
}>) {
  const supabase = createServerSupabase();  

  const { data, error } = await supabase
    .from('W26_attachments')
    .insert(rows);

  if (error) {
    throw new Error(error.message || 'Failed to insert attachments');
  }

  return data;
}

export async function insertHomepageImageUpload(rows: Array<{
  storage_key: string; 
  filename?: string | null;
  content_type?: string | null;
  file_size_bytes?: number | null;
  site_id: number;
  user_id: string;
  date: Date;
  photographer: string | null;
  identifier: string | null;
  description: string | null;
  created_at: string | null;
}>) {
  const supabase = createServerSupabase();  

  const { data, error } = await supabase
    .from('W26_homepage-image-uploads')
    .insert(rows);

  if (error) {
    throw new Error(error.message || 'Failed to insert homepage attachments');
  }

  return data;
}

export async function getFormResponsesBySite(siteName: string): Promise<FormResponse[]> {
  const supabase = createServerSupabase();

  const { data: siteData, error: siteError } = await supabase
    .from('W26_sites-pa')
    .select('id')
    .eq('namesite', siteName)
    .single();

  if (siteError || !siteData) throw new Error('Site not found');

  const { data: keyData, error: keyError } = await supabase
    .from('W26_questions')
    .select('id, "question key"')
    .in('"question key"', ['Q31_Naturalness', 'Q32_Natural_Comm', 'Q13_FirstandLastNameForGuests']);

  if (keyError) throw new Error(keyError.message);

  const keyMap = Object.fromEntries(
    (keyData ?? []).map((q: any) => [q['question key'], q.id])
  );

  const naturalnessId = Number(keyMap['Q31_Naturalness']);
  const naturalnessDetailsId = Number(keyMap['Q32_Natural_Comm']);
  const stewardId = Number(keyMap['Q13_FirstandLastNameForGuests']);

  const { data, error } = await supabase
    .from('W26_form_responses')
    .select(`
      id,
      user_id,
      created_at,
      inspection_no,
      W26_answers (
        question_id,
        obs_value,
        obs_comm,
        W26_questions (
          id,
          form_question,
          section_id,
          W26_form_sections!W26_questions_section_id_fkey (
            id,
            title
          )
        )
      )
    `)
    .eq('site_id', siteData.id)
    .neq('is_active', false)
    .order('created_at', { ascending: false });

  if (error) throw new Error(error.message || 'Failed to fetch form responses');

  return (data ?? []).map((r: any) => {
    const answers: FormAnswer[] = Object.values(
      (r.W26_answers ?? []).reduce((acc: any, a: any) => {
        const qid = a.question_id;
        if (!acc[qid]) {
          acc[qid] = {
            question_id: qid,
            question_text: a.W26_questions?.form_question ?? `Question ${qid}`,
            obs_value: [],
            obs_comm: null,
            section_id: a.W26_questions?.section_id ?? null,
            section_title: a.W26_questions?.W26_form_sections?.title ?? null,
          };
        }
        if (a.obs_value === 'Other' && a.obs_comm) {
          acc[qid].obs_value.push('Other');  
          acc[qid].obs_comm = a.obs_comm;
        } else if (a.obs_value) {
          acc[qid].obs_value.push(a.obs_value);
        } else if (a.obs_comm) {
          acc[qid].obs_comm = a.obs_comm;
        }
        return acc;
      }, {})
    ).map((a: any) => ({
      ...a,
      obs_value: a.obs_value.length > 0 ? a.obs_value.join('; ') : null,
    }))
    .sort((a: any, b: any) => {
      if (a.section_id !== b.section_id) {
        return (a.section_id ?? 0) - (b.section_id ?? 0);
      }
      return a.question_id - b.question_id;
    });

    const naturalness = answers.find(a => a.question_id === naturalnessId)?.obs_value ?? null;
    const naturalnessDetailsValue =
      answers.find(a => a.question_id === naturalnessDetailsId)?.obs_value ??
      answers.find(a => a.question_id === naturalnessDetailsId)?.obs_comm ??
      null;
    const steward = answers.find(a => a.question_id === stewardId)?.obs_value ?? null;

    return {
      id: r.id,
      user_id: r.user_id ?? null,
      created_at: r.created_at,
      inspection_no: r.inspection_no,
      naturalness_score: naturalness,
      naturalness_details: naturalnessDetailsValue,
      steward,
      answers: answers.filter(a => a.question_id !== naturalnessId && a.question_id !== stewardId),
    };
  });
}

// Returns raw answers for a single response shaped as Record<questionId, value>
// ready to drop straight into the form's `responses` state.
export async function getFormResponseById(responseId: number): Promise<Record<string | number, any>> {
  const supabase = createServerSupabase();

  const { data, error } = await supabase
    .from('W26_answers')
    .select(`
      question_id,
      obs_value,
      obs_comm,
      W26_questions (
        question_type
      )
    `)
    .eq('response_id', responseId);

  if (error) throw new Error(error.message || 'Failed to fetch response answers');

  const map: Record<string | number, any> = {}; // 2. Update local map type

  for (const row of data ?? []) {
    const qid: number = row.question_id;
    const questionType: string = (row as any).W26_questions?.question_type ?? '';

    if (row.obs_value === 'Other' && row.obs_comm) {
      if (!map[qid]) map[qid] = [];
      if (Array.isArray(map[qid]) && !map[qid].includes('Other')) {
        map[qid].push('Other');
      }
      // 3. Fix: Use backticks for template literals
      map[`${qid}_comm`] = row.obs_comm; 
      
    } else if (row.obs_value) {
        if (questionType === 'checkbox' || questionType === 'multi' || questionType === 'selectall') {
          if (!map[qid]) map[qid] = [];
          map[qid].push(row.obs_value);
        } else {
          map[qid] = row.obs_value;
        }
    } else if (row.obs_comm) {
      map[qid] = row.obs_comm;
    }
  }

  return map;
}

// Fetches all W26_attachments rows for a given response_id
export async function getAttachmentsByResponseId(responseId: number): Promise<Array<{
  id: number;
  question_id: number | null;
  storage_key: string | null;
  filename: string | null;
  content_type: string | null;
  file_size_bytes: number | null;
  caption: string | null;
  description: string | null;
  site_id: number | null;
}>> {
  const supabase = createServerSupabase();

  const { data, error } = await supabase
    .from('W26_attachments')
    .select('id, question_id, storage_key, filename, content_type, file_size_bytes, caption, description, site_id')
    .eq('response_id', responseId);

  if (error) throw new Error(error.message || 'Failed to fetch attachments');
  return data ?? [];
}

// Updates caption and description for an existing W26_attachments row
export async function updateAttachmentMetadata(
  attachmentId: number,
  fields: { caption?: string | null; description?: string | null }
) {
  const supabase = createServerSupabase();

  const { error } = await supabase
    .from('W26_attachments')
    .update(fields)
    .eq('id', attachmentId);

  if (error) throw new Error(error.message || 'Failed to update attachment metadata');
}

// Replaces all answers for an existing response (delete + reinsert), keeping the same response_id
export async function updateSiteInspectionAnswers(
  responseId: number,
  batchArray: Omit<SupabaseAnswer, 'response_id'>[]
) {
  const supabase = createServerSupabase();

  const { error: deleteError } = await supabase
    .from('W26_answers')
    .delete()
    .eq('response_id', responseId);

  if (deleteError) throw new Error(deleteError.message || 'Failed to clear existing answers');

  const rows = batchArray.map(a => ({ ...a, response_id: responseId }));

  const { data, error: insertError } = await supabase
    .from('W26_answers')
    .insert(rows);

  if (insertError) throw new Error(insertError.message || 'Failed to reinsert updated answers');

  return data;
}

export async function getResponseOwnerId(responseId: number): Promise<string | null> {
  const supabase = createServerSupabase();

  const { data, error } = await supabase
    .from('W26_form_responses')
    .select('user_id')
    .eq('id', responseId)
    .single();

  if (error || !data) return null;
  return data.user_id;
}

export async function getSiteIdForResponse(responseId: number): Promise<number | null> {
  const supabase = createServerSupabase();
  const { data, error } = await supabase
    .from('W26_form_responses')
    .select('site_id')
    .eq('id', responseId)
    .single();
  if (error || !data) return null;
  return (data as any).site_id ?? null;
}

export async function getTotalInspectionCount(): Promise<number> {
  const supabase = createServerSupabase();
  const { count, error } = await supabase
    .from('W26_form_responses')
    .select('*', { count: 'exact', head: true });
  if (error) throw new Error(error.message);
  return count ?? 0;
}

export async function getLastInspectionDate(): Promise<string | null> {
  const supabase = createServerSupabase();
  const { data, error } = await supabase
    .from('W26_form_responses')
    .select('created_at')
    .order('created_at', { ascending: false })
    .limit(1)
    .single();
  if (error || !data) return null;
  return data.created_at;
}
export async function getNaturalnessDistribution(): Promise<{ naturalness_score: string; count: number }[]> {
  const supabase = createServerSupabase();
  const { data, error } = await supabase.rpc('get_naturalness_distribution');
  if (error) throw new Error(error.message);
  return (data ?? []).map((r: any) => ({
    naturalness_score: r.naturalness_score,
    count: Number(r.count),
  }));
}

export async function getTopSitesDistribution(): Promise<{ namesite: string; count: number }[]> {
  const supabase = createServerSupabase();
  const { data, error } = await supabase.rpc('get_top_sites_distribution');
  if (error) throw new Error(error.message);
  return (data ?? []).map((r: any) => ({
    namesite: r.namesite,
    count: Number(r.count),
  }));
}