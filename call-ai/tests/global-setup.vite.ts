import { createServer } from "vite";
import type { ViteDevServer } from "vite";
import { dotenv } from "zx";
import * as process from "node:process";

let devServer: ViteDevServer;

export async function setup() {
  dotenv.config(".env");
  // console.log(Object.keys(process.env))
  let root = process.cwd();
  if (!root.endsWith("/call-ai/tests")) {
    root += "/call-ai/tests";
  }
  console.log("🚀 Starting Vite dev server for tests...", root);
  try {
    devServer = await createServer({
      root,
      server: {
        port: 15731,
        host: true,
        strictPort: true,
      },
      logLevel: "warn",
      // Optimize for testing
      optimizeDeps: {
        force: true, // Force re-optimization
      },
    });

    try {
      await devServer.listen();
    } catch (error) {
      console.warn(`is running somewhere`);
      return async () => {
        return;
      };
    }

    const address = devServer.resolvedUrls?.local[0] || "http://localhost:5173";
    console.log(`✅ Vite dev server running at ${address}`);

    // Make server URL available globally
    process.env.VITE_TEST_URL = address;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (globalThis as any).__VITE_SERVER_URL__ = address;

    return async () => {
      console.log("🛑 Stopping Vite dev server...");
      await devServer.close();
    };
  } catch (error) {
    console.error("❌ Failed to start Vite dev server:", error);
    throw error;
  }
}

export async function teardown() {
  if (devServer) {
    await devServer.close();
    console.log("✅ Vite dev server stopped");
  }
}
