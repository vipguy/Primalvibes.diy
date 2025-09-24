import React from "react";
import { render, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { SaveButton } from "~/vibes.diy/app/components/ResultPreview/SaveButton/index.ts";

describe("SaveButton", () => {
  const mockOnClick = vi.fn();

  beforeEach(() => {
    mockOnClick.mockClear();
  });

  describe("Rendering", () => {
    it("does not render if hasChanges is false", () => {
      const { container } = render(
        <SaveButton onClick={mockOnClick} hasChanges={false} />,
      );
      expect(container.firstChild).toBeNull();
    });

    it("renders desktop and mobile buttons when hasChanges is true", () => {
      const { container } = render(
        <SaveButton onClick={mockOnClick} hasChanges={true} />,
      );
      const desktopButton = container.querySelector("button.sm\\:flex");
      const mobileButton = container.querySelector("button.sm\\:hidden");
      expect(desktopButton).toBeInTheDocument();
      expect(mobileButton).toBeInTheDocument();
    });
  });

  describe("Without errors", () => {
    it("desktop button shows 'Save' text", () => {
      const { container } = render(
        <SaveButton onClick={mockOnClick} hasChanges={true} syntaxErrorCount={0} />,
      );
      const desktopButton = container.querySelector("button.sm\\:flex");
      expect(desktopButton).toHaveTextContent("Save");
    });

    it("desktop button is enabled and calls onClick when clicked", () => {
      const { container } = render(
        <SaveButton onClick={mockOnClick} hasChanges={true} syntaxErrorCount={0} />,
      );
      const desktopButton = container.querySelector("button.sm\\:flex");
      fireEvent.click(desktopButton!);
      expect(mockOnClick).toHaveBeenCalledTimes(1);
    });

    it("mobile button shows icon-only with title", () => {
      const { container } = render(
        <SaveButton onClick={mockOnClick} hasChanges={true} syntaxErrorCount={0} />,
      );
      const mobileButton = container.querySelector("button.sm\\:hidden");
      expect(mobileButton).toHaveAttribute("title", "Save changes");
    });
  });

  describe("With errors", () => {
    it("desktop button shows singular error message", () => {
      const { container } = render(
        <SaveButton onClick={mockOnClick} hasChanges={true} syntaxErrorCount={1} />,
      );
      const desktopButton = container.querySelector("button.sm\\:flex");
      expect(desktopButton).toHaveTextContent("1 Error");
      expect(desktopButton).toBeDisabled();
    });

    it("desktop button shows plural error message", () => {
      const { container } = render(
        <SaveButton onClick={mockOnClick} hasChanges={true} syntaxErrorCount={3} />,
      );
      const desktopButton = container.querySelector("button.sm\\:flex");
      expect(desktopButton).toHaveTextContent("3 Errors");
      expect(desktopButton).toBeDisabled();
    });

    it("does not call onClick when disabled", () => {
      const { container } = render(
        <SaveButton onClick={mockOnClick} hasChanges={true} syntaxErrorCount={1} />,
      );
      const desktopButton = container.querySelector("button.sm\\:flex");
      fireEvent.click(desktopButton!);
      expect(mockOnClick).not.toHaveBeenCalled();
    });

    it("mobile button is disabled when errors exist", () => {
      const { container } = render(
        <SaveButton onClick={mockOnClick} hasChanges={true} syntaxErrorCount={2} />,
      );
      const mobileButton = container.querySelector("button.sm\\:hidden");
      expect(mobileButton).toBeDisabled();
    });
  });

  describe("Props handling", () => {
  it("handles undefined syntaxErrorCount as 0", () => {
    const { container } = render(
      <SaveButton onClick={mockOnClick} hasChanges={true} />,
    );
    const desktopButton = container.querySelector("button.sm\\:flex");
    expect(desktopButton).toHaveTextContent("Save");
  });

  it("desktop button applies correct color variant when no errors", () => {
  const { container } = render(
    <SaveButton
      onClick={mockOnClick}
      hasChanges={true}
      syntaxErrorCount={0}
      color="retro"
    />,
  );
  const desktopButton = container.querySelector("button.sm\\:flex");
  expect(desktopButton?.className).toContain("bg-orange-400");
});

it("mobile button applies correct color variant when no errors", () => {
  const { container } = render(
    <SaveButton
      onClick={mockOnClick}
      hasChanges={true}
      syntaxErrorCount={0}
      color="retro"
    />,
  );
  const mobileButton = container.querySelector("button.sm\\:hidden");
  expect(mobileButton?.className).toContain("bg-orange-400");
});

});

});
