import { shikiToMonaco } from "@shikijs/monaco";
import { createHighlighter, type ShikiInternal } from "shiki";
import type React from "react";

interface Options {
  isStreaming: boolean;
  codeReady: boolean;
  isDarkMode: boolean;
  userScrolledRef: React.MutableRefObject<boolean>;
  disposablesRef: React.MutableRefObject<{ dispose: () => void }[]>;
  setRefs: (editor: React.MutableRefObject<unknown>, monaco: unknown) => void;
  setHighlighter: (highlighter: ShikiInternal<string, string>) => void;
}

export async function setupMonacoEditor(
  editor: React.MutableRefObject<unknown>,
  monaco: ReturnType<typeof shikiToMonaco>,
  {
    isStreaming,
    codeReady,
    isDarkMode,
    userScrolledRef,
    disposablesRef,
    setRefs,
    setHighlighter,
  }: Options,
) {
  setRefs(editor, monaco);

  monaco.languages.typescript.javascriptDefaults.setCompilerOptions({
    jsx: monaco.languages.typescript.JsxEmit.React,
    jsxFactory: "React.createElement",
    reactNamespace: "React",
    allowNonTsExtensions: true,
    allowJs: true,
    target: monaco.languages.typescript.ScriptTarget.Latest,
  });

  editor.updateOptions({
    tabSize: 2,
    bracketPairColorization: { enabled: true },
    guides: { bracketPairs: true },
  });

  monaco.languages.register({ id: "jsx" });
  monaco.languages.register({ id: "javascript" });

  if (isStreaming && !codeReady) {
    let lastScrollTime = Date.now();
    const scrollThrottleMs = 30;
    const contentDisposable = editor.onDidChangeModelContent(() => {
      const now = Date.now();
      if (now - lastScrollTime > scrollThrottleMs && !userScrolledRef.current) {
        lastScrollTime = now;
        const model = editor.getModel();
        if (model) {
          const lineCount = model.getLineCount();
          editor.revealLineNearTop(lineCount);
        }
      }
    });
    disposablesRef.current.push(contentDisposable);
  }

  try {
    const highlighter = await createHighlighter({
      themes: ["github-dark", "github-light"],
      langs: ["javascript", "jsx", "typescript", "tsx"],
    });
    setHighlighter(highlighter);
    await shikiToMonaco(highlighter, monaco);
    const currentTheme = isDarkMode ? "github-dark" : "github-light";
    monaco.editor.setTheme(currentTheme);
    const model = editor.getModel();
    if (model) {
      monaco.editor.setModelLanguage(model, "jsx");
    }
  } catch (error) {
    console.warn("Shiki highlighter setup failed:", error);
  }

  editor.onDidScrollChange(() => {
    const model = editor.getModel();
    if (model) {
      const totalLines = model.getLineCount();
      const visibleRanges = editor.getVisibleRanges();
      if (visibleRanges.length > 0) {
        const lastVisibleLine = visibleRanges[0].endLineNumber;
        if (lastVisibleLine >= totalLines - 2) {
          userScrolledRef.current = false;
        }
      }
    }
  });

  const domNode = editor.getDomNode();
  if (domNode) {
    const wheelListener = () => {
      const model = editor.getModel();
      if (model) {
        const totalLines = model.getLineCount();
        const visibleRanges = editor.getVisibleRanges();
        if (visibleRanges.length > 0) {
          const lastVisibleLine = visibleRanges[0].endLineNumber;
          if (lastVisibleLine < totalLines - 2) {
            userScrolledRef.current = true;
          }
        }
      }
    };
    domNode.addEventListener("wheel", wheelListener);
    disposablesRef.current.push({
      dispose: () => domNode.removeEventListener("wheel", wheelListener),
    });
  }
}
