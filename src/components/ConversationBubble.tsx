import PropTypes from 'prop-types';
import { forwardRef, useEffect, useRef, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

// Hardcoded theme for demo
const isDarkTheme = false;

// Reusable Markdown Renderer component
const MarkdownRenderer = ({ children, className }) => {
  const markdownComponents = {
    h1: ({ children: h1Children }) => (
      <h1 className="text-2xl font-bold text-purple-600">{h1Children}</h1>
    ),
    h2: ({ children: h2Children }) => (
      <h2 className="mt-2 text-xl font-semibold text-indigo-500">
        {h2Children}
      </h2>
    ),
    h3: ({ children: h3Children }) => (
      <h3 className="mt-2 text-lg font-medium text-blue-500">{h3Children}</h3>
    ),
    blockquote: ({ children: blockquoteChildren }) => (
      <blockquote className="border-l-4 border-purple-400 pl-4 text-gray-600 italic">
        {blockquoteChildren}
      </blockquote>
    ),
    ul: ({ children: ulChildren }) => (
      <ul className="list-disc space-y-1 pl-5">{ulChildren}</ul>
    ),
    ol: ({ children: olChildren }) => (
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
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={markdownComponents}
      >
        {children}
      </ReactMarkdown>
    </div>
  );
};

// Simple Avatar component
const Avatar = ({ children, className }) => (
  <div className={`flex items-center justify-center ${className}`}>
    {children}
  </div>
);

// Copy button
const CopyButton = ({ textToCopy }) => {
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
const AnswerHeader = ({ icon, label, textToCopy }) => (
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

const ConversationBubble = forwardRef(
  ({ message = '', type = 'ANSWER', className = '' }, ref) => {
    const messageRef = useRef(null);
    const [shouldShowToggle, setShouldShowToggle] = useState(false);
    const [isQuestionCollapsed, setIsQuestionCollapsed] = useState(true);

    useEffect(() => {
      if (messageRef.current && type === 'QUESTION') {
        const height = messageRef.current.scrollHeight;
        setShouldShowToggle(height > 84);
      }
    }, [message, type]);

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
                {message}
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
        <AnswerHeader icon="🔮" label="AI Assistant" textToCopy={message} />
        <MarkdownRenderer className="mr-5 px-7 py-[18px]">
          {message || 'Thinking...'}
        </MarkdownRenderer>
      </div>
    );
  },
);

ConversationBubble.propTypes = {
  message: PropTypes.string,
  type: PropTypes.oneOf(['QUESTION', 'ANSWER']).isRequired,
  className: PropTypes.string,
};

export default ConversationBubble;
