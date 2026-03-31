import React from 'react';
import { render, waitFor, fireEvent, screen } from '@testing-library/react-native';
import { PaperProvider } from 'react-native-paper';
import SiteDetailScreen from '../../screens/SiteDetailScreen';
import NetInfo from '@react-native-community/netinfo';
import * as database from '../../services/database';
import { NavigationContainer } from '@react-navigation/native';

// --- Extra mocks to silence act() warnings from icon internals ---
jest.mock('@expo/vector-icons', () => {
  const React = require('react');
  const { Text } = require('react-native');
  const MC = ({ name }: { name: string }) => <Text>{name}</Text>;
  return { MaterialCommunityIcons: MC };
});

// Mock dependencies
jest.mock('@react-native-community/netinfo');
jest.mock('../../services/database');
jest.mock('@react-navigation/native', () => {
  const actualNav = jest.requireActual('@react-navigation/native');
  return {
    ...actualNav,
    useNavigation: () => ({
      navigate: jest.fn(),
    }),
  };
});

// Suppress RN Paper Surface overflow warnings
beforeAll(() => {
  jest.spyOn(console, 'warn').mockImplementation((msg) => {
    if (typeof msg === 'string' && msg.includes('overflow to hidden on Surface')) return;
    console.warn(msg);
  });
});

const AllTheProviders = ({ children }: { children: React.ReactNode }) => (
  <NavigationContainer>
    <PaperProvider>{children}</PaperProvider>
  </NavigationContainer>
);

// Helpers to mirror component formatting (uses Date -> local parts)
const ymdLocal = (iso: string) => {
  const d = new Date(iso);
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
};
const formattedInspectionName = (iso: string, siteName: string) =>
  `${ymdLocal(iso)} ${siteName}`;

describe('SiteDetailScreen', () => {
  let mockUnsubscribe: jest.Mock;

  const mockSite = {
    id: 1,
    namesite: 'Test Site',
    county: 'Test County',
    inspectdate: '2024-01-15',
  };

  const mockRoute = {
    params: { site: mockSite },
    key: 'test-key',
    name: 'Detail' as const,
  };

  const mockInspectionDetails = [
    {
      id: 1,
      inspectdate: '2024-01-15',
      notes: 'First inspection',
      _type: 'Type A',
      _naregion: 'Region 1',
      naturalness_score: '4.5 - Excellent',
      naturalness_details: 'Good condition',
    },
    {
      id: 2,
      inspectdate: '2024-02-20',
      notes: 'Second inspection',
      _type: 'Type A',
      _naregion: 'Region 1',
      naturalness_score: '4.8 - Excellent',
      naturalness_details: 'Excellent condition',
    },
  ];

  const mockInspections = [
    { id: 1, site_id: 1, inspectdate: '2024-01-15', notes: 'First inspection' },
    { id: 2, site_id: 1, inspectdate: '2024-02-20', notes: 'Second inspection' },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    mockUnsubscribe = jest.fn();

    // Mock database functions
    (database.getImages as jest.Mock).mockResolvedValue([]);
    (database.getPdfs as jest.Mock).mockResolvedValue([]);
    (database.getInspections as jest.Mock).mockResolvedValue(mockInspections);
    (database.getInspectionDetailsOnline as jest.Mock).mockResolvedValue(
      mockInspectionDetails
    );
  });

  const goOnline = () => {
    (NetInfo.addEventListener as jest.Mock).mockImplementation((callback) => {
      callback({ isConnected: true });
      return mockUnsubscribe;
    });
  };
  const goOffline = () => {
    (NetInfo.addEventListener as jest.Mock).mockImplementation((callback) => {
      callback({ isConnected: false });
      return mockUnsubscribe;
    });
  };

  // TC37
  it('renders site name and county', async () => {
    goOnline();
    const { findByText } = render(<SiteDetailScreen route={mockRoute} />, {
      wrapper: AllTheProviders,
    });

    // Wait until the main header is on screen (after loading finishes)
    expect(await findByText('Test Site')).toBeTruthy();
    expect(await findByText('Test County')).toBeTruthy();

    await waitFor(() => {
      expect(database.getInspectionDetailsOnline).toHaveBeenCalled();
    });
  });

  // TC38
  it('loads and displays online inspection details when connected', async () => {
    goOnline();
    const { findByText, getAllByText } = render(<SiteDetailScreen route={mockRoute} />, {
      wrapper: AllTheProviders,
    });

    await waitFor(() => {
      expect(database.getInspectionDetailsOnline).toHaveBeenCalledWith('Test Site');
    });

    expect(await findByText('Site Details')).toBeTruthy();
    expect(await findByText(/Type A/)).toBeTruthy();
    expect(await findByText(/Region 1/)).toBeTruthy();

    // "4.5" may appear in more than one place; assert at least one match
    expect(getAllByText(/4\.5/).length).toBeGreaterThan(0);
    expect(await findByText(/Good condition/)).toBeTruthy();
  });

  // TC43, TC44
  it('displays inspection reports section', async () => {
    goOnline();
    const { findByText } = render(<SiteDetailScreen route={mockRoute} />, {
      wrapper: AllTheProviders,
    });

    expect(await findByText('Inspection Reports')).toBeTruthy();

    // Match formatted names using component's local-time logic
    const n1 = formattedInspectionName('2024-01-15', 'Test Site');
    const n2 = formattedInspectionName('2024-02-20', 'Test Site');

    expect(await findByText(n1)).toBeTruthy();
    expect(await findByText(n2)).toBeTruthy();
  });

  // TC43, TC44
  it('displays reports count', async () => {
    goOnline();
    const { findByText, getAllByText } = render(<SiteDetailScreen route={mockRoute} />, {
      wrapper: AllTheProviders,
    });

    expect(await findByText('Reports:')).toBeTruthy();
    // "2" might appear elsewhere; ensure at least one "2" exists
    expect(getAllByText(/^2$/).length).toBeGreaterThan(0);
  });

  // TC46, TC47
  it('displays average naturalness score with gradient slider', async () => {
    goOnline();
    const { findByText, getAllByText } = render(<SiteDetailScreen route={mockRoute} />, {
      wrapper: AllTheProviders,
    });

    expect(await findByText('Average Naturalness Score')).toBeTruthy();
    // Could appear in multiple places; accept any
    expect(getAllByText(/^4\.7$/).length).toBeGreaterThan(0); // avg(4.5, 4.8)=4.65→4.7
    expect(getAllByText(/Condition:/).length).toBeGreaterThan(0);
    expect(getAllByText(/Excellent/).length).toBeGreaterThan(0);
  });

  // TC46
  it('displays gradient labels', async () => {
    goOnline();
    const { findByText } = render(<SiteDetailScreen route={mockRoute} />, {
      wrapper: AllTheProviders,
    });

    expect(await findByText('Poor')).toBeTruthy();
    expect(await findByText('Average')).toBeTruthy();
    expect(await findByText('Good')).toBeTruthy();
    expect(await findByText('Excellent')).toBeTruthy();
  });

  // TC45
  it('loads offline inspections when not connected', async () => {
    goOffline();
    render(<SiteDetailScreen route={mockRoute} />, { wrapper: AllTheProviders });

    await waitFor(() => {
      expect(database.getInspectionDetailsOnline).not.toHaveBeenCalled();
    });
  });

  // TC43, TC44
  it('handles empty inspection list', async () => {
    (database.getInspectionDetailsOnline as jest.Mock).mockResolvedValue([]);
    goOnline();

    const { queryByText } = render(<SiteDetailScreen route={mockRoute} />, {
      wrapper: AllTheProviders,
    });

    await waitFor(() => {
      expect(database.getInspectionDetailsOnline).toHaveBeenCalled();
      expect(queryByText('Site Details')).toBeNull();
      expect(queryByText('Inspection Reports')).toBeNull();
      expect(queryByText('Average Naturalness Score')).toBeNull();
    });
  });

  // TC46, TC47
  it('displays N/A for missing inspection fields', async () => {
    const incompleteInspection = [
      {
        id: 1,
        inspectdate: '2024-01-15',
        notes: 'Test',
        _type: null,
        _naregion: null,
        naturalness_score: null,
        naturalness_details: null,
      },
    ];

    (database.getInspectionDetailsOnline as jest.Mock).mockResolvedValue(
      incompleteInspection
    );
    goOnline();

    const { findAllByText } = render(<SiteDetailScreen route={mockRoute} />, {
      wrapper: AllTheProviders,
    });

    const naTexts = await findAllByText(/N\/A/);
    expect(naTexts.length).toBeGreaterThan(0);
  });

  // TC44
  it('handles inspection with no notes', async () => {
    const inspectionWithoutNotes = [
      {
        id: 1,
        inspectdate: '2024-01-15',
        notes: null,
        _type: 'Type A',
        _naregion: 'Region 1',
        naturalness_score: '4.5',
        naturalness_details: 'Good',
      },
    ];

    (database.getInspectionDetailsOnline as jest.Mock).mockResolvedValue(
      inspectionWithoutNotes
    );
    goOnline();

    const { findByText, queryAllByText } = render(<SiteDetailScreen route={mockRoute} />, {
      wrapper: AllTheProviders,
    });

    // Expand the only inspection row first
    const rowTitle = formattedInspectionName('2024-01-15', 'Test Site');
    const rowTitleNode = await findByText(rowTitle);
    fireEvent.press(rowTitleNode);

    // check that there are no bullet points 
    const bulletPoints = queryAllByText(/^- /); // markdown bullet
    expect(bulletPoints.length).toBe(0);
  });

  // TC36
  it('unsubscribes from NetInfo on unmount', async () => {
    goOnline();
    const { unmount } = render(<SiteDetailScreen route={mockRoute} />, {
      wrapper: AllTheProviders,
    });

    await waitFor(() => {
      expect(database.getInspectionDetailsOnline).toHaveBeenCalled();
    });

    unmount();
    expect(mockUnsubscribe).toHaveBeenCalled();
  });

  // TC36
  it('shows loading state initially', () => {
    // Do NOT call the callback immediately to keep isOnline === null
    (NetInfo.addEventListener as jest.Mock).mockImplementation(() => mockUnsubscribe);

    const { getByText } = render(<SiteDetailScreen route={mockRoute} />, {
      wrapper: AllTheProviders,
    });

    expect(getByText('Checking network...')).toBeTruthy();
  });

  // TC38
  it('handles errors during inspection loading', async () => {
    const errorMessage = 'Failed to load inspections';
    (database.getInspectionDetailsOnline as jest.Mock).mockRejectedValue(
      new Error(errorMessage)
    );
    goOnline();

    const { findByText } = render(<SiteDetailScreen route={mockRoute} />, {
      wrapper: AllTheProviders,
    });

    expect(await findByText(errorMessage)).toBeTruthy();
  });

  // TC37
  it('displays age badge without color', async () => {
    goOnline();
    const { findByText } = render(<SiteDetailScreen route={mockRoute} />, {
      wrapper: AllTheProviders,
    });

    // Age badge should show D/M/Y (e.g., "10M", "1Y")
    const ageRegex = /\d+[DMY]/;
    expect(await findByText(ageRegex)).toBeTruthy();
  });

  // TC46
  it('computes average naturalness correctly', async () => {
    const mixedScores = [
      {
        id: 1,
        inspectdate: '2024-01-15',
        notes: 'Test 1',
        _type: 'Type A',
        _naregion: 'Region 1',
        naturalness_score: '2.0 - Fair',
        naturalness_details: 'Fair',
      },
      {
        id: 2,
        inspectdate: '2024-02-20',
        notes: 'Test 2',
        _type: 'Type A',
        _naregion: 'Region 1',
        naturalness_score: '4.0 - Excellent',
        naturalness_details: 'Excellent',
      },
    ];

    (database.getInspectionDetailsOnline as jest.Mock).mockResolvedValue(mixedScores);
    goOnline();

    const { getAllByText, findByText } = render(<SiteDetailScreen route={mockRoute} />, {
      wrapper: AllTheProviders,
    });

    // Average of 2.0 and 4.0 is 3.0 - may appear in multiple places
    await waitFor(() => {
      expect(getAllByText(/^3(?:\.0)?$/).length).toBeGreaterThan(0);
    });
    expect(await findByText(/Condition: Good/)).toBeTruthy();
  });

  // TC46
  it('does not show gradient slider when no average available', async () => {
    const noScores = [
      {
        id: 1,
        inspectdate: '2024-01-15',
        notes: 'Test',
        _type: 'Type A',
        _naregion: 'Region 1',
        naturalness_score: null,
        naturalness_details: null,
      },
    ];

    (database.getInspectionDetailsOnline as jest.Mock).mockResolvedValue(noScores);
    goOnline();

    const { queryByText } = render(<SiteDetailScreen route={mockRoute} />, {
      wrapper: AllTheProviders,
    });

    await waitFor(() => {
      expect(queryByText('Average Naturalness Score')).toBeNull();
      expect(queryByText(/Condition:/)).toBeNull();
    });
  });
});

describe('SiteDetailScreen - extended coverage', () => {
  let mockUnsubscribe: jest.Mock;

  const mockSite = {
    id: 1,
    namesite: 'Test Site',
    county: 'Test County',
    inspectdate: '2024-01-15',
  };

  const mockRoute = { params: { site: mockSite }, key: 'test-key', name: 'Detail' as const };

  beforeEach(() => {
    jest.clearAllMocks();
    mockUnsubscribe = jest.fn();
  });

  const goOnline = () => {
    (NetInfo.addEventListener as jest.Mock).mockImplementation((callback) => {
      callback({ isConnected: true });
      return mockUnsubscribe;
    });
  };

  const inspectionWithNotes = [
    {
      id: 1,
      inspectdate: '2024-01-15',
      notes: 'Q1_First note; Q2_Second note',
      _type: 'Type A',
      _naregion: 'Region 1',
      naturalness_score: '4.5',
      naturalness_details: 'Good',
    },
    {
      id: 2,
      inspectdate: '2024-02-20',
      notes: 'Q2_Second inspection note',
      _type: 'Type A',
      _naregion: 'Region 1',
      naturalness_score: '4.8',
      naturalness_details: 'Excellent',
    },
  ];

  it('renders "By Question" tab and expands questions correctly', async () => {
    (database.getInspectionDetailsOnline as jest.Mock).mockResolvedValue(inspectionWithNotes);
    goOnline();

    const { findByText, getByText } = render(
      <SiteDetailScreen route={mockRoute} />,
      { wrapper: AllTheProviders }
    );

    // Switch to "By Question" tab
    const byQuestionTab = await findByText('By Question');
    fireEvent.press(byQuestionTab);

    // Expand Q1
    const q1Header = await findByText('Q1');
    fireEvent.press(q1Header);

    // Wait for the first note to appear
    await waitFor(() => expect(getByText('First note')).toBeTruthy());

    // Expand Q2
    const q2Header = await findByText('Q2');
    fireEvent.press(q2Header);

    // Wait for the second note to appear
    await waitFor(() => expect(getByText('Second note')).toBeTruthy());
  });

  it('opens PDF modal when generate-report button pressed', async () => {
    (database.getInspectionDetailsOnline as jest.Mock).mockResolvedValue(inspectionWithNotes);
    (database.getPdfs as jest.Mock).mockResolvedValue([]);
    goOnline();

    const { findByTestId, getByTestId, getByText } = render(<SiteDetailScreen route={mockRoute} />, { 
      wrapper: AllTheProviders 
    });

    // Wait for component to load completely
    await findByTestId('generate-report');
    
    const generateBtn = getByTestId('generate-report');
    fireEvent.press(generateBtn);

    // Look for the PDF modal title using getByText (not getByTestId)
    await waitFor(() => {
      expect(getByText('Generate PDF Report')).toBeTruthy();
    });
  });

  it('opens Markdown modal and shows notes content', async () => {
    (database.getInspectionDetailsOnline as jest.Mock).mockResolvedValue(inspectionWithNotes);
    goOnline();

    const { findByText } = render(<SiteDetailScreen route={mockRoute} />, { wrapper: AllTheProviders });
    const rowTitle = formattedInspectionName('2024-01-15', 'Test Site');
    fireEvent.press(await findByText(rowTitle));

    expect(await findByText('Q1_First note')).toBeTruthy();
    expect(await findByText('Q2_Second note')).toBeTruthy();
  });

  it('toggles expanded inspections in ByDate view', async () => {
    (database.getInspectionDetailsOnline as jest.Mock).mockResolvedValue(inspectionWithNotes);
    goOnline();

    const { findByText } = render(<SiteDetailScreen route={mockRoute} />, { wrapper: AllTheProviders });
    const firstRow = await findByText(formattedInspectionName('2024-01-15', 'Test Site'));
    fireEvent.press(firstRow);
    expect(await findByText('Close')).toBeTruthy();

    const secondRow = await findByText(formattedInspectionName('2024-02-20', 'Test Site'));
    fireEvent.press(secondRow);
    expect(await findByText('Close')).toBeTruthy();
  });
});
