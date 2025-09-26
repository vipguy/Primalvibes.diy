import stylePromptsJson from "./style-prompts.json" with { type: "json" };

export interface StylePrompt {
  name: string;
  prompt: string;
}

export const stylePrompts: StylePrompt[] = stylePromptsJson;
