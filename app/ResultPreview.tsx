import {
  SandpackCodeEditor,
  SandpackLayout,
  SandpackPreview,
  SandpackProvider,
} from '@codesandbox/sandpack-react';
import { useState } from 'react';

interface ResultPreviewProps {
  code: string;
  dependencies?: Record<string, string>;
  onShare?: () => void;
  shareStatus?: string;
}

const indexHtml = `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <script src="https://cdn.tailwindcss.com"></script>
    <script>
      tailwind.config = {
        darkMode: 'class',
        theme: {
          extend: {
            colors: {
              'light-primary': '#2C2C2C',
              'light-secondary': '#2C2C2C',
              'light-decorative-00': '#EBEAEA',
              'light-decorative-01': '#E0DEDE',
              'light-decorative-02': '#2C2C2C',
              'light-background-00': '#FFFFFF',
              'light-background-01': '#F5F5F5',
              'light-background-02': '#F0F0F0',
              'dark-primary': '#FFFFFF',
              'dark-secondary': '#FFFFFF',
              'dark-decorative-00': '#302F30',
              'dark-decorative-01': '#414141',
              'dark-decorative-02': '#FFFFFF',
              'dark-background-00': '#171616',
              'dark-background-01': '#201F20',
              'dark-background-02': '#201F20',
              'accent-00-light': '#F9A100',
              'accent-01-light': '#F58709',
              'accent-02-light': '#F16C12',
              'accent-03-light': '#EE521C',
              'accent-00-dark': '#FFAA0F',
              'accent-01-dark': '#FF8F0F',
              'accent-02-dark': '#FF7119',
              'accent-03-dark': '#FF612A',
            }
          }
        }
      }
    </script>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/index.jsx"></script>
  </body>
</html>`;

const defaultCode = `export default function App() {
  return (
    <div className="h-screen flex flex-col items-center justify-center bg-light-background-01 dark:bg-dark-background-01 gap-6">
      <div className="w-32 h-32 relative">
        <svg 
          viewBox="6000 6000 5000 5000"
          className="w-full h-full animate-[float_3s_ease-in-out_infinite]"
          style={{ 
            shapeRendering: 'geometricPrecision',
            textRendering: 'geometricPrecision',
            imageRendering: 'optimizeQuality',
            fillRule: 'evenodd',
            clipRule: 'evenodd',
            filter: 'drop-shadow(0 0 10px rgba(238, 82, 28, 0.2))'
          }}
        >
          <style>
            {
              \`@keyframes float {
                0%, 100% { transform: translateY(0px); }
                50% { transform: translateY(-10px); }
              }
              .fil1 { fill: none; }
              .fil3 { fill: #EE521C; }
              .fil2 { fill: #F16C12; }
              .fil4 { fill: #F58709; }
              .fil5 { fill: #F9A100; }
              .fil0 { fill: white; }\`
            }
          </style>
          <g>
            <g>
              <line className="fil1" x1="8333" y1="6034" x2="6342" y2="9483"/>
              <polygon className="fil2" points="8997,7183 8391,7021 7669,7184 7006,8333 7006,8333 7489,8468 8333,8333"/>
              <path className="fil3" d="M7669 7183l647 0 681 0c0,-491 -267,-920 -663,-1149l-1 0 -664 1149z"/>
              <path className="fil4" d="M8333 8333l-1327 0c0,0 0,0 0,1 0,0 -1,0 -1,0l-663 1149 775 257 552 -257 664 -1149 0 -1zm664 1150l594 230 733 -230 1 0c0,-491 -267,-920 -664,-1150l0 0 -664 1150z"/>
              <path className="fil5" d="M7669 9483l-1327 0 664 1150 0 0 1327 0c-397,-230 -664,-659 -664,-1150l0 0zm2656 0l-1328 0 -664 1150 1328 0 664 -1150z"/>
            </g>
          </g>
        </svg>
      </div>
      <div className="text-center px-4">
        <h1 className="text-3xl font-semibold text-light-primary dark:text-dark-primary">
          Send a message to generate your app.
        </h1>
      </div>
    </div>
  );
}`;

function ResultPreview({ code, dependencies = {}, onShare, shareStatus }: ResultPreviewProps) {
  const [activeView, setActiveView] = useState<'preview' | 'code'>('preview');

  console.log(dependencies);
  return (
    <div className="h-full" style={{ overflow: 'hidden' }}>
      <div className="border-light-decorative-00 dark:border-dark-decorative-00 bg-light-background-00 dark:bg-dark-background-00 flex items-center justify-between border-b p-4">
        <div className="bg-light-decorative-00 dark:bg-dark-decorative-00 flex space-x-1 rounded-lg p-1 shadow-sm">
          <button
            type="button"
            onClick={() => setActiveView('preview')}
            className={`flex items-center space-x-1.5 rounded-md px-4 py-1.5 text-sm font-medium transition-colors ${
              activeView === 'preview'
                ? 'bg-light-background-00 dark:bg-dark-background-00 text-light-primary dark:text-dark-primary shadow-sm'
                : 'text-light-primary dark:text-dark-primary hover:bg-light-decorative-01 dark:hover:bg-dark-decorative-01'
            }`}
            aria-label="Switch to preview"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-4 w-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <title>Preview icon</title>
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
              />
            </svg>
            <span>Preview</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveView('code')}
            className={`flex items-center space-x-1.5 rounded-md px-4 py-1.5 text-sm font-medium transition-colors ${
              activeView === 'code'
                ? 'bg-light-background-00 dark:bg-dark-background-00 text-light-primary dark:text-dark-primary shadow-sm'
                : 'text-light-primary dark:text-dark-primary hover:bg-light-decorative-01 dark:hover:bg-dark-decorative-01'
            }`}
            aria-label="Switch to code editor"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-4 w-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <title>Code icon</title>
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4"
              />
            </svg>
            <span>Code</span>
          </button>
        </div>

        {onShare && (
          <div className="flex items-center gap-2">
            {shareStatus && (
              <div className="animate-fade-in bg-accent-00-light dark:bg-accent-00-dark text-light-primary dark:text-dark-primary rounded-lg px-3 py-1 text-sm">
                {shareStatus}
              </div>
            )}
            <div className="bg-light-decorative-00 dark:bg-dark-decorative-00 flex space-x-1 rounded-lg p-1 shadow-sm">
              <button
                type="button"
                onClick={onShare}
                className="text-light-primary dark:text-dark-primary hover:bg-light-decorative-01 dark:hover:bg-dark-decorative-01 flex items-center space-x-1.5 rounded-md px-4 py-1.5 text-sm font-medium transition-colors"
                aria-label="Share app"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-4 w-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <title>Share icon</title>
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"
                  />
                </svg>
                <span>Share</span>
              </button>
            </div>
          </div>
        )}
      </div>
      <SandpackProvider
        key={code}
        template="vite-react"
        options={{
          externalResources: ['https://cdn.tailwindcss.com'],
        }}
        customSetup={{
          dependencies: {
            ...dependencies,
            'use-fireproof': '0.20.0-dev-preview-41',
            '@adviser/cement': 'latest',
          },
        }}
        files={{
          '/index.html': {
            code: indexHtml,
            hidden: true,
          },
          '/App.jsx': {
            code: code || defaultCode,
            active: true,
          },
        }}
        theme="light"
      >
        <SandpackLayout className="h-full" style={{ height: 'calc(100vh - 49px)' }}>
          <div
            style={{
              display: activeView === 'preview' ? 'block' : 'none',
              height: '100%',
              width: '100%',
            }}
          >
            <SandpackPreview
              showNavigator={false}
              showOpenInCodeSandbox={false}
              showRefreshButton={true}
              showRestartButton={false}
              showOpenNewtab={false}
              className="h-full w-full"
              style={{ height: '100%' }}
            />
          </div>
          <div
            style={{
              display: activeView === 'code' ? 'block' : 'none',
              height: '100%',
              width: '100%',
            }}
          >
            <SandpackCodeEditor style={{ height: '100%' }} />
          </div>
        </SandpackLayout>
      </SandpackProvider>
    </div>
  );
}

export default ResultPreview;
