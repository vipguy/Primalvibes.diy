/// <reference types="@vitest/browser/providers/playwright" />

import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    name: "prompts:browser",
    exclude: ["dist/**", "node_modules/**"],
    include: ["**/*test.?(c|m)[jt]s?(x)"],
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
