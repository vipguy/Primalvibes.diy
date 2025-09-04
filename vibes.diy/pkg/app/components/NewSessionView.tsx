import React from "react";
import { useNewSessionChat } from "../hooks/useNewSessionChat.js";
import ChatInput from "./ChatInput.js";
import models from "../data/models.json" with { type: "json" };

interface NewSessionViewProps {
  onSessionCreate: (sessionId: string) => void;
}

export default function NewSessionView({
  onSessionCreate,
}: NewSessionViewProps) {
  const chatState = useNewSessionChat(onSessionCreate);

  return (
    <div
      style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}
    >
      {/* Main content area - placeholder for now */}
      <div style={{ flex: 1, padding: "2rem" }}>
        <h1>New Session</h1>
        <p>Start building your app by describing what you want to create.</p>
      </div>

      {/* Chat input at bottom */}
      <div style={{ padding: "1rem" }}>
        <ChatInput
          chatState={chatState}
          showModelPickerInChat={chatState.showModelPickerInChat}
          currentModel={chatState.effectiveModel}
          onModelChange={async (modelId: string) => {
            if (chatState.updateSelectedModel) {
              await chatState.updateSelectedModel(modelId);
            }
          }}
          models={
            models as {
              id: string;
              name: string;
              description: string;
              featured?: boolean;
            }[]
          }
          globalModel={chatState.globalModel}
          onSend={() => {
            // Session creation is handled in chatState.sendMessage
            console.log("Message sent from new session");
          }}
        />
      </div>
    </div>
  );
}
