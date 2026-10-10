import React from 'react';
import { render, screen } from '@testing-library/react';
import { InspectionReportDocument } from '@/lib/pdf/inspectionReport';
import { PdfReportData } from '@/lib/pdf/types';

// Render the PDF tree as plain DOM so its text can be checked.
jest.mock('@react-pdf/renderer', () => {
  const Box = ({ children }: { children?: React.ReactNode }) => <div>{children}</div>;
  return {
    Document: Box,
    Page: Box,
    View: Box,
    Text: Box,
    Image: () => <img alt="" />,
    StyleSheet: { create: (s: unknown) => s },
  };
});

function reportWith(attachments: Array<{ filename: string; imageBuffer?: Buffer }>): PdfReportData {
  return {
    generatedAt: '2026-10-09T00:00:00Z',
    options: {
      includeImages: true,
      maxImagesPerInspection: 20,
      includeEmptyAnswers: false,
      includeCoverPage: false,
      includeNaturalnessSummary: false,
      selectedSections: 'all',
      hiddenQuestionIds: [],
      sortOrder: 'newest',
      pageSize: 'LETTER',
    },
    sites: [
      {
        siteName: 'Elk Island',
        county: null,
        responses: [
          {
            id: 10, user_id: 'u1', created_at: '2026-10-01T00:00:00Z', inspection_date: null,
            inspection_no: null, naturalness_score: null, naturalness_details: null, steward: null, answers: [],
          },
        ],
        attachmentsByResponse: new Map([
          [10, attachments.map((a) => ({ ...a, caption: null, identifier: null, contentType: 'image/jpeg' }))],
        ]),
      },
    ],
  };
}

describe('InspectionReportDocument attachments', () => {
  it('US 7.0.1 AT3: notes photos that could not be included', () => {
    render(
      <InspectionReportDocument
        data={reportWith([
          { filename: 'ok.jpg', imageBuffer: Buffer.from([0xff, 0xd8, 0xff]) },
          { filename: 'broken.webp' },
          { filename: 'missing.jpg' },
        ])}
      />
    );

    expect(screen.getByText('ok.jpg')).toBeInTheDocument();
    expect(screen.getByText('2 photos could not be included in this PDF.')).toBeInTheDocument();
  });

  it('shows no note when every photo is included', () => {
    render(
      <InspectionReportDocument
        data={reportWith([{ filename: 'ok.jpg', imageBuffer: Buffer.from([0xff, 0xd8, 0xff]) }])}
      />
    );

    expect(screen.queryByText(/could not be included/)).not.toBeInTheDocument();
  });
});
