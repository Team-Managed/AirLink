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
import { SkeletonLoader } from "../components/SkeletonLoader";

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
    const sanitized = text.replace(/[^a-zA-Z0-9]/g, "").slice(0, 6);
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
      <View style={styles.topBar}>
        <View style={styles.brandRow}>
          <View style={[styles.statusDot, isConnecting && styles.statusDotConnecting]} />
          <Text style={styles.brandText}>AGENT REMOTE</Text>
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

      <View style={styles.content}>
        <View style={styles.titleSection}>
          <Text style={styles.mainTitle}>Pair with Host</Text>
          <Text style={styles.subtitle}>
            Enter the 6-digit PIN displayed on your terminal or VS Code extension.
          </Text>
        </View>

        {errorMessage && (
          <View style={styles.errorBanner}>
            <Text style={styles.errorBannerText}>{errorMessage}</Text>
          </View>
        )}

        <View style={styles.pinContainer}>
          {isConnecting ? (
            <View style={styles.connectingPlaceholder}>
              <SkeletonLoader width="80%" height={36} borderRadius={8} />
              <Text style={styles.connectingStatusText}>Verifying room PIN with Relay...</Text>
            </View>
          ) : (
            <TextInput
              ref={inputRef}
              style={styles.pinInput}
              value={pin}
              onChangeText={handlePinChange}
              placeholder="------"
              placeholderTextColor={THEME_COLORS.textDim}
              maxLength={6}
              autoCapitalize="characters"
              autoCorrect={false}
              keyboardType="default"
              textAlign="center"
            />
          )}
        </View>

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
            <ActivityIndicator color="#000000" size="small" />
          ) : (
            <Text
              style={[
                styles.connectButtonText,
                isComplete ? styles.connectTextActive : styles.connectTextDisabled,
              ]}
            >
              Connect to PC
            </Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.advancedToggle}
          onPress={() => setShowAdvanced(!showAdvanced)}
          activeOpacity={0.7}
        >
          <Text style={styles.advancedToggleText}>
            {showAdvanced ? "Hide Relay Config" : "Relay Server: " + relayUrl}
          </Text>
        </TouchableOpacity>

        {showAdvanced && (
          <View style={styles.advancedBox}>
            <Text style={styles.relayLabel}>Relay URL</Text>
            <TextInput
              style={styles.relayInput}
              value={relayUrl}
              onChangeText={setRelayUrl}
              autoCapitalize="none"
              autoCorrect={false}
              placeholder="http://localhost:3000"
              placeholderTextColor={THEME_COLORS.textDim}
            />
          </View>
        )}
      </View>

      <View style={styles.footer}>
        <Text style={styles.footerText}>Zero Port-Forwarding | Encrypted Local Control</Text>
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
    fontFamily: THEME_TYPOGRAPHY.fontFamily.mono,
    fontSize: THEME_TYPOGRAPHY.fontSize.sm,
    fontWeight: THEME_TYPOGRAPHY.fontWeight.bold,
    letterSpacing: 1.5,
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
    paddingHorizontal: THEME_SPACING.xl,
    alignItems: "center",
  },
  titleSection: {
    alignItems: "center",
    marginBottom: THEME_SPACING.xl,
  },
  mainTitle: {
    color: THEME_COLORS.textPrimary,
    fontFamily: THEME_TYPOGRAPHY.fontFamily.sans,
    fontSize: THEME_TYPOGRAPHY.fontSize.xxl,
    fontWeight: THEME_TYPOGRAPHY.fontWeight.bold,
    marginBottom: THEME_SPACING.xs,
  },
  subtitle: {
    color: THEME_COLORS.textMuted,
    fontFamily: THEME_TYPOGRAPHY.fontFamily.sans,
    fontSize: THEME_TYPOGRAPHY.fontSize.sm,
    textAlign: "center",
    lineHeight: 20,
    maxWidth: 320,
  },
  errorBanner: {
    width: "100%",
    backgroundColor: THEME_COLORS.dangerBg,
    borderColor: THEME_COLORS.danger,
    borderWidth: 1,
    borderRadius: THEME_RADII.md,
    padding: THEME_SPACING.md,
    marginBottom: THEME_SPACING.lg,
  },
  errorBannerText: {
    color: THEME_COLORS.danger,
    fontFamily: THEME_TYPOGRAPHY.fontFamily.sans,
    fontSize: THEME_TYPOGRAPHY.fontSize.xs,
    textAlign: "center",
    fontWeight: THEME_TYPOGRAPHY.fontWeight.semibold,
  },
  pinContainer: {
    width: "100%",
    maxWidth: 320,
    backgroundColor: THEME_COLORS.cardSurface,
    borderColor: THEME_COLORS.border,
    borderWidth: 1,
    borderRadius: THEME_RADII.lg,
    paddingVertical: THEME_SPACING.lg,
    paddingHorizontal: THEME_SPACING.md,
    marginBottom: THEME_SPACING.xl,
    alignItems: "center",
    minHeight: 88,
    justifyContent: "center",
  },
  connectingPlaceholder: {
    alignItems: "center",
    width: "100%",
    gap: 8,
  },
  connectingStatusText: {
    color: THEME_COLORS.textMuted,
    fontFamily: THEME_TYPOGRAPHY.fontFamily.sans,
    fontSize: 11,
  },
  pinInput: {
    color: THEME_COLORS.primaryAccent,
    fontFamily: THEME_TYPOGRAPHY.fontFamily.mono,
    fontSize: THEME_TYPOGRAPHY.fontSize.pin,
    fontWeight: THEME_TYPOGRAPHY.fontWeight.heavy,
    letterSpacing: 8,
    width: "100%",
  },
  connectButton: {
    width: "100%",
    maxWidth: 320,
    paddingVertical: THEME_SPACING.md,
    borderRadius: THEME_RADII.md,
    alignItems: "center",
    justifyContent: "center",
    height: 48,
    marginBottom: THEME_SPACING.lg,
  },
  connectButtonActive: {
    backgroundColor: THEME_COLORS.primaryAccent,
  },
  connectButtonDisabled: {
    backgroundColor: THEME_COLORS.cardSurfaceHover,
    borderColor: THEME_COLORS.border,
    borderWidth: 1,
  },
  connectButtonText: {
    fontFamily: THEME_TYPOGRAPHY.fontFamily.sans,
    fontSize: THEME_TYPOGRAPHY.fontSize.md,
    fontWeight: THEME_TYPOGRAPHY.fontWeight.bold,
  },
  connectTextActive: {
    color: "#000000",
  },
  connectTextDisabled: {
    color: THEME_COLORS.textDim,
  },
  advancedToggle: {
    paddingVertical: THEME_SPACING.xs,
  },
  advancedToggleText: {
    color: THEME_COLORS.textDim,
    fontFamily: THEME_TYPOGRAPHY.fontFamily.mono,
    fontSize: 11,
  },
  advancedBox: {
    width: "100%",
    maxWidth: 320,
    marginTop: THEME_SPACING.md,
    backgroundColor: THEME_COLORS.cardSurface,
    borderColor: THEME_COLORS.border,
    borderWidth: 1,
    borderRadius: THEME_RADII.md,
    padding: THEME_SPACING.md,
  },
  relayLabel: {
    color: THEME_COLORS.textMuted,
    fontFamily: THEME_TYPOGRAPHY.fontFamily.sans,
    fontSize: 11,
    marginBottom: 4,
  },
  relayInput: {
    backgroundColor: THEME_COLORS.codeBg,
    borderColor: THEME_COLORS.border,
    borderWidth: 1,
    borderRadius: THEME_RADII.sm,
    color: THEME_COLORS.textPrimary,
    fontFamily: THEME_TYPOGRAPHY.fontFamily.mono,
    fontSize: THEME_TYPOGRAPHY.fontSize.xs,
    paddingHorizontal: THEME_SPACING.sm,
    paddingVertical: 6,
  },
  footer: {
    paddingVertical: THEME_SPACING.lg,
    alignItems: "center",
  },
  footerText: {
    color: THEME_COLORS.textDim,
    fontFamily: THEME_TYPOGRAPHY.fontFamily.sans,
    fontSize: 11,
  },
});
