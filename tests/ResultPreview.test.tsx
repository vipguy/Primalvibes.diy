import { vi, describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import ResultPreview from '../app/ResultPreview';

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

    render(<ResultPreview code={code} />);

    expect(screen.getByText('Preview')).toBeDefined();
    expect(screen.getByText('Code')).toBeDefined();
  });

  it('renders with streaming code', async () => {
    const code = '';
    const streamingCode = 'const test = "Streaming";';

    render(<ResultPreview code={code} streamingCode={streamingCode} isStreaming={true} />);

    expect(await screen.findByTestId('sandpack-provider')).toBeDefined();

    // Click on the Code button to make the code editor visible
    const codeButton = screen.getByText('Code');
    fireEvent.click(codeButton);

    // Just check that the code editor is present
    expect(screen.getByRole('textbox', { name: /code editor for app.jsx/i })).toBeDefined();
  });

  it('handles copy to clipboard', async () => {
    const code = 'const test = "Copy me";';

    render(<ResultPreview code={code} />);

    const copyButton = screen.getByTestId('copy-button');
    fireEvent.click(copyButton);

    expect(navigator.clipboard.writeText).toHaveBeenCalledWith(code);
  });

  it('renders with custom dependencies', async () => {
    const code = 'import React from "react";';
    const dependencies = {
      react: '^18.0.0',
      'react-dom': '^18.0.0',
    };

    render(<ResultPreview code={code} dependencies={dependencies} />);

    expect(await screen.findByTestId('sandpack-provider')).toBeDefined();

    // Click on the Code button to make the code editor visible
    const codeButton = screen.getByText('Code');
    fireEvent.click(codeButton);

    // Just check that the code editor is present
    expect(screen.getByRole('textbox', { name: /code editor for app.jsx/i })).toBeDefined();
  });

  it('handles share functionality', () => {
    const code = 'const test = "Share me";';
    const onShare = vi.fn();

    render(<ResultPreview code={code} onShare={onShare} />);

    const shareButton = screen.getByLabelText('Share app');
    fireEvent.click(shareButton);

    expect(onShare).toHaveBeenCalled();
  });

  it('renders with completed message', () => {
    const code = 'const test = "Hello";';
    const completedMessage = 'This is a completed message';

    render(<ResultPreview code={code} completedMessage={completedMessage} />);

    expect(screen.getByText(completedMessage)).toBeDefined();
  });

  it('handles edge case with empty code', () => {
    render(<ResultPreview code="" />);

    expect(screen.getByText('Preview')).toBeDefined();
    expect(screen.getByText('Code')).toBeDefined();
  });
});
