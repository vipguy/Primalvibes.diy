import { useEffect, useState } from 'react';
import type { ChatMessage } from './types/chat';
import { useChat } from './hooks/useChat';
import { useChatSessions } from './hooks/useChatSessions';
import SessionSidebar from './components/SessionSidebar';
import ChatHeader from './components/ChatHeader';
import MessageList from './components/MessageList';
import ChatInput from './components/ChatInput';
import QuickSuggestions from './components/QuickSuggestions';

// const CHOSEN_MODEL = 'qwen/qwq-32b:free';
const CHOSEN_MODEL = 'anthropic/claude-3.7-sonnet';

interface ChatInterfaceProps {
  onCodeGenerated: (code: string, dependencies?: Record<string, string>) => void;
}

// Define the session document type
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

// ChatInterface component handles user input and displays chat messages
function ChatInterface({ onCodeGenerated }: ChatInterfaceProps) {
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
    sendMessage 
  } = useChat(onCodeGenerated);
  
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
        onCodeGenerated(lastAiMessageWithCode.code, lastAiMessageWithCode.dependencies || {});
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
      onCodeGenerated('', {});
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
