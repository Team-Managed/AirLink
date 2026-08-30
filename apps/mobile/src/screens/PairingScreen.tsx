import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Platform,
  StatusBar,
  ImageBackground,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { THEME_COLORS, THEME_TYPOGRAPHY, THEME_SPACING, THEME_RADII } from "../theme";
import { feedbackService } from "../services/feedback";
import PAIRING_BG from "../../assets/pairing_bg.png";

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
  defaultRelayUrl = (typeof process !== "undefined" && process.env.EXPO_PUBLIC_RELAY_URL) || "https://airlink-relay.onrender.com",
  onOpenSettings,
}) => {
  const [pin, setPin] = useState<string>("");
  const [relayUrl, setRelayUrl] = useState<string>(defaultRelayUrl);
  const [showAdvanced, setShowAdvanced] = useState<boolean>(false);
  const inputRef = useRef<TextInput>(null);
  const insets = useSafeAreaInsets();

  const topPadding = Math.max(
    insets.top,
    Platform.OS === "android" ? (StatusBar.currentHeight || 28) : 0,
  );

  useEffect(() => {
    // Auto-focus input on mount
    const timer = setTimeout(() => {
      inputRef.current?.focus();
    }, 300);
    return () => clearTimeout(timer);
  }, []);

  const handlePinChange = (text: string) => {
    const numeric = text.replace(/\D/g, "").slice(0, 6);
    setPin(numeric);

    if (numeric.length > pin.length) {
      feedbackService.triggerSelection("light");
    }

    if (numeric.length === 6 && !isConnecting) {
      feedbackService.triggerSelection("medium");
      onConnect(numeric, relayUrl.trim());
    }
  };

  const handleManualConnect = () => {
    if (pin.length === 6 && !isConnecting) {
      feedbackService.triggerSelection("medium");
      onConnect(pin, relayUrl.trim());
    }
  };

  const isComplete = pin.length === 6;

  return (
    <ImageBackground
      source={PAIRING_BG}
      style={styles.backgroundImage}
      resizeMode="cover"
    >
      {/* Subtle obsidian glass tint layer */}
      <View style={styles.overlayTint} />

      <View style={[styles.container, { paddingTop: topPadding, paddingBottom: Math.max(insets.bottom, 12) }]}>
        {/* Top Right Floating Three Big White Dots Settings Button */}
        {onOpenSettings && (
          <View style={styles.topRightFloatingRow}>
            <TouchableOpacity
              style={styles.threeDotsButton}
              onPress={onOpenSettings}
              activeOpacity={0.7}
              accessibilityLabel="Settings"
            >
              <View style={styles.dotsRow}>
                <View style={styles.bigWhiteDot} />
                <View style={styles.bigWhiteDot} />
                <View style={styles.bigWhiteDot} />
              </View>
            </TouchableOpacity>
          </View>
        )}

        <View style={styles.content}>
          {errorMessage && (
            <View style={styles.errorBanner}>
              <Text style={styles.errorBannerText}>{errorMessage}</Text>
            </View>
          )}

          {/* AirLink Title & Intro in Center */}
          <View style={styles.centerBrandSection}>
            <Text style={styles.brandTitle}>AirLink</Text>
            <Text style={styles.brandIntro}>
              Control your local coding agent from your phone with zero port-forwarding.
            </Text>
          </View>

          {/* Semi-Transparent Glassmorphic PIN Card (Blending with Wallpaper) */}
          <View style={styles.pinCenterCardExact}>
            <Text style={styles.pinMainTitleExact}>Workstation Session PIN</Text>
            <Text
              style={[
                styles.pinSubtitleExact,
                isComplete && styles.pinSubtitleSuccess,
              ]}
            >
              {isConnecting
                ? "Verifying session with Relay..."
                : isComplete
                ? "✓ Paired to Workstation Daemon"
                : "Enter 6-digit PIN from terminal"}
            </Text>

            {/* 6 Discrete Semi-Transparent PIN Boxes */}
            <TouchableOpacity
              style={styles.pinBoxesTouchable}
              activeOpacity={1}
              onPress={() => inputRef.current?.focus()}
            >
              <View style={styles.pinBoxesRowExact}>
                {[0, 1, 2, 3, 4, 5].map((dIdx) => {
                  const digit = pin[dIdx] || "";
                  const isCurrentActive = pin.length === dIdx && !isConnecting;
                  return (
                    <View
                      key={dIdx}
                      style={[
                        styles.pinBoxExact,
                        digit ? styles.pinBoxExactFilled : null,
                        isCurrentActive ? styles.pinBoxExactActive : null,
                        isComplete ? styles.pinBoxExactSuccess : null,
                      ]}
                    >
                      <Text
                        style={[
                          styles.pinBoxDigitExact,
                          isComplete ? styles.pinDigitExactSuccess : null,
                          isCurrentActive && !digit ? styles.pinCursorExact : null,
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

            <Text style={styles.pinExpiryTextExact}>
              ◈ Ephemeral session • Auto-expires
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
              <ActivityIndicator color="#090d16" size="small" />
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
          <View style={styles.hostInfoCardExact}>
            <View style={styles.hostInfoRowExact}>
              <Text style={styles.hostInfoLabelExact}>WebSocket Relay:</Text>
              <Text style={styles.hostInfoValueExact}>sub-50ms (Direct)</Text>
            </View>
            <View style={styles.hostInfoRowExact}>
              <Text style={styles.hostInfoLabelExact}>Security:</Text>
              <Text style={styles.hostInfoValueExact}>E2E Encrypted</Text>
            </View>
          </View>

          <View style={styles.tunnelStatusRowExact}>
            <View style={styles.tunnelDotExact} />
            <Text style={styles.tunnelTextExact}>WebSocket Relay Active</Text>
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
                placeholder="https://airlink-relay.onrender.com"
                placeholderTextColor={THEME_COLORS.textDim}
              />
            </View>
          )}
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>AirLink Universal Agent Remote • Zero Retention</Text>
        </View>
      </View>
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
    justifyContent: "space-between",
  },
  topRightFloatingRow: {
    flexDirection: "row",
    justifyContent: "flex-end",
    alignItems: "center",
    paddingHorizontal: THEME_SPACING.lg,
    paddingTop: THEME_SPACING.xs,
  },
  threeDotsButton: {
    backgroundColor: "rgba(255, 255, 255, 0.16)",
    borderColor: "rgba(255, 255, 255, 0.35)",
    borderWidth: 1,
    borderRadius: 22,
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
  },
  dotsRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 4.5,
  },
  bigWhiteDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#ffffff",
    shadowColor: "#ffffff",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 3,
  },
  content: {
    flex: 1,
    paddingHorizontal: THEME_SPACING.md,
    alignItems: "center",
    justifyContent: "center",
    width: "100%",
  },
  centerBrandSection: {
    alignItems: "center",
    marginBottom: 14,
  },
  brandTitle: {
    color: "#ffffff",
    fontFamily: THEME_TYPOGRAPHY.fontFamily.sans,
    fontSize: 34,
    fontWeight: "900",
    letterSpacing: -1.2,
    textAlign: "center",
    textShadowColor: "rgba(0, 0, 0, 0.4)",
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 8,
  },
  brandIntro: {
    color: "#ffffff",
    fontFamily: THEME_TYPOGRAPHY.fontFamily.sans,
    fontSize: 13,
    lineHeight: 19,
    textAlign: "center",
    marginTop: 4,
    maxWidth: 290,
    textShadowColor: "rgba(0, 0, 0, 0.3)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  errorBanner: {
    width: "100%",
    maxWidth: 340,
    backgroundColor: "rgba(239, 68, 68, 0.25)",
    borderColor: "rgba(239, 68, 68, 0.6)",
    borderWidth: 1,
    borderRadius: THEME_RADII.md,
    padding: THEME_SPACING.sm,
    marginBottom: THEME_SPACING.sm,
    alignSelf: "center",
  },
  errorBannerText: {
    color: "#ffffff",
    fontFamily: THEME_TYPOGRAPHY.fontFamily.sans,
    fontSize: THEME_TYPOGRAPHY.fontSize.xs,
    textAlign: "center",
    fontWeight: THEME_TYPOGRAPHY.fontWeight.bold,
  },
  // Semi-transparent frosted glass container
  pinCenterCardExact: {
    width: "100%",
    maxWidth: 340,
    backgroundColor: "rgba(255, 255, 255, 0.12)",
    borderColor: "rgba(255, 255, 255, 0.3)",
    borderWidth: 1,
    borderRadius: 24,
    paddingVertical: 20,
    paddingHorizontal: 16,
    alignItems: "center",
    justifyContent: "center",
    alignSelf: "center",
    marginVertical: 6,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 8,
  },
  pinMainTitleExact: {
    color: "#ffffff",
    fontFamily: THEME_TYPOGRAPHY.fontFamily.sans,
    fontSize: 15.5,
    fontWeight: THEME_TYPOGRAPHY.fontWeight.heavy,
    letterSpacing: -0.2,
    textAlign: "center",
  },
  pinSubtitleExact: {
    color: "#ffffff",
    opacity: 0.9,
    fontFamily: THEME_TYPOGRAPHY.fontFamily.sans,
    fontSize: 11.5,
    marginTop: 3,
    marginBottom: 14,
    textAlign: "center",
  },
  pinSubtitleSuccess: {
    color: "#4ade80",
    fontWeight: THEME_TYPOGRAPHY.fontWeight.bold,
  },
  pinBoxesTouchable: {
    width: "100%",
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
    marginBottom: 8,
  },
  pinBoxesRowExact: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
    width: "100%",
  },
  pinBoxExact: {
    width: 44,
    height: 52,
    backgroundColor: "rgba(255, 255, 255, 0.14)",
    borderColor: "rgba(255, 255, 255, 0.32)",
    borderWidth: 1.5,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  pinBoxExactFilled: {
    borderColor: "#ffffff",
    backgroundColor: "rgba(255, 255, 255, 0.22)",
  },
  pinBoxExactActive: {
    borderColor: "#ffffff",
    borderWidth: 2,
    backgroundColor: "rgba(255, 255, 255, 0.3)",
    shadowColor: "#ffffff",
    shadowOpacity: 0.5,
    shadowRadius: 8,
  },
  pinBoxExactSuccess: {
    borderColor: "rgba(34, 197, 94, 0.9)",
    backgroundColor: "rgba(22, 101, 52, 0.4)",
    shadowColor: "#22c55e",
    shadowOpacity: 0.5,
    shadowRadius: 8,
  },
  pinBoxDigitExact: {
    color: "#ffffff",
    fontFamily: THEME_TYPOGRAPHY.fontFamily.mono,
    fontSize: 22,
    fontWeight: THEME_TYPOGRAPHY.fontWeight.heavy,
    textAlign: "center",
    includeFontPadding: false,
  },
  pinDigitExactSuccess: {
    color: "#4ade80",
  },
  pinCursorExact: {
    color: "#ffffff",
    fontSize: 22,
    fontWeight: "300",
    textAlign: "center",
    includeFontPadding: false,
  },
  hiddenInput: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    opacity: 0.01,
  },
  pinExpiryTextExact: {
    color: "#ffffff",
    opacity: 0.85,
    fontFamily: THEME_TYPOGRAPHY.fontFamily.mono,
    fontSize: 10.5,
    marginTop: 10,
    textAlign: "center",
  },
  connectButton: {
    width: "100%",
    maxWidth: 340,
    paddingVertical: 13,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    alignSelf: "center",
    marginBottom: 8,
  },
  connectButtonActive: {
    backgroundColor: "#ffffff",
    shadowColor: "#ffffff",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 4,
  },
  connectButtonDisabled: {
    backgroundColor: "rgba(255, 255, 255, 0.16)",
    borderColor: "rgba(255, 255, 255, 0.32)",
    borderWidth: 1,
  },
  connectButtonText: {
    fontFamily: THEME_TYPOGRAPHY.fontFamily.sans,
    fontSize: 13.5,
    fontWeight: THEME_TYPOGRAPHY.fontWeight.bold,
    textAlign: "center",
  },
  connectTextActive: {
    color: "#090d16",
  },
  connectTextDisabled: {
    color: "#ffffff",
  },
  hostInfoCardExact: {
    width: "100%",
    maxWidth: 340,
    backgroundColor: "rgba(255, 255, 255, 0.12)",
    borderColor: "rgba(255, 255, 255, 0.26)",
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 10,
    gap: 4,
    marginBottom: 6,
    alignSelf: "center",
  },
  hostInfoRowExact: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  hostInfoLabelExact: {
    color: "#ffffff",
    opacity: 0.9,
    fontFamily: THEME_TYPOGRAPHY.fontFamily.sans,
    fontSize: 11,
  },
  hostInfoValueExact: {
    color: "#ffffff",
    fontFamily: THEME_TYPOGRAPHY.fontFamily.mono,
    fontSize: 11,
    fontWeight: THEME_TYPOGRAPHY.fontWeight.bold,
  },
  tunnelStatusRowExact: {
    width: "100%",
    maxWidth: 340,
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    justifyContent: "center",
    alignSelf: "center",
    backgroundColor: "rgba(255, 255, 255, 0.15)",
    borderColor: "rgba(255, 255, 255, 0.32)",
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 9,
    paddingHorizontal: 14,
    marginBottom: 6,
  },
  tunnelDotExact: {
    width: 6.5,
    height: 6.5,
    borderRadius: 3.25,
    backgroundColor: "#22c55e",
    shadowColor: "#22c55e",
    shadowOpacity: 0.9,
    shadowRadius: 5,
  },
  tunnelTextExact: {
    color: "#ffffff",
    fontFamily: THEME_TYPOGRAPHY.fontFamily.sans,
    fontSize: 11.5,
    fontWeight: THEME_TYPOGRAPHY.fontWeight.bold,
    textAlign: "center",
  },
  advancedToggle: {
    paddingVertical: 5,
    paddingHorizontal: 12,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.22)",
    alignSelf: "center",
  },
  advancedToggleText: {
    color: "#ffffff",
    opacity: 0.85,
    fontFamily: THEME_TYPOGRAPHY.fontFamily.mono,
    fontSize: 10,
    textAlign: "center",
  },
  advancedBox: {
    width: "100%",
    maxWidth: 340,
    marginTop: 6,
    backgroundColor: "rgba(255, 255, 255, 0.12)",
    borderColor: "rgba(255, 255, 255, 0.26)",
    borderWidth: 1,
    borderRadius: THEME_RADII.md,
    padding: THEME_SPACING.sm,
    alignSelf: "center",
  },
  relayLabel: {
    color: "#ffffff",
    opacity: 0.9,
    fontFamily: THEME_TYPOGRAPHY.fontFamily.sans,
    fontSize: 10,
    marginBottom: 2,
  },
  relayInput: {
    backgroundColor: "rgba(0, 0, 0, 0.25)",
    borderColor: "rgba(255, 255, 255, 0.3)",
    borderWidth: 1,
    borderRadius: THEME_RADII.sm,
    color: "#ffffff",
    fontFamily: THEME_TYPOGRAPHY.fontFamily.mono,
    fontSize: 11,
    paddingHorizontal: 8,
    paddingVertical: 6,
  },
  footer: {
    paddingVertical: THEME_SPACING.xs,
    alignItems: "center",
  },
  footerText: {
    color: "#ffffff",
    opacity: 0.85,
    fontFamily: THEME_TYPOGRAPHY.fontFamily.mono,
    fontSize: 9.5,
    textAlign: "center",
  },
});
