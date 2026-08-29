"use client";

import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";

/* ─────────────────────────────────────────────────────────
 * TOOL CHIPS
 * An agent run as compact rows: tool calls with inline
 * chips, then file-diff chips summarizing the edits.
 * Hover a row to reveal its chevron; every row expands
 * to show what the tool actually did.
 * ───────────────────────────────────────────────────────── */

const STEP_MS = 600;

const Icons: Record<string, React.ReactNode> = {
  think: <path d="M12 2l2.4 7.2L22 12l-7.6 2.8L12 22l-2.4-7.2L2 12l7.6-2.8z" />,
  write: (
    <g fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 3a2.8 2.8 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5z" />
    </g>
  ),
  run: (
    <g fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 17l6-5-6-5M12 19h8" />
    </g>
  ),
  read: (
    <g fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <path d="M14 2v6h6" />
    </g>
  ),
};

export type ToolDetailLine = { text: string; tone?: "add" };

export type ToolStep = {
  icon: string;
  label: string;
  chip: string;
  mono: boolean;
  detailMono: boolean;
  detail: ToolDetailLine[];
};

export type ToolDiff = { file: string; add: number; del: number };

export type ToolDiffLine = { text: string; tone: "add" | "del" | "ctx" };

export type ToolChipsLabels = {
  header: string;
  more: string;
};

const DEFAULT_LABELS: ToolChipsLabels = {
  header: "2 files changed +92 -35",
  more: "+2 more",
};

const ROWS: ToolStep[] = [
  {
    icon: "think",
    label: "Thinking",
    chip: "Inspecting hero components...",
    mono: false,
    detailMono: false,
    detail: [
      { text: "Constructing GSAP cinematic word reveal timeline." },
      { text: "Synchronizing solid obsidian display typography." },
    ],
  },
  {
    icon: "write",
    label: "Write 92 lines",
    chip: "PanoramicLandscapeHero.tsx",
    mono: true,
    detailMono: true,
    detail: [
      { text: "+ gsap.fromTo('.hero-word', { filter: 'blur(12px)', y: 48 },", tone: "add" },
      { text: "+ { filter: 'blur(0px)', y: 0, stagger: 0.065 });", tone: "add" },
    ],
  },
  {
    icon: "run",
    label: "Rebuild and verify",
    chip: "pnpm test",
    mono: true,
    detailMono: true,
    detail: [
      { text: "✓ built in 1.1s" },
      { text: "✓ 12 unit checks passed" },
    ],
  },
];

const DIFFS: ToolDiff[] = [
  { file: "PanoramicLandscapeHero.tsx", add: 92, del: 35 },
  { file: "progress-tracker.md", add: 18, del: 4 },
];

const DIFF_LINES: Record<string, ToolDiffLine[]> = {
  "PanoramicLandscapeHero.tsx": [
    { text: "color: 'transparent', backgroundClip: 'text',", tone: "del" },
    { text: "color: '#0f172a', fontWeight: 900,", tone: "add" },
    { text: "gsap.fromTo('.hero-word', { filter: 'blur(12px)', y: 48 },", tone: "add" },
    { text: "  { filter: 'blur(0px)', y: 0, stagger: 0.065 });", tone: "add" },
  ],
  "progress-tracker.md": [
    { text: "- [ ] Hero GSAP reveal animation", tone: "del" },
    { text: "- [x] Hero GSAP word-by-word reveal & pure white background", tone: "add" },
  ],
};

export function ToolChips({
  steps = ROWS,
  diffs = DIFFS,
  diffLines = DIFF_LINES,
  labels,
  className = "",
  onOpenChange,
  onToggleRow,
}: {
  variant?: string;
  steps?: ToolStep[];
  diffs?: ToolDiff[];
  diffLines?: Record<string, ToolDiffLine[]>;
  labels?: Partial<ToolChipsLabels>;
  className?: string;
  onOpenChange?: (open: boolean) => void;
  onToggleRow?: (label: string, open: boolean) => void;
}) {
  const copy = { ...DEFAULT_LABELS, ...labels };
  const [step, setStep] = useState(0);
  const [open, setOpen] = useState(true);
  const [openRows, setOpenRows] = useState<Set<string>>(new Set());
  const [preview, setPreview] = useState<{
    file: string;
    x: number;
    top?: number;
    bottom?: number;
  } | null>(null);

  const openPreview = (file: string) => (event: React.SyntheticEvent) => {
    const rect = (event.currentTarget as Element).closest("[data-diffchip]")?.getBoundingClientRect();
    if (!rect) return;
    const previewHeight = 38 + (diffLines[file]?.length ?? 0) * 19;
    const fitsBelow = rect.bottom + 6 + previewHeight <= window.innerHeight - 12;
    setPreview({
      file,
      x: Math.max(12, Math.min(rect.left, window.innerWidth - 280)),
      ...(fitsBelow ? { top: rect.bottom + 6 } : { bottom: window.innerHeight - rect.top + 6 }),
    });
  };

  const closePreview = (file: string) => () =>
    setPreview((current) => (current?.file === file ? null : current));

  const total = steps.length + 1;

  useEffect(() => {
    if (step >= total) return;
    const t = setTimeout(() => setStep((s) => s + 1), STEP_MS);
    return () => clearTimeout(t);
  }, [step, total]);

  const toggleRow = (label: string) =>
    setOpenRows((current) => {
      const next = new Set(current);
      if (next.has(label)) {
        next.delete(label);
      } else {
        next.add(label);
      }
      onToggleRow?.(label, next.has(label));
      return next;
    });

  return (
    <div style={{ width: "100%", display: "flex", flexDirection: "column", gap: 3 }} className={className}>
      {/* Collapsed Run Header */}
      <button
        type="button"
        aria-expanded={open}
        onClick={() => {
          setOpen((current) => {
            onOpenChange?.(!current);
            return !current;
          });
        }}
        style={{
          display: "flex",
          alignItems: "center",
          gap: 6,
          backgroundColor: "transparent",
          border: "none",
          color: "#94a3b8",
          fontSize: 10,
          fontFamily: "var(--font-mono)",
          cursor: "pointer",
          padding: "2px 0",
          textAlign: "left",
        }}
      >
        <svg
          width="10"
          height="10"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="round"
          style={{
            transform: open ? "rotate(0deg)" : "rotate(-90deg)",
            transition: "transform 0.2s ease",
          }}
        >
          <path d="M6 9l6 6 6-6" />
        </svg>
        <span style={{ fontWeight: 600 }}>{copy.header}</span>
      </button>

      {/* Tool Call Rows */}
      {open && (
        <div style={{ display: "flex", flexDirection: "column", gap: 3, marginTop: 2 }}>
          {steps.slice(0, step).map((row) => {
            const rowOpen = openRows.has(row.label);
            return (
              <div key={row.label} style={{ display: "flex", flexDirection: "column" }}>
                <button
                  type="button"
                  aria-expanded={rowOpen}
                  onClick={() => toggleRow(row.label)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 5,
                    backgroundColor: "rgba(255, 255, 255, 0.04)",
                    border: "1px solid rgba(255, 255, 255, 0.06)",
                    borderRadius: 5,
                    padding: "3px 6px",
                    color: "#f8fafc",
                    fontSize: 9.5,
                    cursor: "pointer",
                    textAlign: "left",
                  }}
                >
                  <span style={{ display: "flex", alignItems: "center", color: "#94a3b8" }}>
                    <svg
                      width="10"
                      height="10"
                      viewBox="0 0 24 24"
                      fill={row.icon === "think" ? "currentColor" : "none"}
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      {Icons[row.icon]}
                    </svg>
                  </span>
                  <span style={{ fontWeight: 600 }}>{row.label}</span>
                  <span
                    style={{
                      marginLeft: "auto",
                      backgroundColor: "rgba(0, 0, 0, 0.4)",
                      padding: "1px 5px",
                      borderRadius: 3,
                      fontSize: 8.5,
                      fontFamily: row.mono ? "var(--font-mono)" : "inherit",
                      color: "#93c5fd",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                      maxWidth: 130,
                    }}
                  >
                    {row.chip}
                  </span>
                </button>

                {/* Expanded Detail */}
                {rowOpen && (
                  <div
                    style={{
                      marginLeft: 8,
                      borderLeft: "1px solid rgba(255, 255, 255, 0.12)",
                      paddingLeft: 8,
                      paddingTop: 2,
                      paddingBottom: 2,
                      display: "flex",
                      flexDirection: "column",
                      gap: 2,
                    }}
                  >
                    {row.detail.map((line, idx) => (
                      <span
                        key={idx}
                        style={{
                          fontSize: 8.5,
                          fontFamily: row.detailMono ? "var(--font-mono)" : "inherit",
                          color: line.tone === "add" ? "#4ade80" : "#cbd5e1",
                          lineHeight: 1.4,
                        }}
                      >
                        {line.text}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            );
          })}

          {/* File-Diff Chips */}
          {step >= total && (
            <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginTop: 4, paddingTop: 4, borderTop: "1px solid rgba(255, 255, 255, 0.08)" }}>
              {diffs.map((d) => (
                <span
                  key={d.file}
                  data-diffchip
                  onMouseEnter={openPreview(d.file)}
                  onMouseLeave={closePreview(d.file)}
                  style={{ display: "inline-flex" }}
                >
                  <button
                    type="button"
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 4,
                      backgroundColor: "#030712",
                      border: "1px solid rgba(255, 255, 255, 0.12)",
                      borderRadius: 4,
                      padding: "2px 6px",
                      fontSize: 8.5,
                      fontFamily: "var(--font-mono)",
                      color: "#f8fafc",
                      cursor: "pointer",
                    }}
                  >
                    <span style={{ maxWidth: 120, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {d.file}
                    </span>
                    <span style={{ color: "#4ade80" }}>+{d.add}</span>
                    {d.del > 0 && <span style={{ color: "#f87171" }}>−{d.del}</span>}
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Floating Diff Preview Portal */}
      {preview && typeof document !== "undefined" && createPortal(
        <div
          style={{
            position: "fixed",
            zIndex: 9999,
            left: preview.x,
            top: preview.top,
            bottom: preview.bottom,
            width: 260,
            backgroundColor: "#030712",
            border: "1px solid rgba(255, 255, 255, 0.15)",
            borderRadius: 8,
            boxShadow: "0 10px 30px rgba(0, 0, 0, 0.6)",
            overflow: "hidden",
            fontSize: 9,
            fontFamily: "var(--font-mono)",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid rgba(255, 255, 255, 0.1)", padding: "5px 8px", backgroundColor: "#0f172a" }}>
            <span style={{ color: "#cbd5e1" }}>{preview.file}</span>
            <span style={{ color: "#4ade80" }}>+{diffs.find((d) => d.file === preview.file)?.add}</span>
          </div>
          <div style={{ padding: "4px 8px", display: "flex", flexDirection: "column", gap: 2 }}>
            {(diffLines[preview.file] ?? []).map((line, idx) => (
              <div
                key={idx}
                style={{
                  color: line.tone === "add" ? "#4ade80" : line.tone === "del" ? "#f87171" : "#94a3b8",
                  backgroundColor: line.tone === "add" ? "rgba(34, 197, 94, 0.1)" : line.tone === "del" ? "rgba(239, 68, 68, 0.1)" : "transparent",
                  padding: "1px 4px",
                  borderRadius: 2,
                }}
              >
                {line.text}
              </div>
            ))}
          </div>
        </div>,
        document.body,
      )}
    </div>
  );
}

export default ToolChips;
