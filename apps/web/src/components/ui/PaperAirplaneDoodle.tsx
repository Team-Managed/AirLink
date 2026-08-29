"use client";

import React from "react";

interface PaperAirplaneProps {
  size?: number;
  color?: string;
  trailColor?: string;
  showTrail?: boolean;
  className?: string;
  style?: React.CSSProperties;
}

export function PaperAirplaneDoodle({
  size = 32,
  color = "#182030",
  trailColor = "#e08a5b",
  showTrail = true,
  className = "",
  style = {},
}: PaperAirplaneProps) {
  return (
    <div
      className={className}
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        position: "relative",
        ...style,
      }}
    >
      <svg
        width={showTrail ? size * 2.2 : size}
        height={size}
        viewBox={showTrail ? "0 0 70 32" : "0 0 32 32"}
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        style={{ overflow: "visible" }}
      >
        {/* Hand-Drawn Dashed Loop Flight Trail */}
        {showTrail && (
          <path
            d="M 2 24 C 12 28, 16 12, 24 16 C 30 20, 32 24, 38 18"
            stroke={trailColor}
            strokeWidth="1.8"
            strokeDasharray="3 3.5"
            strokeLinecap="round"
            fill="none"
            opacity={0.7}
          />
        )}

        {/* Paper Aeroplane Origami Doodle Body */}
        <g transform={showTrail ? "translate(38, 2) rotate(-8)" : "translate(0, 0)"}>
          {/* Main Top Wing */}
          <path
            d="M 2 16 L 28 3 L 20 28 L 14 18 Z"
            fill="rgba(246, 239, 233, 0.65)"
            stroke={color}
            strokeWidth="1.8"
            strokeLinejoin="round"
            strokeLinecap="round"
          />
          {/* Fold Crease Line */}
          <path
            d="M 28 3 L 14 18"
            stroke={color}
            strokeWidth="1.8"
            strokeLinecap="round"
          />
          {/* Under Wing Flap */}
          <path
            d="M 14 18 L 18 24 L 20 28"
            stroke={color}
            strokeWidth="1.6"
            strokeLinejoin="round"
            strokeLinecap="round"
          />
          {/* Hand-drawn Shading Accent Hatch */}
          <path
            d="M 17 14 L 19 19"
            stroke={color}
            strokeWidth="1.2"
            strokeLinecap="round"
            opacity={0.6}
          />
        </g>
      </svg>
    </div>
  );
}

export function DoodleUnderline({ color = "#e08a5b" }: { color?: string }) {
  return (
    <svg
      width="100%"
      height="12"
      viewBox="0 0 240 12"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      style={{ display: "block", marginTop: -2 }}
    >
      <path
        d="M 3 8 C 50 2, 130 3, 237 7 M 40 10 C 90 6, 170 6, 215 9"
        stroke={color}
        strokeWidth="2.2"
        strokeLinecap="round"
        opacity={0.85}
      />
    </svg>
  );
}
