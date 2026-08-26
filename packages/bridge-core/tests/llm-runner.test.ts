import { describe, it, expect } from "vitest";
import { LLMRunner, detectFreeProvider, FREE_MODELS } from "../src/llm-runner.js";

describe("LLM Runner Suite (100% Free Providers)", () => {
  it("exposes free models registry across all zero-cost providers", () => {
    expect(FREE_MODELS.groq).toContain("llama-3.3-70b-versatile");
    expect(FREE_MODELS.groq).toContain("deepseek-r1-distill-llama-70b");
    expect(FREE_MODELS.gemini).toContain("gemini-2.0-flash");
    expect(FREE_MODELS.openrouter_free).toContain("deepseek/deepseek-r1:free");
    expect(FREE_MODELS.github_models).toContain("gpt-4o-mini");
    expect(FREE_MODELS.ollama).toContain("deepseek-r1");
  });

  it("detects simulated mode by default when no free API keys are configured", () => {
    const originalEnv = { ...process.env };
    delete process.env["GROQ_API_KEY"];
    delete process.env["GEMINI_API_KEY"];
    delete process.env["OPENROUTER_API_KEY"];
    delete process.env["GITHUB_TOKEN"];
    delete process.env["OLLAMA_BASE_URL"];

    const config = detectFreeProvider();
    expect(config.provider).toBe("simulated");
    expect(config.isFree).toBe(true);

    process.env = originalEnv;
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

  it("allows dynamic model and provider switching", () => {
    const runner = new LLMRunner();
    runner.setModel("deepseek-r1-distill-llama-70b");
    expect(runner.config.model).toBe("deepseek-r1-distill-llama-70b");

    runner.setProvider("groq", "gsk_test_key_123");
    expect(runner.config.provider).toBe("groq");
    expect(runner.config.apiKey).toBe("gsk_test_key_123");
  });
});
