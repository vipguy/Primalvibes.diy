import { useEffect, useRef } from 'react';
import type { ChatMessage } from '../types/chat';
import ReactMarkdown from 'react-markdown';

interface MessageListProps {
  messages: ChatMessage[];
  isGenerating: boolean;
  currentStreamedText: string;
  isShrinking?: boolean;
  isExpanding?: boolean;
}

function MessageList({ 
  messages, 
  isGenerating, 
  currentStreamedText,
  isShrinking = false,
  isExpanding = false
}: MessageListProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, currentStreamedText]);

  // Function to render message content with markdown support
  const renderMessageContent = (text: string) => {
    return (
      <div className="prose prose-sm dark:prose-invert max-w-none">
        <ReactMarkdown>{text}</ReactMarkdown>
      </div>
    );
  };

  return (
    <div
      className="messages bg-light-background-01 dark:bg-dark-background-01 flex-1 space-y-4 overflow-y-auto p-4"
      style={{ maxHeight: 'calc(100vh - 140px)' }}
    >
      {messages.map((msg, i) => (
        <div 
          key={`${msg.type}-${i}`} 
          className={`flex flex-col transition-all duration-500 ${
            isShrinking ? 'scale-0 opacity-0 origin-top-left' : 'scale-100 opacity-100'
          } ${isExpanding ? 'animate-bounce-in' : ''}`}
          style={{ 
            transitionDelay: isShrinking ? `${i * 50}ms` : '0ms' 
          }}
        >
          <div className={`flex ${msg.type === 'user' ? 'justify-end' : 'justify-start'}`}>
            {msg.type === 'ai' && (
              <div className="bg-dark-decorative-00 dark:bg-light-decorative-00 mr-2 flex h-8 w-8 items-center justify-center rounded-full">
                <span className="text-light-primary dark:text-dark-primary text-sm font-medium">
                  AI
                </span>
              </div>
            )}
            <div
              className={`message rounded-2xl p-3 ${
                msg.type === 'user'
                  ? 'bg-accent-02-light dark:bg-accent-02-dark rounded-tr-sm text-white'
                  : 'bg-light-decorative-00 dark:bg-dark-decorative-00 text-light-primary dark:text-dark-primary rounded-tl-sm'
              } max-w-[85%] shadow-sm`}
            >
              {renderMessageContent(msg.text)}
            </div>
          </div>
        </div>
      ))}
      {isGenerating && (
        <div className="flex justify-start">
          <div className="bg-dark-decorative-00 dark:bg-light-decorative-00 mr-2 flex h-8 w-8 items-center justify-center rounded-full">
            <span className="text-light-primary dark:text-dark-primary text-sm font-medium">
              AI
            </span>
          </div>
          <div className="message bg-light-decorative-00 dark:bg-dark-decorative-00 text-light-primary dark:text-dark-primary max-w-[85%] rounded-2xl rounded-tl-sm p-3 shadow-sm">
            {currentStreamedText ? (
              <>
                {renderMessageContent(currentStreamedText)}
                <span className="bg-light-primary dark:bg-dark-primary ml-1 inline-block h-4 w-2 animate-pulse" />
              </>
            ) : (
              <div className="flex items-center gap-2">
                Thinking
                <span className="flex gap-1">
                  <span className="bg-light-primary dark:bg-dark-primary h-1.5 w-1.5 animate-bounce rounded-full [animation-delay:-0.3s]" />
                  <span className="bg-light-primary dark:bg-dark-primary h-1.5 w-1.5 animate-bounce rounded-full [animation-delay:-0.15s]" />
                  <span className="bg-light-primary dark:bg-dark-primary h-1.5 w-1.5 animate-bounce rounded-full" />
                </span>
              </div>
            )}
          </div>
        </div>
      )}
      <div ref={messagesEndRef} />
    </div>
  );
}

export default MessageList;
