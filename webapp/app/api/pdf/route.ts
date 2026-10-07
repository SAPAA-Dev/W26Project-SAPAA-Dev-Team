import { NextRequest, NextResponse } from 'next/server';
import { after } from 'next/server';
import { createClient, createServerSupabase } from '@/utils/supabase/server';
import { PdfRequest, PdfOptions } from '@/lib/pdf/types';
import { processPdfJob } from '@/lib/pdf/processPdfJob';

const DEFAULT_OPTIONS: PdfOptions = {
  includeImages: false,
  maxImagesPerInspection: 5,
  includeEmptyAnswers: false,
  includeCoverPage: true,
  includeNaturalnessSummary: true,
  selectedSections: 'all',
  hiddenQuestionIds: [],
  sortOrder: 'newest',
  pageSize: 'LETTER',
};

function parseHiddenQuestionIds(value: unknown): number[] {
  if (!Array.isArray(value)) return [];
  return value.filter((id): id is number => typeof id === 'number' && Number.isInteger(id));
}

function parseRequest(body: any): PdfRequest {
  if (!body || !body.mode) {
    throw new Error('Missing mode in request body');
  }

  const options: PdfOptions = {
    ...DEFAULT_OPTIONS,
    ...body.options,
  };

  if (options.maxImagesPerInspection < 0 || options.maxImagesPerInspection > 20) {
    options.maxImagesPerInspection = 5;
  }
  if (!['LETTER', 'A4'].includes(options.pageSize)) {
    options.pageSize = 'LETTER';
  }
  if (!['newest', 'oldest'].includes(options.sortOrder)) {
    options.sortOrder = 'newest';
  }
  options.hiddenQuestionIds = parseHiddenQuestionIds(options.hiddenQuestionIds);

  switch (body.mode) {
    case 'single':
      if (!body.responseId || typeof body.responseId !== 'number') {
        throw new Error('Missing or invalid responseId for single mode');
      }
      return { mode: 'single', responseId: body.responseId, options };

    case 'site':
      if (!body.siteName || typeof body.siteName !== 'string') {
        throw new Error('Missing or invalid siteName for site mode');
      }
      return { mode: 'site', siteName: body.siteName, options };

    case 'multi-site':
      if (!Array.isArray(body.siteNames) || body.siteNames.length === 0) {
        throw new Error('Missing or invalid siteNames for multi-site mode');
      }
      return { mode: 'multi-site', siteNames: body.siteNames, options };

    default:
      throw new Error(`Invalid mode: ${body.mode}`);
  }
}

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const role = user.app_metadata?.role;
    const approved = user.app_metadata?.authenticated === true;
    const isAdmin = role === 'admin' && approved;
    const isSteward = role === 'steward' && approved;
    if (!isAdmin && !isSteward) {
      return NextResponse.json({ error: 'Forbidden - steward or admin access required' }, { status: 403 });
    }

    const body = await req.json();
    const request = parseRequest(body);

    if (!isAdmin) {
      // Stewards may only export a single report, and only one they submitted.
      if (request.mode !== 'single') {
        return NextResponse.json(
          { error: 'Forbidden - stewards can only export their own reports' },
          { status: 403 }
        );
      }
      // The service-role client bypasses RLS, so the ownership check must run here.
      const admin = createServerSupabase();
      const { data: response, error: responseError } = await admin
        .from('form_responses')
        .select('user_id')
        .eq('id', request.responseId)
        .maybeSingle();

      if (responseError || !response || response.user_id !== user.id) {
        return NextResponse.json(
          { error: 'Forbidden - you can only export reports you submitted' },
          { status: 403 }
        );
      }
    }

    const { data: job, error: insertError } = await supabase
      .from('S26_pdf_jobs')
      .insert({
        status: 'pending',
        mode: request.mode,
        request_payload: request,
        created_by: user.id,
      })
      .select('id')
      .single();

    if (insertError || !job) {
      return NextResponse.json({ error: 'Failed to create export job' }, { status: 500 });
    }

    after(() => {
      processPdfJob(job.id).catch((err) => {
        console.error('PDF job processing error:', err);
      });
    });

    return NextResponse.json({ jobId: job.id }, { status: 202 });
  } catch (err) {
    console.error('PDF export start error:', err);
    const message = err instanceof Error ? err.message : 'Failed to start PDF export';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}