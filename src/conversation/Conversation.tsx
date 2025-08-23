import { useCallback, useRef, useState } from 'react';
import DualDemo from '../components/DualConversationBubble';
import MessageInput from '../components/MessageInput';

export default function Conversation() {
  // Local state instead of Redux
  const [queries, setQueries] = useState<
    Array<{ prompt: string; response?: string }>
  >([]);
  const [status, setStatus] = useState<'idle' | 'loading' | 'error'>('idle');

  // Ref for managing streaming
  const fetchStream = useRef<any>(null);

  // Simple test function
  const testInputTextComponent = (text: string) => {
    console.log('ta3mlo kachta barcha marat fi hal text:', text);
  };

  // Fetch answer stream function
  const fetchAnswerStream = async (question: string) => {
    console.log(
      'here we call handleFetchAnswerSteaming to get the answer stream chunks',
    );
    // Your streaming logic here
  };

  // Handle fetching answer - simplified without Redux
  const handleFetchAnswer = useCallback(
    async ({ question, index }: { question: string; index?: number }) => {
      try {
        setStatus('loading');
        await fetchAnswerStream(question);
        setStatus('idle');
      } catch (error) {
        setStatus('error');
        console.error('Error fetching answer:', error);
      }
    },
    [], // No dependencies needed
  );

  // Handle question submission - simplified without Redux
  const handleQuestion = useCallback(
    async ({ question }: { question: string }) => {
      const trimmedQuestion = question.trim();
      if (trimmedQuestion === '') return;

      // Add new query to local state
      const newQuery = { prompt: trimmedQuestion };
      setQueries((prev) => [...prev, newQuery]);

      // Fetch answer for the question
      await handleFetchAnswer({ question: trimmedQuestion });
    },
    [handleFetchAnswer], // Only depends on handleFetchAnswer
  );

  // Main submission handler
  const handleQuestionSubmission = (question: string) => {
    // Flow: handleQuestionSubmission → handleQuestion → handleFetchAnswer → fetchAnswerStream

    if (question && status !== 'loading') {
      // Simple new question submission
      handleQuestion({ question });
    }
  };

  return (
    <div className="flex h-full flex-col justify-end gap-1">
      <DualDemo />

      <div className="bg-opacity-0 z-3 flex h-auto w-full max-w-[1300px] flex-col items-end self-center rounded-2xl py-1 md:w-9/12 lg:w-8/12 xl:w-8/12 2xl:w-6/12">
        <div className="flex w-full items-center rounded-[40px]">
          <MessageInput
            onSubmit={(text) => {
              testInputTextComponent(text);
              // You can also call the main submission handler here
              // handleQuestionSubmission(text);
            }}
            loading={status === 'loading'}
          />
        </div>
      </div>
    </div>
  );
}
