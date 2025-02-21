import { useState } from 'react';
import ChatInterface from "../ChatInterface";
import ResultPreview from "../ResultPreview";

export function meta() {
  return [
    { title: "Fireproof App Builder" },
    { name: "description", content: "Build React components with AI" },
  ];
}

export default function Home() {
  const [state, setState] = useState({
    generatedCode: '',
    dependencies: {} as Record<string, string>
  });

  function handleCodeGenerated(code: string, deps?: Record<string, string>) {
    setState({
      generatedCode: code,
      dependencies: deps || {}
    });
  }

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden' }}>
      <div style={{ flex: '0 0 33.333%', borderRight: '1px solid #ccc', overflow: 'hidden' }}>
        <ChatInterface onCodeGenerated={handleCodeGenerated} />
      </div>
      <div style={{ flex: '0 0 66.667%', overflow: 'hidden' }}>
        <ResultPreview code={state.generatedCode} dependencies={state.dependencies} />
      </div>
    </div>
  );
}
