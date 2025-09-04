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

  console.log(
    "SessionWrapper render - urlSessionId:",
    urlSessionId,
    "sessionId:",
    sessionId,
  );

  const handleSessionCreate = (newSessionId: string) => {
    console.log("SessionWrapper - onSessionCreate called with:", newSessionId);
    setSessionId(newSessionId);
    console.log(
      "SessionWrapper - setSessionId called, should trigger re-render",
    );
  };

  // Conditional rendering - true deferred session creation
  if (!sessionId) {
    console.log("SessionWrapper - rendering NewSessionView");
    return <NewSessionView onSessionCreate={handleSessionCreate} />;
  }

  console.log(
    "SessionWrapper - rendering SessionView with sessionId:",
    sessionId,
  );
  return <SessionView sessionId={sessionId} />;
}
