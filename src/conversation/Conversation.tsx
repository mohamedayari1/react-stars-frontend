import DualDemo from '../components/DualConversationBubble';
import MessageInput from '../components/MessageInput';

export default function Conversation() {
  const fetchAnswerStream = async (question: string) => {
    console.log("here we call handleFetchAnswerSteaming to get the answer stream chunks");
  };

  const handleQuestionSubmission = (question: string) => {
    // we use here handleQuestion(Conversation , useCallback)
    // ---> handleFetchAnswer(Conversation , useCallback)
    // ---> fetchAnswerStream (conversationSlice)
    // ---> handleFetchAnswerSteaming (conversationHandlers)    (Each chunk updates Redux store via updateStreamingQuery)
    // ---> conversationService (conversationService api calls)

    console.log(question);
  };

  return (
    <div className="flex h-full flex-col justify-end gap-1">
      <DualDemo />

      <div className="bg-opacity-0 z-3 flex h-auto w-full max-w-[1300px] flex-col items-end self-center rounded-2xl py-1 md:w-9/12 lg:w-8/12 xl:w-8/12 2xl:w-6/12">
        <div className="flex w-full items-center rounded-[40px]">
          <MessageInput />
        </div>
      </div>
    </div>
  );
}

// import { useCallback, useRef } from 'react';
// import { useDispatch, useSelector } from 'react-redux';

// import MessageInput from '../components/MessageInput';
// import { AppDispatch } from '../store';
// import ConversationMessages from './ConversationMessages';
// import {
//   addQuery,
//   fetchAnswerStream,
//   selectQueries,
//   selectStatus,
// } from './conversationSlice';

// export default function Conversation() {
//   const dispatch = useDispatch<AppDispatch>();

//   const queries = useSelector(selectQueries);
//   const status = useSelector(selectStatus);

//   const fetchStream = useRef<any>(null);

//   // Step 3: handleFetchAnswer - dispatches Redux thunk
//   const handleFetchAnswer = useCallback(
//     ({ question }: { question: string }) => {
//       fetchStream.current = dispatch(fetchAnswerStream({ question }));
//     },
//     [dispatch],
//   );

//   // Step 2: handleQuestion - adds query and calls fetch
//   const handleQuestion = useCallback(
//     ({ question }: { question: string }) => {
//       const trimmedQuestion = question.trim();
//       if (trimmedQuestion === '') return;

//       // Add user query to Redux store
//       dispatch(
//         addQuery({
//           prompt: trimmedQuestion,
//           response: '',
//           sources: [],
//           thought: '',
//           error: undefined,
//         }),
//       );

//       // Fetch the streaming answer
//       handleFetchAnswer({ question: trimmedQuestion });
//     },
//     [dispatch, handleFetchAnswer],
//   );

//   // Step 1: handleQuestionSubmission - entry point
//   const handleQuestionSubmission = (question: string) => {
//     if (question && status !== 'loading') {
//       handleQuestion({ question });
//     }
//   };

//   return (
//     <div className="flex h-full flex-col justify-end gap-1">
//       <ConversationMessages
//         queries={queries}
//         status={status}
//       />

//       <div className="bg-opacity-0 z-3 flex h-auto w-full max-w-[1300px] flex-col items-end self-center rounded-2xl py-1 md:w-9/12 lg:w-8/12 xl:w-8/12 2xl:w-6/12">
//         <div className="flex w-full items-center rounded-[40px]">
//           <MessageInput
//             onSubmit={handleQuestionSubmission}
//             loading={status === 'loading'}
//           />
//         </div>
//       </div>
//     </div>
//   );
// }
