import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    retry: 2,
    name: "integration:node",
    setupFiles: "./setup.integration.ts",
    include: ["*test.?(c|m)[jt]s?(x)"],
  },
});
