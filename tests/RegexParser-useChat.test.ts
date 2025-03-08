import { describe, it, expect, vi } from 'vitest';
import { RegexParser } from '../RegexParser';

describe('RegexParser in useChat context', () => {
  it('should handle code blocks and emit events that useChat would listen for', () => {
    // Create a parser instance
    const parser = new RegexParser();

    // Create spies for the events that useChat would listen for
    const textSpy = vi.fn();
    const codeSpy = vi.fn();
    const dependenciesSpy = vi.fn();

    // Register event handlers (similar to how useChat would)
    parser.on('text', textSpy);
    parser.on('code', codeSpy);
    parser.on('dependencies', dependenciesSpy);

    // Disable console.debug during test
    const originalConsoleDebug = console.debug;
    console.debug = vi.fn();

    // Simulate a chat response with dependencies and code
    parser.write('{"react": "18.2.0", "typescript": "5.0.4"}}');
    parser.write('Here is a simple React component:');
    parser.write('```jsx\nfunction HelloWorld() {\n  return <div>Hello, World!</div>;\n}\n```');
    parser.end();

    // Restore console.debug
    console.debug = originalConsoleDebug;

    // Verify dependencies were emitted (useChat would store these)
    expect(dependenciesSpy).toHaveBeenCalled();
    expect(dependenciesSpy.mock.calls[0][0]).toEqual({
      react: '18.2.0',
      typescript: '5.0.4',
    });

    // Verify text was emitted (useChat would display this)
    expect(textSpy).toHaveBeenCalled();

    // Verify code was emitted (useChat would pass this to onCodeGenerated)
    expect(codeSpy).toHaveBeenCalled();
    expect(codeSpy.mock.calls[0][0]).toContain('function HelloWorld()');
    expect(codeSpy.mock.calls[0][1]).toBe('jsx');

    // Verify the code content is stored in the parser (useChat would access this)
    expect(parser.codeBlockContent).toContain('function HelloWorld()');
  });

  it('should ensure code blocks start with import statement', () => {
    // Create a parser instance
    const parser = new RegexParser();

    // Create a spy for the code event
    const codeSpy = vi.fn();
    const codeBlockStartSpy = vi.fn();

    // Register event handlers
    parser.on('code', codeSpy);
    parser.on('codeBlockStart', codeBlockStartSpy);

    // Disable console.debug during test
    const originalConsoleDebug = console.debug;
    console.debug = vi.fn();

    // Simulate a chat response with a code block that has content before import
    parser.write('{"dependencies": {}}');
    parser.write('# Pomodoro Timer App\n\n');
    parser.write(
      '```jsx\nfunction PomodoroApp() {\n  // Some code\n}\n\nimport React, { useState, useEffect } from "react";\nimport { useFireproof } from "use-fireproof";\n\nexport default function App() {\n  // Code here\n}\n```'
    );
    parser.end();

    // Restore console.debug
    console.debug = originalConsoleDebug;

    // Verify code was emitted
    expect(codeSpy).toHaveBeenCalled();

    // Verify the code content starts with import (parser should have adjusted it)
    const codeContent = codeSpy.mock.calls[0][0];
    expect(codeContent.trim().startsWith('import')).toBe(true);

    // Verify the content before import was removed
    expect(codeContent).not.toContain('function PomodoroApp()');

    // Verify the content after import was preserved
    expect(codeContent).toContain('import React');
    expect(codeContent).toContain('export default function App()');
  });

  it('should handle incomplete JSX import statements', () => {
    // Create a parser instance
    const parser = new RegexParser();

    // Create spies for the events
    const codeSpy = vi.fn();
    const textSpy = vi.fn();
    const dependenciesSpy = vi.fn();

    // Register event handlers
    parser.on('code', codeSpy);
    parser.on('text', textSpy);
    parser.on('dependencies', dependenciesSpy);

    // Disable console.debug during test
    const originalConsoleDebug = console.debug;
    console.debug = vi.fn();

    try {
      // Simulate a raw dependencies buffer
      parser.write('{dependencies: {}}');

      // Add some markdown text
      parser.write('\n\n# Pomodoro Timer App\n\n');
      parser.write(
        'This Pomodoro timer app lets you track work/break cycles with customizable durations. It persists timer settings and session history with Fireproof, allowing you to review your productivity sessions.\n\n'
      );

      // Write an incomplete JSX code block with unfinished import
      parser.write('```jsx\nimport React, { useState, useEffect,\n```');

      // End the stream
      parser.end();

      // Check what was parsed
      console.log('Dependencies:', parser.dependencies);
      console.log('Code content:', parser.codeBlockContent);

      // Verify the parser handled the incomplete code properly
      expect(parser.inCodeBlock).toBe(false); // Should have exited code block mode
      expect(parser.codeBlockContent).toContain('import React'); // Should have captured partial import
      expect(parser.codeBlockContent).toContain('useEffect'); // Should have captured partial import

      // Check if dependencies were properly parsed
      expect(dependenciesSpy).toHaveBeenCalled();
      expect(parser.dependencies).toEqual({});
    } finally {
      // Restore console.debug
      console.debug = originalConsoleDebug;
    }
  });
});
