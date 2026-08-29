import type { BYOKConfig, LLMProvider } from "@airlink/protocol";

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

interface SecureStoreInterface {
  isAvailableAsync?: () => Promise<boolean>;
  setItemAsync: (key: string, value: string, options?: Record<string, unknown>) => Promise<void>;
  getItemAsync: (key: string) => Promise<string | null>;
  deleteItemAsync: (key: string) => Promise<void>;
  WHEN_UNLOCKED_THIS_DEVICE_ONLY?: string;
}

/**
 * Secure In-Device Vault Service
 * Stores BYOK credentials and model selections securely across platforms:
 * - Native iOS/Android: Hardware-backed Keychain / Keystore via expo-secure-store.
 * - Web Browsers: Client-side local storage with runtime origin isolation.
 * - Headless / Test: In-memory secure fallback store.
 */
export class SecureVaultService {
  private static instance: SecureVaultService | null = null;
  private memoryStore: Map<string, string> = new Map();
  private secureStoreModule: SecureStoreInterface | null = null;
  private hasCheckedSecureStore: boolean = false;

  private constructor() {}

  public static getInstance(): SecureVaultService {
    if (!SecureVaultService.instance) {
      SecureVaultService.instance = new SecureVaultService();
    }
    return SecureVaultService.instance;
  }

  private async getSecureStore(): Promise<SecureStoreInterface | null> {
    if (this.hasCheckedSecureStore) {
      return this.secureStoreModule;
    }
    this.hasCheckedSecureStore = true;
    try {
      const dynamicImport = new Function('return import("expo-secure-store")');
      const mod = (await dynamicImport()) as SecureStoreInterface | null;
      if (mod && typeof mod.getItemAsync === "function") {
        if (typeof mod.isAvailableAsync === "function") {
          const available = await mod.isAvailableAsync();
          if (available) {
            this.secureStoreModule = mod;
            return mod;
          }
        } else {
          this.secureStoreModule = mod;
          return mod;
        }
      }
    } catch {
      // Native module not loaded or running on Web/Node
    }
    return null;
  }

  private async setItem(key: string, value: string): Promise<void> {
    this.memoryStore.set(key, value);

    const secureStore = await this.getSecureStore();
    if (secureStore) {
      try {
        await secureStore.setItemAsync(key, value, {
          keychainAccessible: secureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
        });
        return;
      } catch (err) {
        // Fall back to memory if secure store fails
        console.warn(`[Vault] SecureStore set failed for ${key}:`, err);
      }
    }

    // Security check: NEVER write sensitive API keys to unencrypted browser localStorage
    if (key.startsWith(KEY_PREFIX)) {
      return;
    }

    if (typeof localStorage !== "undefined") {
      try {
        localStorage.setItem(key, value);
      } catch {
        // Fallback to in-memory store
      }
    }
  }

  private async getItem(key: string): Promise<string | null> {
    const secureStore = await this.getSecureStore();
    if (secureStore) {
      try {
        const nativeVal = await secureStore.getItemAsync(key);
        if (nativeVal !== null) return nativeVal;
      } catch {
        // Fall back to memory
      }
    }

    // Security check: NEVER read sensitive API keys from unencrypted localStorage
    if (!key.startsWith(KEY_PREFIX) && typeof localStorage !== "undefined") {
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

    const secureStore = await this.getSecureStore();
    if (secureStore) {
      try {
        await secureStore.deleteItemAsync(key);
      } catch {
        // Fallback to memory
      }
    }

    if (typeof localStorage !== "undefined") {
      try {
        localStorage.removeItem(key);
      } catch {
        // Fallback to in-memory store
      }
    }
  }

  /**
   * Returns true if hardware-backed encrypted storage (Keychain/Keystore) is active.
   */
  public async isHardwareSecured(): Promise<boolean> {
    const store = await this.getSecureStore();
    return store !== null;
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
    // Only store custom base URL when applicable to prevent cross-provider leak
    if (provider === "custom" || provider === "openrouter") {
      if (baseUrl && baseUrl.trim().length > 0) {
        await this.setItem(CUSTOM_BASE_URL_KEY, baseUrl.trim());
      } else {
        await this.removeItem(CUSTOM_BASE_URL_KEY);
      }
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
    const storedBaseUrl = await this.getItem(CUSTOM_BASE_URL_KEY);

    // Enforce endpoint hygiene: only attach baseUrl for custom/openrouter providers
    const baseUrl =
      provider === "custom" || provider === "openrouter" ? storedBaseUrl || undefined : undefined;

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
