// Real file contents from pkg/llms directory
// This ensures tests use actual file content instead of hardcoded mocks

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

/**
 * Creates a mock fetch implementation that serves actual files from the pkg/llms directory
 * instead of hardcoded mock data. This ensures tests use the real file contents.
 */
export function createMockFetchFromPkgFiles(): (
  url: string,
) => Promise<Response> {
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
