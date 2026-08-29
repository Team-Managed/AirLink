"use client";

import React from "react";
import { LoadingState } from "../ui/LoadingState";
import { ThinkingState } from "../ui/ThinkingState";
import { StreamingText } from "../ui/StreamingText";
import { ToolChips } from "../ui/ToolChips";
import { ApprovalCard } from "../ui/ApprovalCard";
import { DiffTable } from "../ui/DiffTable";
import { CodeBlock } from "../ui/CodeBlock";

export function MicroComponentsShowcase() {
  return (
    <section style={styles.section} id="features">
      <div style={styles.container}>
        {/* Section 1: Loading State */}
        <div style={styles.block}>
          <div style={styles.blockHeader}>
            <span style={styles.blockTitle}>Loading State</span>
            <span style={styles.blockDesc}>
              Pixel-grid loader for long-running agent reasoning turns.
            </span>
          </div>
          <div style={styles.componentWrapper}>
            <LoadingState label="Churning" />
          </div>
        </div>

        {/* Section 2: Thinking */}
        <div style={styles.block}>
          <div style={styles.blockHeader}>
            <span style={styles.blockTitle}>Thinking State</span>
            <span style={styles.blockDesc}>
              Expandable traces &mdash; steps, reasoning, search, coding.
            </span>
          </div>
          <div style={styles.componentWrapper}>
            <ThinkingState />
          </div>
        </div>

        {/* Section 3: Streaming Text */}
        <div style={styles.block}>
          <div style={styles.blockHeader}>
            <span style={styles.blockTitle}>Streaming Text</span>
            <span style={styles.blockDesc}>
              Streamed answer with inline sources, actions, and follow-ups.
            </span>
          </div>
          <div style={styles.componentWrapper}>
            <StreamingText />
          </div>
        </div>

        {/* Section 4: Tool Chips & Approval Card */}
        <div style={styles.splitBlock}>
          <div style={styles.splitCol}>
            <div style={styles.blockHeader}>
              <span style={styles.blockTitle}>Tool Chips</span>
              <span style={styles.blockDesc}>Compact MCP tool call rows and file diff chips.</span>
            </div>
            <div style={styles.cardContainer}>
              <ToolChips />
            </div>
          </div>

          <div style={styles.splitCol}>
            <div style={styles.blockHeader}>
              <span style={styles.blockTitle}>Approval Card</span>
              <span style={styles.blockDesc}>Human-in-the-loop rolling odometer step gate.</span>
            </div>
            <div style={styles.cardContainer}>
              <ApprovalCard />
            </div>
          </div>
        </div>

        {/* Section 5: Code Block & Diff Table */}
        <div style={styles.splitBlock}>
          <div style={styles.splitCol}>
            <div style={styles.blockHeader}>
              <span style={styles.blockTitle}>Code Block &amp; Unified Diff</span>
              <span style={styles.blockDesc}>Line numbered code with add/del gutter highlights.</span>
            </div>
            <div style={styles.cardContainer}>
              <CodeBlock variant="Diff" />
            </div>
          </div>

          <div style={styles.splitCol}>
            <div style={styles.blockHeader}>
              <span style={styles.blockTitle}>Diff Table</span>
              <span style={styles.blockDesc}>Interactive proposed changes with toggleable rows.</span>
            </div>
            <div style={styles.cardContainer}>
              <DiffTable />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

const styles: Record<string, React.CSSProperties> = {
  section: {
    maxWidth: 980,
    margin: "0 auto 120px",
    padding: "0 24px",
    position: "relative",
    zIndex: 10,
  },
  container: {
    display: "flex",
    flexDirection: "column",
    gap: 48,
  },
  block: {
    borderTop: "1px solid rgba(24, 32, 48, 0.12)",
    paddingTop: 32,
    display: "flex",
    flexDirection: "column",
    gap: 16,
  },
  blockHeader: {
    display: "flex",
    alignItems: "baseline",
    gap: 10,
    marginBottom: 6,
    flexWrap: "wrap",
  },
  blockTitle: {
    fontSize: 15,
    fontWeight: 800,
    color: "#182030",
    fontFamily: "var(--font-display)",
    letterSpacing: -0.3,
  },
  blockDesc: {
    fontSize: 13.5,
    color: "#35455e",
  },
  componentWrapper: {
    display: "flex",
    justifyContent: "center",
    width: "100%",
  },
  splitBlock: {
    borderTop: "1px solid rgba(24, 32, 48, 0.12)",
    paddingTop: 32,
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(360px, 1fr))",
    gap: 24,
  },
  splitCol: {
    display: "flex",
    flexDirection: "column",
    gap: 14,
  },
  cardContainer: {
    display: "flex",
    justifyContent: "center",
    width: "100%",
  },
};
