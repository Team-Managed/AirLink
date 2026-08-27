import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  SafeAreaView,
} from "react-native";
import { THEME_COLORS, THEME_TYPOGRAPHY, THEME_SPACING, THEME_RADII } from "../theme";
import { vaultService } from "../services/vault";
import { hapticsService } from "../services/haptics";
import type { LLMProvider, BYOKConfig } from "@agent-remote/protocol";

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

  useEffect(() => {
    void loadCurrentConfig();
  }, [selectedProvider]);

  const loadCurrentConfig = async () => {
    const storedKey = await vaultService.getApiKey(selectedProvider);
    setApiKey(storedKey || "");

    const activeConfig = await vaultService.getActiveConfig();
    if (activeConfig && activeConfig.provider === selectedProvider) {
      setModelName(activeConfig.model);
      setBaseUrl(activeConfig.baseUrl || "");
    } else {
      setModelName(vaultService.getDefaultModel(selectedProvider));
    }
  };

  const handleSelectProvider = (provider: LLMProvider) => {
    hapticsService.triggerSelection();
    setSelectedProvider(provider);
    setStatusMessage(null);
  };

  const handleSelectModelSuggestion = (model: string) => {
    hapticsService.triggerSelection();
    setModelName(model);
  };

  const handleSave = async () => {
    hapticsService.triggerImpact("medium");
    if (!modelName.trim()) {
      setStatusMessage("Error: Model name cannot be empty.");
      return;
    }

    try {
      if (apiKey.trim()) {
        await vaultService.saveApiKey(selectedProvider, apiKey.trim());
      } else {
        await vaultService.clearApiKey(selectedProvider);
      }

      await vaultService.saveActiveSelection(
        selectedProvider,
        modelName.trim(),
        baseUrl.trim() || undefined,
      );

      const savedConfig = await vaultService.getActiveConfig();
      if (onConfigSaved) {
        onConfigSaved(savedConfig);
      }

      hapticsService.triggerSuccess();
      setStatusMessage("✔ Configuration saved to secure keychain.");
      setTimeout(() => setStatusMessage(null), 3000);
    } catch (err) {
      hapticsService.triggerError();
      const errMsg = err instanceof Error ? err.message : String(err);
      setStatusMessage(`Failed to save: ${errMsg}`);
    }
  };

  const handleClearKey = async () => {
    hapticsService.triggerImpact("medium");
    await vaultService.clearApiKey(selectedProvider);
    setApiKey("");
    const savedConfig = await vaultService.getActiveConfig();
    if (onConfigSaved) {
      onConfigSaved(savedConfig);
    }
    setStatusMessage("✔ API key cleared for " + selectedProvider);
    setTimeout(() => setStatusMessage(null), 3000);
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <Text style={styles.headerTitle}>Model & BYOK Vault</Text>
          <Text style={styles.headerSubtitle}>Encrypted in-device API key keychain</Text>
        </View>
        <TouchableOpacity style={styles.closeButton} onPress={onClose} activeOpacity={0.7}>
          <Text style={styles.closeButtonText}>Done</Text>
        </TouchableOpacity>
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

        {/* 1. Provider Selection */}
        <Text style={styles.sectionLabel}>AI PROVIDER</Text>
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
          Keys are stored in your device&apos;s encrypted keychain and never persisted to the cloud
          relay.
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
          <TouchableOpacity
            style={styles.saveButton}
            onPress={handleSave}
            activeOpacity={0.8}
          >
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
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: THEME_COLORS.backgroundBase,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: THEME_SPACING.lg,
    paddingVertical: THEME_SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: THEME_COLORS.border,
    backgroundColor: THEME_COLORS.cardSurface,
  },
  titleRow: {
    flex: 1,
  },
  headerTitle: {
    color: THEME_COLORS.textPrimary,
    fontFamily: THEME_TYPOGRAPHY.fontFamily.sans,
    fontSize: THEME_TYPOGRAPHY.fontSize.md,
    fontWeight: THEME_TYPOGRAPHY.fontWeight.bold,
  },
  headerSubtitle: {
    color: THEME_COLORS.textMuted,
    fontFamily: THEME_TYPOGRAPHY.fontFamily.sans,
    fontSize: 11,
  },
  closeButton: {
    paddingHorizontal: THEME_SPACING.md,
    paddingVertical: 6,
    borderRadius: THEME_RADII.sm,
    backgroundColor: THEME_COLORS.primaryAccent,
  },
  closeButtonText: {
    color: "#000000",
    fontFamily: THEME_TYPOGRAPHY.fontFamily.sans,
    fontSize: THEME_TYPOGRAPHY.fontSize.xs,
    fontWeight: THEME_TYPOGRAPHY.fontWeight.bold,
  },
  scrollContent: {
    flex: 1,
  },
  scrollContainer: {
    padding: THEME_SPACING.lg,
  },
  statusBanner: {
    padding: THEME_SPACING.sm,
    borderRadius: THEME_RADII.sm,
    marginBottom: THEME_SPACING.md,
    borderWidth: 1,
  },
  statusSuccess: {
    backgroundColor: THEME_COLORS.successBg,
    borderColor: THEME_COLORS.success,
  },
  statusError: {
    backgroundColor: THEME_COLORS.dangerBg,
    borderColor: THEME_COLORS.danger,
  },
  statusBannerText: {
    fontFamily: THEME_TYPOGRAPHY.fontFamily.sans,
    fontSize: 11,
    textAlign: "center",
  },
  statusSuccessText: {
    color: THEME_COLORS.success,
  },
  statusErrorText: {
    color: THEME_COLORS.danger,
  },
  sectionLabel: {
    color: THEME_COLORS.textMuted,
    fontFamily: THEME_TYPOGRAPHY.fontFamily.mono,
    fontSize: 10,
    fontWeight: THEME_TYPOGRAPHY.fontWeight.bold,
    letterSpacing: 1,
    marginTop: THEME_SPACING.md,
    marginBottom: THEME_SPACING.xs,
  },
  providerGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: THEME_SPACING.xs,
    marginBottom: THEME_SPACING.sm,
  },
  providerPill: {
    paddingHorizontal: THEME_SPACING.sm,
    paddingVertical: 6,
    borderRadius: THEME_RADII.sm,
    borderWidth: 1,
  },
  providerPillActive: {
    backgroundColor: THEME_COLORS.primaryAccent,
    borderColor: THEME_COLORS.primaryAccent,
  },
  providerPillInactive: {
    backgroundColor: THEME_COLORS.cardSurface,
    borderColor: THEME_COLORS.border,
  },
  providerPillText: {
    fontFamily: THEME_TYPOGRAPHY.fontFamily.sans,
    fontSize: 11,
    fontWeight: THEME_TYPOGRAPHY.fontWeight.semibold,
  },
  providerPillTextActive: {
    color: "#000000",
  },
  providerPillTextInactive: {
    color: THEME_COLORS.textMuted,
  },
  textInput: {
    backgroundColor: THEME_COLORS.cardSurface,
    borderColor: THEME_COLORS.border,
    borderWidth: 1,
    borderRadius: THEME_RADII.sm,
    color: THEME_COLORS.textPrimary,
    fontFamily: THEME_TYPOGRAPHY.fontFamily.mono,
    fontSize: THEME_TYPOGRAPHY.fontSize.xs,
    paddingHorizontal: THEME_SPACING.sm,
    paddingVertical: 8,
    marginBottom: THEME_SPACING.xs,
  },
  suggestionsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    marginBottom: THEME_SPACING.sm,
  },
  suggestionPill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: THEME_RADII.sm,
    backgroundColor: THEME_COLORS.cardSurfaceHover,
    borderColor: THEME_COLORS.border,
    borderWidth: 1,
  },
  suggestionPillActive: {
    borderColor: THEME_COLORS.primaryAccent,
  },
  suggestionPillText: {
    color: THEME_COLORS.textDim,
    fontFamily: THEME_TYPOGRAPHY.fontFamily.mono,
    fontSize: 10,
  },
  suggestionPillTextActive: {
    color: THEME_COLORS.primaryAccent,
  },
  keyInputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: THEME_COLORS.cardSurface,
    borderColor: THEME_COLORS.border,
    borderWidth: 1,
    borderRadius: THEME_RADII.sm,
  },
  keyInput: {
    flex: 1,
    color: THEME_COLORS.textPrimary,
    fontFamily: THEME_TYPOGRAPHY.fontFamily.mono,
    fontSize: THEME_TYPOGRAPHY.fontSize.xs,
    paddingHorizontal: THEME_SPACING.sm,
    paddingVertical: 8,
  },
  maskToggle: {
    paddingHorizontal: THEME_SPACING.sm,
    paddingVertical: 8,
  },
  maskToggleText: {
    color: THEME_COLORS.primaryAccent,
    fontFamily: THEME_TYPOGRAPHY.fontFamily.sans,
    fontSize: 11,
    fontWeight: THEME_TYPOGRAPHY.fontWeight.semibold,
  },
  helperText: {
    color: THEME_COLORS.textDim,
    fontFamily: THEME_TYPOGRAPHY.fontFamily.sans,
    fontSize: 10,
    marginTop: 4,
    marginBottom: THEME_SPACING.sm,
  },
  customEndpointSection: {
    marginTop: THEME_SPACING.xs,
  },
  actionButtonsRow: {
    marginTop: THEME_SPACING.xl,
    gap: THEME_SPACING.sm,
  },
  saveButton: {
    backgroundColor: THEME_COLORS.primaryAccent,
    paddingVertical: THEME_SPACING.md,
    borderRadius: THEME_RADII.sm,
    alignItems: "center",
  },
  saveButtonText: {
    color: "#000000",
    fontFamily: THEME_TYPOGRAPHY.fontFamily.sans,
    fontSize: THEME_TYPOGRAPHY.fontSize.sm,
    fontWeight: THEME_TYPOGRAPHY.fontWeight.bold,
  },
  clearButton: {
    backgroundColor: THEME_COLORS.dangerBg,
    borderColor: THEME_COLORS.danger,
    borderWidth: 1,
    paddingVertical: THEME_SPACING.sm,
    borderRadius: THEME_RADII.sm,
    alignItems: "center",
  },
  clearButtonText: {
    color: THEME_COLORS.danger,
    fontFamily: THEME_TYPOGRAPHY.fontFamily.sans,
    fontSize: THEME_TYPOGRAPHY.fontSize.xs,
    fontWeight: THEME_TYPOGRAPHY.fontWeight.semibold,
  },
});
