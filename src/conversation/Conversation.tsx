import Demo from '../components/ConversationBubble';
import DualAnswerDemo from '../components/DualConversationBubble';
import MessageInput from '../components/MessageInput';

export default function Conversation() {
  return (
    <div className="flex h-full flex-col justify-end gap-1">
      <DualAnswerDemo />

      <div className="bg-opacity-0 z-3 flex h-auto w-full max-w-[1300px] flex-col items-end self-center rounded-2xl py-1 md:w-9/12 lg:w-8/12 xl:w-8/12 2xl:w-6/12">
        <div className="flex w-full items-center rounded-[40px]">
          <MessageInput />
        </div>
      </div>
    </div>
  );
}
