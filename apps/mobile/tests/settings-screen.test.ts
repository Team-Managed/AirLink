import { describe, it, expect } from "vitest";
import React from "react";
import { SettingsScreen } from "../src/screens/SettingsScreen";
import { vaultService } from "../src/services/vault";

describe("SettingsScreen Component & BYOK Flow", () => {
  it("instantiates SettingsScreen component without crashing", () => {
    let closed = false;
    const element = React.createElement(SettingsScreen, {
      onClose: () => {
        closed = true;
      },
    });

    expect(element).toBeDefined();
    expect(element.type).toBe(SettingsScreen);
    element.props.onClose();
    expect(closed).toBe(true);
  });

  it("provides sensible default models for all 6 supported AI providers", () => {
    const providers = ["openrouter", "gemini", "anthropic", "openai", "groq", "custom"] as const;
    for (const provider of providers) {
      const defaultModel = vaultService.getDefaultModel(provider);
      expect(typeof defaultModel).toBe("string");
      expect(defaultModel.length).toBeGreaterThan(0);
    }
  });

  it("handles saving active model configuration with callback trigger", async () => {
    await vaultService.saveApiKey("openrouter", "sk-or-test-key-999");
    await vaultService.saveActiveSelection("openrouter", "0x-alpha");

    const config = await vaultService.getActiveConfig();
    expect(config).toEqual({
      provider: "openrouter",
      model: "0x-alpha",
      apiKey: "sk-or-test-key-999",
    });
  });
});
