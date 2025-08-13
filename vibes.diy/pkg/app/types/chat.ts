import type { DocBase } from "use-fireproof";
import type { RuntimeError } from "../hooks/useRuntimeErrors";
import type { ViewType } from "../utils/ViewState"; // Import ViewType
export type { ViewType } from "../utils/ViewState"; // Re-export ViewType

// ===== Vibe Document Type =====
export interface VibeDocument {
  readonly _id: "vibe";
  readonly title: string;
  readonly encodedTitle: string;
  readonly remixOf: string;
  readonly created_at: number;
  readonly slug?: string;
  readonly favorite?: boolean;
  readonly publishedUrl?: string;
  readonly firehoseShared?: boolean;
}

// ===== Content Segment Types =====
export interface Segment {
  readonly type: "markdown" | "code";
  readonly content: string;
}

// ===== Document Types =====

export interface BaseChatMessageDocument {
  readonly _id?: string;
  readonly session_id: string;
  readonly text: string;
  readonly created_at: number;
}

export type UserChatMessageDocument = BaseChatMessageDocument & {
  readonly type: "user";
};

export type AiChatMessageDocument = BaseChatMessageDocument & {
  readonly type: "ai";
  readonly model?: string; // The model used to generate this message
};

export type SystemChatMessageDocument = BaseChatMessageDocument & {
  readonly type: "system";
  readonly errorType?: string; // Type of error if this is an error message
  readonly errorCategory?: "immediate" | "advisory"; // Category of error
};

export type ChatMessageDocument =
  | UserChatMessageDocument
  | AiChatMessageDocument
  | SystemChatMessageDocument;

/**
 * Document type for screenshot entries
 */
export interface ScreenshotDocument extends Omit<DocBase, "_files"> {
  readonly type: "screenshot";
  readonly session_id: string;
  readonly _files?: {
    readonly screenshot: { readonly file: () => Promise<File>; type: string };
  };
}

// Note: We already have a SessionDocument interface, so merged the properties
export interface SessionDocument extends Partial<DocBase> {
  readonly _id?: string;
  readonly type: "session"; // Document type for Fireproof queries
  readonly title?: string;
  readonly created_at: number;
  readonly favorite?: boolean; // Added favorite property for starring sessions
  readonly publishedUrl?: string; // URL where the app is published
  readonly messages?: {
    readonly text: string;
    readonly type: "user" | "ai" | "system";
    readonly code?: string;
    readonly dependencies?: Record<string, string>;
  }[];
}

/**
 * Union type for documents returned by query
 */
export type SessionOrScreenshot = SessionDocument | ScreenshotDocument;

// ===== UI Enhanced Types =====
// Enhanced types with additional UI properties
export type ChatMessage = ChatMessageDocument & {
  readonly text: string;
  readonly timestamp?: number;
};

// User chat message type used in the UI
export type UserChatMessage = ChatMessage & {
  readonly type: "user";
};

// Enhanced AiChatMessage type with segments for structured display
export type AiChatMessage = ChatMessage & {
  readonly type: "ai" | "user";
  readonly segments?: Segment[];
  readonly isStreaming?: boolean;
  readonly dependenciesString?: string;
};

// System message type for errors and important system notifications
export type SystemChatMessage = ChatMessage & {
  readonly type: "system";
  readonly errorType?: string;
  readonly errorCategory?: "immediate" | "advisory";
};

// ===== Component Props =====
export interface ChatState {
  readonly isEmpty: boolean;
  readonly docs: ChatMessageDocument[];
  readonly input: string;
  setInput(input: string): void;
  readonly isStreaming: boolean;
  readonly codeReady: boolean;
  readonly inputRef: React.RefObject<HTMLTextAreaElement | null>;
  sendMessage(text?: string): Promise<void>;
  readonly title: string;
  addScreenshot(screenshot: string | null): Promise<void>;
  readonly sessionId?: string | null;
  setSelectedResponseId(id: string): void;
  readonly selectedResponseDoc?: ChatMessageDocument;
  readonly selectedSegments?: Segment[];
  readonly selectedCode?: Segment;
  readonly needsNewKey?: boolean;
  setNeedsNewKey(value: boolean): void;

  // Error tracking
  readonly immediateErrors: RuntimeError[];
  readonly advisoryErrors: RuntimeError[];
  addError(error: RuntimeError): void;
  readonly vibeDoc?: VibeDocument;
}

export interface ChatInterfaceProps extends ChatState {
  // chatState is now extended
  // sessionId is part of ChatState
  onSessionCreated?(newSessionId: string): void;
  navigateToView(view: ViewType): void;
  setMobilePreviewShown(shown: boolean): void;
}

/**
 * Props for the SessionSidebar component
 */
export interface SessionSidebarProps {
  readonly isVisible: boolean;
  onClose(): void;
  readonly sessionId: string;
}
