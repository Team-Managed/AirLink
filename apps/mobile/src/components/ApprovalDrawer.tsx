import React, { useEffect, useState, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  Animated,
} from "react-native";
import { THEME_COLORS, THEME_TYPOGRAPHY, THEME_SPACING, THEME_RADII } from "../theme";
import { DiffCard } from "./DiffCard";
import { feedbackService } from "../services/feedback";
import type { ApprovalRequest, RiskLevel } from "../types";

export interface ApprovalDrawerProps {
  activeApproval: ApprovalRequest | null;
  onApprove: (approvalId: string) => void;
  onDeny: (approvalId: string, reason?: string) => void;
}

export const ApprovalDrawer: React.FC<ApprovalDrawerProps> = ({
  activeApproval,
  onApprove,
  onDeny,
}) => {
  const isVisible = activeApproval !== null;
  const timeoutMs = activeApproval?.timeoutMs ?? 180000;
  const totalSeconds = Math.max(1, Math.floor(timeoutMs / 1000));

  const [secondsRemaining, setSecondsRemaining] = useState<number>(totalSeconds);
  const progressAnim = useRef(new Animated.Value(1)).current;
  const slideAnim = useRef(new Animated.Value(300)).current;
  const glowAnim = useRef(new Animated.Value(0.6)).current;

  useEffect(() => {
    if (!activeApproval) {
      setSecondsRemaining(totalSeconds);
      progressAnim.setValue(1);
      slideAnim.setValue(300);
      return;
    }

    feedbackService.triggerApprovalAlert();

    // Reset slideAnim to offscreen before animating up for every new approval
    slideAnim.setValue(300);
    Animated.spring(slideAnim, {
      toValue: 0,
      damping: 18,
      stiffness: 120,
      useNativeDriver: false,
    }).start();

    // High risk pulsing glow
    let glowLoop: Animated.CompositeAnimation | null = null;
    if (activeApproval.riskLevel === "high") {
      glowLoop = Animated.loop(
        Animated.sequence([
          Animated.timing(glowAnim, {
            toValue: 1,
            duration: 600,
            useNativeDriver: false,
          }),
          Animated.timing(glowAnim, {
            toValue: 0.5,
            duration: 600,
            useNativeDriver: false,
          }),
        ]),
      );
      glowLoop.start();
    }

    const createdSecAgo = Math.max(0, Math.floor((Date.now() - activeApproval.createdAt) / 1000));
    const initialSeconds = Math.max(0, totalSeconds - createdSecAgo);
    setSecondsRemaining(initialSeconds);

    progressAnim.setValue(initialSeconds / totalSeconds);
    Animated.timing(progressAnim, {
      toValue: 0,
      duration: initialSeconds * 1000,
      useNativeDriver: false,
    }).start();

    const timer = setInterval(() => {
      setSecondsRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          onDeny(activeApproval.approvalId, `Approval timed out after ${totalSeconds}s`);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      clearInterval(timer);
      progressAnim.stopAnimation();
      if (glowLoop) glowLoop.stop();
      slideAnim.setValue(300);
    };
  }, [activeApproval?.approvalId]);

  if (!activeApproval) {
    return null;
  }

  const isDiff =
    activeApproval.toolName === "write_file" ||
    activeApproval.toolName === "edit_file" ||
    activeApproval.toolName === "patch_file" ||
    activeApproval.commandOrDiff.includes("@@") ||
    activeApproval.commandOrDiff.startsWith("diff --git");

  const riskLevel: RiskLevel = activeApproval.riskLevel ?? "medium";

  const formatTime = (secs: number): string => {
    const mins = Math.floor(secs / 60);
    const remainingSecs = secs % 60;
    return `${mins}:${remainingSecs < 10 ? "0" : ""}${remainingSecs}`;
  };

  const progressPercent = (secondsRemaining / totalSeconds) * 100;

  // 3-band countdown color
  const getProgressColor = (): string => {
    if (secondsRemaining > 60) return THEME_COLORS.success;
    if (secondsRemaining > 20) return THEME_COLORS.warning;
    return THEME_COLORS.danger;
  };

  const handleApprove = () => {
    if (secondsRemaining <= 0) return;
    feedbackService.triggerDecision(true);
    onApprove(activeApproval.approvalId);
  };

  const handleDeny = () => {
    feedbackService.triggerDecision(false);
    onDeny(activeApproval.approvalId, "Rejected by developer on mobile");
  };

  return (
    <Modal visible={isVisible} transparent={true} animationType="none" onRequestClose={() => {}}>
      <View style={styles.modalOverlay}>
        <Animated.View
          style={[
            styles.drawerContainer,
            {
              transform: [{ translateY: slideAnim }],
              borderColor:
                riskLevel === "high"
                  ? glowAnim.interpolate({
                      inputRange: [0.5, 1],
                      outputRange: ["rgba(239, 68, 68, 0.4)", "rgba(239, 68, 68, 1)"],
                    })
                  : THEME_COLORS.border,
            },
          ]}
        >
          <View style={styles.dragHandle} />

          <View style={styles.headerRow}>
            <View style={styles.titleGroup}>
              <View style={styles.warningIndicator} />
              <Text style={styles.headerTitle}>Action Approval Required</Text>
            </View>
            <View
              style={[
                styles.riskBadge,
                riskLevel === "high" && styles.riskBadgeHigh,
                riskLevel === "medium" && styles.riskBadgeMedium,
                riskLevel === "low" && styles.riskBadgeLow,
              ]}
            >
              <Text
                style={[
                  styles.riskBadgeText,
                  riskLevel === "high" && styles.riskTextHigh,
                  riskLevel === "medium" && styles.riskTextMedium,
                  riskLevel === "low" && styles.riskTextLow,
                ]}
              >
                {riskLevel.toUpperCase()} RISK
              </Text>
            </View>
          </View>

          <View style={styles.toolRow}>
            <Text style={styles.toolLabel}>Tool:</Text>
            <View style={styles.toolBadge}>
              <Text style={styles.toolBadgeText}>{activeApproval.toolName}</Text>
            </View>
          </View>

          {activeApproval.description && (
            <View style={styles.descriptionBox}>
              <Text style={styles.descriptionText}>{activeApproval.description}</Text>
            </View>
          )}

          <ScrollView style={styles.contentScrollView} showsVerticalScrollIndicator={true}>
            {isDiff ? (
              <DiffCard diffText={activeApproval.commandOrDiff} />
            ) : (
              <View style={styles.commandContainer}>
                <Text style={styles.commandLabel}>Command to execute:</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={true}>
                  <Text style={styles.commandText}>{activeApproval.commandOrDiff}</Text>
                </ScrollView>
              </View>
            )}
          </ScrollView>

          <View style={styles.timerSection}>
            <View style={styles.timerLabelRow}>
              <Text style={styles.timerLabelText}>Auto-deny timer</Text>
              <Text style={[styles.timerCountdownText, { color: getProgressColor() }]}>
                {formatTime(secondsRemaining)} remaining
              </Text>
            </View>
            <View style={styles.progressBarTrack}>
              <View
                style={[
                  styles.progressBarFill,
                  {
                    width: `${Math.max(0, Math.min(100, progressPercent))}%`,
                    backgroundColor: getProgressColor(),
                  },
                ]}
              />
            </View>
          </View>

          <View style={styles.buttonRow}>
            <TouchableOpacity
              style={styles.denyButton}
              onPress={handleDeny}
              accessibilityLabel="Deny Action"
              accessibilityRole="button"
              activeOpacity={0.8}
            >
              <Text style={styles.denyButtonText}>Deny</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.approveButton, secondsRemaining <= 0 && styles.approveButtonDisabled]}
              onPress={handleApprove}
              disabled={secondsRemaining <= 0}
              accessibilityLabel="Approve Action"
              accessibilityRole="button"
              activeOpacity={0.8}
            >
              <Text style={styles.approveButtonText}>Approve</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: THEME_COLORS.backdrop,
    justifyContent: "flex-end",
  },
  drawerContainer: {
    backgroundColor: THEME_COLORS.cardSurface,
    borderTopLeftRadius: THEME_RADII.xl,
    borderTopRightRadius: THEME_RADII.xl,
    borderWidth: 1,
    borderColor: THEME_COLORS.border,
    borderBottomWidth: 0,
    paddingHorizontal: THEME_SPACING.lg,
    paddingTop: THEME_SPACING.sm,
    paddingBottom: THEME_SPACING.xl,
    maxHeight: "85%",
  },
  dragHandle: {
    width: 36,
    height: 4,
    backgroundColor: THEME_COLORS.drawerHandle,
    borderRadius: THEME_RADII.full,
    alignSelf: "center",
    marginBottom: THEME_SPACING.md,
    opacity: 0.6,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: THEME_SPACING.md,
  },
  titleGroup: {
    flexDirection: "row",
    alignItems: "center",
    gap: THEME_SPACING.sm,
  },
  warningIndicator: {
    width: 8,
    height: 8,
    borderRadius: THEME_RADII.full,
    backgroundColor: THEME_COLORS.warning,
  },
  headerTitle: {
    fontFamily: THEME_TYPOGRAPHY.fontFamily.sans,
    fontWeight: THEME_TYPOGRAPHY.fontWeight.bold,
    fontSize: THEME_TYPOGRAPHY.fontSize.md,
    color: THEME_COLORS.textPrimary,
  },
  riskBadge: {
    paddingHorizontal: THEME_SPACING.sm,
    paddingVertical: 2,
    borderRadius: THEME_RADII.sm,
    borderWidth: 1,
  },
  riskBadgeHigh: {
    backgroundColor: THEME_COLORS.dangerBg,
    borderColor: THEME_COLORS.danger,
  },
  riskBadgeMedium: {
    backgroundColor: THEME_COLORS.warningBg,
    borderColor: THEME_COLORS.warning,
  },
  riskBadgeLow: {
    backgroundColor: THEME_COLORS.primaryAccentBg,
    borderColor: THEME_COLORS.primaryAccent,
  },
  riskBadgeText: {
    fontFamily: THEME_TYPOGRAPHY.fontFamily.mono,
    fontSize: THEME_TYPOGRAPHY.fontSize.xs,
    fontWeight: THEME_TYPOGRAPHY.fontWeight.bold,
    letterSpacing: 0.5,
  },
  riskTextHigh: {
    color: THEME_COLORS.danger,
  },
  riskTextMedium: {
    color: THEME_COLORS.warning,
  },
  riskTextLow: {
    color: THEME_COLORS.primaryAccent,
  },
  toolRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: THEME_SPACING.sm,
    marginBottom: THEME_SPACING.sm,
  },
  toolLabel: {
    fontFamily: THEME_TYPOGRAPHY.fontFamily.sans,
    fontSize: THEME_TYPOGRAPHY.fontSize.sm,
    color: THEME_COLORS.textDim,
  },
  toolBadge: {
    backgroundColor: THEME_COLORS.cardSurfaceHover,
    paddingHorizontal: THEME_SPACING.sm,
    paddingVertical: 2,
    borderRadius: THEME_RADII.sm,
    borderWidth: 1,
    borderColor: THEME_COLORS.border,
  },
  toolBadgeText: {
    fontFamily: THEME_TYPOGRAPHY.fontFamily.mono,
    fontSize: THEME_TYPOGRAPHY.fontSize.sm,
    color: THEME_COLORS.primaryAccent,
  },
  descriptionBox: {
    backgroundColor: THEME_COLORS.backgroundBase,
    padding: THEME_SPACING.sm,
    borderRadius: THEME_RADII.sm,
    marginBottom: THEME_SPACING.sm,
    borderWidth: 1,
    borderColor: THEME_COLORS.border,
  },
  descriptionText: {
    fontFamily: THEME_TYPOGRAPHY.fontFamily.sans,
    fontSize: THEME_TYPOGRAPHY.fontSize.sm,
    color: THEME_COLORS.textMuted,
  },
  contentScrollView: {
    maxHeight: 280,
    marginBottom: THEME_SPACING.md,
  },
  commandContainer: {
    backgroundColor: THEME_COLORS.backgroundBase,
    padding: THEME_SPACING.md,
    borderRadius: THEME_RADII.md,
    borderWidth: 1,
    borderColor: THEME_COLORS.border,
  },
  commandLabel: {
    fontFamily: THEME_TYPOGRAPHY.fontFamily.sans,
    fontSize: THEME_TYPOGRAPHY.fontSize.xs,
    color: THEME_COLORS.textDim,
    marginBottom: THEME_SPACING.xs,
  },
  commandText: {
    fontFamily: THEME_TYPOGRAPHY.fontFamily.mono,
    fontSize: THEME_TYPOGRAPHY.fontSize.sm,
    color: THEME_COLORS.textPrimary,
  },
  timerSection: {
    marginBottom: THEME_SPACING.lg,
  },
  timerLabelRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: THEME_SPACING.xs,
  },
  timerLabelText: {
    fontFamily: THEME_TYPOGRAPHY.fontFamily.sans,
    fontSize: THEME_TYPOGRAPHY.fontSize.xs,
    color: THEME_COLORS.textDim,
  },
  timerCountdownText: {
    fontFamily: THEME_TYPOGRAPHY.fontFamily.mono,
    fontSize: THEME_TYPOGRAPHY.fontSize.xs,
    fontWeight: THEME_TYPOGRAPHY.fontWeight.bold,
  },
  progressBarTrack: {
    height: 4,
    backgroundColor: THEME_COLORS.cardSurfaceHover,
    borderRadius: THEME_RADII.full,
    overflow: "hidden",
  },
  progressBarFill: {
    height: "100%",
    borderRadius: THEME_RADII.full,
  },
  buttonRow: {
    flexDirection: "row",
    gap: THEME_SPACING.md,
  },
  denyButton: {
    flex: 1,
    backgroundColor: THEME_COLORS.cardSurfaceHover,
    borderWidth: 1,
    borderColor: THEME_COLORS.danger,
    paddingVertical: THEME_SPACING.md,
    borderRadius: THEME_RADII.md,
    alignItems: "center",
    justifyContent: "center",
  },
  denyButtonText: {
    fontFamily: THEME_TYPOGRAPHY.fontFamily.sans,
    fontWeight: THEME_TYPOGRAPHY.fontWeight.bold,
    fontSize: THEME_TYPOGRAPHY.fontSize.md,
    color: THEME_COLORS.danger,
  },
  approveButton: {
    flex: 2,
    backgroundColor: THEME_COLORS.success,
    paddingVertical: THEME_SPACING.md,
    borderRadius: THEME_RADII.md,
    alignItems: "center",
    justifyContent: "center",
  },
  approveButtonDisabled: {
    opacity: 0.4,
    backgroundColor: THEME_COLORS.cardSurfaceHover,
  },
  approveButtonText: {
    fontFamily: THEME_TYPOGRAPHY.fontFamily.sans,
    fontWeight: THEME_TYPOGRAPHY.fontWeight.bold,
    fontSize: THEME_TYPOGRAPHY.fontSize.md,
    color: THEME_COLORS.backgroundBase,
  },
});
