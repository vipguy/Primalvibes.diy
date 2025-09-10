import React from "react";
import { render, fireEvent, act, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import AppSettingsView from "~/vibes.diy/app/components/ResultPreview/AppSettingsView.js";

// Mock data from pkg directory - copied from prompts/tests/helpers/load-mock-data.ts
const REAL_FILES = {
  "callai.json": `{
  "name": "callai",
  "label": "callAI",
  "llmsTxtUrl": "https://use-fireproof.com/callai-llms.txt",
  "module": "openrouter",
  "description": "easy API for LLM requests with streaming support",
  "importModule": "call-ai",
  "importName": "callAI"
}`,

  "fireproof.json": `{
  "name": "fireproof",
  "label": "useFireproof",
  "llmsTxtUrl": "https://use-fireproof.com/llms-full.txt",
  "module": "use-fireproof",
  "description": "local-first database with encrypted live sync",
  "importModule": "use-fireproof",
  "importName": "useFireproof"
}`,

  "image-gen.json": `{
  "name": "image-gen",
  "label": "Image Generation",
  "module": "image-gen",
  "description": "AI image generation tools and utilities for creating, editing, and manipulating images using various AI models and APIs",
  "importModule": "image-gen",
  "importName": "imageGen"
}`,

  "web-audio.json": `{
  "name": "web-audio",
  "label": "Web Audio",
  "module": "web-audio",
  "description": "Web Audio API utilities for creating interactive audio experiences, sound synthesis, audio processing, effects, visualization, music apps, games, podcasts, streaming",
  "importModule": "web-audio",
  "importName": "webAudio"
}`,

  "d3.json": `{
  "name": "d3",
  "label": "D3.js",
  "module": "d3",
  "description": "D3.js data visualization library for creating interactive charts, graphs, maps, and data-driven documents using SVG, HTML, CSS. Includes scales, selections, transitions, animations, force simulations, geographic projections, data binding, DOM manipulation, data viz, dataviz",
  "importModule": "d3",
  "importName": "d3",
  "importType": "namespace"
}`,

  "three-js.json": `{
  "name": "three-js",
  "label": "Three.js",
  "module": "three-js",
  "description": "Three.js 3D graphics library for WebGL 3D rendering, mesh geometry, materials, lighting, animation, scenes, cameras, textures, shaders, models, WebXR, physics, particle systems, post-processing, visual effects, 3js",
  "importModule": "three",
  "importName": "THREE",
  "importType": "namespace"
}`,
} as const;

function createMockFetchFromPkgFiles(): (url: string) => Promise<Response> {
  return (url: string) => {
    // Mock JSON files - serve actual JSON file contents
    if (url.includes("callai.json")) {
      return Promise.resolve({
        ok: true,
        text: () => Promise.resolve(REAL_FILES["callai.json"]),
      } as Response);
    }

    if (url.includes("fireproof.json")) {
      return Promise.resolve({
        ok: true,
        text: () => Promise.resolve(REAL_FILES["fireproof.json"]),
      } as Response);
    }

    if (url.includes("image-gen.json")) {
      return Promise.resolve({
        ok: true,
        text: () => Promise.resolve(REAL_FILES["image-gen.json"]),
      } as Response);
    }

    if (url.includes("web-audio.json")) {
      return Promise.resolve({
        ok: true,
        text: () => Promise.resolve(REAL_FILES["web-audio.json"]),
      } as Response);
    }

    if (url.includes("d3.json")) {
      return Promise.resolve({
        ok: true,
        text: () => Promise.resolve(REAL_FILES["d3.json"]),
      } as Response);
    }

    if (url.includes("three-js.json")) {
      return Promise.resolve({
        ok: true,
        text: () => Promise.resolve(REAL_FILES["three-js.json"]),
      } as Response);
    }

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

    // Default response for other JSON files - fallback mock
    if (url.endsWith(".json")) {
      return Promise.resolve({
        ok: true,
        text: () =>
          Promise.resolve(
            JSON.stringify({
              name: "mockLib",
              label: "Mock Library",
              module: "mock-lib",
              description: "Mock library for testing",
              importModule: "mock-lib",
              importName: "mockLib",
            }),
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
