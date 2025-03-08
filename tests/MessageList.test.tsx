import { vi, describe, it, expect, beforeAll } from 'vitest';
import { render, screen } from '@testing-library/react';
import MessageList from '../app/components/MessageList';
import type { ChatMessage } from '../app/types/chat';

beforeAll(() => {
  window.HTMLElement.prototype.scrollIntoView = vi.fn();
});

describe('MessageList', () => {
  it('renders messages correctly', () => {
    const messages: ChatMessage[] = [
      { type: 'user', text: 'Hello' },
      { type: 'ai', text: 'Hi there!' },
    ];

    render(<MessageList messages={messages} isGenerating={false} currentStreamedText="" />);

    expect(screen.getByText('Hello')).toBeDefined();
    expect(screen.getByText('Hi there!')).toBeDefined();
  });

  it('renders streaming text correctly', () => {
    render(<MessageList messages={[]} isGenerating={true} currentStreamedText="Thinking..." />);

    expect(screen.getByText('Thinking...')).toBeDefined();
  });
});
