import { vi, describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import ResultPreview from './mocks/ResultPreview.mock';

// Mock clipboard API
Object.assign(navigator, {
  clipboard: {
    writeText: vi.fn().mockImplementation(() => Promise.resolve()),
  },
});

describe('ResultPreview', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders with code content', () => {
    const code = 'const test = "Hello World";';
    
    render(
      <ResultPreview code={code} />
    );
    
    expect(screen.getByTestId('sandpack-provider')).toBeDefined();
    expect(screen.getByTestId('sandpack-layout')).toBeDefined();
    expect(screen.getByTestId('sandpack-code-editor')).toBeDefined();
    expect(screen.getByTestId('sandpack-preview')).toBeDefined();
  });

  it('renders with streaming code', () => {
    const code = '';
    const streamingCode = 'const test = "Streaming";';
    
    render(
      <ResultPreview code={code} streamingCode={streamingCode} isStreaming={true} />
    );
    
    expect(screen.getByTestId('sandpack-provider')).toBeDefined();
    expect(screen.getByText(streamingCode)).toBeDefined();
  });

  it('handles copy to clipboard', async () => {
    const code = 'const test = "Copy me";';
    
    render(
      <ResultPreview code={code} />
    );
    
    const copyButton = screen.getByTestId('copy-button');
    fireEvent.click(copyButton);
    
    expect(navigator.clipboard.writeText).toHaveBeenCalledWith(code);
  });

  it('renders with custom dependencies', () => {
    const code = 'import React from "react";';
    const dependencies = {
      react: '^18.0.0',
      'react-dom': '^18.0.0',
    };
    
    render(
      <ResultPreview code={code} dependencies={dependencies} />
    );
    
    expect(screen.getByTestId('sandpack-provider')).toBeDefined();
    expect(screen.getByText(code)).toBeDefined();
  });

  it('handles share functionality', () => {
    const code = 'const test = "Share me";';
    const onShare = vi.fn();
    
    render(
      <ResultPreview code={code} onShare={onShare} />
    );
    
    const shareButton = screen.getByTestId('share-button');
    fireEvent.click(shareButton);
    
    expect(onShare).toHaveBeenCalled();
  });

  it('renders with completed message', () => {
    const code = 'const test = "Hello";';
    const completedMessage = 'This is a completed message';
    
    render(
      <ResultPreview code={code} completedMessage={completedMessage} />
    );
    
    expect(screen.getByTestId('completed-message')).toBeDefined();
    expect(screen.getByText(completedMessage)).toBeDefined();
  });

  it('handles edge case with empty code', () => {
    render(
      <ResultPreview code="" />
    );
    
    expect(screen.getByTestId('sandpack-provider')).toBeDefined();
    expect(screen.getByTestId('sandpack-code-editor')).toBeDefined();
  });
}); 