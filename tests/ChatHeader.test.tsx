import { vi, describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import ChatHeader from './mocks/ChatHeader.mock';

describe('ChatHeader', () => {
  it('renders correctly', () => {
    const onToggleSidebar = vi.fn();
    const onNewChat = vi.fn();
    
    render(
      <ChatHeader 
        onToggleSidebar={onToggleSidebar} 
        onNewChat={onNewChat} 
        isGenerating={false} 
      />
    );
    
    // Check that the toggle sidebar button is rendered
    const toggleButton = screen.getByLabelText('Toggle chat history');
    expect(toggleButton).toBeDefined();
    
    // Check that the new chat button is rendered
    const newChatButton = screen.getByText('New Chat');
    expect(newChatButton).toBeDefined();
  });
  
  it('calls onToggleSidebar when the toggle button is clicked', () => {
    const onToggleSidebar = vi.fn();
    const onNewChat = vi.fn();
    
    render(
      <ChatHeader 
        onToggleSidebar={onToggleSidebar} 
        onNewChat={onNewChat} 
        isGenerating={false} 
      />
    );
    
    const toggleButton = screen.getByLabelText('Toggle chat history');
    fireEvent.click(toggleButton);
    
    expect(onToggleSidebar).toHaveBeenCalledTimes(1);
  });
  
  it('calls onNewChat when the new chat button is clicked', () => {
    const onToggleSidebar = vi.fn();
    const onNewChat = vi.fn();
    
    render(
      <ChatHeader 
        onToggleSidebar={onToggleSidebar} 
        onNewChat={onNewChat} 
        isGenerating={false} 
      />
    );
    
    const newChatButton = screen.getByText('New Chat');
    fireEvent.click(newChatButton);
    
    expect(onNewChat).toHaveBeenCalledTimes(1);
  });
  
  it('disables the new chat button when isGenerating is true', () => {
    const onToggleSidebar = vi.fn();
    const onNewChat = vi.fn();
    
    render(
      <ChatHeader 
        onToggleSidebar={onToggleSidebar} 
        onNewChat={onNewChat} 
        isGenerating={true} 
      />
    );
    
    const newChatButton = screen.getByText('New Chat');
    expect(newChatButton).toHaveAttribute('disabled');
    
    fireEvent.click(newChatButton);
    expect(onNewChat).not.toHaveBeenCalled();
  });
}); 