"use client";

import React from "react";
import Link from "next/link";

export function LandingNavbar() {
  return (
    <nav style={styles.nav}>
      <div style={styles.navContainer}>
        <div style={styles.brandRow}>
          <span style={styles.brandTitle}>AGENT REMOTE</span>
          <span style={styles.versionBadge}>v0.1.0</span>
        </div>

        <div style={styles.navLinks}>
          <a href="#features" style={styles.navLink}>
            Features
          </a>
          <a href="#architecture" style={styles.navLink}>
            Architecture
          </a>
          <a href="#install" style={styles.navLink}>
            Install
          </a>
          <a
            href="https://github.com/agent-remote/agent-harness"
            target="_blank"
            rel="noreferrer"
            style={styles.githubLink}
          >
            GitHub
          </a>
          <Link href="/pair" style={styles.launchButton}>
            Launch Web Client
          </Link>
        </div>
      </div>
    </nav>
  );
}

const styles: Record<string, React.CSSProperties> = {
  nav: {
    position: "sticky",
    top: 0,
    zIndex: 50,
    backgroundColor: "rgba(9, 13, 22, 0.85)",
    backdropFilter: "blur(12px)",
    borderBottom: "1px solid #1e293b",
  },
  navContainer: {
    maxWidth: 1200,
    margin: "0 auto",
    padding: "16px 24px",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },
  brandRow: {
    display: "flex",
    alignItems: "center",
    gap: 10,
  },
  brandTitle: {
    fontFamily: "var(--font-mono)",
    fontWeight: 800,
    fontSize: 16,
    letterSpacing: 1.5,
    color: "#f8fafc",
  },
  versionBadge: {
    backgroundColor: "rgba(56, 189, 248, 0.1)",
    border: "1px solid #38bdf8",
    color: "#38bdf8",
    padding: "2px 6px",
    borderRadius: 4,
    fontSize: 10,
    fontWeight: 700,
    fontFamily: "var(--font-mono)",
  },
  navLinks: {
    display: "flex",
    alignItems: "center",
    gap: 24,
  },
  navLink: {
    color: "#94a3b8",
    fontSize: 13,
    fontWeight: 500,
    transition: "color 0.2s",
  },
  githubLink: {
    color: "#94a3b8",
    fontSize: 13,
    fontWeight: 500,
  },
  launchButton: {
    backgroundColor: "#38bdf8",
    color: "#090d16",
    padding: "8px 16px",
    borderRadius: 6,
    fontSize: 13,
    fontWeight: 700,
  },
};
