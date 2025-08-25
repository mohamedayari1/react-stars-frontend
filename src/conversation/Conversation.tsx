import { useCallback, useRef, useState } from 'react';

import MessageInput from '../components/MessageInput';
import SimpleConversationMessages from './SimpleConversationMessages';
import ConversationMessages from './ConversationMessages';

// Types for our conversation data
interface Query {
  prompt: string;
  response?: string;
  status: 'pending' | 'streaming' | 'completed' | 'error';
}

export default function Conversation() {
  // Local state management (instead of Redux)
  const [queries, setQueries] = useState<Query[]>([]);
  const [status, setStatus] = useState<'idle' | 'loading'>('idle');

  // Ref for managing streaming
  const fetchStream = useRef<any>(null);

  // Mock streaming function that simulates receiving chunks of markdown data
  const fetchAnswerStream = async (question: string, queryIndex: number) => {
    console.log('Starting mock stream for question:', question);

    // Simulate streaming markdown response with chunks
    const mockMarkdownResponse = `# Response to: "${question}"



# ✨ The Mystical World of Astrology ✨

## What is Astrology?

Astrology is an ancient **belief system** that suggests there's a relationship between astronomical phenomena and events in the human world. It's been practiced for thousands of years across different cultures and civilizations.

### The Twelve Zodiac Signs 🌟

1. **Aries** (March 21 - April 19) - The Ram 🐏
2. **Taurus** (April 20 - May 20) - The Bull 🐂  
3. **Gemini** (May 21 - June 20) - The Twins 👯
4. **Cancer** (June 21 - July 22) - The Crab 🦀
5. **Leo** (July 23 - August 22) - The Lion 🦁
6. **Virgo** (August 23 - September 22) - The Virgin 👸
7. **Libra** (September 23 - October 22) - The Scales ⚖️
8. **Scorpio** (October 23 - November 21) - The Scorpion 🦂
9. **Sagittarius** (November 22 - December 21) - The Archer 🏹
10. **Capricorn** (December 22 - January 19) - The Goat 🐐
11. **Aquarius** (January 20 - February 18) - The Water Bearer 🏺
12. **Pisces** (February 19 - March 20) - The Fish 🐟


*Streaming completed successfully!*`;

    const chunks = mockMarkdownResponse.split(/(?<=[.!?])\s+/); // Split by sentences
    let currentResponse = '';

    // Update status to streaming
    setQueries((prev) =>
      prev.map((q, idx) =>
        idx === queryIndex ? { ...q, status: 'streaming' } : q,
      ),
    );

    // Simulate streaming markdown chunks every 150ms
    for (let i = 0; i < chunks.length; i++) {
      await new Promise((resolve) => setTimeout(resolve, 150)); // 150ms delay between chunks

      currentResponse += (i === 0 ? '' : ' ') + chunks[i];

      // Update the query with the current streaming markdown response
      setQueries((prev) =>
        prev.map((q, idx) =>
          idx === queryIndex ? { ...q, response: currentResponse } : q,
        ),
      );
    }

    // Mark as completed
    setQueries((prev) =>
      prev.map((q, idx) =>
        idx === queryIndex ? { ...q, status: 'completed' } : q,
      ),
    );

    console.log('Mock markdown streaming completed for question:', question);
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
      {/* <DualDemo /> */}
      <div className="flex-1 overflow-y-auto">
        {/* <SimpleConversationMessages 
          queries={queries} 
          status={status} 
        /> */}
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
