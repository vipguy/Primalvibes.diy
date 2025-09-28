import React, { useState, useEffect, useCallback, useRef } from 'react';
import { callAI as defaultCallAI } from 'call-ai';
import type { UseVibesOptions, UseVibesResult, UseVibesState, GeneratedComponentProps } from './types.js';

/**
 * Mock component compiler for Cycle 1
 * In Cycle 3, this will be replaced with real JSX compilation
 */
function compileMockComponent(code: string): React.ComponentType<GeneratedComponentProps> {
  // For now, return a simple mock component that displays the code
  return function MockComponent(_props: GeneratedComponentProps) {
    return React.createElement(
      'div',
      {
        'data-testid': 'mock-component',
        style: {
          padding: '10px',
          border: '1px solid #ccc',
          fontFamily: 'monospace',
          fontSize: '12px',
        },
      },
      `Mock Component: ${code.substring(0, 100)}...`
    );
  };
}

/**
 * useVibes hook - Cycle 1 implementation
 * Generates React components from text prompts using AI
 */
export function useVibes(
  prompt: string,
  options: UseVibesOptions = {},
  callAI: typeof defaultCallAI = defaultCallAI
): UseVibesResult {
  // Validate inputs
  if (!prompt || typeof prompt !== 'string' || prompt.trim().length === 0) {
    return {
      App: null,
      code: null,
      loading: false,
      error: new Error('Prompt required'),
      progress: 0,
      regenerate: () => {
        // No-op for invalid prompt case
      },
    };
  }

  // Skip processing if explicitly requested
  if (options.skip) {
    return {
      App: null,
      code: null,
      loading: false,
      error: null,
      progress: 0,
      regenerate: () => {
        // No-op for skip case
      },
    };
  }

  const [state, setState] = useState<UseVibesState>({
    App: null,
    code: null,
    loading: true,
    error: null,
    progress: 0,
    document: null,
  });

  // Track generation requests to handle concurrent calls
  const generationIdRef = useRef<string | null>(null);
  const mountedRef = useRef(true);
  const progressTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Progress simulation for Cycle 1
  const simulateProgress = useCallback((currentProgress = 0) => {
    const increment = Math.random() * 20 + 10; // 10-30% increments
    const newProgress = Math.min(currentProgress + increment, 90);

    if (mountedRef.current) {
      setState((prev) => ({ ...prev, progress: newProgress }));

      if (newProgress < 90) {
        progressTimerRef.current = setTimeout(
          () => simulateProgress(newProgress),
          100 + Math.random() * 200
        );
      }
    }
  }, []);

  // Regenerate function
  const regenerate = useCallback(() => {
    // Trigger regeneration by updating generation ID
    generationIdRef.current = `regen-${Date.now()}`;
  }, []);

  // Effect to start generation - only when prompt or options change
  useEffect(() => {
    if (!mountedRef.current) return;

    const generationId = Date.now().toString();
    generationIdRef.current = generationId;

    const generateComponent = async () => {
      try {
        // Clear any existing progress timer
        if (progressTimerRef.current) {
          clearTimeout(progressTimerRef.current);
          progressTimerRef.current = null;
        }

        // Reset state for new generation
        setState((prev) => ({
          ...prev,
          loading: true,
          error: null,
          progress: 0,
          App: null,
          code: null,
        }));

        // Start progress simulation
        simulateProgress(0);

        // Mock AI call with basic prompt
        const systemPrompt = `You are a React component generator. Generate a complete React component based on the user's prompt. 
Return only the JSX code with a default export. Use modern React patterns with hooks if needed.`;

        const messages = [
          { role: 'system' as const, content: systemPrompt },
          { role: 'user' as const, content: prompt },
        ];

        const aiResponse = await callAI(messages, {
          model: options.model || 'anthropic/claude-3-haiku',
          max_tokens: 2000,
        });

        // Check if this request is still current (handle race conditions)
        if (generationIdRef.current !== generationId || !mountedRef.current) {
          return;
        }

        const code = typeof aiResponse === 'string' ? aiResponse : '';

        // Compile the code to a component (mock for Cycle 1)
        const App = compileMockComponent(code);

        // Update state with results
        setState((prev) => ({
          ...prev,
          App,
          code,
          loading: false,
          progress: 100,
          document: {
            _id: `mock-${Date.now()}`,
            prompt,
            code,
            title: 'Generated Component',
            dependencies: options.dependencies || [],
            model: options.model || 'anthropic/claude-3-haiku',
            created_at: Date.now(),
            version: 1,
          },
        }));
      } catch (error) {
        // Check if this request is still current
        if (generationIdRef.current !== generationId || !mountedRef.current) {
          return;
        }

        setState((prev) => ({
          ...prev,
          loading: false,
          error: error instanceof Error ? error : new Error('Generation failed'),
          progress: 0,
        }));
      }
    };

    generateComponent();

    // Cleanup function
    return () => {
      if (progressTimerRef.current) {
        clearTimeout(progressTimerRef.current);
        progressTimerRef.current = null;
      }
    };
  }, [prompt, JSON.stringify(options), callAI, simulateProgress]); // Only depend on actual inputs

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      mountedRef.current = false;
      if (progressTimerRef.current) {
        clearTimeout(progressTimerRef.current);
      }
    };
  }, []);

  return {
    App: state.App,
    code: state.code,
    loading: state.loading,
    error: state.error,
    progress: state.progress,
    regenerate,
    document: state.document,
  };
}
