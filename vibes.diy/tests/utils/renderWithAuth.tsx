import type { ReactElement } from "react";
import React from "react";
import { render } from "@testing-library/react";
import type { RenderOptions } from "@testing-library/react";
import {
  type AuthContextType,
  AuthContext,
} from "~/vibes-diy/app/contexts/AuthContext.js";
import { vi } from "vitest";

export const createAuthContextValue = (
  overrides: Partial<AuthContextType> = {},
): AuthContextType => ({
  token: null,
  isAuthenticated: false,
  isLoading: false,
  userPayload: null,
  needsLogin: false,
  setNeedsLogin: vi.fn(),
  checkAuthStatus: vi.fn(),
  processToken: vi.fn(),
  ...overrides,
});

export const renderWithAuth = (
  ui: ReactElement,
  authOverrides: Partial<AuthContextType> = {},
  options?: Omit<RenderOptions, "wrapper">,
) => {
  const value = createAuthContextValue(authOverrides);

  const wrapper = ({ children }: { children: React.ReactNode }) => {
    // Lazy require inside component body to ensure module fully initialized
    return (
      <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
    );
  };
  return { ...render(ui, { wrapper, ...options }), authValue: value };
};
