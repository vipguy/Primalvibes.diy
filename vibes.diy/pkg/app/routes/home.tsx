import React, { useState } from "react";
import { useParams } from "react-router";
import SessionView from "../components/SessionView.js";
import NewSessionView from "../components/NewSessionView.js";

export function meta() {
  return [
    { title: "Vibes DIY - AI App Builder" },
    { name: "description", content: "Generate apps in one prompt" },
  ];
}

export default function SessionWrapper() {
  const { sessionId: urlSessionId } = useParams<{ sessionId: string }>();
  const [sessionId, setSessionId] = useState<string | null>(
    urlSessionId || null,
  );

  // Conditional rendering - true deferred session creation
  if (!sessionId) {
    return <NewSessionView onSessionCreate={setSessionId} />;
  }

  return <SessionView sessionId={sessionId} />;
}
