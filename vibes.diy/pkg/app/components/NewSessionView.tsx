import React, { useCallback, useState } from "react";
import { useNewSessionChat } from "../hooks/useNewSessionChat.js";
import ChatInput from "./ChatInput.js";
import QuickSuggestions from "./QuickSuggestions.js";
import FeaturedVibes from "./FeaturedVibes.js";
import SessionSidebar from "./SessionSidebar.js";
import { MenuIcon } from "./ChatHeaderIcons.js";
import models from "../data/models.json" with { type: "json" };
import { Toaster } from "react-hot-toast";

interface NewSessionViewProps {
  onSessionCreate: (sessionId: string) => void;
}

export default function NewSessionView({
  onSessionCreate,
}: NewSessionViewProps) {
  const chatState = useNewSessionChat(onSessionCreate);

  // Sidebar state
  const [isSidebarVisible, setIsSidebarVisible] = useState(false);

  // Sidebar handlers
  const openSidebar = useCallback(() => {
    setIsSidebarVisible(true);
  }, []);

  const closeSidebar = useCallback(() => {
    setIsSidebarVisible(false);
  }, []);

  // Handle suggestion selection
  const handleSelectSuggestion = useCallback(
    (suggestion: string) => {
      chatState.setInput(suggestion);

      // Focus the input and position cursor at the end
      setTimeout(() => {
        if (chatState.inputRef.current) {
          chatState.inputRef.current.focus();
          // Move cursor to end of text
          chatState.inputRef.current.selectionStart =
            chatState.inputRef.current.selectionEnd = suggestion.length;
        }
      }, 0);
    },
    [chatState.setInput, chatState.inputRef],
  );

  return (
    <>
      <div>
        <Toaster />
      </div>
      <div className="flex min-h-screen flex-col">
        {/* Header with menu button */}
        <div className="flex items-center justify-between p-4">
          <button
            type="button"
            onClick={openSidebar}
            className="mr-3 px-2 py-4 text-light-primary hover:text-accent-02-light dark:text-dark-primary dark:hover:text-accent-02-dark"
            aria-label="Open menu"
          >
            <MenuIcon />
          </button>
          <div className="flex-1" />
        </div>

        {/* Main content section */}
        <div className="flex-1 p-8">
          <div className="mx-auto max-w-4xl">
            <h1 className="mb-4 text-center text-3xl font-bold">
              Shareable in seconds
            </h1>
            <p className="mb-8 text-center text-lg text-gray-600">
              Make apps with your friends
            </p>

            {/* Prompt suggestions section */}
            <QuickSuggestions onSelectSuggestion={handleSelectSuggestion} />

            {/* Chat input form */}
            <div className="mb-12">
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
                }}
              />
            </div>

            {/* Featured vibes section */}
            <div className="sm:w-4/5 mx-auto">
              <h3 className="mb-4 text-center text-sm font-medium text-gray-600">
                Or remix a featured vibe
              </h3>
              <FeaturedVibes count={9} />
            </div>
          </div>
        </div>
      </div>
      <SessionSidebar
        isVisible={isSidebarVisible}
        onClose={closeSidebar}
        sessionId=""
      />
    </>
  );
}
