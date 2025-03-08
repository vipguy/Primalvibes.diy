import { vi, describe, it, expect, beforeEach } from 'vitest';
import { useChat } from '../app/hooks/useChat';

// Mock the dependencies
vi.mock('../app/prompts', () => ({
  makeBaseSystemPrompt: vi.fn().mockResolvedValue('mocked system prompt'),
}));

vi.mock('react-router', () => ({
  useNavigate: vi.fn(),
  useLocation: () => ({ pathname: '/' }),
  useParams: () => ({}),
}));

// Mock RegexParser
vi.mock('../RegexParser', () => ({
  RegexParser: vi.fn().mockImplementation(() => ({
    removeAllListeners: vi.fn(),
    reset: vi.fn(),
    on: vi.fn(),
    write: vi.fn(),
    end: vi.fn(),
    inCodeBlock: false,
    codeBlockContent: '',
    dependencies: {},
  })),
}));

// Mock React hooks
vi.mock('react', () => {
  const originalReact = vi.importActual('react');
  return {
    ...originalReact,
    useState: vi.fn().mockImplementation((initialValue) => [initialValue, vi.fn()]),
    useRef: vi.fn().mockImplementation((initialValue) => ({ current: initialValue })),
    useCallback: vi.fn().mockImplementation((fn) => fn),
    useEffect: vi.fn(),
  };
});

describe('useChat - Basic Functionality', () => {
  const mockOnCodeGenerated = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    global.fetch = vi.fn();
  });

  it('initializes with correct default values', () => {
    // Call the hook
    const result = useChat(mockOnCodeGenerated);

    // Check that the hook returns the expected properties
    expect(result).toHaveProperty('messages');
    expect(result).toHaveProperty('input');
    expect(result).toHaveProperty('setInput');
    expect(result).toHaveProperty('isGenerating');
    expect(result).toHaveProperty('sendMessage');

    // Check default values
    expect(result.messages).toEqual([]);
    expect(result.input).toBe('');
    expect(result.isGenerating).toBe(false);
  });
});
