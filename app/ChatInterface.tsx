import Anthropic from '@anthropic-ai/sdk';
import { useEffect, useRef, useState } from 'react';
import { BASE_SYSTEM_PROMPT } from './prompts';

interface ChatInterfaceProps {
  onCodeGenerated: (code: string, dependencies?: Record<string, string>) => void;
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
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Function to handle starting a new chat
  const handleNewChat = () => {
    if (
      window.confirm(
        'Starting a new chat will clear your current app. Are you sure you want to continue?'
      )
    ) {
      window.location.href = '/';
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Focus input on mount
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // Scroll to bottom whenever messages or streaming text changes
  useEffect(() => {
    if (messagesEndRef.current) {
      scrollToBottom();
    }
  }, [messages.length, currentStreamedText.length]);

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

  return (
    <div className="flex h-full flex-col" style={{ overflow: 'hidden' }}>
      <div className="chat-interface flex h-full flex-col bg-white" style={{ overflow: 'hidden' }}>
        {/* Header */}
        <div className="flex items-center justify-between border-b bg-white px-6 py-4">
          <h1 className="text-xl font-semibold text-gray-800">Fireproof App Builder</h1>
          <button
            type="button"
            onClick={handleNewChat}
            className="cursor-pointer rounded-lg bg-blue-500 px-4 py-2 text-white transition-colors hover:bg-blue-600"
            disabled={isGenerating}
          >
            New Chat
          </button>
        </div>

        {/* Messages */}
        <div
          className="messages flex-1 space-y-4 overflow-y-auto p-4"
          style={{ maxHeight: 'calc(100vh - 140px)' }}
        >
          {messages.map((msg, i) => (
            <div key={`${msg.type}-${i}`} className="flex flex-col">
              <div className={`flex ${msg.type === 'user' ? 'justify-end' : 'justify-start'}`}>
                {msg.type === 'ai' && (
                  <div className="mr-2 flex h-8 w-8 items-center justify-center rounded-full bg-gray-200">
                    <span className="text-sm font-medium text-gray-600">AI</span>
                  </div>
                )}
                <div
                  className={`message rounded-2xl p-3 ${
                    msg.type === 'user'
                      ? 'rounded-tr-sm bg-blue-500 text-white'
                      : 'rounded-tl-sm bg-gray-100 text-gray-800'
                  } max-w-[85%] shadow-sm`}
                >
                  {msg.text}
                </div>
              </div>
            </div>
          ))}
          {isGenerating && (
            <div className="flex justify-start">
              <div className="mr-2 flex h-8 w-8 items-center justify-center rounded-full bg-gray-200">
                <span className="text-sm font-medium text-gray-600">AI</span>
              </div>
              <div className="message max-w-[85%] rounded-2xl rounded-tl-sm bg-gray-100 p-3 text-gray-800 shadow-sm">
                {currentStreamedText ? (
                  <>
                    {currentStreamedText}
                    <span className="ml-1 inline-block h-4 w-2 animate-pulse bg-gray-500" />
                  </>
                ) : (
                  <div className="flex items-center gap-2">
                    Thinking
                    <span className="flex gap-1">
                      <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-gray-600 [animation-delay:-0.3s]" />
                      <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-gray-600 [animation-delay:-0.15s]" />
                      <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-gray-600" />
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
          <div className="border-t bg-white px-4 py-3">
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() =>
                  setInput(
                    'Create a todo app with due dates and the ability to mark tasks as complete'
                  )
                }
                className="cursor-pointer rounded-lg bg-gray-100 px-3 py-1.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-200"
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
                className="cursor-pointer rounded-lg bg-gray-100 px-3 py-1.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-200"
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
                className="cursor-pointer rounded-lg bg-gray-100 px-3 py-1.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-200"
              >
                Drawing App
              </button>
            </div>
          </div>
        )}

        {/* Input area */}
        <div className="input-area border-t bg-white px-4 py-3">
          <div className="flex items-center space-x-2">
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && !isGenerating && handleSendMessage()}
              className="flex-1 rounded-xl border border-gray-200 p-2.5 text-sm text-black transition-all focus:border-transparent focus:ring-2 focus:ring-blue-500 focus:outline-none"
              placeholder="Describe the app you want to create..."
              disabled={isGenerating}
            />
            <button
              type="button"
              onClick={handleSendMessage}
              disabled={isGenerating}
              className={`flex items-center justify-center rounded-xl px-4 py-2.5 text-sm font-medium whitespace-nowrap transition-colors duration-200 ${
                isGenerating
                  ? 'cursor-not-allowed bg-gray-300 text-gray-500'
                  : 'cursor-pointer bg-blue-500 text-white hover:bg-blue-600'
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
