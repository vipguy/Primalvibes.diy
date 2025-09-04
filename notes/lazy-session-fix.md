# Lazy Session Fix - Component Separation Architecture

## Problem

Current `SessionView` component expects `sessionId: string` and immediately calls `useSimpleChat(sessionId)`, which triggers database initialization even when we want deferred session creation for the root URL `/`.

## Solution: Component Separation

### New Architecture

1. **`SessionView`** - New wrapper component handling `sessionId: string | null`
   - When `sessionId` is null → Render new session UI 
   - When `sessionId` exists → Render `<SessionIdView sessionId={sessionId} />`

2. **`SessionIdView`** - Rename current SessionView 
   - Keeps existing behavior: expects `sessionId: string`
   - Calls `useSimpleChat(sessionId)` and handles all complex state

### Implementation Flow

```tsx
// home.tsx - SessionWrapper
export default function SessionWrapper() {
  const { sessionId: urlSessionId } = useParams<{ sessionId: string }>();
  const [sessionId, setSessionId] = useState<string | null>(urlSessionId || null);

  // No eager sessionId generation!
  // sessionId stays null for root URL until user action

  return <SessionView sessionId={sessionId} onSessionCreate={setSessionId} />;
}

// SessionView.tsx (new wrapper component)
interface SessionViewProps {
  sessionId: string | null;
  onSessionCreate: (id: string) => void;
}

export default function SessionView({ sessionId, onSessionCreate }: SessionViewProps) {
  if (!sessionId) {
    return <NewSessionUI onSessionCreate={onSessionCreate} />;
  }
  return <SessionIdView sessionId={sessionId} />;
}

// SessionIdView.tsx (renamed from current SessionView.tsx)
interface SessionIdViewProps {
  sessionId: string; // Always guaranteed to be non-null
}

export default function SessionIdView({ sessionId }: SessionIdViewProps) {
  const chatState = useSimpleChat(sessionId); // Now always gets valid string
  // ... rest of current SessionView logic unchanged
}
```

## Benefits

- **True lazy behavior**: No database operations until sessionId exists
- **Clean interfaces**: SessionIdView guarantees non-null sessionId  
- **Gradual migration**: Can implement new session creation UI incrementally
- **Better separation**: Session creation logic separate from session management

## Migration Steps

1. **Rename current SessionView** to SessionIdView
2. **Create new SessionView wrapper** with conditional rendering
3. **Update home.tsx** to remove eager sessionId generation
4. **Implement NewSessionUI** component for null sessionId state
5. **Add session creation trigger** in message send flow

## URL Prompt Handling

URL prompts (`/?prompt=hello`) will work by:
1. Rendering NewSessionUI initially (sessionId is null)
2. Auto-populating input with prompt text
3. Auto-submitting message after short delay
4. Session creation triggered by message send
5. Navigation to proper session URL after creation

## Files to Modify

- `vibes.diy/pkg/app/routes/home.tsx` - Remove eager generation
- `vibes.diy/pkg/app/components/SessionView.tsx` - Create wrapper  
- `vibes.diy/pkg/app/components/SessionIdView.tsx` - Rename current SessionView
- Tests for the new lazy session creation flow

---

*Created: 2025-09-04*  
*Status: Ready for Implementation*