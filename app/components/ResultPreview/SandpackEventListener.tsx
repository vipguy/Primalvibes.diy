import { useEffect } from 'react';
import { useSandpack } from '@codesandbox/sandpack-react';

interface SandpackEventListenerProps {
  setActiveView: (view: 'preview' | 'code') => void;
  setBundlingComplete: (complete: boolean) => void;
  isStreaming: boolean;
}

const SandpackEventListener: React.FC<SandpackEventListenerProps> = ({
  setActiveView,
  setBundlingComplete,
  isStreaming,
}) => {
  const { listen } = useSandpack();

  useEffect(() => {
    setBundlingComplete(false);

    const unsubscribe = listen((message) => {
      if (message.type === 'start') {
        setBundlingComplete(false);
      } else if (message.type === 'urlchange') {
        setBundlingComplete(true);

        if (!isStreaming) {
          setActiveView('preview');
        }
      }
    });

    return () => {
      unsubscribe();
    };
  }, [listen, setActiveView, setBundlingComplete, isStreaming]);

  return null;
};

export default SandpackEventListener;
