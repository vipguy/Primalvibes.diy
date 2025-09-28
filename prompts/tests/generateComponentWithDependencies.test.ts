import { describe, it, expect, vi, beforeEach } from "vitest";
import type { ComponentGenerationResult } from "../pkg/prompts.js";

// Mock the call-ai module
vi.mock("call-ai", () => ({
  callAI: vi.fn(),
  joinUrlParts: vi.fn((base: string, path: string) => `${base}${path}`),
}));

describe("generateComponentWithDependencies", () => {
  let generateComponentWithDependencies: typeof import("../pkg/prompts.js").generateComponentWithDependencies;
  let mockCallAI: ReturnType<typeof vi.fn>;

  beforeEach(async () => {
    // Reset mocks
    vi.clearAllMocks();

    // Get the mocked callAI
    const callAiModule = await import("call-ai");
    mockCallAI = callAiModule.callAI as ReturnType<typeof vi.fn>;

    // Import the function to test
    const module = await import("../pkg/prompts.js");
    generateComponentWithDependencies =
      module.generateComponentWithDependencies;
  });

  it("should perform two-stage generation: dependency selection then system prompt", async () => {
    // Mock Stage 1: AI selects dependencies
    mockCallAI.mockResolvedValueOnce(
      JSON.stringify({
        selected: ["useFireproof", "LucideIcons"],
        instructionalText: true,
        demoData: false,
      }),
    );

    const result = await generateComponentWithDependencies(
      "Create a todo app with local storage",
      {
        fallBackUrl: "https://esm.sh/use-vibes/prompt-catalog/llms",
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
      dependencies: ["useFireproof", "LucideIcons"],
      aiSelectedDependencies: ["useFireproof", "LucideIcons"],
      instructionalText: true,
      demoData: false,
      model: expect.any(String),
      timestamp: expect.any(Number),
    });
  });

  it("should use dependency overrides when provided", async () => {
    const result = await generateComponentWithDependencies("Create a form", {
      fallBackUrl: "https://esm.sh/use-vibes/prompt-catalog/llms",
      userPrompt: "Create a form",
      history: [],
      dependencies: ["ReactHookForm", "Zod"],
      dependenciesUserOverride: true,
    });

    // Should NOT call AI for dependency selection when overridden
    expect(mockCallAI).not.toHaveBeenCalled();

    // Should use the provided dependencies
    expect(result.metadata.dependencies).toEqual(["ReactHookForm", "Zod"]);
    expect(result.metadata.aiSelectedDependencies).toEqual([
      "ReactHookForm",
      "Zod",
    ]);
  });

  it("should respect instructionalText and demoData overrides", async () => {
    // Mock Stage 1: AI suggests true for both
    mockCallAI.mockResolvedValueOnce(
      JSON.stringify({
        selected: ["useFireproof"],
        instructionalText: true,
        demoData: true,
      }),
    );

    const result = await generateComponentWithDependencies("Create an app", {
      fallBackUrl: "https://esm.sh/use-vibes/prompt-catalog/llms",
      userPrompt: "Create an app",
      history: [],
      instructionalTextOverride: false,
      demoDataOverride: false,
    });

    // Should override AI's suggestions
    expect(result.metadata.instructionalText).toBe(false);
    expect(result.metadata.demoData).toBe(false);
  });

  it("should handle dependency selection timeout gracefully", async () => {
    // Mock a delayed response that will timeout
    mockCallAI.mockImplementation(
      () => new Promise((resolve) => setTimeout(() => resolve("{}"), 5000)),
    );

    const result = await generateComponentWithDependencies("Create an app", {
      fallBackUrl: "https://esm.sh/use-vibes/prompt-catalog/llms",
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
        selected: ["useFireproof"],
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

    const result = await generateComponentWithDependencies("Add a button", {
      fallBackUrl: "https://esm.sh/use-vibes/prompt-catalog/llms",
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
        selected: ["useFireproof"],
        instructionalText: true,
        demoData: true,
      }),
    );

    const customModel = "openai/gpt-4o";
    const result = await generateComponentWithDependencies(
      "Create an app",
      {
        fallBackUrl: "https://esm.sh/use-vibes/prompt-catalog/llms",
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
        selected: ["useFireproof", "LucideIcons"],
        instructionalText: false,
        demoData: true,
      }),
    );

    await generateComponentWithDependencies("Create a dashboard", {
      fallBackUrl: "https://esm.sh/use-vibes/prompt-catalog/llms",
      userPrompt: "Create a dashboard",
      history: [],
    });

    // Should log AI decisions
    expect(consoleSpy).toHaveBeenCalledWith(
      "🎯 Component generation: AI selected dependencies:",
      expect.objectContaining({
        selected: ["useFireproof", "LucideIcons"],
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
        aiSelectedDependencies: ["useFireproof", "LucideIcons"],
        instructionalText: false,
        demoData: true,
        model: expect.any(String),
        timestamp: expect.any(Number),
      }),
    );

    consoleSpy.mockRestore();
  });
});
