import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import MainContent from '../../app/detail/[namesite]/new-report/MainContent';

const mockGetQuestionsOnline = jest.fn();

jest.mock('@/utils/supabase/queries', () => ({
  getQuestionsOnline: (...args: any[]) => mockGetQuestionsOnline(...args),
}));

const Q5_1_ID = 501;
const Q5_2_ID = 502;
const Q5_3_ID = 503;
const Q5_4_ID = 504;
const Q5_5_ID = 505;
const Q5_6_ID = 506;
const Q5_7_ID = 507;
const Q5_8_ID = 508;

const sectionFiveQuestions = [
  {
    id: Q5_1_ID,
    title: 'What Were Other Visitors Doing?',
    text: 'Low impact activities other than what the submitter was engaged in. These are either observed or evidenced by tracks, etc. Motorized activities, industrial or agricultural activities are listed below.',
    question_type: 'selectall',
    section: 8,
    answers: [
      { text: 'Astronomy' },
      { text: 'Birding' },
      { text: 'Canoeing/Kayaking' },
      { text: 'Dog Walking' },
      { text: 'Equestrian' },
      { text: 'Fishing' },
      { text: 'None noted' },
      { text: 'Not Applicable' },
      { text: 'Other' },
    ],
    formorder: 1,
    is_required: true,
    sectionTitle: 'What are the human activities/disturbances affecting the Site?',
    sectionDescription: 'What human activities are in the site? Note, some of these activities may be permitted (e.g. grazing) and others may be illegal (e.g. tree cutting, gravel extraction). You need only report what you saw, SAPAA will try to determine whether the activity is permitted or not.',
    sectionHeader: 'Not There',
  },
  {
    id: Q5_2_ID,
    title: 'Agricultural Activities',
    text: 'Is the PA used by a local farmer/rancher? Many sites have grazing leases.',
    question_type: 'selectall',
    section: 8,
    answers: [
      { text: 'Domestic Animal Grazing' },
      { text: 'Seeded Crops or Haying' },
      { text: 'Land Clearing' },
      { text: 'None noted' },
      { text: 'Not Applicable' },
      { text: 'Other' },
    ],
    formorder: 2,
    is_required: true,
    sectionTitle: 'What are the human activities/disturbances affecting the Site?',
    sectionDescription: 'What human activities are in the site? Note, some of these activities may be permitted (e.g. grazing) and others may be illegal (e.g. tree cutting, gravel extraction). You need only report what you saw, SAPAA will try to determine whether the activity is permitted or not.',
    sectionHeader: 'Not There',
  },
  {
    id: Q5_3_ID,
    title: 'Resource extraction',
    text: '(Non) renewable resource extraction. Some sites have existing leases to allow this.',
    question_type: 'selectall',
    section: 8,
    answers: [
      { text: 'Oil/Gas wells' },
      { text: 'Tree Harvesting / Bark Stripping' },
      { text: 'Hunting (blinds, dressing site)' },
      { text: 'Collecting / Trapping' },
      { text: 'None noted' },
      { text: 'Not Applicable' },
      { text: 'Other' },
    ],
    formorder: 3,
    is_required: true,
    sectionTitle: 'What are the human activities/disturbances affecting the Site?',
    sectionDescription: 'What human activities are in the site? Note, some of these activities may be permitted (e.g. grazing) and others may be illegal (e.g. tree cutting, gravel extraction). You need only report what you saw, SAPAA will try to determine whether the activity is permitted or not.',
    sectionHeader: 'Not There',
  },
  {
    id: Q5_4_ID,
    title: 'Motorized disturbances (ATV or vehicle activity)',
    text: 'Some sites permit motorized access.',
    question_type: 'selectall',
    section: 8,
    answers: [
      { text: 'Off Highway Vehicles (4x4, ATVs)' },
      { text: 'Snowmobiles' },
      { text: 'Power Boats (lakes/rivers)' },
      { text: 'None noted' },
      { text: 'Not Applicable' },
      { text: 'Other' },
    ],
    formorder: 4,
    is_required: true,
    sectionTitle: 'What are the human activities/disturbances affecting the Site?',
    sectionDescription: 'What human activities are in the site? Note, some of these activities may be permitted (e.g. grazing) and others may be illegal (e.g. tree cutting, gravel extraction). You need only report what you saw, SAPAA will try to determine whether the activity is permitted or not.',
    sectionHeader: 'Not There',
  },
  {
    id: Q5_5_ID,
    title: 'Gathering and Dumping Activities',
    text: 'Living or partying on the site.',
    question_type: 'selectall',
    section: 8,
    answers: [
      { text: "Camping (lean-to's, fire rings, etc.)" },
      { text: 'Buildings (non-industrial, e.g. trailers)' },
      { text: 'Homeless camp' },
      { text: 'Bush party sites (e.g. bottles)' },
      { text: 'Non-hunting shooting' },
      { text: 'Garbage dumping/Vandalism' },
      { text: 'None noted' },
      { text: 'Not Applicable' },
    ],
    formorder: 5,
    is_required: true,
    sectionTitle: 'What are the human activities/disturbances affecting the Site?',
    sectionDescription: 'What human activities are in the site? Note, some of these activities may be permitted (e.g. grazing) and others may be illegal (e.g. tree cutting, gravel extraction). You need only report what you saw, SAPAA will try to determine whether the activity is permitted or not.',
    sectionHeader: 'Not There',
  },
  {
    id: Q5_6_ID,
    title: 'Infrastructure encroachment',
    text: 'How is industrialization and urbanization impacting the site?',
    question_type: 'selectall',
    section: 8,
    answers: [
      { text: 'Buildings' },
      { text: 'Cut fences, unauthorized entries' },
      { text: 'Cut lines' },
      { text: 'Diversion of water (culverts, etc.)' },
      { text: 'Pipelines' },
      { text: 'Power lines' },
      { text: 'Roads' },
      { text: 'Ad hoc structures (e.g. bridges)' },
      { text: 'None noted' },
      { text: 'Not Applicable' },
    ],
    formorder: 6,
    is_required: true,
    sectionTitle: 'What are the human activities/disturbances affecting the Site?',
    sectionDescription: 'What human activities are in the site? Note, some of these activities may be permitted (e.g. grazing) and others may be illegal (e.g. tree cutting, gravel extraction). You need only report what you saw, SAPAA will try to determine whether the activity is permitted or not.',
    sectionHeader: 'Not There',
  },
  {
    id: Q5_7_ID,
    title: 'Invasive Plants / Disease',
    text: 'Post any observed plant or animal invasions to iNaturalist.ca. Provide any overall or additional comments here (e.g. large Canada thistle infestation in the SW corner of the parcel).',
    question_type: 'text',
    section: 8,
    answers: [],
    formorder: 7,
    is_required: false,
    sectionTitle: 'What are the human activities/disturbances affecting the Site?',
    sectionDescription: 'What human activities are in the site? Note, some of these activities may be permitted (e.g. grazing) and others may be illegal (e.g. tree cutting, gravel extraction). You need only report what you saw, SAPAA will try to determine whether the activity is permitted or not.',
    sectionHeader: 'Not There',
  },
  {
    id: Q5_8_ID,
    title: 'Comments',
    text: 'Any Comments on how the site is being used or disturbed by humans not covered by the above?',
    question_type: 'text',
    section: 8,
    answers: [],
    formorder: 8,
    is_required: false,
    sectionTitle: 'What are the human activities/disturbances affecting the Site?',
    sectionDescription: 'What human activities are in the site? Note, some of these activities may be permitted (e.g. grazing) and others may be illegal (e.g. tree cutting, gravel extraction). You need only report what you saw, SAPAA will try to determine whether the activity is permitted or not.',
    sectionHeader: 'Not There',
  },
];

async function renderSectionFiveMainContent(mockOnChange: jest.Mock) {
  mockGetQuestionsOnline.mockResolvedValue(sectionFiveQuestions);

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
    expect(screen.getByText('Not There')).toBeInTheDocument();
  });
  fireEvent.click(screen.getByText('Not There'));

  await waitFor(() => {
    expect(
      screen.getByRole('heading', { level: 3, name: 'What Were Other Visitors Doing?' })
    ).toBeInTheDocument();
  });
}

describe('US 1.0.13 - Address Any Human Disturbances', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
  });

  it('renders section 5 questions 5.1 through 5.8', async () => {
    await renderSectionFiveMainContent(jest.fn());

    expect(
      screen.getByRole('heading', { level: 2, name: 'What are the human activities/disturbances affecting the Site?' })
    ).toBeInTheDocument();

    const headings = screen.getAllByRole('heading', { level: 3 }).map((h) => h.textContent?.trim());
    expect(headings).toEqual([
      'What Were Other Visitors Doing?',
      'Agricultural Activities',
      'Resource extraction',
      'Motorized disturbances (ATV or vehicle activity)',
      'Gathering and Dumping Activities',
      'Infrastructure encroachment',
      'Invasive Plants / Disease',
      'Comments',
    ]);
    expect(headings.length).toBe(8);
  });

  it('5.1 user can indicate what other visitors were doing', async () => {
    const mockOnChange = jest.fn();
    await renderSectionFiveMainContent(mockOnChange);

    fireEvent.click(screen.getByText('Astronomy'));
    fireEvent.click(screen.getByText('Birding'));

    const latestResponses = mockOnChange.mock.calls[mockOnChange.mock.calls.length - 1][0];
    expect(latestResponses[Q5_1_ID]).toEqual(expect.arrayContaining(['Astronomy', 'Birding']));
  });

  it('5.2 user can indicate agricultural activity', async () => {
    const mockOnChange = jest.fn();
    await renderSectionFiveMainContent(mockOnChange);

    fireEvent.click(screen.getByText('Domestic Animal Grazing'));

    const latestResponses = mockOnChange.mock.calls[mockOnChange.mock.calls.length - 1][0];
    expect(latestResponses[Q5_2_ID]).toEqual(expect.arrayContaining(['Domestic Animal Grazing']));
  });

  it('5.3 user can indicate resource extraction activity', async () => {
    const mockOnChange = jest.fn();
    await renderSectionFiveMainContent(mockOnChange);

    fireEvent.click(screen.getByText('Oil/Gas wells'));

    const latestResponses = mockOnChange.mock.calls[mockOnChange.mock.calls.length - 1][0];
    expect(latestResponses[Q5_3_ID]).toEqual(expect.arrayContaining(['Oil/Gas wells']));
  });

  it('5.4 user can indicate motorized disturbance', async () => {
    const mockOnChange = jest.fn();
    await renderSectionFiveMainContent(mockOnChange);

    fireEvent.click(screen.getByText('Off Highway Vehicles (4x4, ATVs)'));

    const latestResponses = mockOnChange.mock.calls[mockOnChange.mock.calls.length - 1][0];
    expect(latestResponses[Q5_4_ID]).toEqual(expect.arrayContaining(['Off Highway Vehicles (4x4, ATVs)']));
  });

  it('5.5 user can indicate gathering and dumping activity', async () => {
    const mockOnChange = jest.fn();
    await renderSectionFiveMainContent(mockOnChange);

    fireEvent.click(screen.getByText('Garbage dumping/Vandalism'));

    const latestResponses = mockOnChange.mock.calls[mockOnChange.mock.calls.length - 1][0];
    expect(latestResponses[Q5_5_ID]).toEqual(expect.arrayContaining(['Garbage dumping/Vandalism']));
  });

  it('5.6 user can indicate infrastructure encroachment', async () => {
    const mockOnChange = jest.fn();
    await renderSectionFiveMainContent(mockOnChange);

    fireEvent.click(screen.getByText('Buildings'));

    const latestResponses = mockOnChange.mock.calls[mockOnChange.mock.calls.length - 1][0];
    expect(latestResponses[Q5_6_ID]).toEqual(expect.arrayContaining(['Buildings']));
  });

  it('5.7 user can enter invasive plants or disease comments', async () => {
    const mockOnChange = jest.fn();
    await renderSectionFiveMainContent(mockOnChange);

    const input = await screen.findByTestId(`question-input-${Q5_7_ID}`);
    const value = 'Observed spread of invasive thistle near trail edge.';
    fireEvent.change(input, { target: { value } });

    const latestResponses = mockOnChange.mock.calls[mockOnChange.mock.calls.length - 1][0];
    expect(latestResponses[Q5_7_ID]).toBe(value);
  });

  it('5.8 user can enter comments on human disturbances', async () => {
    const mockOnChange = jest.fn();
    await renderSectionFiveMainContent(mockOnChange);

    const input = await screen.findByTestId(`question-input-${Q5_8_ID}`);
    const value = 'Increased litter and visible foot traffic from nearby parking area.';
    fireEvent.change(input, { target: { value } });

    const latestResponses = mockOnChange.mock.calls[mockOnChange.mock.calls.length - 1][0];
    expect(latestResponses[Q5_8_ID]).toBe(value);
  });

  it('5.8 comments can be cleared when not applicable', async () => {
    const mockOnChange = jest.fn();
    await renderSectionFiveMainContent(mockOnChange);

    const input = await screen.findByTestId(`question-input-${Q5_8_ID}`);
    fireEvent.change(input, { target: { value: 'Temporary note' } });
    fireEvent.change(input, { target: { value: '' } });

    const latestResponses = mockOnChange.mock.calls[mockOnChange.mock.calls.length - 1][0];
    expect(latestResponses[Q5_8_ID]).toBe('');
  });
});
