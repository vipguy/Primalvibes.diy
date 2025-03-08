import { vi, describe, it, expect, beforeEach } from 'vitest';
import { useChatSessions } from '../app/hooks/useChatSessions';

// Mock Fireproof
vi.mock('use-fireproof', () => ({
  useFireproof: () => ({
    database: {
      put: vi.fn().mockResolvedValue({ id: 'test-id' }),
      get: vi.fn().mockResolvedValue({ _id: 'test-id', messages: [] }),
    },
  }),
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
    // Call the hook with no parameters
    const result = useChatSessions();

    // Check that the hook returns the expected properties
    expect(result).toHaveProperty('currentSessionId');
    expect(result).toHaveProperty('saveSession');
    expect(result).toHaveProperty('loadSession');

    // Check that createNewSession is no longer returned
    expect(result).not.toHaveProperty('createNewSession');

    // Check that the functions are defined
    expect(typeof result.saveSession).toBe('function');
    expect(typeof result.loadSession).toBe('function');
  });

  it('accepts sessionId parameter', () => {
    // Call the hook with a sessionId
    const result = useChatSessions('test-session-id');

    // Check that currentSessionId matches the provided value
    expect(result.currentSessionId).toBe('test-session-id');
  });

  it('accepts onSessionCreated callback', async () => {
    // Create a mock callback
    const mockCallback = vi.fn();

    // Call the hook with the callback
    const result = useChatSessions(null, mockCallback);

    // Simulate saving a new session
    await result.saveSession([{ text: 'Test message', type: 'user' }]);

    // Check that the callback was called with the new session ID
    expect(mockCallback).toHaveBeenCalledWith('test-id');
  });
});
