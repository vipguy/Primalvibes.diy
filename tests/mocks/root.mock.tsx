import React, { useEffect } from 'react';

interface LayoutProps {
  children: React.ReactNode;
}

export function Layout({ children }: LayoutProps) {
  useEffect(() => {
    // Check for dark mode preference
    if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, []);

  return (
    <div className="app-layout">
      <div data-testid="meta">Meta</div>
      <div data-testid="links">Links</div>
      <div className="min-h-screen bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100">
        {children}
      </div>
      <div data-testid="scripts">Scripts</div>
      <div data-testid="scroll-restoration">Scroll Restoration</div>
    </div>
  );
}

interface ErrorBoundaryProps {
  error: Error;
  params: Record<string, string>;
}

export function ErrorBoundary({ error }: ErrorBoundaryProps) {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 text-center">
      <h1 className="text-2xl font-bold mb-4">Something went wrong</h1>
      <p className="mb-4 text-red-500">{error.message}</p>
      <button
        className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        onClick={() => window.location.reload()}
      >
        Try again
      </button>
    </div>
  );
} 