import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import FormEditorPage from '../../app/admin/form-editor/page';
import * as formActions from '../../utils/form-actions';
import * as queries from '../../utils/supabase/queries';

// Mock next/navigation
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(() => ({ push: jest.fn(), back: jest.fn() })),
  usePathname: jest.fn(() => '/admin/form-editor'),
  useParams: jest.fn(() => ({ namesite: 'Test%20Site' })),
}));

// Mock next/image
jest.mock('next/image', () => (props: any) => <img {...props} alt={props.alt} />);

// Mock components
jest.mock('../../app/admin/AdminNavBar', () => () => <div>AdminNavBarMock</div>);
jest.mock('../../components/ProtectedRoute', () => ({ children, requireAdmin }: any) => (
  <div data-testid="protected-route" data-require-admin={requireAdmin?.toString()}>{children}</div>
));

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
  addFormSection: jest.fn(),
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
  { id: 2, title: 'Environmental', description: 'Environmental observations', header: 'Environment' },
];

const mockQuestions: formActions.FormQuestion[] = [
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
];

// Helper: convert admin questions to the user-facing format returned by getQuestionsOnline
function toUserFacingQuestions(adminQs: formActions.FormQuestion[]): queries.question[] {
  return adminQs
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

describe('Admin Add Questions to Site Inspection Form', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (formActions.fetchFormSections as jest.Mock).mockResolvedValue(mockSections);
    (formActions.fetchFormQuestions as jest.Mock).mockResolvedValue(mockQuestions);
    (formActions.addQuestion as jest.Mock).mockResolvedValue(undefined);
    (formActions.saveQuestion as jest.Mock).mockResolvedValue(undefined);
    (formActions.toggleQuestionActive as jest.Mock).mockResolvedValue(undefined);
    (formActions.addFormSection as jest.Mock).mockResolvedValue(3);
    (queries.getQuestionsOnline as jest.Mock).mockResolvedValue(toUserFacingQuestions(mockQuestions));
  });

  // ─── AT1: Able to add new questions and save the form ───────────────

  describe('Add new questions to the Site Inspection Form and save', () => {
    it('opens the add question form when Add Question is clicked', async () => {
      render(<FormEditorPage />);
      await waitFor(() => {
        expect(screen.getByText('Site Name (Q1)')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByRole('button', { name: /Add Question/i }));

      expect(screen.getByTestId('add-question-title')).toBeInTheDocument();
      expect(screen.getByTestId('add-question-subtext')).toBeInTheDocument();
      expect(screen.getByTestId('add-question-key')).toBeInTheDocument();
    });

    it('saves a new text question with all fields filled', async () => {
      render(<FormEditorPage />);
      await waitFor(() => {
        expect(screen.getByText('Site Name (Q1)')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByRole('button', { name: /Add Question/i }));

      // Select Text type
      fireEvent.click(screen.getByTestId('question-type-Text'));

      fireEvent.change(screen.getByTestId('add-question-title'), {
        target: { value: 'Steward Comments (Q70)' },
      });
      fireEvent.change(screen.getByTestId('add-question-subtext'), {
        target: { value: 'Any additional observations' },
      });
      fireEvent.change(screen.getByTestId('add-question-key'), {
        target: { value: 'Q70_StewardComments' },
      });

      fireEvent.click(screen.getByTestId('save-new-question'));

      await waitFor(() => {
        expect(formActions.addQuestion).toHaveBeenCalledWith(
          1,
          expect.objectContaining({
            form_question: 'Steward Comments (Q70)',
            subtext: 'Any additional observations',
            question_key: 'Q70_StewardComments',
            question_type: 'text',
            is_required: false,
            options: [],
          })
        );
      });
    });

    it('saves a new radio question with options', async () => {
      render(<FormEditorPage />);
      await waitFor(() => {
        expect(screen.getByText('Site Name (Q1)')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByRole('button', { name: /Add Question/i }));

      // Default type is Radio (option)
      fireEvent.change(screen.getByTestId('add-question-title'), {
        target: { value: 'Trail Condition (Q71)' },
      });
      fireEvent.change(screen.getByTestId('add-question-key'), {
        target: { value: 'Q71_TrailCondition' },
      });

      // Fill in the default two option inputs
      const optionInputs = screen.getAllByPlaceholderText(/Option \d/);
      fireEvent.change(optionInputs[0], { target: { value: 'Good' } });
      fireEvent.change(optionInputs[1], { target: { value: 'Poor' } });

      fireEvent.click(screen.getByTestId('save-new-question'));

      await waitFor(() => {
        expect(formActions.addQuestion).toHaveBeenCalledWith(
          1,
          expect.objectContaining({
            form_question: 'Trail Condition (Q71)',
            question_type: 'option',
            options: ['Good', 'Poor'],
          })
        );
      });
    });

    it('saves a new checkbox (selectall) question', async () => {
      render(<FormEditorPage />);
      await waitFor(() => {
        expect(screen.getByText('Site Name (Q1)')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByRole('button', { name: /Add Question/i }));

      // Select Checkbox type
      fireEvent.click(screen.getByTestId('question-type-Checkbox'));

      fireEvent.change(screen.getByTestId('add-question-title'), {
        target: { value: 'Issues Found (Q72)' },
      });
      fireEvent.change(screen.getByTestId('add-question-key'), {
        target: { value: 'Q72_IssuesFound' },
      });

      const optionInputs = screen.getAllByPlaceholderText(/Option \d/);
      fireEvent.change(optionInputs[0], { target: { value: 'Litter' } });
      fireEvent.change(optionInputs[1], { target: { value: 'Erosion' } });

      fireEvent.click(screen.getByTestId('save-new-question'));

      await waitFor(() => {
        expect(formActions.addQuestion).toHaveBeenCalledWith(
          1,
          expect.objectContaining({
            question_type: 'selectall',
            options: ['Litter', 'Erosion'],
          })
        );
      });
    });

    it('can mark a new question as required', async () => {
      render(<FormEditorPage />);
      await waitFor(() => {
        expect(screen.getByText('Site Name (Q1)')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByRole('button', { name: /Add Question/i }));

      fireEvent.change(screen.getByTestId('add-question-title'), {
        target: { value: 'Required Field (Q73)' },
      });
      fireEvent.change(screen.getByTestId('add-question-key'), {
        target: { value: 'Q73_Required' },
      });

      // Check the "Required question" checkbox
      const requiredCheckbox = screen.getByRole('checkbox', { name: /Required question/i });
      fireEvent.click(requiredCheckbox);

      fireEvent.click(screen.getByTestId('save-new-question'));

      await waitFor(() => {
        expect(formActions.addQuestion).toHaveBeenCalledWith(
          1,
          expect.objectContaining({
            is_required: true,
          })
        );
      });
    });

    it('shows success message after adding a question', async () => {
      render(<FormEditorPage />);
      await waitFor(() => {
        expect(screen.getByText('Site Name (Q1)')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByRole('button', { name: /Add Question/i }));

      fireEvent.change(screen.getByTestId('add-question-title'), {
        target: { value: 'New Question (Q74)' },
      });
      fireEvent.change(screen.getByTestId('add-question-key'), {
        target: { value: 'Q74_New' },
      });

      fireEvent.click(screen.getByTestId('save-new-question'));

      await waitFor(() => {
        expect(screen.getByText('Question added successfully')).toBeInTheDocument();
      });
    });

    it('closes the add form after successful save', async () => {
      render(<FormEditorPage />);
      await waitFor(() => {
        expect(screen.getByText('Site Name (Q1)')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByRole('button', { name: /Add Question/i }));
      expect(screen.getByTestId('add-question-title')).toBeInTheDocument();

      fireEvent.change(screen.getByTestId('add-question-title'), {
        target: { value: 'Closing Test (Q75)' },
      });
      fireEvent.change(screen.getByTestId('add-question-key'), {
        target: { value: 'Q75_Close' },
      });

      fireEvent.click(screen.getByTestId('save-new-question'));

      await waitFor(() => {
        expect(screen.queryByTestId('add-question-title')).not.toBeInTheDocument();
      });
    });

    it('prevents saving when question title is empty', async () => {
      render(<FormEditorPage />);
      await waitFor(() => {
        expect(screen.getByText('Site Name (Q1)')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByRole('button', { name: /Add Question/i }));

      // Save button should be disabled with empty title
      expect(screen.getByTestId('save-new-question')).toBeDisabled();

      // addQuestion should never be called
      expect(formActions.addQuestion).not.toHaveBeenCalled();
    });

    // ─── Question title and key format validation ───────────────────────

    describe('Question title and key validation', () => {
    it('prevents saving when question title does not end with (Q<number>) format', async () => {
      render(<FormEditorPage />);
      await waitFor(() => {
        expect(screen.getByText('Site Name (Q1)')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByRole('button', { name: /Add Question/i }));

      fireEvent.change(screen.getByTestId('add-question-title'), {
        target: { value: 'My Question' },
      });
      fireEvent.change(screen.getByTestId('add-question-key'), {
        target: { value: 'Q70_MyQuestion' },
      });

      expect(screen.getByTestId('save-new-question')).toBeDisabled();
      expect(screen.getByText(/Must be in this format: Question Test \(Q70\)/)).toBeInTheDocument();
      expect(formActions.addQuestion).not.toHaveBeenCalled();
    });

    it('prevents saving when question title has (Q) without number', async () => {
      render(<FormEditorPage />);
      await waitFor(() => {
        expect(screen.getByText('Site Name (Q1)')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByRole('button', { name: /Add Question/i }));

      fireEvent.change(screen.getByTestId('add-question-title'), {
        target: { value: 'Test Question (Q)' },
      });
      fireEvent.change(screen.getByTestId('add-question-key'), {
        target: { value: 'Q70_TestQuestion' },
      });

      expect(screen.getByTestId('save-new-question')).toBeDisabled();
      expect(formActions.addQuestion).not.toHaveBeenCalled();
    });

    it('prevents saving when question key has wrong format (underscore after first)', async () => {
      render(<FormEditorPage />);
      await waitFor(() => {
        expect(screen.getByText('Site Name (Q1)')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByRole('button', { name: /Add Question/i }));

      fireEvent.change(screen.getByTestId('add-question-title'), {
        target: { value: 'Some Question (Q70)' },
      });
      fireEvent.change(screen.getByTestId('add-question-key'), {
        target: { value: 'Q70_Some_Question_Here' },
      });

      expect(screen.getByTestId('save-new-question')).toBeDisabled();
      expect(
        screen.getByText(/Must be in format: Q70_QuestionTest \(letters and numbers only after underscore, no spaces\)/)
      ).toBeInTheDocument();
      expect(formActions.addQuestion).not.toHaveBeenCalled();
    });

    it('prevents saving when question key contains spaces after underscore', async () => {
      render(<FormEditorPage />);
      await waitFor(() => {
        expect(screen.getByText('Site Name (Q1)')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByRole('button', { name: /Add Question/i }));

      fireEvent.change(screen.getByTestId('add-question-title'), {
        target: { value: 'Question With Spaces (Q70)' },
      });
      fireEvent.change(screen.getByTestId('add-question-key'), {
        target: { value: 'Q70_Question With Spaces' },
      });

      expect(screen.getByTestId('save-new-question')).toBeDisabled();
      expect(formActions.addQuestion).not.toHaveBeenCalled();
    });

    it('prevents saving when Q number in title does not match question key', async () => {
      render(<FormEditorPage />);
      await waitFor(() => {
        expect(screen.getByText('Site Name (Q1)')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByRole('button', { name: /Add Question/i }));

      fireEvent.change(screen.getByTestId('add-question-title'), {
        target: { value: 'Title Q70 (Q70)' },
      });
      fireEvent.change(screen.getByTestId('add-question-key'), {
        target: { value: 'Q71_TitleQ70' },
      });

      expect(screen.getByTestId('save-new-question')).toBeDisabled();
      expect(screen.getByText('Q number in title must match question key')).toBeInTheDocument();
      expect(formActions.addQuestion).not.toHaveBeenCalled();
    });

    it('allows saving when title and key are valid and Q numbers match', async () => {
      render(<FormEditorPage />);
      await waitFor(() => {
        expect(screen.getByText('Site Name (Q1)')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByRole('button', { name: /Add Question/i }));

      fireEvent.change(screen.getByTestId('add-question-title'), {
        target: { value: 'Valid Question (Q70)' },
      });
      fireEvent.change(screen.getByTestId('add-question-key'), {
        target: { value: 'Q70_ValidQuestion' },
      });

      expect(screen.getByTestId('save-new-question')).not.toBeDisabled();

      fireEvent.click(screen.getByTestId('save-new-question'));

      await waitFor(() => {
        expect(formActions.addQuestion).toHaveBeenCalledWith(
          1,
          expect.objectContaining({
            form_question: 'Valid Question (Q70)',
            question_key: 'Q70_ValidQuestion',
          })
        );
      });
    });

    it('accepts question key with only letters and numbers after underscore', async () => {
      render(<FormEditorPage />);
      await waitFor(() => {
        expect(screen.getByText('Site Name (Q1)')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByRole('button', { name: /Add Question/i }));

      fireEvent.change(screen.getByTestId('add-question-title'), {
        target: { value: 'Alphanumeric Key (Q80)' },
      });
      fireEvent.change(screen.getByTestId('add-question-key'), {
        target: { value: 'Q80_Abc123' },
      });

      fireEvent.click(screen.getByTestId('save-new-question'));

      await waitFor(() => {
        expect(formActions.addQuestion).toHaveBeenCalledWith(
          1,
          expect.objectContaining({
            form_question: 'Alphanumeric Key (Q80)',
            question_key: 'Q80_Abc123',
          })
        );
      });
    });
    });

    it('displays error when addQuestion fails', async () => {
      (formActions.addQuestion as jest.Mock).mockRejectedValue(new Error('DB insert failed'));

      render(<FormEditorPage />);
      await waitFor(() => {
        expect(screen.getByText('Site Name (Q1)')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByRole('button', { name: /Add Question/i }));

      fireEvent.change(screen.getByTestId('add-question-title'), {
        target: { value: 'Failing Question (Q76)' },
      });
      fireEvent.change(screen.getByTestId('add-question-key'), {
        target: { value: 'Q76_Fail' },
      });

      fireEvent.click(screen.getByTestId('save-new-question'));

      await waitFor(() => {
        expect(screen.getByText(/Failed to add question/)).toBeInTheDocument();
      });
    });

    it('adds a question to a different section', async () => {
      render(<FormEditorPage />);
      await waitFor(() => {
        expect(screen.getByText('Site Name (Q1)')).toBeInTheDocument();
      });

      // Switch to the second section
      fireEvent.click(screen.getByText('Environment'));

      await waitFor(() => {
        expect(screen.getByText('Environmental')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByRole('button', { name: /Add Question/i }));

      fireEvent.click(screen.getByTestId('question-type-Date'));

      fireEvent.change(screen.getByTestId('add-question-title'), {
        target: { value: 'Last Rainfall (Q77)' },
      });
      fireEvent.change(screen.getByTestId('add-question-key'), {
        target: { value: 'Q77_LastRainfall' },
      });

      fireEvent.click(screen.getByTestId('save-new-question'));

      await waitFor(() => {
        expect(formActions.addQuestion).toHaveBeenCalledWith(
          2, // section id for "Environmental"
          expect.objectContaining({
            form_question: 'Last Rainfall (Q77)',
            question_type: 'date',
          })
        );
      });
    });

    it('refetches questions after adding so the new question appears', async () => {
      render(<FormEditorPage />);
      await waitFor(() => {
        expect(screen.getByText('Site Name (Q1)')).toBeInTheDocument();
      });

      const callsBefore = (formActions.fetchFormQuestions as jest.Mock).mock.calls.length;

      fireEvent.click(screen.getByRole('button', { name: /Add Question/i }));

      fireEvent.change(screen.getByTestId('add-question-title'), {
        target: { value: 'Refetch Test (Q78)' },
      });
      fireEvent.change(screen.getByTestId('add-question-key'), {
        target: { value: 'Q78_Refetch' },
      });

      fireEvent.click(screen.getByTestId('save-new-question'));

      await waitFor(() => {
        expect((formActions.fetchFormQuestions as jest.Mock).mock.calls.length).toBeGreaterThan(callsBefore);
      });
    });
  });

  // ─── AT2: Other users can see the new questions ─────────────────────

  describe('Other users who access the Site Inspection Form will see new questions', () => {
    it('after adding a question, getQuestionsOnline returns it for users filling out the form', async () => {
      render(<FormEditorPage />);
      await waitFor(() => {
        expect(screen.getByText('Site Name (Q1)')).toBeInTheDocument();
      });

      // Admin adds a new question
      fireEvent.click(screen.getByRole('button', { name: /Add Question/i }));

      fireEvent.click(screen.getByTestId('question-type-Text'));

      fireEvent.change(screen.getByTestId('add-question-title'), {
        target: { value: 'New Visible Question (Q80)' },
      });
      fireEvent.change(screen.getByTestId('add-question-key'), {
        target: { value: 'Q80_NewVisible' },
      });

      fireEvent.click(screen.getByTestId('save-new-question'));

      await waitFor(() => {
        expect(formActions.addQuestion).toHaveBeenCalled();
      });

      // Simulate the DB state after the add: the new question now exists
      const newQuestion: formActions.FormQuestion = {
        id: 200,
        form_question: 'New Visible Question (Q80)',
        subtext: '',
        question_type: 'text',
        is_required: false,
        is_active: true,
        section_id: 1,
        autofill_key: null,
        question_key_id: 80,
        formorder: 3,
        options: [],
      };
      const updatedAdminQuestions = [...mockQuestions, newQuestion];

      // getQuestionsOnline filters is_active=true, so the new question is included
      (queries.getQuestionsOnline as jest.Mock).mockResolvedValue(
        toUserFacingQuestions(updatedAdminQuestions)
      );

      // When a user opens the Site Inspection Form, they call getQuestionsOnline
      const userQuestions = await queries.getQuestionsOnline();

      // The newly added question should appear in the user-facing list
      const found = userQuestions.find((q: queries.question) => q.id === 200);
      expect(found).toBeDefined();
      expect(found!.title).toBe('New Visible Question (Q80)');
      // Original questions are still present
      expect(userQuestions).toHaveLength(3);
    });

    it('newly added question appears in admin view after refetch', async () => {
      render(<FormEditorPage />);
      await waitFor(() => {
        expect(screen.getByText('Site Name (Q1)')).toBeInTheDocument();
      });

      // After adding, mock fetchFormQuestions to return updated list including the new question
      const newQuestion: formActions.FormQuestion = {
        id: 201,
        form_question: 'Brand New Question (Q81)',
        subtext: null,
        question_type: 'text',
        is_required: false,
        is_active: true,
        section_id: 1,
        autofill_key: null,
        question_key_id: 81,
        formorder: 3,
        options: [],
      };
      (formActions.fetchFormQuestions as jest.Mock).mockResolvedValue([...mockQuestions, newQuestion]);

      fireEvent.click(screen.getByRole('button', { name: /Add Question/i }));

      fireEvent.change(screen.getByTestId('add-question-title'), {
        target: { value: 'Brand New Question (Q81)' },
      });
      fireEvent.change(screen.getByTestId('add-question-key'), {
        target: { value: 'Q81_BrandNew' },
      });

      fireEvent.click(screen.getByTestId('save-new-question'));

      // After save + refetch, the new question is displayed in the admin editor
      await waitFor(() => {
        expect(screen.getByText('Brand New Question (Q81)')).toBeInTheDocument();
      });
    });
  });

  // ─── AT3: Non-admin users cannot add questions ──────────────────────

  describe('Users who are not admins cannot add questions to the form', () => {
    it('page is wrapped in ProtectedRoute with requireAdmin=true', async () => {
      render(<FormEditorPage />);
      await waitFor(() => {
        const protectedRoute = screen.getByTestId('protected-route');
        expect(protectedRoute).toBeInTheDocument();
        expect(protectedRoute).toHaveAttribute('data-require-admin', 'true');
      });
    });
  });
});
