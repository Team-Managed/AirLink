"use client";

import React, { useState, useEffect, useRef } from "react";

const QUESTIONS = [
  {
    q: "Authorize bash tool execution on PC?",
    cmd: "pnpm --filter @agent-remote/relay test",
    risk: "Medium Risk",
    options: ["Approve & Run", "Review Diff First", "Deny Command"],
  },
  {
    q: "Commit modified rate-limiter.ts?",
    cmd: "git commit -m 'fix(relay): purge expired sliding window buckets'",
    risk: "Low Risk",
    options: ["Commit & Push", "Commit Local Only", "Cancel"],
  },
];

const ROLL_MS = 350;

function RollingDigits({ value }: { value: string }) {
  const prevRef = useRef(value);
  const [oldVal, setOldVal] = useState(value);
  const [newVal, setNewVal] = useState(value);
  const [rolling, setRolling] = useState(false);
  const [shifted, setShifted] = useState(false);

  useEffect(() => {
    if (prevRef.current === value) return;
    prevRef.current = value;
    setOldVal(prevRef.current);
    setNewVal(value);
    setRolling(true);
    setShifted(false);

    const raf1 = requestAnimationFrame(() => {
      requestAnimationFrame(() => setShifted(true));
    });
    const done = setTimeout(() => {
      setRolling(false);
      setOldVal(value);
      setShifted(false);
    }, ROLL_MS);

    return () => {
      cancelAnimationFrame(raf1);
      clearTimeout(done);
    };
  }, [value]);

  return (
    <span style={{ display: "inline-block", overflow: "hidden", height: "1em", lineHeight: "1em", verticalAlign: "-0.05em" }}>
      <span
        style={{
          display: "flex",
          flexDirection: "column",
          transition: "transform 350ms cubic-bezier(0.4, 0, 0.2, 1)",
          transform: `translateY(${shifted ? "-1em" : "0"})`,
        }}
      >
        <span style={{ height: "1em", lineHeight: "1em" }}>{rolling ? oldVal : newVal}</span>
        <span style={{ height: "1em", lineHeight: "1em" }}>{newVal}</span>
      </span>
    </span>
  );
}

export function ApprovalCard({
  onSubmitted,
}: {
  onSubmitted?: () => void;
}) {
  const [qi, setQi] = useState(0);
  const [picked, setPicked] = useState<number | null>(0);
  const [sent, setSent] = useState(false);
  const [countdown, setCountdown] = useState(180);

  useEffect(() => {
    if (sent) return;
    const t = setInterval(() => setCountdown((c) => (c > 1 ? c - 1 : 180)), 1000);
    return () => clearInterval(t);
  }, [sent]);

  const currentQ = QUESTIONS[qi];

  const handleAdvance = () => {
    if (qi < QUESTIONS.length - 1) {
      setQi(qi + 1);
      setPicked(0);
    } else {
      setSent(true);
      onSubmitted?.();
    }
  };

  const handleReset = () => {
    setQi(0);
    setPicked(0);
    setSent(false);
    setCountdown(180);
  };

  if (sent) {
    return (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          backgroundColor: "rgba(34, 138, 122, 0.15)",
          border: "1.5px solid #228a7a",
          padding: "10px 14px",
          borderRadius: "10px",
          width: "100%",
          maxWidth: 360,
          animation: "pop-in 260ms ease both",
        }}
      >
        <span style={{ display: "inline-flex", alignItems: "center", gap: 6, color: "#228a7a", fontWeight: 800, fontSize: 12 }}>
          <span>✓</span> Action authorized on mobile device
        </span>
        <button
          type="button"
          onClick={handleReset}
          style={{
            backgroundColor: "transparent",
            border: "none",
            color: "#687a94",
            fontSize: 11,
            fontWeight: 700,
            cursor: "pointer",
          }}
        >
          Reset
        </button>
      </div>
    );
  }

  return (
    <div
      className="saas-card"
      style={{
        backgroundColor: "#f6efe9",
        borderRadius: "14px",
        padding: "18px",
        width: "100%",
        maxWidth: 360,
      }}
    >
      {/* Top Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <span style={{ width: 7, height: 7, borderRadius: "50%", backgroundColor: "#e08a5b" }} />
          <span style={{ color: "#e08a5b", fontSize: 11, fontWeight: 700, letterSpacing: 0.5, fontFamily: "var(--font-mono)" }}>
            HITL INTERCEPTION GATE
          </span>
        </div>
        <span style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "#e08a5b", fontWeight: 700 }}>
          {countdown}s
        </span>
      </div>

      <h4 style={{ color: "#182030", fontSize: 13, fontWeight: 800, marginBottom: 6 }}>
        {currentQ.q}
      </h4>

      <div
        style={{
          backgroundColor: "#161e2e",
          padding: "7px 10px",
          borderRadius: "6px",
          border: "1px solid rgba(255, 255, 255, 0.1)",
          marginBottom: 10,
        }}
      >
        <code style={{ color: "#e08a5b", fontSize: 11, fontFamily: "var(--font-mono)" }}>
          {currentQ.cmd}
        </code>
      </div>

      {/* Options Radio List */}
      <div style={{ display: "flex", flexDirection: "column", gap: 5, marginBottom: 12 }}>
        {currentQ.options.map((opt, i) => (
          <button
            key={opt}
            type="button"
            onClick={() => setPicked(i)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              padding: "7px 10px",
              borderRadius: "6px",
              backgroundColor: picked === i ? "rgba(224, 138, 91, 0.12)" : "#ebe3d9",
              border: picked === i ? "1px solid #e08a5b" : "1px solid rgba(24, 32, 48, 0.12)",
              cursor: "pointer",
              textAlign: "left",
              transition: "all 0.15s ease",
            }}
          >
            <span
              style={{
                width: 12,
                height: 12,
                borderRadius: "50%",
                border: picked === i ? "3px solid #e08a5b" : "1px solid #687a94",
                backgroundColor: picked === i ? "#182030" : "transparent",
              }}
            />
            <span style={{ fontSize: 12, color: "#182030", fontWeight: picked === i ? 700 : 500 }}>
              {opt}
            </span>
          </button>
        ))}
      </div>

      {/* Footer Nav & Submit */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderTop: "1px solid rgba(24, 32, 48, 0.1)", paddingTop: 10 }}>
        <span style={{ fontSize: 11, color: "#687a94", fontFamily: "var(--font-mono)", fontWeight: 600 }}>
          Question <RollingDigits value={`${qi + 1}`} /> of {QUESTIONS.length}
        </span>
        <div style={{ display: "flex", gap: 6 }}>
          <button
            type="button"
            onClick={handleAdvance}
            style={{
              backgroundColor: "#182030",
              color: "#f8fafc",
              border: "1px solid rgba(255, 255, 255, 0.12)",
              padding: "6px 14px",
              borderRadius: "6px",
              fontSize: 12,
              fontWeight: 700,
              cursor: "pointer",
              boxShadow: "0 2px 6px rgba(24, 32, 48, 0.2)",
              transition: "all 0.15s ease",
            }}
          >
            {qi === QUESTIONS.length - 1 ? "Submit Approval" : "Next"}
          </button>
        </div>
      </div>
    </div>
  );
}
