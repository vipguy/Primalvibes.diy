import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    projects: ["./vitest.tests.config.ts", "./vitest.useSimpleChat.config.ts"],
  },
});
