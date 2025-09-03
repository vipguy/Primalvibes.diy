import React from "react";
import { render, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { SaveButton } from "~/vibes.diy/app/components/ResultPreview/SaveButton.js";

describe("SaveButton", () => {
  const mockOnClick = vi.fn();

  beforeEach(() => {
    globalThis.document.body.innerHTML = "";
    mockOnClick.mockClear();
  });

  describe("Rendering behavior", () => {
    it("should not render when hasChanges is false", () => {
      const { container } = render(
        <SaveButton onClick={mockOnClick} hasChanges={false} />,
      );
      expect(container.firstChild).toBeNull();
    });

    it("should render when hasChanges is true", () => {
      const res = render(
        <SaveButton onClick={mockOnClick} hasChanges={true} />,
      );

      // Should render both desktop and mobile versions
      expect(res.getAllByRole("button", { name: /save/i })).toHaveLength(2);
    });
  });

  describe("Save state (no errors)", () => {
    it('should show "Save" text on desktop version', () => {
      const res = render(
        <SaveButton
          onClick={mockOnClick}
          hasChanges={true}
          syntaxErrorCount={0}
        />,
      );

      expect(res.getByText("Save")).toBeInTheDocument();
    });

    it("should have blue styling when no errors", () => {
      const res = render(
        <SaveButton
          onClick={mockOnClick}
          hasChanges={true}
          syntaxErrorCount={0}
        />,
      );

      const button = res.getByText("Save").closest("button");
      expect(button).toHaveClass("bg-blue-500", "hover:bg-blue-600");
      expect(button).not.toHaveClass("cursor-not-allowed", "opacity-75");
      expect(button).not.toBeDisabled();
    });

    it("should call onClick when clicked and no errors", () => {
      const res = render(
        <SaveButton
          onClick={mockOnClick}
          hasChanges={true}
          syntaxErrorCount={0}
        />,
      );

      const button = res.getByText("Save");
      fireEvent.click(button);

      expect(mockOnClick).toHaveBeenCalledTimes(1);
    });
  });

  describe("Error state", () => {
    it("should show singular error message for 1 error", () => {
      const res = render(
        <SaveButton
          onClick={mockOnClick}
          hasChanges={true}
          syntaxErrorCount={1}
        />,
      );

      expect(res.getByText("1 Error")).toBeInTheDocument();
    });

    it("should show plural error message for multiple errors", () => {
      const res = render(
        <SaveButton
          onClick={mockOnClick}
          hasChanges={true}
          syntaxErrorCount={3}
        />,
      );

      expect(res.getByText("3 Errors")).toBeInTheDocument();
    });

    it("should have red styling when errors exist", () => {
      const res = render(
        <SaveButton
          onClick={mockOnClick}
          hasChanges={true}
          syntaxErrorCount={1}
        />,
      );

      const button = res.getByText("1 Error").closest("button");
      expect(button).toHaveClass("bg-red-500", "hover:bg-red-600");
      expect(button).toHaveClass("cursor-not-allowed", "opacity-75");
      expect(button).toBeDisabled();
    });

    it("should not call onClick when clicked and has errors", () => {
      const res = render(
        <SaveButton
          onClick={mockOnClick}
          hasChanges={true}
          syntaxErrorCount={1}
        />,
      );

      const button = res.getByText("1 Error");
      fireEvent.click(button);

      // Button is disabled, so click shouldn't trigger the handler
      expect(mockOnClick).not.toHaveBeenCalled();
    });
  });

  describe("Responsive behavior", () => {
    it("should render both desktop and mobile versions", () => {
      const res = render(
        <SaveButton
          onClick={mockOnClick}
          hasChanges={true}
          syntaxErrorCount={0}
        />,
      );

      // Desktop version (hidden on mobile)
      const desktopButton = res.getByText("Save").closest("button");
      expect(desktopButton).toHaveClass("hidden", "sm:flex");

      // Mobile version (hidden on desktop) - find by title attribute
      const mobileButton = res.getByTitle("Save changes");
      expect(mobileButton).toHaveClass("sm:hidden");
    });

    it("should show error count in mobile tooltip when has errors", () => {
      const res = render(
        <SaveButton
          onClick={mockOnClick}
          hasChanges={true}
          syntaxErrorCount={2}
        />,
      );

      const mobileButton = res.getByTitle("2 syntax errors");
      expect(mobileButton).toBeInTheDocument();
      expect(mobileButton).toHaveClass("sm:hidden");
    });

    it("should show singular error in mobile tooltip for 1 error", () => {
      const res = render(
        <SaveButton
          onClick={mockOnClick}
          hasChanges={true}
          syntaxErrorCount={1}
        />,
      );

      const mobileButton = res.getByTitle("1 syntax error");
      expect(mobileButton).toBeInTheDocument();
    });
  });

  describe("Icon rendering", () => {
    it("should render minidisc icon in both versions", () => {
      const { container } = render(
        <SaveButton onClick={mockOnClick} hasChanges={true} />,
      );

      // Both desktop and mobile versions should have SVG icons
      const svgs = container.querySelectorAll("svg");
      expect(svgs).toHaveLength(2);

      // Each SVG should have the minidisc structure
      svgs.forEach((svg) => {
        expect(svg).toHaveAttribute("viewBox", "0 0 24 24");
        expect(svg.querySelectorAll("circle")).toHaveLength(2); // outer and inner rings
        expect(svg.querySelector("rect")).toBeInTheDocument(); // label area
        expect(svg.querySelectorAll("line")).toHaveLength(3); // label lines
      });
    });
  });

  describe("Props validation", () => {
    it("should handle undefined syntaxErrorCount", () => {
      const res = render(
        <SaveButton onClick={mockOnClick} hasChanges={true} />,
      );

      expect(res.getByText("Save")).toBeInTheDocument();
      const button = res.getByText("Save").closest("button");
      expect(button).not.toBeDisabled();
    });

    it("should handle zero syntaxErrorCount explicitly", () => {
      const res = render(
        <SaveButton
          onClick={mockOnClick}
          hasChanges={true}
          syntaxErrorCount={0}
        />,
      );

      expect(res.getByText("Save")).toBeInTheDocument();
      const button = res.getByText("Save").closest("button");
      expect(button).not.toBeDisabled();
    });
  });
});
