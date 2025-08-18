import { useRef, useState } from 'react';

type MessageInputProps = {
  onSubmit: (text: string) => void;
  loading?: boolean;
  placeholder?: string;
  autoFocus?: boolean;
};

export default function MessageInput({
  onSubmit,
  loading = false,
  placeholder = "Type your message...",
  autoFocus = true,
}: MessageInputProps) {
  const [value, setValue] = useState('');
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const handleInput = () => {
    if (inputRef.current) {
      inputRef.current.style.height = 'auto';
      inputRef.current.style.height = `${Math.min(
        inputRef.current.scrollHeight,
        96,
      )}px`;
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setValue(e.target.value);
    handleInput();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleSubmit = () => {
    if (value.trim() && !loading) {
      onSubmit(value);
      setValue('');
      if (inputRef.current) {
        inputRef.current.style.height = '64px';
      }
    }
  };

  return (
    <div className="mx-2 flex w-full flex-col">
      <div className="border-dark-gray bg-lotion dark:border-grey relative flex w-full flex-col rounded-[23px] border dark:bg-transparent">
        <div className="w-full">
          <label htmlFor="message-input" className="sr-only">
            Type your message
          </label>
          <textarea
            id="message-input"
            ref={inputRef}
            value={value}
            onChange={handleChange}
            onInput={handleInput}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            autoFocus={autoFocus}
            className="inputbox-style no-scrollbar bg-lotion dark:text-bright-gray dark:placeholder:text-bright-gray/50 w-full overflow-x-hidden overflow-y-auto rounded-t-[23px] px-4 py-3 text-base leading-tight whitespace-pre-wrap opacity-100 placeholder:text-gray-500 focus:outline-hidden sm:px-6 sm:py-5 dark:bg-transparent"
            aria-label="Type your message"
          />
        </div>

        <div className="flex items-center px-3 py-1.5 sm:px-4 sm:py-2">
          <div className="flex grow"></div>
          
          <button
            onClick={handleSubmit}
            aria-label={loading ? 'Loading' : 'Send'}
            className={`flex items-center justify-center rounded-full p-2 sm:p-2.5 ${
              loading 
                ? 'bg-gray-300 dark:bg-gray-600 cursor-not-allowed' 
                : 'bg-black dark:bg-white hover:bg-gray-800 dark:hover:bg-gray-200'
            } ml-auto shrink-0 transition-colors`}
            disabled={loading}
          >
            {loading ? (
              <div className="h-3.5 w-3.5 rounded-full border-2 border-white border-t-transparent animate-spin sm:h-4 sm:w-4"></div>
            ) : (
              <div className="h-3.5 w-3.5 bg-white rounded-sm sm:h-4 sm:w-4 transform rotate-45"></div>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}