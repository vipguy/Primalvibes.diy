import { callAiEnv } from "call-ai";
import { beforeAll } from "vitest";

beforeAll(() => {
  console.log("🧹 Clearing environment variables...");

  callAiEnv.overrideEnv({});

  // console.log('✅ Environment cleaned for tests');
});
