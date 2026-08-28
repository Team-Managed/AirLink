import React from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from "react-native";
import { THEME_COLORS, THEME_TYPOGRAPHY, THEME_SPACING, THEME_RADII } from "../theme";
import type { ParsedDiff, ParsedDiffLine, ParsedHunk } from "../types";

export interface DiffCardProps {
  diffText: string;
  filePath?: string;
  onOpenPR?: () => void;
}

export function parseUnifiedDiff(
  rawDiff: string,
  fallbackPath: string = "workspace/change.diff",
): ParsedDiff {
  const lines = rawDiff.split("\n");
  let filePath = fallbackPath;
  let oldFile = fallbackPath;
  let newFile = fallbackPath;
  let additions = 0;
  let deletions = 0;
  const hunks: ParsedHunk[] = [];
  let currentHunk: ParsedHunk | null = null;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i] ?? "";

    if (line.startsWith("diff --git")) {
      const parts = line.split(" ");
      if (parts.length >= 4) {
        oldFile = parts[2]?.replace(/^a\//, "") ?? oldFile;
        newFile = parts[3]?.replace(/^b\//, "") ?? newFile;
        filePath = newFile;
      }
      continue;
    }

    if (line.startsWith("--- ")) {
      oldFile = line.substring(4).replace(/^a\//, "");
      continue;
    }

    if (line.startsWith("+++ ")) {
      newFile = line.substring(4).replace(/^b\//, "");
      filePath = newFile;
      continue;
    }

    if (line.startsWith("@@")) {
      if (currentHunk) {
        hunks.push(currentHunk);
      }
      currentHunk = {
        header: line,
        lines: [],
      };
      continue;
    }

    if (currentHunk) {
      if (line.startsWith("+")) {
        additions++;
        currentHunk.lines.push({
          type: "add",
          content: line.substring(1),
        });
      } else if (line.startsWith("-")) {
        deletions++;
        currentHunk.lines.push({
          type: "delete",
          content: line.substring(1),
        });
      } else if (line.startsWith(" ")) {
        currentHunk.lines.push({
          type: "context",
          content: line.substring(1),
        });
      } else if (line.trim().length > 0) {
        currentHunk.lines.push({
          type: "context",
          content: line,
        });
      }
    }
  }

  if (currentHunk) {
    hunks.push(currentHunk);
  }

  if (hunks.length === 0 && lines.length > 0) {
    const fallbackLines: ParsedDiffLine[] = lines.map((l) => {
      if (l.startsWith("+")) {
        additions++;
        return { type: "add", content: l.substring(1) };
      }
      if (l.startsWith("-")) {
        deletions++;
        return { type: "delete", content: l.substring(1) };
      }
      return { type: "context", content: l };
    });
    hunks.push({
      header: "@@ -1,1 +1,1 @@",
      lines: fallbackLines,
    });
  }

  return {
    filePath,
    oldFile,
    newFile,
    additions,
    deletions,
    hunks,
  };
}

export const DiffCard: React.FC<DiffCardProps> = ({ diffText, filePath, onOpenPR }) => {
  const parsed = parseUnifiedDiff(diffText, filePath);

  return (
    <View style={styles.cardContainer}>
      <View style={styles.headerRow}>
        <View style={styles.filePathBadge}>
          <Text style={styles.filePathText} numberOfLines={1} ellipsizeMode="middle">
            {parsed.filePath}
          </Text>
        </View>
        <View style={styles.counterGroup}>
          {parsed.additions > 0 && (
            <View style={styles.addCounterBadge}>
              <Text style={styles.addCounterText}>+{parsed.additions}</Text>
            </View>
          )}
          {parsed.deletions > 0 && (
            <View style={styles.delCounterBadge}>
              <Text style={styles.delCounterText}>-{parsed.deletions}</Text>
            </View>
          )}
        </View>
      </View>

      <ScrollView
        horizontal
        nestedScrollEnabled
        showsHorizontalScrollIndicator={true}
        style={styles.diffScrollView}
      >
        <View style={styles.diffBody}>
          {parsed.hunks.map((hunk, hunkIdx) => (
            <View key={`hunk-${hunkIdx}`} style={styles.hunkBlock}>
              <View style={styles.hunkHeaderRow}>
                <Text style={styles.hunkHeaderText}>{hunk.header}</Text>
              </View>

              {hunk.lines.map((line, lineIdx) => {
                const isAdd = line.type === "add";
                const isDel = line.type === "delete";
                return (
                  <View
                    key={`line-${hunkIdx}-${lineIdx}`}
                    style={[styles.lineRow, isAdd && styles.lineRowAdd, isDel && styles.lineRowDel]}
                  >
                    <Text
                      style={[
                        styles.linePrefix,
                        isAdd && styles.prefixAdd,
                        isDel && styles.prefixDel,
                      ]}
                    >
                      {isAdd ? "+" : isDel ? "-" : " "}
                    </Text>
                    <Text
                      style={[
                        styles.lineContent,
                        isAdd && styles.contentAdd,
                        isDel && styles.contentDel,
                      ]}
                    >
                      {line.content}
                    </Text>
                  </View>
                );
              })}
            </View>
          ))}
        </View>
      </ScrollView>

      {onOpenPR && (
        <View style={styles.footerRow}>
          <TouchableOpacity style={styles.openPRButton} onPress={onOpenPR} activeOpacity={0.8}>
            <Text style={styles.openPRButtonText}>Create GitHub Pull Request</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  cardContainer: {
    backgroundColor: THEME_COLORS.cardSurface,
    borderRadius: THEME_RADII.md,
    borderWidth: 1,
    borderColor: THEME_COLORS.border,
    overflow: "hidden",
    marginVertical: THEME_SPACING.sm,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: THEME_COLORS.cardSurfaceHover,
    paddingHorizontal: THEME_SPACING.md,
    paddingVertical: THEME_SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: THEME_COLORS.border,
  },
  filePathBadge: {
    flex: 1,
    marginRight: THEME_SPACING.sm,
  },
  filePathText: {
    color: THEME_COLORS.textPrimary,
    fontFamily: THEME_TYPOGRAPHY.fontFamily.mono,
    fontSize: THEME_TYPOGRAPHY.fontSize.xs,
    fontWeight: THEME_TYPOGRAPHY.fontWeight.semibold,
  },
  counterGroup: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  addCounterBadge: {
    backgroundColor: THEME_COLORS.successBg,
    borderRadius: THEME_RADII.sm,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  addCounterText: {
    color: THEME_COLORS.success,
    fontFamily: THEME_TYPOGRAPHY.fontFamily.mono,
    fontSize: THEME_TYPOGRAPHY.fontSize.xs,
    fontWeight: THEME_TYPOGRAPHY.fontWeight.bold,
  },
  delCounterBadge: {
    backgroundColor: THEME_COLORS.dangerBg,
    borderRadius: THEME_RADII.sm,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  delCounterText: {
    color: THEME_COLORS.danger,
    fontFamily: THEME_TYPOGRAPHY.fontFamily.mono,
    fontSize: THEME_TYPOGRAPHY.fontSize.xs,
    fontWeight: THEME_TYPOGRAPHY.fontWeight.bold,
  },
  diffScrollView: {
    backgroundColor: THEME_COLORS.codeBg,
    maxHeight: 280,
  },
  diffBody: {
    minWidth: "100%",
    paddingVertical: THEME_SPACING.xs,
  },
  hunkBlock: {
    marginBottom: THEME_SPACING.xs,
  },
  hunkHeaderRow: {
    backgroundColor: THEME_COLORS.cardSurface,
    paddingHorizontal: THEME_SPACING.md,
    paddingVertical: 3,
    borderBottomWidth: 1,
    borderBottomColor: THEME_COLORS.border,
  },
  hunkHeaderText: {
    color: THEME_COLORS.primaryAccent,
    fontFamily: THEME_TYPOGRAPHY.fontFamily.mono,
    fontSize: 11,
  },
  lineRow: {
    flexDirection: "row",
    paddingHorizontal: THEME_SPACING.sm,
    paddingVertical: 2,
  },
  lineRowAdd: {
    backgroundColor: THEME_COLORS.successBg,
  },
  lineRowDel: {
    backgroundColor: THEME_COLORS.dangerBg,
  },
  linePrefix: {
    width: 16,
    color: THEME_COLORS.textMuted,
    fontFamily: THEME_TYPOGRAPHY.fontFamily.mono,
    fontSize: THEME_TYPOGRAPHY.fontSize.xs,
    userSelect: "none",
  },
  prefixAdd: {
    color: THEME_COLORS.success,
    fontWeight: THEME_TYPOGRAPHY.fontWeight.bold,
  },
  prefixDel: {
    color: THEME_COLORS.danger,
    fontWeight: THEME_TYPOGRAPHY.fontWeight.bold,
  },
  lineContent: {
    flex: 1,
    color: THEME_COLORS.textMuted,
    fontFamily: THEME_TYPOGRAPHY.fontFamily.mono,
    fontSize: THEME_TYPOGRAPHY.fontSize.xs,
    lineHeight: 18,
  },
  contentAdd: {
    color: THEME_COLORS.success,
  },
  contentDel: {
    color: THEME_COLORS.danger,
  },
  footerRow: {
    padding: THEME_SPACING.sm,
    backgroundColor: THEME_COLORS.cardSurface,
    borderTopWidth: 1,
    borderTopColor: THEME_COLORS.border,
    alignItems: "flex-end",
  },
  openPRButton: {
    backgroundColor: THEME_COLORS.primaryAccentBg,
    borderColor: THEME_COLORS.primaryAccent,
    borderWidth: 1,
    paddingHorizontal: THEME_SPACING.md,
    paddingVertical: THEME_SPACING.xs,
    borderRadius: THEME_RADII.sm,
  },
  openPRButtonText: {
    color: THEME_COLORS.primaryAccent,
    fontFamily: THEME_TYPOGRAPHY.fontFamily.sans,
    fontSize: THEME_TYPOGRAPHY.fontSize.xs,
    fontWeight: THEME_TYPOGRAPHY.fontWeight.semibold,
  },
});
