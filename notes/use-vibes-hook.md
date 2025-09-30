# useVibes Hook Development Plan

## Overview
Create a `useVibes` hook that generates React components from text prompts using AI, with automatic caching and persistence using Fireproof database.

## API Design

```typescript
// Primary usage
const result = useVibes("create a todo list", options);

// Result object
result.App        // React component (ready to render)
result.code       // Raw JSX source code
result.loading    // Boolean: generation in progress
result.error      // Error object if something failed
result.progress   // Number: 0-100 generation progress
result.regenerate // Function: force regeneration

// Options (all optional)
{
  database?: string;      // Database name (default: 'vibes')
  model?: string;         // AI model to use
  skip?: boolean;         // Skip generation
  regenerate?: boolean;   // Force regeneration
  dependencies?: string[];// Helper libraries to include
  _id?: string;          // Load existing vibe by ID
}
```

## Example Usage

```jsx
import { useVibes } from 'use-vibes';

function MyApp() {
  const { App, loading, error } = useVibes(
    "Create a todo list with add and delete functionality",
    { database: "my-apps" }
  );

  if (loading) return <div>Generating app...</div>;
  if (error) return <div>Error: {error.message}</div>;
  if (!App) return null;

  return <App />;
}
```

## Implementation Architecture

### File Structure
```
use-vibes/base/hooks/vibes-gen/
├── index.ts              // Main export
├── use-vibes.ts          // Hook implementation
├── vibes-generator.ts    // AI generation logic
├── code-compiler.ts      // JSX → Component
├── types.ts              // TypeScript interfaces
└── utils.ts              // Hash, validation helpers
```

### Database Schema
```typescript
interface VibeDocument {
  _id: string;              // Hash of prompt + options
  prompt: string;           // Original prompt
  code: string;             // Generated JSX code
  title: string;            // Component title
  dependencies: string[];   // Required dependencies
  model: string;            // AI model used
  created_at: number;       // Timestamp
  version: number;          // For future versioning
  metadata?: {
    tokens_used?: number;
    generation_time?: number;
  };
}
```

## Test-First Development Cycles

### Cycle 1: Basic Hook Structure with Mocked Components
**Goal:** Establish the hook API and basic state management

#### Tests First:
```typescript
// use-vibes/tests/useVibes.basic.test.tsx
describe('useVibes - Basic Structure', () => {
  it('should accept prompt string and optional options', () => {
    const { result } = renderHook(() => useVibes('create a button'));
    
    expect(result.current.loading).toBe(true);
    expect(result.current.App).toBe(null);
    expect(result.current.code).toBe(null);
    expect(result.current.error).toBe(null);
  });

  it('should return App component after loading', async () => {
    mockCallAI.mockResolvedValue('export default function() { return <div>Test</div> }');
    
    const { result } = renderHook(() => useVibes('create a button'));
    
    await waitFor(() => expect(result.current.loading).toBe(false));
    
    expect(result.current.App).toBeDefined();
    expect(result.current.code).toContain('Test');
  });

  it('should accept options as second parameter', async () => {
    const { result } = renderHook(() => 
      useVibes('create a form', { 
        database: 'custom-db',
        model: 'gpt-4'
      })
    );
    
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.App).toBeDefined();
  });

  it('should handle empty prompt gracefully', () => {
    const { result } = renderHook(() => useVibes(''));
    
    expect(result.current.loading).toBe(false);
    expect(result.current.App).toBe(null);
    expect(result.current.error?.message).toContain('Prompt required');
  });

  it('should handle errors from AI service', async () => {
    mockCallAI.mockRejectedValue(new Error('Service unavailable'));
    
    const { result } = renderHook(() => useVibes('create button'));
    
    await waitFor(() => expect(result.current.error).toBeDefined());
    expect(result.current.error.message).toBe('Service unavailable');
    expect(result.current.App).toBe(null);
  });
});
```

#### Implementation Steps:
1. Create basic hook structure with state management
2. Mock AI responses for testing
3. Implement loading states and error handling
4. Return mock component for now

#### Deliverables:
- `use-vibes.ts` (basic version)
- `types.ts` with interfaces
- Passing test suite

---

### Cycle 2: Database Persistence & Caching
**Goal:** Add Fireproof database integration for persistence

#### Tests First:
```typescript
// use-vibes/tests/useVibes.persistence.test.tsx
describe('useVibes - Database Persistence', () => {
  it('should cache generated components', async () => {
    const prompt = 'create a cached button';
    
    // First call - generates new
    const { result: result1 } = renderHook(() => useVibes(prompt));
    await waitFor(() => expect(result1.current.loading).toBe(false));
    const firstCode = result1.current.code;
    
    // Second call - loads from cache
    mockCallAI.mockClear();
    const { result: result2 } = renderHook(() => useVibes(prompt));
    await waitFor(() => expect(result2.current.loading).toBe(false));
    
    expect(mockCallAI).not.toHaveBeenCalled();
    expect(result2.current.code).toBe(firstCode);
  });

  it('should use custom database name from options', async () => {
    const { result } = renderHook(() => 
      useVibes('test prompt', { database: 'my-custom-db' })
    );
    
    await waitFor(() => expect(result.current.loading).toBe(false));
    
    // Verify it used the custom database
    const db = fireproof('my-custom-db');
    const docs = await db.query('prompt');
    expect(docs.rows.length).toBeGreaterThan(0);
  });

  it('should load existing vibe by _id', async () => {
    // Pre-populate database
    const db = fireproof('vibes');
    await db.put({
      _id: 'existing-123',
      prompt: 'original prompt',
      code: 'export default function() { return <div>Existing</div> }',
      created_at: Date.now()
    });
    
    // Load by _id (prompt ignored when _id provided)
    const { result } = renderHook(() => 
      useVibes('', { _id: 'existing-123' })
    );
    
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.code).toContain('Existing');
    expect(mockCallAI).not.toHaveBeenCalled();
  });

  it('should regenerate when regenerate option is true', async () => {
    const prompt = 'regenerate test';
    
    // First generation
    const { result: result1 } = renderHook(() => useVibes(prompt));
    await waitFor(() => expect(result1.current.loading).toBe(false));
    
    // Force regeneration
    mockCallAI.mockClear();
    mockCallAI.mockResolvedValue('export default function() { return <div>New</div> }');
    
    const { result: result2 } = renderHook(() => 
      useVibes(prompt, { regenerate: true })
    );
    
    await waitFor(() => expect(result2.current.loading).toBe(false));
    expect(mockCallAI).toHaveBeenCalled();
    expect(result2.current.code).toContain('New');
  });
});
```

#### Implementation Steps:
1. Integrate Fireproof database
2. Implement prompt hashing for document IDs
3. Add cache checking logic
4. Store and retrieve vibe documents
5. Handle `_id` parameter
6. Implement regenerate flag

#### Deliverables:
- Enhanced `use-vibes.ts` with database
- `utils.ts` with hashing functions
- Persistence tests passing

---

### Cycle 3: Dynamic Component Compilation
**Goal:** Compile JSX strings into executable React components

#### Tests First:
```typescript
// use-vibes/tests/useVibes.compilation.test.tsx
describe('useVibes - Component Compilation', () => {
  it('should compile code to working App component', async () => {
    const { result } = renderHook(() => 
      useVibes('create a hello world button')
    );
    
    await waitFor(() => expect(result.current.App).toBeDefined());
    
    // Render the App component
    const { getByText } = render(<result.current.App />);
    expect(getByText(/hello|button/i)).toBeInTheDocument();
  });

  it('should handle components with React hooks', async () => {
    mockCallAI.mockResolvedValue(`
      import { useState } from 'react';
      export default function Counter() {
        const [count, setCount] = useState(0);
        return (
          <div>
            <p>Count: {count}</p>
            <button onClick={() => setCount(c => c + 1)}>Increment</button>
          </div>
        );
      }
    `);
    
    const { result } = renderHook(() => useVibes('create a counter'));
    await waitFor(() => expect(result.current.App).toBeDefined());
    
    const { getByText } = render(<result.current.App />);
    const button = getByText('Increment');
    
    expect(getByText('Count: 0')).toBeInTheDocument();
    fireEvent.click(button);
    expect(getByText('Count: 1')).toBeInTheDocument();
  });

  it('should handle invalid JSX gracefully', async () => {
    mockCallAI.mockResolvedValue('export default function() { <div>Unclosed');
    
    const { result } = renderHook(() => useVibes('broken component'));
    
    await waitFor(() => expect(result.current.error).toBeDefined());
    expect(result.current.error.message).toContain('compilation');
    expect(result.current.App).toBe(null);
  });

  it('should support components with props', async () => {
    mockCallAI.mockResolvedValue(`
      export default function Greeting({ name = "World" }) {
        return <h1>Hello, {name}!</h1>;
      }
    `);
    
    const { result } = renderHook(() => useVibes('greeting component'));
    await waitFor(() => expect(result.current.App).toBeDefined());
    
    const { getByText } = render(<result.current.App name="Test" />);
    expect(getByText('Hello, Test!')).toBeInTheDocument();
  });
});
```

#### Implementation Steps:
1. Create `code-compiler.ts` module
2. Transform imports (React, hooks)
3. Extract default export
4. Create component using Function constructor
5. Add error boundary wrapper
6. Handle props properly

#### Deliverables:
- `code-compiler.ts` implementation
- Integration with main hook
- Compilation tests passing

---

## Future Cycles

### Cycle 4: Real AI Integration
- Replace mocked AI with actual call-ai integration
- Add streaming support
- Progress tracking

### Cycle 5: Advanced Features
- Version history
- Diff tracking
- Rollback capability

### Cycle 6: Production Optimizations
- Bundle size optimization
- Performance improvements
- Memory management

## Success Metrics

### Cycle 1 ✓
- [ ] Clean API: `useVibes(prompt, options)`
- [ ] Returns `{ App, code, loading, error, progress }`
- [ ] Basic state management works
- [ ] Error handling in place
- [ ] All tests passing

### Cycle 2 ✓
- [ ] Caches generated components in Fireproof
- [ ] Avoids regeneration for same prompts
- [ ] Supports loading by _id
- [ ] Regenerate flag works
- [ ] All tests passing

### Cycle 3 ✓
- [ ] JSX compiles to executable React components
- [ ] Components with hooks work
- [ ] Props are supported
- [ ] Compilation errors handled gracefully
- [ ] App component renders correctly
- [ ] All tests passing

## Integration Plan

1. **Export from use-vibes package:**
   ```typescript
   // use-vibes/pkg/index.ts
   export { useVibes } from '@vibes.diy/use-vibes-base';
   ```

2. **Add to base exports:**
   ```typescript
   // use-vibes/base/index.ts
   export { useVibes } from './hooks/vibes-gen/index.js';
   ```

3. **Documentation:**
   - Add examples to README
   - Create Storybook stories
   - Add to package documentation

## Notes

- Follow the same patterns as `useImageGen` for consistency
- Use existing utilities where possible (hashing, database access)
- Ensure proper TypeScript types throughout
- Keep test coverage high
- Consider security implications of dynamic code execution