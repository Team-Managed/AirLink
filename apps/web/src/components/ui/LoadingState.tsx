"use client";

import React, { useEffect, useState } from "react";

/* ─────────────────────────────────────────────────────────
 * LOADING STATE — pixel-grid loader for long-running work
 *
 * Variants:
 *   Drive  — square cells, chevron wavefront driving right;
 *            the 650ms cycle is shorter than the sweep, so
 *            two fronts are always in flight
 *   Dots   — same wavefront, circular cells
 *   Orbit  — a comet lapping the grid perimeter
 * ───────────────────────────────────────────────────────── */

const chevron = Array.from({ length: 9 }, (_, i) => {
  const r = Math.floor(i / 3);
  const c = i % 3;
  return (c + Math.abs(r - 1)) * 90;
});

const ORBIT_ORDER = [0, 1, 2, 5, 8, 7, 6, 3];
const orbit = Array.from({ length: 9 }, (_, i) => {
  const k = ORBIT_ORDER.indexOf(i);
  return k === -1 ? null : k * 110;
});

const PATTERNS: Record<string, { delays: (number | null)[]; dur: number; round: boolean }> = {
  Drive: { delays: chevron, dur: 650, round: false },
  Dots: { delays: chevron, dur: 650, round: true },
  Orbit: { delays: orbit, dur: 950, round: false },
};

function LoaderGrid({
  delays,
  dur,
  round,
}: {
  delays: (number | null)[];
  dur: number;
  round: boolean;
}) {
  return (
    <span
      aria-hidden
      style={{
        display: "inline-grid",
        gridTemplateColumns: "repeat(3, 4px)",
        gap: "2px",
        flexShrink: 0,
      }}
    >
      {delays.map((delay, index) => (
        <span
          key={index}
          style={{
            width: "4px",
            height: "4px",
            backgroundColor: "#38bdf8",
            borderRadius: round ? "9999px" : "1px",
            opacity: delay === null ? 0.08 : 0.2,
            animation:
              delay === null
                ? "none"
                : `pixelPulse ${dur}ms ease-in-out ${delay}ms infinite alternate`,
          }}
        />
      ))}
    </span>
  );
}

function useElapsed() {
  const [ds, setDs] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setDs((d) => d + 1), 100);
    return () => clearInterval(t);
  }, []);
  const total = ds / 10;
  if (total < 60) return `${total.toFixed(1)}s`;
  return `${Math.floor(total / 60)}m ${(total % 60).toFixed(1)}s`;
}

export function LoadingState({
  label = "Agent working...",
  variant = "Drive",
}: {
  label?: string;
  variant?: "Drive" | "Dots" | "Orbit";
}) {
  const elapsed = useElapsed();
  const { delays, dur, round } = PATTERNS[variant] ?? PATTERNS.Drive;

  return (
    <div
      role="status"
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "8px",
        padding: "6px 12px",
        backgroundColor: "rgba(15, 23, 42, 0.75)",
        backdropFilter: "blur(8px)",
        border: "1px solid rgba(56, 189, 248, 0.25)",
        borderRadius: "9999px",
        boxShadow: "0 0 15px rgba(56, 189, 248, 0.15)",
      }}
    >
      <style>{`
        @keyframes pixelPulse {
          0% { opacity: 0.15; transform: scale(0.9); }
          100% { opacity: 1; transform: scale(1.1); filter: drop-shadow(0 0 3px #38bdf8); }
        }
        @keyframes shimmerText {
          0% { opacity: 0.75; }
          50% { opacity: 1; }
          100% { opacity: 0.75; }
        }
      `}</style>
      <LoaderGrid delays={delays} dur={dur} round={round} />
      <span
        style={{
          fontSize: "12px",
          fontWeight: 600,
          color: "#38bdf8",
          animation: "shimmerText 1.4s ease-in-out infinite",
          letterSpacing: "-0.2px",
        }}
      >
        {label}
      </span>
      <span
        style={{
          fontFamily: "var(--font-mono, monospace)",
          fontSize: "11px",
          color: "#94a3b8",
          fontVariantNumeric: "tabular-nums",
        }}
      >
        {elapsed}
      </span>
    </div>
  );
}

export default LoadingState;
