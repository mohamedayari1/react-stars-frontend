import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';

import PaperPlane from '../assets/paper_plane.svg';
import SpinnerDark from '../assets/spinner-dark.svg';
import Spinner from '../assets/spinner.svg';

type SimpleTextInputProps = {
  onSubmit: (text: string) => void; // Callback function when text is submitted
  loading: boolean; // Whether the component is in loading state
  autoFocus?: boolean; // Should input auto-focus on mount (default: true)
  placeholder?: string; // Custom placeholder text (optional)
  className?: string; // Additional CSS classes (optional)
};

export default function MessageInput({
  onSubmit,
  loading,
  autoFocus = true,
  placeholder,
  className = '',
}: SimpleTextInputProps) {
  const { t } = useTranslation(); // For internationalization (i18n)

  const isDarkTheme = false; // Replace with actual theme detection logic

  // STATE MANAGEMENT
  const [value, setValue] = useState(''); // Current text input value

  // REFS - Direct DOM access for textarea
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // AUTO-RESIZE FUNCTIONALITY
  // This function dynamically adjusts the textarea height based on content
  const handleInput = () => {
    if (inputRef.current) {
      // On very small screens (< 350px), reset to auto height
      if (window.innerWidth < 350) inputRef.current.style.height = 'auto';
      // Otherwise, set minimum height to 64px
      else inputRef.current.style.height = '64px';

      // Calculate optimal height: minimum of scrollHeight or 96px max
      inputRef.current.style.height = `${Math.min(
        inputRef.current.scrollHeight, // Natural height needed for content
        96, // Maximum height limit
      )}px`;
    }
  };

  // INITIALIZATION EFFECT
  // Runs once when component mounts
  useEffect(() => {
    if (autoFocus) inputRef.current?.focus(); // Auto-focus if enabled
    handleInput(); // Set initial height
  }, [autoFocus]);

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setValue(e.target.value);
    handleInput();
  };

  // KEYBOARD EVENT HANDLER
  // Handles Enter key for submission and Shift+Enter for new lines
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Check if Enter is pressed WITHOUT Shift key
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault(); // Prevent default (new line)
      handleSubmit(); // Submit the message

      // Clear input and reset height after submission
      if (inputRef.current) {
        inputRef.current.value = ''; // Clear the textarea
        handleInput(); // Reset height to minimum
      }
    }
    // If Shift+Enter is pressed, allow default behavior (new line)
  };

  // SUBMISSION HANDLER
  // Main function that processes the submitted text
  const handleSubmit = () => {
    // Only submit if there's actual content and not currently loading
    if (value.trim() && !loading) {
      onSubmit(value); // Call parent's onSubmit function
      setValue(''); // Clear local state

      // Reset textarea height to minimum after submission
      if (inputRef.current) {
        inputRef.current.style.height = '64px';
      }
    }
  };


  
  return (
    <div className={`mx-2 flex w-full flex-col ${className}`}>
      <div className="border-dark-gray bg-lotion dark:border-grey relative flex w-full flex-col rounded-[23px] border dark:bg-transparent">
        <div className="w-full">
          <label htmlFor="message-input" className="sr-only">
            Type your message here
          </label>
          {/* Main text input area */}
          {/* Main text input area */}
          <textarea
            id="simple-text-input" // ID for label association
            ref={inputRef} // DOM reference for height manipulation
            value={value} // Controlled input value
            onChange={handleChange} // Handle text changes
            tabIndex={1} // Tab order for keyboard navigation
            placeholder={placeholder || t('Type your message here')} // Placeholder text
            className="inputbox-style no-scrollbar bg-lotion dark:text-bright-gray dark:placeholder:text-bright-gray/50 w-full overflow-x-hidden overflow-y-auto rounded-t-[23px] px-4 py-3 text-base leading-tight whitespace-pre-wrap opacity-100 placeholder:text-gray-500 focus:outline-hidden sm:px-6 sm:py-5 dark:bg-transparent"
            onInput={handleInput} // Handle height adjustment
            onKeyDown={handleKeyDown} // Handle keyboard events
            aria-label={placeholder || t('inputPlaceholder')} // Screen reader label
            disabled={loading} // Disable during loading
          />
        </div>

        <div className="flex items-center px-3 py-1.5 sm:px-4 sm:py-2">
          <button
            onClick={loading ? undefined : handleSubmit} // Only allow clicks when not loading
            aria-label={loading ? t('loading') : t('send')} // Accessibility label
            className={`flex items-center justify-center rounded-full p-2 sm:p-2.5 ${
              loading
                ? 'cursor-not-allowed bg-gray-300 dark:bg-gray-600' // Loading state styles
                : 'bg-black transition-colors hover:bg-gray-800 dark:bg-white dark:hover:bg-gray-200' // Active state styles
            } shrink-0`}
            disabled={loading} // Disable button during loading
          >
            {/* Show spinner when loading, paper plane when ready */}
            {loading ? (
              <img
                src={isDarkTheme ? SpinnerDark : Spinner} // Theme-appropriate spinner
                className="h-3.5 w-3.5 animate-spin sm:h-4 sm:w-4" // Spinning animation
                alt={t('loading')} // Alt text for accessibility
              />
            ) : (
              <img
                className={`h-3.5 w-3.5 sm:h-4 sm:w-4 ${
                  isDarkTheme ? 'invert filter' : '' // Invert colors for dark theme
                }`}
                src={PaperPlane} // Send icon
                alt={t('send')} // Alt text for accessibility
              />
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
