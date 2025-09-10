# Playwright Console Logging Strategy for React Router Debugging

## Problem
We discovered that SessionView has infinite re-renders in the browser environment but works perfectly in tests. The key difference: tests use `DISABLE_REACT_ROUTER=true` while browser uses full React Router.

## Testing Strategy

### React Router State Logging
We've added comprehensive logging to identify if React Router hooks are causing the infinite loop:

```javascript
// Added to SessionView.tsx
console.log(`SessionView ${sessionId} React Router state:`, {
  pathname: location?.pathname,
  search: location?.search,
  hash: location?.hash,
  key: location?.key,
  state: location?.state,
  navigateFunction: typeof navigate,
  timestamp: Date.now(),
});
```

### Navigation Event Logging
Track all navigation calls to detect navigation loops:

```javascript
// SessionView navigation logging
console.log(`SessionView ${sessionId} NAVIGATING:`, {
  from: location.pathname,
  to: newUrl,
  reason: 'URL update effect',
  timestamp: Date.now(),
});

// ViewState navigation logging  
console.log(`ViewState NAVIGATING:`, {
  from: location.pathname,
  to: `/chat/${sessionId}/${encodedTitle}/app`,
  reason: 'Preview ready - navigate to app',
  timestamp: Date.now(),
});
```

### What to Look For

1. **Location Changes**: If `location.key` or other location properties change on every render
2. **Navigation Loops**: Repeated navigation between the same URLs
3. **Router Hook Instability**: If `useNavigate` or `useLocation` return new references on every render

### Test Execution
```bash
# Run with manual browser inspection
npx playwright test --headed

# Focus on these log patterns:
# - SessionView React Router state (every render)
# - NAVIGATING events (only when navigation occurs)
# - Correlation between navigation and re-renders
```

### Expected Findings

**If React Router is the culprit:**
- Navigation events trigger re-renders
- Location changes cause cascading effects
- Router hooks return unstable references

**If React Router is NOT the culprit:**
- Navigation events are minimal/stable
- Location state remains consistent
- The infinite loop continues without navigation

### Alternative Testing
If Playwright fails, we can test directly in browser dev tools:
```javascript
// Manual browser console test
let renderCount = 0;
const originalConsoleLog = console.log;
console.log = (...args) => {
  if (args[0]?.includes?.('SessionView') && args[0]?.includes?.('render #')) {
    renderCount++;
    if (renderCount > 50) {
      debugger; // Break when infinite loop detected
    }
  }
  originalConsoleLog(...args);
};
```

## Next Steps
1. Execute Playwright test with React Router logging
2. Analyze navigation patterns vs re-render patterns  
3. If React Router confirmed as culprit, implement navigation stabilization
4. If not React Router, investigate other environment differences (Fireproof, etc.)

## Key Insight
The fact that tests (without React Router) work perfectly while browser (with React Router) fails strongly suggests React Router integration is the root cause of the infinite re-render issue.