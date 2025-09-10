import type { LlmConfig } from "./types.js";

export const fireproofConfig: LlmConfig = {
  name: "fireproof",
  label: "useFireproof",
  llmsTxtUrl: "https://use-fireproof.com/llms-full.txt",
  module: "use-fireproof",
  description: "local-first database with encrypted live sync",
  importModule: "use-fireproof",
  importName: "useFireproof",
};
