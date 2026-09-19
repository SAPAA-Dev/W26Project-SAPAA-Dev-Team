"use client";

import React, { useRef } from "react";
import { Link } from "lucide-react";

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  rows?: number;
  className?: string;
  textareaClassName?: string;
  id?: string;
  testId?: string;
}

export default function RichTextEditor({
  value,
  onChange,
  placeholder,
  rows = 3,
  className,
  textareaClassName,
  id,
  testId,
}: RichTextEditorProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  function applyFormat(type: "bold" | "italic" | "underline" | "link") {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const before = value.slice(0, start);
    const selected = value.slice(start, end);
    const after = value.slice(end);

    let newValue = value;
    let newStart = start;
    let newEnd = end;

    if (type === "bold") {
      const isWrapped =
        value.slice(start - 2, start) === "**" &&
        value.slice(end, end + 2) === "**";
      if (isWrapped) {
        newValue = value.slice(0, start - 2) + selected + value.slice(end + 2);
        newStart = start - 2;
        newEnd = end - 2;
      } else {
        newValue = before + `**${selected}**` + after;
        newStart = start + 2;
        newEnd = end + 2;
      }
    } else if (type === "underline") {
      const isWrapped =
        value.slice(start - 3, start) === "<u>" &&
        value.slice(end, end + 4) === "</u>";
      if (isWrapped) {
        newValue = value.slice(0, start - 3) + selected + value.slice(end + 4);
        newStart = start - 3;
        newEnd = end - 3;
      } else {
        newValue = before + `<u>${selected}</u>` + after;
        newStart = start + 3;
        newEnd = end + 3;
      }
    } else if (type === "italic") {
      const isWrapped =
        value.slice(start - 1, start) === "*" &&
        value.slice(end, end + 1) === "*" &&
        value.slice(start - 2, start) !== "**" &&
        value.slice(end, end + 2) !== "**";
      if (isWrapped) {
        newValue = value.slice(0, start - 1) + selected + value.slice(end + 1);
        newStart = start - 1;
        newEnd = end - 1;
      } else {
        newValue = before + `*${selected}*` + after;
        newStart = start + 1;
        newEnd = end + 1;
      }
    } else if (type === "link") {
      if (selected) {
        const inserted = `[${selected}](url)`;
        newValue = before + inserted + after;
        newStart = start + selected.length + 3;
        newEnd = newStart + 3;
      } else {
        const inserted = "[link text](url)";
        newValue = before + inserted + after;
        newStart = start + 1;
        newEnd = start + 10;
      }
    }

    onChange(newValue);
    requestAnimationFrame(() => {
      textarea.focus();
      textarea.setSelectionRange(newStart, newEnd);
    });
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if ((e.ctrlKey || e.metaKey) && e.key === "b") {
      e.preventDefault();
      applyFormat("bold");
    } else if ((e.ctrlKey || e.metaKey) && e.key === "i") {
      e.preventDefault();
      applyFormat("italic");
    } else if ((e.ctrlKey || e.metaKey) && e.key === "u") {
      e.preventDefault();
      applyFormat("underline");
    }
  }

  const toolbarBtnClass =
    "px-2 py-0.5 rounded text-[#254431] hover:bg-[#E4EBE4] transition-colors";

  return (
    <div
      className={`border-2 border-[#E4EBE4] rounded-lg focus-within:border-[#356B43] transition-colors ${className ?? ""}`}
    >
      <div className="flex items-center gap-1 border-b border-[#E4EBE4] bg-[#F7F2EA] rounded-t-lg px-2 py-1">
        <button
          type="button"
          title="Bold (Ctrl+B)"
          className={`${toolbarBtnClass} font-bold text-sm`}
          onMouseDown={(e) => {
            e.preventDefault();
            applyFormat("bold");
          }}
        >
          B
        </button>
        <button
          type="button"
          title="Underline (Ctrl+U)"
          className={`${toolbarBtnClass} underline text-sm`}
          onMouseDown={(e) => {
            e.preventDefault();
            applyFormat("underline");
          }}
        >
          U
        </button>
        <button
          type="button"
          title="Italic (Ctrl+I)"
          className={`${toolbarBtnClass} italic text-sm`}
          onMouseDown={(e) => {
            e.preventDefault();
            applyFormat("italic");
          }}
        >
          I
        </button>
        <button
          type="button"
          title="Insert link"
          className={toolbarBtnClass}
          onMouseDown={(e) => {
            e.preventDefault();
            applyFormat("link");
          }}
        >
          <Link className="w-3.5 h-3.5" />
        </button>
      </div>
      <textarea
        ref={textareaRef}
        id={id}
        data-testid={testId}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        rows={rows}
        className={`w-full px-3 py-2 text-sm bg-transparent rounded-b-lg focus:outline-none resize-none ${textareaClassName ?? ""}`}
      />
    </div>
  );
}
