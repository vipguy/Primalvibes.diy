/// <reference types="@vitest/browser/providers/playwright" />

import { defineConfig } from "vitest/config";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig({
  plugins: [
    tsconfigPaths({
      configNames: ["tsconfig.test.json"],
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    }) as any,
  ],
  test: {
    name: "use-vibes:browser",
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
