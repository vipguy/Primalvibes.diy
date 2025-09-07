import { callAI, type Message, type CallAIOptions } from "call-ai";

export async function testSelectModuleAndOptions(
  userPrompt: string,
): Promise<{ selected: string[]; instructionalText: boolean; demoData: boolean }> {
  const messages: Message[] = [
    {
      role: "system",
      content: "You are a helpful assistant that selects appropriate modules based on user prompts.",
    },
    { 
      role: "user", 
      content: JSON.stringify({
        userPrompt,
        availableModules: ["image-gen", "web-audio", "three-js", "d3"],
      })
    },
  ];

  const options: CallAIOptions = {
    chatUrl: "https://vibes-diy-api.com",
    apiKey: "sk-vibes-proxy-managed",
    model: "anthropic/claude-sonnet-4",
    schema: {
      name: "module_and_options_selection",
      properties: {
        selected: { type: "array", items: { type: "string" } },
        instructionalText: { type: "boolean" },
        demoData: { type: "boolean" },
      },
    },
    max_tokens: 2000,
    headers: {
      "HTTP-Referer": "https://vibes.diy",
      "X-Title": "Vibes DIY",
      "X-VIBES-Token": (typeof localStorage !== "undefined") ? localStorage.getItem("auth_token") || "" : "",
    },
  };

  try {
    console.log("APP CONTEXT: Testing schema with exact same config in app package:");
    const raw = (await callAI(messages, options)) as string;
    console.log("APP CONTEXT: Raw response:", JSON.stringify(raw));
    const parsed = JSON.parse(raw) ?? {};
    return {
      selected: Array.isArray(parsed?.selected) ? parsed.selected.filter((v: unknown) => typeof v === "string") : [],
      instructionalText: typeof parsed?.instructionalText === "boolean" ? parsed.instructionalText : true,
      demoData: typeof parsed?.demoData === "boolean" ? parsed.demoData : true,
    };
  } catch (err) {
    console.warn("APP CONTEXT: Module selection call failed:", err);
    return { selected: [], instructionalText: true, demoData: true };
  }
}