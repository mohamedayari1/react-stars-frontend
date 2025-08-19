import { forwardRef, useEffect, useRef, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

// Hardcoded theme for demo
const isDarkTheme = false;

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

const ConversationBubble = forwardRef(
  (
    {
      message = '',
      type = 'ANSWER', // 'QUESTION' or 'ANSWER'
      className = '',
    },
    ref,
  ) => {
    const messageRef = useRef(null);
    const [shouldShowToggle, setShouldShowToggle] = useState(false);
    const [isQuestionCollapsed, setIsQuestionCollapsed] = useState(true);

    useEffect(() => {
      if (messageRef.current && type === 'QUESTION') {
        const height = messageRef.current.scrollHeight;
        setShouldShowToggle(height > 84);
      }
    }, [message, type]);

    if (type === 'QUESTION') {
      return (
        <div className={`w-full ${className}`}>
          <div className="flex flex-col items-end">
            <div ref={ref} className="flex w-full justify-end gap-2">
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
                      className="ml-1 rounded-full p-2 hover:bg-white hover:bg-opacity-20 transition-colors"
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
                  👤
                </div>
              </Avatar>
            </div>
          </div>
        </div>
      );
    }

    // Astrology Answer bubble
    return (
      <div
        ref={ref}
        className={`flex flex-wrap self-start ${className} group w-full flex-col`}
        style={{ color: isDarkTheme ? '#E5E7EB' : '#374151' }}
      >
        {message && (
          <div className="flex w-full max-w-full flex-col items-start">
            <div className="my-2 flex flex-row items-center gap-3">
              <Avatar className="h-[34px] w-[34px] text-2xl">
                <div
                  className="flex h-full w-full items-center justify-center rounded-full text-sm font-bold text-white"
                  style={{ backgroundColor: '#10B981' }}
                >
                  🔮
                </div>
              </Avatar>
              <p className="text-base font-semibold">Astrology Insight</p>
              <CopyButton textToCopy={message} />
            </div>
            <div
              className="prose prose-sm sm:prose-base dark:prose-invert mr-5 flex max-w-full flex-col rounded-[28px] px-7 py-[18px]"
              style={{
                backgroundColor: isDarkTheme ? '#374151' : '#F3F4F6',
                borderRadius: '28px',
              }}
            >
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={{
                  h1: ({ children }) => (
                    <h1 className="text-2xl font-bold text-purple-600">
                      {children}
                    </h1>
                  ),
                  h2: ({ children }) => (
                    <h2 className="mt-2 text-xl font-semibold text-indigo-500">
                      {children}
                    </h2>
                  ),
                  h3: ({ children }) => (
                    <h3 className="mt-2 text-lg font-medium text-blue-500">
                      {children}
                    </h3>
                  ),
                  blockquote: ({ children }) => (
                    <blockquote className="border-l-4 border-purple-400 pl-4 text-gray-600 italic">
                      {children}
                    </blockquote>
                  ),
                  ul: ({ children }) => (
                    <ul className="list-disc space-y-1 pl-5">{children}</ul>
                  ),
                  ol: ({ children }) => (
                    <ol className="list-decimal space-y-1 pl-5">{children}</ol>
                  ),
                  table: ({ children }) => (
                    <div className="overflow-x-auto">
                      <table className="table-auto border-collapse border border-gray-300">
                        {children}
                      </table>
                    </div>
                  ),
                  th: ({ children }) => (
                    <th className="border border-gray-300 bg-gray-100 px-3 py-1 text-left">
                      {children}
                    </th>
                  ),
                  td: ({ children }) => (
                    <td className="border border-gray-300 px-3 py-1">{children}</td>
                  ),
                }}
              >
                {message}
              </ReactMarkdown>
            </div>
          </div>
        )}
      </div>
    );
  },
);

const DualAnswerBubble = forwardRef(
  (
    {
      answerA = '',
      answerB = '',
      className = '',
    },
    ref,
  ) => {
    const [selected, setSelected] = useState<'A' | 'B' | null>(null);

    return (
      <div
        ref={ref}
        className={`flex flex-col self-start ${className} group w-full`}
        style={{ color: isDarkTheme ? '#E5E7EB' : '#374151' }}
      >
        <div className="flex flex-row gap-4">
          {/* Answer A */}
          <div className="flex w-full max-w-[50%] flex-col items-start">
            <div className="my-2 flex flex-row items-center gap-3">
              <Avatar className="h-[34px] w-[34px] text-2xl">
                <div
                  className="flex h-full w-full items-center justify-center rounded-full text-sm font-bold text-white"
                  style={{ backgroundColor: '#10B981' }}
                >
                  🔮
                </div>
              </Avatar>
              <p className="text-base font-semibold">Answer A</p>
              <CopyButton textToCopy={answerA} />
            </div>
            <div
              className="prose prose-sm sm:prose-base dark:prose-invert flex max-w-full flex-col rounded-[28px] px-7 py-[18px]"
              style={{
                backgroundColor: isDarkTheme ? '#374151' : '#F3F4F6',
                borderRadius: '28px',
              }}
            >
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={{
                  h1: ({ children }) => (
                    <h1 className="text-2xl font-bold text-purple-600">
                      {children}
                    </h1>
                  ),
                  h2: ({ children }) => (
                    <h2 className="mt-2 text-xl font-semibold text-indigo-500">
                      {children}
                    </h2>
                  ),
                  h3: ({ children }) => (
                    <h3 className="mt-2 text-lg font-medium text-blue-500">
                      {children}
                    </h3>
                  ),
                  blockquote: ({ children }) => (
                    <blockquote className="border-l-4 border-purple-400 pl-4 text-gray-600 italic">
                      {children}
                    </blockquote>
                  ),
                  ul: ({ children }) => (
                    <ul className="list-disc space-y-1 pl-5">{children}</ul>
                  ),
                  ol: ({ children }) => (
                    <ol className="list-decimal space-y-1 pl-5">{children}</ol>
                  ),
                  table: ({ children }) => (
                    <div className="overflow-x-auto">
                      <table className="table-auto border-collapse border border-gray-300">
                        {children}
                      </table>
                    </div>
                  ),
                  th: ({ children }) => (
                    <th className="border border-gray-300 bg-gray-100 px-3 py-1 text-left">
                      {children}
                    </th>
                  ),
                  td: ({ children }) => (
                    <td className="border border-gray-300 px-3 py-1">{children}</td>
                  ),
                }}
              >
                {answerA}
              </ReactMarkdown>
            </div>
          </div>

          {/* Answer B */}
          <div className="flex w-full max-w-[50%] flex-col items-start">
            <div className="my-2 flex flex-row items-center gap-3">
              <Avatar className="h-[34px] w-[34px] text-2xl">
                <div
                  className="flex h-full w-full items-center justify-center rounded-full text-sm font-bold text-white"
                  style={{ backgroundColor: '#10B981' }}
                >
                  🔮
                </div>
              </Avatar>
              <p className="text-base font-semibold">Answer B</p>
              <CopyButton textToCopy={answerB} />
            </div>
            <div
              className="prose prose-sm sm:prose-base dark:prose-invert flex max-w-full flex-col rounded-[28px] px-7 py-[18px]"
              style={{
                backgroundColor: isDarkTheme ? '#374151' : '#F3F4F6',
                borderRadius: '28px',
              }}
            >
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={{
                  h1: ({ children }) => (
                    <h1 className="text-2xl font-bold text-purple-600">
                      {children}
                    </h1>
                  ),
                  h2: ({ children }) => (
                    <h2 className="mt-2 text-xl font-semibold text-indigo-500">
                      {children}
                    </h2>
                  ),
                  h3: ({ children }) => (
                    <h3 className="mt-2 text-lg font-medium text-blue-500">
                      {children}
                    </h3>
                  ),
                  blockquote: ({ children }) => (
                    <blockquote className="border-l-4 border-purple-400 pl-4 text-gray-600 italic">
                      {children}
                    </blockquote>
                  ),
                  ul: ({ children }) => (
                    <ul className="list-disc space-y-1 pl-5">{children}</ul>
                  ),
                  ol: ({ children }) => (
                    <ol className="list-decimal space-y-1 pl-5">{children}</ol>
                  ),
                  table: ({ children }) => (
                    <div className="overflow-x-auto">
                      <table className="table-auto border-collapse border border-gray-300">
                        {children}
                      </table>
                    </div>
                  ),
                  th: ({ children }) => (
                    <th className="border border-gray-300 bg-gray-100 px-3 py-1 text-left">
                      {children}
                    </th>
                  ),
                  td: ({ children }) => (
                    <td className="border border-gray-300 px-3 py-1">{children}</td>
                  ),
                }}
              >
                {answerB}
              </ReactMarkdown>
            </div>
          </div>
        </div>

        <div className="mt-6 flex justify-center">
          <div className="flex flex-col items-center">
            <p className="text-lg font-medium mb-3">Which one do you prefer?</p>
            <div className="flex gap-4">
              <button
                onClick={() => setSelected('A')}
                className={`px-6 py-2 rounded-lg text-white transition-colors ${
                  selected === 'A' ? 'bg-green-600' : 'bg-blue-500 hover:bg-blue-600'
                }`}
              >
                Prefer A
              </button>
              <button
                onClick={() => setSelected('B')}
                className={`px-6 py-2 rounded-lg text-white transition-colors ${
                  selected === 'B' ? 'bg-green-600' : 'bg-blue-500 hover:bg-blue-600'
                }`}
              >
                Prefer B
              </button>
            </div>
            {selected !== null && (
              <p className="mt-3 text-base">You selected Answer {selected} as preferred.</p>
            )}
          </div>
        </div>
      </div>
    );
  },
);

export { ConversationBubble, DualAnswerBubble };

// Updated Demo component to include DualAnswerBubble example
const DualAnswerDemo = () => {
  const [messages] = useState([
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

  // Simulating the boolean trigger; in a real app, this could be a state variable like useState(true)
  const showDualAnswers = true; // Trigger boolean

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
          answerA={`# Mercury Retrograde 🔄

Mercury retrograde can bring challenges in communication and technology. As a Cancer:

- Double-check emails and messages.
- Avoid making big purchases or signing contracts.
- Use this time to **reflect** and **reorganize** your priorities.

> Remember: Retrograde periods are for **reviewing, not rushing**.`}
          answerB={`# Mercury Retrograde Impact 🌌

For Cancers during Mercury retrograde:

- Communication mishaps may arise; be patient.
- Tech glitches possible—back up important data.
- Great period for introspection and revisiting old ideas.

> Tip: Embrace the slowdown to nurture your inner world.`}
          className="mb-4 w-full"
        />
      )}
    </div>
  );
};

export default DualAnswerDemo;