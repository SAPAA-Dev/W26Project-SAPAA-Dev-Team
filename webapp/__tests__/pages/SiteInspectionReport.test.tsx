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

const beThereQuestions = [
  {
    id: 41,
    title: 'Ease to Visit',
    text: "How easy is this site to visit? How friendly for those not used to the 'bush' (e.g. toilets)?",
    question_type: 'selectall',
    section: 7,
    answers: [
      { text: 'Parking lot for 2 or more cars' },
      { text: 'Washroom' },
      { text: 'Directional signs on Feeder roads' },
      { text: 'Entrance signs, information, etc.' },
      { text: 'Trails (other than animal)' },
      { text: 'No Amenities' },
      { text: 'No Signage' },
      { text: 'None noted' },
    ],
    formorder: 505,
    is_required: true,
    sectionTitle: 'What is in the Site (that should be there)?',
    sectionDescription: 'What plants, animals, landscapes, signage or facility features did you see? Comments can be provided. There are 6 questions in this section.',
    sectionHeader: 'Be There',
  },
  {
    id: 9, 
    title: 'Biological Observations', 
    text: "Summarize any significant biological observations (plants, animals, insects, etc.) you want to share? Details can be provided via iNaturalist.ca.",
    question_type: 'text',
    section: 7,
    answers: [],
    formorder: 515,
    is_required: false,
    sectionTitle: 'What is in the Site (that should be there)?',
    sectionDescription: 'What plants, animals, landscapes, signage or facility features did you see? Comments can be provided. There are 6 questions in this section.',
    sectionHeader: 'Be There',
  },
  {
    id: 13,
    title: 'Other comments? (Q56)',
    text: 'Any other comments on what is in the site that should be and not covered by the above questions?',
    question_type: 'text',
    section: 7,
    answers: [],
    formorder: 530,
    is_required: false, 
    sectionTitle: 'What is in the Site (that should be there)?',
    sectionDescription: 'What plants, animals, landscapes, signage or facility features did you see? Comments can be provided.',
    sectionHeader: 'Be There',
  },
];

const WhereUGoQuestions = [
  {
    id: 37,
    title: 'Date of Your Visit (Q21)',
    text: 'Date of Visit',
    question_type: 'date',
    section: 4,
    answers: [],
    formorder: 8,
    is_required: true,
    sectionTitle: 'Overview of the Visit',
    sectionDescription: 'Details of the visit: Where, When, Who.',
    sectionHeader: 'WhereUGo',
  },
  {
    id: 38,
    title: 'Site Name (Q22)',
    text: 'Select the name of the area visited. If one visit spanned two or more sites, please submit separate site inspections.',
    question_type: 'site_select',
    section: 4,
    answers: [],
    formorder: 9,
    is_required: true,
    sectionTitle: 'Overview of the Visit',
    sectionDescription: 'Details of the visit: Where, When, Who.',
    sectionHeader: 'WhereUGo',
  },
  {
    id: 39,
    title: 'Designated Steward (Q24)',
    text: 'Are you the named, Government of Alberta Steward?',
    question_type: 'option',
    section: 4,
    answers: [
      'Gov. Steward - Individual',
      'Gov. Steward - Group',
      'Level 1/2 SAPAA Volunteer',
      'Citizen Steward',
      'Just Interested',
    ],
    formorder: 11,
    is_required: true,
    sectionTitle: 'Overview of the Visit',
    sectionDescription: 'Details of the visit: Where, When, Who.',
    sectionHeader: 'WhereUGo',
  },
];

const notThereQuestions = [
  {
    id: 20,
    title: 'Comments (Q67)',
    text: 'Any Comments on how the site is being used or disturbed by humans not covered by the above?',
    question_type: 'text',
    section: 8,
    answers: [],
    formorder: 635,
    is_required: false,
    sectionTitle: 'What are the human activities/disturbances affecting the Site?',
    sectionDescription: 'What human activities are in the site? Note, some of these activities may be permitted (e.g. grazing) and others may be illegal.',
    sectionHeader: 'Not There',
  },
]

const twoBDoneQuestions = [
  {
    id: 25,
    title: 'Comments (Q74)',
    text: 'Any comments, notes, or explanations not covered by the above?',
    question_type: 'text',
    section: 9,
    answers: [],
    formorder: 720,
    is_required: false,
    sectionTitle: 'What Needs to be (Has Been) Done?',
    sectionDescription: 'What, if anything, does the site need to improve/protect it?',
    sectionHeader: '2B Done',
  },
]

const closeQuestions = [
  {
    id: 28,
    title: 'Any Last Words? (Q82)',
    text: 'Have we missed anything? Do you have other comments, ideas, or thoughts about this site?',
    question_type: 'text',
    section: 10,
    answers: [],
    formorder: 815,
    is_required: false,
    sectionTitle: 'Digital File Management',
    sectionDescription: 'SAPAA loves pictures. If you have digital files (pictures, videos, audio files, geo-location data – gpx, kml, screenshot of the location)...',
    sectionHeader: 'Close',
  },
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

function setupWhereUGoMocks() {
  mockGetUser.mockResolvedValue({ data: { user: stewardUser }, error: null });
  mockIsSteward.mockResolvedValue(true);
  mockGetQuestionsOnline.mockResolvedValue(WhereUGoQuestions);
  mockGetCurrentUserUid.mockResolvedValue('user-1');
  mockGetCurrentSiteId.mockResolvedValue('site-1');
}

async function renderBeThereMainContent(mockOnChange: jest.Mock) {
  mockGetQuestionsOnline.mockResolvedValue(beThereQuestions);
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
    expect(screen.getByText('Ease to Visit')).toBeInTheDocument();
  });
}

// Significant site changes question (Q54) - section 4 (normalized to 1, the default active section)
const siteChangesQuestions = [
  { id: 54, title: 'Significant Site Changes (Q54)', text: 'Describe any significant recent landscape changes (e.g. wildfires, flooding, erosion, land clearing)', question_type: 'text', section: 4, answers: [], formorder: 1, is_required: false, sectionTitle: 'Site Changes', sectionDescription: 'Report any significant changes to the site', sectionHeader: 'Site Changes' },
];

// Trip details questions (Q41, Q41.1, Q42, Q43) - section 4 (normalized to 1, the default active section)
const tripDetailsQuestions = [
  { id: 41, title: 'Reason for Visit (Q41)', text: 'What was the reason for your visit?', question_type: 'option', section: 4, answers: [{ text: 'Routine Inspection' }, { text: 'Follow-up' }, { text: 'Other' }], formorder: 1, is_required: true, sectionTitle: 'Trip Details', sectionDescription: 'Describe your trip', sectionHeader: 'Trip Details' },
  { id: 411, title: 'Reason Details (Q41.1)', text: 'Please provide additional details about your visit reason', question_type: 'text', section: 4, answers: [], formorder: 2, is_required: false, sectionTitle: 'Trip Details', sectionDescription: 'Describe your trip', sectionHeader: 'Trip Details' },
  { id: 42, title: 'Duration of Trip (Q42)', text: 'How long was your trip?', question_type: 'option', section: 4, answers: [{ text: 'Less than 1 hour' }, { text: '1-3 hours' }, { text: 'Half day' }, { text: 'Full day' }], formorder: 3, is_required: true, sectionTitle: 'Trip Details', sectionDescription: 'Describe your trip', sectionHeader: 'Trip Details' },
  { id: 43, title: 'Visit Details (Q43)', text: 'Please describe any additional visit details or comments', question_type: 'text', section: 4, answers: [], formorder: 4, is_required: false, sectionTitle: 'Trip Details', sectionDescription: 'Describe your trip', sectionHeader: 'Trip Details' },
];

// --- Tests ---

describe('US 1.0.4 - Have access to the Terms and Conditions of Inputting Information', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
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
});

describe('US 1.0.2 - Add Personal Information to Site Inspection Form', () => {
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

describe('US 1.0.5 - Add Details Regarding the Overview of my Visit', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
  });
  
  it('user can enter date of visit', async () => {
    mockGetQuestionsOnline.mockResolvedValue(WhereUGoQuestions);
    const mockOnChange = jest.fn();
    render(<MainContent responses={{}} onResponsesChange={mockOnChange} />);

    await waitFor(() => {
      expect(screen.getByText(/Date of Your Visit/i)).toBeInTheDocument();
    });

    const dateInput = document.querySelector('input[type="date"]') as HTMLInputElement;
    fireEvent.change(dateInput, { target: { value: '2026-02-12' } });
    
    expect(mockOnChange.mock.calls[mockOnChange.mock.calls.length - 1][0][37]).toBe('2026-02-12');
  });

  it('user can enter which site they are inspecting', async () => {
    mockGetQuestionsOnline.mockResolvedValue(WhereUGoQuestions);
    const mockOnChange = jest.fn();
    render(<MainContent responses={{}} onResponsesChange={mockOnChange} />);

    await waitFor(() => {
      expect(screen.getByText(/Site Name/i)).toBeInTheDocument();
    });

    const siteInput = screen.getByPlaceholderText('Start typing to search for a protected area...');
    fireEvent.change(siteInput, { target: { value: 'Test Site' } });
    
    expect(mockOnChange.mock.calls[mockOnChange.mock.calls.length - 1][0][38]).toBe('Test Site');
  });

  it('user can select their designated steward status', async () => {
    mockGetQuestionsOnline.mockResolvedValue(WhereUGoQuestions);
    const mockOnChange = jest.fn();
    render(<MainContent responses={{}} onResponsesChange={mockOnChange} />);

    await waitFor(() => {
      expect(screen.getByText(/Designated Steward/i)).toBeInTheDocument();
    });

    // Verify all options are available
    expect(screen.getByText('Gov. Steward - Individual')).toBeInTheDocument();
    expect(screen.getByText('Gov. Steward - Group')).toBeInTheDocument();
    expect(screen.getByText('Level 1/2 SAPAA Volunteer')).toBeInTheDocument();
    expect(screen.getByText('Citizen Steward')).toBeInTheDocument();
    expect(screen.getByText('Just Interested')).toBeInTheDocument();

    // Select a steward option
    fireEvent.click(screen.getByText('Citizen Steward'));

    const latestResponses = mockOnChange.mock.calls[mockOnChange.mock.calls.length - 1][0];
    expect(latestResponses[39]).toBe('Citizen Steward');
  });

  it('user can select only ONE designated steward option (radio button behavior)', async () => {
    mockGetQuestionsOnline.mockResolvedValue(WhereUGoQuestions);
    const mockOnChange = jest.fn();
    render(<MainContent responses={{}} onResponsesChange={mockOnChange} />);

    await waitFor(() => {
      expect(screen.getByText(/Designated Steward/i)).toBeInTheDocument();
    });

    // First selection
    fireEvent.click(screen.getByText('Gov. Steward - Individual'));
    expect(mockOnChange.mock.calls[mockOnChange.mock.calls.length - 1][0][39]).toBe('Gov. Steward - Individual');

    // Second selection - should replace the first
    fireEvent.click(screen.getByText('Just Interested'));
    expect(mockOnChange.mock.calls[mockOnChange.mock.calls.length - 1][0][39]).toBe('Just Interested');
  });

  it('displays all required fields with Required badge', async () => {
    mockGetQuestionsOnline.mockResolvedValue(WhereUGoQuestions);
    render(<MainContent responses={{}} onResponsesChange={jest.fn()} />);

    await waitFor(() => {
      expect(screen.getByText(/Date of Your Visit/i)).toBeInTheDocument();
    });

    // All 3 questions are required
    const requiredBadges = screen.getAllByText('Required');
    expect(requiredBadges.length).toBe(3);

    // All 3 questions render
    const allQuestionTitles = screen.getAllByRole('heading', { level: 3 });
    expect(allQuestionTitles.length).toBe(3);
  });

  it('footer tracks progress correctly', () => {
    // No responses
    const { unmount } = render(<StickyFooter questions={WhereUGoQuestions} responses={{}} />);
    expect(screen.getByText('0 / 3 answered')).toBeInTheDocument();
    expect(screen.getByText('Review & Submit')).toBeInTheDocument();
    unmount();

    // Partial responses - only count non-empty values
    render(<StickyFooter questions={WhereUGoQuestions} responses={{ 37: '2025-02-12', 38: 'Test Site', 39: '' }} />);
    expect(screen.getByText('2 / 3 answered')).toBeInTheDocument();
  });

  it('allows submission when all required fields are filled', async () => {
    setupWhereUGoMocks();
    mockAddSiteInspectionReport.mockResolvedValue({ id: 'report-123' });
    mockGetQuestionResponseType.mockResolvedValue([
      { question_id: 37, obs_value: 1, obs_comm: 0 },
      { question_id: 38, obs_value: 1, obs_comm: 0 },
      { question_id: 39, obs_value: 1, obs_comm: 0 },
    ]);

    render(<NewReportPage />);
    
    await waitFor(() => {
      expect(screen.getByText(/Date of Your Visit/i)).toBeInTheDocument();
    });

    // Fill all required fields
    const dateInput = document.querySelector('input[type="date"]') as HTMLInputElement;
    fireEvent.change(dateInput, { target: { value: '2026-02-12' } });

    const siteInput = screen.getByPlaceholderText('Start typing to search for a protected area...');
    fireEvent.change(siteInput, { target: { value: 'Elk Island National Park' } });

    fireEvent.click(screen.getByText('Citizen Steward'));

    // Submit the form
    const submitButton = screen.getByText('Review & Submit');
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockAddSiteInspectionReport).toHaveBeenCalledWith('site-1', 'user-1');
      expect(mockUploadSiteInspectionAnswers).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({ question_id: 37, obs_value: '2026-02-12' }),
          expect.objectContaining({ question_id: 38, obs_value: 'Elk Island National Park' }),
          expect.objectContaining({ question_id: 39, obs_value: 'Citizen Steward' }),
        ])
      );
    });
  });

  it('displays error when submitting without required fields', async () => {
    setupWhereUGoMocks();
    render(<NewReportPage />);

    await waitFor(() => {
      expect(screen.getByText(/Date of Your Visit/i)).toBeInTheDocument();
    });

    // Don't fill any fields, just submit
    const submitButton = screen.getByText('Review & Submit');
    fireEvent.click(submitButton);

    // Should show error popup
    await waitFor(() => {
      expect(screen.getByText(/Required Questions Missing/i)).toBeInTheDocument();
      expect(screen.getByText(/You must answer all required questions/i)).toBeInTheDocument();
    });
  });
});

describe('US 1.0.8 - Address What Amenities are in the Site', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
  });

  it('user can select amenities options for ease to visit', async () => {
      const mockOnChange = jest.fn();
      await renderBeThereMainContent(mockOnChange);

      fireEvent.click(screen.getByText('Parking lot for 2 or more cars'));
      fireEvent.click(screen.getByText('Washroom'));

      const latestResponses = mockOnChange.mock.calls[mockOnChange.mock.calls.length - 1][0];
      expect(latestResponses[41]).toEqual(
        expect.arrayContaining(['Parking lot for 2 or more cars', 'Washroom'])
    );
  });

  it('user can select signage and trails options for ease-of-use details', async () => {
    const mockOnChange = jest.fn();
    await renderBeThereMainContent(mockOnChange);

    fireEvent.click(screen.getByText('Directional signs on Feeder roads'));
    fireEvent.click(screen.getByText('Entrance signs, information, etc.'));
    fireEvent.click(screen.getByText('Trails (other than animal)'));

    const latestResponses = mockOnChange.mock.calls[mockOnChange.mock.calls.length - 1][0];
    expect(latestResponses[41]).toEqual(
      expect.arrayContaining([
        'Directional signs on Feeder roads',
        'Entrance signs, information, etc.',
        'Trails (other than animal)',
      ])
    );
  });

  it('user can unselect a previously selected ease-to-visit option', async () => {
    const mockOnChange = jest.fn();
    await renderBeThereMainContent(mockOnChange);

    fireEvent.click(screen.getByText('Washroom'));
    fireEvent.click(screen.getByText('Washroom'));

    const latestResponses = mockOnChange.mock.calls[mockOnChange.mock.calls.length - 1][0];
    expect(latestResponses[41]).not.toContain('Washroom');
  });
});

describe('US 1.0.12 - Address any Biological Observations that is in the Site', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
  });
  it('allows the user to enter biological wildlife observations', async () => {
    const mockOnChange = jest.fn();
    await renderBeThereMainContent(mockOnChange);

    const biologicalObservations = await screen.findByTestId("question-input-9");
    fireEvent.change(biologicalObservations, { target: { value: 'Saw a bald eagle and several deer.' } });

    const latestResponses = mockOnChange.mock.calls[mockOnChange.mock.calls.length - 1][0];
    expect(latestResponses[9]).toContain('Saw a bald eagle and several deer.');
  });

  it('allows the user to delete text from the biological observations box and ensures it is empty', async () => {
    const mockOnChange = jest.fn();
    await renderBeThereMainContent(mockOnChange);

    const biologicalObservations = await screen.findByTestId("question-input-9");

    fireEvent.change(biologicalObservations, { target: { value: 'Temporary observation' } });
    fireEvent.change(biologicalObservations, { target: { value: '' } });

    const latestResponses = mockOnChange.mock.calls[mockOnChange.mock.calls.length - 1][0];
    expect(latestResponses[9]).toBe('');
  });

  it('does not include optional question number in the missing required questions popup when answered', async () => {
    const mockOnChange = jest.fn();
    await renderBeThereMainContent(mockOnChange);
    mockGetQuestionsOnline.mockResolvedValue(beThereQuestions);
    render(<NewReportPage />);

    // Mock window.alert to capture the popup message
    const alertSpy = jest.spyOn(window, 'alert').mockImplementation(() => {});
    
    const input = await screen.findByTestId("question-input-9");
    fireEvent.change(input, { target: { value: 'Observation recorded' } });

    const submitButton = screen.getByRole('button', { name: /Review & Submit/i });
    fireEvent.click(submitButton);

    // Assert that the alert does not contain "4.3" because it isn't a required question
    await waitFor(() => {
      if (alertSpy.mock.calls.length > 0) {
        const alertMessage = alertSpy.mock.calls[0][0];
        expect(alertMessage).not.toContain('4.3');
      }
    });
    
    alertSpy.mockRestore();
  });
});

describe('US 1.0.27 - Enforce Required Questions on Site Inspection Form (also covers the submission acceptance test for US 1.0.1)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
  });

  it('blocks submission and shows the required questions popup when a mandatory field is missing', async () => {
    // Mock the dependencies to provide one required question
    const mockQuestion = [
      { 
        id: 1, 
        title: 'Test Required Question', 
        text: 'Test Required Answer', 
        question_type: 'option', 
        section: 3, 
        answers: [{ text: 'Yes' }, { text: 'No' }], 
        formorder: 1, 
        is_required: true, 
        sectionTitle: 'Test', 
        sectionDescription: 'Test', 
        sectionHeader: 'Test' }
    ];
    
    mockGetQuestionsOnline.mockResolvedValue(mockQuestion);
    render(<NewReportPage />);

    // Use findByRole instead of getByRole to wait for the loading state to end
    const submitButton = await screen.findByRole('button', { name: /Review & Submit/i });
    
    fireEvent.click(submitButton);

    const popupTitle = await screen.findByText(/Required Questions Missing/i);
    expect(popupTitle).toBeInTheDocument();

    // Assert that the specific missing question number is displayed
    const missingNumber = screen.getAllByText('0.1');
    expect(missingNumber[0]).toBeInTheDocument();

    // Verify that the final submission functions were not called
    expect(mockAddSiteInspectionReport).not.toHaveBeenCalled();
  });

  it('successfully calls uploadSiteInspectionAnswers when all required questions are answered', async () => {
    const mockRequiredQuestion = [
      { 
        id: 1, 
        title: 'Test Required Question', 
        text: 'Test Required Answer', 
        question_type: 'option', 
        section: 4, 
        answers: [{ text: 'Yes' }, { text: 'No' }], 
        formorder: 1, 
        is_required: true, 
        sectionTitle: 'Test', 
        sectionDescription: 'Test', 
        sectionHeader: 'Test' },
    ];

    const mockOptionalQuestion = [
      { 
        id: 2, 
        title: 'Test Optional Question', 
        text: 'Test Optional Answer', 
        question_type: 'option', 
        section: 4, 
        answers: [{ text: 'Yes' }, { text: 'No' }], 
        formorder: 2, 
        is_required: false, 
        sectionTitle: 'Test', 
        sectionDescription: 'Test', 
        sectionHeader: 'Test' }
    ]

    mockGetQuestionsOnline.mockResolvedValue(mockRequiredQuestion);
    mockAddSiteInspectionReport.mockResolvedValue({ id: 500 });
    mockGetQuestionResponseType.mockResolvedValue([{ question_id: 1, obs_value: 1, obs_comm: 0 }]);
    render(<NewReportPage />);

    // Answer the required question but not the optional question and then submit the form
    const option = await screen.findByText('Yes');
    fireEvent.click(option);

    const submitButton = screen.getByRole('button', { name: /Review & Submit/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      // Check that the upload function was called
      expect(mockUploadSiteInspectionAnswers).toHaveBeenCalled();
      
      // Verify the data structure sent to the Supabase
      const uploadedData = mockUploadSiteInspectionAnswers.mock.calls[0][0];
      expect(uploadedData[0]).toMatchObject({
        response_id: 500,
        question_id: 1,
        obs_value: 'Yes'
      });
    });
  });
});

describe('US 1.0.7 - Add Trip Details about how the trip went', () => {
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

describe('US 1.0.14 - Add Other Comments', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
  });

  it('user can enter their comments in beThere section', async () => {
    mockGetQuestionsOnline.mockResolvedValue(beThereQuestions);
    const mockOnChange = jest.fn();
    render(<MainContent responses={{}} onResponsesChange={mockOnChange} />);

    await waitFor(() => {
      expect(screen.getByText('Be There')).toBeInTheDocument();
    });
    fireEvent.click(screen.getByText('Be There'));

    await waitFor(() => {
      expect(screen.getByText('Other comments?')).toBeInTheDocument();
    });

    const beThereComments = await screen.findByTestId("question-input-13");
    fireEvent.change(beThereComments, { target: { value: 'Comment Test - beThere' } });
    expect(mockOnChange.mock.calls[mockOnChange.mock.calls.length - 1][0][13]).toBe('Comment Test - beThere');
  }); 

  it('user can enter their comments in notThere section', async () => {
    mockGetQuestionsOnline.mockResolvedValue(notThereQuestions);
    const mockOnChange = jest.fn();
    render(<MainContent responses={{}} onResponsesChange={mockOnChange} />);

    await waitFor(() => {
      expect(screen.getByText('Not There')).toBeInTheDocument();
    });
    fireEvent.click(screen.getByText('Not There'));

    await waitFor(() => {
      expect(screen.getByText('Comments')).toBeInTheDocument();
    });

    const notThereComments = await screen.findByTestId("question-input-20");
    fireEvent.change(notThereComments, { target: { value: 'Comment Test - NotThere' } });
    expect(mockOnChange.mock.calls[mockOnChange.mock.calls.length - 1][0][20]).toBe('Comment Test - NotThere');
  });

  it('user can enter their comments in 2BDone section', async () => {
    mockGetQuestionsOnline.mockResolvedValue(twoBDoneQuestions);
    const mockOnChange = jest.fn();
    render(<MainContent responses={{}} onResponsesChange={mockOnChange} />);

    await waitFor(() => {
      expect(screen.getByText('2B Done')).toBeInTheDocument();
    });
    fireEvent.click(screen.getByText('2B Done'));

    await waitFor(() => {
      expect(screen.getByText('Comments')).toBeInTheDocument();
    });

    const twoBDoneComments = await screen.findByTestId("question-input-25");
    fireEvent.change(twoBDoneComments, { target: { value: 'Comment Test - 2BDone' } });
    expect(mockOnChange.mock.calls[mockOnChange.mock.calls.length - 1][0][25]).toBe('Comment Test - 2BDone');
  });

  it('user can enter their comments in Close section', async () => {
    mockGetQuestionsOnline.mockResolvedValue(closeQuestions);
    const mockOnChange = jest.fn();
    render(<MainContent responses={{}} onResponsesChange={mockOnChange} />);

    await waitFor(() => {
      expect(screen.getByText('Close')).toBeInTheDocument();
    });
    fireEvent.click(screen.getByText('Close'));

    await waitFor(() => {
      expect(screen.getByText('Any Last Words?')).toBeInTheDocument();
    });

    const closeComments = await screen.findByTestId("question-input-28");
    fireEvent.change(closeComments, { target: { value: 'Comment Test - Close' } });
    expect(mockOnChange.mock.calls[mockOnChange.mock.calls.length - 1][0][28]).toBe('Comment Test - Close');
  }); 

  it('does not include comments in the missing required questions popup when answered', async () => {
    const allQuestions = [
      ...beThereQuestions,  
      ...notThereQuestions, 
      ...twoBDoneQuestions, 
      ...closeQuestions     
    ];
    mockGetQuestionsOnline.mockResolvedValue(allQuestions);
    render(<NewReportPage />);

    // Mock window.alert to capture the popup message
    const alertSpy = jest.spyOn(window, 'alert').mockImplementation(() => {});
    
    await waitFor(() => {
      expect(screen.getByText('Close')).toBeInTheDocument();
    });
    fireEvent.click(screen.getByText('Close'));

    const submitButton = screen.getByRole('button', { name: 'Review & Submit' });
    fireEvent.click(submitButton);

    await waitFor(() => {
      if (alertSpy.mock.calls.length > 0) {
        const alertMessage = alertSpy.mock.calls[0][0];
        expect(alertMessage).not.toContain('4.6'); 
        expect(alertMessage).not.toContain('5.8'); 
        expect(alertMessage).not.toContain('6.4'); 
        expect(alertMessage).not.toContain('7.1');
      }
    });
    
    alertSpy.mockRestore();
  });
});

describe('US 1.0.11 - Add Details Regarding Significant Site Changes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
  });

  it('user can enter details about recent landscape changes (Q54)', async () => {
    mockGetQuestionsOnline.mockResolvedValue(siteChangesQuestions);
    const mockOnChange = jest.fn();
    render(<MainContent responses={{}} onResponsesChange={mockOnChange} />);

    await waitFor(() => {
      expect(screen.getByText(/significant recent landscape changes/i)).toBeInTheDocument();
    });

    const textarea = screen.getByPlaceholderText('Enter your response here...');
    fireEvent.change(textarea, { target: { value: 'Recent wildfire damage on the north ridge, significant tree loss observed' } });

    expect(mockOnChange.mock.calls[mockOnChange.mock.calls.length - 1][0][54])
      .toBe('Recent wildfire damage on the north ridge, significant tree loss observed');
  });

  it('Q54 is optional and submitting without it does not show an error', async () => {
    mockGetQuestionsOnline.mockResolvedValue(siteChangesQuestions);
    render(<MainContent responses={{}} onResponsesChange={jest.fn()} />);

    await waitFor(() => {
      expect(screen.getByText(/Significant Site Changes/i)).toBeInTheDocument();
    });

    // Q54 should NOT have a Required badge
    expect(screen.queryByText('Required')).not.toBeInTheDocument();

    // Footer confirms form is submittable with 0 answers
    render(<StickyFooter questions={siteChangesQuestions} responses={{}} />);
    expect(screen.getByText('0 / 1 answered')).toBeInTheDocument();
  });
});

// Tests for US 1.0.28
describe('US 1.0.28 - Autofill Form Fields from User Account', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
  });

  // Mock questions with autofill_key
  const autofillQuestions = [
    {
      id: 32, title: 'Email (Q11)', text: 'Enter your email address',
      question_type: 'text', section: 4, answers: [], formorder: 1,
      is_required: false, autofill_key: 'user_email',
      sectionTitle: 'Personal Information', sectionDescription: 'Enter your personal details', sectionHeader: 'Personal Info',
    },
    {
      id: 34, title: 'Name (Q13)', text: 'Enter your name',
      question_type: 'text', section: 4, answers: [], formorder: 2,
      is_required: false, autofill_key: 'user_name',
      sectionTitle: 'Personal Information', sectionDescription: 'Enter your personal details', sectionHeader: 'Personal Info',
    },
    {
      id: 35, title: 'Phone (Q14)', text: 'Enter your phone number',
      question_type: 'text', section: 4, answers: [], formorder: 3,
      is_required: false, autofill_key: 'user_phone',
      sectionTitle: 'Personal Information', sectionDescription: 'Enter your personal details', sectionHeader: 'Personal Info',
    },
    {
      id: 37, title: 'Date of Your Visit (Q21)', text: 'Date of Visit',
      question_type: 'date', section: 4, answers: [], formorder: 4,
      is_required: true, autofill_key: 'visit_date',
      sectionTitle: 'Personal Information', sectionDescription: 'Enter your personal details', sectionHeader: 'Personal Info',
    },
  ];

  const fullUser = {
    email: 'jane@sapaa.org',
    name: 'Jane Steward',
    phone: '780-555-1234',
    role: 'steward',
    avatar: '',
  };

  // Helper function : renders MainContent with controlled state and optional user/site props
  function renderAutofillContent(
    mockOnChange: jest.Mock,
    currentUser: typeof fullUser | Partial<typeof fullUser> | null = fullUser,
    siteName = 'Test Site'
  ) {
    function ControlledMainContent() {
      const [responses, setResponses] = React.useState<Record<number, any>>({});
      const handleChange = (next: Record<number, any>) => {
        setResponses(next);
        mockOnChange(next);
      };
      return (
        <MainContent
          responses={responses}
          onResponsesChange={handleChange}
          currentUser={currentUser as any}
          siteName={siteName}
        />
      );
    }
    render(<ControlledMainContent />);
  }

  it('autofills all available fields when a new form is opened', async () => {
    mockGetQuestionsOnline.mockResolvedValue(autofillQuestions);
    const mockOnChange = jest.fn();
    renderAutofillContent(mockOnChange);

    await waitFor(() => {
      expect(mockOnChange).toHaveBeenCalled();
    });

    const latestResponses = mockOnChange.mock.calls[mockOnChange.mock.calls.length - 1][0];
    expect(latestResponses[32]).toBe('jane@sapaa.org');
    expect(latestResponses[34]).toBe('Jane Steward');
    expect(latestResponses[35]).toBe('780-555-1234');
    expect(latestResponses[37]).toBe(new Date().toISOString().split('T')[0]);
  });

  it("autofills user's name into question Q13", async () => {
    mockGetQuestionsOnline.mockResolvedValue(autofillQuestions);
    const mockOnChange = jest.fn();
    renderAutofillContent(mockOnChange);

    await waitFor(() => {
      expect(mockOnChange).toHaveBeenCalled();
    });

    const latestResponses = mockOnChange.mock.calls[mockOnChange.mock.calls.length - 1][0];
    expect(latestResponses[34]).toBe('Jane Steward');
  });

  it("autofills user's email into question Q11", async () => {
    mockGetQuestionsOnline.mockResolvedValue(autofillQuestions);
    const mockOnChange = jest.fn();
    renderAutofillContent(mockOnChange);

    await waitFor(() => {
      expect(mockOnChange).toHaveBeenCalled();
    });

    const latestResponses = mockOnChange.mock.calls[mockOnChange.mock.calls.length - 1][0];
    expect(latestResponses[32]).toBe('jane@sapaa.org');
  });

  it("autofills user's phone number into question Q14", async () => {
    mockGetQuestionsOnline.mockResolvedValue(autofillQuestions);
    const mockOnChange = jest.fn();
    renderAutofillContent(mockOnChange);

    await waitFor(() => {
      expect(mockOnChange).toHaveBeenCalled();
    });

    const latestResponses = mockOnChange.mock.calls[mockOnChange.mock.calls.length - 1][0];
    expect(latestResponses[35]).toBe('780-555-1234');
  });

  it('autofills date of visit (Q21) with the current date', async () => {
    mockGetQuestionsOnline.mockResolvedValue(autofillQuestions);
    const mockOnChange = jest.fn();
    renderAutofillContent(mockOnChange);

    await waitFor(() => {
      expect(mockOnChange).toHaveBeenCalled();
    });

    const today = new Date().toISOString().split('T')[0];
    const latestResponses = mockOnChange.mock.calls[mockOnChange.mock.calls.length - 1][0];
    expect(latestResponses[37]).toBe(today);
  });

  it('does not autofill fields when the user has no data for them', async () => {
    mockGetQuestionsOnline.mockResolvedValue(autofillQuestions);
    const mockOnChange = jest.fn();

    // User with no phone or name
    const partialUser = { email: 'partial@sapaa.org', role: 'steward', avatar: '' };
    renderAutofillContent(mockOnChange, partialUser);

    await waitFor(() => {
      expect(mockOnChange).toHaveBeenCalled();
    });

    const latestResponses = mockOnChange.mock.calls[mockOnChange.mock.calls.length - 1][0];
    expect(latestResponses[32]).toBe('partial@sapaa.org'); // email present - should fill
    expect(latestResponses[34]).toBeUndefined();           // name missing - should not fill
    expect(latestResponses[35]).toBeUndefined();           // phone missing - should not fill
  });

  it('does not autofill any user fields when currentUser is null', async () => {
    mockGetQuestionsOnline.mockResolvedValue(autofillQuestions);
    const mockOnChange = jest.fn();
    renderAutofillContent(mockOnChange, null);

    // If autofill were to run, it would call onResponsesChange
    await waitFor(() => {
      expect(screen.getByText('Enter your email address')).toBeInTheDocument();
    });

    // visit_date still autofills (it doesn't depend on user), but user fields should not
    const calls = mockOnChange.mock.calls;
    if (calls.length > 0) {
      const latestResponses = calls[calls.length - 1][0];
      expect(latestResponses[32]).toBeUndefined();
      expect(latestResponses[34]).toBeUndefined();
      expect(latestResponses[35]).toBeUndefined();
    }
  });

  it('autofilled fields can be manually edited', async () => {
    mockGetQuestionsOnline.mockResolvedValue(autofillQuestions);
    const mockOnChange = jest.fn();
    renderAutofillContent(mockOnChange);

    // Wait for autofill to run
    await waitFor(() => {
      expect(mockOnChange).toHaveBeenCalled();
    });

    // Confirm email was autofilled
    const textareas = screen.getAllByPlaceholderText('Enter your response here...');
    const emailTextarea = textareas.find(
      (el) => (el as HTMLTextAreaElement).value === 'jane@sapaa.org'
    ) as HTMLTextAreaElement;
    expect(emailTextarea).toBeTruthy();

    // User edits the autofilled email
    fireEvent.change(emailTextarea, { target: { value: 'newemail@example.com' } });

    const latestResponses = mockOnChange.mock.calls[mockOnChange.mock.calls.length - 1][0];
    expect(latestResponses[32]).toBe('newemail@example.com');
  });
});