import React, { useState, useRef } from "react";
import ReactMarkdown from "react-markdown";
import { Bold, Heading2, Quote, PenLine, Eye } from "lucide-react";

export interface NoteEditorProps {
  value: string;
  onChange: ((value: string) => void) | ((e: { target: { value: string } }) => void);
  placeholder?: string;
  rows?: number;
  id?: string;
  className?: string;
  disabled?: boolean;
}

/**
 * Reusable Markdown Formatter for Notes.
 * Renders bold text, topic headings (##), and highlighted callouts (>) using
 * the app's CSS theme variables (--accent-swatch, --surface-muted, --border-color).
 */
export const NoteMarkdownRenderer: React.FC<{
  content: string;
  className?: string;
}> = ({ content, className = "" }) => {
  if (!content || !content.trim()) {
    return (
      <div
        className="py-6 px-4 text-center text-xs italic rounded-lg border border-dashed text-slate-400 dark:text-slate-500"
        style={{
          borderColor: "var(--border-color)",
          backgroundColor: "var(--surface-muted)",
        }}
      >
        No content to display.
      </div>
    );
  }

  return (
    <div className={`note-markdown-view space-y-2 text-xs sm:text-sm text-slate-800 dark:text-slate-200 leading-relaxed ${className}`}>
      <ReactMarkdown
        components={{
          h1: ({ children, ...props }) => (
            <h1
              {...props}
              className="text-lg font-bold text-slate-900 dark:text-white mt-4 mb-2 pb-1 border-b"
              style={{ borderColor: "var(--border-color)" }}
            >
              {children}
            </h1>
          ),
          h2: ({ children, ...props }) => (
            <h2
              {...props}
              className="text-base font-bold text-slate-900 dark:text-white mt-3.5 mb-2 flex items-center gap-2"
            >
              <span
                className="w-1.5 h-4 rounded-full shrink-0"
                style={{ backgroundColor: "var(--accent-swatch)" }}
              />
              <span>{children}</span>
            </h2>
          ),
          h3: ({ children, ...props }) => (
            <h3
              {...props}
              className="text-sm font-bold text-slate-900 dark:text-white mt-2.5 mb-1"
            >
              {children}
            </h3>
          ),
          strong: ({ children, ...props }) => (
            <strong
              {...props}
              className="font-bold text-slate-900 dark:text-white"
            >
              {children}
            </strong>
          ),
          em: ({ children, ...props }) => (
            <em {...props} className="italic text-slate-800 dark:text-slate-200">
              {children}
            </em>
          ),
          blockquote: ({ children, ...props }) => (
            <blockquote
              {...props}
              style={{
                borderLeftColor: "var(--accent-swatch)",
                backgroundColor: "var(--surface-muted)",
                borderTopColor: "var(--border-color)",
                borderRightColor: "var(--border-color)",
                borderBottomColor: "var(--border-color)",
              }}
              className="my-3 p-3 sm:p-3.5 rounded-r-xl border border-l-4 text-slate-800 dark:text-slate-100 shadow-2xs font-medium text-xs sm:text-sm leading-relaxed transition-colors [&>p:first-child]:mt-0 [&>p:last-child]:mb-0 [&>p]:my-1.5"
            >
              {children}
            </blockquote>
          ),
          p: ({ children, ...props }) => (
            <p
              {...props}
              className="my-2 text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed"
            >
              {children}
            </p>
          ),
          ul: ({ children, ...props }) => (
            <ul
              {...props}
              className="list-disc list-inside text-xs sm:text-sm text-slate-700 dark:text-slate-300 space-y-1 my-2 pl-1"
            >
              {children}
            </ul>
          ),
          ol: ({ children, ...props }) => (
            <ol
              {...props}
              className="list-decimal list-inside text-xs sm:text-sm text-slate-700 dark:text-slate-300 space-y-1 my-2 pl-1"
            >
              {children}
            </ol>
          ),
          li: ({ children, ...props }) => (
            <li {...props} className="leading-relaxed">
              {children}
            </li>
          ),
          code: ({ className: codeClassName, children, ...props }: any) => {
            const isBlock = Boolean(codeClassName);
            if (!isBlock) {
              return (
                <code
                  {...props}
                  className="px-1.5 py-0.5 rounded text-[11px] font-mono bg-slate-100 dark:bg-slate-800 text-indigo-700 dark:text-indigo-300 border border-slate-200 dark:border-slate-700"
                >
                  {children}
                </code>
              );
            }
            return (
              <pre className="p-3 my-2.5 rounded-lg bg-slate-900 dark:bg-slate-950 text-slate-100 text-xs font-mono overflow-x-auto border border-slate-800">
                <code {...props}>{children}</code>
              </pre>
            );
          },
          hr: ({ ...props }) => (
            <hr
              {...props}
              className="my-3 border-t"
              style={{ borderColor: "var(--border-color)" }}
            />
          ),
          a: ({ children, ...props }) => (
            <a
              {...props}
              className="text-indigo-600 dark:text-indigo-400 underline hover:opacity-80 transition-opacity"
              target="_blank"
              rel="noopener noreferrer"
            >
              {children}
            </a>
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
};

export const NoteEditor: React.FC<NoteEditorProps> = ({
  value,
  onChange,
  placeholder = "Write notes in Markdown format...",
  rows = 5,
  id,
  className = "",
  disabled = false,
}) => {
  const [activeTab, setActiveTab] = useState<"write" | "preview">("write");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const emitChange = (nextValue: string) => {
    if (typeof onChange === "function") {
      try {
        (onChange as (val: string) => void)(nextValue);
      } catch {
        (onChange as (e: { target: { value: string } }) => void)({
          target: { value: nextValue },
        });
      }
    }
  };

  /**
   * Bold: wraps currently selected text in the textarea with ** on both sides.
   * If no text is selected, inserts **bold text** and highlights the placeholder.
   */
  const handleBold = () => {
    if (disabled || activeTab === "preview") return;
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selected = value.substring(start, end);
    const before = value.substring(0, start);
    const after = value.substring(end);

    let newText: string;
    let newStart: number;
    let newEnd: number;

    if (selected.length > 0) {
      newText = `${before}**${selected}**${after}`;
      newStart = start + 2;
      newEnd = end + 2;
    } else {
      const placeholderText = "bold text";
      newText = `${before}**${placeholderText}**${after}`;
      newStart = start + 2;
      newEnd = start + 2 + placeholderText.length;
    }

    emitChange(newText);

    requestAnimationFrame(() => {
      if (textareaRef.current) {
        textareaRef.current.focus();
        textareaRef.current.setSelectionRange(newStart, newEnd);
      }
    });
  };

  /**
   * Topic Heading: inserts "## " at the start of the current line.
   */
  const handleTopicHeading = () => {
    if (disabled || activeTab === "preview") return;
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;

    const beforeCursor = value.substring(0, start);
    const lastNewline = beforeCursor.lastIndexOf("\n");
    const lineStartIndex = lastNewline === -1 ? 0 : lastNewline + 1;

    const prefix = value.substring(0, lineStartIndex);
    const remainder = value.substring(lineStartIndex);

    const newText = prefix + "## " + remainder;
    const newStart = start + 3;
    const newEnd = end + 3;

    emitChange(newText);

    requestAnimationFrame(() => {
      if (textareaRef.current) {
        textareaRef.current.focus();
        textareaRef.current.setSelectionRange(newStart, newEnd);
      }
    });
  };

  /**
   * Key Sentence: inserts "> " at the start of the current line.
   */
  const handleKeySentence = () => {
    if (disabled || activeTab === "preview") return;
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;

    const beforeCursor = value.substring(0, start);
    const lastNewline = beforeCursor.lastIndexOf("\n");
    const lineStartIndex = lastNewline === -1 ? 0 : lastNewline + 1;

    const prefix = value.substring(0, lineStartIndex);
    const remainder = value.substring(lineStartIndex);

    const newText = prefix + "> " + remainder;
    const newStart = start + 2;
    const newEnd = end + 2;

    emitChange(newText);

    requestAnimationFrame(() => {
      if (textareaRef.current) {
        textareaRef.current.focus();
        textareaRef.current.setSelectionRange(newStart, newEnd);
      }
    });
  };

  return (
    <div
      className={`rounded-lg border overflow-hidden transition-all duration-150 focus-within:ring-2 focus-within:ring-indigo-500/30 ${className}`}
      style={{
        borderColor: "var(--border-color)",
        backgroundColor: "var(--surface-card)",
      }}
    >
      {/* Note Editor Toolbar */}
      <div
        className="flex flex-wrap items-center justify-between gap-1.5 px-3 py-2 border-b select-none"
        style={{
          backgroundColor: "var(--surface-muted)",
          borderColor: "var(--border-color)",
        }}
      >
        {/* Formatting Actions */}
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={handleBold}
            disabled={activeTab === "preview" || disabled}
            title="Bold (**text**)"
            className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-md text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/80 dark:hover:bg-slate-750 active:scale-95 disabled:opacity-40 disabled:pointer-events-none transition-colors cursor-pointer"
          >
            <Bold className="w-3.5 h-3.5 text-slate-600 dark:text-slate-400" />
            <span className="hidden sm:inline">Bold</span>
          </button>

          <button
            type="button"
            onClick={handleTopicHeading}
            disabled={activeTab === "preview" || disabled}
            title="Topic Heading (## Heading)"
            className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-md text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/80 dark:hover:bg-slate-750 active:scale-95 disabled:opacity-40 disabled:pointer-events-none transition-colors cursor-pointer"
          >
            <Heading2 className="w-3.5 h-3.5 text-slate-600 dark:text-slate-400" />
            <span className="hidden sm:inline">Topic Heading</span>
          </button>

          <button
            type="button"
            onClick={handleKeySentence}
            disabled={activeTab === "preview" || disabled}
            title="Key Sentence Callout (> Callout)"
            className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-md text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/80 dark:hover:bg-slate-750 active:scale-95 disabled:opacity-40 disabled:pointer-events-none transition-colors cursor-pointer"
          >
            <Quote className="w-3.5 h-3.5 text-slate-600 dark:text-slate-400" />
            <span className="hidden sm:inline">Key Sentence</span>
          </button>
        </div>

        {/* Write / Preview Mode Toggle */}
        <div
          className="flex items-center p-0.5 rounded-lg border text-xs"
          style={{
            backgroundColor: "var(--surface-card)",
            borderColor: "var(--border-color)",
          }}
        >
          <button
            type="button"
            onClick={() => setActiveTab("write")}
            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs transition-all cursor-pointer ${
              activeTab === "write"
                ? "bg-slate-200/80 dark:bg-slate-800 text-slate-900 dark:text-white font-semibold shadow-2xs"
                : "text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 font-medium"
            }`}
          >
            <PenLine className="w-3 h-3" />
            <span>Write</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("preview")}
            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs transition-all cursor-pointer ${
              activeTab === "preview"
                ? "bg-slate-200/80 dark:bg-slate-800 text-slate-900 dark:text-white font-semibold shadow-2xs"
                : "text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 font-medium"
            }`}
          >
            <Eye className="w-3 h-3" />
            <span>Preview</span>
          </button>
        </div>
      </div>

      {/* Editor Body */}
      {activeTab === "write" ? (
        <textarea
          ref={textareaRef}
          id={id}
          value={value}
          onChange={(e) => emitChange(e.target.value)}
          placeholder={placeholder}
          rows={rows}
          disabled={disabled}
          className="w-full px-3.5 py-2.5 text-xs sm:text-sm font-mono bg-transparent text-slate-900 dark:text-slate-100 focus:outline-none resize-y min-h-[110px]"
        />
      ) : (
        <div className="w-full px-4 py-3 min-h-[110px] max-h-[380px] overflow-y-auto">
          <NoteMarkdownRenderer content={value} />
        </div>
      )}

      {/* Footer Meta Indicator */}
      <div
        className="flex items-center justify-between px-3 py-1 border-t text-[11px] text-slate-400"
        style={{
          borderColor: "var(--border-color-subtle)",
          backgroundColor: "var(--surface-muted)",
        }}
      >
        <span>Markdown enabled: **bold**, ## heading, &gt; callout</span>
        <span className="font-mono">{value ? value.length : 0} chars</span>
      </div>
    </div>
  );
};
