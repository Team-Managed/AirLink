import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ImageBackground,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { THEME_COLORS, THEME_TYPOGRAPHY, THEME_RADII } from "../theme";
import { vaultService } from "../services/vault";
import { hapticsService } from "../services/haptics";
import type { LLMProvider, BYOKConfig } from "@airlink/protocol";

export interface SettingsScreenProps {
  onClose: () => void;
  onConfigSaved?: (config: BYOKConfig | null) => void;
}

const PROVIDERS: { id: LLMProvider; label: string; placeholder: string }[] = [
  { id: "openrouter", label: "OpenRouter / 0x", placeholder: "sk-or-v1-..." },
  { id: "gemini", label: "Google Gemini", placeholder: "AIzaSy..." },
  { id: "anthropic", label: "Anthropic Claude", placeholder: "sk-ant-api03-..." },
  { id: "openai", label: "OpenAI", placeholder: "sk-proj-..." },
  { id: "groq", label: "Groq Llama", placeholder: "gsk_..." },
  { id: "custom", label: "Custom / Local", placeholder: "Optional API Key" },
];

const MODEL_SUGGESTIONS: Record<LLMProvider, string[]> = {
  openrouter: ["0x-alpha", "deepseek/deepseek-r1", "anthropic/claude-3.7-sonnet"],
  gemini: ["gemini-2.0-flash", "gemini-1.5-pro"],
  anthropic: ["claude-3-7-sonnet", "claude-3-5-sonnet"],
  openai: ["gpt-4o", "o3-mini"],
  groq: ["llama-3.3-70b-versatile", "deepseek-r1-distill-llama-70b"],
  custom: ["deepseek-r1", "qwen2.5-coder", "llama3.2"],
};

export const SettingsScreen: React.FC<SettingsScreenProps> = ({ onClose, onConfigSaved }) => {
  const [selectedProvider, setSelectedProvider] = useState<LLMProvider>("openrouter");
  const [modelName, setModelName] = useState<string>("0x-alpha");
  const [apiKey, setApiKey] = useState<string>("");
  const [baseUrl, setBaseUrl] = useState<string>("");
  const [isMasked, setIsMasked] = useState<boolean>(true);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [isLoadingProvider, setIsLoadingProvider] = useState<boolean>(false);
  const providerLoadGenRef = useRef<number>(0);

  const [storedKeysCount, setStoredKeysCount] = useState<number>(0);
  const [providerKeys, setProviderKeys] = useState<Record<string, string>>({});

  const refreshStoredKeys = async () => {
    const keysMap: Record<string, string> = {};
    let count = 0;
    for (const p of PROVIDERS) {
      const k = await vaultService.getApiKey(p.id);
      if (k) {
        keysMap[p.id] = k;
        count++;
      }
    }
    setProviderKeys(keysMap);
    setStoredKeysCount(count);
  };

  // 1. Initial mount load
  useEffect(() => {
    (async () => {
      await refreshStoredKeys();
      const active = await vaultService.getActiveConfig();
      if (active) {
        setSelectedProvider(active.provider);
        setModelName(active.model);
        setBaseUrl(active.baseUrl || "");
        const storedKey = await vaultService.getApiKey(active.provider);
        setApiKey(storedKey || "");
      } else {
        const defaultProv: LLMProvider = "openrouter";
        setSelectedProvider(defaultProv);
        setModelName(vaultService.getDefaultModel(defaultProv));
        setBaseUrl("");
        const storedKey = await vaultService.getApiKey(defaultProv);
        setApiKey(storedKey || "");
      }
    })();
  }, []);

  // 2. When provider selection changes
  const handleSelectProvider = async (provider: LLMProvider) => {
    hapticsService.triggerSelection();
    setSelectedProvider(provider);
    setStatusMessage(null);
    setIsLoadingProvider(true);

    const loadId = ++providerLoadGenRef.current;

    try {
      const storedKey = await vaultService.getApiKey(provider);
      const activeConfig = await vaultService.getActiveConfig();

      // Guard against out-of-order asynchronous completions
      if (providerLoadGenRef.current !== loadId) {
        return;
      }

      setApiKey(storedKey || "");

      if (activeConfig && activeConfig.provider === provider) {
        setModelName(activeConfig.model);
        setBaseUrl(activeConfig.baseUrl || "");
      } else {
        setModelName(vaultService.getDefaultModel(provider));
        // Clear custom base URL when switching to standard cloud providers
        if (provider !== "custom" && provider !== "openrouter") {
          setBaseUrl("");
        }
      }
    } finally {
      if (providerLoadGenRef.current === loadId) {
        setIsLoadingProvider(false);
      }
    }
  };

  const handleSelectModelSuggestion = (model: string) => {
    hapticsService.triggerSelection();
    setModelName(model);
  };

  const handleSave = async () => {
    hapticsService.triggerImpact("medium");
    if (isLoadingProvider) {
      setStatusMessage("Please wait, loading provider configuration...");
      return;
    }

    if (!modelName.trim()) {
      setStatusMessage("Error: Model name cannot be empty.");
      return;
    }

    const trimmedBaseUrl = baseUrl.trim();
    // Validate custom base URL format if provided
    if (
      (selectedProvider === "custom" || selectedProvider === "openrouter") &&
      trimmedBaseUrl.length > 0
    ) {
      try {
        const parsed = new URL(trimmedBaseUrl);
        if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
          setStatusMessage("Error: Custom Base URL must use http:// or https:// protocol.");
          return;
        }
      } catch {
        setStatusMessage(
          "Error: Invalid Custom Base URL. Please enter a valid URL (e.g. http://localhost:11434/v1).",
        );
        return;
      }
    }

    const finalBaseUrl =
      selectedProvider === "custom" || selectedProvider === "openrouter"
        ? trimmedBaseUrl || undefined
        : undefined;

    try {
      if (apiKey.trim()) {
        await vaultService.saveApiKey(selectedProvider, apiKey.trim());
      } else {
        await vaultService.clearApiKey(selectedProvider);
      }

      await vaultService.saveActiveSelection(selectedProvider, modelName.trim(), finalBaseUrl);
      await refreshStoredKeys();

      const savedConfig = await vaultService.getActiveConfig();
      if (onConfigSaved) {
        onConfigSaved(savedConfig);
      }

      const isHardwareSecured = await vaultService.isHardwareSecured();
      const successNotice = isHardwareSecured
        ? "[OK] Configuration saved to encrypted device keychain."
        : "[OK] Configuration saved to in-memory session (Web).";

      hapticsService.triggerSuccess();
      setStatusMessage(successNotice);
      setTimeout(() => setStatusMessage(null), 3000);
    } catch (err) {
      hapticsService.triggerError();
      const errMsg = err instanceof Error ? err.message : String(err);
      setStatusMessage(`[ERROR] Failed to save: ${errMsg}`);
    }
  };

  const handleClearKey = async () => {
    hapticsService.triggerImpact("medium");
    await vaultService.clearApiKey(selectedProvider);
    setApiKey("");
    await refreshStoredKeys();
    const savedConfig = await vaultService.getActiveConfig();
    if (onConfigSaved) {
      onConfigSaved(savedConfig);
    }
    setStatusMessage("[OK] API key cleared for " + selectedProvider);
    setTimeout(() => setStatusMessage(null), 3000);
  };

  const formatKeyMask = (key?: string) => {
    if (!key || key.length < 8) return "••••••••••••••••";
    const prefix = key.slice(0, 7);
    const suffix = key.slice(-4);
    return `${prefix}••••••••${suffix}`;
  };

  return (
    <ImageBackground
      source={require("../../assets/pairing_bg.png")}
      style={styles.backgroundImage}
      resizeMode="cover"
    >
      <View style={styles.overlayTint} />

      <SafeAreaView style={styles.container}>
        {/* Top Header Bar — Frosted glass capsule */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Text style={styles.headerIcon}>🔒</Text>
            <View>
              <Text style={styles.screenHeaderTitle}>Client-Side BYOK Vault</Text>
              <Text style={styles.headerSubtitle}>Zero Cloud Retention</Text>
            </View>
          </View>
          <View style={styles.headerRight}>
            <View style={styles.aesBadge}>
              <Text style={styles.aesBadgeText}>AES-256</Text>
            </View>
            <TouchableOpacity style={styles.closeButton} onPress={onClose} activeOpacity={0.7}>
              <Text style={styles.closeButtonText}>Done</Text>
            </TouchableOpacity>
          </View>
        </View>

        <ScrollView style={styles.scrollContent} contentContainerStyle={styles.scrollContainer}>
        {statusMessage && (
          <View
            style={[
              styles.statusBanner,
              statusMessage.startsWith("Error") ? styles.statusError : styles.statusSuccess,
            ]}
          >
            <Text
              style={[
                styles.statusBannerText,
                statusMessage.startsWith("Error")
                  ? styles.statusErrorText
                  : styles.statusSuccessText,
              ]}
            >
              {statusMessage}
            </Text>
          </View>
        )}

        {/* BYOK Configured Providers List — Matches web Screen 2 byokList */}
        <Text style={styles.sectionLabel}>ACTIVE VAULT KEYS</Text>
        <View style={styles.byokList}>
          {PROVIDERS.slice(0, 4).map((p) => {
            const hasKey = Boolean(providerKeys[p.id]);
            const isSelected = selectedProvider === p.id;
            return (
              <TouchableOpacity
                key={`vault-item-${p.id}`}
                style={[
                  styles.byokItem,
                  isSelected && styles.byokItemFocused,
                ]}
                onPress={() => handleSelectProvider(p.id)}
                activeOpacity={0.7}
              >
                <View style={styles.byokTopRow}>
                  <Text style={styles.byokProviderName}>{p.label}</Text>
                  <Text style={hasKey ? styles.byokStatusActive : styles.byokStatusInactive}>
                    {hasKey ? "● Active" : "○ Not Configured"}
                  </Text>
                </View>
                <Text style={styles.byokKeyMask}>
                  {hasKey ? formatKeyMask(providerKeys[p.id]) : p.placeholder}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Bottom configured indicator */}
        <View style={styles.configuredBadgeRow}>
          <View style={styles.configuredDot} />
          <Text style={styles.configuredText}>
            {storedKeysCount > 0
              ? `${storedKeysCount} Model Provider${storedKeysCount > 1 ? "s" : ""} Configured`
              : "0 Model Providers Configured"}
          </Text>
        </View>

        {/* 1. Provider Selection */}
        <Text style={styles.sectionLabel}>CONFIGURE PROVIDER</Text>
        <View style={styles.providerGrid}>
          {PROVIDERS.map((p) => {
            const isSelected = p.id === selectedProvider;
            return (
              <TouchableOpacity
                key={p.id}
                style={[
                  styles.providerPill,
                  isSelected ? styles.providerPillActive : styles.providerPillInactive,
                ]}
                onPress={() => handleSelectProvider(p.id)}
                activeOpacity={0.8}
              >
                <Text
                  style={[
                    styles.providerPillText,
                    isSelected ? styles.providerPillTextActive : styles.providerPillTextInactive,
                  ]}
                >
                  {p.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* 2. Model Identifier Input & Suggestions */}
        <Text style={styles.sectionLabel}>MODEL IDENTIFIER</Text>
        <TextInput
          style={styles.textInput}
          value={modelName}
          onChangeText={setModelName}
          placeholder="e.g. 0x-alpha"
          placeholderTextColor={THEME_COLORS.textDim}
          autoCapitalize="none"
          autoCorrect={false}
        />

        <View style={styles.suggestionsRow}>
          {MODEL_SUGGESTIONS[selectedProvider].map((sug) => (
            <TouchableOpacity
              key={sug}
              style={[
                styles.suggestionPill,
                modelName === sug ? styles.suggestionPillActive : null,
              ]}
              onPress={() => handleSelectModelSuggestion(sug)}
              activeOpacity={0.7}
            >
              <Text
                style={[
                  styles.suggestionPillText,
                  modelName === sug ? styles.suggestionPillTextActive : null,
                ]}
              >
                {sug}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* 3. API Key Input with Mask Toggle */}
        <Text style={styles.sectionLabel}>API KEY</Text>
        <View style={styles.keyInputContainer}>
          <TextInput
            style={styles.keyInput}
            value={apiKey}
            onChangeText={setApiKey}
            placeholder={PROVIDERS.find((p) => p.id === selectedProvider)?.placeholder}
            placeholderTextColor={THEME_COLORS.textDim}
            secureTextEntry={isMasked}
            autoCapitalize="none"
            autoCorrect={false}
          />
          <TouchableOpacity
            style={styles.maskToggle}
            onPress={() => setIsMasked(!isMasked)}
            activeOpacity={0.7}
          >
            <Text style={styles.maskToggleText}>{isMasked ? "Show" : "Hide"}</Text>
          </TouchableOpacity>
        </View>
        <Text style={styles.helperText}>
          Keys are stored in your device&apos;s secure vault (hardware keychain on iOS/Android,
          client storage on Web) and never persisted to the cloud relay.
        </Text>

        {/* 4. Custom Base URL (Optional) */}
        {(selectedProvider === "custom" || selectedProvider === "openrouter") && (
          <View style={styles.customEndpointSection}>
            <Text style={styles.sectionLabel}>CUSTOM BASE URL (OPTIONAL)</Text>
            <TextInput
              style={styles.textInput}
              value={baseUrl}
              onChangeText={setBaseUrl}
              placeholder="http://localhost:11434/v1"
              placeholderTextColor={THEME_COLORS.textDim}
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>
        )}

          {/* 5. Action Buttons */}
          <View style={styles.actionButtonsRow}>
            <TouchableOpacity style={styles.saveButton} onPress={handleSave} activeOpacity={0.8}>
              <Text style={styles.saveButtonText}>Save Configuration</Text>
            </TouchableOpacity>

            {apiKey.length > 0 && (
              <TouchableOpacity
                style={styles.clearButton}
                onPress={handleClearKey}
                activeOpacity={0.7}
              >
                <Text style={styles.clearButtonText}>Clear Key</Text>
              </TouchableOpacity>
            )}
          </View>
        </ScrollView>
      </SafeAreaView>
    </ImageBackground>
  );
};

const styles = StyleSheet.create({
  backgroundImage: {
    flex: 1,
    width: "100%",
    height: "100%",
    backgroundColor: THEME_COLORS.backgroundBase,
  },
  overlayTint: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(10, 16, 30, 0.38)",
  },
  container: {
    flex: 1,
    backgroundColor: "transparent",
  },
  // Frosted glass header capsule
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.25)",
    backgroundColor: "rgba(255, 255, 255, 0.12)",
    borderRadius: 18,
    marginHorizontal: 16,
    marginTop: 8,
    marginBottom: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    flex: 1,
  },
  headerIcon: {
    fontSize: 18,
  },
  screenHeaderTitle: {
    color: "#ffffff",
    fontFamily: THEME_TYPOGRAPHY.fontFamily.sans,
    fontSize: 14,
    fontWeight: "800",
    letterSpacing: -0.2,
  },
  headerSubtitle: {
    color: "rgba(255, 255, 255, 0.85)",
    fontFamily: THEME_TYPOGRAPHY.fontFamily.mono,
    fontSize: 10,
  },
  headerRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  aesBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: THEME_RADII.full,
    backgroundColor: "rgba(255, 255, 255, 0.15)",
    borderColor: "rgba(255, 255, 255, 0.3)",
    borderWidth: 1,
  },
  aesBadgeText: {
    color: "#ffffff",
    fontFamily: THEME_TYPOGRAPHY.fontFamily.mono,
    fontSize: 10,
    fontWeight: "700",
  },
  closeButton: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: THEME_RADII.full,
    backgroundColor: "rgba(255, 255, 255, 0.22)",
    borderColor: "rgba(255, 255, 255, 0.4)",
    borderWidth: 1,
  },
  closeButtonText: {
    color: "#ffffff",
    fontFamily: THEME_TYPOGRAPHY.fontFamily.sans,
    fontSize: 12,
    fontWeight: "800",
  },
  scrollContent: {
    flex: 1,
  },
  scrollContainer: {
    paddingHorizontal: 16,
    paddingBottom: 40,
  },
  statusBanner: {
    padding: 12,
    borderRadius: 14,
    marginBottom: 12,
    borderWidth: 1,
  },
  statusSuccess: {
    backgroundColor: "rgba(34, 197, 94, 0.25)",
    borderColor: "rgba(34, 197, 94, 0.5)",
  },
  statusError: {
    backgroundColor: "rgba(239, 68, 68, 0.3)",
    borderColor: "rgba(239, 68, 68, 0.6)",
  },
  statusBannerText: {
    fontFamily: THEME_TYPOGRAPHY.fontFamily.sans,
    fontSize: 12,
    textAlign: "center",
    fontWeight: "700",
  },
  statusSuccessText: {
    color: "#ffffff",
  },
  statusErrorText: {
    color: "#ffffff",
  },
  sectionLabel: {
    color: "#ffffff",
    fontFamily: THEME_TYPOGRAPHY.fontFamily.mono,
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 0.8,
    marginTop: 16,
    marginBottom: 8,
  },
  byokList: {
    gap: 8,
    marginBottom: 8,
  },
  byokItem: {
    backgroundColor: "rgba(255, 255, 255, 0.12)",
    borderColor: "rgba(255, 255, 255, 0.25)",
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 4,
  },
  byokItemFocused: {
    borderColor: "#ffffff",
    borderWidth: 1.5,
    backgroundColor: "rgba(255, 255, 255, 0.24)",
    shadowColor: "#ffffff",
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  byokTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  byokProviderName: {
    color: "#ffffff",
    fontFamily: THEME_TYPOGRAPHY.fontFamily.sans,
    fontSize: 13,
    fontWeight: "800",
  },
  byokStatusActive: {
    color: "#4ade80",
    fontFamily: THEME_TYPOGRAPHY.fontFamily.mono,
    fontSize: 10.5,
    fontWeight: "700",
  },
  byokStatusInactive: {
    color: "rgba(255, 255, 255, 0.6)",
    fontFamily: THEME_TYPOGRAPHY.fontFamily.mono,
    fontSize: 10.5,
  },
  byokKeyMask: {
    color: "rgba(255, 255, 255, 0.85)",
    fontFamily: THEME_TYPOGRAPHY.fontFamily.mono,
    fontSize: 11,
  },
  configuredBadgeRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "rgba(255, 255, 255, 0.15)",
    borderColor: "rgba(255, 255, 255, 0.3)",
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 9,
    paddingHorizontal: 14,
    marginBottom: 8,
  },
  configuredDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: "#22c55e",
    shadowColor: "#22c55e",
    shadowOpacity: 0.9,
    shadowRadius: 4,
  },
  configuredText: {
    color: "#ffffff",
    fontFamily: THEME_TYPOGRAPHY.fontFamily.mono,
    fontSize: 11.5,
    fontWeight: "800",
  },
  providerGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 8,
  },
  providerPill: {
    paddingHorizontal: 13,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
  },
  providerPillActive: {
    backgroundColor: "rgba(255, 255, 255, 0.30)",
    borderColor: "#ffffff",
    borderWidth: 1.5,
  },
  providerPillInactive: {
    backgroundColor: "rgba(255, 255, 255, 0.12)",
    borderColor: "rgba(255, 255, 255, 0.25)",
  },
  providerPillText: {
    fontFamily: THEME_TYPOGRAPHY.fontFamily.sans,
    fontSize: 12,
    fontWeight: "600",
  },
  providerPillTextActive: {
    color: "#ffffff",
    fontWeight: "800",
  },
  providerPillTextInactive: {
    color: "rgba(255, 255, 255, 0.85)",
  },
  textInput: {
    backgroundColor: "rgba(255, 255, 255, 0.12)",
    borderColor: "rgba(255, 255, 255, 0.28)",
    borderWidth: 1,
    borderRadius: 14,
    color: "#ffffff",
    fontFamily: THEME_TYPOGRAPHY.fontFamily.mono,
    fontSize: 12.5,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginBottom: 6,
  },
  suggestionsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    marginBottom: 8,
  },
  suggestionPill: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    backgroundColor: "rgba(255, 255, 255, 0.12)",
    borderColor: "rgba(255, 255, 255, 0.25)",
    borderWidth: 1,
  },
  suggestionPillActive: {
    borderColor: "#ffffff",
    backgroundColor: "rgba(255, 255, 255, 0.30)",
  },
  suggestionPillText: {
    color: "rgba(255, 255, 255, 0.85)",
    fontFamily: THEME_TYPOGRAPHY.fontFamily.mono,
    fontSize: 11,
  },
  suggestionPillTextActive: {
    color: "#ffffff",
    fontWeight: "800",
  },
  keyInputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.12)",
    borderColor: "rgba(255, 255, 255, 0.28)",
    borderWidth: 1,
    borderRadius: 14,
  },
  keyInput: {
    flex: 1,
    color: "#ffffff",
    fontFamily: THEME_TYPOGRAPHY.fontFamily.mono,
    fontSize: 12.5,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  maskToggle: {
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  maskToggleText: {
    color: "#ffffff",
    fontFamily: THEME_TYPOGRAPHY.fontFamily.sans,
    fontSize: 12,
    fontWeight: "800",
  },
  helperText: {
    color: "rgba(255, 255, 255, 0.8)",
    fontFamily: THEME_TYPOGRAPHY.fontFamily.sans,
    fontSize: 11,
    marginTop: 6,
    marginBottom: 10,
    lineHeight: 16,
  },
  customEndpointSection: {
    marginTop: 4,
  },
  actionButtonsRow: {
    marginTop: 16,
    gap: 10,
    paddingBottom: 40,
  },
  saveButton: {
    backgroundColor: "#ffffff",
    paddingVertical: 14,
    borderRadius: 16,
    alignItems: "center",
    shadowColor: "#ffffff",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 4,
  },
  saveButtonText: {
    color: "#090d16",
    fontFamily: THEME_TYPOGRAPHY.fontFamily.sans,
    fontSize: 14,
    fontWeight: "800",
  },
  clearButton: {
    backgroundColor: "rgba(239, 68, 68, 0.25)",
    borderColor: "rgba(239, 68, 68, 0.5)",
    borderWidth: 1,
    paddingVertical: 12,
    borderRadius: 14,
    alignItems: "center",
  },
  clearButtonText: {
    color: "#ffffff",
    fontFamily: THEME_TYPOGRAPHY.fontFamily.sans,
    fontSize: 12,
    fontWeight: "800",
  },
});
