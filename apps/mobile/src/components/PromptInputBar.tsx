import React, { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, ScrollView, StyleSheet } from "react-native";
import { THEME_COLORS, THEME_TYPOGRAPHY, THEME_SPACING, THEME_RADII } from "../theme";
import { hapticsService } from "../services/haptics";
import type { QuickActionItem } from "../types";

export interface PromptInputBarProps {
  onSubmit: (prompt: string) => void;
  disabled?: boolean;
  placeholder?: string;
}

export const QUICK_ACTIONS: QuickActionItem[] = [
  {
    id: "create-pr",
    label: "Create PR",
    icon: "PR",
    promptText:
      "Summarize the changes in this session, push the branch, and create a GitHub Pull Request.",
  },
  {
    id: "import-issue",
    label: "Import Issue",
    icon: "Issue",
    promptText: "Import context for issue #",
  },
  {
    id: "run-tests",
    label: "Run Tests",
    icon: "Test",
    promptText: "Run test suite and fix any failing tests.",
  },
  {
    id: "git-status",
    label: "Git Status",
    icon: "Git",
    promptText: "Check git status and explain modified files.",
  },
  {
    id: "fix-lint",
    label: "Fix Lint",
    icon: "Lint",
    promptText: "Run linter and fix code formatting and typecheck issues.",
  },
  {
    id: "rollback",
    label: "Rollback",
    icon: "Undo",
    promptText: "Rollback recent changes and restore working tree.",
  },
];

export const PromptInputBar: React.FC<PromptInputBarProps> = ({
  onSubmit,
  disabled = false,
  placeholder = "Ask agent to build, refactor, or fix...",
}) => {
  const [text, setText] = useState<string>("");

  const handlePillPress = (action: QuickActionItem) => {
    hapticsService.triggerSelection();
    setText(action.promptText);
  };

  const handleSubmit = () => {
    const trimmed = text.trim();
    if (!trimmed || disabled) return;
    hapticsService.triggerImpact("medium");
    onSubmit(trimmed);
    setText("");
  };

  const hasText = text.trim().length > 0;

  return (
    <View style={styles.container}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.pillsContainer}
      >
        {QUICK_ACTIONS.map((action) => (
          <TouchableOpacity
            key={action.id}
            style={styles.pillButton}
            onPress={() => handlePillPress(action)}
            activeOpacity={0.7}
          >
            <Text style={styles.pillText}>{action.label}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <View style={styles.inputRow}>
        <TextInput
          style={styles.textInput}
          value={text}
          onChangeText={setText}
          placeholder={placeholder}
          placeholderTextColor={THEME_COLORS.textDim}
          multiline={true}
          maxLength={4000}
          editable={!disabled}
        />

        <TouchableOpacity
          style={[
            styles.submitButton,
            hasText && !disabled ? styles.submitButtonActive : styles.submitButtonDisabled,
          ]}
          onPress={handleSubmit}
          disabled={!hasText || disabled}
          activeOpacity={0.8}
        >
          <Text
            style={[
              styles.submitButtonText,
              hasText && !disabled ? styles.submitTextActive : styles.submitTextDisabled,
            ]}
          >
            Send
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  // Frosted-glass container — matches web "screenBottomBlock" input area dark bg
  container: {
    backgroundColor: "rgba(255, 255, 255, 0.04)",
    borderTopWidth: 1,
    borderTopColor: "rgba(255, 255, 255, 0.08)",
    paddingTop: THEME_SPACING.xs,
    paddingBottom: THEME_SPACING.sm,
    paddingHorizontal: THEME_SPACING.md,
  },
  // Horizontal scrollable quick-action pills — same as web "Quick Actions" row
  pillsContainer: {
    flexDirection: "row",
    gap: THEME_SPACING.xs,
    paddingBottom: THEME_SPACING.xs,
  },
  // Matches web "reviewBtnMini" pill: frosted bg, hairline white border, rounded
  pillButton: {
    backgroundColor: "rgba(255, 255, 255, 0.07)",
    borderColor: "rgba(255, 255, 255, 0.12)",
    borderWidth: 1,
    paddingHorizontal: THEME_SPACING.sm,
    paddingVertical: 4,
    borderRadius: THEME_RADII.full,
  },
  pillText: {
    color: THEME_COLORS.textSecondary,
    fontFamily: THEME_TYPOGRAPHY.fontFamily.sans,
    fontSize: 11,
    fontWeight: THEME_TYPOGRAPHY.fontWeight.medium,
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: THEME_SPACING.sm,
    marginTop: 4,
  },
  // Rounded pill text input — matches web frosted input card
  textInput: {
    flex: 1,
    backgroundColor: "rgba(255, 255, 255, 0.06)",
    borderColor: "rgba(255, 255, 255, 0.1)",
    borderWidth: 1,
    borderRadius: THEME_RADII.xl,
    color: THEME_COLORS.textPrimary,
    fontFamily: THEME_TYPOGRAPHY.fontFamily.sans,
    fontSize: THEME_TYPOGRAPHY.fontSize.sm,
    lineHeight: 20,
    paddingHorizontal: THEME_SPACING.md,
    paddingVertical: THEME_SPACING.sm,
    minHeight: 40,
    maxHeight: 120,
  },
  // Send button — same height as input, square-ish circle
  submitButton: {
    width: 40,
    height: 40,
    borderRadius: THEME_RADII.full,
    alignItems: "center",
    justifyContent: "center",
  },
  // Active: solid sky-blue glow — matches web primary CTA button
  submitButtonActive: {
    backgroundColor: THEME_COLORS.primaryAccent,
    shadowColor: THEME_COLORS.primaryAccent,
    shadowOpacity: 0.5,
    shadowRadius: 8,
    elevation: 4,
  },
  // Disabled: translucent dark
  submitButtonDisabled: {
    backgroundColor: "rgba(255, 255, 255, 0.07)",
    borderColor: "rgba(255, 255, 255, 0.1)",
    borderWidth: 1,
  },
  submitButtonText: {
    fontFamily: THEME_TYPOGRAPHY.fontFamily.sans,
    fontSize: THEME_TYPOGRAPHY.fontSize.sm,
    fontWeight: THEME_TYPOGRAPHY.fontWeight.bold,
  },
  submitTextActive: {
    color: "#000000",
  },
  submitTextDisabled: {
    color: THEME_COLORS.textDim,
  },
});

