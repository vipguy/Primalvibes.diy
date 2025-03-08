import { vi, describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import ChatInput from '../app/components/ChatInput';
import React from 'react';

describe('ChatInput', () => {
  it('renders input correctly', () => {
    const setInput = vi.fn();
    const onSend = vi.fn();
    const autoResizeTextarea = vi.fn();
    const inputRef = React.createRef<HTMLTextAreaElement>();

    render(
      <ChatInput
        input="Test input"
        setInput={setInput}
        isGenerating={false}
        onSend={onSend}
        autoResizeTextarea={autoResizeTextarea}
        inputRef={inputRef}
      />
    );

    expect(screen.getByPlaceholderText('Describe the app you want to create...')).toBeDefined();
  });

  it('handles input change', () => {
    const setInput = vi.fn();
    const onSend = vi.fn();
    const autoResizeTextarea = vi.fn();
    const inputRef = React.createRef<HTMLTextAreaElement>();

    render(
      <ChatInput
        input=""
        setInput={setInput}
        isGenerating={false}
        onSend={onSend}
        autoResizeTextarea={autoResizeTextarea}
        inputRef={inputRef}
      />
    );

    const textarea = screen.getByPlaceholderText('Describe the app you want to create...');
    fireEvent.change(textarea, { target: { value: 'New input' } });

    expect(setInput).toHaveBeenCalledWith('New input');
    expect(autoResizeTextarea).toHaveBeenCalled();
  });
});
