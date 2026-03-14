import React from 'react';
import { render, screen } from '@testing-library/react';
import MarkdownText from '../../components/MarkdownText';

// react-markdown and remark-gfm are mocked via jest.config.ts moduleNameMapper.
// The mock renders content as plain text, which is sufficient to verify that
// MarkdownText passes content through and applies the className wrapper.

describe('MarkdownText', () => {
  // ─── Null / empty guard ───────────────────────────────────────────────

  describe('null and empty content', () => {
    it('renders nothing when content is null', () => {
      const { container } = render(<MarkdownText content={null} />);
      expect(container).toBeEmptyDOMElement();
    });

    it('renders nothing when content is undefined', () => {
      const { container } = render(<MarkdownText content={undefined} />);
      expect(container).toBeEmptyDOMElement();
    });

    it('renders nothing when content is an empty string', () => {
      const { container } = render(<MarkdownText content="" />);
      expect(container).toBeEmptyDOMElement();
    });
  });

  // ─── Content rendering ────────────────────────────────────────────────

  describe('content rendering', () => {
    it('renders plain text content', () => {
      render(<MarkdownText content="Hello world" />);
      expect(screen.getByText('Hello world')).toBeInTheDocument();
    });

    it('passes markdown content to ReactMarkdown', () => {
      render(<MarkdownText content="**bold text**" />);
      // The mock renders the raw string; assert it arrives intact
      expect(screen.getByTestId('mock-react-markdown')).toHaveTextContent('**bold text**');
    });

    it('passes italic markdown to ReactMarkdown', () => {
      render(<MarkdownText content="*italic text*" />);
      expect(screen.getByTestId('mock-react-markdown')).toHaveTextContent('*italic text*');
    });

    it('passes link markdown to ReactMarkdown', () => {
      render(<MarkdownText content="[Visit site](https://example.com)" />);
      expect(screen.getByTestId('mock-react-markdown')).toHaveTextContent(
        '[Visit site](https://example.com)'
      );
    });

    it('passes underline HTML to ReactMarkdown', () => {
      render(<MarkdownText content="<u>underlined</u>" />);
      expect(screen.getByTestId('mock-react-markdown')).toHaveTextContent('<u>underlined</u>');
    });
  });

  // ─── className passthrough ────────────────────────────────────────────

  describe('className passthrough', () => {
    it('applies the provided className to the wrapper span', () => {
      const { container } = render(
        <MarkdownText content="test" className="text-sm text-[#7A8075]" />
      );
      const wrapper = container.firstChild as HTMLElement;
      expect(wrapper.className).toContain('text-sm');
      expect(wrapper.className).toContain('text-[#7A8075]');
    });

    it('renders without errors when no className is provided', () => {
      expect(() => render(<MarkdownText content="test" />)).not.toThrow();
    });
  });
});
