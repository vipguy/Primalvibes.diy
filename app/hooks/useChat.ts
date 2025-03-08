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
  const [pendingTextBuffer, setPendingTextBuffer] = useState('');
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
      const combinedChunk = pendingDependencyChunk + chunk;
      
      // Check if this chunk contains a markdown heading (false positive)
      if (combinedChunk.includes('#') && !combinedChunk.includes('}}')) {
        console.log('Found # character before dependency end, might be a heading - exiting dependency mode');
        // This might be a heading, not a dependency section
        setInDependencyMode(false);
        setPendingDependencyChunk('');
        parserState.current.fullResponseBuffer += combinedChunk;
        processDisplayText(combinedChunk);
        console.log('Leaving dependency mode. Current dependencies:', parserState.current.dependencies);
        return;
      }
      
      // Only process further if we see the end of the dependency declaration
      if (combinedChunk.includes('}}')) {
        const endIndex = combinedChunk.indexOf('}}') + 2;
        const dependencyPart = combinedChunk.substring(0, endIndex);
        const afterJson = combinedChunk.substring(endIndex);
        
        // First try to extract dependencies using regex - more reliable for fragments
        const matches = dependencyPart.match(/"([^"]+)"\s*:\s*"([^"]+)"/g);
        if (matches) {
          matches.forEach(match => {
            const keyMatch = match.match(/"([^"]+)"\s*:/);
            const valueMatch = match.match(/:\s*"([^"]+)"/);
            
            if (keyMatch && keyMatch[1] && valueMatch && valueMatch[1]) {
              const key = keyMatch[1].trim();
              const value = valueMatch[1].trim();
              
              // Skip empty keys and values
              if (key && value && key !== "" && value !== "") {
                parserState.current.dependencies[key] = value;
                console.log(`Added dependency via regex: ${key} = ${value}`);
              } else {
                console.log(`Skipping empty dependency key or value: ${key}=${value}`);
              }
            }
          });
        }
        
        // Reset dependency mode
        setInDependencyMode(false);
        setPendingDependencyChunk('');
        console.log('Leaving dependency mode. Final dependencies:', parserState.current.dependencies);
        
        // Process remaining content if any
        if (afterJson.trim()) {
          // Add to response buffer for code extraction later
          parserState.current.fullResponseBuffer += afterJson;
          processDisplayText(afterJson);
        }
      } else {
        // Still collecting dependencies
        setPendingDependencyChunk(combinedChunk);
      }
      
      return;
    }
    
    // Helper to process display text (extract non-display parts to avoid duplication)
    function processDisplayText(text) {
      for (let i = 0; i < text.length; i++) {
        const char = text[i];
        if (char === '`') {
          parserState.current.backtickCount++;
          if (parserState.current.backtickCount === 3) {
            if (!parserState.current.inCodeBlock) {
              // Start of code block, don't add backticks to display text
              parserState.current.inCodeBlock = true;
              parserState.current.backtickCount = 0;
              i = skipLanguageIdentifier(text, i + 1);
            } else {
              // End of code block
              parserState.current.inCodeBlock = false;
              parserState.current.backtickCount = 0;
            }
          }
        } else if (parserState.current.backtickCount > 0) {
          if (parserState.current.inCodeBlock) {
            parserState.current.codeBlockContent += '`'.repeat(parserState.current.backtickCount) + char;
          } else {
            currentDisplayText += '`'.repeat(parserState.current.backtickCount) + char;
          }
          parserState.current.backtickCount = 0;
        } else {
          if (parserState.current.inCodeBlock) {
            parserState.current.codeBlockContent += char;
          } else {
            currentDisplayText += char;
          }
        }
      }
      
      if (currentDisplayText) {
        setCurrentStreamedText(prev => prev + currentDisplayText);
      }
      
      if (parserState.current.inCodeBlock) {
        setStreamingCode(parserState.current.codeBlockContent);
      }
    }
    
    // Helper function to skip language identifier after code block start
    function skipLanguageIdentifier(text, startIndex) {
      let j = startIndex;
      while (j < text.length && text[j] !== '\n') {
        j++;
      }
      
      if (j < text.length) {
        parserState.current.languageId = text.substring(startIndex, j).trim();
        return j; // Skip to after the newline
      }
      
      return startIndex; // Couldn't find newline, just return the start
    }
    
    // Check for various patterns that indicate dependency data
    const isDependencyChunk = (chunk) => {
      // If we're not in dependency mode yet and the chunk contains "}}",
      // process it specially to extract both dependencies and text
      if (!inDependencyMode && chunk.includes('}}')) {
        const endIndex = chunk.indexOf('}}') + 2;
        const beforePart = chunk.substring(0, endIndex);
        const afterPart = chunk.substring(endIndex);
        
        console.log('Processing mixed chunk with both dependency and content:', 
                    'Dep part:', beforePart, 'Content part:', afterPart);
        
        // Extract dependencies from the dependency part
        const matches = beforePart.match(/"([^"]+)"\s*:\s*"([^"]+)"/g);
        if (matches) {
          matches.forEach(match => {
            const keyMatch = match.match(/"([^"]+)"\s*:/);
            const valueMatch = match.match(/:\s*"([^"]+)"/);
            
            if (keyMatch && keyMatch[1] && valueMatch && valueMatch[1]) {
              const key = keyMatch[1].trim();
              const value = valueMatch[1].trim();
              
              // Skip empty keys and values
              if (key && value && key !== "" && value !== "") {
                parserState.current.dependencies[key] = value;
                console.log(`Added dependency via regex: ${key} = ${value}`);
              } else {
                console.log(`Skipping empty dependency key or value: ${key}=${value}`);
              }
            }
          });
        }
        
        // Process the after part normally - store the full content for the next processing step
        setPendingTextBuffer(afterPart);
        
        // We've handled this chunk completely
        return false;
      }
      
      // Standard dependency detection for chunks without split
      return (
        // Package name fragment - includes quotes and : but not at beginning
        (chunk.includes('"') && chunk.includes(':') && !chunk.includes('```')) ||
        // Start of package object
        chunk.trim().startsWith('{') || 
        // Fragment starting with "-" followed by package name
        (chunk.trim().startsWith('-') && chunk.includes('"'))
      );
    };

    if (isDependencyChunk(chunk)) {
      console.log('Dependency chunk detected, setting mode and accumulating:', chunk);
      setPendingDependencyChunk(pendingDependencyChunk + chunk);
      setInDependencyMode(true);
      return;
    }
    
    // Not in dependency mode, process as normal text/code
    parserState.current.fullResponseBuffer += chunk;

    // If we have pending text from a previous dependency chunk, prepend it
    if (pendingTextBuffer) {
      const fullChunk = pendingTextBuffer + chunk;
      setPendingTextBuffer(''); // Reset the buffer
      processDisplayText(fullChunk);
    } else {
      processDisplayText(chunk);
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
        
        // Clean up the message text - remove any leading noise
        let cleanedMessage = currentStreamedText;
        
        // Remove any artifacts at the beginning that look like malformed JSON
        cleanedMessage = cleanedMessage.replace(/^\s*:""[}\s]*/, '');
        cleanedMessage = cleanedMessage.replace(/^\s*""\s*:\s*""[}\s]*/, '');
        
        // Clean up any extra whitespace at the beginning
        cleanedMessage = cleanedMessage.trimStart();
        
        // Add AI response with code and dependencies
        setMessages((prev) => [
          ...prev,
          {
            text: cleanedMessage || "Here's your generated app:",
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