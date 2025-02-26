import Anthropic from '@anthropic-ai/sdk';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useFireproof } from 'use-fireproof';
import SessionSidebar from './components/SessionSidebar';
import { BASE_SYSTEM_PROMPT } from './prompts';

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

// Initialize Anthropic client
const anthropic = new Anthropic({
  apiKey: import.meta.env.VITE_ANTHROPIC_API_KEY,
  dangerouslyAllowBrowser: true,
});

// Collection of sample React components
const sampleApps = [
  // Modern Dashboard
  `export default function App() {
  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <header className="bg-white shadow rounded-lg p-6 mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
      </header>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">Card {i}</h2>
            <p className="text-gray-600">This is a sample card with some content.</p>
          </div>
        ))}
      </div>
    </div>
  );
}`,

  // Interactive Counter
  `import { useState } from 'react';

export default function App() {
  const [count, setCount] = useState(0);
  
  return (
    <div className="min-h-screen bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center">
      <div className="bg-white rounded-xl shadow-2xl p-8 text-center">
        <h1 className="text-4xl font-bold mb-4">Counter App</h1>
        <p className="text-6xl font-bold mb-8">{count}</p>
        <div className="space-x-4">
          <button 
            onClick={() => setCount(c => c - 1)}
            className="px-6 py-3 bg-red-500 text-white rounded-lg hover:bg-red-600 cursor-pointer"
          >
            Decrease
          </button>
          <button
            onClick={() => setCount(c => c + 1)}
            className="px-6 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 cursor-pointer"
          >
            Increase
          </button>
        </div>
      </div>
    </div>
  );
}`,

  // Todo List
  `import { useState } from 'react';

export default function App() {
  const [todos, setTodos] = useState([]);
  const [input, setInput] = useState('');

  function handleAddTodo(e) {
    e.preventDefault();
    if (input.trim()) {
      setTodos([...todos, { id: Date.now(), text: input, completed: false }]);
      setInput('');
    }
  }

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-md mx-auto bg-white rounded-xl shadow-md overflow-hidden">
        <div className="p-6">
          <h1 className="text-2xl font-bold mb-4">Todo List</h1>
          <form onSubmit={handleAddTodo} className="mb-4">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              className="w-full p-2 border rounded"
              placeholder="Add a new todo..."
            />
          </form>
          <ul className="space-y-2">
            {todos.map(todo => (
              <li 
                key={todo.id}
                className="flex items-center p-2 bg-gray-50 rounded"
              >
                <input
                  type="checkbox"
                  checked={todo.completed}
                  onChange={() => {
                    setTodos(todos.map(t =>
                      t.id === todo.id ? { ...t, completed: !t.completed } : t
                    ));
                  }}
                  className="mr-2"
                />
                <span className={todo.completed ? 'line-through' : ''}>
                  {todo.text}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}`,

  // Profile Card
  `export default function App() {
  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl overflow-hidden max-w-md w-full">
        <div className="h-32 bg-gradient-to-r from-purple-500 to-pink-500"></div>
        <div className="relative px-6 pb-6">
          <div className="relative -mt-16 mb-4">
            <div className="w-32 h-32 bg-gray-300 rounded-full mx-auto border-4 border-white">
              <img
                className="w-full h-full rounded-full object-cover"
                src="https://picsum.photos/200"
                alt="Profile"
              />
            </div>
          </div>
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-800">John Doe</h2>
            <p className="text-gray-600 mt-1">Software Developer</p>
            <p className="text-gray-500 mt-4">
              Passionate about creating beautiful and functional web applications.
            </p>
            <div className="mt-6 flex justify-center space-x-4">
              <button className="px-4 py-2 bg-purple-500 text-white rounded hover:bg-purple-600 cursor-pointer">
                Follow
              </button>
              <button className="px-4 py-2 bg-gray-100 text-gray-700 rounded hover:bg-gray-200 cursor-pointer">
                Message
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}`,
];

// ChatInterface component handles user input and displays chat messages
function ChatInterface({ onCodeGenerated }: ChatInterfaceProps) {
  const [messages, setMessages] = useState<
    Array<{
      text: string;
      type: 'user' | 'ai';
      code?: string;
      dependencies?: Record<string, string>;
    }>
  >([]);
  const [input, setInput] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [currentStreamedText, setCurrentStreamedText] = useState<string>('');
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [isSidebarVisible, setIsSidebarVisible] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Initialize Fireproof
  const { database } = useFireproof('fireproof-chat-history');

  // Toggle sidebar visibility
  const toggleSidebar = useCallback(() => {
    setIsSidebarVisible((prev) => !prev);
  }, []);

  // Function to save messages to Fireproof
  const saveSession = useCallback(
    async (sessionMessages: typeof messages) => {
      if (sessionMessages.length === 0) return;

      // Extract title from first user message
      const firstUserMessage = sessionMessages.find((msg) => msg.type === 'user');
      const title = firstUserMessage
        ? `${firstUserMessage.text.substring(0, 50)}${firstUserMessage.text.length > 50 ? '...' : ''}`
        : 'Untitled Chat';

      try {
        // If we have a current session ID, update it; otherwise create a new one
        const sessionData = {
          title,
          messages: sessionMessages,
          timestamp: Date.now(),
          ...(currentSessionId ? { _id: currentSessionId } : {}),
        };

        const result = await database.put(sessionData);
        if (!currentSessionId) {
          setCurrentSessionId(result.id);
        }
      } catch (error) {
        console.error('Error saving session to Fireproof:', error);
      }
    },
    [database, currentSessionId]
  );

  // Function to load a session from Fireproof
  const loadSession = async (session: SessionDocument) => {
    if (!session?._id) return;

    try {
      setCurrentSessionId(session._id);

      if (session.messages && Array.isArray(session.messages)) {
        setMessages(session.messages);

        // Find the last AI message with code to update the editor
        const lastAiMessageWithCode = [...session.messages]
          .reverse()
          .find((msg) => msg.type === 'ai' && msg.code);

        if (lastAiMessageWithCode?.code) {
          onCodeGenerated(lastAiMessageWithCode.code, lastAiMessageWithCode.dependencies || {});
        }
      }
    } catch (error) {
      console.error('Error loading session from Fireproof:', error);
    }
  };

  // Save messages to Fireproof whenever they change
  useEffect(() => {
    if (messages.length > 0) {
      saveSession(messages);
    }
  }, [messages, saveSession]);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  // Focus input on mount
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // Scroll to bottom whenever messages or streaming text changes
  useEffect(() => {
    scrollToBottom();
  }, [scrollToBottom]);

  // Watch for changes in messages and current streamed text to trigger scroll
  useEffect(() => {
    if (messages.length > 0 || currentStreamedText) {
      scrollToBottom();
    }
  }, [messages, currentStreamedText, scrollToBottom]);

  // Function to build conversation history for the prompt
  function buildMessageHistory() {
    return messages.map((msg) => ({
      role: msg.type === 'user' ? ('user' as const) : ('assistant' as const),
      content:
        msg.type === 'user'
          ? msg.text
          : `${msg.text}${
              msg.code ? `\n\nHere's the code I generated:\n\`\`\`jsx\n${msg.code}\n\`\`\`` : ''
            }${
              msg.dependencies && Object.keys(msg.dependencies).length > 0
                ? `\n\nWith dependencies:\n${JSON.stringify(msg.dependencies, null, 2)}`
                : ''
            }`,
    }));
  }

  async function handleSendMessage() {
    if (input.trim()) {
      // Add user message
      setMessages((prev) => [...prev, { text: input, type: 'user' }]);
      setInput('');
      setIsGenerating(true);

      try {
        // Build message history
        const messageHistory = buildMessageHistory();

        // Call Claude API with system prompt and message history
        const response = await anthropic.messages.create({
          model: 'claude-3-7-sonnet-latest',
          max_tokens: 8192,
          system: [
            {
              type: 'text',
              text: BASE_SYSTEM_PROMPT,
              cache_control: { type: 'ephemeral' },
            },
          ],
          messages: [
            ...messageHistory,
            {
              role: 'user' as const,
              content: input,
            },
            {
              role: 'assistant' as const,
              content: '{"dependencies":',
            },
          ],
        });

        let fullResponse = '';
        let generatedCode = '';
        let dependencies: Record<string, string> = {};

        if (response.content[0].type === 'text') {
          fullResponse = response.content[0].text;

          // Extract dependencies from JSON declaration
          const depsMatch = fullResponse.match(/^\s*{\s*([^}]+)}\s*}/);
          if (depsMatch) {
            try {
              const depsObject = JSON.parse(`{${depsMatch[1]}}`);
              dependencies = depsObject;
              // Remove the dependencies object from the full response
              fullResponse = fullResponse.replace(/^\s*{\s*[^}]+}\s*}/, '').trim();
            } catch (e) {
              console.error('Failed to parse dependencies:', e);
            }
          }

          // Extract code and explanation
          const codeBlockMatch = fullResponse.match(/```(?:jsx|js|javascript)?\n([\s\S]*?)```/);
          if (codeBlockMatch) {
            generatedCode = codeBlockMatch[1];

            // Get the explanation by removing the code block and dependencies declaration
            const explanation = fullResponse
              .replace(/^\s*{\s*"dependencies"\s*:\s*{[^}]+}\s*/, '')
              .replace(/```(?:jsx|js|javascript)?\n[\s\S]*?```/, '')
              .trim();
            fullResponse = explanation;
          }
        }

        // Add AI response with code and dependencies
        setMessages((prev) => [
          ...prev,
          {
            text: fullResponse || "Here's your generated app:",
            type: 'ai',
            code: generatedCode,
            dependencies,
          },
        ]);

        // Update the editor with code and dependencies
        onCodeGenerated(generatedCode, dependencies);
      } catch (error) {
        setMessages((prev) => [
          ...prev,
          {
            text: 'Sorry, there was an error generating the component. Please try again.',
            type: 'ai',
          },
        ]);
        console.error('Error calling Claude API:', error);
      } finally {
        setIsGenerating(false);
      }
    }
  }

  // Function to handle starting a new chat
  const handleNewChat = () => {
    if (
      window.confirm(
        'Starting a new chat will clear your current app. Are you sure you want to continue?'
      )
    ) {
      setCurrentSessionId(null);
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
        onSelectSession={loadSession}
      />

      <div
        className="chat-interface bg-light-background-00 dark:bg-dark-background-00 flex h-full flex-col"
        style={{ overflow: 'hidden' }}
      >
        {/* Header */}
        <div className="border-light-decorative-00 dark:border-dark-decorative-00 bg-light-background-00 dark:bg-dark-background-00 flex items-center justify-between border-b px-6 py-4">
          <div className="flex items-center">
            <button
              type="button"
              onClick={toggleSidebar}
              className="text-light-primary dark:text-dark-primary hover:text-accent-02-light dark:hover:text-accent-02-dark mr-3"
              aria-label="Toggle chat history"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6h16M4 12h16M4 18h7"
                />
              </svg>
            </button>
            <h1 className="text-light-primary dark:text-dark-primary text-xl font-semibold">
              Fireproof App Builder
            </h1>
          </div>
          <button
            type="button"
            onClick={handleNewChat}
            className="bg-accent-02-light dark:bg-accent-02-dark hover:bg-accent-03-light dark:hover:bg-accent-03-dark cursor-pointer rounded-lg px-4 py-2 text-white transition-colors"
            disabled={isGenerating}
          >
            New Chat
          </button>
        </div>

        {/* Messages */}
        <div
          className="messages bg-light-background-01 dark:bg-dark-background-01 flex-1 space-y-4 overflow-y-auto p-4"
          style={{ maxHeight: 'calc(100vh - 140px)' }}
        >
          {messages.map((msg, i) => (
            <div key={`${msg.type}-${i}`} className="flex flex-col">
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
                  {msg.text}
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
                    {currentStreamedText}
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

        {/* Quick access buttons */}
        {messages.length === 0 && (
          <div className="border-light-decorative-00 dark:border-dark-decorative-00 bg-light-background-00 dark:bg-dark-background-00 border-t px-4 py-3">
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() =>
                  setInput(
                    'Create a todo app with due dates and the ability to mark tasks as complete'
                  )
                }
                className="bg-light-decorative-00 dark:bg-dark-decorative-00 text-light-primary dark:text-dark-primary hover:bg-light-decorative-01 dark:hover:bg-dark-decorative-01 cursor-pointer rounded-lg px-3 py-1.5 text-sm font-medium transition-colors"
              >
                Todo App
              </button>
              <button
                type="button"
                onClick={() =>
                  setInput(
                    'Create a pomodoro timer app with multiple timers work/break intervals and session tracking'
                  )
                }
                className="bg-light-decorative-00 dark:bg-dark-decorative-00 text-light-primary dark:text-dark-primary hover:bg-light-decorative-01 dark:hover:bg-dark-decorative-01 cursor-pointer rounded-lg px-3 py-1.5 text-sm font-medium transition-colors"
              >
                Pomodoro Tracker
              </button>
              <button
                type="button"
                onClick={() =>
                  setInput(
                    'Create a simple drawing app with a canvas where users can draw with different colors and save their drawings'
                  )
                }
                className="bg-light-decorative-00 dark:bg-dark-decorative-00 text-light-primary dark:text-dark-primary hover:bg-light-decorative-01 dark:hover:bg-dark-decorative-01 cursor-pointer rounded-lg px-3 py-1.5 text-sm font-medium transition-colors"
              >
                Drawing App
              </button>
            </div>
          </div>
        )}

        {/* Input area */}
        <div className="input-area border-light-decorative-00 dark:border-dark-decorative-00 bg-light-background-00 dark:bg-dark-background-00 border-t px-4 py-3">
          <div className="flex items-center space-x-2">
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && !isGenerating && handleSendMessage()}
              className="border-light-decorative-00 dark:border-dark-decorative-00 text-light-primary dark:text-dark-primary bg-light-background-00 dark:bg-dark-background-00 focus:ring-accent-01-light dark:focus:ring-accent-01-dark flex-1 rounded-xl border p-2.5 text-sm transition-all focus:border-transparent focus:ring-2 focus:outline-none"
              placeholder="Describe the app you want to create..."
              disabled={isGenerating}
            />
            <button
              type="button"
              onClick={handleSendMessage}
              disabled={isGenerating}
              className={`flex items-center justify-center rounded-xl px-4 py-2.5 text-sm font-medium whitespace-nowrap transition-colors duration-200 ${
                isGenerating
                  ? 'bg-light-decorative-01 dark:bg-dark-decorative-01 text-light-primary dark:text-dark-primary cursor-not-allowed opacity-50'
                  : 'bg-accent-01-light dark:bg-accent-01-dark hover:bg-accent-02-light dark:hover:bg-accent-02-dark cursor-pointer text-white'
              }`}
            >
              {isGenerating ? 'Generating...' : 'Send'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ChatInterface;
