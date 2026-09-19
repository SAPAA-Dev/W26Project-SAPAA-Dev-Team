import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import MainContent from '../../app/detail/[namesite]/new-report/MainContent';

const mockGetQuestionsOnline = jest.fn();

jest.mock('@/utils/supabase/queries', () => ({
  getQuestionsOnline: (...args: any[]) => mockGetQuestionsOnline(...args),
}));

const designationProtectedAreaQuestions = [
  {
    id: 45,
    title: 'Designation as a Protected Area',
    text: 'How do you know it is a natural area?',
    question_type: 'selectall',
    section: 7,
    answers: [
      { text: 'Signage' },
      { text: 'Fencing' },
      { text: 'Stiles, Gates' },
      { text: 'Exists but in disrepair' },
      { text: 'None Noted' },
      { text: 'Not Applicable' },
      { text: 'other' },
    ],
    formorder: 525,
    is_required: true,
    sectionTitle: 'What is in the Site (that should be there)?',
    sectionDescription: 'What plants, animals, landscapes, signage or facility features did you see? Comments can be provided. There are 6 questions in this section.',
    sectionHeader: 'Be There',
  },
];

async function renderDesignationProtectedAreaMainContent(mockOnChange: jest.Mock) {
  mockGetQuestionsOnline.mockResolvedValue(designationProtectedAreaQuestions);

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
    expect(screen.getByText('Designation as a Protected Area')).toBeInTheDocument();
  });
}

describe('US 1.0.9 - Indicate how the area is designated as protected', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
  });

  it('user can indicate protected status by selecting signage', async () => {
    const mockOnChange = jest.fn();
    await renderDesignationProtectedAreaMainContent(mockOnChange);

    fireEvent.click(screen.getByText('Signage'));

    const latestResponses = mockOnChange.mock.calls[mockOnChange.mock.calls.length - 1][0];
    expect(latestResponses[45]).toEqual(expect.arrayContaining(['Signage']));
  });

  it('user can indicate protected status by selecting fencing', async () => {
    const mockOnChange = jest.fn();
    await renderDesignationProtectedAreaMainContent(mockOnChange);

    fireEvent.click(screen.getByText('Fencing'));

    const latestResponses = mockOnChange.mock.calls[mockOnChange.mock.calls.length - 1][0];
    expect(latestResponses[45]).toEqual(expect.arrayContaining(['Fencing']));
  });

  it.each([
    'Signage',
    'Fencing',
    'Exists but in disrepair',
    'Not Applicable',
  ])('user can select "%s" as protected-area evidence', async (optionText) => {
    const mockOnChange = jest.fn();
    await renderDesignationProtectedAreaMainContent(mockOnChange);

    fireEvent.click(screen.getByText(optionText));

    const latestResponses = mockOnChange.mock.calls[mockOnChange.mock.calls.length - 1][0];
    expect(latestResponses[45]).toEqual(expect.arrayContaining([optionText]));
  });

  it('user can deselect a protected-area indicator option', async () => {
    const mockOnChange = jest.fn();
    await renderDesignationProtectedAreaMainContent(mockOnChange);

    fireEvent.click(screen.getByText('Signage'));
    fireEvent.click(screen.getByText('Signage'));

    const latestResponses = mockOnChange.mock.calls[mockOnChange.mock.calls.length - 1][0];
    expect(latestResponses[45]).not.toContain('Signage');
  });
});
