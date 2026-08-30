import React, { useRef, useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  NativeSyntheticEvent,
  NativeScrollEvent,
  Keyboard,
  Animated,
} from "react-native";
import { THEME_COLORS, THEME_TYPOGRAPHY, THEME_SPACING, THEME_RADII } from "../theme";
import type { StreamFeedItem } from "../types";

export interface TerminalFeedProps {
  items: StreamFeedItem[];
  isStreaming?: boolean;
}

export const TerminalFeed: React.FC<TerminalFeedProps> = ({ items, isStreaming = false }) => {
  const flatListRef = useRef<FlatList<StreamFeedItem>>(null);
  const [isAutoScrollLocked, setIsAutoScrollLocked] = useState<boolean>(false);
  const [collapsedItems, setCollapsedItems] = useState<Record<string, boolean>>({});
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const previousItemCountRef = useRef<number>(items.length);

  const cursorAnim = useRef(new Animated.Value(0)).current;

  // Blinking cursor loop for active streaming
  useEffect(() => {
    if (!isStreaming) return;

    const blink = Animated.loop(
      Animated.sequence([
        Animated.timing(cursorAnim, {
          toValue: 1,
          duration: 500,
          useNativeDriver: false,
        }),
        Animated.timing(cursorAnim, {
          toValue: 0,
          duration: 500,
          useNativeDriver: false,
        }),
      ]),
    );
    blink.start();

    return () => {
      blink.stop();
    };
  }, [isStreaming, cursorAnim]);

  // Handle auto-scroll and unread counter
  useEffect(() => {
    if (!isAutoScrollLocked && items.length > 0) {
      flatListRef.current?.scrollToEnd({ animated: true });
      setUnreadCount(0);
    } else if (isAutoScrollLocked) {
      const added = items.length - previousItemCountRef.current;
      if (added > 0) {
        setUnreadCount((prev) => prev + added);
      }
    }
    previousItemCountRef.current = items.length;
  }, [items, isAutoScrollLocked]);

  const handleContentSizeChange = () => {
    if (!isAutoScrollLocked && items.length > 0) {
      flatListRef.current?.scrollToEnd({ animated: true });
    }
  };

  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    Keyboard.dismiss();

    const { layoutMeasurement, contentOffset, contentSize } = event.nativeEvent;
    const distanceFromBottom = contentSize.height - (layoutMeasurement.height + contentOffset.y);
    const isAtBottom = distanceFromBottom <= 40;
    const isScrolledUpPast200 = distanceFromBottom > 200;

    if (isAtBottom && isAutoScrollLocked) {
      setIsAutoScrollLocked(false);
      setUnreadCount(0);
    } else if (isScrolledUpPast200 && !isAutoScrollLocked) {
      setIsAutoScrollLocked(true);
    }
  };

  const scrollToBottom = () => {
    setIsAutoScrollLocked(false);
    setUnreadCount(0);
    flatListRef.current?.scrollToEnd({ animated: true });
  };

  const toggleCollapse = (id: string) => {
    setCollapsedItems((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const renderItem = ({ item, index }: { item: StreamFeedItem; index: number }) => {
    const isCollapsed = collapsedItems[item.id] ?? false;
    const isLastItem = index === items.length - 1;

    switch (item.type) {
      // ── Thinking / CoT block ────────────────────────────────────────────────
      case "thought":
        return (
          <View style={styles.thoughtCard}>
            {/* Frosted-glass header row — matches web "chatUpperSection" card */}
            <TouchableOpacity
              style={styles.thoughtHeader}
              onPress={() => toggleCollapse(item.id)}
              activeOpacity={0.7}
            >
              <View style={styles.traceWorkedRow}>
                <Text style={styles.traceWorkedText}>Thinking Process</Text>
                {/* Chevron — matches web "traceWorkedHeader" SVG */}
                <Text style={[styles.chevron, isCollapsed && styles.chevronRight]}>›</Text>
              </View>
              <Text style={styles.collapseToggleText}>{isCollapsed ? "Expand" : "Collapse"}</Text>
            </TouchableOpacity>
            {!isCollapsed && (
              <Text style={styles.thoughtContent}>{item.content}</Text>
            )}
          </View>
        );

      // ── Tool call card ──────────────────────────────────────────────────────
      case "tool_call": {
        const toolName = item.metadata?.name || "tool";
        return (
          // Matches web "fileChangesCard": dark #030712 bg, white border
          <View style={styles.toolCallCard}>
            <View style={styles.toolCallHeaderRow}>
              {/* Tool name badge — sky-blue pill (matches web "toolNameBadge") */}
              <View style={styles.toolNameBadge}>
                <Text style={styles.toolNameText}>{toolName}</Text>
              </View>
              <Text style={styles.toolCallStatus}>Executing...</Text>
            </View>
            {/* Code snippet — matches web terminal block */}
            <View style={styles.codeBlock}>
              <Text style={styles.codeBlockText}>{item.content}</Text>
            </View>
          </View>
        );
      }

      // ── Tool result card ────────────────────────────────────────────────────
      case "tool_result": {
        const duration = item.metadata?.durationMs;
        const exitCode = item.metadata?.exitCode ?? 0;
        const isSuccess = exitCode === 0;

        return (
          // Matches web "fileChangesCard" dark container
          <View style={[styles.toolResultCard, !isSuccess && styles.toolResultFailed]}>
            {/* Header row: green/red dot + "X Result" + duration + Collapse */}
            <TouchableOpacity
              style={styles.toolResultHeaderRow}
              onPress={() => toggleCollapse(item.id)}
              activeOpacity={0.7}
            >
              <View style={styles.resultTitleGroup}>
                <View
                  style={[
                    styles.resultStatusDot,
                    isSuccess ? styles.statusDotSuccess : styles.statusDotError,
                  ]}
                />
                <Text style={styles.resultTitle}>
                  {item.metadata?.name ? `${item.metadata.name} Result` : "Tool Output"}
                </Text>
                {duration !== undefined && (
                  <Text style={styles.durationBadge}>{duration}ms</Text>
                )}
              </View>
              <Text style={styles.collapseToggleText}>{isCollapsed ? "Expand" : "Collapse"}</Text>
            </TouchableOpacity>

            {/* Output body — terminal-style code block */}
            {!isCollapsed && (
              <View style={styles.codeBlock}>
                <Text style={styles.codeBlockText}>{item.content}</Text>
              </View>
            )}
          </View>
        );
      }

      // ── Error card ──────────────────────────────────────────────────────────
      case "error":
        return (
          <View style={styles.errorCard}>
            <Text style={styles.errorTitle}>⚠ Agent Error</Text>
            <Text style={styles.errorContent}>{item.content}</Text>
          </View>
        );

      // ── Token / user prompt ─────────────────────────────────────────────────
      case "token":
      default:
        if (item.role === "user") {
          // Matches web "userMessageCard": frosted glass, white text, rounded
          return (
            <View style={styles.userMessageCard}>
              <Text style={styles.userMessageText}>{item.content}</Text>
            </View>
          );
        }

        // Agent token stream — matches web terminal output area
        return (
          <View style={styles.agentTokenContainer}>
            <Text style={styles.agentTokenText}>
              {item.content}
            </Text>
            {isStreaming && isLastItem && (
              <Animated.View style={[styles.blinkingCursor, { opacity: cursorAnim }]} />
            )}
          </View>
        );
    }
  };

  return (
    <View style={styles.container}>
      <FlatList
        ref={flatListRef}
        data={items}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        onScroll={handleScroll}
        onContentSizeChange={handleContentSizeChange}
        scrollEventThrottle={100}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={true}
        initialNumToRender={15}
        maxToRenderPerBatch={20}
        windowSize={10}
      />

      {/* Streaming indicator — matches web "telemetryLiveDot" row */}
      {isStreaming && (
        <View style={styles.streamingIndicatorRow}>
          <View style={styles.pulsingDot} />
          <Text style={styles.streamingText}>● Stream Active</Text>
        </View>
      )}

      {/* Jump to live pill — matches web "scrollResumePill" */}
      {isAutoScrollLocked && (
        <TouchableOpacity
          style={styles.scrollResumePill}
          onPress={scrollToBottom}
          activeOpacity={0.8}
        >
          <Text style={styles.scrollResumeText}>
            ↓ Jump to Live {unreadCount > 0 ? `(${unreadCount} new)` : ""}
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: THEME_COLORS.backgroundBase,
  },
  listContent: {
    padding: THEME_SPACING.md,
    gap: THEME_SPACING.sm,
    paddingBottom: THEME_SPACING.xxxl,
  },

  // ── User message card ─────────────────────────────────────────────────────
  // Matches web: rgba(255,255,255,0.06) bg, rgba(255,255,255,0.08) border, 10px radius
  userMessageCard: {
    backgroundColor: "rgba(255, 255, 255, 0.07)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.09)",
    borderRadius: THEME_RADII.md,
    paddingHorizontal: THEME_SPACING.md,
    paddingVertical: THEME_SPACING.sm,
  },
  userMessageText: {
    color: THEME_COLORS.textPrimary,    // #f1f5f9 — matches web userMessageCard color
    fontFamily: THEME_TYPOGRAPHY.fontFamily.sans,
    fontSize: THEME_TYPOGRAPHY.fontSize.sm,
    lineHeight: 20,
    fontWeight: THEME_TYPOGRAPHY.fontWeight.regular,
  },

  // ── Agent token stream ────────────────────────────────────────────────────
  // Clean readable prose, no background — matches web token telemetry output
  agentTokenContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "flex-start",
    paddingHorizontal: 2,
  },
  agentTokenText: {
    color: THEME_COLORS.textPrimary,
    fontFamily: THEME_TYPOGRAPHY.fontFamily.sans,
    fontSize: THEME_TYPOGRAPHY.fontSize.sm,
    lineHeight: 22,
  },
  blinkingCursor: {
    width: 7,
    height: 14,
    backgroundColor: THEME_COLORS.primaryAccent,
    marginLeft: 2,
    marginTop: 3,
    borderRadius: 1,
  },

  // ── Thinking / CoT card ───────────────────────────────────────────────────
  // Matches web "chatUpperSection": translucent bg, subtle border, 10px radius
  thoughtCard: {
    backgroundColor: "rgba(255, 255, 255, 0.03)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.07)",
    borderRadius: THEME_RADII.md,
    padding: THEME_SPACING.sm,
  },
  thoughtHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  // Matches web "traceWorkedHeader": muted mono text + chevron
  traceWorkedRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  traceWorkedText: {
    color: THEME_COLORS.textMuted,      // #94a3b8
    fontFamily: THEME_TYPOGRAPHY.fontFamily.mono,
    fontSize: 11,
    fontWeight: THEME_TYPOGRAPHY.fontWeight.semibold,
  },
  chevron: {
    color: THEME_COLORS.textMuted,
    fontSize: 14,
    fontWeight: THEME_TYPOGRAPHY.fontWeight.bold,
    transform: [{ rotate: "90deg" }],   // pointing down when expanded
  },
  chevronRight: {
    transform: [{ rotate: "0deg" }],    // pointing right when collapsed
  },
  collapseToggleText: {
    color: THEME_COLORS.primaryAccent,
    fontFamily: THEME_TYPOGRAPHY.fontFamily.sans,
    fontSize: 11,
    fontWeight: THEME_TYPOGRAPHY.fontWeight.medium,
  },
  thoughtContent: {
    color: THEME_COLORS.textMuted,
    fontFamily: THEME_TYPOGRAPHY.fontFamily.sans,
    fontSize: THEME_TYPOGRAPHY.fontSize.xs,
    fontStyle: "italic",
    lineHeight: 18,
    marginTop: THEME_SPACING.xs,
  },

  // ── Tool call card ────────────────────────────────────────────────────────
  // Matches web "fileChangesCard": #030712 bg, white hairline border
  toolCallCard: {
    backgroundColor: THEME_COLORS.codeBg,   // #020617 ≈ web #030712
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.12)",
    borderRadius: THEME_RADII.md,
    padding: THEME_SPACING.sm,
    gap: THEME_SPACING.xs,
  },
  toolCallHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  // Matches web: sky-blue pill badge for tool name
  toolNameBadge: {
    backgroundColor: THEME_COLORS.primaryAccentBg,
    borderColor: "rgba(56, 189, 248, 0.35)",
    borderWidth: 1,
    borderRadius: THEME_RADII.sm,
    paddingHorizontal: 7,
    paddingVertical: 2,
  },
  toolNameText: {
    color: THEME_COLORS.primaryAccent,
    fontFamily: THEME_TYPOGRAPHY.fontFamily.mono,
    fontSize: 11,
    fontWeight: THEME_TYPOGRAPHY.fontWeight.semibold,
  },
  toolCallStatus: {
    color: THEME_COLORS.textMuted,
    fontFamily: THEME_TYPOGRAPHY.fontFamily.sans,
    fontSize: 11,
  },

  // ── Tool result card ──────────────────────────────────────────────────────
  toolResultCard: {
    backgroundColor: THEME_COLORS.codeBg,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.12)",
    borderRadius: THEME_RADII.md,
    padding: THEME_SPACING.sm,
    gap: THEME_SPACING.xs,
  },
  toolResultFailed: {
    borderColor: "rgba(239, 68, 68, 0.4)",
    backgroundColor: THEME_COLORS.dangerBg,
  },
  toolResultHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  resultTitleGroup: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  resultStatusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusDotSuccess: {
    backgroundColor: THEME_COLORS.success,
    shadowColor: THEME_COLORS.success,
    shadowOpacity: 0.8,
    shadowRadius: 3,
  },
  statusDotError: {
    backgroundColor: THEME_COLORS.danger,
  },
  resultTitle: {
    color: THEME_COLORS.textPrimary,
    fontFamily: THEME_TYPOGRAPHY.fontFamily.sans,
    fontSize: THEME_TYPOGRAPHY.fontSize.xs,
    fontWeight: THEME_TYPOGRAPHY.fontWeight.semibold,
  },
  durationBadge: {
    color: THEME_COLORS.textMuted,
    fontFamily: THEME_TYPOGRAPHY.fontFamily.mono,
    fontSize: 10,
    backgroundColor: "rgba(255,255,255,0.07)",
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 3,
  },

  // ── Shared code / terminal block ──────────────────────────────────────────
  // Matches web "terminalBoxSplit" / "codeSnippetContainer"
  codeBlock: {
    backgroundColor: "rgba(0, 0, 0, 0.4)",
    borderRadius: THEME_RADII.sm,
    padding: THEME_SPACING.sm,
    maxHeight: 180,
  },
  codeBlockText: {
    color: THEME_COLORS.textSecondary,   // #cbd5e1 — matches web tokenOutput default
    fontFamily: THEME_TYPOGRAPHY.fontFamily.mono,
    fontSize: THEME_TYPOGRAPHY.fontSize.xs,
    lineHeight: 18,
  },

  // ── Error card ────────────────────────────────────────────────────────────
  errorCard: {
    backgroundColor: THEME_COLORS.dangerBg,
    borderColor: "rgba(239, 68, 68, 0.4)",
    borderWidth: 1,
    borderRadius: THEME_RADII.md,
    padding: THEME_SPACING.sm,
    gap: 4,
  },
  errorTitle: {
    color: THEME_COLORS.danger,
    fontFamily: THEME_TYPOGRAPHY.fontFamily.sans,
    fontSize: THEME_TYPOGRAPHY.fontSize.xs,
    fontWeight: THEME_TYPOGRAPHY.fontWeight.bold,
  },
  errorContent: {
    color: THEME_COLORS.textPrimary,
    fontFamily: THEME_TYPOGRAPHY.fontFamily.mono,
    fontSize: THEME_TYPOGRAPHY.fontSize.xs,
    lineHeight: 18,
  },

  // ── Streaming indicator bar ───────────────────────────────────────────────
  // Matches web "telemetryLiveDot" row at bottom of terminal widget
  streamingIndicatorRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: THEME_COLORS.cardSurface,
    paddingHorizontal: THEME_SPACING.md,
    paddingVertical: 5,
    borderTopWidth: 1,
    borderTopColor: THEME_COLORS.border,
  },
  pulsingDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: THEME_COLORS.primaryAccent,
    shadowColor: THEME_COLORS.primaryAccent,
    shadowOpacity: 0.9,
    shadowRadius: 4,
  },
  streamingText: {
    color: THEME_COLORS.primaryAccent,
    fontFamily: THEME_TYPOGRAPHY.fontFamily.mono,
    fontSize: 11,
    fontWeight: THEME_TYPOGRAPHY.fontWeight.semibold,
  },

  // ── Jump to live pill ─────────────────────────────────────────────────────
  scrollResumePill: {
    position: "absolute",
    bottom: 12,
    alignSelf: "center",
    backgroundColor: THEME_COLORS.cardSurfaceHover,
    borderColor: THEME_COLORS.primaryAccent,
    borderWidth: 1,
    paddingHorizontal: THEME_SPACING.md,
    paddingVertical: 6,
    borderRadius: THEME_RADII.full,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  scrollResumeText: {
    color: THEME_COLORS.primaryAccent,
    fontFamily: THEME_TYPOGRAPHY.fontFamily.sans,
    fontSize: THEME_TYPOGRAPHY.fontSize.xs,
    fontWeight: THEME_TYPOGRAPHY.fontWeight.semibold,
  },
});
