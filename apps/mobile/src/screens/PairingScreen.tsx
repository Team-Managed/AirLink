import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import { THEME_COLORS, THEME_TYPOGRAPHY, THEME_SPACING, THEME_RADII } from "../theme";
import { feedbackService } from "../services/feedback";

export interface PairingScreenProps {
  onConnect: (pin: string, relayUrl: string) => void;
  isConnecting?: boolean;
  errorMessage?: string | null;
  defaultRelayUrl?: string;
  onOpenSettings?: () => void;
}

export const PairingScreen: React.FC<PairingScreenProps> = ({
  onConnect,
  isConnecting = false,
  errorMessage = null,
  defaultRelayUrl = "http://localhost:3001",
  onOpenSettings,
}) => {
  const [pin, setPin] = useState<string>("");
  const [relayUrl, setRelayUrl] = useState<string>(defaultRelayUrl);
  const [showAdvanced, setShowAdvanced] = useState<boolean>(false);
  const inputRef = useRef<TextInput>(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      inputRef.current?.focus();
    }, 150);
    return () => clearTimeout(timer);
  }, []);

  const handlePinChange = (text: string) => {
    const sanitized = text.replace(/\D/g, "").slice(0, 6);
    setPin(sanitized);

    feedbackService.triggerSelection("light");

    if (sanitized.length === 6 && !isConnecting) {
      feedbackService.triggerSelection("medium");
      onConnect(sanitized, relayUrl);
    }
  };

  const handleManualConnect = () => {
    if (pin.length === 6 && !isConnecting) {
      feedbackService.triggerSelection("medium");
      onConnect(pin, relayUrl);
    }
  };

  const isComplete = pin.length === 6;

  return (
    <View style={styles.container}>
      {/* Top Header Bar */}
      <View style={styles.topBar}>
        <View style={styles.brandRow}>
          <View style={[styles.statusDot, isConnecting && styles.statusDotConnecting]} />
          <Text style={styles.brandText}>AirLink Remote</Text>
        </View>
        <View style={styles.topRightRow}>
          <View style={styles.e2eBadge}>
            <Text style={styles.e2eBadgeText}>WebSocket E2E</Text>
          </View>
          {onOpenSettings && (
            <TouchableOpacity
              style={styles.settingsButton}
              onPress={onOpenSettings}
              activeOpacity={0.7}
            >
              <Text style={styles.settingsButtonText}>Settings</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      <View style={styles.content}>
        {errorMessage && (
          <View style={styles.errorBanner}>
            <Text style={styles.errorBannerText}>{errorMessage}</Text>
          </View>
        )}

        {/* Center Card (Matching Landing Page Mockup Screen 1) */}
        <View style={styles.pinCenterCard}>
          {/* Glowing Lock Circle */}
          <View
            style={[
              styles.lockCircle,
              isComplete && styles.lockCircleSuccess,
              isConnecting && styles.lockCircleConnecting,
            ]}
          >
            <Text style={styles.lockIcon}>{isComplete ? "✓" : "🔒"}</Text>
          </View>

          <Text style={styles.pinCardTitle}>Workstation Session PIN</Text>
          <Text style={styles.pinCardSubtitle}>
            {isConnecting
              ? "Verifying room PIN with Relay..."
              : isComplete
              ? "Connecting to local workstation daemon..."
              : "Enter 6-digit PIN from terminal or VS Code"}
          </Text>

          {/* 6 Discrete PIN Boxes */}
          <TouchableOpacity
            style={styles.pinBoxesTouchable}
            activeOpacity={1}
            onPress={() => inputRef.current?.focus()}
          >
            <View style={styles.pinBoxesRow}>
              {[0, 1, 2, 3, 4, 5].map((dIdx) => {
                const digit = pin[dIdx] || "";
                const isCurrentActive = pin.length === dIdx && !isConnecting;
                return (
                  <View
                    key={dIdx}
                    style={[
                      styles.pinBox,
                      digit ? styles.pinBoxFilled : null,
                      isCurrentActive ? styles.pinBoxActive : null,
                      isComplete ? styles.pinBoxSuccess : null,
                    ]}
                  >
                    <Text
                      style={[
                        styles.pinBoxDigit,
                        isComplete ? styles.pinDigitSuccess : null,
                        isCurrentActive && !digit ? styles.pinCursor : null,
                      ]}
                    >
                      {digit ? digit : isCurrentActive ? "|" : ""}
                    </Text>
                  </View>
                );
              })}
            </View>

            {/* Hidden Input for Native Keyboard */}
            <TextInput
              ref={inputRef}
              style={styles.hiddenInput}
              value={pin}
              onChangeText={handlePinChange}
              maxLength={6}
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="number-pad"
              caretHidden
            />
          </TouchableOpacity>

          <Text style={styles.pinNoticeText}>
            🔒 Ephemeral session • Auto-expires on disconnect
          </Text>
        </View>

        {/* Connect Action Button */}
        <TouchableOpacity
          style={[
            styles.connectButton,
            isComplete && !isConnecting ? styles.connectButtonActive : styles.connectButtonDisabled,
          ]}
          onPress={handleManualConnect}
          disabled={!isComplete || isConnecting}
          activeOpacity={0.8}
        >
          {isConnecting ? (
            <ActivityIndicator color="#ffffff" size="small" />
          ) : (
            <Text
              style={[
                styles.connectButtonText,
                isComplete ? styles.connectTextActive : styles.connectTextDisabled,
              ]}
            >
              Connect to Workstation →
            </Text>
          )}
        </TouchableOpacity>

        {/* Host Info & Status Strip */}
        <View style={styles.hostInfoCard}>
          <View style={styles.hostInfoRow}>
            <Text style={styles.hostInfoLabel}>WebSocket Relay:</Text>
            <Text style={styles.hostInfoValue}>sub-50ms (Direct)</Text>
          </View>
          <View style={styles.hostInfoRow}>
            <Text style={styles.hostInfoLabel}>Security:</Text>
            <Text style={styles.hostInfoValue}>E2E Encrypted</Text>
          </View>
        </View>

        <View style={styles.tunnelStatusRow}>
          <View style={styles.tunnelDot} />
          <Text style={styles.tunnelText}>WebSocket Relay Active</Text>
        </View>

        {/* Advanced Relay URL Config */}
        <TouchableOpacity
          style={styles.advancedToggle}
          onPress={() => setShowAdvanced(!showAdvanced)}
          activeOpacity={0.7}
        >
          <Text style={styles.advancedToggleText}>
            {showAdvanced ? "▲ Hide Relay Config" : "▼ Relay: " + relayUrl}
          </Text>
        </TouchableOpacity>

        {showAdvanced && (
          <View style={styles.advancedBox}>
            <Text style={styles.relayLabel}>Relay Server URL</Text>
            <TextInput
              style={styles.relayInput}
              value={relayUrl}
              onChangeText={setRelayUrl}
              autoCapitalize="none"
              autoCorrect={false}
              placeholder="http://localhost:3001"
              placeholderTextColor={THEME_COLORS.textDim}
            />
          </View>
        )}
      </View>

      <View style={styles.footer}>
        <Text style={styles.footerText}>AirLink Universal Agent Remote • Zero Retention</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: THEME_COLORS.backgroundBase,
    justifyContent: "space-between",
  },
  topBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: THEME_SPACING.lg,
    paddingTop: THEME_SPACING.xl,
    paddingBottom: THEME_SPACING.md,
  },
  brandRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: THEME_SPACING.sm,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: THEME_COLORS.primaryAccent,
  },
  statusDotConnecting: {
    backgroundColor: THEME_COLORS.warning,
  },
  brandText: {
    color: THEME_COLORS.textPrimary,
    fontFamily: THEME_TYPOGRAPHY.fontFamily.sans,
    fontSize: THEME_TYPOGRAPHY.fontSize.md,
    fontWeight: THEME_TYPOGRAPHY.fontWeight.bold,
    letterSpacing: 0.5,
  },
  topRightRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  e2eBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 9999,
    backgroundColor: "rgba(56, 189, 248, 0.12)",
    borderColor: "rgba(56, 189, 248, 0.3)",
    borderWidth: 1,
  },
  e2eBadgeText: {
    color: THEME_COLORS.primaryAccent,
    fontFamily: THEME_TYPOGRAPHY.fontFamily.mono,
    fontSize: 10,
    fontWeight: THEME_TYPOGRAPHY.fontWeight.bold,
  },
  settingsButton: {
    paddingHorizontal: THEME_SPACING.sm,
    paddingVertical: 4,
    borderRadius: THEME_RADII.sm,
    backgroundColor: THEME_COLORS.cardSurfaceHover,
    borderColor: THEME_COLORS.border,
    borderWidth: 1,
  },
  settingsButtonText: {
    color: THEME_COLORS.textMuted,
    fontFamily: THEME_TYPOGRAPHY.fontFamily.sans,
    fontSize: THEME_TYPOGRAPHY.fontSize.xs,
    fontWeight: THEME_TYPOGRAPHY.fontWeight.medium,
  },
  content: {
    paddingHorizontal: THEME_SPACING.lg,
    alignItems: "center",
  },
  errorBanner: {
    width: "100%",
    backgroundColor: THEME_COLORS.dangerBg,
    borderColor: THEME_COLORS.danger,
    borderWidth: 1,
    borderRadius: THEME_RADII.md,
    padding: THEME_SPACING.md,
    marginBottom: THEME_SPACING.md,
  },
  errorBannerText: {
    color: THEME_COLORS.danger,
    fontFamily: THEME_TYPOGRAPHY.fontFamily.sans,
    fontSize: THEME_TYPOGRAPHY.fontSize.xs,
    textAlign: "center",
    fontWeight: THEME_TYPOGRAPHY.fontWeight.semibold,
  },
  pinCenterCard: {
    width: "100%",
    maxWidth: 340,
    backgroundColor: "rgba(15, 23, 42, 0.95)",
    borderColor: "rgba(255, 255, 255, 0.1)",
    borderWidth: 1,
    borderRadius: 20,
    paddingVertical: 24,
    paddingHorizontal: 16,
    alignItems: "center",
    marginBottom: 16,
  },
  lockCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 1.5,
    borderColor: "rgba(56, 189, 248, 0.4)",
    backgroundColor: "rgba(37, 99, 235, 0.15)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  lockCircleSuccess: {
    borderColor: "rgba(34, 197, 94, 0.6)",
    backgroundColor: "rgba(34, 197, 94, 0.15)",
  },
  lockCircleConnecting: {
    borderColor: "rgba(245, 158, 11, 0.6)",
    backgroundColor: "rgba(245, 158, 11, 0.15)",
  },
  lockIcon: {
    fontSize: 20,
  },
  pinCardTitle: {
    color: THEME_COLORS.textPrimary,
    fontFamily: THEME_TYPOGRAPHY.fontFamily.sans,
    fontSize: 17,
    fontWeight: THEME_TYPOGRAPHY.fontWeight.bold,
    marginBottom: 4,
  },
  pinCardSubtitle: {
    color: THEME_COLORS.textMuted,
    fontFamily: THEME_TYPOGRAPHY.fontFamily.sans,
    fontSize: 12,
    textAlign: "center",
    marginBottom: 18,
  },
  pinBoxesTouchable: {
    width: "100%",
    alignItems: "center",
    position: "relative",
    marginBottom: 12,
  },
  pinBoxesRow: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 8,
  },
  pinBox: {
    width: 40,
    height: 48,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: "rgba(255, 255, 255, 0.15)",
    backgroundColor: "#0a101f",
    alignItems: "center",
    justifyContent: "center",
  },
  pinBoxFilled: {
    borderColor: "rgba(56, 189, 248, 0.7)",
    backgroundColor: "rgba(15, 23, 42, 0.9)",
  },
  pinBoxActive: {
    borderColor: "#38bdf8",
    backgroundColor: "rgba(30, 58, 138, 0.25)",
  },
  pinBoxSuccess: {
    borderColor: "rgba(34, 197, 94, 0.8)",
    backgroundColor: "rgba(22, 101, 52, 0.25)",
  },
  pinBoxDigit: {
    color: "#ffffff",
    fontFamily: THEME_TYPOGRAPHY.fontFamily.mono,
    fontSize: 20,
    fontWeight: THEME_TYPOGRAPHY.fontWeight.bold,
  },
  pinDigitSuccess: {
    color: "#4ade80",
  },
  pinCursor: {
    color: "#38bdf8",
    fontSize: 18,
  },
  hiddenInput: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    opacity: 0.01,
  },
  pinNoticeText: {
    color: THEME_COLORS.textDim,
    fontFamily: THEME_TYPOGRAPHY.fontFamily.sans,
    fontSize: 11,
    marginTop: 4,
  },
  connectButton: {
    width: "100%",
    maxWidth: 340,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 14,
  },
  connectButtonActive: {
    backgroundColor: "#2563eb",
  },
  connectButtonDisabled: {
    backgroundColor: "rgba(30, 41, 59, 0.8)",
    borderColor: "rgba(255, 255, 255, 0.1)",
    borderWidth: 1,
  },
  connectButtonText: {
    fontFamily: THEME_TYPOGRAPHY.fontFamily.sans,
    fontSize: 14,
    fontWeight: THEME_TYPOGRAPHY.fontWeight.bold,
  },
  connectTextActive: {
    color: "#ffffff",
  },
  connectTextDisabled: {
    color: THEME_COLORS.textDim,
  },
  hostInfoCard: {
    width: "100%",
    maxWidth: 340,
    backgroundColor: "rgba(15, 23, 42, 0.6)",
    borderColor: "rgba(255, 255, 255, 0.06)",
    borderWidth: 1,
    borderRadius: 10,
    padding: 10,
    gap: 4,
    marginBottom: 10,
  },
  hostInfoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  hostInfoLabel: {
    color: THEME_COLORS.textDim,
    fontFamily: THEME_TYPOGRAPHY.fontFamily.sans,
    fontSize: 11,
  },
  hostInfoValue: {
    color: THEME_COLORS.textSecondary,
    fontFamily: THEME_TYPOGRAPHY.fontFamily.mono,
    fontSize: 11,
    fontWeight: THEME_TYPOGRAPHY.fontWeight.bold,
  },
  tunnelStatusRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 12,
  },
  tunnelDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#22c55e",
  },
  tunnelText: {
    color: "#22c55e",
    fontFamily: THEME_TYPOGRAPHY.fontFamily.mono,
    fontSize: 11,
    fontWeight: THEME_TYPOGRAPHY.fontWeight.bold,
  },
  advancedToggle: {
    paddingVertical: 4,
  },
  advancedToggleText: {
    color: THEME_COLORS.textDim,
    fontFamily: THEME_TYPOGRAPHY.fontFamily.mono,
    fontSize: 11,
  },
  advancedBox: {
    width: "100%",
    maxWidth: 340,
    marginTop: 8,
    backgroundColor: THEME_COLORS.cardSurface,
    borderColor: THEME_COLORS.border,
    borderWidth: 1,
    borderRadius: THEME_RADII.md,
    padding: THEME_SPACING.sm,
  },
  relayLabel: {
    color: THEME_COLORS.textMuted,
    fontFamily: THEME_TYPOGRAPHY.fontFamily.sans,
    fontSize: 10,
    marginBottom: 2,
  },
  relayInput: {
    backgroundColor: THEME_COLORS.codeBg,
    borderColor: THEME_COLORS.border,
    borderWidth: 1,
    borderRadius: THEME_RADII.sm,
    color: THEME_COLORS.textPrimary,
    fontFamily: THEME_TYPOGRAPHY.fontFamily.mono,
    fontSize: 11,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  footer: {
    paddingVertical: THEME_SPACING.md,
    alignItems: "center",
  },
  footerText: {
    color: THEME_COLORS.textDim,
    fontFamily: THEME_TYPOGRAPHY.fontFamily.sans,
    fontSize: 11,
  },
});
