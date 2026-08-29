"use client";

import React, { useEffect, useState } from "react";

/* ─────────────────────────────────────────────────────────
 * STREAMING TEXT
 * Words resolve character/word by word with live cursor
 * and follow-up prompt chips.
 * ───────────────────────────────────────────────────────── */

const WORD_MS = 60;
const HOLD_MS = 3600;

export type StreamingToken = { text: string; cite?: boolean };

const DEFAULT_TOKENS: StreamingToken[] = [
  ..."Enforcing WebSocket relay encryption and 180s safety gate."
    .split(" ")
    .map((text) => ({ text })),
  ..."All destructive bash operations now require 1-tap authorization."
    .split(" ")
    .map((text) => ({ text })),
];

const DEFAULT_FOLLOW_UPS = [
  "Run production verification",
  "Inspect AST git diff",
];

export function StreamingText({
  content = DEFAULT_TOKENS,
  followUps = DEFAULT_FOLLOW_UPS,
  loop = true,
  onDone,
  onFollowUp,
}: {
  content?: StreamingToken[];
  followUps?: string[];
  loop?: boolean;
  onDone?: () => void;
  onFollowUp?: (text: string, index: number) => void;
}) {
  const [count, setCount] = useState(0);
  const done = count >= content.length;

  useEffect(() => {
    if (done && !loop) {
      onDone?.();
      return;
    }
    const t = setTimeout(
      () => setCount((c) => (c >= content.length ? 0 : c + 1)),
      done ? HOLD_MS : WORD_MS,
    );
    return () => clearTimeout(t);
  }, [count, done, loop, content.length, onDone]);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 4, width: "100%" }}>
      <p style={{ fontSize: 10, lineHeight: 1.4, color: "#cbd5e1", margin: 0 }}>
        {content.slice(0, count).map((token, i) => (
          <span key={i} style={{ display: "inline" }}>
            {token.text}{" "}
          </span>
        ))}
        {!done && (
          <span
            style={{
              display: "inline-block",
              width: 2,
              height: 10,
              backgroundColor: "#38bdf8",
              marginLeft: 2,
              animation: "fade-in 150ms ease-out both",
            }}
          />
        )}
      </p>

      {/* Follow-up suggestion pills when streaming finishes */}
      {done && followUps.length > 0 && (
        <div style={{ display: "flex", gap: 4, flexWrap: "wrap", marginTop: 4 }}>
          {followUps.map((text, i) => (
            <button
              key={text}
              type="button"
              onClick={() => onFollowUp?.(text, i)}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 4,
                backgroundColor: "rgba(59, 130, 246, 0.12)",
                border: "1px solid rgba(59, 130, 246, 0.3)",
                color: "#93c5fd",
                fontSize: 9,
                fontWeight: 600,
                padding: "3px 6px",
                borderRadius: 4,
                cursor: "pointer",
                animation: `fade-up 240ms ease-out ${i * 60}ms both`,
              }}
            >
              <span>↳</span>
              <span>{text}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default StreamingText;
