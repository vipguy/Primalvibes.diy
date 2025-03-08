import React from 'react';
import { vi } from 'vitest';

interface MockWrapperProps {
  children: React.ReactNode;
}

/**
 * A simple wrapper component for testing components without React Router
 * This provides a basic context for tests without any router dependencies
 */
export function MockWrapper({ children }: MockWrapperProps) {
  return <div data-testid="mock-wrapper">{children}</div>;
}

// Mock common React Router hooks
export const mockNavigate = vi.fn();
export const mockLocation = { pathname: '/' };
export const mockParams = {};

// Reset all mocks
export function resetRouterMocks() {
  mockNavigate.mockReset();
} 