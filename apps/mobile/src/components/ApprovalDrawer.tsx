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
              <Text style={styles.safetyIcon}>⚠️</Text>
              <Text style={styles.safetyHeaderTitle}>Safety Gate Interception</Text>
            </View>
            <View style={styles.countdownBadge}>
              <Text style={styles.countdownBadgeText}>{secondsRemaining}s Gate</Text>
            </View>
          </View>

          <View style={styles.toolRow}>
            <Text style={styles.toolLabel}>Target Action:</Text>
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
              <View style={styles.commandCodeBlock}>
                <ScrollView horizontal showsHorizontalScrollIndicator={true}>
                  <Text style={styles.commandCodeText}>{activeApproval.commandOrDiff}</Text>
                </ScrollView>
              </View>
            )}
          </ScrollView>

          <View style={styles.timerSection}>
            <View style={styles.timerLabelRow}>
              <Text style={styles.timerLabelText}>Human-in-the-loop authorization</Text>
              <Text style={[styles.timerCountdownText, { color: getProgressColor() }]}>
                {formatTime(secondsRemaining)} auto-timeout
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
              style={styles.approveBtnExact}
              onPress={handleApprove}
              disabled={secondsRemaining <= 0}
              accessibilityLabel="Approve Action"
              accessibilityRole="button"
              activeOpacity={0.8}
            >
              <Text style={styles.approveBtnTextExact}>Approve (1-Tap)</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.rejectBtnExact}
              onPress={handleDeny}
              accessibilityLabel="Deny Action"
              accessibilityRole="button"
              activeOpacity={0.8}
            >
              <Text style={styles.rejectBtnTextExact}>Reject</Text>
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
  // Matches web: safetyGateCardSplit
  drawerContainer: {
    backgroundColor: "rgba(10, 15, 29, 0.92)",
    borderTopLeftRadius: THEME_RADII.xl,
    borderTopRightRadius: THEME_RADII.xl,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.25)",
    borderBottomWidth: 0,
    paddingHorizontal: THEME_SPACING.md,
    paddingTop: THEME_SPACING.sm,
    paddingBottom: THEME_SPACING.xl,
    maxHeight: "85%",
  },
  dragHandle: {
    width: 36,
    height: 4,
    backgroundColor: "rgba(255, 255, 255, 0.4)",
    borderRadius: THEME_RADII.full,
    alignSelf: "center",
    marginBottom: THEME_SPACING.sm,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: THEME_SPACING.sm,
  },
  titleGroup: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  safetyIcon: {
    fontSize: 15,
  },
  safetyHeaderTitle: {
    fontFamily: THEME_TYPOGRAPHY.fontFamily.sans,
    fontWeight: THEME_TYPOGRAPHY.fontWeight.heavy,
    fontSize: 13.5,
    color: "#ffffff",
  },
  countdownBadge: {
    backgroundColor: "rgba(245, 158, 11, 0.25)",
    borderColor: "rgba(245, 158, 11, 0.5)",
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  countdownBadgeText: {
    color: "#fbbf24",
    fontFamily: THEME_TYPOGRAPHY.fontFamily.mono,
    fontSize: 10.5,
    fontWeight: THEME_TYPOGRAPHY.fontWeight.bold,
  },
  toolRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: THEME_SPACING.sm,
    marginBottom: 6,
  },
  toolLabel: {
    fontFamily: THEME_TYPOGRAPHY.fontFamily.sans,
    fontSize: 11,
    color: "rgba(255, 255, 255, 0.8)",
  },
  toolBadge: {
    backgroundColor: "rgba(255, 255, 255, 0.14)",
    borderColor: "rgba(255, 255, 255, 0.28)",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
  },
  toolBadgeText: {
    fontFamily: THEME_TYPOGRAPHY.fontFamily.mono,
    fontSize: 11,
    color: "#ffffff",
    fontWeight: THEME_TYPOGRAPHY.fontWeight.bold,
  },
  descriptionBox: {
    backgroundColor: "rgba(255, 255, 255, 0.08)",
    padding: 10,
    borderRadius: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.18)",
  },
  descriptionText: {
    fontFamily: THEME_TYPOGRAPHY.fontFamily.sans,
    fontSize: 11.5,
    color: "#ffffff",
    lineHeight: 17,
  },
  contentScrollView: {
    maxHeight: 240,
    marginBottom: 10,
  },
  commandCodeBlock: {
    backgroundColor: "rgba(0, 0, 0, 0.4)",
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.2)",
  },
  commandCodeText: {
    fontFamily: THEME_TYPOGRAPHY.fontFamily.mono,
    fontSize: 11,
    color: "#ffffff",
  },
  timerSection: {
    marginBottom: 12,
  },
  timerLabelRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  timerLabelText: {
    fontFamily: THEME_TYPOGRAPHY.fontFamily.sans,
    fontSize: 10.5,
    color: "rgba(255, 255, 255, 0.8)",
  },
  timerCountdownText: {
    fontFamily: THEME_TYPOGRAPHY.fontFamily.mono,
    fontSize: 10.5,
    fontWeight: THEME_TYPOGRAPHY.fontWeight.bold,
    color: "#ffffff",
  },
  progressBarTrack: {
    height: 3,
    backgroundColor: "rgba(255, 255, 255, 0.15)",
    borderRadius: THEME_RADII.full,
    overflow: "hidden",
  },
  progressBarFill: {
    height: "100%",
    borderRadius: THEME_RADII.full,
  },
  buttonRow: {
    flexDirection: "row",
    gap: 8,
  },
  approveBtnExact: {
    flex: 2,
    backgroundColor: "#16a34a",
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#16a34a",
    shadowOpacity: 0.4,
    shadowRadius: 8,
  },
  approveBtnTextExact: {
    fontFamily: THEME_TYPOGRAPHY.fontFamily.sans,
    fontWeight: THEME_TYPOGRAPHY.fontWeight.bold,
    fontSize: 13,
    color: "#ffffff",
  },
  rejectBtnExact: {
    flex: 1,
    backgroundColor: "rgba(220, 38, 38, 0.25)",
    borderWidth: 1,
    borderColor: "rgba(220, 38, 38, 0.5)",
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  rejectBtnTextExact: {
    fontFamily: THEME_TYPOGRAPHY.fontFamily.sans,
    fontWeight: THEME_TYPOGRAPHY.fontWeight.bold,
    fontSize: 13,
    color: "#ffffff",
  },
});
