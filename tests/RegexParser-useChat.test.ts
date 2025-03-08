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
});
