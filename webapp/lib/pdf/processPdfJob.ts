import { createServerSupabase } from '@/utils/supabase/server';
import { renderToBuffer, type DocumentProps } from '@react-pdf/renderer';
import React from 'react';
import { PutObjectCommand } from '@aws-sdk/client-s3';
import { s3Client } from '@/lib/s3/client';
import { InspectionReportDocument } from './inspectionReport';
import { fetchReportData } from './pdfDataFetcher';
import { PdfRequest } from './types';

const BUCKET = process.env.AWS_S3_BUCKET_NAME!;

export async function processPdfJob(jobId: string) {
  const supabase = createServerSupabase();

  const { data: job, error: jobError } = await supabase
    .from('S26_pdf_jobs')
    .select('*')
    .eq('id', jobId)
    .single();
  if (jobError || !job) throw new Error('Job not found');

  try {
    await supabase.from('S26_pdf_jobs').update({ status: 'processing' }).eq('id', jobId);

    const request = job.request_payload as PdfRequest;
    const reportData = await fetchReportData(request);

    const element = React.createElement(InspectionReportDocument, { data: reportData });
    const buffer = await renderToBuffer(element as unknown as React.ReactElement<DocumentProps>);

    const dateStr = new Date().toISOString().split('T')[0];
    const filename =
      request.mode === 'single' ? `SAPAA_Inspection_${request.responseId}_${dateStr}.pdf`
      : request.mode === 'site' ? `SAPAA_${request.siteName.replace(/[^a-zA-Z0-9]/g, '_')}_${dateStr}.pdf`
      : `SAPAA_MultiSite_Report_${dateStr}.pdf`;

    const key = `pdf-exports/${job.created_by}/${jobId}/${filename}`;

    await s3Client.send(new PutObjectCommand({
      Bucket: BUCKET,
      Key: key,
      Body: buffer,
      ContentType: 'application/pdf',
    }));

    await supabase
      .from('S26_pdf_jobs')
      .update({ status: 'complete', storage_path: key })
      .eq('id', jobId);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'PDF generation failed';
    await supabase.from('S26_pdf_jobs').update({ status: 'failed', error: message }).eq('id', jobId);
    throw err;
  }
}