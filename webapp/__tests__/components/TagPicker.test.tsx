import { useState } from 'react';
import { fireEvent, render, screen, within } from '@testing-library/react';
import TagPicker from '@/components/TagPicker';

function Harness({ initial = [], options }: { initial?: string[]; options: string[] }) {
  const [values, setValues] = useState(initial);
  return <TagPicker label="Skills" values={values} options={options} onChange={setValues} />;
}

const OPTIONS = ['Bird ID', 'Mosses', 'Wetlands'];

describe('TagPicker', () => {
  it('offers the existing values and an Other option in a dropdown (1.0.6 AT1)', () => {
    render(<Harness options={OPTIONS} />);

    const choices = within(screen.getByLabelText('Add skills')).getAllByRole('option').map((option) => option.textContent);
    expect(choices).toEqual(['Select…', 'Bird ID', 'Mosses', 'Wetlands', 'Other…']);
  });

  it('adds a chosen value and takes it out of the dropdown', () => {
    render(<Harness options={OPTIONS} />);

    fireEvent.change(screen.getByLabelText('Add skills'), { target: { value: 'Mosses' } });

    expect(within(screen.getByRole('list', { name: 'Chosen skills' })).getByText('Mosses')).toBeInTheDocument();
    const choices = within(screen.getByLabelText('Add skills')).getAllByRole('option').map((option) => option.textContent);
    expect(choices).not.toContain('Mosses');
  });

  it('adds a new value through Other and keeps the typed text (1.0.6 AT1)', () => {
    render(<Harness options={OPTIONS} />);

    fireEvent.change(screen.getByLabelText('Add skills'), { target: { value: '__other__' } });
    fireEvent.change(screen.getByLabelText('Other skills'), { target: { value: ' Lichens ' } });
    fireEvent.click(screen.getByRole('button', { name: 'Add' }));

    expect(screen.getByText('Lichens')).toBeInTheDocument();
    expect(screen.queryByLabelText('Other skills')).not.toBeInTheDocument();
  });

  it('suggests similar existing values while the person types, and a click uses one (1.0.6 AT2)', () => {
    render(<Harness options={OPTIONS} />);

    fireEvent.change(screen.getByLabelText('Add skills'), { target: { value: '__other__' } });
    fireEvent.change(screen.getByLabelText('Other skills'), { target: { value: 'wetlnds' } });
    fireEvent.click(screen.getByRole('button', { name: 'Wetlands' }));

    expect(within(screen.getByRole('list', { name: 'Chosen skills' })).getByText('Wetlands')).toBeInTheDocument();
  });

  it('suggests nothing when no existing value is similar', () => {
    render(<Harness options={OPTIONS} />);

    fireEvent.change(screen.getByLabelText('Add skills'), { target: { value: '__other__' } });
    fireEvent.change(screen.getByLabelText('Other skills'), { target: { value: 'Photography' } });

    expect(screen.queryByText(/Already used/)).not.toBeInTheDocument();
  });

  it('uses the existing spelling when the typed value differs only by case', () => {
    render(<Harness options={OPTIONS} />);

    fireEvent.change(screen.getByLabelText('Add skills'), { target: { value: '__other__' } });
    fireEvent.change(screen.getByLabelText('Other skills'), { target: { value: 'bird id' } });
    fireEvent.click(screen.getByRole('button', { name: 'Add' }));

    expect(screen.getByText('Bird ID')).toBeInTheDocument();
    expect(screen.queryByText('bird id')).not.toBeInTheDocument();
  });

  it('does not add the same value twice', () => {
    render(<Harness initial={['Bird ID']} options={OPTIONS} />);

    fireEvent.change(screen.getByLabelText('Add skills'), { target: { value: '__other__' } });
    fireEvent.change(screen.getByLabelText('Other skills'), { target: { value: 'BIRD ID' } });
    fireEvent.click(screen.getByRole('button', { name: 'Add' }));

    expect(screen.getAllByText('Bird ID')).toHaveLength(1);
  });

  it('adds the typed value on Enter without submitting the surrounding form', () => {
    const submit = jest.fn((event: React.FormEvent) => event.preventDefault());
    render(<form onSubmit={submit}><Harness options={OPTIONS} /></form>);

    fireEvent.change(screen.getByLabelText('Add skills'), { target: { value: '__other__' } });
    const input = screen.getByLabelText('Other skills');
    fireEvent.change(input, { target: { value: 'Lichens' } });
    expect(fireEvent.keyDown(input, { key: 'Enter' })).toBe(false);

    expect(screen.getByText('Lichens')).toBeInTheDocument();
    expect(submit).not.toHaveBeenCalled();
  });

  it('removes a chosen value and offers it in the dropdown again (1.0.6 AT3)', () => {
    render(<Harness initial={['Bird ID']} options={OPTIONS} />);

    fireEvent.click(screen.getByRole('button', { name: 'Remove Bird ID' }));

    expect(screen.queryByRole('list', { name: 'Chosen skills' })).not.toBeInTheDocument();
    expect(within(screen.getByLabelText('Add skills')).getByRole('option', { name: 'Bird ID' })).toBeInTheDocument();
  });

  it('stops at twelve values', () => {
    const twelve = Array.from({ length: 12 }, (_, index) => `Skill ${index}`);
    render(<Harness initial={twelve} options={OPTIONS} />);

    expect(screen.getByLabelText('Add skills')).toBeDisabled();
  });
});
