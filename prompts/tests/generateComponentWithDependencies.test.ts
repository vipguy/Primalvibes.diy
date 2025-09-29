import { describe, it, expect, vi, beforeAll, beforeEach } from "vitest";
import { createMockFetchFromPkgFiles } from "./helpers/load-mock-data.js";

// Mock the call-ai module
vi.mock("call-ai", () => ({
  callAI: vi.fn(),
  joinUrlParts: vi.fn((base: string, path: string) => `${base}${path}`),
}));

// Mock global fetch for the tests
const mockFetch = vi.fn();
globalThis.fetch = mockFetch;

// Use a known finite set for testing, excluding three-js to keep tests stable
const knownModuleNames = ["callai", "fireproof", "image-gen", "web-audio"];

const opts = {
  fallBackUrl: new URL("https://example.com/fallback"),
  callAiEndpoint: "https://example.com/call-ai",
  mock: {
    callAI: vi.fn().mockResolvedValue(
      JSON.stringify({
        selected: knownModuleNames,
        instructionalText: true,
        demoData: true,
      }),
    ),
  },
};

describe("generateComponentWithDependencies", () => {
  let generateComponentWithDependencies: typeof import("../pkg/prompts.js").generateComponentWithDependencies;
  let mockCallAI: ReturnType<typeof vi.fn>;

  beforeAll(async () => {
    // Set up mock using real files from pkg directory
    mockFetch.mockImplementation(createMockFetchFromPkgFiles());

    // Import the function to test
    const module = await import("../pkg/prompts.js");
    generateComponentWithDependencies =
      module.generateComponentWithDependencies;
  });

  beforeEach(() => {
    // Reset mocks
    mockFetch.mockClear();

    // Get the mocked callAI from opts
    mockCallAI = opts.mock.callAI;
    mockCallAI.mockClear();
  });

  it("should perform two-stage generation: dependency selection then system prompt", async () => {
    // Mock Stage 1: AI selects dependencies
    mockCallAI.mockResolvedValueOnce(
      JSON.stringify({
        selected: ["fireproof", "image-gen"],
        instructionalText: true,
        demoData: false,
      }),
    );

    const result = await generateComponentWithDependencies(
      "Create a todo app with local storage",
      {
        ...opts,
        userPrompt: "Create a todo app with local storage",
        history: [],
      },
    );

    // Verify Stage 1 was called (dependency selection)
    // Note: makeBaseSystemPrompt might also call selectLlmsAndOptions internally
    expect(mockCallAI).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({
          role: "system",
          content: expect.stringContaining("You select which library modules"),
        }),
      ]),
      expect.any(Object),
    );
    const stage1Call = mockCallAI.mock.calls[0];
    const stage1Messages = stage1Call[0];
    expect(stage1Messages[0].role).toBe("system");
    expect(stage1Messages[0].content).toContain(
      "You select which library modules",
    );
    expect(stage1Messages[1].role).toBe("user");
    const stage1Payload = JSON.parse(stage1Messages[1].content);
    expect(stage1Payload.userPrompt).toBe(
      "Create a todo app with local storage",
    );

    // Verify result structure
    expect(result).toHaveProperty("systemPrompt");
    expect(result).toHaveProperty("metadata");

    // Verify system prompt contains expected content
    expect(result.systemPrompt).toContain("Use Fireproof for data persistence");
    expect(result.systemPrompt).toContain(
      "Begin the component with the import statements",
    );
    expect(result.systemPrompt).toContain(
      "You are an AI assistant tasked with creating React components",
    );

    // Verify metadata contains all expected fields
    expect(result.metadata).toMatchObject({
      dependencies: ["fireproof", "image-gen"],
      aiSelectedDependencies: ["fireproof", "image-gen"],
      instructionalText: true,
      demoData: false,
      model: expect.any(String),
      timestamp: expect.any(Number),
    });
  });

  it("should use dependency overrides when provided", async () => {
    const result = await generateComponentWithDependencies("Create a form", {
      ...opts,
      userPrompt: "Create a form",
      history: [],
      dependencies: ["fireproof"],
      dependenciesUserOverride: true,
    });

    // Should NOT call AI for dependency selection when overridden
    expect(mockCallAI).not.toHaveBeenCalled();

    // Should use the provided dependencies
    expect(result.metadata.dependencies).toEqual(["fireproof"]);
    expect(result.metadata.aiSelectedDependencies).toEqual(["fireproof"]);
  });

  it("should respect instructionalText and demoData overrides", async () => {
    // Mock Stage 1: AI suggests true for both
    mockCallAI.mockResolvedValueOnce(
      JSON.stringify({
        selected: ["fireproof"],
        instructionalText: true,
        demoData: true,
      }),
    );

    const result = await generateComponentWithDependencies("Create an app", {
      ...opts,
      userPrompt: "Create an app",
      history: [],
      instructionalTextOverride: false,
      demoDataOverride: false,
    });

    // Should override AI's suggestions
    expect(result.metadata.instructionalText).toBe(false);
    expect(result.metadata.demoData).toBe(false);
  });

  it.skip("should handle dependency selection timeout gracefully", async () => {
    // Mock a call that will never resolve (simulating timeout)
    mockCallAI.mockImplementation(
      () =>
        new Promise(() => {
          // This promise never resolves, simulating a timeout
        }),
    );

    const result = await generateComponentWithDependencies("Create an app", {
      ...opts,
      userPrompt: "Create an app",
      history: [],
    });

    // Should fall back to defaults on timeout
    expect(result.metadata.dependencies).toEqual([]);
    expect(result.metadata.instructionalText).toBe(true);
    expect(result.metadata.demoData).toBe(true);
    expect(result.systemPrompt).toContain("Use Fireproof for data persistence");
  }, 10000); // 10 second timeout

  it("should include history in dependency detection", async () => {
    // Mock Stage 1
    mockCallAI.mockResolvedValueOnce(
      JSON.stringify({
        selected: ["fireproof"],
        instructionalText: true,
        demoData: false,
      }),
    );

    const history = [
      {
        role: "assistant" as const,
        content: 'import { LucideIcons } from "lucide-react"',
      },
    ];

    await generateComponentWithDependencies("Add a button", {
      ...opts,
      userPrompt: "Add a button",
      history,
    });

    // Verify history was passed to dependency selection
    const stage1Call = mockCallAI.mock.calls[0];
    const stage1Messages = stage1Call[0];
    const stage1Payload = JSON.parse(stage1Messages[1].content);
    expect(stage1Payload.history).toEqual(history);
  });

  it("should use custom model when provided", async () => {
    mockCallAI.mockResolvedValueOnce(
      JSON.stringify({
        selected: ["fireproof"],
        instructionalText: true,
        demoData: true,
      }),
    );

    const customModel = "openai/gpt-4o";
    const result = await generateComponentWithDependencies(
      "Create an app",
      {
        ...opts,
        userPrompt: "Create an app",
        history: [],
      },
      customModel,
    );

    expect(result.metadata.model).toBe(customModel);

    // Verify model was passed to AI call
    const stage1Options = mockCallAI.mock.calls[0][1];
    expect(stage1Options.model).toBe(customModel);
  });

  it("should include proper console logging for debugging", async () => {
    const consoleSpy = vi.spyOn(console, "log");

    mockCallAI.mockResolvedValueOnce(
      JSON.stringify({
        selected: ["fireproof", "image-gen"],
        instructionalText: false,
        demoData: true,
      }),
    );

    await generateComponentWithDependencies("Create a dashboard", {
      ...opts,
      userPrompt: "Create a dashboard",
      history: [],
    });

    // Should log AI decisions
    expect(consoleSpy).toHaveBeenCalledWith(
      "🎯 Component generation: AI selected dependencies:",
      expect.objectContaining({
        selected: ["fireproof", "image-gen"],
        instructionalText: false,
        demoData: true,
        prompt: "Create a dashboard",
        model: expect.any(String),
      }),
    );

    // Should log metadata for storage
    expect(consoleSpy).toHaveBeenCalledWith(
      "📦 Component metadata for storage:",
      expect.objectContaining({
        dependencies: expect.any(Array),
        aiSelectedDependencies: ["fireproof", "image-gen"],
        instructionalText: false,
        demoData: true,
        model: expect.any(String),
        timestamp: expect.any(Number),
      }),
    );

    consoleSpy.mockRestore();
  });
});
