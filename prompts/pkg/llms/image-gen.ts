import type { LlmConfig } from "./types.js";

export const imageGenConfig: LlmConfig = {
  name: "image-gen",
  label: "Image Generation",
  llmsTxtUrl: "https://use-fireproof.com/imggen-llms.txt",
  module: "OpenAi",
  description: "Generate and edit images",
  importModule: "use-vibes",
  importName: "ImgGen",
};
