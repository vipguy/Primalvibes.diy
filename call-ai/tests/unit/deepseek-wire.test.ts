import { callAi, Schema, Message } from "call-ai";
import { vitest, expect, describe, it, beforeEach } from "vitest";

// Mock fetch to use our fixture files
const mock = { fetch: vitest.fn() };

describe("DeepSeek Wire Protocol Tests", () => {
  // Read fixtures
  // const deepseekRequestFixture = JSON.parse(
  //   fs.readFileSync(
  //     path.join(__dirname, "fixtures/deepseek-request.json"),
  //     "utf8",
  //   ),
  // );

  function deepseekResponseFixture() {
    return fetch("http://localhost:15731/fixtures/deepseek-response.json").then((r) => r.json());
  }

  // const deepseekSystemRequestFixture = JSON.parse(
  //   fs.readFileSync(
  //     path.join(__dirname, "fixtures/deepseek-system-request.json"),
  //     "utf8",
  //   ),
  // );

  // const deepseekSystemResponseFixture = fs.readFileSync(path.join(__dirname, "../fixtures/deepseek-system-response.json"), "utf8");
  function deepseekSystemResponseFixture() {
    return fetch("http://localhost:15731/fixtures/deepseek-system-response.json").then((r) => r.json());
  }

  beforeEach(() => {
    // Reset mocks
    mock.fetch.mockClear();

    // Mock successful response
    mock.fetch.mockImplementation(async () => {
      return {
        ok: true,
        status: 200,
        text: async () => deepseekResponseFixture().then((r) => JSON.stringify(r)),
        json: async () => deepseekResponseFixture(),
      };
    });
  });

  it("should use the system message approach for DeepSeek with schema", async () => {
    // Define schema
    const schema: Schema = {
      name: "book_recommendation",
      properties: {
        title: { type: "string" },
        author: { type: "string" },
        year: { type: "number" },
        genre: { type: "string" },
        rating: { type: "number", minimum: 1, maximum: 5 },
      },
    };

    // Call the library function with the schema
    await callAi("Give me a short book recommendation in the requested format.", {
      apiKey: "test-api-key",
      model: "deepseek/deepseek-chat",
      schema: schema,
      mock,
    });

    // Verify fetch was called
    expect(mock.fetch).toHaveBeenCalled();

    // Get the request body that was passed to fetch
    const actualRequestBody = JSON.parse(mock.fetch.mock.calls[0][1].body);

    // Check that we're using system message approach rather than JSON schema format
    expect(actualRequestBody.messages).toBeTruthy();
    expect(actualRequestBody.messages.length).toBeGreaterThan(1);

    // Check for system message with schema info
    const systemMessage = actualRequestBody.messages.find((m: { role: string }) => m.role === "system");
    expect(systemMessage).toBeTruthy();
    expect(systemMessage.content).toContain("title");
    expect(systemMessage.content).toContain("author");
    expect(systemMessage.content).toContain("year");
    expect(systemMessage.content).toContain("genre");
    expect(systemMessage.content).toContain("rating");

    // Verify user message is included
    const userMessage = actualRequestBody.messages.find((m: { role: string }) => m.role === "user");
    expect(userMessage).toBeTruthy();
    expect(userMessage.content).toBe("Give me a short book recommendation in the requested format.");

    // Verify response_format is not used
    expect(actualRequestBody.response_format).toBeUndefined();
  });

  it("should correctly handle DeepSeek response with schema", async () => {
    // Update mock to return proper response
    mock.fetch.mockImplementationOnce(async () => {
      return {
        ok: true,
        status: 200,
        text: async () => deepseekResponseFixture().then((r) => JSON.stringify(r)),
        json: async () => deepseekResponseFixture(),
      };
    });

    // Define the schema
    const schema: Schema = {
      name: "book_recommendation",
      properties: {
        title: { type: "string" },
        author: { type: "string" },
        year: { type: "number" },
        genre: { type: "string" },
        rating: { type: "number", minimum: 1, maximum: 5 },
      },
    };

    // Call the library with DeepSeek model
    const result = await callAi("Give me a short book recommendation in the requested format.", {
      apiKey: "test-api-key",
      model: "deepseek/deepseek-chat",
      schema: schema,
      mock,
    });

    // Parse the DeepSeek response fixture to get expected content
    // const responseObj = JSON.parse(deepseekResponseFixture);
    // const responseContent = responseObj.choices[0].message.content;

    // Verify the result
    expect(result).toBeTruthy();

    // Based on the actual response we got, DeepSeek returns markdown-formatted text
    // rather than JSON, so we need to handle that case
    if (typeof result === "string") {
      expect(result).toContain("Title");
      expect(result).toContain("Author");
      expect(result).toContain("Genre");
    }
  });

  it("should handle system message approach with DeepSeek", async () => {
    // Update mock to return system message response
    mock.fetch.mockImplementationOnce(async () => {
      return {
        ok: true,
        status: 200,
        text: async () => deepseekSystemResponseFixture().then((r) => JSON.stringify(r)),
        json: async () => deepseekSystemResponseFixture(),
      };
    });

    // Call the library with messages array including system message
    const result = await callAi(
      [
        {
          role: "system",
          content:
            'Please generate structured JSON responses that follow this exact schema:\n{\n  "title": string,\n  "author": string,\n  "year": number,\n  "genre": string,\n  "rating": number (between 1-5)\n}\nDo not include any explanation or text outside of the JSON object.',
        },
        {
          role: "user",
          content: "Give me a short book recommendation. Respond with only valid JSON matching the schema.",
        },
      ] as Message[],
      {
        apiKey: "test-api-key",
        model: "deepseek/deepseek-chat",
        mock,
      },
    );

    // Verify the result
    expect(result).toBeTruthy();

    // Based on the actual response, DeepSeek can return proper JSON with system messages
    if (typeof result === "string") {
      const parsedResult = JSON.parse(result as string);
      expect(parsedResult).toHaveProperty("title");
      expect(parsedResult).toHaveProperty("author");
      expect(parsedResult).toHaveProperty("year");
      expect(parsedResult).toHaveProperty("genre");
      expect(parsedResult).toHaveProperty("rating");
    } else if (typeof result === "object") {
      expect(result).toHaveProperty("title");
      expect(result).toHaveProperty("author");
      expect(result).toHaveProperty("year");
      expect(result).toHaveProperty("genre");
      expect(result).toHaveProperty("rating");
    }
  });
});
