import { useState, useRef, useCallback } from 'react';
import type { ChatMessage } from '../types/chat';
import { makeBaseSystemPrompt } from '../prompts';

const CHOSEN_MODEL = 'anthropic/claude-3.7-sonnet';

export function useChat(onCodeGenerated: (code: string, dependencies?: Record<string, string>) => void) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [currentStreamedText, setCurrentStreamedText] = useState<string>('');
  const [systemPrompt, setSystemPrompt] = useState('');
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Initialize system prompt
  useCallback(() => {
    makeBaseSystemPrompt(CHOSEN_MODEL).then((prompt) => {
      setSystemPrompt(prompt);
    });
  }, []);

  // Auto-resize textarea function
  const autoResizeTextarea = useCallback(() => {
    const textarea = inputRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = `${Math.max(60, textarea.scrollHeight)}px`;
    }
  }, []);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

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

  async function sendMessage() {
    if (input.trim()) {
      // Add user message
      setMessages((prev) => [...prev, { text: input, type: 'user' }]);
      setInput('');
      setIsGenerating(true);

      try {
        // Build message history
        const messageHistory = buildMessageHistory();

        // Call OpenRouter API
        const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${import.meta.env.VITE_OPENROUTER_API_KEY}`,
            'Content-Type': 'application/json',
            'HTTP-Referer': window.location.origin,
            'X-Title': 'Fireproof App Builder',
          },
          body: JSON.stringify({
            model: CHOSEN_MODEL,
            messages: [
              {
                role: 'system',
                content: systemPrompt,
              },
              ...messageHistory,
              {
                role: 'user',
                content: input,
              },
              {
                role: 'assistant',
                content: '{"dependencies":',
              },
            ],
          }),
        });

        const data = await response.json();
        
        if (data.error) {
          console.error('OpenRouter API error:', data.error);
        }

        let fullResponse = '';
        let generatedCode = '';
        let dependencies: Record<string, string> = {};

        if (data.choices && data.choices[0] && data.choices[0].message) {
          fullResponse = data.choices[0].message.content;
          console.log('AI response:', fullResponse);
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
        console.error('Error calling OpenRouter API:', error);
      } finally {
        setIsGenerating(false);
      }
    }
  }

  return {
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
  };
} 