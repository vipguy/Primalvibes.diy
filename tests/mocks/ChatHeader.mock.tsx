import React from 'react';

interface ChatHeaderProps {
  onToggleSidebar: () => void;
  onNewChat: () => void;
  isGenerating: boolean;
}

/**
 * Mock ChatHeader component for testing
 */
export default function ChatHeader({ onToggleSidebar, onNewChat, isGenerating }: ChatHeaderProps) {
  return (
    <div data-testid="chat-header" className="flex items-center justify-between p-4 border-b">
      <button
        onClick={onToggleSidebar}
        aria-label="Toggle chat history"
        data-testid="toggle-sidebar-button"
        className="p-2 rounded-md"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="w-5 h-5"
        >
          <path d="M3 9h18v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V9Z" />
          <path d="m3 9 2.45-4.9A2 2 0 0 1 7.24 3h9.52a2 2 0 0 1 1.8 1.1L21 9" />
          <path d="M12 3v6" />
        </svg>
      </button>
      <h1 className="text-lg font-semibold">AI App Builder</h1>
      <button
        onClick={onNewChat}
        disabled={isGenerating}
        className="px-3 py-1.5 text-sm rounded-md"
        data-testid="new-chat-button"
      >
        New Chat
      </button>
    </div>
  );
} 