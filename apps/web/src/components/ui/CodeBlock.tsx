"use client";

import React, { useState } from "react";

const CODE_LINES = [
  "export async function purgeRateLimiter() {",
  '  const now = Date.now();',
  "  const buckets = await ringBuffer.getBuckets();",
  "  for (const [k, v] of buckets) {",
  "    if (now > v.expires) buckets.delete(k);",
  "  }",
  "  return buckets.size;",
  "}",
];
const RAW = CODE_LINES.join("\n");

type Piece = { text: string; change?: "add" | "del" };
type Row = { old: number | null; cur: number | null; type: "ctx" | "add" | "del"; pieces: Piece[] };

const DIFF: Row[] = [
  { old: 1, cur: 1, type: "ctx", pieces: [{ text: "export async function purgeRateLimiter() {" }] },
  { old: 2, cur: null, type: "del", pieces: [{ text: "  setInterval(() => purge(), 60000);", change: "del" }] },
  { old: null, cur: 2, type: "add", pieces: [{ text: "  const now = Date.now();", change: "add" }] },
  { old: null, cur: 3, type: "add", pieces: [{ text: "  const buckets = await ringBuffer.getBuckets();", change: "add" }] },
  { old: 3, cur: 4, type: "ctx", pieces: [{ text: "  for (const [k, v] of buckets) {" }] },
  { old: 4, cur: 5, type: "ctx", pieces: [{ text: "    if (now > v.expires) buckets.delete(k);" }] },
  { old: 5, cur: 6, type: "ctx", pieces: [{ text: "  }" }] },
  { old: 6, cur: 7, type: "ctx", pieces: [{ text: "}" }] },
];

export function CodeBlock({ variant = "Diff" }: { variant?: string }) {
  const [copied, setCopied] = useState(false);
  const isDiff = variant === "Diff";

  const copy = () => {
    navigator.clipboard.writeText(RAW);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div
      style={{
        width: "100%",
        maxWidth: 420,
        overflow: "hidden",
        borderRadius: 12,
        backgroundColor: "#161e2e",
        border: "1px solid rgba(255, 255, 255, 0.1)",
        boxShadow: "0 10px 25px -5px rgba(24, 32, 48, 0.3)",
      }}
    >
      {/* Header */}
      <div
        style={{
          display: "flex",
          height: 38,
          alignItems: "center",
          justifyContent: "space-between",
          borderBottom: "1px solid rgba(255, 255, 255, 0.08)",
          padding: "0 14px",
          fontSize: 12,
        }}
      >
        <span style={{ fontFamily: "var(--font-mono)", color: "#f8fafc", fontWeight: 700 }}>
          rate-limiter.ts
        </span>

        {isDiff ? (
          <span style={{ fontFamily: "var(--font-mono)", fontSize: 11 }}>
            <span style={{ color: "#228a7a", fontWeight: 700 }}>+2</span>{" "}
            <span style={{ color: "#c74444", fontWeight: 700 }}>-1</span>
          </span>
        ) : (
          <button
            type="button"
            onClick={copy}
            style={{
              backgroundColor: "transparent",
              border: "none",
              color: copied ? "#228a7a" : "#94a3b8",
              cursor: "pointer",
              fontSize: 11,
              fontWeight: 600,
            }}
          >
            {copied ? "✓ Copied" : "Copy"}
          </button>
        )}
      </div>

      {/* Code / Diff Body */}
      <div style={{ padding: "8px 0", fontFamily: "var(--font-mono)", fontSize: 11.5, lineHeight: 1.65 }}>
        {isDiff ? (
          <div>
            {DIFF.map((r, i) => {
              const add = r.type === "add";
              const del = r.type === "del";
              return (
                <div
                  key={i}
                  style={{
                    display: "grid",
                    gridTemplateColumns: "30px 1fr",
                    padding: "1px 0",
                    backgroundColor: add
                      ? "rgba(34, 138, 122, 0.15)"
                      : del
                        ? "rgba(199, 68, 68, 0.15)"
                        : "transparent",
                    color: add ? "#228a7a" : del ? "#c74444" : "#cbd5e1",
                  }}
                >
                  <span style={{ textAlign: "center", color: "#64748b", userSelect: "none" }}>
                    {del ? r.old : r.cur ?? ""}
                  </span>
                  <span style={{ paddingLeft: 8, whiteSpace: "pre-wrap" }}>
                    {r.pieces.map((p, idx) => (
                      <span key={idx}>{p.text}</span>
                    ))}
                  </span>
                </div>
              );
            })}
          </div>
        ) : (
          <div>
            {CODE_LINES.map((line, i) => (
              <div key={i} style={{ display: "grid", gridTemplateColumns: "30px 1fr", padding: "1px 0" }}>
                <span style={{ textAlign: "center", color: "#64748b", userSelect: "none" }}>
                  {i + 1}
                </span>
                <span style={{ color: "#cbd5e1", paddingLeft: 8, whiteSpace: "pre-wrap" }}>
                  {line}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
