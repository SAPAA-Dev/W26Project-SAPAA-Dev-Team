// __tests__/edit-report.test.tsx
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import EditReportPage from '@/app/detail/[namesite]/edit-report/[responseId]/page';
import * as queries from '@/utils/supabase/queries';
import { devNull } from 'os';

// — Navigation
jest.mock('next/navigation', () => ({
  useParams: jest.fn(() => ({ namesite: 'Test%20Site', responseId: '42' })),
  useRouter: jest.fn(() => ({ push: jest.fn(), back: jest.fn() })),
}));

// — Next Image
jest.mock('next/image', () => ({
  __esModule: true,
  default: (props: any) => <img {...props} />,
}));

// — Queries
jest.mock('@/utils/supabase/queries');
jest.mock('@/utils/supabase/client', () => ({
  createClient: () => ({
    auth: { getUser: jest.fn().mockResolvedValue({ data: { user: { id: 'user-123' } } }) },
  }),
}));

// — Browser APIs
global.URL.createObjectURL = jest.fn(() => 'blob:fake');
global.URL.revokeObjectURL = jest.fn();
global.fetch = jest.fn((url: string) => {
  if (String(url).includes('site-images'))
    return Promise.resolve({ ok: true, json: () => Promise.resolve({ items: [] }) });
  if (String(url).includes('presign'))
    return Promise.resolve({ ok: true, json: () => Promise.resolve({ uploadUrl: 'https://s3.fake', key: 'fake-key' }) });
  return Promise.resolve({ ok: true });
}) as jest.Mock;

Object.defineProperty(globalThis, 'crypto', {
  value: { randomUUID: () => 'test-uuid' },
});


export const mockQuestions = [
    {
      id: 32,
      title: "Email (Q11)",
      text: null,
      question_type: "text",
      section: 3,
      answers: [],
      formorder: 3,
      is_required: true,
      autofill_key: "user_email",
      sectionTitle: "General Information",
      sectionDescription: "This section will gather Who Are You, When did you Visit. Where Did You Go?",
      sectionHeader: "WhoRYou",
    },
    {
      id: 33,
      title: "Steward's Name (Individual or Group) (Q12)",
      text: "Please select your name if you contribute site inspection reports frequently. Otherwise, select 'Guest'.",
      question_type: "option",
      section: 3,
      answers: ["David F.", "Dave M.", "Frank P.", "George - Mary B. (Riverlot 56)", "Hubert T.", "Kate R.", "Myrna P.", "Patsy C.", "Tony B.", "Vera S.", "Other"],
      formorder: 4,
      is_required: true,
      autofill_key: null,
      sectionTitle: "General Information",
      sectionDescription: "This section will gather Who Are You, When did you Visit. Where Did You Go?",
      sectionHeader: "WhoRYou",
    },
    {
      id: 34,
      title: "First and Last Name for Guests (Q13)",
      text: "Please enter your name if your name is not on the contributor list.",
      question_type: "text",
      section: 3,
      answers: [],
      formorder: 5,
      is_required: true,
      autofill_key: "user_name",
      sectionTitle: "General Information",
      sectionDescription: "This section will gather Who Are You, When did you Visit. Where Did You Go?",
      sectionHeader: "WhoRYou",
    },
    {
      id: 35,
      title: "Phone (how can we reach you other than email?) (Q14)",
      text: "Optional for contributors, Guests please provide a best number to call you in case of questions.",
      question_type: "text",
      section: 3,
      answers: [],
      formorder: 6,
      is_required: false,
      autofill_key: "user_phone",
      sectionTitle: "General Information",
      sectionDescription: "This section will gather Who Are You, When did you Visit. Where Did You Go?",
      sectionHeader: "WhoRYou",
    },
    {
      id: 36,
      title: "SAPAA Member? (Q16)",
      text: "SAPAA members received a newsletter and notice about Alberta's Protected Areas.",
      question_type: "option",
      section: 3,
      answers: ["Yes", "No", "Not Sure", "Not Applicable"],
      formorder: 7,
      is_required: true,
      autofill_key: null,
      sectionTitle: "General Information",
      sectionDescription: "This section will gather Who Are You, When did you Visit. Where Did You Go?",
      sectionHeader: "WhoRYou",
    },
    {
      id: 37,
      title: "Date of Your Visit (Q21)",
      text: "Date of Visit",
      question_type: "date",
      section: 4,
      answers: [],
      formorder: 8,
      is_required: true,
      autofill_key: "visit_date",
      sectionTitle: "Overview of the Visit",
      sectionDescription: "Details of the visit: Where, When, Who.",
      sectionHeader: "WhereUGo",
    },
    {
      id: 38,
      title: "Site Name (Q22)",
      text: "Select the name of the area visited.",
      question_type: "site_select",
      section: 4,
      answers: [],
      formorder: 9,
      is_required: true,
      autofill_key: "site_name",
      sectionTitle: "Overview of the Visit",
      sectionDescription: "Details of the visit: Where, When, Who.",
      sectionHeader: "WhereUGo",
    },
    {
      id: 47,
      title: "Site Name or Parcel (Q23)",
      text: "If a site has more than one parcel, describe where you went exactly.",
      question_type: "text",
      section: 4,
      answers: [],
      formorder: 10,
      is_required: false,
      autofill_key: null,
      sectionTitle: "Overview of the Visit",
      sectionDescription: "Details of the visit: Where, When, Who.",
      sectionHeader: "WhereUGo",
    },
    {
      id: 39,
      title: "Designated Steward (Q24)",
      text: "Are you the named, Government of Alberta Steward?",
      question_type: "option",
      section: 4,
      answers: ["Gov. Steward - Individual", "Gov. Steward - Group", "Level 1/2 SAPAA Volunteer", "Citizen Steward", "Just Interested"],
      formorder: 11,
      is_required: true,
      autofill_key: null,
      sectionTitle: "Overview of the Visit",
      sectionDescription: "Details of the visit: Where, When, Who.",
      sectionHeader: "WhereUGo",
    },
    {
      id: 1,
      title: "What is the Naturalness of the Site? (Q31)",
      text: "What is the Naturalness of the Site?",
      question_type: "option",
      section: 5,
      answers: ["4 = Great", "3 = Good", "2 = Passable", "1 = Bad", "0 = Terrible", "Cannot Answer"],
      formorder: 12,
      is_required: true,
      autofill_key: null,
      sectionTitle: "Overall Impression of the Site",
      sectionDescription: "If you only answer one question, this is the one.",
      sectionHeader: "Impression",
    },
    {
      id: 2,
      title: "How Healthy: Comments (Q32)",
      text: "YOUR gut reaction and assessment.",
      question_type: "text",
      section: 5,
      answers: [],
      formorder: 13,
      is_required: false,
      autofill_key: null,
      sectionTitle: "Overall Impression of the Site",
      sectionDescription: "If you only answer one question, this is the one.",
      sectionHeader: "Impression",
    },
    {
      id: 3,
      title: "Change in Conditions? (Q33)",
      text: "If you have visited this site previously, what are some significant changes you want to highlight?",
      question_type: "text",
      section: 5,
      answers: [],
      formorder: 14,
      is_required: false,
      autofill_key: null,
      sectionTitle: "Overall Impression of the Site",
      sectionDescription: "If you only answer one question, this is the one.",
      sectionHeader: "Impression",
    },
    {
      id: 4,
      title: "Trip Duration (Q41)",
      text: "How much time did you spend in the PA in hours?",
      question_type: "text",
      section: 6,
      answers: [],
      formorder: 18,
      is_required: true,
      autofill_key: null,
      sectionTitle: "How was your visit to the PA?",
      sectionDescription: "Tell us about your trip!",
      sectionHeader: "How Visit",
    },
    {
      id: 5,
      title: "Trip Duration Notes (Q41.1)",
      text: "If needed, enter any notes to explain the time spent on the site (Optional).",
      question_type: "text",
      section: 6,
      answers: [],
      formorder: 15,
      is_required: false,
      autofill_key: null,
      sectionTitle: "How was your visit to the PA?",
      sectionDescription: "Tell us about your trip!",
      sectionHeader: "How Visit",
    },
    {
      id: 6,
      title: "Why Did you Go? (Q42)",
      text: "What were you hoping to see/do when you were in the site?",
      question_type: "selectall",
      section: 6,
      answers: ["Birding", "Astronomy", "Botanical pursuits (e.g. plant identification)", "Canoeing/Kayaking", "Dog Walking", "Equestrian", "Fishing", "Hiking", "Hunting/Trapping", "Mushrooming", "Night Sky Observations", "Picnicking", "Research, Work or Study Related", "Snowshoeing, Winter hike", "X-country Skiing", "None noted", "Other"],
      formorder: 16,
      is_required: true,
      autofill_key: null,
      sectionTitle: "How was your visit to the PA?",
      sectionDescription: "Tell us about your trip!",
      sectionHeader: "How Visit",
    },
    {
      id: 7,
      title: "Visit Details (Q43)",
      text: "If you want, tell us more about your visit.",
      question_type: "text",
      section: 6,
      answers: [],
      formorder: 17,
      is_required: false,
      autofill_key: null,
      sectionTitle: "How was your visit to the PA?",
      sectionDescription: "Tell us about your trip!",
      sectionHeader: "How Visit",
    },
    {
      id: 8,
      title: "Ease to Visit (Q51)",
      text: "How easy is this site to visit?",
      question_type: "selectall",
      section: 7,
      answers: ["Parking lot for 2 or more cars", "Washroom", "Directional signs on Feeder roads", "Entrance signs, information, etc.", "Trails (other than animal)", "No Amenities", "No Signage", "None noted", "Not Applicable", "Other"],
      formorder: 19,
      is_required: true,
      autofill_key: null,
      sectionTitle: "What is in the Site (that should be there)?",
      sectionDescription: "What plants, animals, landscapes, signage or facility features did you see?",
      sectionHeader: "Be There",
    },
    {
      id: 9,
      title: "Biological Observations (Q52)",
      text: "Summarize any significant biological observations.",
      question_type: "text",
      section: 7,
      answers: [],
      formorder: 20,
      is_required: false,
      autofill_key: null,
      sectionTitle: "What is in the Site (that should be there)?",
      sectionDescription: "What plants, animals, landscapes, signage or facility features did you see?",
      sectionHeader: "Be There",
    },
    {
      id: 10,
      title: "Submissions to iNaturalist (Q53)",
      text: "Will you be submitting any postings to iNaturalist.ca?",
      question_type: "option",
      section: 7,
      answers: ["Yes", "No, Not this time", "No, not a member of iNaturalist", "What is iNaturalist?", "Not Applicable", "Other"],
      formorder: 21,
      is_required: true,
      autofill_key: null,
      sectionTitle: "What is in the Site (that should be there)?",
      sectionDescription: "What plants, animals, landscapes, signage or facility features did you see?",
      sectionHeader: "Be There",
    },
    {
      id: 11,
      title: "Landscape Changes (Q54)",
      text: "Significant, non-biological and non-human site changes.",
      question_type: "text",
      section: 7,
      answers: [],
      formorder: 22,
      is_required: false,
      autofill_key: null,
      sectionTitle: "What is in the Site (that should be there)?",
      sectionDescription: "What plants, animals, landscapes, signage or facility features did you see?",
      sectionHeader: "Be There",
    },
    {
      id: 12,
      title: "Designation as a Protected Area (Q55)",
      text: "How do you know it is a natural area?",
      question_type: "selectall",
      section: 7,
      answers: ["Stiles, Gates", "None Noted", "Not Applicable", "Other", "Fencing", "Signage", "Exists but in disrepair"],
      formorder: 23,
      is_required: true,
      autofill_key: null,
      sectionTitle: "What is in the Site (that should be there)?",
      sectionDescription: "What plants, animals, landscapes, signage or facility features did you see?",
      sectionHeader: "Be There",
    },
    {
      id: 13,
      title: "Other comments? (Q56)",
      text: "Any other comments on what is in the site?",
      question_type: "text",
      section: 7,
      answers: [],
      formorder: 24,
      is_required: false,
      autofill_key: null,
      sectionTitle: "What is in the Site (that should be there)?",
      sectionDescription: "What plants, animals, landscapes, signage or facility features did you see?",
      sectionHeader: "Be There",
    },
    {
      id: 14,
      title: "Agricultural Activities (Q61)",
      text: "Is the PA used by a local farmer/rancher?",
      question_type: "selectall",
      section: 8,
      answers: ["Domestic Animal Grazing", "Seeded Crops or Haying", "Land Clearing", "None noted", "Not Applicable", "Other"],
      formorder: 25,
      is_required: true,
      autofill_key: null,
      sectionTitle: "What are the human activities/disturbances affecting the Site?",
      sectionDescription: "What human activities are in the site?",
      sectionHeader: "Not There",
    },
    {
      id: 15,
      title: "Resource extraction (Q62)",
      text: "(Non) renewable resource extraction.",
      question_type: "selectall",
      section: 8,
      answers: ["Oil/Gas wells", "Tree Harvesting / Bark Stripping", "Hunting (blinds, dressing site)", "Collecting / Trapping", "None noted", "Not Applicable", "Other"],
      formorder: 26,
      is_required: true,
      autofill_key: null,
      sectionTitle: "What are the human activities/disturbances affecting the Site?",
      sectionDescription: "What human activities are in the site?",
      sectionHeader: "Not There",
    },
    {
      id: 16,
      title: "Motorized disturbances (ATV or vehicle activity) (Q63)",
      text: "Some sites permit motorized access.",
      question_type: "selectall",
      section: 8,
      answers: ["Off Highway Vehicles (4x4, ATVs)", "Snowmobiles", "Power Boats (lakes/rivers)", "None noted", "Not Applicable", "Other"],
      formorder: 27,
      is_required: true,
      autofill_key: null,
      sectionTitle: "What are the human activities/disturbances affecting the Site?",
      sectionDescription: "What human activities are in the site?",
      sectionHeader: "Not There",
    },
    {
      id: 17,
      title: "What Were Other Visitors Doing? (Q64)",
      text: "Low impact activities other than what the submitter was engaged in.",
      question_type: "selectall",
      section: 8,
      answers: ["Astronomy", "Birding", "Canoeing/Kayaking", "Dog Walking", "Equestrian", "Fishing", "Hiking", "Historical/Cultural (e.g. signed nature trail)", "Hunting/Trapping", "Mountain Biking", "Night Sky Observations", "Picnicking", "Research, Work or Study Related", "Snowshoeing, Winter hike", "X-country Skiing", "None noted", "Not Applicable", "Other"],
      formorder: 28,
      is_required: true,
      autofill_key: null,
      sectionTitle: "What are the human activities/disturbances affecting the Site?",
      sectionDescription: "What human activities are in the site?",
      sectionHeader: "Not There",
    },
    {
      id: 18,
      title: "Gathering and Dumping Activities (Q65)",
      text: "Living or partying on the site.",
      question_type: "selectall",
      section: 8,
      answers: ["Buildings (non-industrial, e.g. trailers)", "Camping (lean-to's, fire rings, etc.)", "Homeless camp", "Bush party sites (e.g. bottles)", "Non-hunting shooting", "Garbage dumping/Vandalism", "None noted", "Not Applicable", "Other"],
      formorder: 29,
      is_required: true,
      autofill_key: null,
      sectionTitle: "What are the human activities/disturbances affecting the Site?",
      sectionDescription: "What human activities are in the site?",
      sectionHeader: "Not There",
    },
    {
      id: 19,
      title: "Infrastructure encroachment (Q66)",
      text: "How is industrialization and urbanization impacting the site?",
      question_type: "selectall",
      section: 8,
      answers: ["Buildings", "Cut fences, unauthorized entries", "Cut lines", "Diversion of water (culverts, etc.)", "Pipelines", "Power lines", "Roads", "Ad hoc structures (e.g. bridges)", "None noted", "Not Applicable", "Other"],
      formorder: 30,
      is_required: true,
      autofill_key: null,
      sectionTitle: "What are the human activities/disturbances affecting the Site?",
      sectionDescription: "What human activities are in the site?",
      sectionHeader: "Not There",
    },
    {
      id: 20,
      title: "Comments (Q67)",
      text: "Any Comments on how the site is being used or disturbed by humans?",
      question_type: "text",
      section: 8,
      answers: [],
      formorder: 31,
      is_required: false,
      autofill_key: null,
      sectionTitle: "What are the human activities/disturbances affecting the Site?",
      sectionDescription: "What human activities are in the site?",
      sectionHeader: "Not There",
    },
    {
      id: 21,
      title: "Invasive Plants / Disease (Q68)",
      text: "Post any observed plant or animal invasions to iNaturalist.ca.",
      question_type: "text",
      section: 8,
      answers: [],
      formorder: 32,
      is_required: false,
      autofill_key: null,
      sectionTitle: "What are the human activities/disturbances affecting the Site?",
      sectionDescription: "What human activities are in the site?",
      sectionHeader: "Not There",
    },
    {
      id: 22,
      title: "Remediation/ Protection Activities Needed (Q71)",
      text: "What are the most urgent actions to be undertaken?",
      question_type: "selectall",
      section: 9,
      answers: ["Nothing, all good", "Cleanup", "Fencing", "Re-vegetation", "Invasive Weed Removal", "Signage/Sign Posts", "Not Applicable", "Other"],
      formorder: 33,
      is_required: true,
      autofill_key: null,
      sectionTitle: "What Needs to be (Has Been) Done?",
      sectionDescription: "What, if anything, does the site need to improve/protect it?",
      sectionHeader: "2B Done",
    },
    {
      id: 23,
      title: "How have you helped to protect this site? (Q72)",
      text: "You must have permission from the Government Land Manager to make any installations in a PA.",
      question_type: "selectall",
      section: 9,
      answers: ["Visit and Submit This Report!", "Cleanup (e.g. Trash removal)", "Fencing", "Signage/Sign Posts", "Weed Control", "Talked to nearby residents", "Not Applicable", "Other"],
      formorder: 34,
      is_required: true,
      autofill_key: null,
      sectionTitle: "What Needs to be (Has Been) Done?",
      sectionDescription: "What, if anything, does the site need to improve/protect it?",
      sectionHeader: "2B Done",
    },
    {
      id: 24,
      title: "Educating Nearby Residents about Site Usage (Q73)",
      text: "Are there nearby residents who might become Citizens Stewards?",
      question_type: "text",
      section: 9,
      answers: [],
      formorder: 35,
      is_required: false,
      autofill_key: null,
      sectionTitle: "What Needs to be (Has Been) Done?",
      sectionDescription: "What, if anything, does the site need to improve/protect it?",
      sectionHeader: "2B Done",
    },
    {
      id: 25,
      title: "Comments (Q74)",
      text: "Any comments, notes, or explanations not covered by the above?",
      question_type: "text",
      section: 9,
      answers: [],
      formorder: 36,
      is_required: false,
      autofill_key: null,
      sectionTitle: "What Needs to be (Has Been) Done?",
      sectionDescription: "What, if anything, does the site need to improve/protect it?",
      sectionHeader: "2B Done",
    },
    {
      id: 27,
      title: "Upload Images, GPS Files, etc. (Q81.1)",
      text: null,
      question_type: "image",
      section: 10,
      answers: [],
      formorder: 38,
      is_required: false,
      autofill_key: null,
      sectionTitle: "Digital File Management",
      sectionDescription: "SAPAA loves pictures.",
      sectionHeader: "Close",
    },
    {
      id: 28,
      title: "Any Last Words? (Q82)",
      text: "Have we missed anything? Do you have other comments, ideas, or thoughts about this site?",
      question_type: "text",
      section: 10,
      answers: [],
      formorder: 39,
      is_required: false,
      autofill_key: null,
      sectionTitle: "Digital File Management",
      sectionDescription: "SAPAA loves pictures.",
      sectionHeader: "Close",
    },
  ];

const mockResponses: Record<string | number, any> = {
    1:  "4 = Great",
    4:  "1",
    6:  [
      "Botanical pursuits (e.g. plant identification)",
      "Birding",
      "Dog Walking",
      "Fishing",
      "Hunting/Trapping",
      "Night Sky Observations",
      "Snowshoeing, Winter hike",
      "X-country Skiing",
      "Research, Work or Study Related",
      "None noted",
      "Other",
    ],
    "6_comm":  "Foraging for edible plants",
    8:  ["Washroom", "Parking lot for 2 or more cars", "Entrance signs, information, etc.", "Directional signs on Feeder roads", "Trails (other than animal)"],
    10: "No, Not this time",
    12: ["Fencing", "Exists but in disrepair", "Signage", "Other"],
    "12_comm": "Fence posts rotting near east boundary",
    14: ["Domestic Animal Grazing", "Land Clearing", "Not Applicable"],
    15: ["Oil/Gas wells", "Hunting (blinds, dressing site)", "None noted", "Other"],
    "15_comm": "Unmarked drilling equipment spotted near trailhead",
    16: ["Off Highway Vehicles (4x4, ATVs)", "Power Boats (lakes/rivers)", "None noted", "Other"],
    "16_comm": "Loud motorcycle activity on restricted path",
    17: ["Astronomy", "Canoeing/Kayaking", "Dog Walking", "Hunting/Trapping", "Other"],
    "17_comm": "Paragliding observed near ridge",
    18: ["Not Applicable"],
    19: ["Other"],
    "19_comm": "Unauthorized campfire ring built near creek",
    22: ["Nothing, all good"],
    23: ["Cleanup (e.g. Trash removal)"],
    32: "testuser@example.com",
    33: "Other",
    34: "Test User",
    36: "Not Sure",
    37: "2026-03-06",
    38: "Alexo (NA)",
    39: "Just Interested",
  };

beforeEach(() => {
  // Default mock returns — override per test as needed
  (queries.getQuestionsOnline as jest.Mock).mockResolvedValue([]);
  (queries.getFormResponseById as jest.Mock).mockResolvedValue({});
  (queries.getResponseOwnerId as jest.Mock).mockResolvedValue('user-123'); // matches auth user → authorized
  (queries.getSiteIdForResponse as jest.Mock).mockResolvedValue(5);
  (queries.isSteward as jest.Mock).mockResolvedValue(false);
  (queries.getQuestionResponseType as jest.Mock).mockResolvedValue([]);
  (queries.updateSiteInspectionAnswers as jest.Mock).mockResolvedValue(undefined);
  (queries.updateAttachmentMetadata as jest.Mock).mockResolvedValue(undefined);
  (queries.insertInspectionAttachments as jest.Mock).mockResolvedValue(undefined);
});

describe('US 1.0.22 – (User) Edit My Site Inspections Form', () => {
    beforeEach(() => {
      jest.clearAllMocks();
      localStorage.clear();
    });

    it('renders the edit form when user is authorized', async () => {
        (queries.getQuestionsOnline as jest.Mock).mockResolvedValue(mockQuestions);
        (queries.getFormResponseById as jest.Mock).mockResolvedValue(mockResponses);
        render(<EditReportPage />);
        await waitFor(() => expect(screen.getByText('Edit Inspection Report')).toBeInTheDocument());
    });

    it('shows access denied when user is not the owner', async () => {
        (queries.getFormResponseById as jest.Mock).mockResolvedValue(mockResponses);
        (queries.getResponseOwnerId as jest.Mock).mockResolvedValue('different-user');
        render(<EditReportPage />);
        await waitFor(() => expect(screen.getByText('Access Denied')).toBeInTheDocument());
    });

    it("all previous responses are filled correctly", async () => {
        (queries.getQuestionsOnline as jest.Mock).mockResolvedValue(mockQuestions);
        (queries.getFormResponseById as jest.Mock).mockResolvedValue(mockResponses);
      
        render(<EditReportPage />);
        await waitFor(() => expect(screen.getByText('Edit Inspection Report')).toBeInTheDocument());
      
        // ── Section 1 (WhoRYou) — active by default ──────────────────────────────
        await waitFor(() => expect(screen.getByTestId('question-input-32')).toBeInTheDocument());
      
        expect((screen.getByTestId('question-input-32') as HTMLTextAreaElement).value).toBe('testuser@example.com');
        expect((screen.getByTestId('question-input-34') as HTMLTextAreaElement).value).toBe('Test User');
      
        const stewardCard = screen.getByText("Please select your name if you contribute site inspection reports frequently. Otherwise, select 'Guest'.").closest('div[class*="rounded-2xl"]')!;
        expect((stewardCard.querySelector('input[value="Other"]') as HTMLInputElement).checked).toBe(true);

        const sapaaCard = screen.getByText("SAPAA members received a newsletter and notice about Alberta's Protected Areas.").closest('div[class*="rounded-2xl"]')!;
        expect((sapaaCard.querySelector('input[value="Not Sure"]') as HTMLInputElement).checked).toBe(true);
      
        // ── Section 2 (WhereUGo) ─────────────────────────────────────────────────
        fireEvent.click(screen.getByRole('button', { name: /WhereUGo/i }));
        await waitFor(() => expect(screen.getByDisplayValue('2026-03-06')).toBeInTheDocument());
      
        expect((screen.getByDisplayValue('2026-03-06') as HTMLInputElement).value).toBe('2026-03-06');
        expect((screen.getByDisplayValue('Alexo (NA)') as HTMLInputElement).value).toBe('Alexo (NA)');
      
        const stewardTypeCard = screen.getByText("Are you the named, Government of Alberta Steward?").closest('div[class*="rounded-2xl"]')!;
        expect((stewardTypeCard.querySelector('input[value="Just Interested"]') as HTMLInputElement).checked).toBe(true);
      
        // ── Section 3 (Impression) ───────────────────────────────────────────────
        fireEvent.click(screen.getByRole('button', { name: /Impression/i }));
        await waitFor(() => expect(screen.getByDisplayValue('4 = Great')).toBeInTheDocument());
      
        expect((screen.getByDisplayValue('4 = Great') as HTMLInputElement).checked).toBe(true);
      
        // ── Section 4 (How Visit) ────────────────────────────────────────────────
        fireEvent.click(screen.getByRole('button', { name: /How Visit/i }));
        await waitFor(() => expect(screen.getByTestId('question-input-4')).toBeInTheDocument());
      
        expect((screen.getByTestId('question-input-4') as HTMLTextAreaElement).value).toBe('1');
        expect((screen.getByDisplayValue('Birding') as HTMLInputElement).checked).toBe(true);
        expect((screen.getByDisplayValue('Other') as HTMLInputElement).checked).toBe(true);
        expect((screen.getByDisplayValue('Foraging for edible plants') as HTMLTextAreaElement).value).toBe('Foraging for edible plants');
      
        // ── Section 5 (Be There) ─────────────────────────────────────────────────
        fireEvent.click(screen.getByRole('button', { name: /Be There/i }));
        await waitFor(() => expect(screen.getByDisplayValue('No, Not this time')).toBeInTheDocument());
      
        expect((screen.getByDisplayValue('Washroom') as HTMLInputElement).checked).toBe(true);
        expect((screen.getByDisplayValue('Parking lot for 2 or more cars') as HTMLInputElement).checked).toBe(true);
        expect((screen.getByDisplayValue('No, Not this time') as HTMLInputElement).checked).toBe(true);
        expect((screen.getByDisplayValue('Fencing') as HTMLInputElement).checked).toBe(true);
        expect((screen.getByDisplayValue('Signage') as HTMLInputElement).checked).toBe(true);
        expect((screen.getByDisplayValue('Fence posts rotting near east boundary') as HTMLTextAreaElement).value).toBe('Fence posts rotting near east boundary');
      
        // ── Section 6 (Not There) ────────────────────────────────────────────────
        fireEvent.click(screen.getByRole('button', { name: /Not There/i }));
        await waitFor(() => expect(screen.getByDisplayValue('Domestic Animal Grazing')).toBeInTheDocument());
      
        const agriCard = screen.getByText("Is the PA used by a local farmer/rancher?").closest('div[class*="rounded-2xl"]')!;
        expect((agriCard.querySelector('input[value="Domestic Animal Grazing"]') as HTMLInputElement).checked).toBe(true);
        expect((agriCard.querySelector('input[value="Land Clearing"]') as HTMLInputElement).checked).toBe(true);
      
        expect((screen.getByDisplayValue('Loud motorcycle activity on restricted path') as HTMLTextAreaElement).value).toBe('Loud motorcycle activity on restricted path');
        expect((screen.getByDisplayValue('Paragliding observed near ridge') as HTMLTextAreaElement).value).toBe('Paragliding observed near ridge');
        expect((screen.getByDisplayValue('Unauthorized campfire ring built near creek') as HTMLTextAreaElement).value).toBe('Unauthorized campfire ring built near creek');
      
        // ── Section 7 (2B Done) ──────────────────────────────────────────────────
        fireEvent.click(screen.getByRole('button', { name: /2B Done/i }));
        await waitFor(() => expect(screen.getByDisplayValue('Nothing, all good')).toBeInTheDocument());
      
        expect((screen.getByDisplayValue('Nothing, all good') as HTMLInputElement).checked).toBe(true);
        expect((screen.getByDisplayValue('Cleanup (e.g. Trash removal)') as HTMLInputElement).checked).toBe(true);
      
        // ── Section 8 (Close) ───────────────────────────────────────────────────
        fireEvent.click(screen.getByRole('button', { name: /Close/i }));
        await waitFor(() => expect(screen.getByTestId('question-input-28')).toBeInTheDocument());
      
        expect((screen.getByTestId('question-input-28') as HTMLTextAreaElement).value).toBe('');
        expect(screen.getByText(/click to upload images/i)).toBeInTheDocument();
      });

    it("shows required popup if user clears a required question and attempts to submit", async () => {
        (queries.getQuestionsOnline as jest.Mock).mockResolvedValue(mockQuestions);
        (queries.getFormResponseById as jest.Mock).mockResolvedValue(mockResponses);
        
        render(<EditReportPage />);
        
        await waitFor(() => expect(screen.getByText('Edit Inspection Report')).toBeInTheDocument());
        
        // Clear the email field
        const emailInput = await waitFor(() => screen.getByTestId('question-input-32'));
        fireEvent.change(emailInput, { target: { value: '' } });
        expect((emailInput as HTMLTextAreaElement).value).toBe('');
        
        // Attempt to submit
        const saveButton = screen.getByRole('button', { name: /Review & Submit/i });
        fireEvent.click(saveButton);
        
        // Validation popup should appear, submit should not fire
        await waitFor(() =>
            expect(screen.getByText('Required Questions Missing')).toBeInTheDocument()
        );
        expect(queries.updateSiteInspectionAnswers).not.toHaveBeenCalled();
    });

    it("if user changes a required question, submission is changed", async () => {
        (queries.getQuestionsOnline as jest.Mock).mockResolvedValue(mockQuestions);
        (queries.getFormResponseById as jest.Mock).mockResolvedValue(mockResponses);
        (queries.getQuestionResponseType as jest.Mock).mockResolvedValue([
            { question_id: 32, obs_value: null, obs_comm: true },  
          ]);

        render(<EditReportPage />);
        
        await waitFor(() => expect(screen.getByText('Edit Inspection Report')).toBeInTheDocument());
        
        // Clear the email field
        const emailInput = await waitFor(() => screen.getByTestId('question-input-32'));
        fireEvent.change(emailInput, { target: { value: 'newemail@gmail.com' } });
        expect((emailInput as HTMLTextAreaElement).value).toBe('newemail@gmail.com');
        
        // Attempt to submit
        const saveButton = screen.getByRole('button', { name: /Review & Submit/i });
        fireEvent.click(saveButton);
    
        await waitFor(() => expect(queries.updateSiteInspectionAnswers).toHaveBeenCalled());

        // Extract the answers array passed to the update call
        const answersArray = (queries.updateSiteInspectionAnswers as jest.Mock).mock.calls[0][1];
      
        // Find the answer for question 32 (email)
        const emailAnswer = answersArray.find((a: any) => a.question_id === 32);
        expect(emailAnswer).toBeDefined();
        console.log(emailAnswer);
        expect(emailAnswer.obs_comm).toBe('newemail@gmail.com');
    });
});