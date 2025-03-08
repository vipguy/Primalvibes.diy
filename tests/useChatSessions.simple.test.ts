import { vi, describe, it, expect, beforeEach } from 'vitest';
import { useChatSessions } from '../app/hooks/useChatSessions';

// Mock Fireproof
vi.mock('use-fireproof', () => ({
  useFireproof: () => ({
    useDocument: vi.fn().mockReturnValue({
      doc: null,
      loading: false,
      error: null,
      save: vi.fn().mockImplementation((doc) => Promise.resolve({ ...doc, _id: doc._id || 'test-id' })),
    }),
    useFind: vi.fn().mockReturnValue({
      docs: [
        { _id: 'session-1', title: 'Session 1', timestamp: Date.now() - 1000 },
        { _id: 'session-2', title: 'Session 2', timestamp: Date.now() },
      ],
      loading: false,
      error: null,
    }),
    useIndex: vi.fn().mockReturnValue({
      index: { delete: vi.fn().mockResolvedValue(true) },
    }),
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