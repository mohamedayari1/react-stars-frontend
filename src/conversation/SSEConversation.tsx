import { useCallback, useRef, useState } from 'react';

import { createSSEClient } from '../api/client';
import MessageInput from '../components/MessageInput';
import ConversationMessages from './ConversationMessages';

// Types for our conversation data
interface Query {
  prompt: string;
  response?: string;
  status: 'pending' | 'streaming' | 'completed' | 'error';
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
    // If we have an odd number of code block markers, add a closing one
    sanitized += '\n```';
  }

  // Handle incomplete italic/bold markers
  const asteriskCount = (sanitized.match(/\*/g) || []).length;
  if (asteriskCount % 2 !== 0) {
    // If we have an odd number of asterisks, add a closing one
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
      // Header with no content, add placeholder
      return line + ' ';
    }
    return line;
  });

  return processedLines.join('\n');
};

export default function SSEConversation() {
  // Local state management (instead of Redux)
  const [queries, setQueries] = useState<Query[]>([]);
  const [status, setStatus] = useState<'idle' | 'loading'>('idle');

  // Create SSE client instance - useRef ensures it persists across renders
  const sseClient = useRef(createSSEClient());

  // Debounce mechanism to reduce re-renders during streaming
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Real SSE streaming function that receives chunks from the server
  const fetchAnswerStream = async (question: string, queryIndex: number) => {
    console.log('Starting real SSE stream for question:', question);

    // Update status to streaming
    setQueries((prev) =>
      prev.map((q, idx) =>
        idx === queryIndex ? { ...q, status: 'streaming' } : q,
      ),
    );

    try {
      await sseClient.current.streamChat(
        question,
        // onChunk callback - receives each streaming chunk
        (chunk) => {
          console.log('Received chunk:', chunk);
          if (chunk.parts && chunk.parts[0]?.text) {
            // The server sends the complete response so far in each chunk
            const completeResponseSoFar = chunk.parts[0].text;
            console.log('Complete response so far:', completeResponseSoFar);

            // Clear previous debounce timer
            if (debounceTimer.current) {
              clearTimeout(debounceTimer.current);
            }

            // Debounce the state update to reduce ReactMarkdown re-renders
            debounceTimer.current = setTimeout(() => {
              try {
                // Validate markdown content before updating state
                const sanitizedResponse = sanitizeMarkdownContent(
                  completeResponseSoFar,
                );

                // Update the query with the complete response received so far
                setQueries((prev) =>
                  prev.map((q, idx) =>
                    idx === queryIndex
                      ? { ...q, response: sanitizedResponse || '' }
                      : q,
                  ),
                );
              } catch (error) {
                console.error('Error processing markdown chunk:', error);
                // Fallback: set the raw response without sanitization
                setQueries((prev) =>
                  prev.map((q, idx) =>
                    idx === queryIndex
                      ? { ...q, response: completeResponseSoFar || '' }
                      : q,
                  ),
                );
              }
            }, 100); // 100ms debounce
          } else {
            console.warn('Invalid chunk received:', chunk);
          }
        },
        // onComplete callback - called when streaming finishes
        () => {
          // Clear any pending debounced updates
          if (debounceTimer.current) {
            clearTimeout(debounceTimer.current);
            debounceTimer.current = null;
          }

          // Mark as completed
          setQueries((prev) =>
            prev.map((q, idx) =>
              idx === queryIndex ? { ...q, status: 'completed' } : q,
            ),
          );
          console.log('Real SSE streaming completed for question:', question);
        },
        // onError callback - handles any streaming errors
        (error) => {
          console.error('SSE error:', error);
          setQueries((prev) =>
            prev.map((q, idx) =>
              idx === queryIndex
                ? {
                    ...q,
                    status: 'error',
                    response: `Error: ${error}`,
                  }
                : q,
            ),
          );
        },
      );
    } catch (error) {
      console.error('Error in fetchAnswerStream:', error);
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

  // Handle fetching answer - coordinates the streaming process
  const handleFetchAnswer = useCallback(
    async ({ question, index }: { question: string; index?: number }) => {
      try {
        setStatus('loading');

        // Find the query index
        const queryIndex = index !== undefined ? index : queries.length - 1;

        // Start the streaming process
        await fetchAnswerStream(question, queryIndex);

        setStatus('idle');
      } catch (error) {
        console.error('Error fetching answer:', error);

        // Mark query as error
        const queryIndex = index !== undefined ? index : queries.length - 1;
        setQueries((prev) =>
          prev.map((q, idx) =>
            idx === queryIndex ? { ...q, status: 'error' } : q,
          ),
        );

        setStatus('idle');
      }
    },
    [queries.length], // Dependency on queries length
  );

  // Handle question submission - manages the question flow
  const handleQuestion = useCallback(
    async ({ question }: { question: string }) => {
      const trimmedQuestion = question.trim();
      if (trimmedQuestion === '') return;

      // Add new query to local state with pending status
      const newQuery: Query = {
        prompt: trimmedQuestion,
        status: 'pending',
      };

      setQueries((prev) => [...prev, newQuery]);

      // Fetch answer for the question with the correct index
      await handleFetchAnswer({
        question: trimmedQuestion,
        index: queries.length,
      });
    },
    [handleFetchAnswer, queries.length], // Dependencies
  );

  // Main submission handler - entry point for user submissions
  const handleQuestionSubmission = (question: string) => {
    console.log('Question submitted:', question);

    // Flow: handleQuestionSubmission → handleQuestion → handleFetchAnswer → fetchAnswerStream

    if (question && status !== 'loading') {
      // Simple new question submission
      handleQuestion({ question });
    } else {
      console.log('Cannot submit: question empty or already loading');
    }
  };

  return (
    <div className="flex h-full flex-col justify-end gap-1">
      <div className="flex-1 overflow-y-auto">
        <ConversationMessages queries={queries} status={status} />
      </div>
      <div className="bg-opacity-0 z-3 flex h-auto w-full max-w-[1300px] flex-col items-end self-center rounded-2xl py-1 md:w-9/12 lg:w-8/12 xl:w-8/12 2xl:w-6/12">
        <div className="flex w-full items-center rounded-[40px]">
          <MessageInput
            onSubmit={handleQuestionSubmission}
            loading={status === 'loading'}
          />
        </div>
      </div>
    </div>
  );
}
