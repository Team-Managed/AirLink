"use client";

import React from "react";

interface IPhoneMockupProps {
  children?: React.ReactNode;
  width?: number | string;
  height?: number | string;
  style?: React.CSSProperties;
}

export function IPhoneMockupFrame({
  children,
  width = 270,
  height = 490,
  style = {},
}: IPhoneMockupProps) {
  return (
    <div
      style={{
        position: "relative",
        width,
        height,
        backgroundColor: "#0d111a",
        borderRadius: 44,
        padding: 10,
        boxShadow:
          "0 25px 60px -15px rgba(24, 32, 48, 0.45), 0 0 0 1px rgba(255, 255, 255, 0.18), inset 0 0 0 2px rgba(0, 0, 0, 0.8)",
        border: "1px solid rgba(24, 32, 48, 0.3)",
        ...style,
      }}
    >
      {/* Dynamic Island Pill */}
      <div
        style={{
          position: "absolute",
          top: 18,
          left: "50%",
          transform: "translateX(-50%)",
          width: 82,
          height: 20,
          backgroundColor: "#000000",
          borderRadius: 20,
          zIndex: 20,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "0 8px",
          boxShadow: "0 1px 3px rgba(0, 0, 0, 0.8)",
        }}
      >
        <span
          style={{
            width: 7,
            height: 7,
            borderRadius: "50%",
            backgroundColor: "#1c2438",
            display: "inline-block",
          }}
        />
        <span
          style={{
            width: 5,
            height: 5,
            borderRadius: "50%",
            backgroundColor: "#228a7a",
            display: "inline-block",
            boxShadow: "0 0 6px #228a7a",
          }}
        />
      </div>

      {/* Screen Inset Area */}
      <div
        style={{
          position: "relative",
          width: "100%",
          height: "100%",
          borderRadius: 34,
          overflow: "hidden",
          backgroundColor: "#161e2e",
          display: "flex",
          flexDirection: "column",
          zIndex: 1,
        }}
      >
        {children}

        {/* Clean Home Bar Indicator */}
        <div
          style={{
            position: "absolute",
            bottom: 6,
            left: "50%",
            transform: "translateX(-50%)",
            width: 100,
            height: 4,
            backgroundColor: "rgba(255, 255, 255, 0.35)",
            borderRadius: 4,
            zIndex: 20,
          }}
        />
      </div>
    </div>
  );
}

interface MacOSTerminalProps {
  children?: React.ReactNode;
  width?: number | string;
  height?: number | string;
  title?: string;
  style?: React.CSSProperties;
}

export function MacOSTerminalFrame({
  children,
  width = 240,
  height = 420,
  title = "airlink-host ~ (zsh)",
  style = {},
}: MacOSTerminalProps) {
  return (
    <div
      style={{
        position: "relative",
        width,
        height,
        backgroundColor: "#161e2e",
        borderRadius: 14,
        border: "1px solid rgba(255, 255, 255, 0.12)",
        boxShadow: "0 20px 50px -10px rgba(24, 32, 48, 0.35), 0 0 0 1px rgba(24, 32, 48, 0.2)",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
        ...style,
      }}
    >
      {/* macOS Titlebar */}
      <div
        style={{
          height: 34,
          backgroundColor: "#111824",
          borderBottom: "1px solid rgba(255, 255, 255, 0.08)",
          display: "flex",
          alignItems: "center",
          padding: "0 12px",
          gap: 7,
          userSelect: "none",
        }}
      >
        <span
          style={{
            width: 10,
            height: 10,
            borderRadius: "50%",
            backgroundColor: "#ff5f56",
            display: "inline-block",
          }}
        />
        <span
          style={{
            width: 10,
            height: 10,
            borderRadius: "50%",
            backgroundColor: "#ffbd2e",
            display: "inline-block",
          }}
        />
        <span
          style={{
            width: 10,
            height: 10,
            borderRadius: "50%",
            backgroundColor: "#27c93f",
            display: "inline-block",
          }}
        />
        <span
          style={{
            flex: 1,
            textAlign: "center",
            fontSize: 11,
            color: "#687a94",
            fontFamily: "var(--font-mono)",
            fontWeight: 600,
            paddingRight: 30,
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
          }}
        >
          {title}
        </span>
      </div>

      {/* Terminal Viewport */}
      <div
        style={{
          flex: 1,
          overflow: "hidden",
          position: "relative",
          display: "flex",
          flexDirection: "column",
        }}
      >
        {children}
      </div>
    </div>
  );
}
