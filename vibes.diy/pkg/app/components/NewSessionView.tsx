import React, { useCallback, useState } from "react";
import { useNewSessionChat } from "../hooks/useNewSessionChat.js";
import ChatInput from "./ChatInput.js";
import FeaturedVibes from "./FeaturedVibes.js";
import SessionSidebar from "./SessionSidebar.js";
import { MenuIcon } from "./ChatHeaderIcons.js";
import { quickSuggestions } from "../data/quick-suggestions-data.js";
import models from "../data/models.json" with { type: "json" };

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
            <div className="mb-8">
              <h3 className="mb-4 text-center text-sm font-medium text-gray-600">
                Create custom vibes from a prompt
              </h3>
              <div className="flex flex-wrap justify-center gap-2">
                {quickSuggestions.slice(0, 12).map((suggestion, index) => (
                  <button
                    key={index}
                    type="button"
                    onClick={() => handleSelectSuggestion(suggestion.text)}
                    className="cursor-pointer rounded-md bg-light-background-01 px-3 py-1.5 text-sm font-medium text-light-primary transition-colors hover:bg-light-decorative-01 dark:bg-dark-background-01 dark:text-dark-primary dark:hover:bg-dark-decorative-01"
                  >
                    {suggestion.label}
                  </button>
                ))}
              </div>
            </div>

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
            <div>
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
