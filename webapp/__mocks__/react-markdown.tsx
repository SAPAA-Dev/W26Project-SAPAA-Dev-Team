import React from 'react';

interface MockProps {
  children: string;
  components?: {
    a?: (props: { href: string; children: string }) => React.ReactElement;
    [key: string]: any;
  };
  [key: string]: any;
}

// Lightweight Jest mock for react-markdown (ESM-only in production).
// Renders plain text wrapped in a span, and processes inline markdown links
// so that components.a overrides (e.g. href normalisation) can be tested.
const ReactMarkdown = ({ children, components }: MockProps) => {
  const linkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;
  const parts: React.ReactNode[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = linkRegex.exec(children)) !== null) {
    if (match.index > lastIndex) {
      parts.push(children.slice(lastIndex, match.index));
    }
    const [, text, href] = match;
    parts.push(
      components?.a
        ? components.a({ href, children: text })
        : <a key={match.index} href={href}>{text}</a>
    );
    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < children.length) {
    parts.push(children.slice(lastIndex));
  }

  return (
    <span data-testid="mock-react-markdown">
      {parts.length > 0 ? parts : children}
    </span>
  );
};

export default ReactMarkdown;
