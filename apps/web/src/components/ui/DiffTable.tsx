"use client";

import React, { useState } from "react";

const ROWS = [
  { key: "rate", id: "rate-limiter.ts", dept: "Relay", delta: "+4 -1", removed: true },
  { key: "buffer", id: "ring-buffer.ts", dept: "Core", delta: "+12 -0", removed: false },
  { key: "vault", id: "vault.ts", dept: "Mobile", delta: "+8 -2", removed: false },
];

export function DiffTable() {
  const [accepted, setAccepted] = useState(false);
  const [edits, setEdits] = useState<Record<string, boolean>>({
    rate: true,
    buffer: true,
    vault: true,
  });

  const toggleEdit = (key: string) =>
    setEdits((current) => ({ ...current, [key]: !current[key] }));

  return (
    <div
      className="saas-card"
      style={{
        width: "100%",
        maxWidth: 380,
        backgroundColor: "#f6efe9",
        borderRadius: "14px",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "10px 14px",
          borderBottom: "1px solid rgba(24, 32, 48, 0.1)",
        }}
      >
        <span style={{ fontSize: 12.5, fontWeight: 700, color: "#182030" }}>
          Proposed Workspace Diffs
        </span>
        <span style={{ fontSize: 11, color: "#687a94", fontWeight: 500 }}>Click row to toggle</span>
      </div>

      <div style={{ display: "flex", flexDirection: "column" }}>
        {ROWS.map((row) => {
          const on = edits[row.key];
          return (
            <div
              key={row.key}
              onClick={() => toggleEdit(row.key)}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "8px 14px",
                borderBottom: "1px solid rgba(24, 32, 48, 0.06)",
                backgroundColor: on ? "rgba(224, 138, 91, 0.1)" : "transparent",
                cursor: "pointer",
                transition: "background-color 0.15s ease",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span
                  style={{
                    width: 14,
                    height: 14,
                    borderRadius: 3,
                    backgroundColor: on ? "#e08a5b" : "rgba(24, 32, 48, 0.12)",
                    color: "#ffffff",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 9,
                    fontWeight: 800,
                  }}
                >
                  {on ? "✓" : ""}
                </span>
                <span style={{ fontFamily: "var(--font-mono)", fontSize: 12, color: on ? "#182030" : "#687a94", fontWeight: 600 }}>
                  {row.id}
                </span>
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span
                  style={{
                    fontSize: 10.5,
                    fontWeight: 700,
                    backgroundColor: "#ebe3d9",
                    border: "1px solid rgba(24, 32, 48, 0.1)",
                    padding: "2px 6px",
                    borderRadius: 4,
                    color: "#35455e",
                  }}
                >
                  {row.dept}
                </span>
                <span style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "#228a7a", fontWeight: 700 }}>
                  {row.delta}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "8px 14px",
          borderTop: "1px solid rgba(24, 32, 48, 0.1)",
          backgroundColor: "#ebe3d9",
        }}
      >
        <span style={{ fontSize: 11, color: "#687a94", fontFamily: "var(--font-mono)", fontWeight: 600 }}>
          3 files modified &middot; 0 conflicts
        </span>
        <button
          type="button"
          onClick={() => setAccepted(true)}
          style={{
            backgroundColor: accepted ? "rgba(34, 138, 122, 0.15)" : "#182030",
            border: accepted ? "1px solid #228a7a" : "1px solid rgba(255, 255, 255, 0.12)",
            color: accepted ? "#228a7a" : "#f8fafc",
            padding: "5px 14px",
            borderRadius: 6,
            fontSize: 11,
            fontWeight: 700,
            cursor: "pointer",
            boxShadow: accepted ? "none" : "0 1px 4px rgba(24, 32, 48, 0.2)",
            transition: "all 0.15s ease",
          }}
        >
          {accepted ? "✓ Applied" : "Apply Diffs"}
        </button>
      </div>
    </div>
  );
}
