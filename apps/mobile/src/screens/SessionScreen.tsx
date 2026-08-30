import React, { useState, useEffect } from "react";
import { View, Text, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform, StatusBar, ImageBackground } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { THEME_COLORS, THEME_TYPOGRAPHY, THEME_RADII } from "../theme";
import { TerminalFeed } from "../components/TerminalFeed";
import { PromptInputBar } from "../components/PromptInputBar";
import { ApprovalDrawer } from "../components/ApprovalDrawer";
import { TerminalFeedSkeleton } from "../components/SkeletonLoader";
import { mobileSocketService } from "../services/socket";
import { feedbackService } from "../services/feedback";
import PAIRING_BG from "../../assets/pairing_bg.png";
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

  const insets = useSafeAreaInsets();
  const topPadding = Math.max(
    insets.top,
    Platform.OS === "android" ? (StatusBar.currentHeight || 28) : 0,
  );

  const workspaceName = sessionData.workspacePath
    ? sessionData.workspacePath.split("/").pop() || sessionData.workspacePath.split("\\").pop()
    : "workstation";

  return (
    <ImageBackground
      source={PAIRING_BG}
      style={styles.backgroundImage}
      resizeMode="cover"
    >
      {/* Translucent scrim overlay layer */}
      <View style={styles.overlayTint} />

      <KeyboardAvoidingView
        style={[styles.container, { paddingTop: topPadding }]}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <View style={styles.innerContainer}>
          {/* Header bar — frosted glass capsule banner */}
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <View style={styles.hostInfo}>
                <Text style={styles.screenHeaderTitle} numberOfLines={1}>
                  AirLink Remote
                </Text>
                <Text style={styles.workspaceText} numberOfLines={1}>
                  {sessionData.deviceName || "Host"} • {workspaceName}
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

          {/* Terminal feed + prompt input bar */}
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

          <ApprovalDrawer
            activeApproval={activeApproval}
            onApprove={handleApprove}
            onDeny={handleDeny}
          />
        </View>
      </KeyboardAvoidingView>
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
  innerContainer: {
    flex: 1,
  },
  // Frosted glass header bar
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "rgba(255, 255, 255, 0.12)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.25)",
    paddingHorizontal: 16,
    paddingVertical: 10,
    minHeight: 52,
    borderRadius: 18,
    marginHorizontal: 12,
    marginTop: 6,
    marginBottom: 6,
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
    minWidth: 0,
  },
  hostInfo: {
    flex: 1,
    minWidth: 0,
  },
  screenHeaderTitle: {
    color: "#ffffff",
    fontFamily: THEME_TYPOGRAPHY.fontFamily.sans,
    fontSize: 16,
    fontWeight: "800",
    letterSpacing: -0.3,
  },
  workspaceText: {
    color: "rgba(255, 255, 255, 0.8)",
    fontFamily: THEME_TYPOGRAPHY.fontFamily.mono,
    fontSize: 10.5,
    marginTop: 1,
  },
  headerRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    flexShrink: 0,
  },
  modelChip: {
    backgroundColor: "rgba(255, 255, 255, 0.16)",
    borderColor: "rgba(255, 255, 255, 0.3)",
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: THEME_RADII.full,
    maxWidth: 140,
  },
  modelChipText: {
    color: "#ffffff",
    fontFamily: THEME_TYPOGRAPHY.fontFamily.mono,
    fontSize: 10.5,
    fontWeight: "700",
  },
  disconnectButton: {
    backgroundColor: "rgba(239, 68, 68, 0.25)",
    borderColor: "rgba(239, 68, 68, 0.5)",
    borderWidth: 1,
    width: 32,
    height: 32,
    borderRadius: THEME_RADII.full,
    alignItems: "center",
    justifyContent: "center",
  },
  disconnectButtonText: {
    color: "#ffffff",
    fontSize: 13,
    fontWeight: "800",
    lineHeight: 16,
  },
  reconnectToastBanner: {
    backgroundColor: "rgba(255, 255, 255, 0.14)",
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255, 255, 255, 0.2)",
    paddingHorizontal: 14,
    paddingVertical: 7,
    alignItems: "center",
    justifyContent: "center",
  },
  reconnectToastText: {
    color: "#ffffff",
    fontSize: 11.5,
    fontWeight: "600",
    textAlign: "center",
  },
  sessionErrorBanner: {
    backgroundColor: "rgba(239, 68, 68, 0.3)",
    borderBottomWidth: 1,
    borderBottomColor: "rgba(239, 68, 68, 0.5)",
    paddingHorizontal: 14,
    paddingVertical: 7,
  },
  sessionErrorText: {
    color: "#ffffff",
    fontSize: 11.5,
    fontWeight: "600",
  },
  feedContainer: {
    flex: 1,
  },
});

