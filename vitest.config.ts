import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    projects: [
      // Note: Only non-browser tests included to prevent hanging
      // Browser tests run individually:
      // - vibes.diy tests: cd vibes.diy/tests && pnpm run test
      // - vibes.diy useSimpleChat tests: cd vibes.diy/tests && vitest --config vitest.useSimpleChat.config.ts
      // - prompts browser tests: cd prompts/tests && pnpm run test
      // - use-vibes browser tests: cd use-vibes/tests && pnpm run test
      "prompts/tests/vitest.node.config.ts",
    ],
    testTimeout: 30000,
  },
});
