"use client";

import React, { useEffect, useLayoutEffect, useRef, useState } from "react";

/* ─────────────────────────────────────────────────────────
 * THINKING — expandable agent trace
 *
 *   Steps      step list with spinner → checks
 *   Reasoning  prose reasoning that expands, then settles
 *   Search     web-search trace: query + sources read
 *   Coding     tool trace: files read, edits, commands
 * ───────────────────────────────────────────────────────── */

const STAGES = [800, 600, 1800, 2600, 1600];

function useSequence(steps: number[]) {
  const [stage, setStage] = useState(0);
  useEffect(() => {
    if (stage >= steps.length - 1) return;
    const t = setTimeout(() => setStage((s) => s + 1), steps[stage]);
    return () => clearTimeout(t);
  }, [stage, steps]);
  return stage;
}

type Row = {
  primary: string;
  secondary?: string;
  mono?: boolean;
  add?: number;
  del?: number;
  href?: string;
};

const VARIANTS: Record<
  string,
  { active: string; done: string; rows: Row[]; query?: string }
> = {
  Steps: {
    active: "Thinking...",
    done: "Thought for 1.4s",
    rows: [
      { primary: "Inspecting routes/v1/session.ts" },
      { primary: "Scanning AST export nodes" },
      { primary: "Constructing E2E safety gates", secondary: "180s rule" },
      { primary: "Applying patch diffs" },
    ],
  },
  Reasoning: {
    active: "Reasoning...",
    done: "Reasoned for 2.1s",
    rows: [
      { primary: "E2E WebSocket heartbeat ensures zero connection dropping on mobile networks." },
      { primary: "Destructive commands must trigger the 180s Safety Gate approval request." },
    ],
  },
  Coding: {
    active: "Running tools...",
    done: "Ran 3 tools",
    rows: [
      { primary: "Read", secondary: "session.ts", mono: true },
      { primary: "Edit", secondary: "websocket-relay.ts", mono: true, add: 38, del: 14 },
      { primary: "Run", secondary: "npx vitest run", mono: true },
    ],
  },
};

export function ThinkingState({
  variant = "Coding",
  onSettled,
}: {
  variant?: string;
  onSettled?: () => void;
}) {
  const stage = useSequence(STAGES);
  const [manualExpanded, setManualExpanded] = useState<boolean | null>(null);
  const [selectedTool, setSelectedTool] = useState<string | null>(null);
  const v = VARIANTS[variant] ?? VARIANTS.Coding;
  const autoExpanded = stage >= 1 && stage < 4;
  const expanded = manualExpanded ?? autoExpanded;
  const working = stage < 3;
  const visible = stage < 2 ? 1 : stage === 2 ? Math.min(2, v.rows.length) : v.rows.length;
  const traceRef = useRef<HTMLDivElement>(null);
  const [lineHeight, setLineHeight] = useState(0);

  useLayoutEffect(() => {
    if (traceRef.current) setLineHeight(traceRef.current.offsetHeight);
  }, [visible, expanded, variant, stage]);

  const settledRef = useRef(false);
  useEffect(() => {
    if (working || settledRef.current) return;
    settledRef.current = true;
    onSettled?.();
  }, [working, onSettled]);

  return (
    <div
      key={variant}
      style={{
        display: "flex",
        width: "100%",
        flexDirection: "column",
        gap: 4,
      }}
    >
      {/* Header Button */}
      <button
        type="button"
        aria-expanded={expanded}
        onClick={() => setManualExpanded((current) => !(current ?? autoExpanded))}
        style={{
          display: "flex",
          width: "fit-content",
          alignItems: "center",
          gap: 6,
          backgroundColor: "transparent",
          border: "none",
          padding: "3px 4px",
          borderRadius: 6,
          cursor: "pointer",
          color: "#cbd5e1",
        }}
      >
        <svg width="13" height="13" viewBox="0 0 24 24" fill={working ? "#38bdf8" : "#94a3b8"}>
          <path d="M12 2l2.4 7.2L22 12l-7.6 2.8L12 22l-2.4-7.2L2 12l7.6-2.8z" />
        </svg>

        <span role="status">
          {working ? (
            <span
              style={{
                fontSize: 11,
                fontWeight: 600,
                color: "transparent",
                backgroundImage:
                  "linear-gradient(90deg, #94a3b8 35%, #38bdf8 50%, #94a3b8 65%)",
                backgroundSize: "200% 100%",
                WebkitBackgroundClip: "text",
                animation: "shimmer-text 1.4s linear infinite",
              }}
            >
              {v.active}
            </span>
          ) : (
            <span
              style={{
                fontSize: 11,
                fontWeight: 600,
                color: "#94a3b8",
                animation: "fade-in 350ms ease-out both",
              }}
            >
              {v.done}
            </span>
          )}
        </span>

        <svg
          width="11"
          height="11"
          viewBox="0 0 24 24"
          fill="none"
          stroke="#94a3b8"
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="round"
          style={{
            transform: expanded ? "rotate(180deg)" : "rotate(0)",
            transition: "transform 0.25s ease",
          }}
        >
          <path d="M6 9l6 6 6-6" />
        </svg>
      </button>

      {/* Expandable Trace Rows */}
      {expanded && (
        <div style={{ position: "relative", marginLeft: 6, paddingLeft: 12 }}>
          {/* Vertical connecting line */}
          <span
            aria-hidden
            style={{
              position: "absolute",
              left: 2,
              top: 0,
              width: 1.5,
              height: lineHeight ? lineHeight : "100%",
              backgroundColor: "rgba(255, 255, 255, 0.1)",
              borderRadius: 9999,
            }}
          />

          <div ref={traceRef} style={{ display: "flex", flexDirection: "column", gap: 3, padding: "2px 0" }}>
            {v.rows.slice(0, visible).map((row, i) => {
              const selected = selectedTool === row.primary;
              return (
                <div
                  key={row.primary}
                  onClick={() => setSelectedTool(selected ? null : row.primary)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                    padding: "3px 6px",
                    borderRadius: 4,
                    backgroundColor: selected ? "rgba(255, 255, 255, 0.08)" : "transparent",
                    fontSize: 10,
                    cursor: "pointer",
                    animation: `fade-up 260ms ease-out ${i * 80}ms both`,
                  }}
                >
                  {i < visible - 1 || !working ? (
                    <svg
                      width="10"
                      height="10"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="#4ade80"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      style={{ flexShrink: 0 }}
                    >
                      <path d="M20 6L9 17l-5-5" />
                    </svg>
                  ) : (
                    <span
                      style={{
                        width: 8,
                        height: 8,
                        borderRadius: "50%",
                        border: "1.5px solid rgba(255, 255, 255, 0.2)",
                        borderTopColor: "#38bdf8",
                        animation: "spin 700ms linear infinite",
                        flexShrink: 0,
                      }}
                    />
                  )}

                  <span style={{ fontWeight: 600, color: "#f8fafc" }}>{row.primary}</span>

                  {row.secondary && (
                    <span
                      style={{
                        fontFamily: row.mono ? "var(--font-mono)" : "inherit",
                        fontSize: 9.5,
                        color: "#94a3b8",
                      }}
                    >
                      {row.secondary}
                    </span>
                  )}

                  {row.add !== undefined && (
                    <span
                      style={{
                        fontFamily: "var(--font-mono)",
                        fontSize: 9,
                        marginLeft: "auto",
                        fontVariantNumeric: "tabular-nums",
                      }}
                    >
                      <span style={{ color: "#4ade80" }}>+{row.add}</span>{" "}
                      <span style={{ color: "#f87171" }}>−{row.del}</span>
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

export default ThinkingState;
