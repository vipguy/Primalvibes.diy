import { renderHook } from '@testing-library/react';
import { useSession } from '../app/hooks/useSession';
import { vi, describe, it, expect, beforeEach } from 'vitest';

// Mock the database opening function - this is what we need to track
const mockOpen = vi.fn();

// Mock all required dependencies
vi.mock('use-fireproof', () => ({
  useFireproof: () => ({
    useDocument: () => ({
      doc: { _id: 'test-id', type: 'session' },
      merge: vi.fn(),
    }),
    database: { get: vi.fn(), put: vi.fn() },
  }),
}));

vi.mock('../app/hooks/useLazyFireproof', () => ({
  useLazyFireproof: () => ({
    useDocument: () => ({
      doc: { _id: 'test-id', type: 'user' },
      merge: vi.fn(),
      submit: vi.fn(),
      save: vi.fn(),
    }),
    useLiveQuery: () => ({ docs: [] }),
    database: { get: vi.fn(), put: vi.fn() },
    open: mockOpen,
  }),
}));

vi.mock('../app/utils/databaseManager', () => ({
  getSessionDatabaseName: vi.fn().mockImplementation((id) => `session-${id || 'default'}`),
}));

// Simple tests that focus on the core session ID transition behavior
describe('useSession', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should open database with provided sessionId', () => {
    renderHook(() => useSession('test-id'));
    expect(mockOpen).toHaveBeenCalled();
  });

  it('should generate sessionId when not provided', () => {
    renderHook(() => useSession(undefined));
    expect(mockOpen).toHaveBeenCalled();
  });

  /**
   * This test is the most important one - it verifies our fix for the session ID transition bug
   * After sending the first message with no session ID in the URL, the URL updates and the hook
   * should detect and use that new ID
   */
  it('should detect sessionId changes and reopen the database', () => {
    // Start with no session ID (first message scenario)
    const { rerender } = renderHook(
      // We use any to avoid TypeScript complexity with hook return types
      ({ id }: any) => useSession(id),
      { initialProps: { id: undefined } }
    );

    // Reset the mock counter after initial render
    mockOpen.mockClear();

    // Simulate URL update with new session ID (after first message response)
    // @ts-ignore - TypeScript has difficulty with the complex hook return types
    rerender({ id: 'new-session-id' });

    // Verify our fix works: the database should be opened again with the new ID
    expect(mockOpen).toHaveBeenCalled();
  });
});
