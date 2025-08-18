import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useDispatch, useSelector } from 'react-redux';

// import { AppDispatch } from '../store';
// import ConversationMessages from './ConversationMessages';
// import { FEEDBACK, Query } from './conversationModels';
// import {
//   addQuery,
//   fetchAnswer,
//   selectQueries,
//   selectStatus,
//   updateQuery,
// } from './conversationSlice';

export default function Conversation() {
  // const { t } = useTranslation();
  // const dispatch = useDispatch<AppDispatch>();

  // const queries = useSelector(selectQueries);
  // const status = useSelector(selectStatus);

  // const [lastQueryReturnedErr, setLastQueryReturnedErr] =
  //   useState<boolean>(false);

  // const handleFetchAnswer = useCallback(
  //   ({ question }: { question: string }) => {
  //     dispatch(fetchAnswer({ question }));
  //   },
  //   [dispatch],
  // );

  // const handleQuestion = useCallback(
  //   ({ question }: { question: string }) => {
  //     const trimmedQuestion = question.trim();
  //     if (trimmedQuestion === '') return;

  //     dispatch(addQuery({ prompt: trimmedQuestion, attachments: [] }));
  //     handleFetchAnswer({ question: trimmedQuestion });
  //   },
  //   [dispatch, handleFetchAnswer],
  // );

  // const handleFeedback = (query: Query, feedback: FEEDBACK, index: number) => {
  //   dispatch(updateQuery({ index, query: { feedback } }));
  // };

  // const handleQuestionSubmission = (question?: string) => {
  //   if (question && status !== 'loading') {
  //     if (lastQueryReturnedErr) {
  //       dispatch(
  //         updateQuery({
  //           index: queries.length - 1,
  //           query: { prompt: question },
  //         }),
  //       );
  //       handleQuestion({ question: queries[queries.length - 1].prompt });
  //     } else {
  //       handleQuestion({ question });
  //     }
  //   }
  // };

  // useEffect(() => {
  //   if (queries.length) {
  //     queries[queries.length - 1].error && setLastQueryReturnedErr(true);
  //     queries[queries.length - 1].response && setLastQueryReturnedErr(false);
  //   }
  // }, [queries[queries.length - 1]]);

  return (
    <div className="flex h-full flex-col justify-end gap-1">
      {/* <ConversationMessages
        handleQuestion={handleQuestion}
        handleQuestionSubmission={handleQuestionSubmission}
        handleFeedback={handleFeedback}
        queries={queries}
        status={status}
        showHeroOnEmpty={true}
      /> */}
      ConversationMessages

      <div className="bg-opacity-0 z-3 flex h-auto w-full max-w-[1300px] flex-col items-end self-center rounded-2xl py-1 md:w-9/12 lg:w-8/12 xl:w-8/12 2xl:w-6/12">
        <div className="flex w-full items-center rounded-[40px]">
          {/* <MessageInput
            onSubmit={(text) => {
              handleQuestionSubmission(text);
            }}
            loading={status === 'loading'}
            showSourceButton={true}
            showToolButton={true}
          /> */}
          MessageInput
        </div>
      </div>
    </div>
  );
}
