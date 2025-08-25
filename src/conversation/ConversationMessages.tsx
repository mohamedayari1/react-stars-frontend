import { Fragment, useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';

import ArrowDown from '../assets/arrow-down.svg';
import ConversationBubble from '../components/ConversationBubble';

// SCROLLING CONSTANTS: Define thresholds and margins for scroll behavior
const SCROLL_THRESHOLD = 10; // Pixels from bottom to consider "at bottom"
const LAST_BUBBLE_MARGIN = 'mb-32'; // Extra margin for last message to avoid input overlap
const DEFAULT_BUBBLE_MARGIN = 'mb-7'; // Standard spacing between messages
const FIRST_QUESTION_BUBBLE_MARGIN_TOP = 'mt-5'; // Top margin for first message

interface Query {
  prompt: string;
  response?: string;
  status: 'pending' | 'streaming' | 'completed' | 'error';
}

interface ConversationMessagesProps {
  queries: Query[];
  status: 'idle' | 'loading';
  showHeroOnEmpty?: boolean;
}

export default function ConversationMessages({
  queries,
  status,
  showHeroOnEmpty = false,
}: ConversationMessagesProps) {
  const { t } = useTranslation();

  // SCROLLING STATE MANAGEMENT
  const conversationRef = useRef<HTMLDivElement>(null);
  const [hasScrolledToLast, setHasScrolledToLast] = useState(true);
  const [userInterruptedScroll, setUserInterruptedScroll] = useState(false);

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

  return (
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
          aria-label={t('Scroll to bottom') || 'Scroll to bottom'}
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
        {/* MESSAGE RENDERING LOGIC */}
        {queries.length > 0 ? (
          queries.map((query, index) => {
            const isLastMessage = index === queries.length - 1;
            const isCurrentlyStreaming = status === 'loading' && isLastMessage;

            return (
              <Fragment key={`${index}-query-fragment`}>
                {/* QUESTION BUBBLE */}
                <ConversationBubble
                  message={query.prompt}
                  type="QUESTION"
                  className={index === 0 ? FIRST_QUESTION_BUBBLE_MARGIN_TOP : ''}
                />

                {/* ANSWER BUBBLE - Show if response exists OR if currently streaming */}
                {(query.response || isCurrentlyStreaming) && (
                  <ConversationBubble
                    message={query.response || ''}
                    type="ANSWER"
                    className={isLastMessage ? LAST_BUBBLE_MARGIN : DEFAULT_BUBBLE_MARGIN}
                  />
                )}
              </Fragment>
            );
          })
        ) : showHeroOnEmpty ? (
          // EMPTY STATE: Show hero/welcome screen when no messages
          <div className="flex items-center justify-center h-full">
            <p className="text-gray-500">Welcome! Ask me anything...</p>
          </div>
        ) : null}
      </div>
    </div>
  );
}