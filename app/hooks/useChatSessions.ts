import { useCallback } from 'react';
import { useFireproof } from 'use-fireproof';
import type { ChatMessage, SessionDocument } from '../types/chat';

export function useChatSessions(
  sessionId: string | null = null,
  onSessionCreated?: (newSessionId: string) => void
) {
  const { database } = useFireproof('fireproof-chat-history');

  const saveSession = useCallback(
    async (sessionMessages: ChatMessage[]) => {
      if (sessionMessages.length === 0) return;

      // Extract title from first user message
      const firstUserMessage = sessionMessages.find((msg) => msg.type === 'user');
      const title = firstUserMessage
        ? `${firstUserMessage.text.substring(0, 50)}${firstUserMessage.text.length > 50 ? '...' : ''}`
        : 'Untitled Chat';

      try {
        // If we have a session ID, fetch the existing document to get its timestamp
        let existingTimestamp: number | undefined;

        if (sessionId) {
          try {
            const existingDoc = (await database.get(sessionId)) as SessionDocument;
            existingTimestamp = existingDoc.timestamp;
          } catch (err) {
            console.error('Error fetching existing session:', err);
          }
        }

        // If we have a session ID, update it; otherwise create a new one
        const sessionData = {
          title,
          messages: sessionMessages,
          // Use existing timestamp if available, otherwise create a new one
          timestamp: existingTimestamp || Date.now(),
          ...(sessionId ? { _id: sessionId } : {}),
        };

        const result = await database.put(sessionData);

        // If this was a new session, notify via callback
        if (!sessionId && onSessionCreated) {
          onSessionCreated(result.id);
        }

        return result.id;
      } catch (error) {
        console.error('Error saving session to Fireproof:', error);
        return null;
      }
    },
    [database, sessionId, onSessionCreated]
  );

  const loadSession = useCallback(
    async (session: SessionDocument) => {
      if (!session?._id) return null;

      try {
        const sessionData = (await database.get(session._id)) as SessionDocument;

        // Notify via callback if provided
        if (onSessionCreated) {
          onSessionCreated(session._id);
        }

        return sessionData;
      } catch (err) {
        console.error('Error loading session:', err);
        return null;
      }
    },
    [database, onSessionCreated]
  );

  return {
    currentSessionId: sessionId,
    saveSession,
    loadSession,
  };
}
