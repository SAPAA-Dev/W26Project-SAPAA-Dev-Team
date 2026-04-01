import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { renderToBuffer } from '@react-pdf/renderer';
import React from 'react';
import { InspectionReportDocument } from '@/lib/pdf/inspectionReport';
import { fetchReportData } from '@/lib/pdf/pdfDataFetcher';
import { PdfRequest, PdfOptions } from '@/lib/pdf/types';

export const maxDuration = 60;

const DEFAULT_OPTIONS: PdfOptions = {
  includeImages: false,
  maxImagesPerInspection: 5,
  includeEmptyAnswers: false,
  includeCoverPage: true,
  includeNaturalnessSummary: true,
  selectedSections: 'all',
  sortOrder: 'newest',
  pageSize: 'LETTER',
};

function parseRequest(body: any): PdfRequest {
  if (!body || !body.mode) {
    throw new Error('Missing mode in request body');
  }

  const options: PdfOptions = {
    ...DEFAULT_OPTIONS,
    ...body.options,
  };

  // Validate
  if (options.maxImagesPerInspection < 0 || options.maxImagesPerInspection > 20) {
    options.maxImagesPerInspection = 5;
  }
  if (!['LETTER', 'A4'].includes(options.pageSize)) {
    options.pageSize = 'LETTER';
  }
  if (!['newest', 'oldest'].includes(options.sortOrder)) {
    options.sortOrder = 'newest';
  }

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
    // Authenticate
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Admin only
    const role = user.user_metadata?.role;
    if (role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden - admin access required' }, { status: 403 });
    }

    // Parse request
    const body = await req.json();
    const request = parseRequest(body);

    // Fetch data
    const reportData = await fetchReportData(request);

    // Render PDF
    const element = React.createElement(InspectionReportDocument, {
      data: reportData,
    });
    const buffer = await renderToBuffer(element as any);

    // Generate filename
    const dateStr = new Date().toISOString().split('T')[0];
    let filename: string;
    if (request.mode === 'single') {
      filename = `SAPAA_Inspection_${request.responseId}_${dateStr}.pdf`;
    } else if (request.mode === 'site') {
      const safeName = request.siteName.replace(/[^a-zA-Z0-9]/g, '_');
      filename = `SAPAA_${safeName}_${dateStr}.pdf`;
    } else {
      filename = `SAPAA_MultiSite_Report_${dateStr}.pdf`;
    }

    const pdfBytes = new Uint8Array(buffer);
    return new Response(pdfBytes, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });
  } catch (err) {
    console.error('PDF generation error:', err);
    const message = err instanceof Error ? err.message : 'Failed to generate PDF';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
