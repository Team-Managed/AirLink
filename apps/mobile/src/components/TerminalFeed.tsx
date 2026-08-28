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
      case "thought":
        return (
          <View style={styles.thoughtCard}>
            <TouchableOpacity
              style={styles.thoughtHeader}
              onPress={() => toggleCollapse(item.id)}
              activeOpacity={0.7}
            >
              <View style={styles.thoughtTitleRow}>
                <Text style={styles.thoughtTitle}>Thinking Process</Text>
              </View>
              <Text style={styles.collapseToggleText}>{isCollapsed ? "Expand" : "Collapse"}</Text>
            </TouchableOpacity>
            {!isCollapsed && <Text style={styles.thoughtContent}>{item.content}</Text>}
          </View>
        );

      case "tool_call": {
        const toolName = item.metadata?.name || "tool";
        return (
          <View style={styles.toolCallCard}>
            <View style={styles.toolCallHeader}>
              <View style={styles.toolNameBadge}>
                <Text style={styles.toolNameText}>{toolName}</Text>
              </View>
              <Text style={styles.toolCallStatus}>Executing...</Text>
            </View>
            <View style={styles.codeSnippetContainer}>
              <Text style={styles.codeSnippetText}>{item.content}</Text>
            </View>
          </View>
        );
      }

      case "tool_result": {
        const duration = item.metadata?.durationMs;
        const exitCode = item.metadata?.exitCode ?? 0;
        const isSuccess = exitCode === 0;

        return (
          <View style={[styles.toolResultCard, !isSuccess && styles.toolResultFailed]}>
            <TouchableOpacity
              style={styles.toolResultHeader}
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
                {duration !== undefined && <Text style={styles.durationBadge}>{duration}ms</Text>}
              </View>
              <Text style={styles.collapseToggleText}>{isCollapsed ? "Expand" : "Collapse"}</Text>
            </TouchableOpacity>
            {!isCollapsed && (
              <View style={styles.resultContentBox}>
                <Text style={styles.resultContentText}>{item.content}</Text>
              </View>
            )}
          </View>
        );
      }

      case "error":
        return (
          <View style={styles.errorCard}>
            <View style={styles.errorHeader}>
              <Text style={styles.errorTitle}>Agent Error</Text>
            </View>
            <Text style={styles.errorContent}>{item.content}</Text>
          </View>
        );

      case "token":
      default:
        return (
          <View style={[styles.tokenContainer, item.role === "user" && styles.userPromptContainer]}>
            <Text style={[styles.tokenContent, item.role === "user" && styles.userPromptText]}>
              {item.content}
            </Text>
            {isStreaming && isLastItem && item.role !== "user" && (
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

      {isStreaming && (
        <View style={styles.streamingIndicatorRow}>
          <View style={styles.pulsingDot} />
          <Text style={styles.streamingText}>Agent generating response...</Text>
        </View>
      )}

      {isAutoScrollLocked && (
        <TouchableOpacity
          style={styles.scrollResumePill}
          onPress={scrollToBottom}
          activeOpacity={0.8}
        >
          <Text style={styles.scrollResumeText}>
            Jump to Live {unreadCount > 0 ? `(${unreadCount} new)` : ""}
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
    paddingBottom: THEME_SPACING.xxxl,
  },
  tokenContainer: {
    marginVertical: 3,
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
  },
  userPromptContainer: {
    backgroundColor: THEME_COLORS.cardSurfaceHover,
    borderRadius: THEME_RADII.sm,
    paddingHorizontal: THEME_SPACING.sm,
    paddingVertical: 6,
    marginVertical: 6,
    borderLeftWidth: 2,
    borderLeftColor: THEME_COLORS.primaryAccent,
  },
  userPromptText: {
    color: THEME_COLORS.primaryAccent,
    fontWeight: THEME_TYPOGRAPHY.fontWeight.semibold,
  },
  tokenContent: {
    color: THEME_COLORS.textPrimary,
    fontFamily: THEME_TYPOGRAPHY.fontFamily.mono,
    fontSize: THEME_TYPOGRAPHY.fontSize.sm,
    lineHeight: 20,
  },
  blinkingCursor: {
    width: 8,
    height: 14,
    backgroundColor: THEME_COLORS.primaryAccent,
    marginLeft: 3,
    borderRadius: 1,
  },
  thoughtCard: {
    backgroundColor: THEME_COLORS.cardSurface,
    borderRadius: THEME_RADII.md,
    borderWidth: 1,
    borderColor: THEME_COLORS.border,
    padding: THEME_SPACING.sm,
    marginVertical: THEME_SPACING.xs,
  },
  thoughtHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  thoughtTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  thoughtIcon: {
    fontSize: 12,
  },
  thoughtTitle: {
    color: THEME_COLORS.textMuted,
    fontFamily: THEME_TYPOGRAPHY.fontFamily.sans,
    fontSize: THEME_TYPOGRAPHY.fontSize.xs,
    fontStyle: "italic",
    fontWeight: THEME_TYPOGRAPHY.fontWeight.medium,
  },
  collapseToggleText: {
    color: THEME_COLORS.primaryAccent,
    fontFamily: THEME_TYPOGRAPHY.fontFamily.sans,
    fontSize: 11,
  },
  thoughtContent: {
    color: THEME_COLORS.textMuted,
    fontFamily: THEME_TYPOGRAPHY.fontFamily.sans,
    fontSize: THEME_TYPOGRAPHY.fontSize.xs,
    fontStyle: "italic",
    lineHeight: 18,
    marginTop: THEME_SPACING.xs,
  },
  toolCallCard: {
    backgroundColor: THEME_COLORS.cardSurface,
    borderRadius: THEME_RADII.md,
    borderWidth: 1,
    borderColor: THEME_COLORS.border,
    padding: THEME_SPACING.sm,
    marginVertical: THEME_SPACING.xs,
  },
  toolCallHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: THEME_SPACING.xs,
  },
  toolNameBadge: {
    backgroundColor: THEME_COLORS.primaryAccentBg,
    borderColor: THEME_COLORS.primaryAccent,
    borderWidth: 1,
    borderRadius: THEME_RADII.sm,
    paddingHorizontal: 6,
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
  codeSnippetContainer: {
    backgroundColor: THEME_COLORS.codeBg,
    borderRadius: THEME_RADII.sm,
    padding: THEME_SPACING.xs,
  },
  codeSnippetText: {
    color: THEME_COLORS.textSecondary,
    fontFamily: THEME_TYPOGRAPHY.fontFamily.mono,
    fontSize: THEME_TYPOGRAPHY.fontSize.xs,
    lineHeight: 18,
  },
  toolResultCard: {
    backgroundColor: THEME_COLORS.cardSurface,
    borderRadius: THEME_RADII.md,
    borderWidth: 1,
    borderColor: THEME_COLORS.border,
    padding: THEME_SPACING.sm,
    marginVertical: THEME_SPACING.xs,
  },
  toolResultFailed: {
    borderColor: THEME_COLORS.danger,
    backgroundColor: THEME_COLORS.dangerBg,
  },
  toolResultHeader: {
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
    backgroundColor: THEME_COLORS.cardSurfaceHover,
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 3,
  },
  resultContentBox: {
    backgroundColor: THEME_COLORS.codeBg,
    borderRadius: THEME_RADII.sm,
    padding: THEME_SPACING.xs,
    marginTop: THEME_SPACING.xs,
    maxHeight: 180,
  },
  resultContentText: {
    color: THEME_COLORS.textSecondary,
    fontFamily: THEME_TYPOGRAPHY.fontFamily.mono,
    fontSize: THEME_TYPOGRAPHY.fontSize.xs,
    lineHeight: 18,
  },
  errorCard: {
    backgroundColor: THEME_COLORS.dangerBg,
    borderColor: THEME_COLORS.danger,
    borderWidth: 1,
    borderRadius: THEME_RADII.md,
    padding: THEME_SPACING.sm,
    marginVertical: THEME_SPACING.xs,
  },
  errorHeader: {
    marginBottom: 4,
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
  streamingIndicatorRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: THEME_COLORS.cardSurfaceHover,
    paddingHorizontal: THEME_SPACING.md,
    paddingVertical: 4,
    borderTopWidth: 1,
    borderTopColor: THEME_COLORS.border,
  },
  pulsingDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: THEME_COLORS.primaryAccent,
    marginRight: THEME_SPACING.sm,
  },
  streamingText: {
    color: THEME_COLORS.textMuted,
    fontFamily: THEME_TYPOGRAPHY.fontFamily.sans,
    fontSize: 11,
  },
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
