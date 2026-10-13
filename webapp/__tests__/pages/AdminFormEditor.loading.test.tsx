import React from 'react';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import FormEditorPage from '../../app/admin/form-editor/page';
import * as formActions from '../../utils/form-actions';

jest.mock('next/navigation', () => ({
  useRouter: jest.fn(() => ({ push: jest.fn() })),
  usePathname: jest.fn(() => '/admin/form-editor'),
}));
jest.mock('next/image', () => ({
  __esModule: true,
  // eslint-disable-next-line @next/next/no-img-element
  default: (props: React.ImgHTMLAttributes<HTMLImageElement>) => <img {...props} alt={props.alt} />,
}));
jest.mock('../../app/admin/AdminNavBar', () => ({ __esModule: true, default: () => null }));
jest.mock('../../components/ProtectedRoute', () => ({
  __esModule: true,
  default: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));
jest.mock('../../utils/form-actions', () => ({
  fetchFormSections: jest.fn(),
  fetchFormQuestions: jest.fn(),
  saveQuestion: jest.fn(),
  toggleQuestionActive: jest.fn(),
  addQuestion: jest.fn(),
  reorderQuestions: jest.fn(),
}));

const sections: formActions.FormSection[] = [
  { id: 1, title: 'General Information', description: null, header: 'General' },
];

const question: formActions.FormQuestion = {
  id: 101,
  form_question: 'Site Name (Q1)',
  subtext: null,
  question_type: 'text',
  is_required: true,
  is_active: true,
  section_id: 1,
  autofill_key: null,
  question_key_id: 1,
  formorder: 1,
  options: [],
};

const waterQuestion: formActions.FormQuestion = {
  ...question,
  id: 102,
  form_question: 'Water Quality (Q2)',
  question_key_id: 2,
  formorder: 2,
};

const fetchSections = formActions.fetchFormSections as jest.Mock;
const fetchQuestions = formActions.fetchFormQuestions as jest.Mock;

function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((done) => {
    resolve = done;
  });
  return { promise, resolve };
}

// The admin form editor loaded the questions twice on mount, because setting the active
// section re-ran the loading effect. A toggle during the second load was reverted.
describe('FormEditorPage loading', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    fetchSections.mockResolvedValue(sections);
    fetchQuestions.mockResolvedValue([question]);
    (formActions.toggleQuestionActive as jest.Mock).mockResolvedValue(undefined);
    (formActions.saveQuestion as jest.Mock).mockResolvedValue({ success: true });
  });

  it('loads the sections and the questions once on mount', async () => {
    render(<FormEditorPage />);

    expect(await screen.findByTestId('Site Name (Q1) Hide Button')).toBeInTheDocument();
    await act(async () => {
      await Promise.resolve();
    });

    expect(fetchSections).toHaveBeenCalledTimes(1);
    expect(fetchQuestions).toHaveBeenCalledTimes(1);
  });

  it('keeps a toggle when an older questions load returns after it', async () => {
    fetchQuestions.mockResolvedValue([question, waterQuestion]);
    render(<FormEditorPage />);
    await screen.findByTestId('Water Quality (Q2) Hide Button');

    // Saving Q1 starts a reload. The admin hides Q2 before that reload returns.
    const staleLoad = deferred<formActions.FormQuestion[]>();
    fetchQuestions.mockReturnValueOnce(staleLoad.promise);
    fireEvent.click(screen.getAllByTestId('edit-question-button')[0]);
    fireEvent.click(screen.getByTestId('save-question-button'));
    await waitFor(() => expect(fetchQuestions).toHaveBeenCalledTimes(2));

    fireEvent.click(screen.getByTestId('Water Quality (Q2) Hide Button'));
    expect(await screen.findByTestId('Water Quality (Q2) Show Button')).toBeInTheDocument();

    await act(async () => {
      staleLoad.resolve([question, waterQuestion]);
      await staleLoad.promise;
    });

    expect(screen.getByTestId('Water Quality (Q2) Show Button')).toBeInTheDocument();
    expect(formActions.toggleQuestionActive).toHaveBeenCalledWith(102, true);
  });

  it('still reloads the server status when the toggle fails', async () => {
    const alertSpy = jest.spyOn(window, 'alert').mockImplementation(() => {});
    (formActions.toggleQuestionActive as jest.Mock).mockRejectedValue(new Error('denied'));
    render(<FormEditorPage />);

    fireEvent.click(await screen.findByTestId('Site Name (Q1) Hide Button'));

    expect(await screen.findByTestId('Site Name (Q1) Hide Button')).toBeInTheDocument();
    expect(fetchQuestions).toHaveBeenCalledTimes(2);
    expect(alertSpy).toHaveBeenCalledWith('Could not update question status.');
    alertSpy.mockRestore();
  });
});
