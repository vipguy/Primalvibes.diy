# Lazy Session Render Loop Investigation

## Problem Summary

After implementing lazy sessionId initialization with SessionWrapper/SessionView pattern, we discovered a **massive render loop** in SessionView causing thousands of re-renders per second.

## Current Status

- **SessionSidebar memo is working correctly** - props are stable, memo returns `true` (SKIPPED)
- **SessionId is now stable** - no longer changing from null to actual values
- **SessionView is re-rendering constantly** - 6000+ renders observed
- **Root cause unknown** - persists after disabling suspected hooks

## Investigation Steps Taken

### ✅ Fixed Original SessionId Instability
- **Problem**: `useSimpleChat(sessionId)` called with changing values (null → actual ID)
- **Solution**: Created SessionWrapper/SessionView pattern with lazy initialization
- **Result**: sessionId is now stable, but revealed deeper render loop issue

### ✅ Confirmed Memo is Working
- SessionSidebar memo comparison shows all props identical
- Logs show "SKIPPED" - component not actually re-rendering
- Counter: `memo-session-sidebar #3217 - SKIPPED`

### ✅ Eliminated Navigation Loop
- **Tested**: Disabled URL navigation useEffect that could cause navigate() → location.pathname → useEffect loop
- **Result**: Render loop persists, not the cause

### ✅ Eliminated ViewState Loop  
- **Tested**: Disabled `useViewState` hook entirely
- **Result**: Render loop persists, not the cause

## Current Evidence

```
SessionView render #6439
SessionView render #6440  
memo-session-sidebar #3217 - SKIPPED {
  isVisible: {prev: false, next: false, same: true},
  onClose: {same: true}, 
  sessionId: {prev: 'session-1756943737981', next: 'session-1756943737981', same: true}
}
```

**Pattern**: SessionView renders ~2 times per memo check, indicating internal state updates causing immediate re-renders.

## Remaining Suspects

### 1. useSimpleChat Hook
- Most likely culprit - complex hook with many state variables
- Could be returning new object references on every call
- Contains useSession, useFireproof, multiple useEffect calls

### 2. State Update Loops
- One of the many useState variables causing cascading updates:
  ```tsx
  const [hasSubmittedMessage, setHasSubmittedMessage] = useState(false);
  const [capturedPrompt, setCapturedPrompt] = useState<string | null>(null);
  const [previewReady, setPreviewReady] = useState(false);
  const [mobilePreviewShown, setMobilePreviewShown] = useState(false);
  const [isIframeFetching, setIsIframeFetching] = useState(false);
  const [hasCodeChanges, setHasCodeChanges] = useState(false);
  const [codeSaveHandler, setCodeSaveHandler] = useState<(() => void) | null>(null);
  const [syntaxErrorCount, setSyntaxErrorCount] = useState(0);
  const [isSidebarVisible, setIsSidebarVisible] = useState(false);
  const [userClickedBack, setUserClickedBack] = useState(false);
  ```

### 3. useEffect Dependency Issues
- Multiple useEffect hooks with missing or incorrect dependencies
- Could be triggering each other in cascade

### 4. Context Updates
- useCookieConsent or other contexts causing frequent updates
- Context value changes triggering all consumers

## Next Steps

### Immediate Actions
1. **Isolate useSimpleChat**: Replace with mock data to test if it's the source
2. **Binary search state**: Temporarily remove useState variables one by one
3. **Effect auditing**: Review all useEffect dependencies for correctness
4. **Context debugging**: Check if context providers are updating frequently

### Investigation Commands
```bash
# Test with minimal SessionView
# Comment out hooks one by one until render loop stops
```

## Architecture Impact

This render loop demonstrates why the lazy sessionId pattern is critical:
- **Before fix**: sessionId instability caused memo spam
- **After fix**: Revealed deeper performance issues in SessionView
- **Lesson**: Component render optimization requires multiple layers of fixes

## Files Affected

- `/vibes.diy/pkg/app/components/SessionView.tsx` - Main component with render loop
- `/vibes.diy/pkg/app/components/SessionSidebar.tsx` - Working memo implementation  
- `/vibes.diy/pkg/app/routes/home.tsx` - SessionWrapper with lazy initialization
- `/vibes.diy/pkg/app/hooks/useSimpleChat.ts` - Suspected render loop source

## Resolution Strategy

1. **Phase 1**: Identify exact source of render loop
2. **Phase 2**: Fix unstable state/hooks causing re-renders
3. **Phase 3**: Optimize SessionView render performance
4. **Phase 4**: Remove debug logging and finalize implementation

---

*Last Updated: 2025-01-04*  
*Status: Under Investigation*