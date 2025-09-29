# Dynamic React Component Compilation in useVibes Hook

## Overview
This document outlines the approach for dynamically compiling and executing React components extracted from AI responses in the `useVibes` hook, without using iframes.

## Current State
The `useVibes` hook currently:
1. Receives AI-generated React component code as a string
2. Uses `parseContent` to extract code blocks from the response
3. Returns a mock component that displays the extracted code

## Example Generated Code
```javascript
import React, { useState } from "react"
import { callAI } from "call-ai"
import { useFireproof } from "use-fireproof"

export default function App() {
  const { useDocument, useLiveQuery, database } = useFireproof("button-gallery-db")
  
  const { doc: newButton, merge: mergeNewButton, submit: submitNewButton } = useDocument({
    type: "button",
    label: "",
    color: "#70d6ff",
    hoverColor: "#ff70a6",
    style: "rounded",
    createdAt: Date.now()
  })

  const { docs: buttons } = useLiveQuery("type", { key: "button", descending: true })
  
  const [selectedButton, setSelectedButton] = useState(null)
  const [isGenerating, setIsGenerating] = useState(false)
  // ... rest of component
}
```

## Implementation Approaches

### Option 1: Babel Standalone with Dynamic Module Creation (Recommended)

#### Advantages
- Full JSX support with proper transformation
- Can handle modern JavaScript syntax
- Well-tested solution used by online code playgrounds

#### Implementation
```javascript
import * as Babel from '@babel/standalone';

async function compileComponent(code) {
  // Transform imports to use esm.sh
  const transformedCode = code
    .replace(/from ["']react["']/g, 'from "https://esm.sh/react"')
    .replace(/from ["']call-ai["']/g, 'from "https://esm.sh/call-ai"')
    .replace(/from ["']use-fireproof["']/g, 'from "https://esm.sh/use-fireproof"');

  // Compile JSX to JavaScript
  const compiled = Babel.transform(transformedCode, {
    presets: ['react', 'env'],
    plugins: [['transform-react-jsx', { runtime: 'automatic' }]]
  }).code;

  // Create module as data URL
  const moduleURL = `data:text/javascript;charset=utf-8,${encodeURIComponent(compiled)}`;
  
  // Dynamically import the module
  const module = await import(moduleURL);
  return module.default;
}
```

### Option 2: Direct ESM Module Creation

#### Advantages
- No Babel dependency needed
- Smaller bundle size
- Faster execution

#### Limitations
- Requires pre-transformed JSX (no JSX syntax support)
- Would need server-side transformation or AI to generate React.createElement calls

#### Implementation
```javascript
async function createComponentFromCode(code) {
  // Transform imports
  const transformedCode = transformImports(code);
  
  // Create blob URL for the module
  const blob = new Blob([transformedCode], { type: 'text/javascript' });
  const moduleURL = URL.createObjectURL(blob);
  
  try {
    const module = await import(moduleURL);
    return module.default;
  } finally {
    URL.revokeObjectURL(moduleURL);
  }
}
```

### Option 3: Function Constructor Pattern

#### Implementation
```javascript
function compileWithFunction(code, React, dependencies) {
  const compiledCode = Babel.transform(code, {
    presets: ['react'],
  }).code;
  
  // Remove exports and create function
  const functionBody = compiledCode
    .replace(/export\s+default\s+/, 'return ')
    .replace('"use strict";', '');
  
  const ComponentFunction = new Function('React', ...Object.keys(dependencies), functionBody);
  return ComponentFunction(React, ...Object.values(dependencies));
}
```

## Import Transformation Strategy

### Core Import Map
```javascript
const importMap = {
  'react': 'https://esm.sh/react@18',
  'react-dom': 'https://esm.sh/react-dom@18',
  'call-ai': 'https://esm.sh/call-ai',
  'use-fireproof': 'https://esm.sh/use-fireproof',
  'use-vibes': 'https://esm.sh/use-vibes'
};
```

### Transform Function
```javascript
function transformImports(code) {
  return code.replace(
    /import\s+(?:(?:\{[^}]*\}|\*\s+as\s+\w+|\w+)\s+from\s+)?['"]([^'"]+)['"];?/g,
    (match, importPath) => {
      if (importMap[importPath]) {
        return match.replace(importPath, importMap[importPath]);
      }
      // Default to esm.sh for unknown packages
      if (!importPath.startsWith('http') && !importPath.startsWith('./')) {
        return match.replace(importPath, `https://esm.sh/${importPath}`);
      }
      return match;
    }
  );
}
```

## Security Considerations

### Risks
- **XSS Vulnerability**: Executing arbitrary code from AI responses
- **Code Injection**: Malicious code could access localStorage, cookies, etc.
- **Resource Exhaustion**: Infinite loops or memory leaks

### Mitigations
1. **Content Security Policy**: Restrict what the dynamic code can access
2. **Sandboxing**: Run in a limited context with restricted globals
3. **Validation**: Check code for dangerous patterns before execution
4. **Error Boundaries**: Wrap dynamic components in React error boundaries
5. **Timeout**: Implement execution timeouts

## Error Handling

```javascript
class ComponentErrorBoundary extends React.Component {
  state = { hasError: false, error: null };
  
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }
  
  render() {
    if (this.state.hasError) {
      return (
        <div className="error-container">
          <h3>Component Error</h3>
          <pre>{this.state.error?.message}</pre>
        </div>
      );
    }
    return this.props.children;
  }
}

// Usage
<ComponentErrorBoundary>
  <DynamicComponent />
</ComponentErrorBoundary>
```

## Integration with useVibes Hook

```javascript
function useVibes(prompt, options) {
  const [state, setState] = useState({
    App: null,
    code: null,
    loading: true,
    error: null
  });

  useEffect(() => {
    async function generateAndCompile() {
      try {
        // Get AI response
        const response = await callAI(prompt, options);
        
        // Parse to extract code
        const { segments } = parseContent(response);
        const codeSegment = segments.find(s => s.type === 'code');
        
        if (codeSegment) {
          // Compile the code into a component
          const Component = await compileComponent(codeSegment.content);
          
          setState({
            App: Component,
            code: codeSegment.content,
            loading: false,
            error: null
          });
        }
      } catch (error) {
        setState(prev => ({
          ...prev,
          loading: false,
          error
        }));
      }
    }
    
    generateAndCompile();
  }, [prompt]);

  return state;
}
```

## Performance Optimizations

1. **Caching**: Cache compiled components by code hash
2. **Lazy Loading**: Load Babel only when needed
3. **Worker Thread**: Move compilation to a Web Worker
4. **Pre-compilation**: Have AI generate pre-compiled code when possible

## Browser Compatibility

- **Dynamic import()**: Chrome 63+, Firefox 67+, Safari 11.1+
- **Babel Standalone**: All modern browsers
- **ESM.sh**: All browsers supporting ES modules

## Testing Strategy

1. **Unit Tests**: Test import transformation and compilation functions
2. **Integration Tests**: Test full flow from AI response to rendered component
3. **Error Cases**: Test malformed JSX, missing imports, runtime errors
4. **Performance Tests**: Measure compilation time for various component sizes
5. **Security Tests**: Verify sandboxing and CSP restrictions work

## Alternative: Keep Iframe Approach

### Pros of Current Iframe Approach
- Complete isolation from host application
- Natural sandboxing for security
- Can use different React versions
- Easy CSP implementation

### Cons of Iframe Approach
- Communication overhead (postMessage)
- Styling challenges
- Limited interaction with host app
- Additional network requests

## Recommendation

For the initial implementation, **Option 1 (Babel Standalone)** is recommended because:
1. It provides the most complete JSX support
2. It's a proven solution used by CodePen, JSFiddle, etc.
3. It handles edge cases in JSX transformation well
4. The performance overhead is acceptable for development use

For production, consider pre-compiling components on the server or using a more restricted subset of React that doesn't require JSX.