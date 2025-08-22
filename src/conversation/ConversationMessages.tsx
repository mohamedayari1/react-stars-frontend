import {
    Fragment,
    ReactNode,
    useCallback,
    useEffect,
    useRef,
    useState,
  } from 'react';
  import { useTranslation } from 'react-i18next';
  
  import ArrowDown from '../assets/arrow-down.svg';
  import RetryIcon from '../components/RetryIcon';
  import Hero from '../Hero';
  import { useDarkTheme } from '../hooks';
  import ConversationBubble from './ConversationBubble';
  import { FEEDBACK, Query, Status } from './conversationModels';
  
  // SCROLLING CONSTANTS: Define thresholds and margins for scroll behavior
  const SCROLL_THRESHOLD = 10; // Pixels from bottom to consider "at bottom"
  const LAST_BUBBLE_MARGIN = 'mb-32'; // Extra margin for last message to avoid input overlap
  const DEFAULT_BUBBLE_MARGIN = 'mb-7'; // Standard spacing between messages
  const FIRST_QUESTION_BUBBLE_MARGIN_TOP = 'mt-5'; // Top margin for first message
  
  type ConversationMessagesProps = {
    handleQuestion: (params: {
      question: string;
      isRetry?: boolean;
      updated?: boolean | null;
      indx?: number;
    }) => void;
    handleQuestionSubmission: (
      updatedQuestion?: string,
      updated?: boolean,
      indx?: number,
    ) => void;
    handleFeedback?: (query: Query, feedback: FEEDBACK, index: number) => void;
    queries: Query[];
    status: Status;
    showHeroOnEmpty?: boolean;
    headerContent?: ReactNode;
  };
  
  export default function ConversationMessages({
    handleQuestion,
    handleQuestionSubmission,
    queries,
    status,
    handleFeedback,
    showHeroOnEmpty = true,
    headerContent,
  }: ConversationMessagesProps) {
    const [isDarkTheme] = useDarkTheme();
    const { t } = useTranslation();
  
    // SCROLLING STATE MANAGEMENT
    const conversationRef = useRef<HTMLDivElement>(null); // Reference to scrollable container
    const [hasScrolledToLast, setHasScrolledToLast] = useState(true); // Track if user is at bottom
    const [userInterruptedScroll, setUserInterruptedScroll] = useState(false); // Prevent auto-scroll when user manually scrolls
  
    // SCROLL INTERRUPTION HANDLER: Detects when user manually scrolls during loading
    const handleUserScrollInterruption = useCallback(() => {
      // Only set interruption flag if currently loading and not already interrupted
      if (!userInterruptedScroll && status === 'loading') {
        setUserInterruptedScroll(true);
      }
    }, [userInterruptedScroll, status]);
  
    // MAIN SCROLL FUNCTION: Auto-scrolls conversation to bottom
    const scrollConversationToBottom = useCallback(() => {
      // Exit if no container ref or user has interrupted scrolling
      if (!conversationRef.current || userInterruptedScroll) return;
  
      // Use requestAnimationFrame for smooth performance
      requestAnimationFrame(() => {
        if (!conversationRef?.current) return;
  
        // SCROLLING STRATEGY:
        // - Smooth scroll when idle or no response yet (better UX)
        // - Instant scroll during active streaming (prevents lag)
        if (status === 'idle' || !queries[queries.length - 1]?.response) {
          conversationRef.current.scrollTo({
            behavior: 'smooth',
            top: conversationRef.current.scrollHeight,
          });
        } else {
          conversationRef.current.scrollTop = conversationRef.current.scrollHeight;
        }
      });
    }, [userInterruptedScroll, status, queries]);
  
    // SCROLL POSITION DETECTOR: Checks if user is near bottom of conversation
    const checkScrollPosition = useCallback(() => {
      const el = conversationRef.current;
      if (!el) return;
      
      // Calculate if user is within threshold distance from bottom
      const isAtBottom = el.scrollHeight - el.scrollTop - el.clientHeight < SCROLL_THRESHOLD;
      setHasScrolledToLast(isAtBottom);
    }, [setHasScrolledToLast]);
  
    // AUTO-SCROLL TRIGGER: Automatically scroll when messages change
    useEffect(() => {
      // Only auto-scroll if user hasn't manually interrupted
      if (!userInterruptedScroll) {
        scrollConversationToBottom();
      }
    }, [
      // Triggers: Any change to these values will cause auto-scroll
      queries.length,                           // New message added
      queries[queries.length - 1]?.response,   // Response content updated
      queries[queries.length - 1]?.error,      // Error occurred
      queries[queries.length - 1]?.thought,    // Thought process updated
      userInterruptedScroll,                   // Interruption state changed
      scrollConversationToBottom,
    ]);
  
    // RESET SCROLL INTERRUPTION: Allow auto-scroll again when conversation becomes idle
    useEffect(() => {
      if (status === 'idle') {
        setUserInterruptedScroll(false);
      }
    }, [status]);
  
    // SCROLL EVENT LISTENER SETUP: Monitor scroll position changes
    useEffect(() => {
      const currentConversationRef = conversationRef.current;
      currentConversationRef?.addEventListener('scroll', checkScrollPosition);
      
      // Cleanup: Remove event listener on component unmount
      return () => {
        currentConversationRef?.removeEventListener('scroll', checkScrollPosition);
      };
    }, [checkScrollPosition]);
  
    // RETRY ICON STYLING: Configure retry button appearance based on theme
    const retryIconProps = {
      width: 12,
      height: 12,
      fill: isDarkTheme ? 'rgb(236 236 241)' : 'rgb(107 114 120)',
      stroke: isDarkTheme ? 'rgb(236 236 241)' : 'rgb(107 114 120)',
      strokeWidth: 10,
    };
  
    // MESSAGE RENDERING LOGIC: Handles response/error/loading states for each query
    const renderResponseView = (query: Query, index: number) => {
      // MARGIN CALCULATION: Last message gets extra margin to avoid input field overlap
      const isLastMessage = index === queries.length - 1;
      const bubbleMargin = isLastMessage ? LAST_BUBBLE_MARGIN : DEFAULT_BUBBLE_MARGIN;
  
      // RESPONSE RENDERING: Show AI response with thought process, sources, tools
      if (query.thought || query.response || query.tool_calls) {
        // STREAMING DETECTION: Check if this message is currently being streamed
        const isCurrentlyStreaming = status === 'loading' && index === queries.length - 1;
        
        return (
          <ConversationBubble
            className={bubbleMargin}
            key={`${index}-ANSWER`}
            message={query.response}
            type={'ANSWER'}
            thought={query.thought}           // AI reasoning process
            sources={query.sources}          // Source documents
            toolCalls={query.tool_calls}     // Tool usage information
            feedback={query.feedback}        // User feedback (thumbs up/down)
            isStreaming={isCurrentlyStreaming} // Enable streaming UI effects
            handleFeedback={
              handleFeedback
                ? (feedback) => handleFeedback(query, feedback, index)
                : undefined
            }
          />
        );
      }
  
      // ERROR RENDERING: Show error message with retry button
      if (query.error) {
        const retryButton = (
          <button
            className="flex items-center justify-center gap-3 self-center rounded-full px-5 py-3 text-lg text-gray-500 transition-colors delay-100 hover:border-gray-500 disabled:cursor-not-allowed dark:text-bright-gray"
            disabled={status === 'loading'}
            onClick={() => {
              const questionToRetry = queries[index].prompt;
              // Retry the failed query at the same index
              handleQuestion({
                question: questionToRetry,
                isRetry: true,
                indx: index,
              });
            }}
            aria-label={t('Retry') || 'Retry'}
          >
            <RetryIcon {...retryIconProps} />
          </button>
        );
        
        return (
          <ConversationBubble
            className={bubbleMargin}
            key={`${index}-ERROR`}
            message={query.error}
            type="ERROR"
            retryBtn={retryButton}
          />
        );
      }
      
      // NO RESPONSE YET: Return null while waiting for response
      return null;
    };
  
    return (
      <div
        ref={conversationRef}
        // SCROLL INTERRUPTION DETECTION: Monitor both wheel and touch events
        onWheel={handleUserScrollInterruption}
        onTouchMove={handleUserScrollInterruption}
        className="flex h-full w-full justify-center overflow-y-auto will-change-scroll sm:pt-6 lg:pt-12"
      >
        {/* SCROLL-TO-BOTTOM BUTTON: Shows when user has scrolled up from bottom */}
        {queries.length > 0 && !hasScrolledToLast && (
          <button
            onClick={() => {
              // Reset interruption and scroll to bottom
              setUserInterruptedScroll(false);
              scrollConversationToBottom();
            }}
            aria-label={t('Scroll to bottom') || 'Scroll to bottom'}
            className="fixed bottom-40 right-14 z-10 flex h-7 w-7 items-center justify-center rounded-full border-[0.5px] border-gray-alpha bg-gray-100 bg-opacity-50 dark:bg-gunmetal md:h-9 md:w-9 md:bg-opacity-100"
          >
            <img
              src={ArrowDown}
              alt="arrow down"
              className="h-4 w-4 opacity-50 filter dark:invert md:h-5 md:w-5"
            />
          </button>
        )}
  
        {/* MAIN CONTENT CONTAINER: Responsive width with max constraints */}
        <div className="w-full max-w-[1300px] px-2 md:w-9/12 lg:w-8/12 xl:w-8/12 2xl:w-6/12">
          {/* HEADER CONTENT: Optional content at top (e.g., agent info) */}
          {headerContent && headerContent}
  
          {/* MESSAGE RENDERING LOGIC */}
          {queries.length > 0 ? (
            // RENDER CONVERSATION: Map through all queries and render question-answer pairs
            queries.map((query, index) => (
              <Fragment key={`${index}-query-fragment`}>
                {/* QUESTION BUBBLE: User's input message */}
                <ConversationBubble
                  // FIRST MESSAGE MARGIN: Add top margin to first question only
                  className={index === 0 ? FIRST_QUESTION_BUBBLE_MARGIN_TOP : ''}
                  key={`${index}-QUESTION`}
                  message={query.prompt}
                  type="QUESTION"
                  handleUpdatedQuestionSubmission={handleQuestionSubmission} // Allow editing questions
                  questionNumber={index}        // For question numbering/indexing
                  sources={query.sources}       // Sources used in question
                  filesAttached={query.attachments} // File attachments
                />
                
                {/* RESPONSE BUBBLE: AI's response (or error/loading state) */}
                {renderResponseView(query, index)}
              </Fragment>
            ))
          ) : showHeroOnEmpty ? (
            // EMPTY STATE: Show hero/welcome screen when no messages
            <Hero handleQuestion={handleQuestion} />
          ) : null}
        </div>
      </div>
    );
  }
















//   import React from 'react';
// import { Query, Status } from './conversationModels';

// interface ConversationMessagesProps {
//   queries: Query[];
//   status: Status;
// }

// const ConversationMessages: React.FC<ConversationMessagesProps> = ({
//   queries,
//   status,
// }) => {
//   return (
//     <div className="flex flex-col gap-4 p-4">
//       {queries.map((query, index) => (
//         <div key={index} className="flex flex-col gap-2">
//           {/* User Message */}
//           <div className="self-end max-w-[80%] bg-blue-500 text-white p-3 rounded-lg">
//             {query.prompt}
//           </div>
          
//           {/* AI Response */}
//           <div className="self-start max-w-[80%] bg-gray-200 p-3 rounded-lg">
//             {query.response && (
//               <div className="whitespace-pre-wrap">{query.response}</div>
//             )}
//             {query.error && (
//               <div className="text-red-500">Error: {query.error}</div>
//             )}
//             {status === 'loading' && index === queries.length - 1 && (
//               <div className="text-gray-500">Typing...</div>
//             )}
//           </div>
//         </div>
//       ))}
//     </div>
//   );
// };

// export default ConversationMessages;