# Data Flow Indirection Patterns

## The Problem: Deep Prop Drilling for Firehose State

When adding the "Share to firehose" checkbox feature, I had to trace data through multiple layers of components and hooks. This revealed some complex indirection patterns that could be simplified.

## Current Data Flow Path

### The Long Chain for Firehose State:

1. **Data Source**: `VibeDocument.firehoseShared` (stored in Fireproof database)
2. **Data Access**: `useSession()` hook reads from database and provides `session.firehoseShared`
3. **Business Logic**: `usePublish()` hook handles publish operations and needs `updateFirehoseShared` callback
4. **Component Layer**: `ResultPreviewHeaderContent` orchestrates session data, publish logic, and modal
5. **UI Layer**: `ShareModal` displays checkbox and captures user input
6. **Back to Business**: Click handler calls `onPublish(shareToFirehose)` which flows back through the chain
7. **API Layer**: `publishUtils.publishApp()` sends to server and calls `updateFirehoseShared()`
8. **Data Persistence**: `useSession.updateFirehoseShared()` writes back to Fireproof database

### Props Threading Required:

```typescript
// Each component needs to thread multiple props:
ShareModal: { isFirehoseShared, onPublish: (shareToFirehose) => Promise<void> }
ResultPreviewHeaderContent: threads session.firehoseShared and updateFirehoseShared
usePublish: needs updateFirehoseShared callback
publishApp: needs updateFirehoseShared callback
```

## Patterns to Clean Up

### 1. **Reduce Callback Chains**

Instead of passing `updateFirehoseShared` through 4 layers, the `usePublish` hook could directly access session management:

```typescript
// Current: Thread callback through layers
publishApp({ updateFirehoseShared, ... })

// Better: Direct session access in usePublish
const usePublish = () => {
  const { updateFirehoseShared } = useSession()
  // Handle state updates internally
}
```

### 2. **Consolidate Related State**

The publish state and session state are closely related but managed separately:

```typescript
// Current: Split concerns
const session = useSession();
const publishState = usePublish({
  updateFirehoseShared: session.updateFirehoseShared,
});

// Better: Unified publish session state
const publishSession = usePublishSession(); // combines both
```

### 3. **Context for Deeply Shared State**

For state that many components need, consider React Context:

```typescript
// Better: Context eliminates prop drilling
const SessionContext = React.createContext();
const useSessionContext = () => useContext(SessionContext);
```

### 4. **State Machines for Complex Flows**

The publish flow has multiple states (unpublished → publishing → published → updating):

```typescript
// Current: Boolean flags scattered across components
const [isPublishing, setIsPublishing] = useState(false);
const [showUpdateSuccess, setShowUpdateSuccess] = useState(false);

// Better: Explicit state machine
const publishState = useStateMachine({
  idle: { on: { PUBLISH: "publishing" } },
  publishing: { on: { SUCCESS: "published", ERROR: "error" } },
  published: { on: { UPDATE: "updating" } },
  // ...
});
```

## Impact of Current Pattern

### Pros:

- Clear data flow (traceable)
- Explicit dependencies
- Good separation of concerns
- Testable in isolation

### Cons:

- High ceremony for simple state changes
- Many intermediate layers just for prop threading
- Tight coupling between distant components
- Difficult to add new publish-related features

## Recommended Refactoring Approach

1. **Short term**: Create a `usePublishSession()` hook that combines session and publish concerns
2. **Medium term**: Implement a SessionContext for widely-used session data
3. **Long term**: Consider state machine for complex publish workflows

This would reduce the 8-layer data flow to 3-4 layers while maintaining testability and separation of concerns.
