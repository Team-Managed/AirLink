import { describe, it, expect, beforeEach, afterEach } from "vitest";
import {
  LLMRunner,
  detectFreeProvider,
  detectProviderForModel,
  getProviderApiKey,
  FREE_MODELS,
} from "../src/llm-runner.js";

describe("LLM Runner Suite (100% Free Providers)", () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it("exposes free models registry across all zero-cost providers", () => {
    expect(FREE_MODELS.groq).toContain("llama-3.3-70b-versatile");
    expect(FREE_MODELS.groq).toContain("deepseek-r1-distill-llama-70b");
    expect(FREE_MODELS.gemini).toContain("gemini-2.0-flash");
    expect(FREE_MODELS.openrouter_free).toContain("deepseek/deepseek-r1:free");
    expect(FREE_MODELS.github_models).toContain("gpt-4o-mini");
    expect(FREE_MODELS.ollama).toContain("deepseek-r1");
  });

  it("detects simulated mode by default when no free API keys are configured", () => {
    delete process.env["GROQ_API_KEY"];
    delete process.env["GEMINI_API_KEY"];
    delete process.env["OPENROUTER_API_KEY"];
    delete process.env["GITHUB_TOKEN"];
    delete process.env["OLLAMA_BASE_URL"];

    const config = detectFreeProvider();
    expect(config.provider).toBe("simulated");
    expect(config.isFree).toBe(true);
  });

  it("streams simulated tokens and thoughts when in local development mode", async () => {
    const runner = new LLMRunner({ provider: "simulated" });
    const events: Array<{ type: string; text: string }> = [];

    for await (const chunk of runner.streamChat({
      messages: [{ role: "user", content: "Write a quick test." }],
    })) {
      events.push(chunk);
    }

    expect(events.length).toBeGreaterThanOrEqual(2);
    expect(events[0]?.type).toBe("thought");
    expect(events[1]?.type).toBe("token");
    expect(events[1]?.text).toContain("Processed request");
  });

  it("allows dynamic model and provider switching without credential leakage", () => {
    process.env["GROQ_API_KEY"] = "gsk_groq_credential_123";
    process.env["GEMINI_API_KEY"] = "gemini_credential_456";
    delete process.env["OPENROUTER_API_KEY"];

    const runner = new LLMRunner({
      provider: "groq",
      model: "llama-3.3-70b-versatile",
      apiKey: "gsk_groq_credential_123",
      baseUrl: "https://api.groq.com/openai/v1",
    });

    expect(runner.config.provider).toBe("groq");
    expect(runner.config.apiKey).toBe("gsk_groq_credential_123");

    // 1. Switch to Gemini model -> must atomically use GEMINI key and endpoint
    runner.setModel("gemini-2.0-flash");
    expect(runner.config.provider).toBe("gemini");
    expect(runner.config.baseUrl).toBe("https://generativelanguage.googleapis.com/v1beta/openai");
    expect(runner.config.apiKey).toBe("gemini_credential_456");

    // 2. Switch to OpenRouter model (no key in env) -> must NOT leak Groq or Gemini key!
    runner.setModel("deepseek/deepseek-r1:free");
    expect(runner.config.provider).toBe("openrouter_free");
    expect(runner.config.baseUrl).toBe("https://openrouter.ai/api/v1");
    expect(runner.config.apiKey).toBeUndefined();

    // 3. Switch to Ollama (local) -> apiKey is undefined, endpoint is local
    runner.setModel("deepseek-r1");
    expect(runner.config.provider).toBe("ollama");
    expect(runner.config.baseUrl).toContain("11434");
    expect(runner.config.apiKey).toBeUndefined();
  });

  it("resolves correct provider family and provider keys", () => {
    expect(detectProviderForModel("llama-3.3-70b-versatile")).toBe("groq");
    expect(detectProviderForModel("gemini-2.0-flash")).toBe("gemini");
    expect(detectProviderForModel("deepseek/deepseek-r1:free")).toBe("openrouter_free");
    expect(detectProviderForModel("gpt-4o-mini")).toBe("github_models");
    expect(detectProviderForModel("deepseek-r1")).toBe("ollama");

    process.env["GROQ_API_KEY"] = "groq_key";
    expect(getProviderApiKey("groq")).toBe("groq_key");
    expect(getProviderApiKey("ollama")).toBeUndefined();
  });
});
