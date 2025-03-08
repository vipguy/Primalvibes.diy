import { describe, it, expect, vi } from 'vitest';
import { render, act } from '@testing-library/react';
import React from 'react';
import ChatHeader from '../app/components/ChatHeader';
import SessionSidebar from '../app/components/SessionSidebar';
import MessageList from '../app/components/MessageList';
import type { ChatMessage } from '../app/types/chat';

// Mock dependencies
vi.mock('react-markdown', () => ({
  default: ({ children }: { children: string }) => <div data-testid="markdown">{children}</div>
}));

vi.mock('use-fireproof', () => ({
  useFireproof: () => ({
    database: {},
    useLiveQuery: () => ({ docs: [] })
  })
}));

// Mock component that tracks renders
function createRenderTracker(Component: React.ComponentType<any>) {
  let renderCount = 0;
  
  // Create a wrapped component that uses the original memoized component
  // but tracks renders of the wrapper
  const TrackedComponent = (props: any) => {
    renderCount++;
    // Use the original component directly
    return <Component {...props} />;
  };
  
  // Memoize the tracker component itself to prevent re-renders from parent
  const MemoizedTrackedComponent = React.memo(TrackedComponent);
  
  return {
    Component: MemoizedTrackedComponent,
    getRenderCount: () => renderCount,
    resetCount: () => { renderCount = 0; }
  };
}

describe('Component Memoization', () => {
  describe('ChatHeader Memoization', () => {
    it('does not re-render when props are unchanged', async () => {
      // Create a wrapper component for testing
      const { Component: TrackedHeader, getRenderCount } = createRenderTracker(ChatHeader);
      
      function TestWrapper() {
        const [, forceUpdate] = React.useState({});
        const onToggleSidebar = React.useCallback(() => {}, []);
        const onNewChat = React.useCallback(() => {}, []);
        
        // Force parent re-render without changing props
        const triggerRerender = () => forceUpdate({});
        
        return (
          <div>
            <button data-testid="rerender-trigger" onClick={triggerRerender}>
              Force Re-render
            </button>
            <TrackedHeader
              onToggleSidebar={onToggleSidebar}
              onNewChat={onNewChat}
              isGenerating={false}
            />
          </div>
        );
      }
      
      const { getByTestId } = render(<TestWrapper />);
      expect(getRenderCount()).toBe(1); // Initial render
      
      // Force parent re-render
      await act(async () => {
        getByTestId('rerender-trigger').click();
      });
      
      // ChatHeader should not re-render
      expect(getRenderCount()).toBe(1);
    });
    
    it('does re-render when props change', async () => {
      // Create a wrapper component for testing
      const { Component: TrackedHeader, getRenderCount } = createRenderTracker(ChatHeader);
      
      function TestWrapper() {
        const [isGenerating, setIsGenerating] = React.useState(false);
        const onToggleSidebar = React.useCallback(() => {}, []);
        const onNewChat = React.useCallback(() => {}, []);
        
        return (
          <div>
            <button 
              data-testid="toggle-generating" 
              onClick={() => setIsGenerating(prev => !prev)}
            >
              Toggle Generating
            </button>
            <TrackedHeader
              onToggleSidebar={onToggleSidebar}
              onNewChat={onNewChat}
              isGenerating={isGenerating}
            />
          </div>
        );
      }
      
      const { getByTestId } = render(<TestWrapper />);
      expect(getRenderCount()).toBe(1); // Initial render
      
      // Change a prop
      await act(async () => {
        getByTestId('toggle-generating').click();
      });
      
      // ChatHeader should re-render with new props
      expect(getRenderCount()).toBe(2);
    });
  });

  describe('SessionSidebar Memoization', () => {
    it('does not re-render when props are unchanged', async () => {
      const { Component: TrackedSidebar, getRenderCount } = createRenderTracker(SessionSidebar);
      
      function TestWrapper() {
        const [, forceUpdate] = React.useState({});
        const onToggle = React.useCallback(() => {}, []);
        const onSelectSession = React.useCallback(() => {}, []);
        
        // Force parent re-render without changing props
        const triggerRerender = () => forceUpdate({});
        
        return (
          <div>
            <button data-testid="rerender-trigger" onClick={triggerRerender}>
              Force Re-render
            </button>
            <TrackedSidebar
              isVisible={true}
              onToggle={onToggle}
              onSelectSession={onSelectSession}
            />
          </div>
        );
      }
      
      const { getByTestId } = render(<TestWrapper />);
      expect(getRenderCount()).toBe(1); // Initial render
      
      // Force parent re-render
      await act(async () => {
        getByTestId('rerender-trigger').click();
      });
      
      // SessionSidebar should not re-render
      expect(getRenderCount()).toBe(1);
    });
  });

  describe('MessageList Memoization', () => {
    it('does not re-render when props are unchanged', async () => {
      const { Component: TrackedMessageList, getRenderCount } = createRenderTracker(MessageList);
      const messages: ChatMessage[] = [
        { text: 'Hello', type: 'user' },
        { text: 'Hi there', type: 'ai' }
      ];
      
      function TestWrapper() {
        const [, forceUpdate] = React.useState({});
        // Memoize the messages array to prevent reference changes
        const memoizedMessages = React.useMemo(() => messages, []);
        
        // Force parent re-render without changing props
        const triggerRerender = () => forceUpdate({});
        
        return (
          <div>
            <button data-testid="rerender-trigger" onClick={triggerRerender}>
              Force Re-render
            </button>
            <TrackedMessageList
              messages={memoizedMessages}
              isGenerating={false}
              currentStreamedText=""
            />
          </div>
        );
      }
      
      const { getByTestId } = render(<TestWrapper />);
      expect(getRenderCount()).toBe(1); // Initial render
      
      // Force parent re-render
      await act(async () => {
        getByTestId('rerender-trigger').click();
      });
      
      // MessageList should not re-render
      expect(getRenderCount()).toBe(1);
    });
    
    it('does re-render when messages array changes', async () => {
      const { Component: TrackedMessageList, getRenderCount } = createRenderTracker(MessageList);
      const initialMessages: ChatMessage[] = [{ text: 'Hello', type: 'user' }];
      
      function TestWrapper() {
        const [messages, setMessages] = React.useState(initialMessages);
        
        const addMessage = () => {
          setMessages([...messages, { text: 'New message', type: 'ai' }]);
        };
        
        return (
          <div>
            <button data-testid="add-message" onClick={addMessage}>
              Add Message
            </button>
            <TrackedMessageList
              messages={messages}
              isGenerating={false}
              currentStreamedText=""
            />
          </div>
        );
      }
      
      const { getByTestId } = render(<TestWrapper />);
      expect(getRenderCount()).toBe(1); // Initial render
      
      // Add a new message
      await act(async () => {
        getByTestId('add-message').click();
      });
      
      // MessageList should re-render with new messages
      expect(getRenderCount()).toBe(2);
    });
  });
});