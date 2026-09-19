import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import MainContent from '../../app/detail/[namesite]/new-report/MainContent';

const mockGetQuestionsOnline = jest.fn();

jest.mock('@/utils/supabase/queries', () => ({
  getQuestionsOnline: (...args: any[]) => mockGetQuestionsOnline(...args),
}));

const overallImpressionQuestions = [
  {
    id: 31,
    title: 'What is the Naturalness of the Site?',
    text: 'What is the Naturalness of the Site?',
    question_type: 'option',
    section: 5,
    answers: [
      { text: '4 = Great' },
      { text: '3 = Good' },
      { text: '2 = Passable' },
      { text: '1 = Bad' },
      { text: '0 = Terrible' },
      { text: 'Cannot Answer' },
    ],
    formorder: 1,
    is_required: true,
    sectionTitle: 'Overall Impression of the Site',
    sectionDescription: 'If you only answer one question, this is the one.',
    sectionHeader: 'Overall Impression',
  },
  {
    id: 32,
    title: 'How Healthy: comments',
    text: 'YOUR gut reaction and assessment.',
    question_type: 'text',
    section: 5,
    answers: [],
    formorder: 2,
    is_required: false,
    sectionTitle: 'Overall Impression of the Site',
    sectionDescription: 'If you only answer one question, this is the one.',
    sectionHeader: 'Overall Impression',
  },
  {
    id: 33,
    title: 'Change in Conditions?',
    text: 'If you have visited this site previously, what changes do you want to highlight?',
    question_type: 'text',
    section: 5,
    answers: [],
    formorder: 3,
    is_required: false,
    sectionTitle: 'Overall Impression of the Site',
    sectionDescription: 'If you only answer one question, this is the one.',
    sectionHeader: 'Overall Impression',
  },
];

async function renderOverallImpressionMainContent(mockOnChange: jest.Mock) {
  mockGetQuestionsOnline.mockResolvedValue(overallImpressionQuestions);

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
    expect(screen.getByText('Overall Impression')).toBeInTheDocument();
  });

  fireEvent.click(screen.getByText('Overall Impression'));

  await waitFor(() => {
    expect(
      screen.getByRole('heading', { level: 3, name: 'What is the Naturalness of the Site?' })
    ).toBeInTheDocument();
  });
}

describe('US 1.0.6 - Rank the Health of the Site', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
  });

  it('renders the overall impression section and reaches questions 2.1 to 2.3', async () => {
    await renderOverallImpressionMainContent(jest.fn());

    expect(screen.getByText('How Healthy: comments')).toBeInTheDocument();
    expect(screen.getByText('Change in Conditions?')).toBeInTheDocument();
  });

  it.each([
    '4 = Great',
    '3 = Good',
    '2 = Passable',
    '1 = Bad',
    '0 = Terrible',
  ])('user can select naturalness score "%s"', async (selectedOption) => {
    const mockOnChange = jest.fn();
    await renderOverallImpressionMainContent(mockOnChange);

    fireEvent.click(screen.getByText(selectedOption));

    const latestResponses = mockOnChange.mock.calls[mockOnChange.mock.calls.length - 1][0];
    expect(latestResponses[31]).toBe(selectedOption);

    const selectedRadio = screen.getByRole('radio', { name: selectedOption });
    expect(selectedRadio).toBeChecked();
  });

  it('user can enter comments on how healthy they felt the site was', async () => {
    const mockOnChange = jest.fn();
    await renderOverallImpressionMainContent(mockOnChange);

    const healthyCommentsInput = await screen.findByTestId('question-input-32');
    const healthyComment = 'Site felt healthy overall with strong native cover';

    fireEvent.change(healthyCommentsInput, { target: { value: healthyComment } });

    const latestResponses = mockOnChange.mock.calls[mockOnChange.mock.calls.length - 1][0];
    expect(latestResponses[32]).toBe(healthyComment);
  });

  it('user can enter comments about changes from their previous visit', async () => {
    const mockOnChange = jest.fn();
    await renderOverallImpressionMainContent(mockOnChange);

    const changeConditionsInput = await screen.findByTestId('question-input-33');
    const conditionsComment = 'Noticed new erosion near the west trail';

    fireEvent.change(changeConditionsInput, { target: { value: conditionsComment } });

    const latestResponses = mockOnChange.mock.calls[mockOnChange.mock.calls.length - 1][0];
    expect(latestResponses[33]).toBe(conditionsComment);
  });

  it('user can clear change-in-conditions comments if not applicable', async () => {
    const mockOnChange = jest.fn();
    await renderOverallImpressionMainContent(mockOnChange);

    const changeConditionsInput = await screen.findByTestId('question-input-33');

    fireEvent.change(changeConditionsInput, { target: { value: 'Temporary note' } });
    fireEvent.change(changeConditionsInput, { target: { value: '' } });

    const latestResponses = mockOnChange.mock.calls[mockOnChange.mock.calls.length - 1][0];
    expect(latestResponses[33]).toBe('');
  });
});
