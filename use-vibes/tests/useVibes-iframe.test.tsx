import React from 'react';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import { render, renderHook, waitFor } from '@testing-library/react';
import { createMockIframe, cleanupIframeMocks } from './utils/iframe-mocks.js';

// Mock parseContent to return predictable results
vi.mock('@vibes.diy/prompts', () => ({
  parseContent: vi.fn((text: string) => {
    // Check if text contains code blocks
    const codeBlockMatch = text.match(/```(?:jsx?|javascript)?\n([\s\S]*?)\n```/);
    if (codeBlockMatch) {
      return {
        segments: [
          { type: 'markdown', content: 'Some description' },
          { type: 'code', content: codeBlockMatch[1] }
        ]
      };
    }
    
    // No code blocks found - return text as single segment
    return {
      segments: [
        { type: 'markdown', content: text }
      ]
    };
  }),
  makeBaseSystemPrompt: vi.fn().mockResolvedValue({
    systemPrompt: "You are a React component generator",
    dependencies: ['useFireproof'],
    instructionalText: true,
    demoData: false,
    model: 'anthropic/claude-sonnet-4',
  })
}));

// Import the hook we're testing
import { useVibes } from '../base/hooks/vibes-gen/use-vibes.js';

describe('useVibes with iframe integration', () => {
  let mockIframe: ReturnType<typeof createMockIframe>;

  beforeEach(() => {
    mockIframe = createMockIframe();
    vi.clearAllMocks();
  });

  afterEach(() => {
    cleanupIframeMocks();
  });

  it('should return IframeVibesComponent when code is extracted', async () => {
    const mockCallAI = vi.fn().mockResolvedValue(`
Here's a button component:

\`\`\`jsx
function App() { 
  return <button>Click me</button>;
}
\`\`\`

This creates a simple button.
    `);
    
    const { result } = renderHook(() => 
      useVibes('create a button', {}, mockCallAI)
    );
    
    // Initially should be loading
    expect(result.current.loading).toBe(true);
    expect(result.current.App).toBe(null);
    
    // Wait for the hook to complete
    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });
    
    // Should have extracted the code
    expect(result.current.code).toContain('function App()');
    expect(result.current.App).toBeDefined();
    expect(result.current.error).toBe(null);
    
    // Try to render the returned component
    if (result.current.App) {
      const { container } = render(<result.current.App />);
      
      // Once implemented, this should contain an iframe
      // For now, it will contain our placeholder
      expect(container).toBeInTheDocument();
    }
  });

  it('should pass extracted code to IframeVibesComponent', async () => {
    const expectedCode = 'function App() { return <div>Button</div> }';
    const mockCallAI = vi.fn().mockResolvedValue(`\`\`\`jsx\n${expectedCode}\n\`\`\``);
    
    const { result } = renderHook(() => 
      useVibes('create a button', {}, mockCallAI)
    );
    
    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });
    
    // Verify the extracted code matches what was in the code block
    expect(result.current.code).toBe(expectedCode);
    
    // Once implemented, we can spy on the IframeVibesComponent to verify props
    if (result.current.App) {
      const { container } = render(<result.current.App />);
      expect(container).toBeInTheDocument();
      
      // Expected behavior once implemented:
      // const iframe = container.querySelector('iframe');
      // expect(iframe?.src).toMatch(/vibes-\d+\.vibesbox\.dev/);
    }
  });

  it('should generate unique session IDs for each instance', async () => {
    const mockCallAI = vi.fn().mockResolvedValue('```jsx\nfunction App() {}\n```');
    
    const { result: result1 } = renderHook(() => 
      useVibes('button 1', {}, mockCallAI)
    );
    
    const { result: result2 } = renderHook(() => 
      useVibes('button 2', {}, mockCallAI)
    );
    
    await waitFor(() => {
      expect(result1.current.loading).toBe(false);
      expect(result2.current.loading).toBe(false);
    });
    
    // Both should have generated components
    expect(result1.current.App).toBeDefined();
    expect(result2.current.App).toBeDefined();
    
    if (result1.current.App && result2.current.App) {
      const { container: container1 } = render(<result1.current.App />);
      const { container: container2 } = render(<result2.current.App />);
      
      // Both should render (even if just placeholders for now)
      expect(container1).toBeInTheDocument();
      expect(container2).toBeInTheDocument();
      
      // Expected behavior once implemented:
      // const iframe1 = container1.querySelector('iframe');
      // const iframe2 = container2.querySelector('iframe');
      // expect(iframe1?.src).not.toBe(iframe2?.src);
    }
  });

  it('should use raw response when parseContent finds no code blocks', async () => {
    const rawResponse = 'export default function App() { return <div>No code block</div> }';
    const mockCallAI = vi.fn().mockResolvedValue(rawResponse);
    
    const { result } = renderHook(() => 
      useVibes('create component', {}, mockCallAI)
    );
    
    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });
    
    // Should use the raw response as fallback
    expect(result.current.code).toBe(rawResponse);
    expect(result.current.App).toBeDefined();
    
    // Should still create iframe component with fallback code
    if (result.current.App) {
      const { container } = render(<result.current.App />);
      expect(container).toBeInTheDocument();
    }
  });

  it('should handle AI call errors gracefully', async () => {
    const mockCallAI = vi.fn().mockRejectedValue(new Error('AI service unavailable'));
    
    const { result } = renderHook(() => 
      useVibes('create something', {}, mockCallAI)
    );
    
    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });
    
    // Should have error state
    expect(result.current.error).toBeDefined();
    expect(result.current.error?.message).toContain('AI service unavailable');
    expect(result.current.App).toBe(null);
    expect(result.current.code).toBe(null);
  });

  it('should update component metadata correctly', async () => {
    const mockCallAI = vi.fn().mockResolvedValue(`\`\`\`jsx
import React, { useState } from 'react';
import { useFireproof } from 'use-fireproof';

function TodoApp() {
  const [todos, setTodos] = useState([]);
  return <div>Todo App</div>;
}

export default TodoApp;
\`\`\``);
    
    const { result } = renderHook(() => 
      useVibes('create a todo app', { model: 'gpt-4' }, mockCallAI)
    );
    
    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });
    
    // Should have document with metadata
    expect(result.current.document).toBeDefined();
    expect(result.current.document?.prompt).toBe('create a todo app');
    expect(result.current.document?.code).toContain('TodoApp');
    expect(result.current.document?.model).toBe('anthropic/claude-sonnet-4'); // From mock
    expect(result.current.document?.created_at).toBeTypeOf('number');
  });

  it('should support regenerate functionality', async () => {
    let callCount = 0;
    const mockCallAI = vi.fn().mockImplementation(() => {
      callCount++;
      return Promise.resolve(`\`\`\`jsx\nfunction App${callCount}() { return <div>Version ${callCount}</div> }\n\`\`\``);
    });
    
    const { result } = renderHook(() => 
      useVibes('create a component', {}, mockCallAI)
    );
    
    // Wait for initial generation
    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });
    
    expect(result.current.code).toContain('App1');
    expect(mockCallAI).toHaveBeenCalledTimes(1);
    
    // Trigger regeneration
    result.current.regenerate();
    
    // Should be loading again
    expect(result.current.loading).toBe(true);
    
    // Wait for regeneration to complete
    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });
    
    // Should have new content
    expect(result.current.code).toContain('App2');
    expect(mockCallAI).toHaveBeenCalledTimes(2);
  });
});