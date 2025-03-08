import { vi, describe, it, expect, beforeEach } from 'vitest';
import { useChatSessions } from '../app/hooks/useChatSessions';

// Mock Fireproof
vi.mock('use-fireproof', () => ({
  useFireproof: () => ({}),
}));

// Mock React hooks
vi.mock('react', async () => {
  const actual = await vi.importActual('react');
  return {
    ...actual,
    useState: vi.fn().mockImplementation((initialValue) => [initialValue, vi.fn()]),
    useEffect: vi.fn(),
    useCallback: vi.fn().mockImplementation((fn) => fn),
  };
});

describe('useChatSessions - Basic Functionality', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // Mock localStorage
    const localStorageMock = {
      getItem: vi.fn(),
      setItem: vi.fn(),
      removeItem: vi.fn(),
      clear: vi.fn(),
    };
    Object.defineProperty(window, 'localStorage', { value: localStorageMock });
  });

  it('returns the expected functions and properties', () => {
    // Call the hook
    const result = useChatSessions();

    // Check that the hook returns the expected properties
    expect(result).toHaveProperty('currentSessionId');
    expect(result).toHaveProperty('saveSession');
    expect(result).toHaveProperty('loadSession');
    expect(result).toHaveProperty('createNewSession');

    // Check that the functions are defined
    expect(typeof result.saveSession).toBe('function');
    expect(typeof result.loadSession).toBe('function');
    expect(typeof result.createNewSession).toBe('function');
  });
});
