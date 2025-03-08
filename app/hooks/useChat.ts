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
    
    // Handle dependency chunks that come in parts
    if (inDependencyMode || chunk.trim().startsWith('{"') || pendingDependencyChunk) {
      // Accumulate dependency JSON chunks
      const combinedChunk = pendingDependencyChunk + chunk;
      
      // Check if this completes a dependency declaration
      if (combinedChunk.includes('}}')) {
        const endIndex = combinedChunk.indexOf('}}') + 2;
        const dependencyPart = combinedChunk.substring(0, endIndex);
        
        try {
          // Clean and parse the dependency part
          let dependencyJson = dependencyPart;
          if (dependencyJson.endsWith('}}')) {
            dependencyJson = dependencyJson.substring(0, dependencyJson.length - 1); // Remove extra }
          }
          
          console.log('Attempting to parse combined dependency:', dependencyJson);
          const depsObject = JSON.parse(dependencyJson);
          
          // Add dependencies
          Object.keys(depsObject).forEach(key => {
            parserState.current.dependencies[key] = depsObject[key];
          });
          
          console.log('Added dependencies:', parserState.current.dependencies);
          
          // Process any remaining content after the dependency part
          const remainingContent = combinedChunk.substring(endIndex);
          if (remainingContent.trim()) {
            // Process the remaining content normally
            console.log('Processing remaining content:', remainingContent);
            
            // Recursively process the remaining content
            setInDependencyMode(false);
            setPendingDependencyChunk('');
            processStreamChunk(remainingContent);
          } else {
            setInDependencyMode(false);
            setPendingDependencyChunk('');
          }
          
          // Don't continue processing this chunk since we've handled it
          return;
        } catch (e) {
          console.error('Failed to parse combined dependency:', e);
          
          // If we can't parse it, check if it's a partial dependency
          if (combinedChunk.startsWith('{"') && !combinedChunk.includes('}}}')) {
            // Still looks like a dependency - keep accumulating
            setPendingDependencyChunk(combinedChunk);
            setInDependencyMode(true);
            return;
          }
        }
      } else if (combinedChunk.startsWith('{"')) {
        // Looks like a dependency but not complete - keep accumulating
        setPendingDependencyChunk(combinedChunk);
        setInDependencyMode(true);
        return;
      }
    }
    
    // Existing code for handling completed chunks/dependency sections
    if (chunk.includes('}}')) {
      const contentIndex = chunk.indexOf('}}') + 2;
      chunk = chunk.substring(contentIndex);
      console.log('Skipped dependency part, now processing:', chunk);
    }
    
    // Attempt to remove any stray dependency JSON that might have slipped through
    if (/\{\s*"[^"]+"\s*:\s*"[^"]+/.test(chunk) && !chunk.includes('```')) {
      const matched = chunk.match(/\{\s*"[^"]+"\s*:\s*"[^"]+".*?([\}\n]|$)/);
      if (matched && matched.index === 0) {
        console.log('Ignoring apparent dependency fragment:', chunk);
        return;
      }
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

          // Clean up the code content
          let cleanedCode = parserState.current.codeBlockContent;
          const firstLineBreak = cleanedCode.indexOf('\n');
          if (firstLineBreak > -1) {
            const firstLine = cleanedCode.substring(0, firstLineBreak).trim();
            if (['js', 'jsx', 'javascript', 'ts', 'typescript'].includes(firstLine)) {
              cleanedCode = cleanedCode.substring(firstLineBreak + 1);
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
        
        // Use the already cleaned streamed text
        const explanation = currentStreamedText.trim();
        
        console.log('Final explanation after trim:', explanation);

        setMessages((prev) => [
          ...prev,
          {
            text: explanation || "Here's your generated app:",
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