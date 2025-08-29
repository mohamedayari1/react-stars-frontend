import { useRef, useState } from 'react';

import { createSSEClient } from '../api/client';
import { DualAnswerBubble } from '../components/DualConversationBubble';
import MessageInput from '../components/MessageInput';

// Types for our conversation data
interface Query {
  prompt: string;
  response?: string;
  responseB?: string; // Second response for dual mode
  status: 'pending' | 'streaming' | 'completed' | 'error';
  isDual?: boolean; // Flag to indicate if this should render dual responses
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

  // Create SSE client instance
  const sseClient = useRef(createSSEClient());
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Function to fetch dual responses (you can modify this to call your dual endpoint)
  const fetchDualAnswerStream = async (
    question: string,
    queryIndex: number,
  ) => {
    console.log('Starting dual SSE stream for question:', question);

    setQueries((prev) =>
      prev.map((q, idx) =>
        idx === queryIndex ? { ...q, status: 'streaming', isDual: true } : q,
      ),
    );

    try {
      // You can modify this to call a different endpoint for dual responses
      // For now, we'll simulate by calling the same endpoint twice
      let responseA = '';
      let responseB = '';

      // First call for response A
      await sseClient.current.streamChat(
        question + ' (Version A)',
        (chunk) => {
          if (chunk.parts && chunk.parts[0]?.text) {
            responseA = chunk.parts[0].text;

            if (debounceTimer.current) {
              clearTimeout(debounceTimer.current);
            }

            debounceTimer.current = setTimeout(() => {
              try {
                const sanitizedA = sanitizeMarkdownContent(responseA);
                setQueries((prev) =>
                  prev.map((q, idx) =>
                    idx === queryIndex ? { ...q, response: sanitizedA } : q,
                  ),
                );
              } catch (error) {
                console.error('Error processing markdown chunk A:', error);
                setQueries((prev) =>
                  prev.map((q, idx) =>
                    idx === queryIndex ? { ...q, response: responseA } : q,
                  ),
                );
              }
            }, 100);
          }
        },
        () => {
          console.log('Response A completed');
          // Start response B after A completes
          startResponseB();
        },
        (error) => {
          console.error('SSE error for response A:', error);
          setQueries((prev) =>
            prev.map((q, idx) =>
              idx === queryIndex
                ? { ...q, status: 'error', response: `Error A: ${error}` }
                : q,
            ),
          );
        },
      );

      const startResponseB = async () => {
        await sseClient.current.streamChat(
          question + ' (Version B)',
          (chunk) => {
            if (chunk.parts && chunk.parts[0]?.text) {
              responseB = chunk.parts[0].text;

              if (debounceTimer.current) {
                clearTimeout(debounceTimer.current);
              }

              debounceTimer.current = setTimeout(() => {
                try {
                  const sanitizedB = sanitizeMarkdownContent(responseB);
                  setQueries((prev) =>
                    prev.map((q, idx) =>
                      idx === queryIndex ? { ...q, responseB: sanitizedB } : q,
                    ),
                  );
                } catch (error) {
                  console.error('Error processing markdown chunk B:', error);
                  setQueries((prev) =>
                    prev.map((q, idx) =>
                      idx === queryIndex ? { ...q, responseB: responseB } : q,
                    ),
                  );
                }
              }, 100);
            }
          },
          () => {
            console.log('Both responses completed');
            setQueries((prev) =>
              prev.map((q, idx) =>
                idx === queryIndex ? { ...q, status: 'completed' } : q,
              ),
            );
          },
          (error) => {
            console.error('SSE error for response B:', error);
            setQueries((prev) =>
              prev.map((q, idx) =>
                idx === queryIndex
                  ? { ...q, status: 'error', responseB: `Error B: ${error}` }
                  : q,
              ),
            );
          },
        );
      };
    } catch (error) {
      console.error('Error in fetchDualAnswerStream:', error);
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
    isDual: boolean = false,
  ) => {
    console.log('Question submitted:', question, 'Dual mode:', isDual);

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
        fetchDualAnswerStream(trimmedQuestion, queries.length);
      } else {
        // Use regular single response logic here
        // You can implement this similar to your existing SSEConversation
      }
    }
  };

  // Handle user selection of preferred response
  const handleResponseSelection = (queryIndex: number, choice: 'A' | 'B') => {
    setQueries((prev) =>
      prev.map((q, idx) => {
        if (idx === queryIndex) {
          const selectedResponse = choice === 'A' ? q.response : q.responseB;
          return {
            ...q,
            response: selectedResponse,
            responseB: undefined,
            isDual: false,
          };
        }
        return q;
      }),
    );
  };

  return (
    <div className="flex h-full flex-col justify-end gap-1">
      <div className="flex-1 overflow-y-auto">
        {queries.map((query, index) => (
          <div key={index}>
            {/* Question */}
            <div className="mb-4">
              <div className="flex w-full justify-end gap-2">
                <div className="relative flex max-w-[70%] flex-col">
                  <div className="flex items-end gap-2 rounded-[28px] bg-gradient-to-r from-purple-500 to-blue-500 px-5 py-4 text-sm leading-normal break-words whitespace-pre-wrap text-white sm:text-base">
                    {query.prompt}
                  </div>
                </div>
              </div>
            </div>

            {/* Answer(s) */}
            {query.isDual && query.response && query.responseB ? (
              <DualAnswerBubble
                answerA={query.response}
                answerB={query.responseB}
                onSelect={(choice) => handleResponseSelection(index, choice)}
                className="mb-7"
              />
            ) : query.response ? (
              <div className="mb-7">
                {/* Single response rendering */}
                <div>Response: {query.response}</div>
              </div>
            ) : null}
          </div>
        ))}
      </div>

      <div className="bg-opacity-0 z-3 flex h-auto w-full max-w-[1300px] flex-col items-end self-center rounded-2xl py-1 md:w-9/12 lg:w-8/12 xl:w-8/12 2xl:w-6/12">
        <div className="flex w-full items-center gap-2 rounded-[40px]">
          <MessageInput
            onSubmit={(question) => handleQuestionSubmission(question, false)}
            loading={status === 'loading'}
          />
          <button
            onClick={() => {
              const question = prompt(
                'Enter your question for dual responses:',
              );
              if (question) handleQuestionSubmission(question, true);
            }}
            className="rounded-full bg-purple-500 px-4 py-2 text-white hover:bg-purple-600"
          >
            Dual
          </button>
        </div>
      </div>
    </div>
  );
}
