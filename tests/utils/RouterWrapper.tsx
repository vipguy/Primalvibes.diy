import React from 'react';
import { MemoryRouter } from 'react-router';

interface RouterWrapperProps {
  children: React.ReactNode;
  initialEntries?: string[];
  initialIndex?: number;
}

/**
 * A wrapper component for testing components that use React Router
 * This provides a MemoryRouter context for tests
 */
export function RouterWrapper({
  children,
  initialEntries = ['/'],
  initialIndex = 0,
}: RouterWrapperProps) {
  return (
    <MemoryRouter initialEntries={initialEntries} initialIndex={initialIndex}>
      {children}
    </MemoryRouter>
  );
}
