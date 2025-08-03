import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    globalSetup: ["./global-setup.vite.ts"],
    projects: [
      "unit/vitest.browser.config.ts",
      "unit/vitest.node.config.ts",
      "integration/vitest.browser.config.ts",
      "integration/vitest.node.config.ts",
    ],
  },
});
