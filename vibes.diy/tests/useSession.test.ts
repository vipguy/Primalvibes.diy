import { renderHook, waitFor } from "@testing-library/react";
import { useSession } from "~/vibes.diy/app/hooks/useSession.js";
import { vi, describe, it, expect, beforeEach, Mock } from "vitest";
import { VibesDiyEnv } from "~/vibes.diy/app/config/env.js";


// Mock all required dependencies
VibesDiyEnv.env().sets({
  SETTINGS_DBNAME: "test-chat-history",
});

vi.mock("use-fireproof", async (original) => {
  const originalModule = (await original()) as typeof import("use-fireproof");
  // const mockFireproof = vi.fn().mockImplementation(() => {
  //   console.log("Mock fireproof called");
  // });
  const mockSubmitUserMessage = vi.fn().mockResolvedValue({ ok: true });
  const id = Math.random().toString(36).substring(2, 15);
  const mockUseFireproof = vi.fn().mockImplementation((name) => {
    console.log("Mock useFireproof called", id, name, new Error().stack);
    return {
      id,
      useDocument: () => ({
        doc: { _id: "test-id", type: "user" },
        merge: vi.fn(),
        submit: mockSubmitUserMessage,
        save: vi.fn(),
      }),
      useLiveQuery: () => ({ docs: [] }),
      database: { get: vi.fn(), put: vi.fn() },
    } as unknown as ReturnType<typeof useFireproof>;
  });
  console.log("Original module:");
  return {
    ...originalModule,
    // fireproof: mockFireproof,
    useFireproof: mockUseFireproof,
  };
});

vi.mock("~/vibes.diy/app/utils/databaseManager.js", () => ({
  getSessionDatabaseName: vi
    .fn()
    .mockImplementation((id) => `session-${id || "default"}`),
}));

import { useFireproof } from "use-fireproof";

// Tests focused on eager database initialization behavior
describe("useSession", () => {
  let mockUseFireproof: Mock<typeof useFireproof>;

  beforeEach(() => {
    globalThis.document.body.innerHTML = "";
    mockUseFireproof = vi.mocked(useFireproof);
    console.log("clear ", (mockUseFireproof() as unknown as { id: string }).id);
    mockUseFireproof.mockClear();
    vi.clearAllMocks();
  });

  it("should initialize database eagerly with provided sessionId", async () => {
    renderHook(() => useSession("test-id"));
    expect(mockUseFireproof).toHaveBeenCalledWith("session-test-id");
  });

  it("should initialize database eagerly even when sessionId is not provided", () => {
    console.log("pre ", (mockUseFireproof() as unknown as { id: string }).id, mockUseFireproof.mock.calls);
    const { result } = renderHook(() => useSession(undefined));
    console.log("pos ", (mockUseFireproof() as unknown as { id: string }).id, mockUseFireproof.mock.calls);

    // Verify we have a session ID generated (in the session document)
    expect(result.current.session._id).toBeTruthy();
    // Verify the database is initialized eagerly on first render
    // Called for the session DB and the settings DB
    expect(mockUseFireproof.mock.calls).toEqual({});
    expect(mockUseFireproof).toHaveBeenCalledTimes(2);
    expect(mockUseFireproof).toHaveBeenCalledWith(
      expect.stringMatching(/^session-/)
    );
    expect(mockUseFireproof).toHaveBeenCalledWith("test-chat-history");
  });

  /**
   * NEW BEHAVIOR: Eager database initialization for observable side effects
   *
   * This test ensures our new behavior: databases are created eagerly to make
   * storage side effects observable during testing and initialization.
   * This is the opposite of the previous lazy loading behavior.
   */
  it("should follow eager database initialization pattern for observable side effects", async () => {
    const { result } = renderHook(() => useSession(undefined));

    await waitFor(() => {
      expect(result.current.sessionDatabase).toBeDefined();
      // expect(result.current.loading).toBe(false);
    });

    // Step 1: Database should be initialized immediately on first render
    // One call for the session DB and one for the settings DB
    expect(mockUseFireproof).toHaveBeenCalledTimes(2);

    // Step 2: Session document and functions should be available
    expect(result.current.session._id).toBeTruthy();
    expect(result.current.submitUserMessage).toBeTruthy();

    // Step 3: User actions should work normally with the already-initialized database
    await result.current.submitUserMessage();

    // The submitUserMessage should have been called once
    // (we can't easily test the mock submit function from inside the closure)
  });

  /**
   * This test verifies session ID transition behavior with eager initialization
   * When the sessionId changes, a new database should be initialized with the new name
   */
  it("should initialize new database when sessionId changes", async () => {
    // Start with no session ID (first message scenario)
    const { rerender, result } = renderHook(
      ({ id }: { id?: string }) => useSession(id),
      {
        initialProps: { id: undefined } as { id?: string },
      }
    );

    await waitFor(() => {
      expect(result.current.sessionDatabase).toBeDefined();
      // expect(result.current.loading).toBe(false);
    });

    // Get the initial call count
    const initialCallCount = mockUseFireproof.mock.calls.length;
    const initialCall = mockUseFireproof.mock.calls[0][0];
    expect(initialCall).toMatch(/^session-/);

    // Simulate URL update with new session ID (after first message response)
    rerender({ id: "new-session-id" });

    // Verify new database is initialized with the new session ID
    // The call count should have increased
    expect(mockUseFireproof.mock.calls.length).toBeGreaterThan(
      initialCallCount
    );
    expect(mockUseFireproof).toHaveBeenCalledWith("session-new-session-id");
  });
});
