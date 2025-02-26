import { useEffect, useState } from 'react';
import ChatInterface from "../ChatInterface";
import ResultPreview from "../ResultPreview";

export function meta() {
  return [
    { title: "Fireproof App Builder" },
    { name: "description", content: "Build React components with AI" },
  ];
}

// Utility functions for URL state encoding/decoding
function encodeStateToUrl(code: string, dependencies: Record<string, string>) {
  try {
    const stateObj = { code, dependencies };
    const jsonStr = JSON.stringify(stateObj);
    const encoded = btoa(encodeURIComponent(jsonStr));
    return encoded;
  } catch (error) {
    console.error('Error encoding state to URL:', error);
    return '';
  }
}

function decodeStateFromUrl(encoded: string) {
  try {
    const jsonStr = decodeURIComponent(atob(encoded));
    const stateObj = JSON.parse(jsonStr);
    return {
      code: stateObj.code || '',
      dependencies: stateObj.dependencies || {}
    };
  } catch (error) {
    console.error('Error decoding state from URL:', error);
    return { code: '', dependencies: {} };
  }
}

export default function Home() {
  const [state, setState] = useState({
    generatedCode: '',
    dependencies: {} as Record<string, string>
  });
  const [shareStatus, setShareStatus] = useState<string>('');
  const [isSharedApp, setIsSharedApp] = useState<boolean>(false);

  // Check for state in URL on component mount
  useEffect(() => {
    const hash = window.location.hash;
    if (hash?.startsWith('#state=')) {
      const encodedState = hash.substring(7); // Remove '#state='
      const decodedState = decodeStateFromUrl(encodedState);
      if (decodedState.code) {
        setState({
          generatedCode: decodedState.code,
          dependencies: decodedState.dependencies
        });
        setIsSharedApp(true);
      }
    }
  }, []);

  function handleCodeGenerated(code: string, deps?: Record<string, string>) {
    setState({
      generatedCode: code,
      dependencies: deps || {}
    });
  }

  function handleShare() {
    if (!state.generatedCode) {
      alert('Generate an app first before sharing!');
      return;
    }
    
    const encoded = encodeStateToUrl(state.generatedCode, state.dependencies);
    if (encoded) {
      const shareUrl = `${window.location.origin}${window.location.pathname}#state=${encoded}`;
      
      // Use optional chaining for Web Share API check
      const canUseShareApi = Boolean(navigator && 'share' in navigator);
      
      if (canUseShareApi) {
        navigator.share({
          title: 'Fireproof App',
          text: 'Check out this app I built with Fireproof App Builder!',
          url: shareUrl,
        }).catch(() => {
          copyToClipboard(shareUrl);
        });
      } else {
        copyToClipboard(shareUrl);
      }
    }
  }

  function copyToClipboard(text: string) {
    navigator.clipboard.writeText(text)
      .then(() => {
        setShareStatus('Copied to clipboard!');
        setTimeout(() => setShareStatus(''), 3000);
      })
      .catch(err => {
        console.error('Failed to copy: ', err);
        // Further fallback - show the URL to manually copy
        prompt('Copy this link to share your app:', text);
      });
  }

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden' }}>
      <div style={{ flex: '0 0 33.333%', borderRight: '1px solid #ccc', overflow: 'hidden' }}>
        <ChatInterface onCodeGenerated={handleCodeGenerated} />
      </div>
      <div style={{ flex: '0 0 66.667%', overflow: 'hidden', position: 'relative' }}>
        <ResultPreview 
          code={state.generatedCode} 
          dependencies={state.dependencies} 
          onShare={handleShare}
          shareStatus={shareStatus}
        />
      </div>
    </div>
  );
}
