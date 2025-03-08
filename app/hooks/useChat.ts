import { useState, useRef, useCallback, useEffect } from 'react';
import type { ChatMessage } from '../types/chat';
import { makeBaseSystemPrompt } from '../prompts';

const CHOSEN_MODEL = 'anthropic/claude-3.7-sonnet';
// const CHOSEN_MODEL = 'qwen/qwq-32b:free';

export function useChat(onCodeGenerated: (code: string, dependencies?: Record<string, string>) => void) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [currentStreamedText, setCurrentStreamedText] = useState<string>('');
  const [systemPrompt, setSystemPrompt] = useState('');
  const [streamingCode, setStreamingCode] = useState<string>('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [completedCode, setCompletedCode] = useState<string>('');
  const [pendingDependencyChunk, setPendingDependencyChunk] = useState<string>('');
  const [inDependencyMode, setInDependencyMode] = useState<boolean>(false);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Parser state for tracking code blocks and dependencies
  const parserState = useRef({
    inCodeBlock: false,
    codeBlockContent: '',
    backtickCount: 0,
    languageId: '',
    inDependencies: false,
    dependenciesContent: '',
    fullResponseBuffer: '',
    dependencies: {} as Record<string, string>,
    dependencyRanges: [] as [number, number][]
  });

  // Initialize system prompt
  useEffect(() => {
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

  // State machine function for processing streaming chunks
  function processStreamChunk(chunk: string) {
    let currentDisplayText = '';

    console.log('Processing chunk:', chunk, 'inDependencyMode:', inDependencyMode);
    
    // Add an early return for any chunk while in dependency mode
    if (inDependencyMode) {
      setPendingDependencyChunk(pendingDependencyChunk + chunk);
      
      // Only process further if we see the end of the dependency declaration
      if ((pendingDependencyChunk + chunk).includes('}}')) {
        const combined = pendingDependencyChunk + chunk;
        const afterJson = combined.substring(combined.indexOf('}}') + 2);
        
        // Extract dependencies using regex
        const matches = combined.match(/"([^"]+)"\s*:\s*"([^"]+)"/g);
        if (matches) {
          matches.forEach(match => {
            const parts = match.split(':');
            if (parts.length === 2) {
              const key = parts[0].replace(/"/g, '').trim();
              const value = parts[1].replace(/"/g, '').trim();
              parserState.current.dependencies[key] = value;
              console.log(`Added dependency: ${key} = ${value}`);
            }
          });
        }
        
        // Reset dependency mode
        setInDependencyMode(false);
        setPendingDependencyChunk('');
        
        // Process remaining content if any
        if (afterJson.trim()) {
          processStreamChunk(afterJson);
        }
      }
      
      return;
    }
    
    // Check for various patterns that indicate dependency data
    const isDependencyChunk = 
      // Package name fragment - includes quotes and : but not at beginning
      (chunk.includes('"') && chunk.includes(':') && !chunk.includes('```')) ||
      // Start of package object
      chunk.trim().startsWith('{') || 
      // End of package declaration with }} 
      (chunk.includes('}}') && chunk.indexOf('}}') < 20) ||
      // Fragment starting with "-" followed by package name
      (chunk.trim().startsWith('-') && chunk.includes('"'));
      
    if (isDependencyChunk) {
      console.log('Dependency chunk detected, setting mode and accumulating:', chunk);
      setPendingDependencyChunk(pendingDependencyChunk + chunk);
      setInDependencyMode(true);
      return;
    }
    
    // Append processed chunk to the full response buffer
    parserState.current.fullResponseBuffer += chunk;
    
    // Continue with standard processing for code blocks
    for (let i = 0; i < chunk.length; i++) {
      const char = chunk[i];

      if (char === '`') {
        parserState.current.backtickCount++;

        // Check for code block start (```)
        if (parserState.current.backtickCount === 3 && !parserState.current.inCodeBlock) {
          parserState.current.inCodeBlock = true;
          parserState.current.backtickCount = 0;
          parserState.current.codeBlockContent = '';

          // Look ahead for language ID
          let languageId = '';
          let j = i + 1;
          while (j < chunk.length && chunk[j] !== '\n') {
            languageId += chunk[j];
            j++;
          }

          if (j < chunk.length) {
            i = j; // Skip to after the newline
            parserState.current.languageId = languageId.trim();
          }
          continue;
        }

        // Check for code block end (```)
        if (parserState.current.backtickCount === 3 && parserState.current.inCodeBlock) {
          parserState.current.inCodeBlock = false;
          parserState.current.backtickCount = 0;

          // Clean up the code content - more robust language identifier handling
          let cleanedCode = parserState.current.codeBlockContent;
          
          // Check for language identifier at the beginning in different formats
          // Case 1: Language on its own line: "js\n..."
          const firstLineBreak = cleanedCode.indexOf('\n');
          if (firstLineBreak > -1) {
            const firstLine = cleanedCode.substring(0, firstLineBreak).trim();
            if (['js', 'jsx', 'javascript', 'ts', 'typescript'].includes(firstLine)) {
              cleanedCode = cleanedCode.substring(firstLineBreak + 1);
            }
          }
          
          // Case 2: Language without a line break: "js..." (at the beginning)
          const languageIdentifiers = ['js', 'jsx', 'javascript', 'ts', 'typescript'];
          for (const lang of languageIdentifiers) {
            if (cleanedCode.trimStart().startsWith(lang)) {
              // Only remove if it's followed by a space or newline to avoid removing code that happens to start with "js"
              const afterLang = cleanedCode.trimStart().substring(lang.length);
              if (afterLang.startsWith(' ') || afterLang.startsWith('\n')) {
                cleanedCode = afterLang.trimStart();
              }
            }
          }

          setStreamingCode(cleanedCode);
          setCompletedCode(cleanedCode);
          continue;
        }
      } else if (parserState.current.backtickCount > 0 && parserState.current.backtickCount < 3) {
        if (parserState.current.inCodeBlock) {
          parserState.current.codeBlockContent += '`'.repeat(parserState.current.backtickCount) + char;
        } else {
          currentDisplayText += '`'.repeat(parserState.current.backtickCount) + char;
        }
        parserState.current.backtickCount = 0;
      } else {
        parserState.current.backtickCount = 0;

        if (parserState.current.inCodeBlock) {
          parserState.current.codeBlockContent += char;
          if (i % 10 === 0 || i === chunk.length - 1) {
            setStreamingCode(parserState.current.codeBlockContent);
          }
        } else {
          currentDisplayText += char;
        }
      }
    }

    if (parserState.current.inCodeBlock) {
      setStreamingCode(parserState.current.codeBlockContent);
    }

    if (currentDisplayText) {
      setCurrentStreamedText(prev => prev + currentDisplayText);
    }
  }

  async function sendMessage() {
    if (input.trim()) {
      // Reset dependency parsing state
      setPendingDependencyChunk('');
      setInDependencyMode(false);
      
      // Add user message
      setMessages((prev) => [...prev, { text: input, type: 'user' }]);
      setInput('');
      setIsGenerating(true);
      setCurrentStreamedText(''); // Reset streamed text
      setStreamingCode(''); // Reset streaming code
      setCompletedCode(''); // Reset completed code
      setIsStreaming(true); // Start streaming state
      
      // Reset parser state
      parserState.current = {
        inCodeBlock: false,
        codeBlockContent: '',
        backtickCount: 0,
        languageId: '',
        inDependencies: false,
        dependenciesContent: '',
        fullResponseBuffer: '',
        dependencies: {},
        dependencyRanges: []
      };

      try {
        // Build message history
        const messageHistory = buildMessageHistory();

        // Call OpenRouter API with streaming enabled
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
            stream: true, // Enable streaming
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

        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`);
        }

        const reader = response.body?.getReader();
        if (!reader) {
          throw new Error('Response body is not readable');
        }

        const decoder = new TextDecoder();

        // Process the stream
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          
          // Decode the chunk
          const chunk = decoder.decode(value, { stream: true });
          
          // Process each line (each SSE event)
          const lines = chunk.split('\n');
          for (const line of lines) {
            if (line.startsWith('data: ') && line !== 'data: [DONE]') {
              try {
                const data = JSON.parse(line.substring(6));
                if (data.choices && data.choices[0]?.delta?.content) {
                  const content = data.choices[0].delta.content;
                  console.log('Received content chunk:', content);
                  processStreamChunk(content);
                }
              } catch (e) {
                console.error('Error parsing chunk:', e);
              }
            }
          }
        }

        // When stream completes, finalize code and dependencies
        const generatedCode = parserState.current.codeBlockContent || completedCode;
        const dependencies = parserState.current.dependencies;
        
        console.log('Final dependencies collected:', dependencies);
        console.log('Final streamed text before trim:', currentStreamedText);
        
        // Apply more aggressive cleanup to the final message
        let cleanedExplanation = currentStreamedText;

        // 1. Remove any string that looks like a partial dependency declaration
        const patterns = [
          /\{\s*"[^"]*"\s*:\s*"[^"]*"\s*\}\}/g,            // Full JSON object
          /\{\s*"[^"]*"\s*:\s*"[^"]*"\s*\}/g,              // JSON object without }}
          /"[^"]*"\s*:\s*"[^"]*"\s*\}/g,                   // Partial JSON without leading {
          /-[^"]*"\s*:\s*"[^"]*"/g,                         // Package name fragment with -
          /icons"\s*:\s*"[^"]*"/g,                         // "icons":"version" fragment 
          /\{\s*"react[^}]*\}/g,                           // Any JSON with react
          /^[^#\n]*"[^"]*"\s*:\s*"[^"]*"[^#\n]*$/gm        // Any line containing "key":"value"
        ];

        // Apply all cleanup patterns
        patterns.forEach(pattern => {
          cleanedExplanation = cleanedExplanation.replace(pattern, '');
        });

        // 2. Remove any line that might contain part of a dependency declaration
        cleanedExplanation = cleanedExplanation
          .split('\n')
          .filter(line => {
            const trimmed = line.trim();
            // Skip suspicious lines 
            return !(
              // Has package-like pattern
              (trimmed.includes('"') && trimmed.includes(':') && !trimmed.includes('```')) ||
              // Starts with suspicious characters for dependency fragments
              trimmed.startsWith('-') || 
              trimmed.startsWith('{') ||
              // Is just a closing brace at start of line
              trimmed.startsWith('}}')
            );
          })
          .join('\n');

        // 3. Do a simple capitalization-based cleanup - most artifact fragments are lowercase,
        // while real content usually starts with uppercase or # character
        const lines = cleanedExplanation.split('\n');
        if (lines.length > 0 && lines[0].trim() && 
           !lines[0].trim().startsWith('#') && 
           !lines[0].trim()[0].match(/[A-Z]/)) {
          // First line doesn't start with # or uppercase - likely a fragment
          lines.shift();
        }
        cleanedExplanation = lines.join('\n');

        setMessages((prev) => [
          ...prev,
          {
            text: cleanedExplanation || "Here's your generated app:",
            type: 'ai',
            code: generatedCode,
            dependencies,
          },
        ]);

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
        setIsStreaming(false);
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
    streamingCode,
    completedCode,
    isStreaming,
    inputRef,
    messagesEndRef,
    autoResizeTextarea,
    scrollToBottom,
    sendMessage,
    parserState
  };
} 