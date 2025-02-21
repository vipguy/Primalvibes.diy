import { SandpackCodeEditor, SandpackLayout, SandpackPreview, SandpackProvider } from '@codesandbox/sandpack-react';

interface ResultPreviewProps {
  code: string;
  dependencies?: Record<string, string>;
}

const indexHtml = `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <script src="https://cdn.tailwindcss.com"></script>
  </head>
  <body>
    <div id="root"></div>
     <script type="module" src="/index.jsx"></script>
  </body>
</html>`;

const defaultCode = `export default function App() {
  return (
    <div className="h-screen flex flex-col items-center justify-center bg-gray-50 gap-6">
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
        <h1 className="text-3xl font-semibold text-gray-700">
          Send a message to generate your app.
        </h1>
      </div>
    </div>
  );
}`;

function ResultPreview({ code, dependencies = {} }: ResultPreviewProps) {
  console.log(dependencies);
  return (
    <div className="h-full" style={{ overflow: 'hidden' }}>
      <SandpackProvider
        key={code}
        template="vite-react"
        options={{
          externalResources: [
            "https://cdn.tailwindcss.com",
          ],
        }}
        customSetup={{
          dependencies: {
            ...dependencies,
            "use-fireproof": "0.20.0-dev-preview-41",
            "@adviser/cement": "latest"
          },
        }}
        files={{
          '/index.html': {
            code: indexHtml,
            hidden: true
          },
          '/App.jsx': {
            code: code || defaultCode,
            active: true
          },
        }}
        theme="light"
      >
        <SandpackLayout className="h-full" style={{ height: '100vh' }}>
          <SandpackPreview
            showRefreshButton
            className="h-full"
            style={{ height: '100%' }}
          />
          <SandpackCodeEditor style={{ height: '100%' }}/>
        </SandpackLayout>
      </SandpackProvider>
    </div>
  );
}

export default ResultPreview;