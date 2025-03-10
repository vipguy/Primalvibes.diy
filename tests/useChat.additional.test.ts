import { vi } from 'vitest';

// Mock React first
vi.mock('react', () => {
  return {
    useState: vi.fn((initialValue) => [initialValue, vi.fn()]),
    useEffect: vi.fn((callback) => { callback(); return undefined; }),
    useRef: vi.fn((initialValue) => ({ current: initialValue })),
    useCallback: vi.fn((callback) => callback),
  };
});

// Mock other dependencies
vi.mock('../app/prompts', () => ({
  makeBaseSystemPrompt: vi.fn().mockResolvedValue('mocked system prompt'),
}));

vi.mock('react-router', () => ({
  useNavigate: vi.fn(),
  useLocation: () => ({ pathname: '/' }),
  useParams: () => ({}),
}));

vi.mock('../RegexParser', () => ({
  RegexParser: vi.fn().mockImplementation(() => ({
    removeAllListeners: vi.fn(),
    reset: vi.fn(),
    on: vi.fn().mockReturnThis(),
    write: vi.fn(),
    end: vi.fn(),
  })),
}));

// Only import from other modules after all mocks are defined
import { describe, it, expect } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useChat } from '../app/hooks/useChat';

// Simple test for useChat functionality
describe('useChat additional functionality', () => {
  it('initializes with expected properties', () => {
    const onCodeGenerated = vi.fn();
    
    const { result } = renderHook(() => useChat(onCodeGenerated));
    
    // Check that it exposes expected properties
    expect(result.current).toHaveProperty('messages');
    expect(result.current).toHaveProperty('input');
    expect(result.current).toHaveProperty('setInput');
    expect(result.current).toHaveProperty('sendMessage');
  });
});
