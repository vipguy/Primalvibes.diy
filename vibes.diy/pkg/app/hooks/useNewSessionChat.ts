import { useRef, useState, useCallback } from "react";
import { useNavigate } from "react-router";
import type {
  ChatMessageDocument,
  ChatState,
  VibeDocument,
  Segment,
} from "@vibes.diy/prompts";
import { RuntimeError } from "use-vibes";

export interface NewSessionChatState extends ChatState {
  // All properties from ChatState are included via extension
}

export function useNewSessionChat(
  onSessionCreate: (sessionId: string) => void,
): NewSessionChatState {
  const [input, setInput] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const inputRef = useRef<HTMLTextAreaElement | null>(null);
  const navigate = useNavigate();

  const sendMessage = useCallback(
    async (textOverride?: string) => {
      const messageText = textOverride || input;
      console.log("useNewSessionChat - sendMessage called with:", {
        messageText,
        textOverride,
        input,
      });

      if (!messageText.trim()) {
        console.log("useNewSessionChat - empty message, returning");
        return;
      }

      try {
        console.log("useNewSessionChat - starting session creation");
        setIsStreaming(true);

        // Create new session ID
        const newSessionId = `session-${Date.now()}`;
        console.log("useNewSessionChat - created sessionId:", newSessionId);

        // Store the message text for later processing
        const userMessage = messageText.trim();
        console.log("useNewSessionChat - userMessage:", userMessage);

        // Navigate to the new session URL with prompt parameter - this will trigger a page load
        const targetUrl = `/chat/${newSessionId}?prompt=${encodeURIComponent(userMessage)}`;
        console.log("useNewSessionChat - navigating to:", targetUrl);

        // Use window.location to trigger a real page load instead of React Router navigation
        window.location.href = targetUrl;
      } catch (error) {
        console.error("Failed to create session:", error);
        setIsStreaming(false);
      }
    },
    [input, onSessionCreate, navigate],
  );

  // Stub functions that are not needed for new session creation
  const saveCodeAsAiMessage = useCallback(async (): Promise<string> => {
    throw new Error("saveCodeAsAiMessage not available in new session");
  }, []);

  const updateTitle = useCallback(async (): Promise<void> => {
    // No-op for new session
  }, []);

  const addScreenshot = useCallback(async (): Promise<void> => {
    // No-op for new session
  }, []);

  const setSelectedResponseId = useCallback((): void => {
    // No-op for new session
  }, []);

  const addError = useCallback((): void => {
    // No-op for new session
  }, []);

  return {
    input,
    setInput,
    isStreaming,
    inputRef,
    sendMessage,
    docs: [], // Always empty for new sessions - triggers "I want to build..." placeholder
    isEmpty: true, // Always empty for new sessions
    codeReady: false, // No code ready in new session
    title: "", // No title for new session
    sessionId: null, // No session ID until created
    showModelPickerInChat: false, // Keep simple for now
    effectiveModel: "anthropic/claude-sonnet-4", // Default model
    globalModel: "anthropic/claude-sonnet-4",
    selectedModel: "anthropic/claude-sonnet-4",
    updateSelectedModel: undefined, // No model selection in new session for now
    saveCodeAsAiMessage,
    updateTitle,
    addScreenshot,
    setSelectedResponseId,
    selectedResponseDoc: undefined,
    selectedSegments: undefined,
    selectedCode: undefined,
    immediateErrors: [],
    advisoryErrors: [],
    addError,
    vibeDoc: undefined,
  };
}
