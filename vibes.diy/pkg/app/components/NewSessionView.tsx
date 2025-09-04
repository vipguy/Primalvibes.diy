import React from "react";

interface NewSessionViewProps {
  onSessionCreate: (sessionId: string) => void;
}

export default function NewSessionView({
  onSessionCreate,
}: NewSessionViewProps) {
  // Empty placeholder for now - will be enhanced later
  return (
    <div>
      <h1>New Session</h1>
      <p>This is where the new session UI will go.</p>
      {/* TODO: Implement chat input and session creation logic */}
    </div>
  );
}
