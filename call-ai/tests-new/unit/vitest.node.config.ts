import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    // retry: 2,
    name: "unit:node",
    include: ["*test.?(c|m)[jt]s?(x)"],
    setupFiles: ["./setup.clear-env.ts"],
  },
});
