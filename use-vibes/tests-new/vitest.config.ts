import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    // retry: 2,
    name: 'browser',
    include: ['*test.?(c|m)[jt]s?(x)'],
    setupFiles: ['./setup.ts'],
    browser: {
      enabled: true,
      headless: true,
      provider: 'playwright',
      instances: [
        {
          browser: 'chromium',
        },
      ],
    },
  },
});
