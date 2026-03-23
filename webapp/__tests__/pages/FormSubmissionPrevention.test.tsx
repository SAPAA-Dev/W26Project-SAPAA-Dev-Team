import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import NewReportPage from '../../app/detail/[namesite]/new-report/page';

// --- Mock setup ---

const mockPush = jest.fn();
const mockBack = jest.fn();

jest.mock('next/navigation', () => ({
  useParams: () => ({ namesite: 'Test%20Site' }),
  useRouter: () => ({ push: mockPush, back: mockBack }),
  usePathname: () => '/detail/Test%20Site/new-report',
}));

jest.mock('next/image', () => (props: any) => <img {...props} alt={props.alt} />);

const mockGetQuestionsOnline = jest.fn();
const mockIsSteward = jest.fn();
const mockGetCurrentUserUid = jest.fn();
const mockGetCurrentSiteId = jest.fn();
const mockAddSiteInspectionReport = jest.fn();
const mockGetQuestionResponseType = jest.fn();
const mockUploadSiteInspectionAnswers = jest.fn();
const mockGetSitesOnline = jest.fn();
const mockInsertInspectionAttachments = jest.fn();
const mockRollbackSiteInspectionSubmission = jest.fn();

jest.mock('@/utils/supabase/queries', () => ({
  getQuestionsOnline: (...args: any[]) => mockGetQuestionsOnline(...args),
  isSteward: (...args: any[]) => mockIsSteward(...args),
  getCurrentUserUid: (...args: any[]) => mockGetCurrentUserUid(...args),
  getCurrentSiteId: (...args: any[]) => mockGetCurrentSiteId(...args),
  addSiteInspectionReport: (...args: any[]) => mockAddSiteInspectionReport(...args),
  getQuestionResponseType: (...args: any[]) => mockGetQuestionResponseType(...args),
  uploadSiteInspectionAnswers: (...args: any[]) => mockUploadSiteInspectionAnswers(...args),
  getSitesOnline: (...args: any[]) => mockGetSitesOnline(...args),
  insertInspectionAttachments: (...args: any[]) => mockInsertInspectionAttachments(...args),
  rollbackSiteInspectionSubmission: (...args: any[]) => mockRollbackSiteInspectionSubmission(...args),
}));

const mockGetUser = jest.fn();

jest.mock('@/utils/supabase/client', () => ({
  createClient: () => ({
    auth: {
      getUser: mockGetUser,
    },
  }),
}));

// --- Test data ---

const stewardUser = {
  id: 'user-1',
  email: 'steward@sapaa.org',
  user_metadata: { full_name: 'Jane Steward', role: 'steward', avatar_url: '' },
};

const mockQuestion = [
  { 
    id: 1, 
    title: 'Test Question', 
    text: 'Test Answer', 
    question_type: 'option', 
    section: 4, 
    answers: [{ text: 'Yes' }, { text: 'No' }], 
    formorder: 1, 
    is_required: true, 
    sectionTitle: 'Test', 
    sectionDescription: 'Test', 
    sectionHeader: 'Test' 
  }
];

// --- Helper functions ---

function setupStewardMocks() {
  mockGetUser.mockResolvedValue({ data: { user: stewardUser }, error: null });
  mockIsSteward.mockResolvedValue(true);
  mockGetCurrentUserUid.mockResolvedValue('user-1');
  mockGetCurrentSiteId.mockResolvedValue('1');
}

// --- Tests ---

describe('Prevent Multiple Form Submissions', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
    setupStewardMocks();
  });

  it('disables submit button and shows "Submitting..." text during submission', async () => {
    mockGetQuestionsOnline.mockResolvedValue(mockQuestion);
    mockAddSiteInspectionReport.mockResolvedValue({ id: 500 });
    mockGetQuestionResponseType.mockResolvedValue([{ question_id: 1, obs_value: 1, obs_comm: 0 }]);
    
    // Make the submission take some time to complete
    mockUploadSiteInspectionAnswers.mockImplementation(() => 
      new Promise(resolve => setTimeout(resolve, 100))
    );

    render(<NewReportPage />);

    // Answer the required question
    const option = await screen.findByText('Yes');
    fireEvent.click(option);

    const submitButton = screen.getByRole('button', { name: /Review & Submit/i });
    
    // Verify button is initially enabled
    expect(submitButton).toBeEnabled();
    expect(submitButton).toHaveTextContent('Review & Submit');

    // Click submit
    fireEvent.click(submitButton);

    // Verify button is now disabled and shows "Submitting..."
    await waitFor(() => {
      expect(submitButton).toBeDisabled();
      expect(submitButton).toHaveTextContent('Submitting...');
    });
  });

  it('prevents multiple submissions when button is clicked multiple times rapidly', async () => {
    mockGetQuestionsOnline.mockResolvedValue(mockQuestion);
    mockAddSiteInspectionReport.mockResolvedValue({ id: 500 });
    mockGetQuestionResponseType.mockResolvedValue([{ question_id: 1, obs_value: 1, obs_comm: 0 }]);
    
    // Make the submission take some time to complete
    mockUploadSiteInspectionAnswers.mockImplementation(() => 
      new Promise(resolve => setTimeout(resolve, 200))
    );

    render(<NewReportPage />);

    // Answer the required question
    const option = await screen.findByText('Yes');
    fireEvent.click(option);

    const submitButton = screen.getByRole('button', { name: /Review & Submit/i });

    // Click submit button multiple times rapidly
    fireEvent.click(submitButton);
    fireEvent.click(submitButton);
    fireEvent.click(submitButton);

    // Verify that addSiteInspectionReport was only called once
    await waitFor(() => {
      expect(mockAddSiteInspectionReport).toHaveBeenCalledTimes(1);
      expect(mockUploadSiteInspectionAnswers).toHaveBeenCalledTimes(1);
    });
  });

  it('re-enables submission if an error occurs during submission', async () => {
    mockGetQuestionsOnline.mockResolvedValue(mockQuestion);
    mockAddSiteInspectionReport.mockRejectedValue(new Error('Submission failed'));

    render(<NewReportPage />);

    // Answer the required question
    const option = await screen.findByText('Yes');
    fireEvent.click(option);

    const submitButton = screen.getByRole('button', { name: /Review & Submit/i });

    // Click submit
    fireEvent.click(submitButton);

    // Wait for button to be disabled during submission
    await waitFor(() => {
      expect(submitButton).toBeDisabled();
    });

    // Wait for error to be handled and button to be re-enabled
    await waitFor(() => {
      expect(submitButton).toBeEnabled();
      expect(submitButton).toHaveTextContent('Review & Submit');
    }, { timeout: 3000 });
  });

  it('does not call API functions if already submitting', async () => {
    mockGetQuestionsOnline.mockResolvedValue(mockQuestion);
    mockAddSiteInspectionReport.mockResolvedValue({ id: 500 });
    mockGetQuestionResponseType.mockResolvedValue([{ question_id: 1, obs_value: 1, obs_comm: 0 }]);
    
    // Make the submission take longer
    mockUploadSiteInspectionAnswers.mockImplementation(() => 
      new Promise(resolve => setTimeout(resolve, 300))
    );

    render(<NewReportPage />);

    // Answer the required question
    const option = await screen.findByText('Yes');
    fireEvent.click(option);

    const submitButton = screen.getByRole('button', { name: /Review & Submit/i });

    // Clear mock calls from initialization
    mockAddSiteInspectionReport.mockClear();
    mockGetQuestionResponseType.mockClear();

    // First click
    fireEvent.click(submitButton);

    // Wait for submission to start
    await waitFor(() => {
      expect(submitButton).toBeDisabled();
    });

    // Try to click again while submitting
    fireEvent.click(submitButton);
    fireEvent.click(submitButton);

    // Wait for submission to complete
    await waitFor(() => {
      expect(mockUploadSiteInspectionAnswers).toHaveBeenCalledTimes(1);
    }, { timeout: 1000 });

    // Verify addSiteInspectionReport was only called once (for the first submission)
    expect(mockAddSiteInspectionReport).toHaveBeenCalledTimes(1);
  });

  it('maintains disabled state for the entire submission process', async () => {
    mockGetQuestionsOnline.mockResolvedValue(mockQuestion);
    mockAddSiteInspectionReport.mockResolvedValue({ id: 500 });
    mockGetQuestionResponseType.mockResolvedValue([{ question_id: 1, obs_value: 1, obs_comm: 0 }]);
    
    // Simulate multi-step submission with delays
    mockUploadSiteInspectionAnswers.mockImplementation(() => 
      new Promise(resolve => setTimeout(resolve, 150))
    );

    render(<NewReportPage />);

    // Answer the required question
    const option = await screen.findByText('Yes');
    fireEvent.click(option);

    const submitButton = screen.getByRole('button', { name: /Review & Submit/i });

    // Click submit
    fireEvent.click(submitButton);

    // Check that button stays disabled throughout the process
    await waitFor(() => {
      expect(submitButton).toBeDisabled();
    });

    // Check at various intervals that button is still disabled
    await new Promise(resolve => setTimeout(resolve, 50));
    expect(submitButton).toBeDisabled();
    
    await new Promise(resolve => setTimeout(resolve, 50));
    expect(submitButton).toBeDisabled();
  });

  it('allows user to submit again after a failed submission', async () => {
    mockGetQuestionsOnline.mockResolvedValue(mockQuestion);
    
    // First submission fails
    mockAddSiteInspectionReport.mockRejectedValueOnce(new Error('Network error'));
    // Second submission succeeds
    mockAddSiteInspectionReport.mockResolvedValueOnce({ id: 500 });
    mockGetQuestionResponseType.mockResolvedValue([{ question_id: 1, obs_value: 1, obs_comm: 0 }]);
    mockUploadSiteInspectionAnswers.mockResolvedValue(undefined);

    render(<NewReportPage />);

    // Answer the required question
    const option = await screen.findByText('Yes');
    fireEvent.click(option);

    const submitButton = screen.getByRole('button', { name: /Review & Submit/i });

    // First submission attempt
    fireEvent.click(submitButton);

    // Wait for submission to fail and button to be re-enabled
    await waitFor(() => {
      expect(submitButton).toBeEnabled();
    }, { timeout: 3000 });

    // Try to submit again
    fireEvent.click(submitButton);

    // Verify second submission was attempted
    await waitFor(() => {
      expect(mockAddSiteInspectionReport).toHaveBeenCalledTimes(2);
    });
  });

  it('rolls back the created report if submission fails after the response row is created', async () => {
    mockGetQuestionsOnline.mockResolvedValue(mockQuestion);
    mockAddSiteInspectionReport.mockResolvedValue({ id: 500 });
    mockGetQuestionResponseType.mockResolvedValue([{ question_id: 1, obs_value: 1, obs_comm: 0 }]);
    mockUploadSiteInspectionAnswers.mockRejectedValue(new Error('Answers failed'));

    render(<NewReportPage />);

    const option = await screen.findByText('Yes');
    fireEvent.click(option);

    const submitButton = screen.getByRole('button', { name: /Review & Submit/i });
    mockPush.mockClear();
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockRollbackSiteInspectionSubmission).toHaveBeenCalledWith(500);
    });

    await waitFor(() => {
      expect(submitButton).toBeEnabled();
    });

    expect(mockPush).not.toHaveBeenCalled();
  });

  it('does not submit when required popup is showing', async () => {
    const requiredQuestion = [
      { 
        id: 1, 
        title: 'Required Test Question', 
        text: 'This is required', 
        question_type: 'option', 
        section: 4, 
        answers: [{ text: 'Yes' }, { text: 'No' }], 
        formorder: 1, 
        is_required: true, 
        sectionTitle: 'Test', 
        sectionDescription: 'Test', 
        sectionHeader: 'Test' 
      }
    ];

    mockGetQuestionsOnline.mockResolvedValue(requiredQuestion);

    render(<NewReportPage />);

    // Don't answer the required question
    const submitButton = await screen.findByRole('button', { name: /Review & Submit/i });
    await waitFor(() => {
      expect(submitButton).toBeEnabled();
    });

    // Try to submit without answering required question
    fireEvent.click(submitButton);

    // Verify popup appears
    await waitFor(() => {
      expect(screen.getByText(/Required Questions Missing/i)).toBeInTheDocument();
    });

    // Verify submission was not attempted
    expect(mockAddSiteInspectionReport).not.toHaveBeenCalled();
    expect(mockUploadSiteInspectionAnswers).not.toHaveBeenCalled();
  });

  it('keeps button enabled when validation fails before submission starts', async () => {
    const requiredQuestion = [
      { 
        id: 1, 
        title: 'Required Test Question', 
        text: 'This is required', 
        question_type: 'option', 
        section: 4, 
        answers: [{ text: 'Yes' }, { text: 'No' }], 
        formorder: 1, 
        is_required: true, 
        sectionTitle: 'Test', 
        sectionDescription: 'Test', 
        sectionHeader: 'Test' 
      }
    ];

    mockGetQuestionsOnline.mockResolvedValue(requiredQuestion);

    render(<NewReportPage />);

    const submitButton = await screen.findByRole('button', { name: /Review & Submit/i });
    await waitFor(() => {
      expect(submitButton).toBeEnabled();
    });

    // Try to submit without answering required question
    fireEvent.click(submitButton);

    // Wait for validation to complete
    await waitFor(() => {
      expect(screen.getByText(/Required Questions Missing/i)).toBeInTheDocument();
    });

    // Button should still be enabled since validation failed before submission started
    expect(submitButton).toBeEnabled();
  });
});
