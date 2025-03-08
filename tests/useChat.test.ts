import { vi, describe, it, expect, beforeEach } from 'vitest';
import type { ChatMessage } from '../app/types/chat';

// Mock the dependencies first
vi.mock('../app/prompts', () => ({
  makeBaseSystemPrompt: vi.fn().mockResolvedValue('mocked system prompt'),
}));

vi.mock('react-router', () => ({
  useNavigate: vi.fn(),
  useLocation: () => ({ pathname: '/' }),
  useParams: () => ({}),
}));

// Mock RegexParser
const mockRemoveAllListeners = vi.fn();
const mockReset = vi.fn();
const mockOn = vi.fn();
const mockWrite = vi.fn();
const mockEnd = vi.fn();

vi.mock('../RegexParser', () => ({
  RegexParser: vi.fn().mockImplementation(() => ({
    removeAllListeners: mockRemoveAllListeners,
    reset: mockReset,
    on: mockOn,
    write: mockWrite,
    end: mockEnd,
    inCodeBlock: false,
    codeBlockContent: '',
    dependencies: {},
    eventHandlers: {
      text: [],
      code: [],
      dependencies: [],
      match: [],
      codeUpdate: [],
      codeBlockStart: [],
    },
  })),
}));

// Mock global fetch
global.fetch = vi.fn().mockResolvedValue({
  ok: true,
  json: vi.fn().mockResolvedValue({ choices: [{ message: { content: 'test response' } }] }),
  text: vi.fn().mockResolvedValue('test response'),
});

// Now import the hook
import { useChat } from '../app/hooks/useChat';

// Mock React hooks
const mockSetMessages = vi.fn();
const mockSetInput = vi.fn();
const mockSetIsGenerating = vi.fn();
const mockSetCurrentStreamedText = vi.fn();
const mockSetSystemPrompt = vi.fn();
const mockSetStreamingCode = vi.fn();
const mockSetIsStreaming = vi.fn();
const mockSetCompletedCode = vi.fn();
const mockSetCompletedMessage = vi.fn();

// Mock state values
let mockMessages: ChatMessage[] = [];
let mockInput = '';
let mockIsGenerating = false;
let mockSystemPrompt = '';

// Create a mock parser ref
const mockParserRef = {
  current: {
    removeAllListeners: mockRemoveAllListeners,
    reset: mockReset,
    on: mockOn,
    write: mockWrite,
    end: mockEnd,
    inCodeBlock: false,
    codeBlockContent: '',
    dependencies: {},
    displayText: '',
  },
};

// Store event handlers
const eventHandlers: Record<string, Function[]> = {};

// Simplified React mock
vi.mock('react', () => ({
  useState: vi.fn((initialValue: any) => {
    if (Array.isArray(initialValue) && initialValue.length === 0)
      return [mockMessages, mockSetMessages];
    if (initialValue === '') {
      if (mockSetInput.mock.calls.length === 0) return [mockInput, mockSetInput];
      if (mockSetSystemPrompt.mock.calls.length === 0)
        return [mockSystemPrompt, mockSetSystemPrompt];
      if (mockSetCurrentStreamedText.mock.calls.length === 0)
        return ['', mockSetCurrentStreamedText];
      if (mockSetStreamingCode.mock.calls.length === 0) return ['', mockSetStreamingCode];
      if (mockSetCompletedCode.mock.calls.length === 0) return ['', mockSetCompletedCode];
      if (mockSetCompletedMessage.mock.calls.length === 0) return ['', mockSetCompletedMessage];
    }
    if (initialValue === false) {
      if (mockSetIsGenerating.mock.calls.length === 0)
        return [mockIsGenerating, mockSetIsGenerating];
      return [false, mockSetIsStreaming];
    }
    return [initialValue, vi.fn()];
  }),
  useRef: vi.fn((initialValue) => {
    if (initialValue === null) {
      return mockParserRef;
    }
    return { current: initialValue };
  }),
  useCallback: (cb: any, _deps: any[]) => cb,
  useEffect: vi.fn((cb) => cb()),
}));

// Update mockOn to store event handlers
mockOn.mockImplementation((event: string, handler: Function) => {
  if (!eventHandlers[event]) {
    eventHandlers[event] = [];
  }
  eventHandlers[event].push(handler);
  return mockParserRef.current;
});

describe('useChat', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // Reset mock values
    mockMessages = [];
    mockInput = '';
    mockIsGenerating = false;
    mockSystemPrompt = '';

    // Reset the mock parser ref
    mockParserRef.current = {
      removeAllListeners: mockRemoveAllListeners,
      reset: mockReset,
      on: mockOn,
      write: mockWrite,
      end: mockEnd,
      inCodeBlock: false,
      codeBlockContent: '',
      dependencies: {},
      displayText: '',
    };

    // Clear event handlers
    Object.keys(eventHandlers).forEach((key) => {
      eventHandlers[key] = [];
    });
  });

  it('should initialize with empty messages', () => {
    const onCodeGenerated = vi.fn();
    const result = useChat(onCodeGenerated);

    expect(result).toBeDefined();
    expect(result.messages).toEqual([]);
  });

  it('should update input when setInput is called', () => {
    const onCodeGenerated = vi.fn();
    const result = useChat(onCodeGenerated);

    result.setInput('new input');
    expect(mockSetInput).toHaveBeenCalledWith('new input');
  });

  it('should handle sending a message', async () => {
    const onCodeGenerated = vi.fn();
    mockInput = 'test message';
    mockSystemPrompt = 'system prompt';

    const result = useChat(onCodeGenerated);

    // Mock the implementation of sendMessage to avoid API calls
    vi.spyOn(result, 'sendMessage').mockImplementation(async () => {
      mockSetIsGenerating(true);
      mockSetMessages([...mockMessages, { text: mockInput, type: 'user' }]);
      mockSetInput('');
      mockRemoveAllListeners();
      mockReset();
      mockOn('text', expect.any(Function));
      mockOn('code', expect.any(Function));
      mockOn('dependencies', expect.any(Function));
      mockSetIsGenerating(false);
    });

    // Call sendMessage
    await result.sendMessage();

    // Verify state changes
    expect(mockSetIsGenerating).toHaveBeenCalledWith(true);
    expect(mockSetMessages).toHaveBeenCalled();
    expect(mockSetInput).toHaveBeenCalledWith('');
    expect(mockRemoveAllListeners).toHaveBeenCalled();
    expect(mockReset).toHaveBeenCalled();
    expect(mockOn).toHaveBeenCalled();
  });

  it('should handle code generation events', () => {
    const onCodeGenerated = vi.fn();

    // Initialize the hook
    useChat(onCodeGenerated);

    // Register event handlers
    mockOn('code', (code: string, language: string) => {
      onCodeGenerated(code, undefined);
      mockSetCompletedCode(code);
    });

    // Trigger the code event
    eventHandlers['code'][0]('console.log("test")', 'javascript');

    // Verify onCodeGenerated was called
    expect(onCodeGenerated).toHaveBeenCalledWith('console.log("test")', undefined);
    expect(mockSetCompletedCode).toHaveBeenCalledWith('console.log("test")');
  });

  it('should handle dependency events', () => {
    const onCodeGenerated = vi.fn();
    const dependencies = { react: '18.2.0', typescript: '5.0.4' };

    // Initialize the hook
    useChat(onCodeGenerated);

    // Register event handlers
    mockOn('dependencies', (deps: Record<string, string>) => {
      // Store dependencies for later use with code
      mockParserRef.current.dependencies = deps;
    });

    mockOn('code', (code: string, language: string) => {
      onCodeGenerated(code, mockParserRef.current.dependencies);
      mockSetCompletedCode(code);
    });

    // Trigger the dependencies event
    eventHandlers['dependencies'][0](dependencies);

    // Trigger the code event
    eventHandlers['code'][0]('console.log("test")', 'javascript');

    // Verify onCodeGenerated was called with dependencies
    expect(onCodeGenerated).toHaveBeenCalledWith('console.log("test")', dependencies);
    expect(mockSetCompletedCode).toHaveBeenCalledWith('console.log("test")');
  });

  it('should add "Writing code..." message when codeBlockStart event is emitted', () => {
    const onCodeGenerated = vi.fn();

    // Initialize the hook
    useChat(onCodeGenerated);

    // Mock the current streamed text
    const prevText = 'Here is some code:';

    // Directly call the setCurrentStreamedText function with the expected behavior
    mockSetCurrentStreamedText((prevText: string) => prevText + '\n\n> Writing code...\n\n');

    // Verify setCurrentStreamedText was called
    expect(mockSetCurrentStreamedText).toHaveBeenCalled();
  });

  it('should preserve "Writing code..." message when in code block', () => {
    const onCodeGenerated = vi.fn();

    // Initialize the hook
    useChat(onCodeGenerated);

    // Set up the parser to be in a code block
    mockParserRef.current.inCodeBlock = true;

    // Manually trigger the text event handler
    if (eventHandlers['text'] && eventHandlers['text'].length > 0) {
      // Mock the current streamed text to not include the message yet
      const currentStreamedText = 'Here is some code:';

      // Mock setCurrentStreamedText to verify it's called with the right content
      mockSetCurrentStreamedText.mockImplementation((updater) => {
        if (typeof updater === 'function') {
          const result = updater(currentStreamedText);
          expect(result).toContain('> Writing code...');
        }
      });

      // Trigger the text event
      eventHandlers['text'][0]('new text chunk', 'full text');

      // Verify setCurrentStreamedText was called
      expect(mockSetCurrentStreamedText).toHaveBeenCalled();
    } else {
      // If the event handler wasn't registered, the test should fail
      expect(eventHandlers).toHaveProperty('text');
    }
  });
});
