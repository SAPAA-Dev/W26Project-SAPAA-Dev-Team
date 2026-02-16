import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import MainContent from '../../app/detail/[namesite]/new-report/MainContent';

const mockGetQuestionsOnline = jest.fn();

jest.mock('@/utils/supabase/queries', () => ({
  getQuestionsOnline: (...args: any[]) => mockGetQuestionsOnline(...args),
}));

const Q6_1_ID = 601;
const Q6_2_ID = 602;
const Q6_3_ID = 603;
const Q6_4_ID = 604;

const sectionSixQuestions = [
  {
    id: Q6_1_ID,
    title: 'Remediation/ Protection Activities Needed',
    text: 'What are the most urgent actions to be undertaken by a volunteer or by the Alberta Government? Provide any details in the comments section below.',
    question_type: 'selectall',
    section: 9,
    answers: [
      { text: 'Nothing, all good' },
      { text: 'Cleanup' },
      { text: 'Fencing' },
      { text: 'Invasive Weed Removal' },
      { text: 'Re-vegetation' },
      { text: 'Signage/Sign Posts' },
      { text: 'Not Applicable' },
    ],
    formorder: 1,
    is_required: true,
    sectionTitle: 'What Needs to be (Has Been) Done?',
    sectionDescription: 'What, if anything, does the site need to improve/protect it?',
    sectionHeader: '2B Done',
  },
  {
    id: Q6_2_ID,
    title: 'Educating Nearby Residents about Site Usage',
    text: 'Are there nearby residents (full or part time) who might become Citizens Stewards? If so, include any contact details you observe (rural address, name, contact information as available).',
    question_type: 'text',
    section: 9,
    answers: [],
    formorder: 2,
    is_required: false,
    sectionTitle: 'What Needs to be (Has Been) Done?',
    sectionDescription: 'What, if anything, does the site need to improve/protect it?',
    sectionHeader: '2B Done',
  },
  {
    id: Q6_3_ID,
    title: 'How have you helped to protect this site?',
    text: 'You must have permission from the Government Land Manager to make any installations in a PA. Clean up, reporting, or talking to nearby residents do not require permission!',
    question_type: 'selectall',
    section: 9,
    answers: [
      { text: 'Visit and Submit This Report!' },
      { text: 'Cleanup (e.g. Trash removal)' },
      { text: 'Fencing' },
      { text: 'Signage/Sign Posts' },
      { text: 'Weed Control' },
      { text: 'Talked to nearby residents' },
      { text: 'Not Applicable' },
      { text: 'other' },
    ],
    formorder: 3,
    is_required: true,
    sectionTitle: 'What Needs to be (Has Been) Done?',
    sectionDescription: 'What, if anything, does the site need to improve/protect it?',
    sectionHeader: '2B Done',
  },
  {
    id: Q6_4_ID,
    title: 'Comments',
    text: 'Any comments, notes, or explanations not covered by the above?',
    question_type: 'text',
    section: 9,
    answers: [],
    formorder: 4,
    is_required: false,
    sectionTitle: 'What Needs to be (Has Been) Done?',
    sectionDescription: 'What, if anything, does the site need to improve/protect it?',
    sectionHeader: '2B Done',
  },
];

async function renderSectionSixMainContent(mockOnChange: jest.Mock) {
  mockGetQuestionsOnline.mockResolvedValue(sectionSixQuestions);

  function ControlledMainContent() {
    const [responses, setResponses] = React.useState<Record<number, any>>({});

    const handleChange = (nextResponses: Record<number, any>) => {
      setResponses(nextResponses);
      mockOnChange(nextResponses);
    };

    return <MainContent responses={responses} onResponsesChange={handleChange} />;
  }

  render(<ControlledMainContent />);

  await waitFor(() => {
    expect(screen.getByText('2B Done')).toBeInTheDocument();
  });
  fireEvent.click(screen.getByText('2B Done'));

  await waitFor(() => {
    expect(
      screen.getByRole('heading', { level: 3, name: 'Remediation/ Protection Activities Needed' })
    ).toBeInTheDocument();
  });
}

describe('US 1.0.15 - Inform SAPAA of Any Restorative Work that Needs to be Done / Was Done', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
  });

  it('renders section 6 questions 6.1 through 6.4', async () => {
    await renderSectionSixMainContent(jest.fn());

    expect(
      screen.getByRole('heading', { level: 2, name: 'What Needs to be (Has Been) Done?' })
    ).toBeInTheDocument();

    const headings = screen.getAllByRole('heading', { level: 3 }).map((h) => h.textContent?.trim());
    expect(headings).toEqual([
      'Remediation/ Protection Activities Needed',
      'Educating Nearby Residents about Site Usage',
      'How have you helped to protect this site?',
      'Comments',
    ]);
    expect(headings.length).toBe(4);
  });

  it('6.1 user can indicate urgently needed restorative actions', async () => {
    const mockOnChange = jest.fn();
    await renderSectionSixMainContent(mockOnChange);

    fireEvent.click(screen.getByText('Cleanup'));
    fireEvent.click(screen.getByText('Invasive Weed Removal'));

    const latestResponses = mockOnChange.mock.calls[mockOnChange.mock.calls.length - 1][0];
    expect(latestResponses[Q6_1_ID]).toEqual(expect.arrayContaining(['Cleanup', 'Invasive Weed Removal']));
  });

  it('6.2 user can add nearby resident contact information', async () => {
    const mockOnChange = jest.fn();
    await renderSectionSixMainContent(mockOnChange);

    const input = await screen.findByTestId(`question-input-${Q6_2_ID}`);
    const value = 'Rural address near south boundary, contact: Alex 780-555-0188';

    fireEvent.change(input, { target: { value } });

    const latestResponses = mockOnChange.mock.calls[mockOnChange.mock.calls.length - 1][0];
    expect(latestResponses[Q6_2_ID]).toBe(value);
  });

  it('6.3 user can indicate actions they have taken to help restore/protect the site', async () => {
    const mockOnChange = jest.fn();
    await renderSectionSixMainContent(mockOnChange);

    fireEvent.click(screen.getByText('Cleanup (e.g. Trash removal)'));
    fireEvent.click(screen.getByText('Talked to nearby residents'));

    const latestResponses = mockOnChange.mock.calls[mockOnChange.mock.calls.length - 1][0];
    expect(latestResponses[Q6_3_ID]).toEqual(
      expect.arrayContaining(['Cleanup (e.g. Trash removal)', 'Talked to nearby residents'])
    );
  });

  it('6.4 user can add general comments', async () => {
    const mockOnChange = jest.fn();
    await renderSectionSixMainContent(mockOnChange);

    const input = await screen.findByTestId(`question-input-${Q6_4_ID}`);
    const value = 'Follow-up signage replacement should be prioritized this season.';

    fireEvent.change(input, { target: { value } });

    const latestResponses = mockOnChange.mock.calls[mockOnChange.mock.calls.length - 1][0];
    expect(latestResponses[Q6_4_ID]).toBe(value);
  });

  it('6.4 comments can be cleared when not applicable', async () => {
    const mockOnChange = jest.fn();
    await renderSectionSixMainContent(mockOnChange);

    const input = await screen.findByTestId(`question-input-${Q6_4_ID}`);

    fireEvent.change(input, { target: { value: 'Temporary note' } });
    fireEvent.change(input, { target: { value: '' } });

    const latestResponses = mockOnChange.mock.calls[mockOnChange.mock.calls.length - 1][0];
    expect(latestResponses[Q6_4_ID]).toBe('');
  });
});
