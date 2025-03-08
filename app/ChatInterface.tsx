import { useEffect, useState } from 'react';
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
    inputRef: React.RefObject<HTMLTextAreaElement>;
    messagesEndRef: React.RefObject<HTMLDivElement>;
    autoResizeTextarea: () => void;
    scrollToBottom: () => void;
    sendMessage: () => Promise<void>;
    parserState: React.MutableRefObject<{
      inCodeBlock: boolean;
      codeBlockContent: string;
      backtickCount: number;
      languageId: string;
      inDependencies: boolean;
      dependenciesContent: string;
      fullResponseBuffer: string;
      dependencies: Record<string, string>;
    }>;
    completedMessage: string;
  };
}

// ChatInterface component handles user input and displays chat messages
function ChatInterface({ chatState }: ChatInterfaceProps) {
  const [isSidebarVisible, setIsSidebarVisible] = useState(false);
  
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
    completedMessage
  } = chatState;
  
  const { 
    currentSessionId, 
    saveSession, 
    loadSession, 
    createNewSession 
  } = useChatSessions();

  const toggleSidebar = () => {
    setIsSidebarVisible((prev) => !prev);
  };

  // Focus input on mount
  useEffect(() => {
    inputRef.current?.focus();
  }, [inputRef]);

  // Auto-resize textarea when input changes
  useEffect(() => {
    autoResizeTextarea();
  }, [autoResizeTextarea]);

  // Save messages to Fireproof whenever they change
  useEffect(() => {
    if (messages.length > 0) {
      saveSession(messages);
    }
  }, [messages, saveSession]);

  // Load a session from the sidebar
  const handleLoadSession = async (session: any) => {
    const loadedSession = await loadSession(session);
    
    if (loadedSession?.messages && Array.isArray(loadedSession.messages)) {
      setMessages(loadedSession.messages);

      // Find the last AI message with code to update the editor
      const lastAiMessageWithCode = [...loadedSession.messages]
        .reverse()
        .find((msg: ChatMessage) => msg.type === 'ai' && msg.code);

      if (lastAiMessageWithCode?.code) {
        // Use the last code from the loaded session
        const code = lastAiMessageWithCode.code;
        const dependencies = lastAiMessageWithCode.dependencies || {};
        
        // We need to notify the parent component about this code
        // This will be handled by the onCodeGenerated callback in useChat
      }
    }
  };

  // Function to handle starting a new chat
  const handleNewChat = () => {
    if (
      window.confirm(
        'Starting a new chat will clear your current app. Are you sure you want to continue?'
      )
    ) {
      createNewSession();
      setMessages([]);
      setInput('');
      // The empty code will be handled by the onCodeGenerated callback
    }
  };

  return (
    <div className="flex h-full flex-col" style={{ overflow: 'hidden' }}>
      {/* SessionSidebar component */}
      <SessionSidebar
        isVisible={isSidebarVisible}
        onToggle={toggleSidebar}
        onSelectSession={handleLoadSession}
      />

      <div
        className="chat-interface bg-light-background-00 dark:bg-dark-background-00 flex h-full flex-col"
        style={{ overflow: 'hidden' }}
      >
        {/* Header */}
        <ChatHeader 
          onToggleSidebar={toggleSidebar} 
          onNewChat={handleNewChat} 
          isGenerating={isGenerating} 
        />

        {/* Messages */}
        <MessageList 
          messages={messages} 
          isGenerating={isGenerating} 
          currentStreamedText={currentStreamedText} 
        />

        {/* Quick access buttons */}
        {messages.length === 0 && (
          <QuickSuggestions onSelectSuggestion={setInput} />
        )}

        {/* Input area */}
        <ChatInput 
          input={input}
          setInput={setInput}
          isGenerating={isGenerating}
          onSend={sendMessage}
          autoResizeTextarea={autoResizeTextarea}
          inputRef={inputRef}
        />
      </div>
    </div>
  );
}

export default ChatInterface;
