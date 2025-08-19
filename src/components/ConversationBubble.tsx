import React, { forwardRef, useState, useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneLight, vscDarkPlus } from 'react-syntax-highlighter/dist/cjs/styles/prism';
import remarkGfm from 'remark-gfm';

// Hardcoded theme for demo
const isDarkTheme = false;

// Simple Avatar component
const Avatar = ({ children, className }) => (
  <div className={`flex items-center justify-center ${className}`}>
    {children}
  </div>
);

// Copy button component
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
      className="flex items-center justify-center rounded-full p-2 hover:bg-gray-200 dark:hover:bg-gray-600 text-sm"
      title={copied ? 'Copied!' : 'Copy'}
    >
      {copied ? '✓' : '📋'}
    </button>
  );
};

const ConversationBubble = forwardRef(({
  message = '',
  type = 'ANSWER', // 'QUESTION' or 'ANSWER'
  className = '',
}, ref) => {
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
          <div ref={ref} className="flex flex-row-reverse w-full">
            <Avatar className="mt-2 shrink-0 text-2xl">
              <div className="mr-1 rounded-full bg-blue-500 w-8 h-8 flex items-center justify-center text-white font-bold text-sm">
                👤
              </div>
            </Avatar>
            <div className="relative mr-2 flex w-full flex-col">
              <div 
                className="mr-2 ml-2 flex max-w-full items-start gap-2 rounded-[28px] px-5 py-4 text-sm leading-normal break-words whitespace-pre-wrap text-white sm:text-base"
                style={{
                  background: 'linear-gradient(135deg, #8B5CF6 0%, #3B82F6 100%)'
                }}
              >
                <div
                  ref={messageRef}
                  className="w-full"
                  style={{
                    display: '-webkit-box',
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden',
                    WebkitLineClamp: isQuestionCollapsed ? 4 : 'none'
                  }}
                >
                  {message}
                </div>
                {shouldShowToggle && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setIsQuestionCollapsed(!isQuestionCollapsed);
                    }}
                    className="ml-1 rounded-full p-2 hover:bg-white hover:bg-opacity-20 transition-colors"
                  >
                    <span 
                      className={`transform transition-transform duration-200 text-white inline-block ${
                        isQuestionCollapsed ? '' : 'rotate-180'
                      }`}
                    >
                      ⌄
                    </span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // AI Answer bubble
  return (
    <div
      ref={ref}
      className={`flex flex-wrap self-start ${className} group flex-col w-full`}
      style={{ color: isDarkTheme ? '#E5E7EB' : '#374151' }}
    >
      {message && (
        <div className="flex max-w-full flex-col items-start w-full">
          <div className="my-2 flex flex-row items-center gap-3">
            <Avatar className="h-[34px] w-[34px] text-2xl">
              <div 
                className="h-full w-full rounded-full flex items-center justify-center text-white font-bold text-sm"
                style={{ backgroundColor: '#10B981' }}
              >
                🤖
              </div>
            </Avatar>
            <p className="text-base font-semibold">Answer</p>
          </div>
          <div 
            className="mr-5 flex max-w-full rounded-[28px] px-7 py-[18px] flex-col"
            style={{ 
              backgroundColor: isDarkTheme ? '#374151' : '#F3F4F6',
              borderRadius: '28px'
            }}
          >
            <ReactMarkdown
              className="leading-normal break-words whitespace-pre-wrap"
              remarkPlugins={[remarkGfm]}
              components={{
                code({ children, className, ...props }) {
                  const match = /language-(\w+)/.exec(className || '');
                  const language = match ? match[1] : '';
                  return match ? (
                    <SyntaxHighlighter
                      {...props}
                      PreTag="div"
                      language={language}
                      style={isDarkTheme ? vscDarkPlus : oneLight}
                      customStyle={{ margin: 0, borderRadius: '8px' }}
                    >
                      {String(children).replace(/\n$/, '')}
                    </SyntaxHighlighter>
                  ) : (
                    <code className="bg-gray-200 rounded px-1 py-0.5 text-sm">
                      {children}
                    </code>
                  );
                }
              }}
            >
              {message}
            </ReactMarkdown>
          </div>
        </div>
      )}
    </div>
  );
});

// Export both the component and a demo
export { ConversationBubble };

const Demo = () => {
  const [messages] = useState([
    {
      type: 'QUESTION',
      message: 'Can you explain React hooks with some code examples?'
    },
    {
      type: 'ANSWER',
      message: `# React Hooks

React hooks are functions that let you use state and other React features in functional components.

## Example: useState

\`\`\`javascript
import React, { useState } from 'react';

function Counter() {
  const [count, setCount] = useState(0);
  return (
    <div>
      <p>You clicked {count} times</p>
      <button onClick={() => setCount(count + 1)}>Click me</button>
    </div>
  );
}
\`\`\`

- Simpler code
- Reusable logic
- No need for class components`
    }
  ]);

  return (
    <div className="w-full max-w-4xl mx-auto p-4 space-y-4">
      <h1 className="text-2xl font-bold text-center">Conversation Demo</h1>
      {messages.map((msg, index) => (
        <ConversationBubble
          key={index}
          type={msg.type}
          message={msg.message}
          className="w-full mb-4"
        />
      ))}
    </div>
  );
};

export default Demo;
