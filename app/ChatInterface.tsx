import { useEffect, useState, useMemo, useCallback } from 'react';
import type { ChatMessage } from './types/chat';
import { useChatSessions } from './hooks/useChatSessions';
import SessionSidebar from './components/SessionSidebar';
import ChatHeader from './components/ChatHeader';
import MessageList from './components/MessageList';
import ChatInput from './components/ChatInput';
import QuickSuggestions from './components/QuickSuggestions';

interface ChatInterfaceProps {
  chatState: {
    messages: ChatMessage[];
    setMessages: React.Dispatch<React.SetStateAction<ChatMessage[]>>;
    input: string;
    setInput: React.Dispatch<React.SetStateAction<string>>;
    isGenerating: boolean;
    currentStreamedText: string;
    streamingCode: string;
    completedCode: string;
    isStreaming: boolean;
    inputRef: React.RefObject<HTMLTextAreaElement | null>;
    messagesEndRef: React.RefObject<HTMLDivElement | null>;
    autoResizeTextarea: () => void;
    scrollToBottom: () => void;
    sendMessage: () => Promise<void>;
    parserState: React.MutableRefObject<{
      inCodeBlock: boolean;
      codeBlockContent: string;
      dependencies: Record<string, string>;
      displayText: string;
      on: (event: string, callback: Function) => void;
      removeAllListeners: () => void;
      write: (chunk: string) => void;
      end: () => void;
      reset: () => void;
    }>;
    completedMessage: string;
  };
}

// ChatInterface component handles user input and displays chat messages
function ChatInterface({ chatState }: ChatInterfaceProps) {
  const [isSidebarVisible, setIsSidebarVisible] = useState(false);
  const [isShrinking, setIsShrinking] = useState(false);
  const [isExpanding, setIsExpanding] = useState(false);

  const {
    messages,
    setMessages,
    input,
    setInput,
    isGenerating,
    currentStreamedText,
    inputRef,
    messagesEndRef,
    autoResizeTextarea,
    scrollToBottom,
    sendMessage,
    completedMessage,
  } = chatState;

  const { currentSessionId, saveSession, loadSession, createNewSession } = useChatSessions();

  // Memoize handler functions to prevent re-renders
  const handleSelectSuggestion = useCallback((suggestion: string) => {
    setInput(suggestion);
    // Focus the input after setting the value
    setTimeout(() => {
      if (inputRef.current) {
        inputRef.current.focus();
        // Move cursor to the end
        const length = suggestion.length;
        inputRef.current.selectionStart = length;
        inputRef.current.selectionEnd = length;
      }
    }, 0);
  }, [inputRef, setInput]);

  const toggleSidebar = useCallback(() => {
    setIsSidebarVisible((prev) => !prev);
  }, []);

  // Focus input on mount
  useEffect(() => {
    inputRef.current?.focus();
  }, [inputRef]);

  // Auto-resize textarea when input changes
  useEffect(() => {
    autoResizeTextarea();
  }, [autoResizeTextarea]);

  // Save messages to Fireproof whenever they change, but only when not streaming
  useEffect(() => {
    if (messages.length > 0 && !isGenerating) {
      console.log('Saving completed session to Fireproof');
      saveSession(messages);
    }
  }, [messages, saveSession, isGenerating]);

  // Load a session from the sidebar - memoized to prevent re-renders
  const handleLoadSession = useCallback(async (session: any) => {
    const loadedSession = await loadSession(session);

    if (loadedSession?.messages && Array.isArray(loadedSession.messages)) {
      setMessages(loadedSession.messages);

      // Find the last AI message with code to update the editor
      const lastAiMessageWithCode = [...loadedSession.messages]
        .reverse()
        .find((msg: ChatMessage) => msg.type === 'ai' && msg.code);

      if (lastAiMessageWithCode?.code) {
        // No need to handle this here as it's handled by the parent component through onCodeGenerated
      }
    }
  }, [loadSession, setMessages]);

  // Function to handle starting a new chat - memoized with complete dependencies
  const handleNewChat = useCallback(() => {
    // Start the shrinking animation
    setIsShrinking(true);

    // After animation completes, reset the state
    setTimeout(
      () => {
        createNewSession();
        setMessages([]);
        setInput('');
        setIsShrinking(false);

        // Add a small bounce effect when the new chat appears
        setIsExpanding(true);
        setTimeout(() => {
          setIsExpanding(false);
        }, 300);
      },
      500 + messages.length * 50
    ); // Account for staggered animation of messages
  }, [createNewSession, messages.length, setInput, setMessages, setIsShrinking, setIsExpanding]);

  // Memoize child components to prevent unnecessary re-renders
  const sessionSidebar = useMemo(() => (
    <SessionSidebar
      isVisible={isSidebarVisible}
      onToggle={toggleSidebar}
      onSelectSession={handleLoadSession}
    />
  ), [isSidebarVisible, toggleSidebar, handleLoadSession]);

  const chatHeader = useMemo(() => (
    <ChatHeader
      onToggleSidebar={toggleSidebar}
      onNewChat={handleNewChat}
      isGenerating={isGenerating}
    />
  ), [toggleSidebar, handleNewChat, isGenerating]);

  const messageList = useMemo(() => (
    <MessageList
      messages={messages}
      isGenerating={isGenerating}
      currentStreamedText={currentStreamedText}
      isShrinking={isShrinking}
      isExpanding={isExpanding}
    />
  ), [messages, isGenerating, currentStreamedText, isShrinking, isExpanding]);

  const quickSuggestions = useMemo(() => (
    messages.length === 0 && <QuickSuggestions onSelectSuggestion={handleSelectSuggestion} />
  ), [messages.length, handleSelectSuggestion]);

  const chatInput = useMemo(() => (
    <ChatInput
      input={input}
      setInput={setInput}
      isGenerating={isGenerating}
      onSend={sendMessage}
      autoResizeTextarea={autoResizeTextarea}
      inputRef={inputRef}
    />
  ), [input, setInput, isGenerating, sendMessage, autoResizeTextarea, inputRef]);

  return (
    <div className="flex h-full flex-col" style={{ overflow: 'hidden' }}>
      {/* SessionSidebar component */}
      {sessionSidebar}

      <div
        className="chat-interface bg-light-background-00 dark:bg-dark-background-00 flex h-full flex-col"
        style={{ overflow: 'hidden' }}
      >
        {/* Header */}
        {chatHeader}

        {/* Messages */}
        {messageList}

        {/* Quick access buttons */}
        {quickSuggestions}

        {/* Input area */}
        {chatInput}
      </div>
    </div>
  );
}

export default ChatInterface;
