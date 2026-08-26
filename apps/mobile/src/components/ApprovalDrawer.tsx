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
import { hapticsService } from "../services/haptics";
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

  useEffect(() => {
    if (!activeApproval) {
      setSecondsRemaining(totalSeconds);
      progressAnim.setValue(1);
      return;
    }

    hapticsService.triggerWarning();

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
          onDeny(activeApproval.approvalId, "Approval timed out after 180s");
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      clearInterval(timer);
      progressAnim.stopAnimation();
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
    activeApproval.commandOrDiff.includes("diff --git");

  const riskLevel: RiskLevel = activeApproval.riskLevel || "medium";

  const progressPercent = (secondsRemaining / totalSeconds) * 100;
  const getProgressColor = (): string => {
    if (secondsRemaining > totalSeconds * 0.5) return THEME_COLORS.success;
    if (secondsRemaining > totalSeconds * 0.2) return THEME_COLORS.warning;
    return THEME_COLORS.danger;
  };

  const formatTime = (secs: number): string => {
    const mins = Math.floor(secs / 60);
    const remSecs = secs % 60;
    return `${mins}:${remSecs < 10 ? "0" : ""}${remSecs}`;
  };

  const handleApprove = () => {
    if (secondsRemaining <= 0) return;
    hapticsService.triggerSuccess();
    onApprove(activeApproval.approvalId);
  };

  const handleDeny = () => {
    hapticsService.triggerError();
    onDeny(activeApproval.approvalId, "Rejected by developer on mobile");
  };

  return (
    <Modal
      visible={isVisible}
      transparent={true}
      animationType="slide"
      onRequestClose={() => {}}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.drawerContainer}>
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

          <View style={styles.actionRow}>
            <TouchableOpacity
              style={styles.denyButton}
              onPress={handleDeny}
              activeOpacity={0.8}
            >
              <Text style={styles.denyButtonText}>Deny</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.approveButton, secondsRemaining <= 0 && styles.buttonDisabled]}
              onPress={handleApprove}
              disabled={secondsRemaining <= 0}
              activeOpacity={0.8}
            >
              <Text style={styles.approveButtonText}>Approve</Text>
            </TouchableOpacity>
          </View>
        </View>
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
    paddingHorizontal: THEME_SPACING.lg,
    paddingTop: THEME_SPACING.sm,
    paddingBottom: THEME_SPACING.xxl,
    maxHeight: "85%",
  },
  dragHandle: {
    width: 36,
    height: 4,
    backgroundColor: THEME_COLORS.drawerHandle,
    borderRadius: THEME_RADII.full,
    alignSelf: "center",
    marginBottom: THEME_SPACING.sm,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: THEME_SPACING.xs,
    marginBottom: THEME_SPACING.xs,
  },
  titleGroup: {
    flexDirection: "row",
    alignItems: "center",
  },
  warningIndicator: {
    width: 8,
    height: 8,
    borderRadius: THEME_RADII.full,
    backgroundColor: THEME_COLORS.warning,
    marginRight: THEME_SPACING.sm,
  },
  headerTitle: {
    color: THEME_COLORS.textPrimary,
    fontFamily: THEME_TYPOGRAPHY.fontFamily.sans,
    fontSize: THEME_TYPOGRAPHY.fontSize.md,
    fontWeight: THEME_TYPOGRAPHY.fontWeight.bold,
  },
  riskBadge: {
    paddingHorizontal: THEME_SPACING.sm,
    paddingVertical: 3,
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
    backgroundColor: THEME_COLORS.successBg,
    borderColor: THEME_COLORS.success,
  },
  riskBadgeText: {
    fontFamily: THEME_TYPOGRAPHY.fontFamily.mono,
    fontSize: 10,
    fontWeight: THEME_TYPOGRAPHY.fontWeight.bold,
  },
  riskTextHigh: {
    color: THEME_COLORS.danger,
  },
  riskTextMedium: {
    color: THEME_COLORS.warning,
  },
  riskTextLow: {
    color: THEME_COLORS.success,
  },
  toolRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: THEME_SPACING.sm,
  },
  toolLabel: {
    color: THEME_COLORS.textMuted,
    fontFamily: THEME_TYPOGRAPHY.fontFamily.sans,
    fontSize: THEME_TYPOGRAPHY.fontSize.xs,
    marginRight: THEME_SPACING.xs,
  },
  toolBadge: {
    backgroundColor: THEME_COLORS.primaryAccentBg,
    borderColor: THEME_COLORS.primaryAccent,
    borderWidth: 1,
    borderRadius: THEME_RADII.sm,
    paddingHorizontal: THEME_SPACING.sm,
    paddingVertical: 2,
  },
  toolBadgeText: {
    color: THEME_COLORS.primaryAccent,
    fontFamily: THEME_TYPOGRAPHY.fontFamily.mono,
    fontSize: THEME_TYPOGRAPHY.fontSize.xs,
    fontWeight: THEME_TYPOGRAPHY.fontWeight.semibold,
  },
  descriptionBox: {
    backgroundColor: THEME_COLORS.cardSurfaceHover,
    borderRadius: THEME_RADII.sm,
    padding: THEME_SPACING.sm,
    marginBottom: THEME_SPACING.sm,
    borderLeftWidth: 3,
    borderLeftColor: THEME_COLORS.warning,
  },
  descriptionText: {
    color: THEME_COLORS.textSecondary,
    fontFamily: THEME_TYPOGRAPHY.fontFamily.sans,
    fontSize: THEME_TYPOGRAPHY.fontSize.xs,
    lineHeight: 18,
  },
  contentScrollView: {
    maxHeight: 260,
    marginBottom: THEME_SPACING.md,
  },
  commandContainer: {
    backgroundColor: THEME_COLORS.codeBg,
    borderRadius: THEME_RADII.md,
    borderWidth: 1,
    borderColor: THEME_COLORS.border,
    padding: THEME_SPACING.md,
  },
  commandLabel: {
    color: THEME_COLORS.textMuted,
    fontFamily: THEME_TYPOGRAPHY.fontFamily.sans,
    fontSize: THEME_TYPOGRAPHY.fontSize.xs,
    marginBottom: THEME_SPACING.xs,
  },
  commandText: {
    color: THEME_COLORS.textPrimary,
    fontFamily: THEME_TYPOGRAPHY.fontFamily.mono,
    fontSize: THEME_TYPOGRAPHY.fontSize.xs,
    lineHeight: 20,
  },
  timerSection: {
    marginBottom: THEME_SPACING.md,
  },
  timerLabelRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 6,
  },
  timerLabelText: {
    color: THEME_COLORS.textMuted,
    fontFamily: THEME_TYPOGRAPHY.fontFamily.sans,
    fontSize: THEME_TYPOGRAPHY.fontSize.xs,
  },
  timerCountdownText: {
    fontFamily: THEME_TYPOGRAPHY.fontFamily.mono,
    fontSize: THEME_TYPOGRAPHY.fontSize.xs,
    fontWeight: THEME_TYPOGRAPHY.fontWeight.semibold,
  },
  progressBarTrack: {
    height: 4,
    backgroundColor: THEME_COLORS.border,
    borderRadius: THEME_RADII.full,
    overflow: "hidden",
  },
  progressBarFill: {
    height: "100%",
    borderRadius: THEME_RADII.full,
  },
  actionRow: {
    flexDirection: "row",
    gap: THEME_SPACING.md,
  },
  denyButton: {
    flex: 1,
    backgroundColor: THEME_COLORS.dangerBg,
    borderColor: THEME_COLORS.danger,
    borderWidth: 1,
    paddingVertical: THEME_SPACING.md,
    borderRadius: THEME_RADII.md,
    alignItems: "center",
    justifyContent: "center",
  },
  denyButtonText: {
    color: THEME_COLORS.danger,
    fontFamily: THEME_TYPOGRAPHY.fontFamily.sans,
    fontSize: THEME_TYPOGRAPHY.fontSize.md,
    fontWeight: THEME_TYPOGRAPHY.fontWeight.bold,
  },
  approveButton: {
    flex: 2,
    backgroundColor: THEME_COLORS.success,
    paddingVertical: THEME_SPACING.md,
    borderRadius: THEME_RADII.md,
    alignItems: "center",
    justifyContent: "center",
  },
  approveButtonText: {
    color: "#ffffff",
    fontFamily: THEME_TYPOGRAPHY.fontFamily.sans,
    fontSize: THEME_TYPOGRAPHY.fontSize.md,
    fontWeight: THEME_TYPOGRAPHY.fontWeight.bold,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
});
