"use client";

import React from "react";

/* ─────────────────────────────────────────────────────────
 * DOODLE ICONS & SKETCH ELEMENTS
 * Hand-drawn SVG illustrations for AirLink developer theme
 * ───────────────────────────────────────────────────────── */

export function DoodlePhoneFrame({
  children,
  width = 250,
  height = 450,
  style = {},
}: {
  children?: React.ReactNode;
  width?: number;
  height?: number;
  style?: React.CSSProperties;
}) {
  return (
    <div
      style={{
        position: "relative",
        width,
        height,
        ...style,
      }}
    >
      {/* Hand-Drawn Outer Smartphone Sketch Outline SVG */}
      <svg
        width={width}
        height={height}
        viewBox="0 0 250 450"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        style={{
          position: "absolute",
          inset: 0,
          pointerEvents: "none",
          zIndex: 10,
          overflow: "visible",
        }}
      >
        {/* Double-Line Sketched Phone Body */}
        <rect
          x="4"
          y="4"
          width="242"
          height="442"
          rx="28"
          stroke="#182030"
          strokeWidth="3.2"
          strokeLinejoin="round"
          strokeLinecap="round"
        />
        <rect
          x="7"
          y="7"
          width="236"
          height="436"
          rx="25"
          stroke="#556885"
          strokeWidth="1.2"
          strokeDasharray="4 2"
          opacity={0.6}
        />

        {/* Hand-Drawn Dynamic Island Notch */}
        <rect
          x="90"
          y="14"
          width="70"
          height="14"
          rx="7"
          fill="#182030"
          stroke="#182030"
          strokeWidth="1.5"
        />
        <circle cx="148" cy="21" r="2.5" fill="#228a7a" />

        {/* Sketched Volume Buttons */}
        <path d="M 1 80 L 1 110" stroke="#182030" strokeWidth="3" strokeLinecap="round" />
        <path d="M 1 125 L 1 155" stroke="#182030" strokeWidth="3" strokeLinecap="round" />
        {/* Power Button */}
        <path d="M 249 95 L 249 135" stroke="#182030" strokeWidth="3" strokeLinecap="round" />

        {/* Hand-Drawn Home Bar Indicator */}
        <path
          d="M 95 436 C 115 435, 135 435, 155 436"
          stroke="#182030"
          strokeWidth="3"
          strokeLinecap="round"
        />
      </svg>

      {/* Screen Inset Container */}
      <div
        style={{
          position: "absolute",
          top: 12,
          left: 12,
          right: 12,
          bottom: 12,
          borderRadius: 20,
          overflow: "hidden",
          backgroundColor: "#161e2e",
          zIndex: 1,
          display: "flex",
          flexDirection: "column",
        }}
      >
        {children}
      </div>
    </div>
  );
}

export function DoodleNarrowTuiFrame({
  children,
  width = 220,
  height = 380,
  style = {},
}: {
  children?: React.ReactNode;
  width?: number;
  height?: number;
  style?: React.CSSProperties;
}) {
  return (
    <div
      style={{
        position: "relative",
        width,
        height,
        ...style,
      }}
    >
      {/* Hand-Drawn Terminal Card Outline */}
      <svg
        width={width}
        height={height}
        viewBox="0 0 220 380"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        style={{
          position: "absolute",
          inset: 0,
          pointerEvents: "none",
          zIndex: 10,
          overflow: "visible",
        }}
      >
        <rect
          x="3"
          y="3"
          width="214"
          height="374"
          rx="14"
          stroke="#182030"
          strokeWidth="2.8"
          strokeLinejoin="round"
        />
        {/* Hand-drawn divider under titlebar */}
        <path
          d="M 4 32 C 70 31, 140 33, 216 32"
          stroke="#182030"
          strokeWidth="1.8"
          strokeDasharray="3 3"
        />
        {/* Sketched traffic light dots */}
        <circle cx="16" cy="18" r="3.5" fill="#c74444" stroke="#182030" strokeWidth="1.2" />
        <circle cx="28" cy="18" r="3.5" fill="#e5b771" stroke="#182030" strokeWidth="1.2" />
        <circle cx="40" cy="18" r="3.5" fill="#228a7a" stroke="#182030" strokeWidth="1.2" />
      </svg>

      {/* TUI Inset Content */}
      <div
        style={{
          position: "absolute",
          inset: 4,
          borderRadius: 12,
          overflow: "hidden",
          backgroundColor: "#161e2e",
          zIndex: 1,
          display: "flex",
          flexDirection: "column",
        }}
      >
        {children}
      </div>
    </div>
  );
}

export function DoodleCurvedArrow({
  label,
  flip = false,
  color = "#e08a5b",
}: {
  label?: string;
  flip?: boolean;
  color?: string;
}) {
  return (
    <div
      style={{
        display: "inline-flex",
        flexDirection: "column",
        alignItems: "center",
        transform: flip ? "scaleX(-1)" : "none",
      }}
    >
      {label && (
        <span
          style={{
            fontFamily: "var(--font-hand)",
            fontSize: 16,
            fontWeight: 700,
            color,
            transform: flip ? "scaleX(-1)" : "none",
            marginBottom: -4,
          }}
        >
          {label}
        </span>
      )}
      <svg width="70" height="40" viewBox="0 0 70 40" fill="none">
        <path
          d="M 5 10 C 25 35, 45 35, 60 15"
          stroke={color}
          strokeWidth="2.2"
          strokeLinecap="round"
          fill="none"
        />
        <path
          d="M 50 12 L 60 15 L 56 25"
          stroke={color}
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </div>
  );
}

export function DoodleRadioWaves() {
  return (
    <svg
      width="120"
      height="120"
      viewBox="0 0 120 120"
      fill="none"
      style={{ position: "absolute", pointerEvents: "none", overflow: "visible" }}
    >
      <path
        d="M 20 40 C 35 25, 65 25, 80 40"
        stroke="#e08a5b"
        strokeWidth="2"
        strokeLinecap="round"
        strokeDasharray="4 3"
        opacity={0.8}
      />
      <path
        d="M 10 30 C 30 10, 70 10, 90 30"
        stroke="#e08a5b"
        strokeWidth="2"
        strokeLinecap="round"
        strokeDasharray="5 4"
        opacity={0.5}
      />
      <path
        d="M 0 20 C 25 -5, 75 -5, 100 20"
        stroke="#e08a5b"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeDasharray="6 4"
        opacity={0.3}
      />
    </svg>
  );
}

export function DoodleSparkle({ color = "#e08a5b", size = 18 }: { color?: string; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path
        d="M 12 2 L 14 9 L 21 11 L 14 13 L 12 20 L 10 13 L 3 11 L 10 9 Z"
        fill={color}
        stroke={color}
        strokeWidth="1.2"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function DoodleCloud({ size = 28, color = "#556885" }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size * 0.65} viewBox="0 0 40 26" fill="none">
      <path
        d="M 10 20 C 6 20, 3 17, 3 13 C 3 9, 7 7, 10 8 C 11 4, 16 2, 21 3 C 26 4, 29 8, 29 11 C 32 11, 36 13, 36 17 C 36 21, 32 23, 28 23 C 24 23, 15 23, 10 20 Z"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="rgba(246, 239, 233, 0.6)"
      />
    </svg>
  );
}
