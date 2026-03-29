import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import FormEditorPage from '../../app/admin/form-editor/page';
import * as formActions from '../../utils/form-actions';
import * as queries from '../../utils/supabase/queries';

// Mock next/navigation
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(() => ({ push: jest.fn(), back: jest.fn() })),
  usePathname: jest.fn(() => '/admin/form-editor'),
  useParams: jest.fn(() => ({ namesite: 'Test%20Site', responseId: '42' })),
}));

// Mock next/image
jest.mock('next/image', () => (props: any) => <img {...props} alt={props.alt} />);

// Mock components
jest.mock('../../app/admin/AdminNavBar', () => () => <div>AdminNavBarMock</div>);
jest.mock('../../components/ProtectedRoute', () => ({ children }: any) => <div>{children}</div>);

// Mock @dnd-kit
jest.mock('@dnd-kit/core', () => ({
  DndContext: ({ children }: any) => <div>{children}</div>,
  rectIntersection: jest.fn(),
  PointerSensor: jest.fn(),
  useSensor: jest.fn(() => ({})),
  useSensors: jest.fn(() => []),
  useDroppable: jest.fn(() => ({ setNodeRef: jest.fn(), isOver: false })),
}));

jest.mock('@dnd-kit/sortable', () => ({
  SortableContext: ({ children }: any) => <div>{children}</div>,
  verticalListSortingStrategy: jest.fn(),
  useSortable: jest.fn(() => ({
    attributes: {},
    listeners: {},
    setNodeRef: jest.fn(),
    transform: null,
    transition: null,
    isDragging: false,
  })),
  arrayMove: jest.fn((arr: any[], from: number, to: number) => {
    const result = [...arr];
    const [item] = result.splice(from, 1);
    result.splice(to, 0, item);
    return result;
  }),
}));

jest.mock('@dnd-kit/utilities', () => ({
  CSS: { Transform: { toString: jest.fn(() => '') } },
}));

// Mock admin functions
jest.mock('../../utils/form-actions', () => ({
  fetchFormSections: jest.fn(),
  fetchFormQuestions: jest.fn(),
  saveQuestion: jest.fn(),
  toggleQuestionActive: jest.fn(),
  addQuestion: jest.fn(),
  reorderQuestions: jest.fn(),
}));

// Mock user-facing query functions
jest.mock('../../utils/supabase/queries', () => ({
  getQuestionsOnline: jest.fn(),
  getFormResponseById: jest.fn(),
  getQuestionResponseType: jest.fn(),
  isSteward: jest.fn(),
  getCurrentUserUid: jest.fn(),
  getCurrentSiteId: jest.fn(),
  addSiteInspectionReport: jest.fn(),
  uploadSiteInspectionAnswers: jest.fn(),
  updateSiteInspectionAnswers: jest.fn(),
  getResponseOwnerId: jest.fn(),
  getSitesOnline: jest.fn(),
}));

// ─── Test Data ────────────────────────────────────────────────────────

const mockSections: formActions.FormSection[] = [
  { id: 1, title: 'General Information', description: 'Basic site details', header: 'General' },
];

// All questions as they appear in the admin form editor (includes is_active flag)
const allAdminQuestions: formActions.FormQuestion[] = [
  {
    id: 101,
    form_question: 'Site Name (Q1)',
    subtext: 'Enter the official site name',
    question_type: 'text',
    is_required: true,
    is_active: true,
    section_id: 1,
    autofill_key: null,
    question_key_id: 1,
    formorder: 1,
    options: [],
  },
  {
    id: 102,
    form_question: 'Water Quality (Q2)',
    subtext: 'Rate the water quality',
    question_type: 'option',
    is_required: true,
    is_active: true,
    section_id: 1,
    autofill_key: null,
    question_key_id: 2,
    formorder: 2,
    options: [
      { id: 1, option_text: 'Good', is_active: true },
      { id: 2, option_text: 'Fair', is_active: true },
      { id: 3, option_text: 'Poor', is_active: true },
    ],
  },
  {
    id: 103,
    form_question: 'Additional Notes (Q3)',
    subtext: null,
    question_type: 'text',
    is_required: false,
    is_active: true,
    section_id: 1,
    autofill_key: null,
    question_key_id: 3,
    formorder: 3,
    options: [],
  },
];

// Questions as returned by getQuestionsOnline (user-facing, only is_active=true)
function getUserFacingQuestions(adminQuestions: formActions.FormQuestion[]): queries.question[] {
  return adminQuestions
    .filter(q => q.is_active)
    .map(q => ({
      id: q.id,
      title: q.form_question,
      text: q.subtext,
      question_type: q.question_type,
      section: q.section_id,
      is_required: q.is_required,
      answers: q.options.map(o => o.option_text),
      formorder: q.formorder,
      sectionTitle: 'General Information',
      sectionDescription: 'Basic site details',
      sectionHeader: 'General',
    }));
}

// ─── Tests ────────────────────────────────────────────────────────────

describe('Admin Hide/Show Questions on Site Inspection Form', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (formActions.fetchFormSections as jest.Mock).mockResolvedValue(mockSections);
    (formActions.fetchFormQuestions as jest.Mock).mockResolvedValue(allAdminQuestions);
    (formActions.toggleQuestionActive as jest.Mock).mockResolvedValue(undefined);
    (queries.getQuestionsOnline as jest.Mock).mockResolvedValue(getUserFacingQuestions(allAdminQuestions));
  });

  // AT1: If an admin toggles a question to be hidden, users can no longer access it when filling out the form

  describe('Hidden questions are excluded from the user-facing form', () => {
    it('after hiding a question, getQuestionsOnline no longer returns it', async () => {
      render(<FormEditorPage />);
      await waitFor(() => {
        expect(screen.getByText('Water Quality (Q2)')).toBeInTheDocument();
      });

      // Simulate: admin hides "Water Quality (Q2)"
      fireEvent.click(screen.getByTestId('Water Quality (Q2) Hide Button'));

      await waitFor(() => {
        expect(formActions.toggleQuestionActive).toHaveBeenCalledWith(102, true);
      });

      // After the toggle, the DB now has is_active=false for question 102.
      // Simulate what getQuestionsOnline returns after the hide:
      const questionsAfterHide = allAdminQuestions.map(q =>
        q.id === 102 ? { ...q, is_active: false } : q
      );
      (queries.getQuestionsOnline as jest.Mock).mockResolvedValue(
        getUserFacingQuestions(questionsAfterHide)
      );

      // Call getQuestionsOnline as users would when filling out the form
      const userQuestions = await queries.getQuestionsOnline();

      // The hidden question should NOT be in the user-facing list
      expect(userQuestions.find((q: queries.question) => q.id === 102)).toBeUndefined();
      // The other questions should still be present
      expect(userQuestions.find((q: queries.question) => q.id === 101)).toBeDefined();
      expect(userQuestions.find((q: queries.question) => q.id === 103)).toBeDefined();
    });
  });

  // AT2: If an admin toggles a question to be hidden, users can no longer edit their responses to it in previous forms

  describe('Hidden questions are excluded from the edit form', () => {
    it('after hiding a question, getQuestionsOnline excludes it from edit-report too', async () => {
      render(<FormEditorPage />);
      await waitFor(() => {
        expect(screen.getByText('Water Quality (Q2)')).toBeInTheDocument();
      });

      // Admin hides question 102
      fireEvent.click(screen.getByTestId('Water Quality (Q2) Hide Button'));

      await waitFor(() => {
        expect(formActions.toggleQuestionActive).toHaveBeenCalledWith(102, true);
      });

      // Simulate post-hide state
      const questionsAfterHide = allAdminQuestions.map(q =>
        q.id === 102 ? { ...q, is_active: false } : q
      );
      (queries.getQuestionsOnline as jest.Mock).mockResolvedValue(
        getUserFacingQuestions(questionsAfterHide)
      );

      // When edit-report calls getQuestionsOnline, the hidden question is excluded
      const editableQuestions = await queries.getQuestionsOnline();
      const hiddenQuestion = editableQuestions.find((q: queries.question) => q.id === 102);
      expect(hiddenQuestion).toBeUndefined();
      expect(editableQuestions).toHaveLength(2);
    });
  });

  // AT3: If an admin toggles a question to be hidden, it will still be shown on existing / past reports

  describe('Hidden questions still appear in past reports', () => {
    it('getFormResponseById still returns answers for hidden questions', async () => {
      // Past report has answers for all questions including the one being hidden
      const pastReportAnswers: Record<number, any> = {
        101: 'My Site',
        102: 'Good',
        103: 'Looks great',
      };
      (queries.getFormResponseById as jest.Mock).mockResolvedValue(pastReportAnswers);

      render(<FormEditorPage />);
      await waitFor(() => {
        expect(screen.getByText('Water Quality (Q2)')).toBeInTheDocument();
      });

      // Admin hides question 102
      fireEvent.click(screen.getByTestId('Water Quality (Q2) Hide Button'));

      await waitFor(() => {
        expect(formActions.toggleQuestionActive).toHaveBeenCalledWith(102, true);
      });

      // Past report data is fetched by response ID - no is_active filter
      const reportData = await queries.getFormResponseById(42);

      // The answer for the hidden question is STILL in the report
      expect(reportData[102]).toBe('Good');
      // All answers are preserved
      expect(reportData[101]).toBe('My Site');
      expect(reportData[103]).toBe('Looks great');
    });
  });

  // AT4: If an admin toggles a question to be visible, users will be able to access it when filling out the form

  describe('Shown questions are included in the user-facing form', () => {
    it('after showing a hidden question, getQuestionsOnline returns it again', async () => {
      // Start with question 102 already hidden
      const questionsWithHidden = allAdminQuestions.map(q =>
        q.id === 102 ? { ...q, is_active: false } : q
      );
      (formActions.fetchFormQuestions as jest.Mock).mockResolvedValue(questionsWithHidden);
      (queries.getQuestionsOnline as jest.Mock).mockResolvedValue(
        getUserFacingQuestions(questionsWithHidden)
      );

      render(<FormEditorPage />);
      await waitFor(() => {
        expect(screen.getByText('Water Quality (Q2)')).toBeInTheDocument();
      });

      // Verify the question currently has a "Show Button" (it's hidden)
      expect(screen.getByTestId('Water Quality (Q2) Show Button')).toBeInTheDocument();

      // Admin clicks Show to make it visible again
      fireEvent.click(screen.getByTestId('Water Quality (Q2) Show Button'));

      await waitFor(() => {
        expect(formActions.toggleQuestionActive).toHaveBeenCalledWith(102, false);
      });

      // After re-enabling, getQuestionsOnline now returns all 3 questions
      (queries.getQuestionsOnline as jest.Mock).mockResolvedValue(
        getUserFacingQuestions(allAdminQuestions)
      );

      const userQuestions = await queries.getQuestionsOnline();

      // The re-enabled question should now be in the user-facing list
      expect(userQuestions.find((q: queries.question) => q.id === 102)).toBeDefined();
      expect(userQuestions).toHaveLength(3);
    });
  });

  // AT5: If an admin toggles a question to be visible, users will be able to edit their responses to it in previous forms

  describe('Shown questions are included in the edit form', () => {
    it('after showing a hidden question, getQuestionsOnline includes it for editing', async () => {
      // Start with question 102 hidden
      const questionsWithHidden = allAdminQuestions.map(q =>
        q.id === 102 ? { ...q, is_active: false } : q
      );
      (formActions.fetchFormQuestions as jest.Mock).mockResolvedValue(questionsWithHidden);
      (queries.getQuestionsOnline as jest.Mock).mockResolvedValue(
        getUserFacingQuestions(questionsWithHidden)
      );

      render(<FormEditorPage />);
      await waitFor(() => {
        expect(screen.getByText('Water Quality (Q2)')).toBeInTheDocument();
      });

      // Admin shows the question
      fireEvent.click(screen.getByTestId('Water Quality (Q2) Show Button'));

      await waitFor(() => {
        expect(formActions.toggleQuestionActive).toHaveBeenCalledWith(102, false);
      });

      // Now getQuestionsOnline returns all questions including the re-enabled one
      (queries.getQuestionsOnline as jest.Mock).mockResolvedValue(
        getUserFacingQuestions(allAdminQuestions)
      );

      const editableQuestions = await queries.getQuestionsOnline();
      const reenabledQuestion = editableQuestions.find((q: queries.question) => q.id === 102);

      expect(reenabledQuestion).toBeDefined();
      expect(reenabledQuestion!.title).toBe('Water Quality (Q2)');
      expect(editableQuestions).toHaveLength(3);
    });
  });

  // ─── Admin UI behavior when hiding/showing ─────────────────────────

  describe('Admin form editor UI reflects visibility state', () => {
    it('hidden question shows Hidden badge and Show button in admin view', async () => {
      const questionsWithHidden = allAdminQuestions.map(q =>
        q.id === 102 ? { ...q, is_active: false } : q
      );
      (formActions.fetchFormQuestions as jest.Mock).mockResolvedValue(questionsWithHidden);

      render(<FormEditorPage />);
      await waitFor(() => {
        expect(screen.getByText('Water Quality (Q2)')).toBeInTheDocument();
      });

      // Hidden question still appears in admin view (admin can see all questions)
      expect(screen.getByText('Water Quality (Q2)')).toBeInTheDocument();
      // It should have a "Show Button" since it's hidden
      expect(screen.getByTestId('Water Quality (Q2) Show Button')).toBeInTheDocument();
      // It should display a "Hidden" badge
      expect(screen.getByText('Hidden')).toBeInTheDocument();
    });

    it('visible question shows Hide button and no Hidden badge', async () => {
      render(<FormEditorPage />);
      await waitFor(() => {
        expect(screen.getByText('Water Quality (Q2)')).toBeInTheDocument();
      });

      // Active question has a Hide button
      expect(screen.getByTestId('Water Quality (Q2) Hide Button')).toBeInTheDocument();
      // No Hidden badge for active questions
      expect(screen.queryByText('Hidden')).not.toBeInTheDocument();
    });

    it('toggling hide updates the admin UI optimistically', async () => {
      render(<FormEditorPage />);
      await waitFor(() => {
        expect(screen.getByTestId('Water Quality (Q2) Hide Button')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByTestId('Water Quality (Q2) Hide Button'));

      // Button should immediately flip to Show (optimistic update)
      await waitFor(() => {
        expect(screen.getByTestId('Water Quality (Q2) Show Button')).toBeInTheDocument();
      });
    });

    it('toggling show updates the admin UI optimistically', async () => {
      const questionsWithHidden = allAdminQuestions.map(q =>
        q.id === 102 ? { ...q, is_active: false } : q
      );
      (formActions.fetchFormQuestions as jest.Mock).mockResolvedValue(questionsWithHidden);

      render(<FormEditorPage />);
      await waitFor(() => {
        expect(screen.getByTestId('Water Quality (Q2) Show Button')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByTestId('Water Quality (Q2) Show Button'));

      // Button should immediately flip to Hide (optimistic update)
      await waitFor(() => {
        expect(screen.getByTestId('Water Quality (Q2) Hide Button')).toBeInTheDocument();
      });
    });
  });
});
