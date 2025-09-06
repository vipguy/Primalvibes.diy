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

let homeRenderCount = 0;
export default function SessionWrapper() {
  console.log(`SessionWrapper (home) render #${++homeRenderCount}`);

  const { sessionId: urlSessionId } = useParams<{ sessionId: string }>();
  const location = useLocation();
  const originalNavigate = useNavigate();

  // Extract all location properties as stable strings to prevent useEffect dependency issues
  const pathname = useMemo(
    () => location?.pathname || "",
    [location?.pathname],
  );
  const search = useMemo(() => location?.search || "", [location?.search]);
  const hash = useMemo(() => location?.hash || "", [location?.hash]);
  const locationKey = useMemo(() => location?.key || "", [location?.key]);
  const locationState = useMemo(
    () => location?.state || null,
    [location?.state],
  );

  // Create stable navigate function with logging
  const navigate = useCallback(
    (to: string, options?: { replace?: boolean }) => {
      console.log("🚨 NAVIGATE CALL from SessionWrapper:", {
        to,
        options,
        timestamp: Date.now(),
      });
      return originalNavigate(to, options);
    },
    [originalNavigate],
  );

  const [sessionId, setSessionId] = useState<string | null>(
    () => urlSessionId || null,
  );

  // DEBUG: Track what's causing re-renders with detailed logging
  console.log(
    "SessionWrapper render - urlSessionId:",
    urlSessionId,
    "sessionId:",
    sessionId,
    "useParams object reference:",
    useParams,
    "timestamp:",
    Date.now(),
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
  return (
    <SessionView
      sessionId={sessionId}
      pathname={pathname}
      search={search}
      hash={hash}
      locationKey={locationKey}
      locationState={locationState}
      navigate={navigate}
    />
  );
}
