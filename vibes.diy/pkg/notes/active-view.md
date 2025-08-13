# Simplifying Routing and State Management for ResultPreviewHeaderContent

## Current Implementation Analysis

The current ResultPreviewHeaderContent component has several challenges:

1. **Overlapping Concerns**: URL routing, view state, loading states, and UI control are tightly coupled
2. **Redundant State**: activeView state exists alongside URL paths that also determine the view
3. **Complex Conditionals**: Multiple conditional checks for disabled states and view switching
4. **Manual URL Manipulation**: Direct path construction instead of using router capabilities

## Lean Solution: State Consolidation

A minimal approach focusing on reducing state redundancy and complexity:

```tsx
// ViewState.ts - Create a dedicated hook
import { useNavigate, useParams, useLocation } from "react-router-dom";
import { encodeTitle } from "../utils";

export type ViewType = "preview" | "code" | "data";

export function useViewState(props: {
  sessionId?: string;
  title?: string;
  code: string;
  isStreaming: boolean;
  previewReady: boolean;
}) {
  const { sessionId: paramSessionId, title: paramTitle } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  // Consolidate session and title from props or params
  const sessionId = props.sessionId || paramSessionId;
  const title = props.title || paramTitle;
  const encodedTitle = title ? encodeTitle(title) : "";

  // Derive view from URL path
  const getViewFromPath = (): ViewType => {
    if (location.pathname.endsWith("/app")) return "preview";
    if (location.pathname.endsWith("/code")) return "code";
    if (location.pathname.endsWith("/data")) return "data";
    return "preview"; // Default
  };

  const currentView = getViewFromPath();

  // Access control data
  const viewControls = {
    preview: {
      enabled: props.previewReady,
      icon: "app-icon",
      label: "App",
      loading: !props.previewReady,
    },
    code: {
      enabled: true,
      icon: "code-icon",
      label: "Code",
      loading: props.isStreaming && !props.previewReady,
    },
    data: {
      enabled: !props.isStreaming,
      icon: "data-icon",
      label: "Data",
      loading: false,
    },
  };

  // Navigate to a view
  const navigateToView = (view: ViewType) => {
    if (!viewControls[view].enabled) return;

    if (sessionId && encodedTitle) {
      const suffix = view === "preview" ? "app" : view;
      navigate(`/chat/${sessionId}/${encodedTitle}/${suffix}`);
    }
  };

  // Whether to show view controls at all
  const showViewControls = props.code.length > 0;

  return {
    currentView,
    navigateToView,
    viewControls,
    showViewControls,
    sessionId,
    encodedTitle,
  };
}
```

### Implementation:

```tsx
// ResultPreviewHeaderContent.tsx
const {
  currentView,
  navigateToView,
  viewControls,
  showViewControls,
  sessionId,
  encodedTitle,
} = useViewState({
  sessionId: propSessionId,
  title: propTitle,
  code,
  isStreaming,
  previewReady,
});

// Then in JSX:
{
  showViewControls && (
    <div className="...">
      {Object.entries(viewControls).map(([view, control]) => (
        <button
          key={view}
          onClick={() => navigateToView(view as ViewType)}
          disabled={!control.enabled}
          className={classNames({
            "active-class": currentView === view,
            "disabled-class": !control.enabled,
            "base-class": true,
          })}
        >
          {control.label}
        </button>
      ))}
    </div>
  );
}
```
