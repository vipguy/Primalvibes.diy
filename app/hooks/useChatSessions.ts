import { useCallback, useState } from 'react';
import { useFireproof } from 'use-fireproof';
import type { ChatMessage, SessionDocument } from '../types/chat';

export function useChatSessions() {
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
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
        // If we have a current session ID, fetch the existing document to get its timestamp
        let existingTimestamp: number | undefined;
        
        if (currentSessionId) {
          try {
            const existingDoc = await database.get(currentSessionId) as SessionDocument;
            existingTimestamp = existingDoc.timestamp;
          } catch (err) {
            console.error('Error fetching existing session:', err);
          }
        }
        
        // If we have a current session ID, update it; otherwise create a new one
        const sessionData = {
          title,
          messages: sessionMessages,
          // Use existing timestamp if available, otherwise create a new one
          timestamp: existingTimestamp || Date.now(),
          ...(currentSessionId ? { _id: currentSessionId } : {}),
        };

        const result = await database.put(sessionData);
        if (!currentSessionId) {
          setCurrentSessionId(result.id);
        }
        return result.id;
      } catch (error) {
        console.error('Error saving session to Fireproof:', error);
        return null;
      }
    },
    [database, currentSessionId]
  );

  const loadSession = async (session: SessionDocument) => {
    if (!session?._id) return null;
    setCurrentSessionId(session._id);
    return session;
  };

  const createNewSession = () => {
    setCurrentSessionId(null);
  };

  return {
    currentSessionId,
    saveSession,
    loadSession,
    createNewSession
  };
} 