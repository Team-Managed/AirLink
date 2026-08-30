import React, { useMemo } from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from "react-native";
import { THEME_TYPOGRAPHY } from "../theme";
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

export const DiffCard: React.FC<DiffCardProps> = React.memo(({
  diffText,
  filePath = "workspace/change.diff",
  onOpenPR,
}) => {
  const parsed = useMemo(() => parseUnifiedDiff(diffText, filePath), [diffText, filePath]);

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

      <View style={styles.diffFooterRow}>
        <Text style={styles.diffBranchName}>feat/branch-changes</Text>
        {onOpenPR ? (
          <TouchableOpacity style={styles.openPRButton} onPress={onOpenPR} activeOpacity={0.8}>
            <Text style={styles.openPRButtonText}>Create Pull Request →</Text>
          </TouchableOpacity>
        ) : (
          <Text style={styles.diffReadyText}>✓ Ready to commit</Text>
        )}
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  cardContainer: {
    backgroundColor: "rgba(10, 16, 30, 0.70)",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.25)",
    overflow: "hidden",
    marginVertical: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "rgba(255, 255, 255, 0.12)",
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255, 255, 255, 0.20)",
  },
  filePathBadge: {
    flex: 1,
    marginRight: 8,
  },
  filePathText: {
    color: "#ffffff",
    fontFamily: THEME_TYPOGRAPHY.fontFamily.mono,
    fontSize: 11,
    fontWeight: "800",
  },
  counterGroup: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  addCounterBadge: {
    backgroundColor: "rgba(34, 197, 94, 0.25)",
    borderColor: "rgba(34, 197, 94, 0.5)",
    borderWidth: 1,
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  addCounterText: {
    color: "#4ade80",
    fontFamily: THEME_TYPOGRAPHY.fontFamily.mono,
    fontSize: 10.5,
    fontWeight: "800",
  },
  delCounterBadge: {
    backgroundColor: "rgba(239, 68, 68, 0.25)",
    borderColor: "rgba(239, 68, 68, 0.5)",
    borderWidth: 1,
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  delCounterText: {
    color: "#f87171",
    fontFamily: THEME_TYPOGRAPHY.fontFamily.mono,
    fontSize: 10.5,
    fontWeight: "800",
  },
  diffScrollView: {
    backgroundColor: "rgba(0, 0, 0, 0.45)",
    maxHeight: 280,
  },
  diffBody: {
    minWidth: "100%",
    paddingVertical: 6,
    paddingHorizontal: 6,
  },
  hunkBlock: {
    marginBottom: 6,
  },
  hunkHeaderRow: {
    backgroundColor: "rgba(255, 255, 255, 0.10)",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    marginBottom: 3,
  },
  hunkHeaderText: {
    color: "#ffffff",
    fontFamily: THEME_TYPOGRAPHY.fontFamily.mono,
    fontSize: 10,
    fontWeight: "700",
  },
  lineRow: {
    flexDirection: "row",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginVertical: 0.5,
  },
  lineRowAdd: {
    backgroundColor: "rgba(34, 197, 94, 0.18)",
  },
  lineRowDel: {
    backgroundColor: "rgba(239, 68, 68, 0.18)",
  },
  linePrefix: {
    width: 14,
    color: "rgba(255, 255, 255, 0.8)",
    fontFamily: THEME_TYPOGRAPHY.fontFamily.mono,
    fontSize: 10.5,
  },
  prefixAdd: {
    color: "#4ade80",
    fontWeight: "800",
  },
  prefixDel: {
    color: "#f87171",
    fontWeight: "800",
  },
  lineContent: {
    flex: 1,
    color: "#ffffff",
    fontFamily: THEME_TYPOGRAPHY.fontFamily.mono,
    fontSize: 10.5,
    lineHeight: 16,
  },
  contentAdd: {
    color: "#4ade80",
  },
  contentDel: {
    color: "#f87171",
  },
  diffFooterRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.10)",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: "rgba(255, 255, 255, 0.20)",
  },
  diffBranchName: {
    color: "rgba(255, 255, 255, 0.85)",
    fontFamily: THEME_TYPOGRAPHY.fontFamily.mono,
    fontSize: 10,
    fontWeight: "600",
  },
  diffReadyText: {
    color: "#ffffff",
    fontFamily: THEME_TYPOGRAPHY.fontFamily.sans,
    fontSize: 10.5,
    fontWeight: "700",
  },
  openPRButton: {
    backgroundColor: "#ffffff",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  openPRButtonText: {
    color: "#090d16",
    fontFamily: THEME_TYPOGRAPHY.fontFamily.sans,
    fontSize: 10.5,
    fontWeight: "800",
  },
});
