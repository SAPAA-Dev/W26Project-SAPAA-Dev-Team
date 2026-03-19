import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import RichTextEditor from '../../components/RichTextEditor';

describe('RichTextEditor', () => {
  const setup = (value = '', onChange = jest.fn()) => {
    render(
      <RichTextEditor value={value} onChange={onChange} placeholder="Write something" rows={3} />
    );
    return { onChange, textarea: screen.getByRole('textbox') };
  };

  // ─── Rendering ────────────────────────────────────────────────────────

  describe('Rendering', () => {
    it('renders the toolbar with B, I, and Link buttons', () => {
      setup();
      expect(screen.getByTitle('Bold (Ctrl+B)')).toBeInTheDocument();
      expect(screen.getByTitle('Italic (Ctrl+I)')).toBeInTheDocument();
      expect(screen.getByTitle('Insert link')).toBeInTheDocument();
    });

    it('renders the textarea with the provided value', () => {
      const { textarea } = setup('hello world');
      expect(textarea).toHaveValue('hello world');
    });

    it('renders the textarea with the provided placeholder', () => {
      setup();
      expect(screen.getByPlaceholderText('Write something')).toBeInTheDocument();
    });

    it('forwards testId as data-testid on the internal textarea', () => {
      render(
        <RichTextEditor value="" onChange={jest.fn()} testId="my-editor" />
      );
      expect(screen.getByTestId('my-editor')).toBeInTheDocument();
    });
  });

  // ─── Bold formatting ──────────────────────────────────────────────────

  describe('Bold button', () => {
    it('wraps selected text with ** on Bold click', () => {
      const onChange = jest.fn();
      render(<RichTextEditor value="hello world" onChange={onChange} />);
      const textarea = screen.getByRole('textbox') as HTMLTextAreaElement;

      // Simulate a selection of "world" (index 6–11)
      Object.defineProperty(textarea, 'selectionStart', { writable: true, value: 6 });
      Object.defineProperty(textarea, 'selectionEnd', { writable: true, value: 11 });

      fireEvent.mouseDown(screen.getByTitle('Bold (Ctrl+B)'), { preventDefault: jest.fn() });

      expect(onChange).toHaveBeenCalledWith('hello **world**');
    });

    it('wraps empty selection with ** and places cursor between markers', () => {
      const onChange = jest.fn();
      render(<RichTextEditor value="hello" onChange={onChange} />);
      const textarea = screen.getByRole('textbox') as HTMLTextAreaElement;

      Object.defineProperty(textarea, 'selectionStart', { writable: true, value: 5 });
      Object.defineProperty(textarea, 'selectionEnd', { writable: true, value: 5 });

      fireEvent.mouseDown(screen.getByTitle('Bold (Ctrl+B)'), { preventDefault: jest.fn() });

      expect(onChange).toHaveBeenCalledWith('hello****');
    });
  });

  // ─── Italic formatting ────────────────────────────────────────────────

  describe('Italic button', () => {
    it('wraps selected text with * on Italic click', () => {
      const onChange = jest.fn();
      render(<RichTextEditor value="hello world" onChange={onChange} />);
      const textarea = screen.getByRole('textbox') as HTMLTextAreaElement;

      Object.defineProperty(textarea, 'selectionStart', { writable: true, value: 6 });
      Object.defineProperty(textarea, 'selectionEnd', { writable: true, value: 11 });

      fireEvent.mouseDown(screen.getByTitle('Italic (Ctrl+I)'), { preventDefault: jest.fn() });

      expect(onChange).toHaveBeenCalledWith('hello *world*');
    });
  });

  // ─── Underline formatting ─────────────────────────────────────────────

  describe('Underline button', () => {
    it('renders the Underline button between Bold and Italic', () => {
      setup();
      const buttons = screen.getAllByRole('button');
      const titles = buttons.map((b) => b.getAttribute('title'));
      const boldIdx = titles.indexOf('Bold (Ctrl+B)');
      const underlineIdx = titles.indexOf('Underline (Ctrl+U)');
      const italicIdx = titles.indexOf('Italic (Ctrl+I)');
      expect(underlineIdx).toBe(boldIdx + 1);
      expect(italicIdx).toBe(underlineIdx + 1);
    });

    it('wraps selected text with <u>...</u> on Underline click', () => {
      const onChange = jest.fn();
      render(<RichTextEditor value="hello world" onChange={onChange} />);
      const textarea = screen.getByRole('textbox') as HTMLTextAreaElement;

      Object.defineProperty(textarea, 'selectionStart', { writable: true, value: 6 });
      Object.defineProperty(textarea, 'selectionEnd', { writable: true, value: 11 });

      fireEvent.mouseDown(screen.getByTitle('Underline (Ctrl+U)'), { preventDefault: jest.fn() });

      expect(onChange).toHaveBeenCalledWith('hello <u>world</u>');
    });

    it('wraps empty selection with <u></u>', () => {
      const onChange = jest.fn();
      render(<RichTextEditor value="hello" onChange={onChange} />);
      const textarea = screen.getByRole('textbox') as HTMLTextAreaElement;

      Object.defineProperty(textarea, 'selectionStart', { writable: true, value: 5 });
      Object.defineProperty(textarea, 'selectionEnd', { writable: true, value: 5 });

      fireEvent.mouseDown(screen.getByTitle('Underline (Ctrl+U)'), { preventDefault: jest.fn() });

      expect(onChange).toHaveBeenCalledWith('hello<u></u>');
    });

    it('applies underline formatting on Ctrl+U', () => {
      const onChange = jest.fn();
      render(<RichTextEditor value="hello world" onChange={onChange} />);
      const textarea = screen.getByRole('textbox') as HTMLTextAreaElement;

      Object.defineProperty(textarea, 'selectionStart', { writable: true, value: 6 });
      Object.defineProperty(textarea, 'selectionEnd', { writable: true, value: 11 });

      fireEvent.keyDown(textarea, { key: 'u', ctrlKey: true });

      expect(onChange).toHaveBeenCalledWith('hello <u>world</u>');
    });

    it('applies underline formatting on Cmd+U (metaKey)', () => {
      const onChange = jest.fn();
      render(<RichTextEditor value="hello world" onChange={onChange} />);
      const textarea = screen.getByRole('textbox') as HTMLTextAreaElement;

      Object.defineProperty(textarea, 'selectionStart', { writable: true, value: 6 });
      Object.defineProperty(textarea, 'selectionEnd', { writable: true, value: 11 });

      fireEvent.keyDown(textarea, { key: 'u', metaKey: true });

      expect(onChange).toHaveBeenCalledWith('hello <u>world</u>');
    });
  });

  // ─── Link formatting ──────────────────────────────────────────────────

  describe('Link button', () => {
    it('wraps selected text as a markdown link with placeholder url', () => {
      const onChange = jest.fn();
      render(<RichTextEditor value="click here" onChange={onChange} />);
      const textarea = screen.getByRole('textbox') as HTMLTextAreaElement;

      Object.defineProperty(textarea, 'selectionStart', { writable: true, value: 6 });
      Object.defineProperty(textarea, 'selectionEnd', { writable: true, value: 10 });

      fireEvent.mouseDown(screen.getByTitle('Insert link'), { preventDefault: jest.fn() });

      expect(onChange).toHaveBeenCalledWith('click [here](url)');
    });

    it('inserts [link text](url) template when no text is selected', () => {
      const onChange = jest.fn();
      render(<RichTextEditor value="start " onChange={onChange} />);
      const textarea = screen.getByRole('textbox') as HTMLTextAreaElement;

      Object.defineProperty(textarea, 'selectionStart', { writable: true, value: 6 });
      Object.defineProperty(textarea, 'selectionEnd', { writable: true, value: 6 });

      fireEvent.mouseDown(screen.getByTitle('Insert link'), { preventDefault: jest.fn() });

      expect(onChange).toHaveBeenCalledWith('start [link text](url)');
    });
  });

  // ─── Keyboard shortcuts ───────────────────────────────────────────────

  describe('Keyboard shortcuts', () => {
    it('applies bold formatting on Ctrl+B', () => {
      const onChange = jest.fn();
      render(<RichTextEditor value="hello world" onChange={onChange} />);
      const textarea = screen.getByRole('textbox') as HTMLTextAreaElement;

      Object.defineProperty(textarea, 'selectionStart', { writable: true, value: 6 });
      Object.defineProperty(textarea, 'selectionEnd', { writable: true, value: 11 });

      fireEvent.keyDown(textarea, { key: 'b', ctrlKey: true });

      expect(onChange).toHaveBeenCalledWith('hello **world**');
    });

    it('applies italic formatting on Ctrl+I', () => {
      const onChange = jest.fn();
      render(<RichTextEditor value="hello world" onChange={onChange} />);
      const textarea = screen.getByRole('textbox') as HTMLTextAreaElement;

      Object.defineProperty(textarea, 'selectionStart', { writable: true, value: 6 });
      Object.defineProperty(textarea, 'selectionEnd', { writable: true, value: 11 });

      fireEvent.keyDown(textarea, { key: 'i', ctrlKey: true });

      expect(onChange).toHaveBeenCalledWith('hello *world*');
    });

    it('applies bold formatting on Cmd+B (metaKey)', () => {
      const onChange = jest.fn();
      render(<RichTextEditor value="hello world" onChange={onChange} />);
      const textarea = screen.getByRole('textbox') as HTMLTextAreaElement;

      Object.defineProperty(textarea, 'selectionStart', { writable: true, value: 6 });
      Object.defineProperty(textarea, 'selectionEnd', { writable: true, value: 11 });

      fireEvent.keyDown(textarea, { key: 'b', metaKey: true });

      expect(onChange).toHaveBeenCalledWith('hello **world**');
    });

    it('does not call onChange for unrelated key combos', () => {
      const onChange = jest.fn();
      render(<RichTextEditor value="hello" onChange={onChange} />);
      const textarea = screen.getByRole('textbox');

      fireEvent.keyDown(textarea, { key: 'z', ctrlKey: true });

      expect(onChange).not.toHaveBeenCalled();
    });
  });

  // ─── Toggle / unwrap ──────────────────────────────────────────────────

  describe('Toggle formatting off', () => {
    it('unwraps bold markers when selection is already bold-wrapped', () => {
      const onChange = jest.fn();
      // value: "**bold**", select the inner "bold" (index 2–6)
      render(<RichTextEditor value="**bold**" onChange={onChange} />);
      const textarea = screen.getByRole('textbox') as HTMLTextAreaElement;

      Object.defineProperty(textarea, 'selectionStart', { writable: true, value: 2 });
      Object.defineProperty(textarea, 'selectionEnd', { writable: true, value: 6 });

      fireEvent.mouseDown(screen.getByTitle('Bold (Ctrl+B)'), { preventDefault: jest.fn() });

      expect(onChange).toHaveBeenCalledWith('bold');
    });

    it('unwraps <u>...</u> markers when selection is already underline-wrapped', () => {
      const onChange = jest.fn();
      // value: "<u>word</u>", select "word" (index 3–7)
      render(<RichTextEditor value="<u>word</u>" onChange={onChange} />);
      const textarea = screen.getByRole('textbox') as HTMLTextAreaElement;

      Object.defineProperty(textarea, 'selectionStart', { writable: true, value: 3 });
      Object.defineProperty(textarea, 'selectionEnd', { writable: true, value: 7 });

      fireEvent.mouseDown(screen.getByTitle('Underline (Ctrl+U)'), { preventDefault: jest.fn() });

      expect(onChange).toHaveBeenCalledWith('word');
    });
  });

  // ─── onChange passthrough ─────────────────────────────────────────────

  describe('Textarea onChange passthrough', () => {
    it('calls onChange when the user types in the textarea', () => {
      const onChange = jest.fn();
      render(<RichTextEditor value="" onChange={onChange} />);
      fireEvent.change(screen.getByRole('textbox'), { target: { value: 'new text' } });
      expect(onChange).toHaveBeenCalledWith('new text');
    });
  });

});
