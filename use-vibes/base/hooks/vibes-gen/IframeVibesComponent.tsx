import React, { useEffect, useRef, useState } from 'react';
import { transformImports, normalizeComponentExports } from '@vibes.diy/prompts';

interface IframeVibesComponentProps {
  code: string;
  sessionId?: string;
  onReady?: () => void;
  onError?: (error: Error) => void;
}

const IframeVibesComponent: React.FC<IframeVibesComponentProps> = ({
  code,
  sessionId,
  onReady,
  onError,
}) => {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [isReady, setIsReady] = useState(false);

  // Generate session ID if not provided
  const effectiveSessionId = sessionId || `vibes-${Date.now()}`;

  useEffect(() => {
    const iframe = iframeRef.current;
    if (!iframe || !code) return;

    // Set up message listener for iframe communication
    const handleMessage = (event: MessageEvent) => {
      // Only accept messages from vibesbox domains
      if (!event.origin.includes('vibesbox.dev')) {
        return;
      }

      const { data } = event;

      if (data?.type === 'preview-ready') {
        setIsReady(true);
        onReady?.();
      } else if (data?.type === 'error') {
        const error = new Error(data.error || 'Component error');
        onError?.(error);
      }
    };

    window.addEventListener('message', handleMessage);

    // Set iframe source
    const iframeUrl = `https://${effectiveSessionId}.vibesbox.dev/`;
    iframe.src = iframeUrl;

    // Handle iframe load
    const handleIframeLoad = () => {
      if (!iframe.contentWindow) return;

      // Normalize and transform the code
      const normalizedCode = normalizeComponentExports(code);
      const transformedCode = transformImports(normalizedCode);

      // Send code to iframe
      const messageData = {
        type: 'execute-code',
        code: transformedCode,
        apiKey: 'sk-vibes-proxy-managed',
        sessionId: effectiveSessionId,
        endpoint: 'https://api.openrouter.ai/api/v1/chat/completions',
      };

      iframe.contentWindow.postMessage(messageData, '*');
    };

    iframe.addEventListener('load', handleIframeLoad);

    return () => {
      window.removeEventListener('message', handleMessage);
      iframe.removeEventListener('load', handleIframeLoad);
    };
  }, [code, effectiveSessionId, onReady, onError]);

  return (
    <div data-testid="placeholder">
      <iframe ref={iframeRef} title="Vibes Component Preview" />
      {!isReady && <div>Loading component...</div>}
    </div>
  );
};

export default IframeVibesComponent;
