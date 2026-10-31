import { render, screen, waitFor } from '@testing-library/react';
import MainContent from '@/app/detail/[namesite]/new-report/MainContent';
import { getQuestionsOnline } from '@/utils/supabase/queries';
jest.mock('@/utils/supabase/queries', () => ({ getQuestionsOnline: jest.fn() }));
const questions = [
  { id: 11, title: 'Email (Q11)', text: null, question_type: 'text', section: 3, answers: [], is_required: true, autofill_key: 'user_email' },
  { id: 21, title: 'Visit date (Q21)', text: null, question_type: 'date', section: 3, answers: [], is_required: true, autofill_key: 'visit_date' },
];
beforeEach(() => { jest.clearAllMocks(); (getQuestionsOnline as jest.Mock).mockResolvedValue(questions); window.scrollTo = jest.fn(); });
it('(V3-09 AT2) keeps saved answers in edit mode without profile or current-date autofill', async () => {
  const changed = jest.fn(); render(<MainContent editing responses={{ 11: 'old@example.com', 21: '2023-07-23' }} currentUser={{ email: 'new@example.com' }} onResponsesChange={changed} />);
  expect(await screen.findByTestId('question-input-11')).toHaveValue('old@example.com');
  expect(document.querySelector('input[type="date"]')).toHaveValue('2023-07-23'); expect(changed).not.toHaveBeenCalled();
});
it('(V3-09 AT2) leaves unknown historic values blank instead of supplying new values', async () => {
  const changed = jest.fn(); render(<MainContent editing responses={{}} currentUser={{ email: 'new@example.com' }} onResponsesChange={changed} />);
  await screen.findByTestId('question-input-11'); expect(document.querySelector('input[type="date"]')).toHaveValue(''); expect(changed).not.toHaveBeenCalled();
});
it('(V3-11 AT1) marks a missing required answer and clears the mark after correction', async () => {
  const view = render(<MainContent showValidation responses={{}} onResponsesChange={jest.fn()} />);
  const email = await screen.findByRole('group', { name: 'Email' }); expect(email).toHaveAttribute('aria-invalid', 'true');
  view.rerender(<MainContent showValidation responses={{ 11: 'valid@example.com', 21: '2023-07-23' }} onResponsesChange={jest.fn()} />);
  expect(screen.getByRole('group', { name: 'Email' })).not.toHaveAttribute('aria-invalid'); expect(screen.queryByText('Required — answer missing')).not.toBeInTheDocument();
});
it('(V3-11 AT1) retains autofill for new reports', async () => {
  const changed = jest.fn(); render(<MainContent responses={{}} currentUser={{ email: 'new@example.com' }} onResponsesChange={changed} />);
  await waitFor(() => expect(changed).toHaveBeenCalledWith({ 11: 'new@example.com', 21: new Date().toISOString().slice(0, 10) }));
});
