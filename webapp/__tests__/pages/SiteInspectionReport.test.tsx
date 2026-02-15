import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import NewReportPage from '../../app/detail/[namesite]/new-report/page';
import MainContent from '../../app/detail/[namesite]/new-report/MainContent';
import StickyFooter from '../../app/detail/[namesite]/new-report/Footer';

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

jest.mock('@/utils/supabase/queries', () => ({
  getQuestionsOnline: (...args: any[]) => mockGetQuestionsOnline(...args),
  isSteward: (...args: any[]) => mockIsSteward(...args),
  getCurrentUserUid: (...args: any[]) => mockGetCurrentUserUid(...args),
  getCurrentSiteId: (...args: any[]) => mockGetCurrentSiteId(...args),
  addSiteInspectionReport: (...args: any[]) => mockAddSiteInspectionReport(...args),
  getQuestionResponseType: (...args: any[]) => mockGetQuestionResponseType(...args),
  uploadSiteInspectionAnswers: (...args: any[]) => mockUploadSiteInspectionAnswers(...args),
  getSitesOnline: (...args: any[]) => mockGetSitesOnline(...args),
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

const guestUser = {
  id: 'user-2',
  email: 'guest@example.com',
  user_metadata: { full_name: 'John Guest', role: 'guest', avatar_url: '' },
};

const personalInfoQuestions = [
  { id: 1, title: 'Steward Name', text: 'Enter the name of the steward conducting the inspection', question_type: 'text', section: 4, answers: [], formorder: 1, is_required: true, sectionTitle: 'Personal Information', sectionDescription: 'Enter your personal details', sectionHeader: 'Personal Info' },
  { id: 3, title: 'Guest First Name', text: 'Enter the first name of the guest', question_type: 'text', section: 4, answers: [], formorder: 3, is_required: false, sectionTitle: 'Personal Information', sectionDescription: 'Enter your personal details', sectionHeader: 'Personal Info' },
  { id: 4, title: 'Guest Last Name', text: 'Enter the last name of the guest', question_type: 'text', section: 4, answers: [], formorder: 4, is_required: false, sectionTitle: 'Personal Information', sectionDescription: 'Enter your personal details', sectionHeader: 'Personal Info' },
  { id: 5, title: 'Contact Email', text: 'Enter your contact email address', question_type: 'text', section: 4, answers: [], formorder: 5, is_required: true, sectionTitle: 'Personal Information', sectionDescription: 'Enter your personal details', sectionHeader: 'Personal Info' },
  { id: 6, title: 'Contact Phone', text: 'Enter your contact phone number', question_type: 'text', section: 4, answers: [], formorder: 6, is_required: false, sectionTitle: 'Personal Information', sectionDescription: 'Enter your personal details', sectionHeader: 'Personal Info' },
  { id: 7, title: 'SAPAA Membership', text: 'Are you a member of SAPAA?', question_type: 'option', section: 4, answers: [{ text: 'Yes' }, { text: 'No' }], formorder: 7, is_required: true, sectionTitle: 'Personal Information', sectionDescription: 'Enter your personal details', sectionHeader: 'Personal Info' },
];

// --- Helpers ---

function setupStewardMocks() {
  mockGetUser.mockResolvedValue({ data: { user: stewardUser }, error: null });
  mockIsSteward.mockResolvedValue(true);
  mockGetQuestionsOnline.mockResolvedValue(personalInfoQuestions);
  mockGetCurrentUserUid.mockResolvedValue('user-1');
  mockGetCurrentSiteId.mockResolvedValue('site-1');
}

function setupGuestMocks() {
  mockGetUser.mockResolvedValue({ data: { user: guestUser }, error: null });
  mockIsSteward.mockResolvedValue(false);
  mockGetQuestionsOnline.mockResolvedValue(personalInfoQuestions);
  mockGetCurrentUserUid.mockResolvedValue('user-2');
  mockGetCurrentSiteId.mockResolvedValue('site-1');
}

// Trip details questions (Q41, Q41.1, Q42, Q43) - section 4 (normalized to 1, the default active section)
const tripDetailsQuestions = [
  { id: 41, title: 'Reason for Visit (Q41)', text: 'What was the reason for your visit?', question_type: 'option', section: 4, answers: [{ text: 'Routine Inspection' }, { text: 'Follow-up' }, { text: 'Other' }], formorder: 1, is_required: true, sectionTitle: 'Trip Details', sectionDescription: 'Describe your trip', sectionHeader: 'Trip Details' },
  { id: 411, title: 'Reason Details (Q41.1)', text: 'Please provide additional details about your visit reason', question_type: 'text', section: 4, answers: [], formorder: 2, is_required: false, sectionTitle: 'Trip Details', sectionDescription: 'Describe your trip', sectionHeader: 'Trip Details' },
  { id: 42, title: 'Duration of Trip (Q42)', text: 'How long was your trip?', question_type: 'option', section: 4, answers: [{ text: 'Less than 1 hour' }, { text: '1-3 hours' }, { text: 'Half day' }, { text: 'Full day' }], formorder: 3, is_required: true, sectionTitle: 'Trip Details', sectionDescription: 'Describe your trip', sectionHeader: 'Trip Details' },
  { id: 43, title: 'Visit Details (Q43)', text: 'Please describe any additional visit details or comments', question_type: 'text', section: 4, answers: [], formorder: 4, is_required: false, sectionTitle: 'Trip Details', sectionDescription: 'Describe your trip', sectionHeader: 'Trip Details' },
];

// --- Tests ---

describe('US 1.0.2 – Add Personal Information to Site Inspection Form', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
  });

  it('user can enter steward name', async () => {
    mockGetQuestionsOnline.mockResolvedValue(personalInfoQuestions);
    const mockOnChange = jest.fn();
    render(<MainContent responses={{}} onResponsesChange={mockOnChange} />);

    await waitFor(() => {
      expect(screen.getByText(/Enter the name of the steward/i)).toBeInTheDocument();
    });

    // Steward name text input exists and accepts input
    const textareas = screen.getAllByPlaceholderText('Enter your response here...');
    fireEvent.change(textareas[0], { target: { value: 'Jane Steward' } });
    expect(mockOnChange.mock.calls[mockOnChange.mock.calls.length - 1][0][1]).toBe('Jane Steward');
  });

  it('user can enter first and last names of guests', async () => {
    mockGetQuestionsOnline.mockResolvedValue(personalInfoQuestions);
    const mockOnChange = jest.fn();
    render(<MainContent responses={{}} onResponsesChange={mockOnChange} />);

    await waitFor(() => {
      expect(screen.getByText(/Enter the first name of the guest/i)).toBeInTheDocument();
    });
    expect(screen.getByText(/Enter the last name of the guest/i)).toBeInTheDocument();

    const textareas = screen.getAllByPlaceholderText('Enter your response here...');

    fireEvent.change(textareas[1], { target: { value: 'John' } });
    expect(mockOnChange.mock.calls[mockOnChange.mock.calls.length - 1][0][3]).toBe('John');

    fireEvent.change(textareas[2], { target: { value: 'Doe' } });
    expect(mockOnChange.mock.calls[mockOnChange.mock.calls.length - 1][0][4]).toBe('Doe');
  });

  it('user can enter contact information (email and phone)', async () => {
    mockGetQuestionsOnline.mockResolvedValue(personalInfoQuestions);
    const mockOnChange = jest.fn();
    render(<MainContent responses={{}} onResponsesChange={mockOnChange} />);

    await waitFor(() => {
      expect(screen.getByText(/Enter your contact email address/i)).toBeInTheDocument();
    });
    expect(screen.getByText(/Enter your contact phone number/i)).toBeInTheDocument();

    const textareas = screen.getAllByPlaceholderText('Enter your response here...');

    fireEvent.change(textareas[3], { target: { value: 'test@example.com' } });
    expect(mockOnChange.mock.calls[mockOnChange.mock.calls.length - 1][0][5]).toBe('test@example.com');

    fireEvent.change(textareas[4], { target: { value: '780-555-1234' } });
    expect(mockOnChange.mock.calls[mockOnChange.mock.calls.length - 1][0][6]).toBe('780-555-1234');
  });

  it('user can indicate SAPAA membership', async () => {
    mockGetQuestionsOnline.mockResolvedValue(personalInfoQuestions);
    const mockOnChange = jest.fn();
    render(<MainContent responses={{}} onResponsesChange={mockOnChange} />);

    await waitFor(() => {
      expect(screen.getByText(/Are you a member of SAPAA/i)).toBeInTheDocument();
    });

    // Yes/No options render and can be selected
    expect(screen.getByText('Yes')).toBeInTheDocument();
    expect(screen.getByText('No')).toBeInTheDocument();

    fireEvent.click(screen.getByText('Yes'));
    expect(mockOnChange.mock.calls[mockOnChange.mock.calls.length - 1][0][7]).toBe('Yes');
  });

  it('steward users see their name and badge; non-stewards do not', async () => {
    setupStewardMocks();
    const { unmount } = render(<NewReportPage />);

    await waitFor(() => {
      expect(screen.getByText('Jane Steward')).toBeInTheDocument();
    });
    expect(screen.getByText('Steward')).toBeInTheDocument();
    expect(screen.queryByText(/The Fine Print Up Front/i)).not.toBeInTheDocument();

    unmount();

    // Non-steward: no badge, verification popup shown
    setupGuestMocks();
    render(<NewReportPage />);

    await waitFor(() => {
      expect(screen.getByText(/The Fine Print Up Front/i)).toBeInTheDocument();
    });
    expect(screen.queryByText('Steward')).not.toBeInTheDocument();
  });

  it('missing required fields display an error message', async () => {
    mockGetQuestionsOnline.mockResolvedValue(personalInfoQuestions);
    render(<MainContent responses={{}} onResponsesChange={jest.fn()} />);

    await waitFor(() => {
      expect(screen.getByText(/Steward Name/i)).toBeInTheDocument();
    });

    // 3 required questions should show Required badge (Steward Name, Contact Email, SAPAA Membership)
    const requiredBadges = screen.getAllByText('Required');
    expect(requiredBadges.length).toBe(3);

    // All 6 questions render
    const allQuestionTitles = screen.getAllByRole('heading', { level: 3 });
    expect(allQuestionTitles.length).toBe(6);
  });

  it('non-steward verification blocks form until completed', async () => {
    setupGuestMocks();
    render(<NewReportPage />);

    await waitFor(() => {
      expect(screen.getByText('Continue to Form')).toBeInTheDocument();
    });

    // Button disabled initially
    expect(screen.getByText('Continue to Form')).toBeDisabled();

    // Wrong text shows error
    fireEvent.change(screen.getByPlaceholderText('Type here...'), {
      target: { value: 'wrong text' },
    });
    expect(screen.getByText(/Text does not match/i)).toBeInTheDocument();

    // Correct text + terms accepted enables button
    fireEvent.change(screen.getByPlaceholderText('Type here...'), {
      target: { value: 'I am not a volunteer of SAPAA' },
    });
    fireEvent.click(screen.getAllByRole('checkbox')[0]);
    expect(screen.getByText('Continue to Form')).toBeEnabled();
  });

  it('footer tracks progress correctly', () => {
    // No responses
    const { unmount } = render(<StickyFooter questions={personalInfoQuestions} responses={{}} />);
    expect(screen.getByText('0 / 6 answered')).toBeInTheDocument();
    expect(screen.getByText('Review & Submit')).toBeInTheDocument();
    unmount();

    // Some responses, empty values not counted
    render(<StickyFooter questions={personalInfoQuestions} responses={{ 1: 'Jane', 5: 'test@example.com', 3: '', 4: [] }} />);
    expect(screen.getByText('2 / 6 answered')).toBeInTheDocument();
  });
});

describe('US 1.0.7 – Add Trip Details about how the trip went', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
  });

it('user can enter reasoning for visiting the site (Q41) and additional details (Q41.1)', async () => {
    mockGetQuestionsOnline.mockResolvedValue(tripDetailsQuestions);
    const mockOnChange = jest.fn();
    render(<MainContent responses={{}} onResponsesChange={mockOnChange} />);

    await waitFor(() => {
      expect(screen.getByText(/What was the reason for your visit/i)).toBeInTheDocument();
    });

    // Q41 - select a reason
    expect(screen.getByText('Routine Inspection')).toBeInTheDocument();
    expect(screen.getByText('Follow-up')).toBeInTheDocument();
    expect(screen.getByText('Other')).toBeInTheDocument();

    fireEvent.click(screen.getByText('Routine Inspection'));
    expect(mockOnChange.mock.calls[mockOnChange.mock.calls.length - 1][0][41]).toBe('Routine Inspection');

    // Q41.1 - optional text details
    expect(screen.getByText(/additional details about your visit reason/i)).toBeInTheDocument();
    const textareas = screen.getAllByPlaceholderText('Enter your response here...');
    fireEvent.change(textareas[0], { target: { value: 'Scheduled quarterly check' } });
    expect(mockOnChange.mock.calls[mockOnChange.mock.calls.length - 1][0][411]).toBe('Scheduled quarterly check');
  });

it('user can input duration of trip and comments (Q42)', async () => {
    mockGetQuestionsOnline.mockResolvedValue(tripDetailsQuestions);
    const mockOnChange = jest.fn();
    render(<MainContent responses={{}} onResponsesChange={mockOnChange} />);

    await waitFor(() => {
      expect(screen.getByText(/How long was your trip/i)).toBeInTheDocument();
    });

    expect(screen.getByText('Less than 1 hour')).toBeInTheDocument();
    expect(screen.getByText('1-3 hours')).toBeInTheDocument();
    expect(screen.getByText('Half day')).toBeInTheDocument();
    expect(screen.getByText('Full day')).toBeInTheDocument();

    fireEvent.click(screen.getByText('1-3 hours'));
    expect(mockOnChange.mock.calls[mockOnChange.mock.calls.length - 1][0][42]).toBe('1-3 hours');
  });

  it('user can input visit details (Q43)', async () => {
    mockGetQuestionsOnline.mockResolvedValue(tripDetailsQuestions);
    const mockOnChange = jest.fn();
    render(<MainContent responses={{}} onResponsesChange={mockOnChange} />);

    await waitFor(() => {
      expect(screen.getByText(/additional visit details or comments/i)).toBeInTheDocument();
    });

    const textareas = screen.getAllByPlaceholderText('Enter your response here...');
    // Q43 is the second textarea (after Q41.1)
    fireEvent.change(textareas[1], { target: { value: 'Trail was in good condition' } });
    expect(mockOnChange.mock.calls[mockOnChange.mock.calls.length - 1][0][43]).toBe('Trail was in good condition');
  });

  it('Q41 and Q42 are required; Q41.1 and Q43 are not', async () => {
    mockGetQuestionsOnline.mockResolvedValue(tripDetailsQuestions);
    render(<MainContent responses={{}} onResponsesChange={jest.fn()} />);

    await waitFor(() => {
      expect(screen.getByText(/What was the reason for your visit/i)).toBeInTheDocument();
    });

    // Only Q41 and Q42 should have Required badges
    const requiredBadges = screen.getAllByText('Required');
    expect(requiredBadges.length).toBe(2);
  });

  it('footer shows error for missing required Q41/Q42 but accepts missing optional Q41.1/Q43', () => {
    // Missing required fields: no Q41 or Q42 answered
    const { unmount } = render(<StickyFooter questions={tripDetailsQuestions} responses={{}} />);
    expect(screen.getByText('0 / 4 answered')).toBeInTheDocument();
    unmount();

    // Only optional Q41.1 and Q43 answered — required Q41/Q42 still missing
    const { unmount: unmount2 } = render(
      <StickyFooter questions={tripDetailsQuestions} responses={{ 411: 'Some details', 43: 'Looked good' }} />
    );
    expect(screen.getByText('2 / 4 answered')).toBeInTheDocument();
    unmount2();

    // All required answered, optional skipped — should be accepted
    render(
      <StickyFooter questions={tripDetailsQuestions} responses={{ 41: 'Routine Inspection', 42: '1-3 hours' }} />
    );
    expect(screen.getByText('2 / 4 answered')).toBeInTheDocument();
  });
});
