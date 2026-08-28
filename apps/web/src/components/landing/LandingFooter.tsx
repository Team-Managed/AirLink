"use client";

import React from "react";
import Link from "next/link";

export function LandingFooter() {
  return (
    <footer style={styles.footer}>
      <div style={styles.footerContainer}>
        <div style={styles.footerBrand}>
          <div style={styles.footerLogo}>AGENT REMOTE</div>
          <p style={styles.footerTagline}>
            Open-Source Universal Remote Control for Coding Agents.
          </p>
        </div>

        <div style={styles.footerLinks}>
          <div style={styles.footerCol}>
            <span style={styles.footerColTitle}>Platforms</span>
            <a href="#install" style={styles.footerLink}>
              CLI Host
            </a>
            <a href="#install" style={styles.footerLink}>
              VS Code Extension
            </a>
            <a href="#install" style={styles.footerLink}>
              Mobile App
            </a>
            <Link href="/pair" style={styles.footerLink}>
              Web Client
            </Link>
          </div>

          <div style={styles.footerCol}>
            <span style={styles.footerColTitle}>Open Source</span>
            <a
              href="https://github.com/agent-remote/agent-harness"
              target="_blank"
              rel="noreferrer"
              style={styles.footerLink}
            >
              GitHub Repository
            </a>
            <a
              href="https://github.com/agent-remote/agent-harness/issues"
              target="_blank"
              rel="noreferrer"
              style={styles.footerLink}
            >
              Issue Tracker
            </a>
            <a
              href="https://github.com/agent-remote/agent-harness/blob/main/LICENSE"
              target="_blank"
              rel="noreferrer"
              style={styles.footerLink}
            >
              MIT License
            </a>
          </div>
        </div>
      </div>

      <div style={styles.footerBottom}>
        <span>MIT Licensed. Built for the TrueFoundry AI Agent Hackathon.</span>
      </div>
    </footer>
  );
}

const styles: Record<string, React.CSSProperties> = {
  footer: {
    backgroundColor: "#05080f",
    borderTop: "1px solid #1e293b",
    padding: "60px 24px 30px",
  },
  footerContainer: {
    maxWidth: 1100,
    margin: "0 auto",
    display: "flex",
    justifyContent: "space-between",
    gap: 40,
    flexWrap: "wrap",
    marginBottom: 40,
  },
  footerBrand: {
    maxWidth: 320,
  },
  footerLogo: {
    fontFamily: "var(--font-mono)",
    fontWeight: 900,
    fontSize: 16,
    letterSpacing: 1.5,
    color: "#f8fafc",
    marginBottom: 10,
  },
  footerTagline: {
    color: "#64748b",
    fontSize: 13,
    lineHeight: 1.6,
  },
  footerLinks: {
    display: "flex",
    gap: 60,
    flexWrap: "wrap",
  },
  footerCol: {
    display: "flex",
    flexDirection: "column",
    gap: 10,
  },
  footerColTitle: {
    color: "#f8fafc",
    fontSize: 12,
    fontWeight: 700,
    letterSpacing: 1,
    fontFamily: "var(--font-mono)",
    marginBottom: 4,
  },
  footerLink: {
    color: "#94a3b8",
    fontSize: 13,
    transition: "color 0.2s",
  },
  footerBottom: {
    maxWidth: 1100,
    margin: "0 auto",
    borderTop: "1px solid #1e293b",
    paddingTop: 24,
    color: "#64748b",
    fontSize: 12,
    textAlign: "center",
  },
};
