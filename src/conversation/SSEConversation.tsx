import { useCallback, useRef, useState } from 'react';

import MessageInput from '../components/MessageInput';
import ConversationMessages from './ConversationMessages';
import { createSSEClient } from '../api/client';

// Types for our conversation data
interface Query {
  prompt: string;
  response?: string;
  status: 'pending' | 'streaming' | 'completed' | 'error';
}

export default function SSEConversation() {
  // Local state management (instead of Redux)
  const [queries, setQueries] = useState<Query[]>([]);
  const [status, setStatus] = useState<'idle' | 'loading'>('idle');

  // Create SSE client instance - useRef ensures it persists across renders
  const sseClient = useRef(createSSEClient());

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
          if (chunk.parts && chunk.parts[0]?.text) {
            // FIXED: Use the chunk text directly, not overwrite currentResponse
            const chunkText = chunk.parts[0].text;
            
            // Update the query with the current chunk text
            setQueries((prev) =>
              prev.map((q, idx) =>
                idx === queryIndex ? { ...q, response: chunkText } : q,
              ),
            );
          }
        },
        // onComplete callback - called when streaming finishes
        () => {
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

      // Fetch answer for the question
      await handleFetchAnswer({ question: trimmedQuestion });
    },
    [handleFetchAnswer], // Dependency on handleFetchAnswer
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
            onSubmit={handleQuestionSubmission} // Final function passed as onSubmit
            loading={status === 'loading'}
          />
        </div>
      </div>
    </div>
  );
}