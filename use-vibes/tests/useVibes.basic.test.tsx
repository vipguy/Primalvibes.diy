import { renderHook, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';

// Use vi.hoisted for mock functions to ensure they're available at top level
const mockData = vi.hoisted(() => {
  const mockCallAI = vi.fn();
  const mockMakeBaseSystemPrompt = vi.fn();
  return { mockCallAI, mockMakeBaseSystemPrompt };
});

// Mock the @vibes.diy/prompts module
vi.mock('@vibes.diy/prompts', () => ({
  makeBaseSystemPrompt: mockData.mockMakeBaseSystemPrompt,
}));

import { useVibes } from '../base/hooks/vibes-gen/use-vibes.js';

describe('useVibes - Basic Structure', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // Setup default mock for makeBaseSystemPrompt
    mockData.mockMakeBaseSystemPrompt.mockResolvedValue({
      systemPrompt: `You are a React component generator. Generate a complete React component based on the user's prompt. 
Use Fireproof for data persistence. Begin the component with the import statements.
Return only the JSX code with a default export. Use modern React patterns with hooks if needed.`,
      dependencies: ['useFireproof'],
      instructionalText: true,
      demoData: false,
      model: 'anthropic/claude-sonnet-4',
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should accept prompt string and optional options', () => {
    const { result } = renderHook(() => useVibes('create a button', {}, mockData.mockCallAI));

    expect(result.current.loading).toBe(true);
    expect(result.current.App).toBe(null);
    expect(result.current.code).toBe(null);
    expect(result.current.error).toBe(null);
    expect(result.current.progress).toBeGreaterThanOrEqual(0); // Progress simulation starts immediately
    expect(typeof result.current.regenerate).toBe('function');
  });

  it('should return App component after loading', async () => {
    mockData.mockCallAI.mockResolvedValue('export default function() { return <div>Test</div> }');

    const { result } = renderHook(() => useVibes('create a button', {}, mockData.mockCallAI));

    await waitFor(() => expect(result.current.loading).toBe(false), { timeout: 3000 });

    expect(result.current.App).toBeDefined();
    expect(result.current.code).toContain('Test');
    expect(result.current.error).toBe(null);
  });

  it('should accept options as second parameter', async () => {
    mockData.mockCallAI.mockResolvedValue('export default function() { return <div>Form</div> }');

    const { result } = renderHook(() =>
      useVibes(
        'create a form',
        {
          database: 'custom-db',
          model: 'gpt-4',
        },
        mockData.mockCallAI
      )
    );

    await waitFor(() => expect(result.current.loading).toBe(false), { timeout: 3000 });
    expect(result.current.App).toBeDefined();
    expect(result.current.code).toContain('Form');
  });

  it('should handle empty prompt gracefully', () => {
    const { result } = renderHook(() => useVibes('', {}, mockData.mockCallAI));

    expect(result.current.loading).toBe(false);
    expect(result.current.App).toBe(null);
    expect(result.current.error?.message).toContain('Prompt required');
  });

  it('should handle undefined prompt gracefully', () => {
    const { result } = renderHook(() =>
      useVibes(undefined as unknown as string, {}, mockData.mockCallAI)
    );

    expect(result.current.loading).toBe(false);
    expect(result.current.App).toBe(null);
    expect(result.current.error?.message).toContain('Prompt required');
  });

  it('should handle errors from AI service', async () => {
    mockData.mockCallAI.mockRejectedValue(new Error('Service unavailable'));

    const { result } = renderHook(() => useVibes('create button', {}, mockData.mockCallAI));

    // Wait for loading to complete (error or success)
    await waitFor(() => expect(result.current.loading).toBe(false), { timeout: 3000 });

    // Check that error was set
    expect(result.current.error).toBeDefined();
    expect(result.current.error?.message).toBe('Service unavailable');
    expect(result.current.App).toBe(null);
  });

  it('should handle skip option', () => {
    const { result } = renderHook(() =>
      useVibes('create button', { skip: true }, mockData.mockCallAI)
    );

    expect(result.current.loading).toBe(false);
    expect(result.current.App).toBe(null);
    expect(result.current.code).toBe(null);
    expect(result.current.error).toBe(null);
    expect(mockData.mockCallAI).not.toHaveBeenCalled();
  });

  it('should provide regenerate function', async () => {
    mockData.mockCallAI.mockResolvedValue(
      'export default function() { return <div>Initial</div> }'
    );

    const { result } = renderHook(() => useVibes('create button', {}, mockData.mockCallAI));

    await waitFor(() => expect(result.current.loading).toBe(false), { timeout: 3000 });
    expect(result.current.code).toContain('Initial');

    // For now, just test that regenerate function exists and is callable
    // Full regeneration testing will be added in Cycle 2 with proper state management
    expect(typeof result.current.regenerate).toBe('function');
    result.current.regenerate(); // Should not throw
  });

  it('should show progress updates during generation', async () => {
    // Mock an immediate response to test progress (no need for actual delay in mocked test)
    mockData.mockCallAI.mockImplementation(() =>
      Promise.resolve('export default function() { return <div>Done</div> }')
    );

    const { result } = renderHook(() => useVibes('create button', {}, mockData.mockCallAI));

    expect(result.current.progress).toBeGreaterThanOrEqual(0);
    expect(result.current.loading).toBe(true);

    await waitFor(() => expect(result.current.loading).toBe(false), { timeout: 3000 });

    // Progress should reach 100 when loading is complete
    await waitFor(() => expect(result.current.progress).toBeGreaterThan(89), { timeout: 1000 });
  });

  it('should handle concurrent requests properly', async () => {
    mockData.mockCallAI.mockResolvedValue('export default function() { return <div>Button</div> }');

    const { result: result1 } = renderHook(() =>
      useVibes('create button', {}, mockData.mockCallAI)
    );
    const { result: result2 } = renderHook(() =>
      useVibes('create button', {}, mockData.mockCallAI)
    );

    await waitFor(
      () => {
        expect(result1.current.loading).toBe(false);
        expect(result2.current.loading).toBe(false);
      },
      { timeout: 3000 }
    );

    expect(result1.current.App).toBeDefined();
    expect(result2.current.App).toBeDefined();
  });

  it('should verify system prompt generation and metadata', async () => {
    mockData.mockCallAI.mockResolvedValue('function App() { return <div>Test</div>; }');

    const { result } = renderHook(() => useVibes('Create a todo app', {}, mockData.mockCallAI));

    await waitFor(() => expect(result.current.loading).toBe(false), { timeout: 3000 });

    // Verify that makeBaseSystemPrompt was called with the correct parameters
    expect(mockData.mockMakeBaseSystemPrompt).toHaveBeenCalledWith(
      'anthropic/claude-sonnet-4',
      expect.objectContaining({
        userPrompt: 'Create a todo app',
        history: [],
        fallBackUrl: 'https://esm.sh/use-vibes/prompt-catalog/llms',
        dependencies: undefined,
        dependenciesUserOverride: false,
      })
    );

    // Verify that callAI was called with the system prompt from makeBaseSystemPrompt
    expect(mockData.mockCallAI).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({
          role: 'system',
          content: expect.stringContaining('Use Fireproof for data persistence'),
        }),
      ]),
      expect.any(Object)
    );

    // Verify that metadata is included in the document
    expect(result.current.document).toMatchObject({
      dependencies: expect.any(Array),
      aiSelectedDependencies: expect.any(Array),
      instructionalText: expect.any(Boolean),
      demoData: expect.any(Boolean),
      model: expect.any(String),
      timestamp: expect.any(Number),
    });
  });

  it('should not violate Rules of Hooks when transitioning between states', async () => {
    mockData.mockCallAI.mockResolvedValue('export default function() { return <div>Test</div> }');

    // Start with empty prompt
    const { result, rerender } = renderHook(
      ({ prompt, skip }) => useVibes(prompt, { skip }, mockData.mockCallAI),
      {
        initialProps: { prompt: '', skip: false },
      }
    );

    // Should have error for empty prompt
    expect(result.current.loading).toBe(false);
    expect(result.current.error?.message).toContain('Prompt required');

    // Rerender with valid prompt - this should not cause hooks error
    rerender({ prompt: 'create button', skip: false });

    // Should start loading
    expect(result.current.loading).toBe(true);
    expect(result.current.error).toBe(null);

    await waitFor(() => expect(result.current.loading).toBe(false), { timeout: 3000 });

    expect(result.current.App).toBeDefined();
    expect(result.current.code).toContain('Test');

    // Rerender with skip option - should not cause hooks error
    rerender({ prompt: 'create button', skip: true });

    expect(result.current.loading).toBe(false);
    expect(result.current.App).toBe(null);
    expect(result.current.error).toBe(null);

    // Rerender back to normal - should not cause hooks error
    rerender({ prompt: 'create new button', skip: false });

    expect(result.current.loading).toBe(true);

    await waitFor(() => expect(result.current.loading).toBe(false), { timeout: 3000 });

    expect(result.current.App).toBeDefined();
  });
});
