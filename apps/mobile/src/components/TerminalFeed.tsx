import React, { useRef, useState, useEffect, useCallback } from "react";
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
import { THEME_TYPOGRAPHY, THEME_SPACING } from "../theme";
import { DiffCard } from "./DiffCard";
import { MarkdownText } from "./MarkdownText";
import { LoadingState } from "./LoadingState";
import type { StreamFeedItem } from "../types";

/** Returns true if the string looks like a unified git diff */
function isDiffContent(content: string): boolean {
  return (
    content.includes("diff --git") ||
    (content.includes("---") && content.includes("+++") && content.includes("@@"))
  );
}

export interface TerminalFeedProps {
  items: StreamFeedItem[];
  isStreaming?: boolean;
}

interface FeedRowItemProps {
  item: StreamFeedItem;
  isCollapsed: boolean;
  isLastItem: boolean;
  isStreaming: boolean;
  cursorAnim: Animated.Value;
  onToggleCollapse: (id: string) => void;
}

/**
 * Pure memoized row component for FlatList — avoids re-rendering the whole stream on new tokens.
 */
const FeedRowItem: React.FC<FeedRowItemProps> = React.memo(
  ({ item, isCollapsed, isLastItem, isStreaming, cursorAnim, onToggleCollapse }) => {
    switch (item.type) {
      // ── Thinking / CoT block ────────────────────────────────────────────────
      case "thought":
        return (
          <View style={styles.thoughtCard}>
            <TouchableOpacity
              style={styles.thoughtHeader}
              onPress={() => onToggleCollapse(item.id)}
              activeOpacity={0.7}
            >
              <View style={styles.traceWorkedRow}>
                <Text style={styles.traceWorkedText}>Thinking...</Text>
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
          <View style={styles.toolCallCard}>
            <View style={styles.toolCallHeaderRow}>
              <View style={styles.toolNameBadge}>
                <Text style={styles.toolNameText}>{toolName}</Text>
              </View>
              <Text style={styles.toolCallStatus}>Executing...</Text>
            </View>
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

        if (isSuccess && isDiffContent(item.content)) {
          return (
            <View style={styles.diffCardWrapper}>
              {duration !== undefined && (
                <Text style={styles.workedForText}>Worked for {Math.round(duration / 1000)}s ›</Text>
              )}
              <DiffCard diffText={item.content} />
            </View>
          );
        }

        return (
          <View style={[styles.toolResultCard, !isSuccess && styles.toolResultFailed]}>
            <TouchableOpacity
              style={styles.toolResultHeaderRow}
              onPress={() => onToggleCollapse(item.id)}
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
          return (
            <View style={styles.userMessageCard}>
              <Text style={styles.userMessageText}>{item.content}</Text>
            </View>
          );
        }

        return (
          <View style={styles.agentTokenContainer}>
            <MarkdownText content={item.content} />
            {isStreaming && isLastItem && (
              <Animated.View style={[styles.blinkingCursor, { opacity: cursorAnim }]} />
            )}
          </View>
        );
    }
  },
  (prev, next) => {
    return (
      prev.item.id === next.item.id &&
      prev.item.content === next.item.content &&
      prev.item.type === next.item.type &&
      prev.isCollapsed === next.isCollapsed &&
      prev.isLastItem === next.isLastItem &&
      prev.isStreaming === next.isStreaming
    );
  },
);

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

  const handleContentSizeChange = useCallback(() => {
    if (!isAutoScrollLocked && items.length > 0) {
      flatListRef.current?.scrollToEnd({ animated: true });
    }
  }, [isAutoScrollLocked, items.length]);

  const handleScroll = useCallback((event: NativeSyntheticEvent<NativeScrollEvent>) => {
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
  }, [isAutoScrollLocked]);

  const scrollToBottom = useCallback(() => {
    setIsAutoScrollLocked(false);
    setUnreadCount(0);
    flatListRef.current?.scrollToEnd({ animated: true });
  }, []);

  const toggleCollapse = useCallback((id: string) => {
    setCollapsedItems((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  }, []);

  const keyExtractor = useCallback((item: StreamFeedItem) => item.id, []);

  const renderItem = useCallback(
    ({ item, index }: { item: StreamFeedItem; index: number }) => {
      const isCollapsed = collapsedItems[item.id] ?? false;
      const isLastItem = index === items.length - 1;

      return (
        <FeedRowItem
          item={item}
          isCollapsed={isCollapsed}
          isLastItem={isLastItem}
          isStreaming={isStreaming}
          cursorAnim={cursorAnim}
          onToggleCollapse={toggleCollapse}
        />
      );
    },
    [collapsedItems, items.length, isStreaming, cursorAnim, toggleCollapse],
  );

  if (items.length === 0 && !isStreaming) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyTitle}>AirLink Remote Active</Text>
        <Text style={styles.emptySubtitle}>
          Paired with your local workstation harness. Select a quick action below or type a prompt to start coding.
        </Text>

        <View style={styles.emptyCard}>
          <Text style={styles.emptyCardHeader}>⚡ WORKSTATION CAPABILITIES</Text>
          <Text style={styles.emptyCardLine}>• 1-Tap Git diff & branch review</Text>
          <Text style={styles.emptyCardLine}>• 180s Human-in-the-loop safety approvals</Text>
          <Text style={styles.emptyCardLine}>• Live streaming execution telemetry</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        ref={flatListRef}
        data={items}
        keyExtractor={keyExtractor}
        renderItem={renderItem}
        onScroll={handleScroll}
        onContentSizeChange={handleContentSizeChange}
        scrollEventThrottle={100}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={true}
        initialNumToRender={10}
        maxToRenderPerBatch={5}
        updateCellsBatchingPeriod={50}
        windowSize={5}
        removeClippedSubviews={true}
      />

      {/* Streaming indicator — pixel-grid wavefront loader with glassmorphism */}
      {isStreaming && (
        <View style={styles.streamingContainer}>
          <LoadingState label="Agent working..." isStreaming={isStreaming} variant="Drive" />
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
    backgroundColor: "transparent",
  },
  listContent: {
    padding: THEME_SPACING.md,
    gap: THEME_SPACING.sm,
    paddingBottom: THEME_SPACING.xxxl,
  },

  // ── Diff card wrapper (auto-rendered for git diff tool results) ───────────
  diffCardWrapper: {
    gap: 4,
  },
  workedForText: {
    color: "#ffffff",
    fontFamily: THEME_TYPOGRAPHY.fontFamily.mono,
    fontSize: 11,
    paddingHorizontal: 2,
    fontWeight: "700",
  },

  // ── User message card ─────────────────────────────────────────────────────
  userMessageCard: {
    backgroundColor: "rgba(255, 255, 255, 0.14)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.28)",
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  userMessageText: {
    color: "#ffffff",
    fontFamily: THEME_TYPOGRAPHY.fontFamily.sans,
    fontSize: 14,
    lineHeight: 21,
    fontWeight: "700",
  },

  // ── Agent token stream ────────────────────────────────────────────────────
  agentTokenContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "flex-start",
    paddingHorizontal: 2,
  },
  agentTokenText: {
    color: "#ffffff",
    fontFamily: THEME_TYPOGRAPHY.fontFamily.sans,
    fontSize: 13.5,
    lineHeight: 22,
  },
  blinkingCursor: {
    width: 7,
    height: 14,
    backgroundColor: "#ffffff",
    marginLeft: 2,
    marginTop: 3,
    borderRadius: 1,
  },

  // ── Thinking / CoT card (Glassmorphic) ───────────────────────────────────
  thoughtCard: {
    backgroundColor: "rgba(255, 255, 255, 0.12)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.25)",
    borderRadius: 16,
    padding: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  thoughtHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  traceWorkedRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  traceWorkedText: {
    color: "#ffffff",
    fontFamily: THEME_TYPOGRAPHY.fontFamily.mono,
    fontSize: 11.5,
    fontWeight: "800",
  },
  chevron: {
    color: "#ffffff",
    fontSize: 15,
    fontWeight: "800",
    transform: [{ rotate: "90deg" }],
  },
  chevronRight: {
    transform: [{ rotate: "0deg" }],
  },
  collapseToggleText: {
    color: "rgba(255, 255, 255, 0.85)",
    fontFamily: THEME_TYPOGRAPHY.fontFamily.sans,
    fontSize: 11,
    fontWeight: "700",
  },
  thoughtContent: {
    color: "rgba(255, 255, 255, 0.95)",
    fontFamily: THEME_TYPOGRAPHY.fontFamily.sans,
    fontSize: 12,
    fontStyle: "italic",
    lineHeight: 18,
    marginTop: 8,
  },

  // ── Tool call card (Glassmorphic) ────────────────────────────────────────
  toolCallCard: {
    backgroundColor: "rgba(255, 255, 255, 0.12)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.25)",
    borderRadius: 16,
    padding: 12,
    gap: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  toolCallHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  toolNameBadge: {
    backgroundColor: "rgba(255, 255, 255, 0.18)",
    borderColor: "rgba(255, 255, 255, 0.35)",
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  toolNameText: {
    color: "#ffffff",
    fontFamily: THEME_TYPOGRAPHY.fontFamily.mono,
    fontSize: 11,
    fontWeight: "800",
  },
  toolCallStatus: {
    color: "rgba(255, 255, 255, 0.85)",
    fontFamily: THEME_TYPOGRAPHY.fontFamily.sans,
    fontSize: 11,
    fontWeight: "600",
  },

  // ── Tool result card (Glassmorphic) ──────────────────────────────────────
  toolResultCard: {
    backgroundColor: "rgba(255, 255, 255, 0.12)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.25)",
    borderRadius: 16,
    padding: 12,
    gap: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  toolResultFailed: {
    borderColor: "rgba(239, 68, 68, 0.6)",
    backgroundColor: "rgba(239, 68, 68, 0.25)",
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
    width: 6.5,
    height: 6.5,
    borderRadius: 3.25,
  },
  statusDotSuccess: {
    backgroundColor: "#22c55e",
    shadowColor: "#22c55e",
    shadowOpacity: 0.8,
    shadowRadius: 4,
  },
  statusDotError: {
    backgroundColor: "#ef4444",
  },
  resultTitle: {
    color: "#ffffff",
    fontFamily: THEME_TYPOGRAPHY.fontFamily.sans,
    fontSize: 12,
    fontWeight: "800",
  },
  durationBadge: {
    color: "#ffffff",
    fontFamily: THEME_TYPOGRAPHY.fontFamily.mono,
    fontSize: 10,
    backgroundColor: "rgba(255, 255, 255, 0.18)",
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: 4,
  },

  // ── Shared code / terminal block ──────────────────────────────────────────
  codeBlock: {
    backgroundColor: "rgba(0, 0, 0, 0.40)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.20)",
    borderRadius: 12,
    padding: 10,
    maxHeight: 180,
  },
  codeBlockText: {
    color: "#ffffff",
    fontFamily: THEME_TYPOGRAPHY.fontFamily.mono,
    fontSize: 11.5,
    lineHeight: 18,
  },

  // ── Error card ────────────────────────────────────────────────────────────
  errorCard: {
    backgroundColor: "rgba(239, 68, 68, 0.25)",
    borderColor: "rgba(239, 68, 68, 0.5)",
    borderWidth: 1,
    borderRadius: 16,
    padding: 12,
    gap: 6,
  },
  errorTitle: {
    color: "#ffffff",
    fontFamily: THEME_TYPOGRAPHY.fontFamily.sans,
    fontSize: 12,
    fontWeight: "800",
  },
  errorContent: {
    color: "#ffffff",
    fontFamily: THEME_TYPOGRAPHY.fontFamily.mono,
    fontSize: 11.5,
    lineHeight: 18,
  },

  // ── Streaming indicator container (Glassmorphic) ─────────────────────────
  streamingContainer: {
    paddingVertical: 6,
    alignItems: "flex-start",
  },

  // ── Jump to live pill ─────────────────────────────────────────────────────
  scrollResumePill: {
    position: "absolute",
    bottom: 12,
    alignSelf: "center",
    backgroundColor: "rgba(255, 255, 255, 0.22)",
    borderColor: "#ffffff",
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4,
  },
  scrollResumeText: {
    color: "#ffffff",
    fontFamily: THEME_TYPOGRAPHY.fontFamily.sans,
    fontSize: 11.5,
    fontWeight: "800",
  },

  // ── Empty State Welcome Card ─────────────────────────────────────────────
  emptyContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 20,
    gap: 14,
  },
  emptyTitle: {
    color: "#ffffff",
    fontSize: 19,
    fontWeight: "800",
    textAlign: "center",
    letterSpacing: -0.3,
  },
  emptySubtitle: {
    color: "rgba(255, 255, 255, 0.85)",
    fontSize: 13,
    lineHeight: 19,
    textAlign: "center",
    maxWidth: 290,
  },
  emptyCard: {
    width: "100%",
    maxWidth: 330,
    backgroundColor: "rgba(255, 255, 255, 0.12)",
    borderColor: "rgba(255, 255, 255, 0.25)",
    borderWidth: 1,
    borderRadius: 16,
    padding: 16,
    gap: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
  },
  emptyCardHeader: {
    color: "#ffffff",
    fontFamily: THEME_TYPOGRAPHY.fontFamily.mono,
    fontSize: 10.5,
    fontWeight: "800",
    letterSpacing: 0.8,
    marginBottom: 2,
  },
  emptyCardLine: {
    color: "#ffffff",
    fontFamily: THEME_TYPOGRAPHY.fontFamily.sans,
    fontSize: 12,
    lineHeight: 18,
  },
});
