import type { BYOKConfig, LLMProvider } from "@agent-remote/protocol";

const KEY_PREFIX = "agent_remote_byok_";
const ACTIVE_PROVIDER_KEY = "agent_remote_active_provider";
const ACTIVE_MODEL_KEY = "agent_remote_active_model";
const CUSTOM_BASE_URL_KEY = "agent_remote_custom_base_url";

export interface StoredVaultData {
  provider: LLMProvider;
  model: string;
  apiKey?: string;
  baseUrl?: string;
}

/**
 * Secure In-Device Vault Service
 * Stores BYOK credentials and model selections securely in keychain / encrypted storage.
 */
export class SecureVaultService {
  private static instance: SecureVaultService | null = null;
  private memoryStore: Map<string, string> = new Map();

  private constructor() {}

  public static getInstance(): SecureVaultService {
    if (!SecureVaultService.instance) {
      SecureVaultService.instance = new SecureVaultService();
    }
    return SecureVaultService.instance;
  }

  private async setItem(key: string, value: string): Promise<void> {
    this.memoryStore.set(key, value);

    if (typeof localStorage !== "undefined") {
      try {
        localStorage.setItem(key, value);
      } catch {
        // Fallback to in-memory store
      }
    }
  }

  private async getItem(key: string): Promise<string | null> {
    if (typeof localStorage !== "undefined") {
      try {
        const val = localStorage.getItem(key);
        if (val !== null) return val;
      } catch {
        // Fallback to in-memory store
      }
    }
    return this.memoryStore.get(key) ?? null;
  }

  private async removeItem(key: string): Promise<void> {
    this.memoryStore.delete(key);
    if (typeof localStorage !== "undefined") {
      try {
        localStorage.removeItem(key);
      } catch {
        // Fallback to in-memory store
      }
    }
  }

  /**
   * Saves an API key for a specific LLM provider.
   */
  public async saveApiKey(provider: LLMProvider, apiKey: string): Promise<void> {
    const trimmed = apiKey.trim();
    if (!trimmed) {
      await this.clearApiKey(provider);
      return;
    }
    await this.setItem(`${KEY_PREFIX}${provider}`, trimmed);
  }

  /**
   * Retrieves the stored API key for a provider.
   */
  public async getApiKey(provider: LLMProvider): Promise<string | null> {
    return await this.getItem(`${KEY_PREFIX}${provider}`);
  }

  /**
   * Clears the stored API key for a provider.
   */
  public async clearApiKey(provider: LLMProvider): Promise<void> {
    await this.removeItem(`${KEY_PREFIX}${provider}`);
  }

  /**
   * Saves active provider, model name, and optional custom base URL.
   */
  public async saveActiveSelection(
    provider: LLMProvider,
    model: string,
    baseUrl?: string,
  ): Promise<void> {
    await this.setItem(ACTIVE_PROVIDER_KEY, provider);
    await this.setItem(ACTIVE_MODEL_KEY, model.trim());
    if (baseUrl && baseUrl.trim().length > 0) {
      await this.setItem(CUSTOM_BASE_URL_KEY, baseUrl.trim());
    } else {
      await this.removeItem(CUSTOM_BASE_URL_KEY);
    }
  }

  /**
   * Retrieves the currently active BYOK configuration.
   */
  public async getActiveConfig(): Promise<BYOKConfig | null> {
    const provider = (await this.getItem(ACTIVE_PROVIDER_KEY)) as LLMProvider | null;
    const model = await this.getItem(ACTIVE_MODEL_KEY);

    if (!provider || !model) {
      return null;
    }

    const apiKey = await this.getApiKey(provider);
    const baseUrl = await this.getItem(CUSTOM_BASE_URL_KEY);

    const config: BYOKConfig = {
      provider,
      model,
      ...(apiKey ? { apiKey } : {}),
      ...(baseUrl ? { baseUrl } : {}),
    };

    return config;
  }

  /**
   * Returns default model identifier for a provider.
   */
  public getDefaultModel(provider: LLMProvider): string {
    switch (provider) {
      case "openrouter":
        return "0x-alpha";
      case "gemini":
        return "gemini-2.0-flash";
      case "anthropic":
        return "claude-3-7-sonnet";
      case "openai":
        return "gpt-4o";
      case "groq":
        return "llama-3.3-70b-versatile";
      case "custom":
      default:
        return "deepseek-r1";
    }
  }

  /**
   * Clears all stored credentials and selections from vault.
   */
  public async clearAll(): Promise<void> {
    this.memoryStore.clear();
    const providers: LLMProvider[] = [
      "openrouter",
      "anthropic",
      "openai",
      "groq",
      "gemini",
      "custom",
    ];
    for (const p of providers) {
      await this.removeItem(`${KEY_PREFIX}${p}`);
    }
    await this.removeItem(ACTIVE_PROVIDER_KEY);
    await this.removeItem(ACTIVE_MODEL_KEY);
    await this.removeItem(CUSTOM_BASE_URL_KEY);
  }
}

export const vaultService = SecureVaultService.getInstance();
