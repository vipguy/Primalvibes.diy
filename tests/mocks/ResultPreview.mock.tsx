import React from 'react';

interface ResultPreviewProps {
  code: string;
  streamingCode?: string;
  isStreaming?: boolean;
  dependencies?: Record<string, string>;
  onShare?: () => void;
  completedMessage?: string;
}

/**
 * Mock ResultPreview component for testing
 */
export default function ResultPreview({
  code,
  streamingCode,
  isStreaming,
  dependencies,
  onShare,
  completedMessage,
}: ResultPreviewProps) {
  const displayCode = isStreaming && streamingCode ? streamingCode : code;
  
  return (
    <div data-testid="result-preview" className="w-full h-full">
      <div data-testid="sandpack-provider">
        <div data-testid="sandpack-layout">
          <div data-testid="sandpack-code-editor">
            <pre>{displayCode}</pre>
          </div>
          <div data-testid="sandpack-preview">Preview</div>
        </div>
        
        <div className="flex justify-between p-2">
          <button 
            onClick={() => navigator.clipboard.writeText(displayCode)}
            className="px-2 py-1 text-sm rounded"
            data-testid="copy-button"
          >
            Copy
          </button>
          
          {onShare && (
            <button 
              onClick={onShare}
              className="px-2 py-1 text-sm rounded"
              data-testid="share-button"
            >
              Share
            </button>
          )}
        </div>
        
        {completedMessage && (
          <div data-testid="completed-message" className="p-2 mt-2">
            {completedMessage}
          </div>
        )}
      </div>
    </div>
  );
} 