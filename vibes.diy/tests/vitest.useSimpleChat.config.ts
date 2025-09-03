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
  cacheDir: "./node_modules/.vibes.diy-useSimpleChat-vite-cache",
  test: {
    setupFiles: ["./useSimpleChat/setup.tsx"],
    name: "vibes.diy:useSimpleChat",
    exclude: ["dist/**", "node_modules/**"],
    include: ["./useSimpleChat/**/*test.?(c|m)[jt]s?(x)"],
    /*
    server: {
      noExternal: [/\.txt$/],
    },
   */
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
