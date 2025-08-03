import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    // retry: 2,
    name: "unit:browser",
    include: ["*test.?(c|m)[jt]s?(x)"],
    setupFiles: ["./setup.clear-env.ts"],
    browser: {
      enabled: true,
      headless: true,
      provider: "playwright",
      instances: [
        {
          browser: "chromium",
        },
      ],
    },
  },
});
