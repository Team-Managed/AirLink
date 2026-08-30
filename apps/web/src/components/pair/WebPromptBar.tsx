"use client";

import React, { useState } from "react";
import type { QuickActionItem } from "../../types";

interface WebPromptBarProps {
  isStreaming: boolean;
  onSendPrompt: (text: string) => void;
}

export function WebPromptBar({ isStreaming, onSendPrompt }: WebPromptBarProps) {
  const [promptInput, setPromptInput] = useState<string>("");

  const quickActions: QuickActionItem[] = [
    {
      label: "Create PR",
      prompt: "Create a descriptive pull request summarizing our recent changes",
    },
    { label: "Import Issue", prompt: "Inspect open GitHub issues and identify top priority tasks" },
    { label: "Run Tests", prompt: "Run all Vitest test suites and report any failures" },
    { label: "Git Status", prompt: "Run git status and report modified or untracked files" },
    { label: "Fix Lint", prompt: "Run eslint and format code with prettier" },
    { label: "Rollback", prompt: "Revert the last uncommitted changes safely" },
  ];

  const handleSend = (textToSend?: string) => {
    const text = textToSend || promptInput;
    if (!text.trim() || isStreaming) return;
    onSendPrompt(text);
    setPromptInput("");
  };

  return (
    <div style={styles.promptBarContainer}>
      {/* Quick Actions Bar */}
      <div style={styles.quickActionsBar}>
        {quickActions.map((qa) => (
          <button
            key={qa.label}
            style={{
              ...styles.quickActionPill,
              ...(isStreaming ? styles.quickActionPillDisabled : {}),
            }}
            disabled={isStreaming}
            onClick={() => handleSend(qa.prompt)}
          >
            {qa.label}
          </button>
        ))}
      </div>

      {/* Prompt Input Row */}
      <div style={styles.inputBar}>
        <input
          type="text"
          style={styles.promptInput}
          value={promptInput}
          onChange={(e) => setPromptInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              handleSend();
            }
          }}
          placeholder="Ask your workstation agent to build, refactor, or test..."
          disabled={isStreaming}
        />
        <button
          style={styles.sendButton}
          onClick={() => handleSend()}
          disabled={!promptInput.trim() || isStreaming}
        >
          Send Turn
        </button>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  promptBarContainer: {
    display: "flex",
    flexDirection: "column",
    gap: 10,
  },
  quickActionsBar: {
    display: "flex",
    gap: 8,
    overflowX: "auto",
    paddingBottom: 4,
  },
  quickActionPill: {
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    border: "1px solid rgba(255, 255, 255, 0.1)",
    color: "#cbd5e1",
    padding: "5px 12px",
    borderRadius: 9999,
    fontSize: 12,
    fontWeight: 600,
    cursor: "pointer",
    whiteSpace: "nowrap",
    boxShadow: "0 1px 3px rgba(0, 0, 0, 0.2)",
    transition: "all 0.15s ease",
  },
  quickActionPillDisabled: {
    opacity: 0.4,
    cursor: "not-allowed",
  },
  inputBar: {
    display: "flex",
    gap: 10,
  },
  promptInput: {
    flex: 1,
    backgroundColor: "#0c1322",
    border: "1px solid rgba(255, 255, 255, 0.12)",
    borderRadius: 10,
    padding: "12px 16px",
    color: "#f8fafc",
    fontSize: 13.5,
    fontWeight: 500,
    outline: "none",
    boxShadow: "0 2px 8px rgba(0, 0, 0, 0.3)",
  },
  sendButton: {
    backgroundColor: "#2563eb",
    color: "#ffffff",
    border: "1px solid rgba(255, 255, 255, 0.25)",
    padding: "0 20px",
    borderRadius: 10,
    fontWeight: 700,
    fontSize: 13.5,
    cursor: "pointer",
    boxShadow: "0 2px 8px rgba(37, 99, 235, 0.4)",
    transition: "all 0.15s ease",
  },
};
