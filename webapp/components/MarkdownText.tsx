import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeRaw from "rehype-raw";

interface MarkdownTextProps {
  content: string | null | undefined;
  className?: string;
}

export default function MarkdownText({ content, className }: MarkdownTextProps) {
  if (!content) return null;

  return (
    <span className={className}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeRaw]}
        allowedElements={["p", "strong", "em", "a", "u"]}
        unwrapDisallowed
        components={{
          p: ({ children }) => <span>{children}</span>,
          a: ({ href, children }) => (
            <a
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#356B43] underline hover:text-[#254431]"
            >
              {children}
            </a>
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    </span>
  );
}
