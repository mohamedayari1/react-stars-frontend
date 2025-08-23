import { Fragment } from 'react';
import ConversationBubble from '../components/ConversationBubble';
interface Query {
  prompt: string;
  response?: string;
  status: 'pending' | 'streaming' | 'completed' | 'error';
}

interface SimpleConversationMessagesProps {
  queries: Query[];
  status: 'idle' | 'loading';
}

export default function SimpleConversationMessages({
  queries,
  status,
}: SimpleConversationMessagesProps) {
  return (
    <div className="flex flex-col w-full max-w-4xl mx-auto px-4 space-y-4">
      {queries.map((query, index) => {
        const isLastMessage = index === queries.length - 1;
        const isCurrentlyStreaming = status === 'loading' && isLastMessage;

        return (
          <Fragment key={index}>
            {/* Question Bubble */}
            <ConversationBubble
              message={query.prompt}
              type="QUESTION"
              className={index === 0 ? 'mt-5' : ''}
            />

            {/* Answer Bubble */}
            {(query.response || isCurrentlyStreaming) && (
              <ConversationBubble
                message={query.response || ''}
                type="ANSWER"
                className={isLastMessage ? 'mb-32' : 'mb-7'}
              />
            )}
          </Fragment>
        );
      })}
    </div>
  );
}