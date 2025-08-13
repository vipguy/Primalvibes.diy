import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    projects: [
      //"call-ai/tests/unit/vitest.browser.config.ts",
      //"call-ai/tests/unit/vitest.node.config.ts",
      //"call-ai/tests/integration/vitest.browser.config.ts",
      //"call-ai/tests/integration/vitest.node.config.ts",
      "vibes.diy/tests/vitest.config.ts",
      "call-ai/tests/vitest.config.ts",
      "use-vibes/tests/vitest.config.ts",
    ],
  },
});
