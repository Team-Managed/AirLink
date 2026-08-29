"use client";

import React, { useEffect, useState } from "react";

/* ─────────────────────────────────────────────────────────
 * LOADING STATE — pixel-grid loader for long-running work
 *
 * Variants:
 *   Drive  — square cells, chevron wavefront driving right
 *   Dots   — same wavefront, circular cells
 *   Orbit  — a comet lapping the grid perimeter
 *   Surfer — the Drive loader paired with context video
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
        display: "grid",
        gridTemplateColumns: "repeat(3, 4px)",
        gap: 2,
        flexShrink: 0,
      }}
    >
      {delays.map((delay, index) => (
        <span
          key={index}
          style={{
            width: 4,
            height: 4,
            backgroundColor: "var(--ink, #ffffff)",
            borderRadius: round ? "50%" : 1,
            opacity: delay === null ? 0.07 : 0.2,
            animation: delay === null ? "none" : `pixel-on ${dur}ms ease-in-out ${delay}ms infinite`,
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
  label,
  variant = "Drive",
  videoSrc = "/subway-surfers.mp4",
}: {
  label?: string;
  variant?: string;
  videoSrc?: string;
}) {
  const elapsed = useElapsed();
  const surfer = variant === "Surfer";
  const resolvedLabel = label ?? (surfer ? "Subway surfing" : "Processing turn");
  const [videoOk, setVideoOk] = useState(true);
  const { delays, dur, round } = PATTERNS[variant] ?? PATTERNS.Drive;

  const labelEl = (
    <span
      style={{
        fontSize: 11.5,
        fontWeight: 600,
        color: "transparent",
        backgroundImage:
          "linear-gradient(90deg, #94a3b8 35%, #ffffff 50%, #94a3b8 65%)",
        backgroundSize: "200% 100%",
        WebkitBackgroundClip: "text",
        animation: "shimmer-text 1.4s linear infinite",
      }}
    >
      {resolvedLabel}
    </span>
  );

  const elapsedEl = (
    <span
      style={{
        fontFamily: "var(--font-mono)",
        fontSize: 10.5,
        color: "#94a3b8",
        fontVariantNumeric: "tabular-nums",
      }}
    >
      {elapsed}
    </span>
  );

  if (surfer) {
    return (
      <div role="status" style={{ display: "flex", flexDirection: "column", alignItems: "flex-start", gap: 6 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <LoaderGrid {...PATTERNS.Drive} />
          {labelEl}
          {elapsedEl}
        </div>

        <div
          style={{
            marginTop: 6,
            width: 180,
            overflow: "hidden",
            borderRadius: 8,
            border: "1px solid rgba(255, 255, 255, 0.1)",
            boxShadow: "0 8px 24px rgba(0, 0, 0, 0.4)",
            animation: "pop-in 200ms cubic-bezier(0.16, 1, 0.3, 1) both",
            transformOrigin: "top left",
          }}
        >
          <div style={{ position: "relative", width: "100%", aspectRatio: "16/9", background: "#030712" }}>
            {videoOk ? (
              <video
                src={videoSrc}
                autoPlay
                muted
                loop
                playsInline
                onError={() => setVideoOk(false)}
                style={{ height: "100%", width: "100%", objectFit: "cover" }}
              />
            ) : (
              <div style={{ display: "flex", height: "100%", width: "100%", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 6 }}>
                <LoaderGrid {...PATTERNS.Drive} />
                <span style={{ padding: "0 10px", textAlign: "center", fontFamily: "var(--font-mono)", fontSize: 9.5, color: "#64748b" }}>
                  Feed active
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div role="status" style={{ display: "inline-flex", alignItems: "center", gap: 7 }}>
      <LoaderGrid delays={delays} dur={dur} round={round} />
      {labelEl}
      {elapsedEl}
    </div>
  );
}

export default LoadingState;
