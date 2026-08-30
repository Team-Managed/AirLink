import React, { useState, useEffect } from "react";
import { View, Text, TextInput, TouchableOpacity, ScrollView, StyleSheet, Keyboard, Platform } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { THEME_RADII } from "../theme";
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
  const [isKeyboardOpen, setIsKeyboardOpen] = useState<boolean>(false);
  const insets = useSafeAreaInsets();

  useEffect(() => {
    const showSub = Keyboard.addListener(
      Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow",
      () => setIsKeyboardOpen(true),
    );
    const hideSub = Keyboard.addListener(
      Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide",
      () => setIsKeyboardOpen(false),
    );
    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

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
    <View
      style={[
        styles.container,
        { paddingBottom: isKeyboardOpen ? 4 : Math.max(insets.bottom, 4) },
      ]}
    >
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
          placeholderTextColor="rgba(255, 255, 255, 0.55)"
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
            ➔
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: "rgba(10, 16, 30, 0.50)",
    borderTopWidth: 1,
    borderTopColor: "rgba(255, 255, 255, 0.15)",
    paddingTop: 6,
    paddingHorizontal: 12,
  },
  pillsContainer: {
    flexDirection: "row",
    gap: 6,
    paddingBottom: 5,
  },
  pillButton: {
    backgroundColor: "rgba(255, 255, 255, 0.12)",
    borderColor: "rgba(255, 255, 255, 0.25)",
    borderWidth: 1,
    paddingHorizontal: 11,
    paddingVertical: 5,
    borderRadius: THEME_RADII.full,
  },
  pillText: {
    color: "#ffffff",
    fontSize: 11,
    fontWeight: "600",
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 8,
    paddingBottom: 4,
  },
  textInput: {
    flex: 1,
    backgroundColor: "rgba(255, 255, 255, 0.12)",
    borderColor: "rgba(255, 255, 255, 0.25)",
    borderWidth: 1,
    borderRadius: 20,
    color: "#ffffff",
    fontSize: 13,
    lineHeight: 19,
    paddingHorizontal: 14,
    paddingVertical: 9,
    minHeight: 40,
    maxHeight: 120,
  },
  submitButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  submitButtonActive: {
    backgroundColor: "#ffffff",
    shadowColor: "#ffffff",
    shadowOpacity: 0.5,
    shadowRadius: 8,
    elevation: 4,
  },
  submitButtonDisabled: {
    backgroundColor: "rgba(255, 255, 255, 0.10)",
    borderColor: "rgba(255, 255, 255, 0.18)",
    borderWidth: 1,
  },
  submitButtonText: {
    fontSize: 15,
    fontWeight: "800",
  },
  submitTextActive: {
    color: "#090d16",
  },
  submitTextDisabled: {
    color: "rgba(255, 255, 255, 0.4)",
  },
});
