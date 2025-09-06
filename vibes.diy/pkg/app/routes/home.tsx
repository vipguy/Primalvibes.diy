import React, { useState, useMemo, useCallback } from "react";
import { useParams, useLocation, useNavigate } from "react-router";
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
  const location = useLocation();
  const originalNavigate = useNavigate();

  // Extract all location properties as stable strings to prevent useEffect dependency issues
  const pathname = useMemo(
    () => location?.pathname || "",
    [location?.pathname],
  );
  const search = useMemo(() => location?.search || "", [location?.search]);
  const locationState = useMemo(
    () => location?.state || null,
    [location?.state],
  );

  // Create stable navigate function
  const navigate = useCallback(
    (to: string, options?: { replace?: boolean }) => {
      return originalNavigate(to, options);
    },
    [originalNavigate],
  );

  const [sessionId, setSessionId] = useState<string | null>(
    () => urlSessionId || null,
  );

  const handleSessionCreate = (newSessionId: string) => {
    setSessionId(newSessionId);
  };

  // Conditional rendering - true deferred session creation
  if (!sessionId) {
    return <NewSessionView onSessionCreate={handleSessionCreate} />;
  }

  return (
    <SessionView
      sessionId={sessionId}
      pathname={pathname}
      search={search}
      locationState={locationState}
      navigate={navigate}
    />
  );
}
