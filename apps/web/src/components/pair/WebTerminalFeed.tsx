"use client";

import React, { useRef, useEffect } from "react";
import type { WebFeedItem } from "../../types";

interface WebTerminalFeedProps {
  feedItems: WebFeedItem[];
  isStreaming: boolean;
}

export function WebTerminalFeed({ feedItems, isStreaming }: WebTerminalFeedProps) {
  const feedEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    feedEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [feedItems, isStreaming]);

  return (
    <div style={styles.feedScroll}>
      {feedItems.map((item) => (
        <div
          key={item.id}
          style={{
            ...styles.feedRow,
            ...(item.role === "user" ? styles.userRow : {}),
          }}
        >
          {item.type === "thought" && (
            <div style={styles.thoughtCard}>
              <span style={styles.thoughtTitle}>Thinking:</span>
              <span style={styles.thoughtText}>{item.content}</span>
            </div>
          )}

          {item.type === "tool_call" && (
            <div style={styles.toolCard}>
              <span style={styles.toolBadge}>{item.metadata?.name || "tool"}</span>
              <code style={styles.toolCode}>{item.content}</code>
            </div>
          )}

          {item.type === "tool_result" && (
            <div style={styles.toolResultCard}>
              <span style={styles.toolResultTitle}>
                Output ({item.metadata?.durationMs || 0}ms):
              </span>
              <pre style={styles.toolResultCode}>{item.content}</pre>
            </div>
          )}

          {item.type === "token" && (
            <div style={styles.tokenBox}>
              <span>{item.content}</span>
            </div>
          )}
        </div>
      ))}

      {isStreaming && (
        <div style={styles.streamingIndicator}>
          <span style={styles.streamDot} />
          <span>Agent is working...</span>
          <span className="blinking-cursor" />
        </div>
      )}
      <div ref={feedEndRef} />
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  feedScroll: {
    flex: 1,
    backgroundColor: "#161e2e",
    border: "1px solid rgba(255, 255, 255, 0.1)",
    borderRadius: 12,
    padding: 18,
    overflowY: "auto",
    minHeight: 400,
    maxHeight: "calc(100vh - 240px)",
    display: "flex",
    flexDirection: "column",
    gap: 12,
    boxShadow: "0 10px 30px -5px rgba(24, 32, 48, 0.35)",
  },
  feedRow: {
    fontSize: 13,
    lineHeight: 1.6,
  },
  userRow: {
    backgroundColor: "#1e293b",
    borderLeft: "3px solid #e08a5b",
    padding: "8px 12px",
    borderRadius: "0 6px 6px 0",
    color: "#f8fafc",
    fontWeight: 600,
  },
  tokenBox: {
    color: "#f8fafc",
    fontFamily: "var(--font-mono)",
    whiteSpace: "pre-wrap",
  },
  thoughtCard: {
    backgroundColor: "#1a2336",
    border: "1px solid #2a374f",
    padding: 10,
    borderRadius: 6,
    color: "#94a3b8",
    fontStyle: "italic",
    fontSize: 12,
  },
  thoughtTitle: {
    color: "#e5b771",
    fontWeight: 600,
    marginRight: 6,
  },
  thoughtText: { color: "#94a3b8" },
  toolCard: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#1a2336",
    padding: "6px 10px",
    borderRadius: 6,
  },
  toolBadge: {
    backgroundColor: "rgba(224, 138, 91, 0.14)",
    border: "1px solid rgba(224, 138, 91, 0.3)",
    color: "#e08a5b",
    padding: "2px 6px",
    borderRadius: 4,
    fontSize: 11,
    fontWeight: 700,
    fontFamily: "var(--font-mono)",
  },
  toolCode: {
    color: "#f8fafc",
    fontSize: 12,
    fontFamily: "var(--font-mono)",
  },
  toolResultCard: {
    backgroundColor: "#111824",
    border: "1px solid #2a374f",
    borderRadius: 6,
    padding: 10,
  },
  toolResultTitle: {
    color: "#687a94",
    fontSize: 11,
    display: "block",
    marginBottom: 4,
  },
  toolResultCode: {
    color: "#94a3b8",
    fontSize: 11,
    fontFamily: "var(--font-mono)",
    margin: 0,
    whiteSpace: "pre-wrap",
  },
  streamingIndicator: {
    display: "flex",
    alignItems: "center",
    gap: 6,
    color: "#e08a5b",
    fontSize: 12,
    fontFamily: "var(--font-mono)",
  },
  streamDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#e08a5b",
  },
};
