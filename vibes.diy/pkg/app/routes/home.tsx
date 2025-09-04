import React, { useState } from "react";
import { useParams } from "react-router";
import SessionView from "../components/SessionView.js";

export function meta() {
  return [
    { title: "Vibes DIY - AI App Builder" },
    { name: "description", content: "Generate apps in one prompt" },
  ];
}

export default function SessionWrapper() {
  const { sessionId: urlSessionId } = useParams<{ sessionId: string }>();
  const [sessionId, setSessionId] = useState<string | null>(urlSessionId || null);

  // TODO: Implement new session UI and sessionId creation logic
  // For now, directly use urlSessionId to maintain existing behavior
  if (!sessionId) {
    // This will be replaced with proper new session UI
    // For now, generate a sessionId immediately to maintain compatibility
    const newSessionId = urlSessionId || `session-${Date.now()}`;
    setSessionId(newSessionId);
    return null; // Loading state while sessionId is being set
  }

  return <SessionView sessionId={sessionId} />;
}
