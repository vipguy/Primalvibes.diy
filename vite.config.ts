import { reactRouter } from '@react-router/dev/vite';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'vite';
import tsconfigPaths from 'vite-tsconfig-paths';

export default defineConfig(({ command, mode }) => {
  // Disable React Router plugin for tests or when explicitly disabled
  const disableReactRouter = mode === 'test' || process.env.DISABLE_REACT_ROUTER === 'true';
  
  return {
    plugins: [
      tailwindcss(), 
      // Only include React Router plugin when not disabled
      ...(!disableReactRouter ? [reactRouter()] : []), 
      tsconfigPaths()
    ],
    test: {
      environment: 'jsdom',
      coverage: {
        provider: 'v8',
        reporter: ['text', 'json', 'html'],
        include: [
          'RegexParser.ts', 
          'app/hooks/useChat.ts',
          'app/ChatInterface.tsx',
          'app/ResultPreview.tsx',
          'app/prompts.ts',
          'app/root.tsx',
          'app/routes.ts'
        ],
        enabled: true
      },
      globals: true,
      setupFiles: ['./tests/setup.ts'],
      exclude: ['node_modules', 'dist', '.idea', '.git', '.cache'],
      server: {
        deps: {
          inline: ['react-router', '@react-router/dev']
        }
      },
      deps: {
        inline: ['react-router', '@react-router/dev']
      }
    },
  };
});
