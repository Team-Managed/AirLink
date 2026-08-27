import { describe, it, expect, beforeEach } from "vitest";
import { SecureVaultService } from "../src/services/vault";

describe("SecureVaultService (In-Device BYOK Vault)", () => {
  let vault: SecureVaultService;

  beforeEach(async () => {
    vault = SecureVaultService.getInstance();
    await vault.clearAll();
  });

  it("persists and retrieves provider API keys securely", async () => {
    await vault.saveApiKey("openrouter", "sk-or-v1-testkey123");
    const retrieved = await vault.getApiKey("openrouter");
    expect(retrieved).toBe("sk-or-v1-testkey123");
  });

  it("saves active model selection and returns structured BYOKConfig", async () => {
    await vault.saveApiKey("gemini", "AIzaSyTestKey");
    await vault.saveActiveSelection("gemini", "gemini-2.0-flash");

    const config = await vault.getActiveConfig();
    expect(config).not.toBeNull();
    expect(config?.provider).toBe("gemini");
    expect(config?.model).toBe("gemini-2.0-flash");
    expect(config?.apiKey).toBe("AIzaSyTestKey");
  });

  it("stores optional custom base URL for local/custom endpoints", async () => {
    await vault.saveActiveSelection("custom", "deepseek-r1", "http://192.168.1.100:11434/v1");

    const config = await vault.getActiveConfig();
    expect(config?.provider).toBe("custom");
    expect(config?.model).toBe("deepseek-r1");
    expect(config?.baseUrl).toBe("http://192.168.1.100:11434/v1");
  });

  it("returns sensible default models for providers", () => {
    expect(vault.getDefaultModel("openrouter")).toBe("0x-alpha");
    expect(vault.getDefaultModel("gemini")).toBe("gemini-2.0-flash");
    expect(vault.getDefaultModel("anthropic")).toBe("claude-3-7-sonnet");
    expect(vault.getDefaultModel("openai")).toBe("gpt-4o");
    expect(vault.getDefaultModel("groq")).toBe("llama-3.3-70b-versatile");
  });

  it("clears specific API keys or all vault credentials", async () => {
    await vault.saveApiKey("anthropic", "sk-ant-test");
    await vault.saveApiKey("openai", "sk-proj-test");

    await vault.clearApiKey("anthropic");
    expect(await vault.getApiKey("anthropic")).toBeNull();
    expect(await vault.getApiKey("openai")).toBe("sk-proj-test");

    await vault.clearAll();
    expect(await vault.getApiKey("openai")).toBeNull();
    expect(await vault.getActiveConfig()).toBeNull();
  });
});
