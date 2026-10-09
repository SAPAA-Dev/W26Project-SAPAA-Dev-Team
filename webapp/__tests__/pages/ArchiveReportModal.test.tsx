import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import ArchiveReportModal from '../../app/admin/reports/components/ArchiveReportModal';
import type {
  FormResponse,
  SiteInspectionReportDeleteImpact,
} from '@/utils/supabase/queries';

const report: FormResponse = {
  id: 41,
  user_id: 'user-1',
  created_at: '2026-10-08T18:00:00.000Z',
  inspection_date: '2026-10-08',
  inspection_no: '2026-041',
  naturalness_score: '3',
  naturalness_details: null,
  steward: 'Alex Steward',
  answers: [],
};

const impact: SiteInspectionReportDeleteImpact = {
  responseId: 41,
  inspectionNo: '2026-041',
  inspectionDate: '2026-10-08',
  siteName: 'Duck Lake',
  answerCount: 18,
  attachmentCount: 2,
};

describe('ArchiveReportModal', () => {
  it('explains that answers and images are preserved before confirmation', () => {
    const onConfirm = jest.fn();
    render(
      <ArchiveReportModal
        report={report}
        siteName="Duck Lake"
        impact={impact}
        loading={false}
        archiving={false}
        error={null}
        onCancel={jest.fn()}
        onConfirm={onConfirm}
      />
    );

    expect(screen.getByRole('dialog', { name: 'Archive Site Inspection Report' })).toBeInTheDocument();
    expect(screen.getByText('18 answers will be preserved')).toBeInTheDocument();
    expect(screen.getByText('2 images will be preserved')).toBeInTheDocument();
    fireEvent.click(screen.getByTestId('confirm-archive-report'));
    expect(onConfirm).toHaveBeenCalledTimes(1);
  });

  it('does not enable confirmation until matching impact data is ready', () => {
    render(
      <ArchiveReportModal
        report={report}
        siteName="Duck Lake"
        impact={{ ...impact, responseId: 42 }}
        loading={false}
        archiving={false}
        error={null}
        onCancel={jest.fn()}
        onConfirm={jest.fn()}
      />
    );

    expect(screen.getByTestId('confirm-archive-report')).toBeDisabled();
    expect(screen.queryByText('18 answers will be preserved')).not.toBeInTheDocument();
  });

  it('keeps the dialog open and shows a server error', () => {
    render(
      <ArchiveReportModal
        report={report}
        siteName="Duck Lake"
        impact={impact}
        loading={false}
        archiving={false}
        error="Archive transaction failed"
        onCancel={jest.fn()}
        onConfirm={jest.fn()}
      />
    );

    expect(screen.getByRole('alert')).toHaveTextContent('Archive transaction failed');
    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });
});
