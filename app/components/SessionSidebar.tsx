import { useEffect, useRef } from 'react';
import { useFireproof } from 'use-fireproof';

// Define the session type
interface SessionDocument {
  _id: string;
  title?: string;
  timestamp: number;
  messages?: Array<{
    text: string;
    type: 'user' | 'ai';
    code?: string;
    dependencies?: Record<string, string>;
  }>;
}

interface SessionSidebarProps {
  isVisible: boolean;
  onToggle: () => void;
  onSelectSession: (session: SessionDocument) => void;
}

/**
 * Component that displays a collapsible sidebar with chat session history
 */
export default function SessionSidebar({
  isVisible,
  onToggle,
  onSelectSession,
}: SessionSidebarProps) {
  const { database, useLiveQuery } = useFireproof('fireproof-chat-history');
  const sidebarRef = useRef<HTMLDivElement>(null);

  // Query chat sessions ordered by timestamp (newest first)
  const { docs: sessions } = useLiveQuery('timestamp', {
    descending: true,
  });

  // Handle clicks outside the sidebar to close it
  useEffect(() => {
    // Only add listener if sidebar is visible
    if (!isVisible) return;
    
    function handleClickOutside(event: MouseEvent) {
      if (sidebarRef.current && !sidebarRef.current.contains(event.target as Node)) {
        onToggle();
      }
    }
    
    // Add event listener
    document.addEventListener('mousedown', handleClickOutside);
    
    // Clean up event listener
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isVisible, onToggle]);

  // Select a session and notify parent component
  const handleSelectSession = (session: SessionDocument) => {
    if (onSelectSession) {
      onSelectSession(session);
      // Close sidebar after selection regardless of screen size
      onToggle();
    }
  };

  return (
    <div
      ref={sidebarRef}
      className={`bg-light-background-00 dark:bg-dark-background-00 fixed top-0 left-0 z-10 h-full shadow-lg transition-all duration-300 ${isVisible ? 'w-64 translate-x-0' : 'w-0 -translate-x-full'}`}
    >
      {/* Sidebar content */}
      <div className="h-full overflow-y-auto">
        <div className="border-light-decorative-00 dark:border-dark-decorative-00 flex items-center justify-between border-b p-4">
          <h2 className="text-light-primary dark:text-dark-primary text-lg font-semibold">
            Chat History
          </h2>
          <button
            type="button"
            onClick={onToggle}
            className="text-light-primary dark:text-dark-primary hover:text-accent-02-light dark:hover:text-accent-02-dark"
            aria-label="Close sidebar"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        <div className="p-2">
          {sessions.length === 0 ? (
            <p className="text-light-secondary dark:text-dark-secondary p-2 text-sm">
              No saved sessions yet
            </p>
          ) : (
            <ul className="space-y-2">
              {sessions.map((session) => (
                <li key={session._id}>
                  <button
                    type="button"
                    onClick={() => handleSelectSession(session as SessionDocument)}
                    onKeyDown={(e) =>
                      e.key === 'Enter' && handleSelectSession(session as SessionDocument)
                    }
                    className="hover:bg-light-decorative-00 dark:hover:bg-dark-decorative-00 w-full cursor-pointer rounded p-3 text-left transition-colors"
                    aria-label={`Select session: ${(session as SessionDocument).title || 'Untitled Chat'}`}
                  >
                    <div className="text-light-primary dark:text-dark-primary truncate text-sm font-medium">
                      {(session as SessionDocument).title || 'Untitled Chat'}
                    </div>
                    <div className="text-light-secondary dark:text-dark-secondary text-xs">
                      {new Date((session as SessionDocument).timestamp).toLocaleDateString()} -
                      {new Date((session as SessionDocument).timestamp).toLocaleTimeString()}
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
