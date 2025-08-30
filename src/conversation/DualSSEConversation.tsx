import { useRef, useState } from 'react';

import { DualAnswerBubble } from '../components/DualConversationBubble';
import ConversationBubble from '../components/ConversationBubble';
import MessageInput from '../components/MessageInput';

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

  // Debounce timer for reducing re-renders during streaming
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const SERVER_URL = 'http://localhost:3000';

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
        <div className="mb-7">
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
        <DualAnswerBubble
          answerA={query.response}
          answerB={query.responseB}
          onSelect={(choice) => handleResponseSelection(index, choice)}
          className="mb-7"
        />
      );
    }

    // If it's a single response, show it using ConversationBubble
    if (query.response) {
      return (
        <div className="mb-7">
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
        <div className="mb-7">
          <div className="flex items-center justify-center">
            <div className="text-gray-500">Generating responses...</div>
          </div>
        </div>
      );
    }

    // If error, show error state
    if (query.status === 'error') {
      return (
        <div className="mb-7">
          <div className="flex items-center justify-center">
            <div className="text-red-500">Error occurred while generating response</div>
          </div>
        </div>
      );
    }

    return null;
  };

  return (
    <div className="flex h-full flex-col justify-end gap-1">
      <div className="flex-1 overflow-y-auto">
        {queries.map((query, index) => (
          <div key={index}>
            {/* Question */}
            <div className="mb-4">
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

      <div className="bg-opacity-0 z-3 flex h-auto w-full max-w-[1300px] flex-col items-end self-center rounded-2xl py-1 md:w-9/12 lg:w-8/12 xl:w-8/12 2xl:w-6/12">
        <div className="flex w-full items-center gap-2 rounded-[40px]">
          <MessageInput
            onSubmit={(question) => handleQuestionSubmission(question, true)}
            loading={status === 'loading'}
          />
          <button
            onClick={() => {
              const question = prompt(
                'Enter your question for dual tone responses:',
              );
              if (question) handleQuestionSubmission(question, true);
            }}
            className="rounded-full bg-purple-500 px-4 py-2 text-white transition-colors hover:bg-purple-600"
            title="Get both professional and casual responses"
          >
            🎭 Dual Tone
          </button>
        </div>
      </div>
    </div>
  );
}