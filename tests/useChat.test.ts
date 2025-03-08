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

// Mock fetch for API calls
vi.mock('global', () => ({
  fetch: vi.fn().mockResolvedValue({
    ok: true,
    body: {
      getReader: () => {
        let count = 0;
        return {
          read: () =>
            Promise.resolve(
              count++ < 1
                ? {
                    done: false,
                    value: new TextEncoder().encode(
                      'data: {"choices":[{"delta":{"content":"hello"}}]}\n'
                    ),
                  }
                : { done: true, value: undefined }
            ),
        };
      },
    },
  }),
}));

// Now import the hook
import { useChat } from '../app/hooks/useChat';

// Mock React hooks
const mockSetState = vi.fn();
vi.mock('react', () => ({
  useState: (initialValue: any) => [initialValue, mockSetState],
  useRef: vi.fn(() => ({ current: { focus: vi.fn() } })),
  useCallback: (cb: any) => cb,
  useEffect: vi.fn((cb) => cb()),
}));

describe('useChat', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should initialize with empty messages', () => {
    const onCodeGenerated = vi.fn();
    const result = useChat(onCodeGenerated);
    
    expect(result).toBeDefined();
    expect(result.messages).toEqual([]);
  });
}); 