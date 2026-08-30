import React, { useState, useEffect } from "react";
import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView, KeyboardAvoidingView, Platform } from "react-native";
import { THEME_COLORS, THEME_TYPOGRAPHY, THEME_SPACING, THEME_RADII } from "../theme";
import { TerminalFeed } from "../components/TerminalFeed";
import { PromptInputBar } from "../components/PromptInputBar";
import { ApprovalDrawer } from "../components/ApprovalDrawer";
import { TerminalFeedSkeleton } from "../components/SkeletonLoader";
import { mobileSocketService } from "../services/socket";
import { feedbackService } from "../services/feedback";
import type {
  StreamFeedItem,
  ApprovalRequest,
  SessionConnected,
  AgentStream,
  StreamBatch,
  StandardError,
  BYOKConfig,
} from "../types";

export interface SessionScreenProps {
  sessionData: SessionConnected;
  onDisconnect: () => void;
  initialFeedItems?: StreamFeedItem[];
  byokConfig?: BYOKConfig | null;
  onOpenSettings?: () => void;
  isLoadingSession?: boolean;
}

export const SessionScreen: React.FC<SessionScreenProps> = ({
  sessionData,
  onDisconnect,
  initialFeedItems = [],
  byokConfig = null,
  onOpenSettings,
  isLoadingSession = false,
}) => {
  const [feedItems, setFeedItems] = useState<StreamFeedItem[]>(initialFeedItems);
  const [activeApproval, setActiveApproval] = useState<ApprovalRequest | null>(null);
  const [isStreaming, setIsStreaming] = useState<boolean>(false);
  const [isHydrating, setIsHydrating] = useState<boolean>(isLoadingSession);
  const [errorBanner, setErrorBanner] = useState<string | null>(null);
  const [reconnectToast, setReconnectToast] = useState<string | null>(null);

  const currentDisplayModel = byokConfig?.model || "0x-alpha";

  useEffect(() => {
    const unsubscribe = mobileSocketService.subscribe({
      onAgentStream: (payload: AgentStream) => {
        setIsStreaming(true);
        if (payload.type === "done") {
          setIsStreaming(false);
          feedbackService.triggerTurnComplete();
        }

        setFeedItems((prev) => {
          const lastItem = prev[prev.length - 1];
          if (
            payload.type === "token" &&
            lastItem &&
            lastItem.type === "token" &&
            lastItem.role !== "user"
          ) {
            const updated = [...prev];
            updated[updated.length - 1] = {
              ...lastItem,
              content: lastItem.content + payload.content,
              timestamp: payload.timestamp,
            };
            return updated;
          }

          const newItem: StreamFeedItem = {
            id: `stream_${payload.seqId}_${Date.now()}`,
            seqId: payload.seqId,
            type: payload.type,
            content: payload.content,
            role: "agent",
            metadata: payload.metadata,
            timestamp: payload.timestamp,
          };
          return [...prev, newItem];
        });
      },

      onSessionConnected: (payload: SessionConnected) => {
        setIsHydrating(false);
        if (payload.status === "disconnected") {
          setIsStreaming(false);
          setErrorBanner("Workstation host has disconnected.");
          feedbackService.triggerError();
        } else if (payload.status === "connected") {
          setReconnectToast("Connection restored. Replaying missed chunks...");
          setTimeout(() => setReconnectToast(null), 2500);
        }
      },

      onApprovalRequired: (payload: ApprovalRequest) => {
        setActiveApproval(payload);
      },

      onStreamBatch: (payload: StreamBatch) => {
        setIsHydrating(false);
        setFeedItems((prev) => {
          const existingSeqs = new Set(prev.map((i) => i.seqId).filter((s) => s > 0));
          const newItems: StreamFeedItem[] = [];
          for (const event of payload.events) {
            if (!existingSeqs.has(event.seqId)) {
              newItems.push({
                id: `batch_${event.seqId}_${event.timestamp}`,
                seqId: event.seqId,
                type: event.type,
                content: event.content,
                role: "agent",
                metadata: event.metadata,
                timestamp: event.timestamp,
              });
            }
          }
          return [...prev, ...newItems];
        });
      },

      onError: (payload: StandardError) => {
        setErrorBanner(`Error [${payload.code}]: ${payload.message}`);
        feedbackService.triggerError();
        setTimeout(() => setErrorBanner(null), 6000);
      },

      onDisconnect: (reason: string) => {
        setIsStreaming(false);
        setErrorBanner(`Disconnected from relay: ${reason}`);
        feedbackService.triggerError();
      },
    });

    return () => {
      unsubscribe();
    };
  }, []);

  const handleSendPrompt = (promptText: string) => {
    setErrorBanner(null);
    setIsStreaming(true);
    feedbackService.triggerSelection("medium");

    const userPromptItem: StreamFeedItem = {
      id: `prompt_${Date.now()}`,
      seqId: 0,
      type: "token",
      content: `> ${promptText}`,
      role: "user",
      timestamp: Date.now(),
    };
    setFeedItems((prev) => [...prev, userPromptItem]);

    try {
      mobileSocketService.sendPrompt(promptText, byokConfig || undefined);
    } catch (err) {
      setIsStreaming(false);
      const errMsg = err instanceof Error ? err.message : String(err);
      setErrorBanner(`Failed to send prompt: ${errMsg}`);
      feedbackService.triggerError();
    }
  };

  const handleApprove = (approvalId: string) => {
    try {
      mobileSocketService.sendApproval(approvalId, true);
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : String(err);
      setErrorBanner(`Failed to approve: ${errMsg}`);
    } finally {
      setActiveApproval(null);
    }
  };

  const handleDeny = (approvalId: string, reason?: string) => {
    try {
      mobileSocketService.sendApproval(approvalId, false, reason);
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : String(err);
      setErrorBanner(`Failed to deny: ${errMsg}`);
    } finally {
      setActiveApproval(null);
    }
  };

  const workspaceName = sessionData.workspacePath
    ? sessionData.workspacePath.split("/").pop() || sessionData.workspacePath.split("\\").pop()
    : "workstation";

  return (
    <SafeAreaView style={styles.container}>
      {/* Header bar — matches web landing page phone mockup screen header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={styles.statusDotLive} />
          <View style={styles.hostInfo}>
            <Text style={styles.screenHeaderTitle} numberOfLines={1}>
              {sessionData.deviceName || "Remote Host"}
            </Text>
            <Text style={styles.workspaceText} numberOfLines={1}>
              {workspaceName}
            </Text>
          </View>
        </View>

        <View style={styles.headerRight}>
          <TouchableOpacity style={styles.modelChip} onPress={onOpenSettings} activeOpacity={0.7}>
            <Text style={styles.modelChipText}>{currentDisplayModel}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.disconnectButton}
            onPress={onDisconnect}
            activeOpacity={0.7}
          >
            <Text style={styles.disconnectButtonText}>✕</Text>
          </TouchableOpacity>
        </View>
      </View>

      {reconnectToast && (
        <View style={styles.reconnectToastBanner}>
          <Text style={styles.reconnectToastText}>↻ {reconnectToast}</Text>
        </View>
      )}

      {errorBanner && (
        <View style={styles.sessionErrorBanner}>
          <Text style={styles.sessionErrorText}>{errorBanner}</Text>
        </View>
      )}

      {/* KeyboardAvoidingView ensures the prompt input bar always stays above the keyboard */}
      <KeyboardAvoidingView
        style={styles.keyboardAvoidingContainer}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={0}
      >
        <View style={styles.feedContainer}>
          {isHydrating ? (
            <TerminalFeedSkeleton />
          ) : (
            <TerminalFeed items={feedItems} isStreaming={isStreaming} />
          )}
        </View>

        <PromptInputBar
          onSubmit={handleSendPrompt}
          disabled={isStreaming}
          placeholder={
            isStreaming ? "Agent is working..." : "Ask agent to build, refactor, or fix..."
          }
        />
      </KeyboardAvoidingView>

      <ApprovalDrawer
        activeApproval={activeApproval}
        onApprove={handleApprove}
        onDeny={handleDeny}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: THEME_COLORS.backgroundBase,
  },
  keyboardAvoidingContainer: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    // Matches web landing page "screenHeader": frosted glass panel
    backgroundColor: "rgba(255, 255, 255, 0.06)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
    borderRadius: THEME_RADII.md,
    margin: THEME_SPACING.sm,
    paddingHorizontal: THEME_SPACING.md,
    paddingVertical: THEME_SPACING.sm,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: THEME_SPACING.sm,
    flex: 1,
  },
  statusDotLive: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: THEME_COLORS.success,
    shadowColor: THEME_COLORS.success,
    shadowOpacity: 0.8,
    shadowRadius: 4,
  },
  hostInfo: {
    flex: 1,
  },
  // Matches web landing page screen header: "AirLink Remote" bold white
  screenHeaderTitle: {
    color: THEME_COLORS.textPrimary,
    fontFamily: THEME_TYPOGRAPHY.fontFamily.sans,
    fontSize: THEME_TYPOGRAPHY.fontSize.sm,
    fontWeight: THEME_TYPOGRAPHY.fontWeight.bold,
  },
  workspaceText: {
    color: THEME_COLORS.textDim,
    fontFamily: THEME_TYPOGRAPHY.fontFamily.mono,
    fontSize: 10,
    marginTop: 1,
  },
  headerRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: THEME_SPACING.sm,
  },
  // Matches web landing page: sky-blue monospace model badge (e.g. "DeepSeek-R1")
  modelChip: {
    backgroundColor: THEME_COLORS.primaryAccentBg,
    borderColor: "rgba(56, 189, 248, 0.35)",
    borderWidth: 1,
    paddingHorizontal: THEME_SPACING.sm,
    paddingVertical: 3,
    borderRadius: THEME_RADII.full,
  },
  modelChipText: {
    color: THEME_COLORS.primaryAccent,
    fontFamily: THEME_TYPOGRAPHY.fontFamily.mono,
    fontSize: 10,
    fontWeight: THEME_TYPOGRAPHY.fontWeight.semibold,
  },
  // Compact ✕ icon button to save header space
  disconnectButton: {
    backgroundColor: THEME_COLORS.dangerBg,
    borderColor: "rgba(239, 68, 68, 0.35)",
    borderWidth: 1,
    width: 28,
    height: 28,
    borderRadius: THEME_RADII.full,
    alignItems: "center",
    justifyContent: "center",
  },
  disconnectButtonText: {
    color: THEME_COLORS.danger,
    fontFamily: THEME_TYPOGRAPHY.fontFamily.sans,
    fontSize: 12,
    fontWeight: THEME_TYPOGRAPHY.fontWeight.bold,
  },
  // Glassy sky-blue reconnect toast — matches web landing page "↻ Replay" indicator
  reconnectToastBanner: {
    backgroundColor: THEME_COLORS.primaryAccentBg,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(56, 189, 248, 0.3)",
    paddingHorizontal: THEME_SPACING.md,
    paddingVertical: 5,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: THEME_SPACING.xs,
  },
  reconnectToastText: {
    color: THEME_COLORS.primaryAccent,
    fontFamily: THEME_TYPOGRAPHY.fontFamily.sans,
    fontSize: 11,
    fontWeight: THEME_TYPOGRAPHY.fontWeight.semibold,
    textAlign: "center",
  },
  sessionErrorBanner: {
    backgroundColor: THEME_COLORS.dangerBg,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(239, 68, 68, 0.3)",
    paddingHorizontal: THEME_SPACING.md,
    paddingVertical: 5,
  },
  sessionErrorText: {
    color: THEME_COLORS.danger,
    fontFamily: THEME_TYPOGRAPHY.fontFamily.sans,
    fontSize: 11,
  },
  feedContainer: {
    flex: 1,
  },
});
