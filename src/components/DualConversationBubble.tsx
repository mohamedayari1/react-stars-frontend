import { forwardRef, useEffect, useRef, useState } from 'react';
import ReactMarkdown from 'react-markdown';
// import remarkGfm from 'remark-gfm'; // Temporarily disabled due to streaming issues

import MarkdownErrorBoundary from './MarkdownErrorBoundary';

// TypeScript interfaces
interface MarkdownRendererProps {
  children: React.ReactNode;
  className?: string;
}

interface ConversationBubbleProps {
  message?: string;
  type: 'QUESTION' | 'ANSWER';
  className?: string;
}

interface DualAnswerBubbleProps {
  answerA?: string;
  answerB?: string;
  className?: string;
  onSelect?: (choice: 'A' | 'B') => void;
}

// Hardcoded theme for demo
const isDarkTheme = false;

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
    table: ({ children: tableChildren }: { children: React.ReactNode }) => (
      <div className="overflow-x-auto">
        <table className="table-auto border-collapse border border-gray-300">
          {tableChildren}
        </table>
      </div>
    ),
    th: ({ children: thChildren }: { children: React.ReactNode }) => (
      <th className="border border-gray-300 bg-gray-100 px-3 py-1 text-left">
        {thChildren}
      </th>
    ),
    td: ({ children: tdChildren }: { children: React.ReactNode }) => (
      <td className="border border-gray-300 px-3 py-1">{tdChildren}</td>
    ),
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
        <AnswerHeader
          icon="🔮"
          label="Astrology Insight"
          textToCopy={safeMessage}
        />
        <MarkdownRenderer className="mr-5 px-7 py-[18px]">
          {safeMessage || 'Thinking...'}
        </MarkdownRenderer>
      </div>
    );
  },
);

const DualAnswerBubble = forwardRef<HTMLDivElement, DualAnswerBubbleProps>(
  (
    { answerA = '', answerB = '', className = '', onSelect = () => {} },
    ref,
  ) => {
    return (
      <div
        ref={ref}
        className={`flex flex-col self-start ${className} group w-full`}
        style={{ color: isDarkTheme ? '#E5E7EB' : '#374151' }}
      >
        <div className="flex flex-row gap-4">
          {/* Answer A */}
          <div className="flex w-full max-w-[50%] flex-col items-start">
            <AnswerHeader icon="🔮" label="Answer A" textToCopy={answerA} />
            <MarkdownRenderer className="px-7 py-[18px]">
              {answerA}
            </MarkdownRenderer>
          </div>
          {/* Answer B */}
          <div className="flex w-full max-w-[50%] flex-col items-start">
            <AnswerHeader icon="🔮" label="Answer B" textToCopy={answerB} />
            <MarkdownRenderer className="px-7 py-[18px]">
              {answerB}
            </MarkdownRenderer>
          </div>
        </div>

        <div className="mt-6 flex justify-center">
          <div className="flex flex-col items-center">
            <p className="mb-3 text-lg font-medium">Which one do you prefer?</p>
            <div className="flex gap-4">
              <button
                onClick={() => onSelect('A')}
                className="rounded-lg bg-blue-500 px-6 py-2 text-white transition-colors hover:bg-blue-600"
              >
                Prefer A
              </button>
              <button
                onClick={() => onSelect('B')}
                className="rounded-lg bg-blue-500 px-6 py-2 text-white transition-colors hover:bg-blue-600"
              >
                Prefer B
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  },
);

export { ConversationBubble, DualAnswerBubble };

// Updated Demo component
const DualDemo = () => {
  const [messages, setMessages] = useState<
    Array<{ type: 'QUESTION' | 'ANSWER'; message: string }>
  >([
    {
      type: 'QUESTION',
      message: "What's my zodiac sign if I was born on July 19?",
    },
    {
      type: 'ANSWER',
      message: `# Zodiac Sign: Cancer 🦀
You are a **Cancer**, known for being intuitive, emotional, and compassionate.
## Traits:
- Caring and empathetic
- Loyal to friends and family
- Creative and imaginative
> "Cancers are the nurturers of the zodiac. They feel deeply and care profoundly."`,
    },
    {
      type: 'QUESTION',
      message: 'Can you tell me my horoscope for today?',
    },
    {
      type: 'ANSWER',
      message: `# Daily Horoscope 🌟
## Cancer (July 19)
Today, the Moon encourages you to focus on **self-care** and reflection. You may feel extra sensitive to others' moods.
### Advice:
1. Take a short break to recharge your energy.
2. Trust your intuition when making decisions.
3. Avoid unnecessary conflicts at work or home.
> Lucky color: Silver  
> Lucky number: 7`,
    },
    {
      type: 'QUESTION',
      message: 'How will Mercury retrograde affect me?',
    },
  ]);

  const [showDualAnswers, setShowDualAnswers] = useState(true);

  const answerA = `# Mercury Retrograde 🔄
Mercury retrograde can bring challenges in communication and technology. As a Cancer:
- Double-check emails and messages.
- Avoid making big purchases or signing contracts.
- Use this time to **reflect** and **reorganize** your priorities.
> Remember: Retrograde periods are for **reviewing, not rushing**.`;

  const answerB = `# Mercury Retrograde Impact 🌌
For Cancers during Mercury retrograde:
- Communication mishaps may arise; be patient.
- Tech glitches possible—back up important data.
- Great period for introspection and revisiting old ideas.
> Tip: Embrace the slowdown to nurture your inner world.`;

  const handleSelect = (choice: 'A' | 'B') => {
    const selectedMessage = choice === 'A' ? answerA : answerB;
    setMessages((prevMessages) => [
      ...prevMessages,
      { type: 'ANSWER', message: selectedMessage },
    ]);
    setShowDualAnswers(false);
  };

  return (
    <div className="mx-auto w-full max-w-4xl space-y-4 p-4">
      <h1 className="text-center text-2xl font-bold">Conversation Demo</h1>
      {messages.map((msg, index) => (
        <ConversationBubble
          key={index}
          type={msg.type}
          message={msg.message}
          className="mb-4 w-full"
        />
      ))}
      {showDualAnswers && (
        <DualAnswerBubble
          answerA={answerA}
          answerB={answerB}
          className="mb-4 w-full"
          onSelect={handleSelect}
        />
      )}
    </div>
  );
};

export default DualDemo;
