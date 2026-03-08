import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import FormEditorPage from '../../app/admin/form-editor/page';
import * as formActions from '../../utils/form-actions';

// Mock next/navigation
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(() => ({ push: jest.fn() })),
  usePathname: jest.fn(() => '/admin/form-editor'),
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
  {
    id: 103,
    form_question: 'Inspection Date (Q3)',
    subtext: null,
    question_type: 'date',
    is_required: false,
    is_active: true,
    section_id: 2,
    autofill_key: null,
    question_key_id: 3,
    formorder: 3,
    options: [],
  },
];

// ─── Tests ────────────────────────────────────────────────────────────

describe('FormEditorPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (formActions.fetchFormSections as jest.Mock).mockResolvedValue(mockSections);
    (formActions.fetchFormQuestions as jest.Mock).mockResolvedValue(mockQuestions);
    (formActions.saveQuestion as jest.Mock).mockResolvedValue(undefined);
    (formActions.toggleQuestionActive as jest.Mock).mockResolvedValue(undefined);
    (formActions.addQuestion as jest.Mock).mockResolvedValue(undefined);
    (formActions.addFormSection as jest.Mock).mockResolvedValue(3);
  });

  // ─── Loading & Initial Render ───────────────────────────────────────

  describe('Loading and Initial Render', () => {
    it('renders page with header and navbar after loading', async () => {
      render(<FormEditorPage />);
      await waitFor(() => {
        expect(screen.getByText('Form Editor')).toBeInTheDocument();
        expect(screen.getByText('AdminNavBarMock')).toBeInTheDocument();
      });
    });

    it('displays sections in the sidebar', async () => {
      render(<FormEditorPage />);
      await waitFor(() => {
        expect(screen.getByText('General')).toBeInTheDocument();
        expect(screen.getByText('Environment')).toBeInTheDocument();
      });
    });

    it('displays questions for the initially selected section', async () => {
      render(<FormEditorPage />);
      await waitFor(() => {
        expect(screen.getByText('Site Name (Q1)')).toBeInTheDocument();
        expect(screen.getByText('Water Quality (Q2)')).toBeInTheDocument();
      });
      // Section 2 question should not appear
      expect(screen.queryByText('Inspection Date (Q3)')).not.toBeInTheDocument();
    });

    it('switches sections when a section button is clicked', async () => {
      render(<FormEditorPage />);
      await waitFor(() => {
        expect(screen.getByText('Site Name (Q1)')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('Environment'));

      await waitFor(() => {
        expect(screen.getByText('Inspection Date (Q3)')).toBeInTheDocument();
        expect(screen.queryByText('Site Name (Q1)')).not.toBeInTheDocument();
      });
    });
  });

  // ─── AT1: Modify questions (add, remove, change) ───────────────────

  describe('Modify questions - Edit existing question', () => {
    it('opens edit form when edit button is clicked', async () => {
      render(<FormEditorPage />);
      await waitFor(() => {
        expect(screen.getByText('Site Name (Q1)')).toBeInTheDocument();
      });

      const editButtons = screen.getAllByTestId('edit-question-button');
      fireEvent.click(editButtons[0]);

      expect(screen.getByTestId('edit-question-title')).toBeInTheDocument();
      expect(screen.getByTestId('edit-question-subtext')).toBeInTheDocument();
    });

    it('populates edit form with existing question data', async () => {
      render(<FormEditorPage />);
      await waitFor(() => {
        expect(screen.getByText('Site Name (Q1)')).toBeInTheDocument();
      });

      const editButtons = screen.getAllByTestId('edit-question-button');
      fireEvent.click(editButtons[0]);

      expect(screen.getByTestId('edit-question-title')).toHaveValue('Site Name (Q1)');
      expect(screen.getByTestId('edit-question-subtext')).toHaveValue('Enter the official site name');
    });

    it('can modify question title and subtext', async () => {
      render(<FormEditorPage />);
      await waitFor(() => {
        expect(screen.getByText('Site Name (Q1)')).toBeInTheDocument();
      });

      const editButtons = screen.getAllByTestId('edit-question-button');
      fireEvent.click(editButtons[0]);

      const titleInput = screen.getByTestId('edit-question-title');
      const subtextInput = screen.getByTestId('edit-question-subtext');

      fireEvent.change(titleInput, { target: { value: 'Updated Site Name (Q1)' } });
      fireEvent.change(subtextInput, { target: { value: 'Updated subtext' } });

      expect(titleInput).toHaveValue('Updated Site Name (Q1)');
      expect(subtextInput).toHaveValue('Updated subtext');
    });

    it('saves modified question when save is clicked', async () => {
      render(<FormEditorPage />);
      await waitFor(() => {
        expect(screen.getByText('Site Name (Q1)')).toBeInTheDocument();
      });

      const editButtons = screen.getAllByTestId('edit-question-button');
      fireEvent.click(editButtons[0]);

      fireEvent.change(screen.getByTestId('edit-question-title'), {
        target: { value: 'Updated Site Name (Q1)' },
      });

      fireEvent.click(screen.getByTestId('save-question-button'));

      await waitFor(() => {
        expect(formActions.saveQuestion).toHaveBeenCalledWith(
          expect.objectContaining({
            id: 101,
            form_question: 'Updated Site Name (Q1)',
          })
        );
      });
    });

    it('shows success message and closes edit form after saving', async () => {
      render(<FormEditorPage />);
      await waitFor(() => {
        expect(screen.getByText('Site Name (Q1)')).toBeInTheDocument();
      });

      const editButtons = screen.getAllByTestId('edit-question-button');
      fireEvent.click(editButtons[0]);

      fireEvent.click(screen.getByTestId('save-question-button'));

      await waitFor(() => {
        expect(screen.getByText('Question saved successfully')).toBeInTheDocument();
        expect(screen.queryByTestId('edit-question-title')).not.toBeInTheDocument();
      });
    });

    it('can modify option text in an existing question with options', async () => {
      render(<FormEditorPage />);
      await waitFor(() => {
        expect(screen.getByText('Water Quality (Q2)')).toBeInTheDocument();
      });

      // Edit the second question (option type with options)
      const editButtons = screen.getAllByTestId('edit-question-button');
      fireEvent.click(editButtons[1]);

      const optionInput = screen.getByDisplayValue('Good');
      fireEvent.change(optionInput, { target: { value: 'Excellent' } });

      expect(screen.getByDisplayValue('Excellent')).toBeInTheDocument();
    });
  });

  describe('Modify questions - Add new question', () => {
    it('shows add question form when Add Question button is clicked', async () => {
      render(<FormEditorPage />);
      await waitFor(() => {
        expect(screen.getByText('Site Name (Q1)')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByRole('button', { name: /Add Question/i }));

      expect(screen.getByTestId('add-question-title')).toBeInTheDocument();
      expect(screen.getByTestId('add-question-subtext')).toBeInTheDocument();
      expect(screen.getByTestId('add-question-key')).toBeInTheDocument();
    });

    it('adds a new question when form is filled and saved', async () => {
      render(<FormEditorPage />);
      await waitFor(() => {
        expect(screen.getByText('Site Name (Q1)')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByRole('button', { name: /Add Question/i }));

      fireEvent.change(screen.getByTestId('add-question-title'), {
        target: { value: 'New Test Question (Q70)' },
      });
      fireEvent.change(screen.getByTestId('add-question-subtext'), {
        target: { value: 'New subtext' },
      });
      fireEvent.change(screen.getByTestId('add-question-key'), {
        target: { value: 'Q70_NewTest' },
      });

      fireEvent.click(screen.getByTestId('save-new-question'));

      await waitFor(() => {
        expect(formActions.addQuestion).toHaveBeenCalledWith(
          1, // active section id
          expect.objectContaining({
            form_question: 'New Test Question (Q70)',
            subtext: 'New subtext',
            question_key: 'Q70_NewTest',
            question_type: 'option', // default type
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
        target: { value: 'New Question (Q70)' },
      });
      fireEvent.change(screen.getByTestId('add-question-key'), {
        target: { value: 'Q70_New' },
      });

      fireEvent.click(screen.getByTestId('save-new-question'));

      await waitFor(() => {
        expect(screen.getByText('Question added successfully')).toBeInTheDocument();
      });
    });

    it('disables save button when question title is empty', async () => {
      render(<FormEditorPage />);
      await waitFor(() => {
        expect(screen.getByText('Site Name (Q1)')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByRole('button', { name: /Add Question/i }));

      expect(screen.getByTestId('save-new-question')).toBeDisabled();
    });

    it('can select different question types when adding', async () => {
      render(<FormEditorPage />);
      await waitFor(() => {
        expect(screen.getByText('Site Name (Q1)')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByRole('button', { name: /Add Question/i }));

      // Default type is Radio (option) — "Answer Options" label should appear
      expect(screen.getByText('Answer Options')).toBeInTheDocument();

      // Switch to Text type — options section should disappear
      fireEvent.click(screen.getByTestId('question-type-Text'));

      expect(screen.queryByText('Answer Options')).not.toBeInTheDocument();
    });
  });

  describe('Modify questions - Toggle visibility (remove/show)', () => {
    it('calls toggleQuestionActive when hide button is clicked', async () => {
      render(<FormEditorPage />);
      await waitFor(() => {
        expect(screen.getByText('Site Name (Q1)')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByTestId('Site Name (Q1) Hide Button'));

      await waitFor(() => {
        expect(formActions.toggleQuestionActive).toHaveBeenCalledWith(101, true);
      });
    });

    it('updates button from Hide to Show when toggled', async () => {
      render(<FormEditorPage />);
      await waitFor(() => {
        expect(screen.getByTestId('Site Name (Q1) Hide Button')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByTestId('Site Name (Q1) Hide Button'));

      await waitFor(() => {
        expect(screen.getByTestId('Site Name (Q1) Show Button')).toBeInTheDocument();
      });
    });
  });

  // AT2: Other users who access the Site Inspection Form will be able to see the modified questions

  describe('Changes visible to other users - data refetch after modifications', () => {
    it('refetches questions after saving an edit', async () => {
      render(<FormEditorPage />);
      await waitFor(() => {
        expect(screen.getByText('Site Name (Q1)')).toBeInTheDocument();
      });

      const callsBefore = (formActions.fetchFormQuestions as jest.Mock).mock.calls.length;

      const editButtons = screen.getAllByTestId('edit-question-button');
      fireEvent.click(editButtons[0]);
      fireEvent.click(screen.getByTestId('save-question-button'));

      await waitFor(() => {
        expect((formActions.fetchFormQuestions as jest.Mock).mock.calls.length).toBeGreaterThan(callsBefore);
      });
    });

    it('refetches questions after adding a new question', async () => {
      render(<FormEditorPage />);
      await waitFor(() => {
        expect(screen.getByText('Site Name (Q1)')).toBeInTheDocument();
      });

      const callsBefore = (formActions.fetchFormQuestions as jest.Mock).mock.calls.length;

      fireEvent.click(screen.getByRole('button', { name: /Add Question/i }));
      fireEvent.change(screen.getByTestId('add-question-title'), {
        target: { value: 'New Question (Q70)' },
      });
      fireEvent.change(screen.getByTestId('add-question-key'), {
        target: { value: 'Q70_New' },
      });
      fireEvent.click(screen.getByTestId('save-new-question'));

      await waitFor(() => {
        expect((formActions.fetchFormQuestions as jest.Mock).mock.calls.length).toBeGreaterThan(callsBefore);
      });
    });

    it('displays updated question data after saving changes', async () => {
      render(<FormEditorPage />);
      await waitFor(() => {
        expect(screen.getByText('Site Name (Q1)')).toBeInTheDocument();
      });

      // After save, mock returns updated data so all users see the change
      const updatedQuestions = mockQuestions.map(q =>
        q.id === 101 ? { ...q, form_question: 'Renamed Site (Q1)' } : q
      );
      (formActions.fetchFormQuestions as jest.Mock).mockResolvedValue(updatedQuestions);

      const editButtons = screen.getAllByTestId('edit-question-button');
      fireEvent.click(editButtons[0]);

      fireEvent.change(screen.getByTestId('edit-question-title'), {
        target: { value: 'Renamed Site (Q1)' },
      });
      fireEvent.click(screen.getByTestId('save-question-button'));

      await waitFor(() => {
        expect(screen.getByText('Renamed Site (Q1)')).toBeInTheDocument();
      });
    });
  });

  // ─── AT3: Discard edits before submitting ───────────────────────────

  describe('Discard edits before submitting', () => {
    it('discards edit changes when cancel is clicked', async () => {
      render(<FormEditorPage />);
      await waitFor(() => {
        expect(screen.getByText('Site Name (Q1)')).toBeInTheDocument();
      });

      const editButtons = screen.getAllByTestId('edit-question-button');
      fireEvent.click(editButtons[0]);

      // Modify the title
      fireEvent.change(screen.getByTestId('edit-question-title'), {
        target: { value: 'Changed Title That Should Be Discarded' },
      });

      // Cancel the edit
      fireEvent.click(screen.getByTestId('cancel-button'));

      // Edit form should be closed
      expect(screen.queryByTestId('edit-question-title')).not.toBeInTheDocument();
      // saveQuestion should NOT have been called
      expect(formActions.saveQuestion).not.toHaveBeenCalled();
      // Original question title should still be displayed
      expect(screen.queryAllByText('Site Name (Q1)').length).toBeGreaterThan(0);
    });

    it('discards add question form when cancel is clicked', async () => {
      render(<FormEditorPage />);
      await waitFor(() => {
        expect(screen.getByText('Site Name (Q1)')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByRole('button', { name: /Add Question/i }));

      // Fill in some data
      fireEvent.change(screen.getByTestId('add-question-title'), {
        target: { value: 'Question to discard' },
      });

      // Click Cancel in the add question form
      const cancelButtons = screen.getAllByRole('button', { name: /Cancel/i });
      fireEvent.click(cancelButtons[cancelButtons.length - 1]);

      // Add form should be hidden
      expect(screen.queryByTestId('add-question-title')).not.toBeInTheDocument();
      // addQuestion should NOT have been called
      expect(formActions.addQuestion).not.toHaveBeenCalled();
    });
  });

  // ─── AT4: Non-admin users cannot edit ───────────────────────────────

  describe('Non-admin users cannot change or edit questions', () => {
    it('wraps the page in ProtectedRoute with requireAdmin', async () => {
      render(<FormEditorPage />);
      await waitFor(() => {
        const protectedRoute = screen.getByTestId('protected-route');
        expect(protectedRoute).toBeInTheDocument();
        expect(protectedRoute).toHaveAttribute('data-require-admin', 'true');
      });
    });
  });

  // ─── Error Handling ─────────────────────────────────────────────────

  describe('Error Handling', () => {
    it('displays error when saving a question fails', async () => {
      (formActions.saveQuestion as jest.Mock).mockRejectedValue(new Error('Database error'));

      render(<FormEditorPage />);
      await waitFor(() => {
        expect(screen.getByText('Site Name (Q1)')).toBeInTheDocument();
      });

      const editButtons = screen.getAllByTestId('edit-question-button');
      fireEvent.click(editButtons[0]);
      fireEvent.click(screen.getByTestId('save-question-button'));

      await waitFor(() => {
        expect(screen.getByText(/Failed to save question/)).toBeInTheDocument();
      });
    });

    it('displays error when adding a question fails', async () => {
      (formActions.addQuestion as jest.Mock).mockRejectedValue(new Error('Insert failed'));

      render(<FormEditorPage />);
      await waitFor(() => {
        expect(screen.getByText('Site Name (Q1)')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByRole('button', { name: /Add Question/i }));
      fireEvent.change(screen.getByTestId('add-question-title'), {
        target: { value: 'Failing Question (Q70)' },
      });
      fireEvent.change(screen.getByTestId('add-question-key'), {
        target: { value: 'Q70_Fail' },
      });
      fireEvent.click(screen.getByTestId('save-new-question'));

      await waitFor(() => {
        expect(screen.getByText(/Failed to add question/)).toBeInTheDocument();
      });
    });

    it('shows alert when toggling question visibility fails', async () => {
      (formActions.toggleQuestionActive as jest.Mock).mockRejectedValue(new Error('Toggle failed'));
      const alertSpy = jest.spyOn(window, 'alert').mockImplementation();

      render(<FormEditorPage />);
      await waitFor(() => {
        expect(screen.getByText('Site Name (Q1)')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByTestId('Site Name (Q1) Hide Button'));

      await waitFor(() => {
        expect(alertSpy).toHaveBeenCalledWith('Could not update question status.');
      });

      alertSpy.mockRestore();
    });
  });
});