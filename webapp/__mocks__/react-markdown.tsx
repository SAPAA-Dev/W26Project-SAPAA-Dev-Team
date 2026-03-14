import React from 'react';

// Lightweight Jest mock for react-markdown (ESM-only in production).
// Renders markdown content as plain text wrapped in a span so tests can
// assert on text content without needing the full ESM parser.
const ReactMarkdown = ({ children }: { children: string }) => (
  <span data-testid="mock-react-markdown">{children}</span>
);

export default ReactMarkdown;
