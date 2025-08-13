/**
 * Utility functions for call-ai
 */

import { ProcessedSchema } from "./types.js";
// import { process } from 'node:process';

/**
 * Recursively adds additionalProperties: false to all object types in a schema
 * This is needed for OpenAI's strict schema validation in streaming mode
 */
export function recursivelyAddAdditionalProperties(schema: ProcessedSchema): ProcessedSchema {
  // Clone to avoid modifying the original
  const result = { ...schema };

  // If this is an object type, ensure it has additionalProperties: false
  if (result.type === "object") {
    // Set additionalProperties if not already set
    if (result.additionalProperties === undefined) {
      result.additionalProperties = false;
    }

    // Process nested properties if they exist
    if (result.properties) {
      result.properties = { ...result.properties };

      // Set required if not already set - OpenAI requires this for all nested objects
      if (result.required === undefined) {
        result.required = Object.keys(result.properties);
      }

      // Check each property
      Object.keys(result.properties).forEach((key) => {
        const prop = result.properties[key];

        // If property is an object or array type, recursively process it
        if (prop && typeof prop === "object") {
          const oprop = prop as ProcessedSchema;
          result.properties[key] = recursivelyAddAdditionalProperties(oprop);

          // For nested objects, ensure they also have all properties in their required field
          if (oprop.type === "object" && oprop.properties) {
            oprop.required = Object.keys(oprop.properties);
          }
        }
      });
    }
  }

  // Handle nested objects in arrays
  if (result.type === "array" && result.items && typeof result.items === "object") {
    result.items = recursivelyAddAdditionalProperties(result.items);

    // If array items are objects, ensure they have all properties in required
    if (result.items.type === "object" && result.items.properties) {
      result.items.required = Object.keys(result.items.properties);
    }
  }

  return result;
}

class CallAIEnv {
  envFromProcess() {
    return (globalThis.process?.env as Record<string, string>) || {};
  }

  envFromImportMeta() {
    return (import.meta as unknown as { env: Record<string, string> })?.env || {};
  }

  envFromWindow() {
    return (globalThis.window as unknown as { env: Record<string, string> })?.env || {};
  }

  setup() {
    const envs = [];
    try {
      envs.push(this.envFromProcess());
    } catch (e) {
      /* no-op */
    }
    try {
      envs.push(this.envFromImportMeta());
    } catch (e) {
      /* no-op */
    }
    try {
      envs.push(this.envFromWindow());
    } catch (e) {
      /* no-op */
    }
    return envs;
  }

  readonly envs: Record<string, string>[] = this.setup();

  private getEnv(key: string): string | undefined {
    for (const prefix of ["", "VITE_"]) {
      for (const env of this.envs) {
        if (env && env[prefix + key]) {
          return env[prefix + key];
        }
      }
    }
    // console.warn("[callAi] Environment variable not found:", key)
    return undefined;
  }

  overrideEnv(env: Record<string, string>) {
    // reset envs
    this.envs.splice(0, this.envs.length, env);
  }

  readonly def = {
    get CALLAI_REFRESH_ENDPOINT() {
      // ugly as hell but useful
      return callAiEnv.CALLAI_REFRESH_ENDPOINT ?? "https://vibecode.garden";
    },
  };

  get CALLAI_IMG_URL() {
    return this.getEnv("CALLAI_IMG_URL");
  }

  get CALLAI_CHAT_URL() {
    return this.getEnv("CALLAI_CHAT_URL");
  }

  get CALLAI_API_KEY() {
    const x =
      this.getEnv("CALLAI_API_KEY") ??
      this.getEnv("OPENROUTER_API_KEY") ??
      (this.envFromWindow()?.callAi as unknown as { API_KEY: string })?.API_KEY ??
      this.getEnv("LOW_BALANCE_OPENROUTER_API_KEY");
    // if (x) {
    //   console.log("[callAi] Using API key from", x, this.envs.length, new Error().stack);
    // }
    return x;
  }
  get CALLAI_REFRESH_ENDPOINT() {
    return this.getEnv("CALLAI_REFRESH_ENDPOINT");
  }
  get CALL_AI_REFRESH_TOKEN() {
    return this.getEnv("CALL_AI_REFRESH_TOKEN");
  }

  get CALLAI_REKEY_ENDPOINT() {
    return this.getEnv("CALLAI_REKEY_ENDPOINT");
  }
  get CALL_AI_KEY_TOKEN() {
    return this.getEnv("CALL_AI_KEY_TOKEN");
  }
  get CALLAI_REFRESH_TOKEN() {
    return this.getEnv("CALLAI_REFRESH_TOKEN");
  }
  get CALLAI_DEBUG() {
    return !!this.getEnv("CALLAI_DEBUG");
  }

  get NODE_ENV() {
    return this.getEnv("NODE_ENV");
  }
}

export const callAiEnv = new CallAIEnv();

export function entriesHeaders(headers: Headers) {
  const entries: [string, string][] = [];
  headers.forEach((value, key) => {
    entries.push([key, value]);
  });
  return entries;
}

export function callAiFetch(options: { mock?: { fetch?: typeof fetch } }): typeof fetch {

  return options.mock?.fetch || globalThis.fetch;
}
