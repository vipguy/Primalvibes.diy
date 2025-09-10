import React from "react";
import { render, fireEvent, act, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import AppSettingsView from "~/vibes.diy/app/components/ResultPreview/AppSettingsView.js";

// Simplified mock helper - only mocks text files now
// JSON configs are now loaded directly as TypeScript imports, no mocking needed
function createMockFetchFromPkgFiles(): (url: string) => Promise<Response> {
  return (url: string) => {
    // Mock text files - serve actual text file contents (abbreviated for tests)
    if (url.includes("callai.txt")) {
      return Promise.resolve({
        ok: true,
        text: () =>
          Promise.resolve(
            "<callAI-docs>\n# CallAI Documentation\nReal callAI docs content from pkg/llms/callai.txt\n</callAI-docs>",
          ),
      } as Response);
    }

    if (url.includes("fireproof.txt")) {
      return Promise.resolve({
        ok: true,
        text: () =>
          Promise.resolve(
            "<useFireproof-docs>\n# Fireproof Documentation\nReal Fireproof docs content from pkg/llms/fireproof.txt\n</useFireproof-docs>",
          ),
      } as Response);
    }

    if (url.includes("image-gen.txt")) {
      return Promise.resolve({
        ok: true,
        text: () =>
          Promise.resolve(
            "<imageGen-docs>\n# Image Generation Documentation\nReal ImageGen docs content from pkg/llms/image-gen.txt\n</imageGen-docs>",
          ),
      } as Response);
    }

    if (url.includes("web-audio.txt")) {
      return Promise.resolve({
        ok: true,
        text: () =>
          Promise.resolve(
            "<webAudio-docs>\n# Web Audio Documentation\nReal Web Audio docs content from pkg/llms/web-audio.txt\n</webAudio-docs>",
          ),
      } as Response);
    }

    if (url.includes("d3.txt") || url.includes("d3.md")) {
      return Promise.resolve({
        ok: true,
        text: () =>
          Promise.resolve(
            "<D3.js-docs>\n# D3.js Documentation\nReal D3 docs content from pkg/llms/d3.md\n</D3.js-docs>",
          ),
      } as Response);
    }

    if (url.includes("three-js.txt") || url.includes("three-js.md")) {
      return Promise.resolve({
        ok: true,
        text: () =>
          Promise.resolve(
            "<Three.js-docs>\n# Three.js Documentation\nReal Three.js docs content from pkg/llms/three-js.md\n</Three.js-docs>",
          ),
      } as Response);
    }

    // Default response for other text files - fallback mock
    return Promise.resolve({
      ok: true,
      text: () =>
        Promise.resolve(
          "<mock-docs>\n# Mock Documentation\nMock docs content\n</mock-docs>",
        ),
    } as Response);
  };
}

// Mock global fetch for the tests
const mockFetch = vi.fn();
globalThis.fetch = mockFetch;

describe("AppSettingsView Libraries (per‑vibe dependency chooser)", () => {
  beforeEach(() => {
    globalThis.document.body.innerHTML = "";
    vi.clearAllMocks();

    // Set up mock using real files from pkg directory
    mockFetch.mockImplementation(createMockFetchFromPkgFiles());
  });

  const baseProps = {
    title: "My Vibe",
    onUpdateTitle: vi.fn(),
    onDownloadHtml: vi.fn(),
    instructionalTextOverride: undefined,
    demoDataOverride: undefined,
    onUpdateInstructionalTextOverride: vi.fn(),
    onUpdateDemoDataOverride: vi.fn(),
  };

  it("when not overridden, renders LLM-driven note and no preselection", async () => {
    const onUpdateDependencies = vi.fn();
    const res = render(
      <AppSettingsView
        {...baseProps}
        onUpdateDependencies={onUpdateDependencies}
        selectedDependencies={undefined}
        dependenciesUserOverride={false}
      />,
    );

    // Labels come from llms catalog JSON: useFireproof and callAI
    const fireproof = await res.findByLabelText(/useFireproof/i, {
      selector: 'input[type="checkbox"]',
    });
    const callai = await res.findByLabelText(/callAI/i, {
      selector: 'input[type="checkbox"]',
    });

    // No preselection in LLM-driven mode
    expect(fireproof).not.toBeChecked();
    expect(callai).not.toBeChecked();

    // LLM-driven banner is visible
    expect(
      res.getByText(
        /Libraries shown below were chosen by the AI based on your last prompt/i,
      ),
    ).toBeInTheDocument();
  });

  it("renders checkboxes correctly for selected dependencies", async () => {
    const onUpdateDependencies = vi.fn();
    const res = render(
      <AppSettingsView
        {...baseProps}
        onUpdateDependencies={onUpdateDependencies}
        selectedDependencies={["fireproof", "callai"]}
        dependenciesUserOverride={true}
      />,
    );

    // Wait for catalog to load and checkboxes to be properly initialized
    const fireproof = await res.findByLabelText(/useFireproof/i, {
      selector: 'input[type="checkbox"]',
    });
    const callai = await res.findByLabelText(/callAI/i, {
      selector: 'input[type="checkbox"]',
    });

    // Both dependencies should be checked initially
    await waitFor(() => {
      expect(fireproof).toBeChecked();
      expect(callai).toBeChecked();
    });
  });

  it("allows toggling dependency checkboxes", async () => {
    const onUpdateDependencies = vi.fn();
    const res = render(
      <AppSettingsView
        {...baseProps}
        onUpdateDependencies={onUpdateDependencies}
        selectedDependencies={["fireproof"]}
        dependenciesUserOverride={true}
      />,
    );

    const fireproof = await res.findByLabelText(/useFireproof/i, {
      selector: 'input[type="checkbox"]',
    });
    const callai = await res.findByLabelText(/callAI/i, {
      selector: 'input[type="checkbox"]',
    });

    // Initial state: fireproof checked, callai unchecked
    await waitFor(() => {
      expect(fireproof).toBeChecked();
      expect(callai).not.toBeChecked();
    });

    // Click callai to check it
    await act(async () => fireEvent.click(callai));
    expect(callai).toBeChecked();

    // Click fireproof to uncheck it
    await act(async () => fireEvent.click(fireproof));
    expect(fireproof).not.toBeChecked();
  });

  describe("Prompt Options", () => {
    it("renders instructional text and demo data controls with default LLM selection", async () => {
      const onUpdateInstructionalTextOverride = vi.fn();
      const onUpdateDemoDataOverride = vi.fn();

      const res = render(
        <AppSettingsView
          {...baseProps}
          onUpdateDependencies={vi.fn()}
          onUpdateInstructionalTextOverride={onUpdateInstructionalTextOverride}
          onUpdateDemoDataOverride={onUpdateDemoDataOverride}
          instructionalTextOverride={undefined}
          demoDataOverride={undefined}
        />,
      );

      // Check that Prompt Options section exists
      expect(res.getByText("Prompt Options")).toBeInTheDocument();

      // Check instructional text controls
      expect(res.getByText("Instructional Text")).toBeInTheDocument();
      const instructionalTextInputs = res.getAllByDisplayValue("llm");
      const llmDecideInstructional = instructionalTextInputs.find(
        (input) => (input as HTMLInputElement).name === "instructionalText",
      );
      const alwaysIncludeInstructional = res.getByLabelText(
        "Always include instructional text",
      );
      const neverIncludeInstructional = res.getByLabelText(
        "Never include instructional text",
      );

      // Default should be "Let LLM decide"
      expect(llmDecideInstructional).toBeChecked();
      expect(alwaysIncludeInstructional).not.toBeChecked();
      expect(neverIncludeInstructional).not.toBeChecked();

      // Check demo data controls
      expect(res.getByText("Demo Data")).toBeInTheDocument();
      const llmDecideDemo = instructionalTextInputs.find(
        (input) => (input as HTMLInputElement).name === "demoData",
      );

      expect(llmDecideDemo).toBeChecked();
    });

    it("allows changing instructional text override to always on", async () => {
      const onUpdateInstructionalTextOverride = vi.fn();

      const res = render(
        <AppSettingsView
          {...baseProps}
          onUpdateDependencies={vi.fn()}
          onUpdateInstructionalTextOverride={onUpdateInstructionalTextOverride}
          onUpdateDemoDataOverride={vi.fn()}
          instructionalTextOverride={undefined}
          demoDataOverride={undefined}
        />,
      );

      const alwaysIncludeInstructional = res.getByLabelText(
        "Always include instructional text",
      );

      await act(async () => fireEvent.click(alwaysIncludeInstructional));

      expect(onUpdateInstructionalTextOverride).toHaveBeenCalledWith(true);
    });

    it("allows changing instructional text override to always off", async () => {
      const onUpdateInstructionalTextOverride = vi.fn();

      const res = render(
        <AppSettingsView
          {...baseProps}
          onUpdateDependencies={vi.fn()}
          onUpdateInstructionalTextOverride={onUpdateInstructionalTextOverride}
          onUpdateDemoDataOverride={vi.fn()}
          instructionalTextOverride={undefined}
          demoDataOverride={undefined}
        />,
      );

      const neverIncludeInstructional = res.getByLabelText(
        "Never include instructional text",
      );

      await act(async () => fireEvent.click(neverIncludeInstructional));

      expect(onUpdateInstructionalTextOverride).toHaveBeenCalledWith(false);
    });

    it("allows changing back to LLM decision for instructional text", async () => {
      const onUpdateInstructionalTextOverride = vi.fn();

      const res = render(
        <AppSettingsView
          {...baseProps}
          onUpdateDependencies={vi.fn()}
          onUpdateInstructionalTextOverride={onUpdateInstructionalTextOverride}
          onUpdateDemoDataOverride={vi.fn()}
          instructionalTextOverride={true}
          demoDataOverride={undefined}
        />,
      );

      const instructionalTextInputs = res.getAllByDisplayValue("llm");
      const llmDecideInstructional = instructionalTextInputs.find(
        (input) => (input as HTMLInputElement).name === "instructionalText",
      );

      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      await act(async () => fireEvent.click(llmDecideInstructional!));

      expect(onUpdateInstructionalTextOverride).toHaveBeenCalledWith(undefined);
    });

    it("allows changing demo data override to always on", async () => {
      const onUpdateDemoDataOverride = vi.fn();

      const res = render(
        <AppSettingsView
          {...baseProps}
          onUpdateDependencies={vi.fn()}
          onUpdateInstructionalTextOverride={vi.fn()}
          onUpdateDemoDataOverride={onUpdateDemoDataOverride}
          instructionalTextOverride={undefined}
          demoDataOverride={undefined}
        />,
      );

      const alwaysIncludeDemo = res.getByLabelText("Always include demo data");

      await act(async () => fireEvent.click(alwaysIncludeDemo));

      expect(onUpdateDemoDataOverride).toHaveBeenCalledWith(true);
    });

    it("allows changing demo data override to always off", async () => {
      const onUpdateDemoDataOverride = vi.fn();

      const res = render(
        <AppSettingsView
          {...baseProps}
          onUpdateDependencies={vi.fn()}
          onUpdateInstructionalTextOverride={vi.fn()}
          onUpdateDemoDataOverride={onUpdateDemoDataOverride}
          instructionalTextOverride={undefined}
          demoDataOverride={undefined}
        />,
      );

      const neverIncludeDemo = res.getByLabelText("Never include demo data");

      await act(async () => fireEvent.click(neverIncludeDemo));

      expect(onUpdateDemoDataOverride).toHaveBeenCalledWith(false);
    });

    it("shows current override states correctly", async () => {
      const res = render(
        <AppSettingsView
          {...baseProps}
          onUpdateDependencies={vi.fn()}
          onUpdateInstructionalTextOverride={vi.fn()}
          onUpdateDemoDataOverride={vi.fn()}
          instructionalTextOverride={true}
          demoDataOverride={false}
        />,
      );

      // Instructional text should show "always on"
      const alwaysIncludeInstructional = res.getByLabelText(
        "Always include instructional text",
      );
      expect(alwaysIncludeInstructional).toBeChecked();

      // Demo data should show "always off"
      const neverIncludeDemo = res.getByLabelText("Never include demo data");
      expect(neverIncludeDemo).toBeChecked();
    });
  });
});
