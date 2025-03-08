import { vi, describe, it, expect, beforeEach } from 'vitest';
import type { ChatMessage, SessionDocument } from '../app/types/chat';

// Mock the database operations
const mockPut = vi.fn().mockImplementation((doc) => Promise.resolve({ id: doc._id || 'test-id' }));
const mockGet = vi
  .fn()
  .mockImplementation((id) =>
    Promise.resolve({ _id: id, title: 'Test Session', timestamp: Date.now() })
  );

// Mock Fireproof
vi.mock('use-fireproof', () => ({
  useFireproof: () => ({
    database: {
      put: mockPut,
      get: mockGet,
    },
  }),
}));

// Mock React hooks
vi.mock('react', async () => {
  const actual = await vi.importActual('react');
  return {
    ...actual,
    useState: vi.fn().mockImplementation((initialValue) => {
      let value = initialValue;
      const setState = vi.fn((newValue) => {
        value = newValue;
      });
      return [value, setState];
    }),
    useCallback: vi.fn().mockImplementation((fn) => fn),
  };
});

// Import the hook
import { useChatSessions } from '../app/hooks/useChatSessions';

describe('useChatSessions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('initializes with correct default values', () => {
    const result = useChatSessions();

    expect(result.currentSessionId).toBe(null);
    expect(typeof result.saveSession).toBe('function');
    expect(typeof result.loadSession).toBe('function');
    // createNewSession is no longer part of the API
    expect(result).not.toHaveProperty('createNewSession');
  });

  it('initializes with provided sessionId', () => {
    const result = useChatSessions('test-session-id');
    expect(result.currentSessionId).toBe('test-session-id');
  });

  it('saves a session without sessionId', async () => {
    const mockCallback = vi.fn();
    const result = useChatSessions(null, mockCallback);

    const messages: ChatMessage[] = [
      { text: 'Hello', type: 'user' },
      { text: 'Hi there!', type: 'ai' },
    ];

    await result.saveSession(messages);

    expect(mockPut).toHaveBeenCalledWith(
      expect.objectContaining({
        title: 'Hello',
        messages,
      })
    );

    // Check that callback was called with the new session ID
    expect(mockCallback).toHaveBeenCalledWith('test-id');
  });

  it('saves a session with sessionId', async () => {
    const mockCallback = vi.fn();
    const result = useChatSessions('existing-session', mockCallback);

    const messages: ChatMessage[] = [
      { text: 'Hello', type: 'user' },
      { text: 'Hi there!', type: 'ai' },
    ];

    await result.saveSession(messages);

    expect(mockPut).toHaveBeenCalledWith(
      expect.objectContaining({
        _id: 'existing-session',
        title: 'Hello',
        messages,
      })
    );

    // Callback should not be called when updating existing session
    expect(mockCallback).not.toHaveBeenCalled();
  });

  it('loads a session', async () => {
    const mockCallback = vi.fn();
    const result = useChatSessions(null, mockCallback);

    const session: SessionDocument = {
      _id: 'test-session',
      title: 'Test Session',
      timestamp: Date.now(),
    };

    await result.loadSession(session);

    // Check that the get method was called
    expect(mockGet).toHaveBeenCalledWith('test-session');

    // Check that callback was called with the session ID
    expect(mockCallback).toHaveBeenCalledWith('test-session');
  });
});
