import { describe, it, expect, vi } from 'vitest';
import { RegexParser } from '../RegexParser';

describe('RegexParser', () => {
  it('should be importable and instantiable', () => {
    // Simple test to verify the class can be imported and instantiated
    const parser = new RegexParser();
    expect(parser).toBeInstanceOf(RegexParser);
  });

  it('should process text after exiting dependency mode', () => {
    // Create a spy to track emitted events
    const textSpy = vi.fn();
    
    // Create parser and register event handler
    const parser = new RegexParser();
    parser.on('text', textSpy);
    
    // Disable console.debug during test
    const originalConsoleDebug = console.debug;
    console.debug = vi.fn();
    
    // First, exit dependency mode by sending a dependency object
    parser.write('{"dependency": "1.0.0"}}');
    
    // Then send a text chunk
    const testText = 'Hello, World!';
    parser.write(testText);
    parser.end();
    
    // Restore console.debug
    console.debug = originalConsoleDebug;
    
    // Verify the text event was emitted
    expect(textSpy).toHaveBeenCalled();
  });

  it('should detect and process code blocks', () => {
    // Create spies to track emitted events
    const codeSpy = vi.fn();
    
    // Create parser and register event handlers
    const parser = new RegexParser();
    parser.on('code', codeSpy);
    
    // Disable console.debug during test
    const originalConsoleDebug = console.debug;
    console.debug = vi.fn();
    
    // Exit dependency mode first
    parser.write('{"dependency": "1.0.0"}}');
    
    // Send a code block
    parser.write('```javascript\nconsole.log("Hello, World!");\n```');
    parser.end();
    
    // Restore console.debug
    console.debug = originalConsoleDebug;
    
    // Verify the code event was emitted with the correct content
    expect(codeSpy).toHaveBeenCalled();
    expect(codeSpy.mock.calls[0][0]).toBe('console.log("Hello, World!");\n');
    expect(codeSpy.mock.calls[0][1]).toBe('javascript');
  });

  it('should emit codeBlockStart event when a code block starts', () => {
    // Create spies to track emitted events
    const codeBlockStartSpy = vi.fn();
    const codeSpy = vi.fn();
    
    // Create parser and register event handlers
    const parser = new RegexParser();
    parser.on('codeBlockStart', codeBlockStartSpy);
    parser.on('code', codeSpy);
    
    // Disable console.debug during test
    const originalConsoleDebug = console.debug;
    console.debug = vi.fn();
    
    // Exit dependency mode first
    parser.write('{"dependency": "1.0.0"}}');
    
    // Send a code block
    parser.write('Here is some code:\n```javascript\nconsole.log("Hello, World!");\n```');
    parser.end();
    
    // Restore console.debug
    console.debug = originalConsoleDebug;
    
    // Verify the codeBlockStart event was emitted
    expect(codeBlockStartSpy).toHaveBeenCalled();
    expect(codeBlockStartSpy).toHaveBeenCalledTimes(1);
    
    // Verify the code event was also emitted
    expect(codeSpy).toHaveBeenCalled();
    expect(codeSpy.mock.calls[0][0]).toBe('console.log("Hello, World!");\n');
  });

  it('should emit codeBlockStart event for each code block in a message', () => {
    // Create spies to track emitted events
    const codeBlockStartSpy = vi.fn();
    const codeSpy = vi.fn();
    
    // Create parser and register event handlers
    const parser = new RegexParser();
    parser.on('codeBlockStart', codeBlockStartSpy);
    parser.on('code', codeSpy);
    
    // Disable console.debug during test
    const originalConsoleDebug = console.debug;
    console.debug = vi.fn();
    
    // Exit dependency mode first
    parser.write('{"dependency": "1.0.0"}}');
    
    // Send a message with multiple code blocks
    parser.write('First code block:\n```javascript\nconsole.log("First");\n```\n');
    parser.write('Second code block:\n```python\nprint("Second")\n```');
    parser.end();
    
    // Restore console.debug
    console.debug = originalConsoleDebug;
    
    // Verify the codeBlockStart event was emitted twice
    expect(codeBlockStartSpy).toHaveBeenCalledTimes(2);
    
    // Verify the code event was also emitted twice, but the second call overwrites the first
    expect(codeSpy).toHaveBeenCalledTimes(2);
    // The last code block is what's stored in the parser
    expect(codeSpy.mock.calls[1][0]).toBe('print("Second")\n');
  });

  it('should parse dependencies correctly', () => {
    // Create spies to track emitted events
    const dependenciesSpy = vi.fn();
    
    // Create parser and register event handlers
    const parser = new RegexParser();
    parser.on('dependencies', dependenciesSpy);
    
    // Disable console.debug during test
    const originalConsoleDebug = console.debug;
    console.debug = vi.fn();
    
    // Send dependency data
    parser.write('{"react": "18.2.0", "typescript": "5.0.4"}}');
    parser.end();
    
    // Restore console.debug
    console.debug = originalConsoleDebug;
    
    // Verify the dependencies event was emitted with the correct content
    expect(dependenciesSpy).toHaveBeenCalled();
    expect(dependenciesSpy.mock.calls[0][0]).toEqual({
      react: '18.2.0',
      typescript: '5.0.4'
    });
    
    // Verify the dependencies were stored in the parser
    expect(parser.dependencies).toEqual({
      react: '18.2.0',
      typescript: '5.0.4'
    });
  });

  it('should properly handle language identifiers with tags in code blocks', () => {
    // Create spies to track emitted events
    const codeSpy = vi.fn();
    const codeBlockStartSpy = vi.fn();
    
    // Create parser and register event handlers
    const parser = new RegexParser();
    parser.on('code', codeSpy);
    parser.on('codeBlockStart', codeBlockStartSpy);
    
    // Disable console.debug during test
    const originalConsoleDebug = console.debug;
    console.debug = vi.fn();
    
    try {
      // Test with various language identifier formats
      const testCases = [
        // Test with colons
        { input: '```typescript:\nconsole.log("hello");\n```', expectedLang: 'typescript' },
        { input: '```javascript:\nconst x = 1;\n```', expectedLang: 'javascript' },
        
        // Test without colons
        { input: '```typescript\nconsole.log("hello");\n```', expectedLang: 'typescript' },
        { input: '```javascript\nconst x = 1;\n```', expectedLang: 'javascript' },
        
        // Test with different case
        { input: '```JavaScript\nconst x = 1;\n```', expectedLang: 'JavaScript' },
        { input: '```TypeScript\nconsole.log("hello");\n```', expectedLang: 'TypeScript' },
        
        // Test with common extensions
        { input: '```tsx\nconst Component = () => <div>Hello</div>;\n```', expectedLang: 'tsx' },
        { input: '```jsx\nconst Component = () => <div>Hello</div>;\n```', expectedLang: 'jsx' },
        
        // Test with other languages
        { input: '```python\nprint("hello")\n```', expectedLang: 'python' },
        { input: '```ruby\nputs "hello"\n```', expectedLang: 'ruby' },
        
        // Test with no language
        { input: '```\nconsole.log("no language");\n```', expectedLang: '' },
        
        // Test with whitespace
        { input: '``` javascript \nconst x = 1;\n```', expectedLang: 'javascript' },
        { input: '```javascript   \nconst x = 1;\n```', expectedLang: 'javascript' },
        
        // Test with trailing colon and whitespace
        { input: '```javascript:   \nconst x = 1;\n```', expectedLang: 'javascript' },
        
        // Test with just 'js' as language identifier
        { input: '```js\nconst x = 1;\n```', expectedLang: 'js' },
        

      ];
      
      for (const testCase of testCases) {
        // Reset parser state before each test case
        parser.reset();
        
        // Exit dependency mode first
        parser.write('{"dependency": "1.0.0"}}');
        
        // Process the input
        parser.write(testCase.input);
        
        // Verify code block start was detected
        expect(codeBlockStartSpy).toHaveBeenCalled();
        
        // Verify code was emitted with correct language
        expect(codeSpy).toHaveBeenCalledWith(
          expect.any(String),
          testCase.expectedLang.replace(/:$/, '') // Language ID should not have trailing colon
        );
        
        // Reset spies for next test case
        codeSpy.mockClear();
        codeBlockStartSpy.mockClear();
      }
    } finally {
      // Restore console.debug
      console.debug = originalConsoleDebug;
    }
  });
}); 