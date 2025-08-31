import { forwardRef, useEffect, useRef, useState } from 'react';
import ReactMarkdown from 'react-markdown';
// import remarkGfm from 'remark-gfm'; // Temporarily disabled due to streaming issues

import MarkdownErrorBoundary from './MarkdownErrorBoundary';

// TypeScript interfaces
interface ConversationBubbleProps {
  message?: string;
  type: 'QUESTION' | 'ANSWER';
  className?: string;
}

interface MarkdownRendererProps {
  children: React.ReactNode;
  className?: string;
}

// Hardcoded theme for demo
const isDarkTheme = true;

// Reusable Markdown Renderer component
const MarkdownRenderer = ({ children, className }: MarkdownRendererProps) => {
  const markdownComponents = {
    h1: ({ children: h1Children }: { children: React.ReactNode }) => (
      <h1 className="text-2xl font-bold text-purple-600">{h1Children}</h1>
    ),
    h2: ({ children: h2Children }: { children: React.ReactNode }) => (
      <h2 className="mt-2 text-xl font-semibold text-indigo-500">
        {h2Children}
      </h2>
    ),
    h3: ({ children: h3Children }: { children: React.ReactNode }) => (
      <h3 className="mt-2 text-lg font-medium text-blue-500">{h3Children}</h3>
    ),
    blockquote: ({
      children: blockquoteChildren,
    }: {
      children: React.ReactNode;
    }) => (
      <blockquote className="border-l-4 border-purple-400 pl-4 text-gray-600 italic">
        {blockquoteChildren}
      </blockquote>
    ),
    ul: ({ children: ulChildren }: { children: React.ReactNode }) => (
      <ul className="list-disc space-y-1 pl-5">{ulChildren}</ul>
    ),
    ol: ({ children: olChildren }: { children: React.ReactNode }) => (
      <ol className="list-decimal space-y-1 pl-5">{olChildren}</ol>
    ),
    // Add more markdown components as needed
  };

  return (
    <div
      className={`prose prose-sm sm:prose-base dark:prose-invert ${className}`}
      style={{
        backgroundColor: isDarkTheme ? '#374151' : '#F3F4F6',
        borderRadius: '28px',
      }}
    >
      {/* FIXED: Add safety check to prevent ReactMarkdown errors */}
      {children && typeof children === 'string' ? (
        <MarkdownErrorBoundary>
          <ReactMarkdown
            // remarkPlugins={[remarkGfm]} // Temporarily disabled due to streaming issues
            components={markdownComponents}
          >
            {children}
          </ReactMarkdown>
        </MarkdownErrorBoundary>
      ) : (
        <div className="text-gray-500">No content to display</div>
      )}
    </div>
  );
};

// Simple Avatar component
const Avatar = ({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) => (
  <div className={`flex items-center justify-center ${className}`}>
    {children}
  </div>
);

// Copy button
const CopyButton = ({ textToCopy }: { textToCopy: string }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(textToCopy);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  };

  return (
    <button
      onClick={handleCopy}
      className="flex items-center justify-center rounded-full p-2 text-sm hover:bg-gray-200 dark:hover:bg-gray-600"
      title={copied ? 'Copied!' : 'Copy'}
    >
      {copied ? '✓' : '📋'}
    </button>
  );
};

// Answer bubble header (reusable)
const AnswerHeader = ({
  icon,
  label,
  textToCopy,
}: {
  icon: string;
  label: string;
  textToCopy?: string;
}) => (
  <div className="my-2 flex flex-row items-center gap-3">
    <Avatar className="h-[34px] w-[34px] text-2xl">
      <div
        className="flex h-full w-full items-center justify-center rounded-full text-sm font-bold text-white"
        style={{ backgroundColor: '#10B981' }}
      >
        {icon}
      </div>
    </Avatar>
    <p className="text-base font-semibold">{label}</p>
    {textToCopy && <CopyButton textToCopy={textToCopy} />}
  </div>
);

const ConversationBubble = forwardRef<HTMLDivElement, ConversationBubbleProps>(
  ({ message = '', type = 'ANSWER', className = '' }, ref) => {
    // FIXED: Ensure message is always a string to prevent ReactMarkdown errors
    const safeMessage =
      typeof message === 'string' ? message : String(message || '');
    const messageRef = useRef<HTMLDivElement>(null);
    const [shouldShowToggle, setShouldShowToggle] = useState(false);
    const [isQuestionCollapsed, setIsQuestionCollapsed] = useState(true);

    useEffect(() => {
      if (messageRef.current && type === 'QUESTION') {
        const height = messageRef.current.scrollHeight;
        setShouldShowToggle(height > 84);
      }
    }, [safeMessage, type]);

    const commonClasses = `w-full ${className} ${type === 'ANSWER' ? 'flex-col self-start group' : ''}`;

    if (type === 'QUESTION') {
      return (
        <div ref={ref} className={commonClasses}>
          <div className="flex w-full justify-end gap-2">
            <div className="relative flex max-w-[70%] flex-col">
              <div
                ref={messageRef}
                className="flex items-end gap-2 rounded-[28px] bg-gradient-to-r from-purple-500 to-blue-500 px-5 py-4 text-sm leading-normal break-words whitespace-pre-wrap text-white sm:text-base"
                style={{
                  display: '-webkit-box',
                  WebkitBoxOrient: 'vertical',
                  overflow: 'hidden',
                  WebkitLineClamp: isQuestionCollapsed ? 4 : 'none',
                }}
              >
                {safeMessage}
                {shouldShowToggle && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setIsQuestionCollapsed(!isQuestionCollapsed);
                    }}
                    className="hover:bg-opacity-20 ml-1 rounded-full p-2 transition-colors hover:bg-white"
                  >
                    <span
                      className={`inline-block transform text-white transition-transform duration-200 ${
                        isQuestionCollapsed ? '' : 'rotate-180'
                      }`}
                    >
                      ⌄
                    </span>
                  </button>
                )}
              </div>
            </div>
            <Avatar className="mt-2 shrink-0 text-2xl">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-500 text-sm font-bold text-white">
                🧑
              </div>
            </Avatar>
          </div>
        </div>
      );
    }

    // Answer bubble (refactored)
    return (
      <div
        ref={ref}
        className={commonClasses}
        style={{ color: isDarkTheme ? '#E5E7EB' : '#374151' }}
      >
        <AnswerHeader icon="🔮" label="AI Assistant" textToCopy={safeMessage} />
        <MarkdownRenderer className="mr-5 px-7 py-[18px]">
          {safeMessage || 'Thinking...'}
        </MarkdownRenderer>
      </div>
    );
  },
);

export default ConversationBubble;
