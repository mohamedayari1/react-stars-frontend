import { useCallback, useEffect, useRef, useState } from 'react';

import ArrowDown from '../assets/arrow-down.svg';
import ConversationBubble from '../components/ConversationBubble';
import { DualAnswerBubble } from '../components/DualConversationBubble';
import MessageInput from '../components/MessageInput';

// SCROLLING CONSTANTS: Define thresholds and margins for scroll behavior
const SCROLL_THRESHOLD = 10; // Pixels from bottom to consider "at bottom"
const LAST_BUBBLE_MARGIN = 'mb-32'; // Extra margin for last message to avoid input overlap
const DEFAULT_BUBBLE_MARGIN = 'mb-7'; // Standard spacing between messages
const FIRST_QUESTION_BUBBLE_MARGIN_TOP = 'mt-5'; // Top margin for first message

// Types for our conversation data
interface Query {
  prompt: string;
  response?: string;
  responseB?: string; // Second response for dual mode
  status: 'pending' | 'streaming' | 'completed' | 'error';
  isDual?: boolean; // Flag to indicate if this should render dual responses
  selectedResponse?: string; // Store the user's selected response
  selectedTone?: 'professional' | 'casual'; // Store which tone was selected
}

// Utility function to sanitize markdown content
const sanitizeMarkdownContent = (content: string): string => {
  if (!content || typeof content !== 'string') {
    return '';
  }

  // Remove potential problematic characters or incomplete markdown structures
  let sanitized = content.trim();

  // Handle incomplete code blocks
  const codeBlockCount = (sanitized.match(/```/g) || []).length;
  if (codeBlockCount % 2 !== 0) {
    sanitized += '\n```';
  }

  // Handle incomplete italic/bold markers
  const asteriskCount = (sanitized.match(/\*/g) || []).length;
  if (asteriskCount % 2 !== 0) {
    sanitized += '*';
  }

  // Handle incomplete underscore emphasis
  const underscoreCount = (sanitized.match(/_/g) || []).length;
  if (underscoreCount % 2 !== 0) {
    sanitized += '_';
  }

  // Handle incomplete lists - ensure they end properly
  if (sanitized.endsWith('*') && !sanitized.endsWith('**')) {
    sanitized = sanitized.slice(0, -1);
  }

  // Handle incomplete headers - ensure they have content after #
  const lines = sanitized.split('\n');
  const processedLines = lines.map((line) => {
    if (line.match(/^#+\s*$/)) {
      return line + ' ';
    }
    return line;
  });

  return processedLines.join('\n');
};

export default function DualSSEConversation() {
  // Local state management
  const [queries, setQueries] = useState<Query[]>([]);
  const [status, setStatus] = useState<'idle' | 'loading'>('idle');

  // SCROLLING STATE MANAGEMENT
  const conversationRef = useRef<HTMLDivElement>(null);
  const [hasScrolledToLast, setHasScrolledToLast] = useState(true);
  const [userInterruptedScroll, setUserInterruptedScroll] = useState(false);

  // Debounce timer for reducing re-renders during streaming
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const SERVER_URL = 'http://localhost:3000';

  // SCROLL INTERRUPTION HANDLER
  const handleUserScrollInterruption = useCallback(() => {
    if (!userInterruptedScroll && status === 'loading') {
      setUserInterruptedScroll(true);
    }
  }, [userInterruptedScroll, status]);

  // MAIN SCROLL FUNCTION
  const scrollConversationToBottom = useCallback(() => {
    if (!conversationRef.current || userInterruptedScroll) return;

    requestAnimationFrame(() => {
      if (!conversationRef?.current) return;

      if (status === 'idle' || !queries[queries.length - 1]?.response) {
        conversationRef.current.scrollTo({
          behavior: 'smooth',
          top: conversationRef.current.scrollHeight,
        });
      } else {
        conversationRef.current.scrollTop =
          conversationRef.current.scrollHeight;
      }
    });
  }, [userInterruptedScroll, status, queries]);

  // SCROLL POSITION DETECTOR
  const checkScrollPosition = useCallback(() => {
    const el = conversationRef.current;
    if (!el) return;

    const isAtBottom =
      el.scrollHeight - el.scrollTop - el.clientHeight < SCROLL_THRESHOLD;
    setHasScrolledToLast(isAtBottom);
  }, []);

  // AUTO-SCROLL TRIGGER
  useEffect(() => {
    if (!userInterruptedScroll) {
      scrollConversationToBottom();
    }
  }, [
    queries.length,
    queries[queries.length - 1]?.response,
    queries[queries.length - 1]?.responseB,
    userInterruptedScroll,
    scrollConversationToBottom,
  ]);

  // RESET SCROLL INTERRUPTION
  useEffect(() => {
    if (status === 'idle') {
      setUserInterruptedScroll(false);
    }
  }, [status]);

  // SCROLL EVENT LISTENER SETUP
  useEffect(() => {
    const currentConversationRef = conversationRef.current;
    currentConversationRef?.addEventListener('scroll', checkScrollPosition);

    return () => {
      currentConversationRef?.removeEventListener(
        'scroll',
        checkScrollPosition,
      );
    };
  }, [checkScrollPosition]);

  // Function to fetch tone-specific response via SSE
  const fetchToneResponse = async (
    question: string,
    tone: 'professional' | 'casual',
    queryIndex: number,
    isResponseB: boolean = false,
  ): Promise<void> => {
    console.log(`🎭 Starting ${tone} tone SSE stream for question:`, question);

    try {
      // Use fetch with POST method instead of EventSource
      const response = await fetch(`${SERVER_URL}/gemini-tone`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: question,
          tone: tone,
          numResults: 5,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      if (!response.body) {
        throw new Error('No response body');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let responseText = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            if (data === '[DONE]') {
              console.log(`${tone} tone response completed`);
              return;
            }

            try {
              const parsed = JSON.parse(data);
              if (parsed.parts && parsed.parts[0]?.text) {
                responseText = parsed.parts[0].text;

                // Clear previous debounce timer
                if (debounceTimer.current) {
                  clearTimeout(debounceTimer.current);
                }

                // Debounce the state update to reduce ReactMarkdown re-renders
                debounceTimer.current = setTimeout(() => {
                  try {
                    const sanitizedResponse =
                      sanitizeMarkdownContent(responseText);

                    // Update the appropriate response field based on which tone this is
                    setQueries((prev) =>
                      prev.map((q, idx) => {
                        if (idx === queryIndex) {
                          if (isResponseB) {
                            return { ...q, responseB: sanitizedResponse };
                          } else {
                            return { ...q, response: sanitizedResponse };
                          }
                        }
                        return q;
                      }),
                    );
                  } catch (error) {
                    console.error(
                      `Error processing ${tone} tone markdown:`,
                      error,
                    );
                    // Fallback: set the raw response without sanitization
                    setQueries((prev) =>
                      prev.map((q, idx) => {
                        if (idx === queryIndex) {
                          if (isResponseB) {
                            return { ...q, responseB: responseText };
                          } else {
                            return { ...q, response: responseText };
                          }
                        }
                        return q;
                      }),
                    );
                  }
                }, 100); // 100ms debounce
              }

              // Check if this chunk indicates completion
              if (parsed.isComplete) {
                console.log(`${tone} tone response completed`);
              }
            } catch (e) {
              // Skip invalid JSON
              console.warn('Invalid JSON in SSE stream:', e);
            }
          }
        }
      }
    } catch (error) {
      console.error(`${tone} tone request error:`, error);
      throw error;
    }
  };

  // Function to fetch dual responses in parallel
  const fetchDualAnswerStream = async (
    question: string,
    queryIndex: number,
  ) => {
    console.log(
      '🚀 Starting parallel dual tone SSE streams for question:',
      question,
    );

    setQueries((prev) =>
      prev.map((q, idx) =>
        idx === queryIndex ? { ...q, status: 'streaming', isDual: true } : q,
      ),
    );

    try {
      // Start both tone requests in parallel
      const professionalPromise = fetchToneResponse(
        question,
        'professional',
        queryIndex,
        false,
      );
      const casualPromise = fetchToneResponse(
        question,
        'casual',
        queryIndex,
        true,
      );

      // Wait for both to complete
      await Promise.all([professionalPromise, casualPromise]);

      // Mark as completed when both responses are done
      setQueries((prev) =>
        prev.map((q, idx) =>
          idx === queryIndex ? { ...q, status: 'completed' } : q,
        ),
      );

      console.log('✅ Both tone responses completed successfully');
    } catch (error) {
      console.error('❌ Error in parallel dual streaming:', error);
      setQueries((prev) =>
        prev.map((q, idx) =>
          idx === queryIndex
            ? {
                ...q,
                status: 'error',
                response: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
              }
            : q,
        ),
      );
    }
  };

  // Handle question submission with dual response option
  const handleQuestionSubmission = (
    question: string,
    isDual: boolean = true,
  ) => {
    console.log('�� Question submitted:', question, 'Dual mode:', isDual);

    if (question && status !== 'loading') {
      const trimmedQuestion = question.trim();
      if (trimmedQuestion === '') return;

      const newQuery: Query = {
        prompt: trimmedQuestion,
        status: 'pending',
        isDual,
      };

      setQueries((prev) => [...prev, newQuery]);
      setStatus('loading');

      if (isDual) {
        // Use dual tone streaming
        fetchDualAnswerStream(trimmedQuestion, queries.length);
      } else {
        // Use single professional tone for regular questions
        fetchToneResponse(
          trimmedQuestion,
          'professional',
          queries.length,
          false,
        )
          .then(() => {
            setQueries((prev) =>
              prev.map((q, idx) =>
                idx === queries.length ? { ...q, status: 'completed' } : q,
              ),
            );
          })
          .catch((error) => {
            console.error('Single tone error:', error);
            setQueries((prev) =>
              prev.map((q, idx) =>
                idx === queries.length
                  ? {
                      ...q,
                      status: 'error',
                      response: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
                    }
                  : q,
              ),
            );
          })
          .finally(() => {
            setStatus('idle');
          });
      }

      setStatus('idle');
    }
  };

  // Handle user selection of preferred response
  const handleResponseSelection = (queryIndex: number, choice: 'A' | 'B') => {
    console.log(`🎯 User selected response ${choice} for query ${queryIndex}`);

    setQueries((prev) =>
      prev.map((q, idx) => {
        if (idx === queryIndex) {
          const selectedResponse = choice === 'A' ? q.response : q.responseB;
          const selectedTone = choice === 'A' ? 'professional' : 'casual';

          return {
            ...q,
            selectedResponse: selectedResponse,
            selectedTone: selectedTone,
            isDual: false, // Mark as no longer dual
          };
        }
        return q;
      }),
    );
  };

  // Render function for different query states
  const renderQueryResponse = (query: Query, index: number) => {
    // If user has selected a response, show it using ConversationBubble
    if (query.selectedResponse) {
      return (
        <div
          className={
            index === queries.length - 1
              ? LAST_BUBBLE_MARGIN
              : DEFAULT_BUBBLE_MARGIN
          }
        >
          <ConversationBubble
            type="ANSWER"
            message={query.selectedResponse}
            className="w-full"
          />
        </div>
      );
    }

    // If it's a dual response and both are available, show DualAnswerBubble
    if (query.isDual && query.response && query.responseB) {
      return (
        <div
          className={
            index === queries.length - 1
              ? LAST_BUBBLE_MARGIN
              : DEFAULT_BUBBLE_MARGIN
          }
        >
          <DualAnswerBubble
            answerA={query.response}
            answerB={query.responseB}
            onSelect={(choice) => handleResponseSelection(index, choice)}
            className="w-full"
          />
        </div>
      );
    }

    // If it's a single response, show it using ConversationBubble
    if (query.response) {
      return (
        <div
          className={
            index === queries.length - 1
              ? LAST_BUBBLE_MARGIN
              : DEFAULT_BUBBLE_MARGIN
          }
        >
          <ConversationBubble
            type="ANSWER"
            message={query.response}
            className="w-full"
          />
        </div>
      );
    }

    // If still streaming, show loading state
    if (query.status === 'streaming') {
      return (
        <div
          className={
            index === queries.length - 1
              ? LAST_BUBBLE_MARGIN
              : DEFAULT_BUBBLE_MARGIN
          }
        >
          <div className="flex items-center justify-center">
            <div className="text-gray-500">Generating responses...</div>
          </div>
        </div>
      );
    }

    // If error, show error state
    if (query.status === 'error') {
      return (
        <div
          className={
            index === queries.length - 1
              ? LAST_BUBBLE_MARGIN
              : DEFAULT_BUBBLE_MARGIN
          }
        >
          <div className="flex items-center justify-center">
            <div className="text-red-500">
              Error occurred while generating response
            </div>
          </div>
        </div>
      );
    }

    return null;
  };

  return (
    <div className="flex h-full flex-col justify-end gap-1">
      {/* MAIN CONVERSATION AREA WITH SCROLLING */}
      <div
        ref={conversationRef}
        onWheel={handleUserScrollInterruption}
        onTouchMove={handleUserScrollInterruption}
        className="flex h-full w-full justify-center overflow-y-auto will-change-scroll sm:pt-6 lg:pt-12"
      >
        {/* SCROLL-TO-BOTTOM BUTTON */}
        {queries.length > 0 && !hasScrolledToLast && (
          <button
            onClick={() => {
              setUserInterruptedScroll(false);
              scrollConversationToBottom();
            }}
            aria-label="Scroll to bottom"
            className="border-gray-alpha bg-opacity-50 dark:bg-gunmetal md:bg-opacity-100 fixed right-14 bottom-40 z-10 flex h-7 w-7 items-center justify-center rounded-full border-[0.5px] bg-gray-100 md:h-9 md:w-9"
          >
            <img
              src={ArrowDown}
              alt="arrow down"
              className="h-4 w-4 opacity-50 filter md:h-5 md:w-5 dark:invert"
            />
          </button>
        )}

        {/* MAIN CONTENT CONTAINER */}
        <div className="w-full max-w-[1300px] px-2 md:w-9/12 lg:w-8/12 xl:w-8/12 2xl:w-6/12">
          {queries.map((query, index) => (
            <div key={index}>
              {/* Question */}
              <div
                className={index === 0 ? FIRST_QUESTION_BUBBLE_MARGIN_TOP : ''}
              >
                <ConversationBubble
                  type="QUESTION"
                  message={query.prompt}
                  className="w-full"
                />
              </div>

              {/* Answer(s) */}
              {renderQueryResponse(query, index)}
            </div>
          ))}
        </div>
      </div>

      {/* INPUT AREA */}
      <div className="bg-opacity-0 z-3 flex h-auto w-full max-w-[1300px] flex-col items-end self-center rounded-2xl py-1 md:w-9/12 lg:w-8/12 xl:w-8/12 2xl:w-6/12">
        <div className="flex w-full items-center gap-2 rounded-[40px]">
          <MessageInput
            onSubmit={(question) => handleQuestionSubmission(question, true)}
            loading={status === 'loading'}
          />
        </div>
      </div>
    </div>
  );
}
