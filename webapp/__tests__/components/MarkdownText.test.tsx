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

    it('renders the link label as visible text', () => {
      render(<MarkdownText content="[Visit site](https://example.com)" />);
      expect(screen.getByRole('link', { name: 'Visit site' })).toBeInTheDocument();
    });

    it('passes underline HTML to ReactMarkdown', () => {
      render(<MarkdownText content="<u>underlined</u>" />);
      expect(screen.getByTestId('mock-react-markdown')).toHaveTextContent('<u>underlined</u>');
    });
  });

  // ─── Link URL normalisation ───────────────────────────────────────────

  describe('link URL normalisation', () => {
    it('leaves an https:// URL unchanged', () => {
      render(<MarkdownText content="[Site](https://example.com)" />);
      expect(screen.getByRole('link')).toHaveAttribute('href', 'https://example.com');
    });

    it('leaves an http:// URL unchanged', () => {
      render(<MarkdownText content="[Site](http://example.com)" />);
      expect(screen.getByRole('link')).toHaveAttribute('href', 'http://example.com');
    });

    it('prepends https:// when the URL has no protocol', () => {
      render(<MarkdownText content="[Site](iNaturalist.ca)" />);
      expect(screen.getByRole('link')).toHaveAttribute('href', 'https://iNaturalist.ca');
    });

    it('opens links in a new tab', () => {
      render(<MarkdownText content="[Site](https://example.com)" />);
      expect(screen.getByRole('link')).toHaveAttribute('target', '_blank');
    });

    it('sets rel="noopener noreferrer" on links', () => {
      render(<MarkdownText content="[Site](https://example.com)" />);
      expect(screen.getByRole('link')).toHaveAttribute('rel', 'noopener noreferrer');
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
