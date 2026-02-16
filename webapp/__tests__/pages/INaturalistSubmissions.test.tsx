import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import MainContent from '../../app/detail/[namesite]/new-report/MainContent';

const mockGetQuestionsOnline = jest.fn();

jest.mock('@/utils/supabase/queries', () => ({
  getQuestionsOnline: (...args: any[]) => mockGetQuestionsOnline(...args),
}));

const Q4_1_ID = 401;
const Q4_2_ID = 402;

const sectionFourQuestions = [
  {
    id: Q4_1_ID,
    title: 'Ease to Visit',
    text: 'Placeholder question to preserve 4.2 display numbering in this focused suite.',
    question_type: 'text',
    section: 7,
    answers: [],
    formorder: 1,
    is_required: false,
    sectionTitle: 'What is in the Site (that should be there)?',
    sectionDescription:
      'What plants, animals, landscapes, signage or facility features did you see? Comments can be provided. There are 6 questions in this section.',
    sectionHeader: 'Be There',
  },
  {
    id: Q4_2_ID,
    title: 'Submissions to iNaturalist',
    text: "Will you be submitting any postings to iNaturalist.ca? Be sure to 'pin' observations within the boundary of the PA.",
    question_type: 'option',
    section: 7,
    answers: [
      { text: 'Yes' },
      { text: 'No, Not this time' },
      { text: 'No, not a member of iNaturalist' },
      { text: 'What is iNaturalist?' },
      { text: 'Other/Not Applicable' },
    ],
    formorder: 2,
    is_required: true,
    sectionTitle: 'What is in the Site (that should be there)?',
    sectionDescription:
      'What plants, animals, landscapes, signage or facility features did you see? Comments can be provided. There are 6 questions in this section.',
    sectionHeader: 'Be There',
  },
];

async function renderINaturalistSubmissionsMainContent(mockOnChange: jest.Mock) {
  mockGetQuestionsOnline.mockResolvedValue(sectionFourQuestions);

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
    expect(screen.getByText('Be There')).toBeInTheDocument();
  });
  fireEvent.click(screen.getByText('Be There'));

  await waitFor(() => {
    expect(
      screen.getByRole('heading', { level: 3, name: 'Submissions to iNaturalist' })
    ).toBeInTheDocument();
  });
}

describe('US 1.0.10 - Indicate Submissions to iNaturalist', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
  });

  it('renders section 4 and the 4.2 Submissions to iNaturalist question', async () => {
    await renderINaturalistSubmissionsMainContent(jest.fn());

    expect(
      screen.getByRole('heading', { level: 2, name: 'What is in the Site (that should be there)?' })
    ).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { level: 3, name: 'Submissions to iNaturalist' })
    ).toBeInTheDocument();

    expect(screen.getByText('Yes')).toBeInTheDocument();
    expect(screen.getByText('No, Not this time')).toBeInTheDocument();
    expect(screen.getByText('No, not a member of iNaturalist')).toBeInTheDocument();
    expect(screen.getByText('What is iNaturalist?')).toBeInTheDocument();
    expect(screen.getByText('Other/Not Applicable')).toBeInTheDocument();
    expect(screen.getByText('Required')).toBeInTheDocument();
  });

  it.each([
    'Yes',
    'No, Not this time',
    'No, not a member of iNaturalist',
    'What is iNaturalist?',
    'Other/Not Applicable',
  ])('user can select "%s" for submissions to iNaturalist', async (selectedOption) => {
    const mockOnChange = jest.fn();
    await renderINaturalistSubmissionsMainContent(mockOnChange);

    fireEvent.click(screen.getByText(selectedOption));

    const latestResponses = mockOnChange.mock.calls[mockOnChange.mock.calls.length - 1][0];
    expect(latestResponses[Q4_2_ID]).toBe(selectedOption);

    const selectedRadio = screen.getByRole('radio', { name: selectedOption });
    expect(selectedRadio).toBeChecked();
  });

  it('selecting a new iNaturalist option replaces the previous one', async () => {
    const mockOnChange = jest.fn();
    await renderINaturalistSubmissionsMainContent(mockOnChange);

    fireEvent.click(screen.getByText('Yes'));
    fireEvent.click(screen.getByText('No, Not this time'));

    const latestResponses = mockOnChange.mock.calls[mockOnChange.mock.calls.length - 1][0];
    expect(latestResponses[Q4_2_ID]).toBe('No, Not this time');

    expect(screen.getByRole('radio', { name: 'Yes' })).not.toBeChecked();
    expect(screen.getByRole('radio', { name: 'No, Not this time' })).toBeChecked();
  });
});
