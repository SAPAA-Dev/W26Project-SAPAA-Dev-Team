import { FormResponse, FormAnswer } from '@/utils/supabase/queries';

export interface PdfOptions {
  dateFrom?: string;
  dateTo?: string;
  includeImages: boolean;
  maxImagesPerInspection: number;
  includeEmptyAnswers: boolean;
  includeCoverPage: boolean;
  includeNaturalnessSummary: boolean;
  selectedSections: string[] | 'all';
  sortOrder: 'newest' | 'oldest';
  pageSize: 'LETTER' | 'A4';
  selectedResponseIds?: number[];
}

export type PdfRequest =
  | { mode: 'single'; responseId: number; options: PdfOptions }
  | { mode: 'site'; siteName: string; options: PdfOptions }
  | { mode: 'multi-site'; siteNames: string[]; options: PdfOptions };

export interface PdfAttachment {
  filename: string;
  caption: string | null;
  description: string | null;
  imageBuffer?: Buffer;
  contentType: string;
}

export interface PdfSiteData {
  siteName: string;
  county: string | null;
  responses: FormResponse[];
  attachmentsByResponse?: Map<number, PdfAttachment[]>;
}

export interface PdfReportData {
  sites: PdfSiteData[];
  generatedAt: string;
  options: PdfOptions;
}

export type { FormResponse, FormAnswer };
