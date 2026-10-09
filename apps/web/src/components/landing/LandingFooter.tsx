"use client";

import React from "react";
import { AirLinkAgentLogo } from "../ui/AirLinkAgentLogo";

export function LandingFooter() {
  return (
    <footer className="footer-responsive" style={styles.footer}>
      <div style={styles.container}>
        {/* Main Footer Row */}
        <div className="footer-top-row-responsive" style={styles.topRow}>
          {/* Brand Column */}
          <div style={styles.brandCol}>
            <div style={styles.brandTitleRow}>
              <AirLinkAgentLogo size={30} showText={true} textColor="#ffffff" />
            </div>
            <p style={styles.brandTagline}>
              Simplifying the way you supervise, teleoperate, and deploy autonomous coding agents with tools designed for speed.
            </p>
          </div>

          {/* Navigation Links */}
          <div style={styles.linksCol}>
            <span style={styles.colHeader}>NAVIGATION</span>
            <div style={styles.navLinksRow}>
              <a href="#features" style={styles.footerLink}>
                Features
              </a>
              <a href="#how-it-works" style={styles.footerLink}>
                How It Works
              </a>
              <a href="#faqs" style={styles.footerLink}>
                FAQs
              </a>
              <a
                href="https://github.com/Team-Managed/AirLink"
                target="_blank"
                rel="noreferrer"
                style={styles.footerLink}
              >
                GitHub
              </a>
              <a
                href="https://github.com/Team-Managed/AirLink/blob/main/LICENSE"
                target="_blank"
                rel="noreferrer"
                style={styles.footerLink}
              >
                MIT License
              </a>
            </div>
          </div>
        </div>

        {/* Bottom Status & Copyright */}
        <div style={styles.bottomRow}>
          <span style={styles.copyright}>
            &copy; 2026 AirLink
          </span>
          <div style={styles.statusPill}>
            <span style={styles.statusDot} />
            <span>Relay Network: Operational</span>
          </div>
        </div>
      </div>
    </footer>
  );
}

const styles: Record<string, React.CSSProperties> = {
  footer: {
    backgroundColor: "#090d16",
    backgroundImage: "linear-gradient(180deg, #090d16 0%, #04070e 100%)",
    borderTop: "1px solid rgba(255, 255, 255, 0.08)",
    padding: "54px 24px 34px",
    position: "relative",
    zIndex: 10,
    fontFamily: "var(--font-sans)",
  },
  container: {
    maxWidth: 1140,
    margin: "0 auto",
    display: "flex",
    flexDirection: "column",
    gap: 36,
  },
  topRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    flexWrap: "wrap",
    gap: 36,
  },
  brandCol: {
    display: "flex",
    flexDirection: "column",
    gap: 12,
    maxWidth: 420,
  },
  brandTitleRow: {
    display: "flex",
    alignItems: "center",
    gap: 10,
  },
  brandTagline: {
    color: "#94a3b8",
    fontSize: 13.5,
    lineHeight: 1.65,
    margin: 0,
  },
  linksCol: {
    display: "flex",
    flexDirection: "column",
    gap: 12,
  },
  colHeader: {
    fontSize: 11.5,
    fontWeight: 700,
    color: "#64748b",
    letterSpacing: 1,
    textTransform: "uppercase",
    marginBottom: 2,
  },
  navLinksRow: {
    display: "flex",
    flexWrap: "wrap",
    alignItems: "center",
    gap: 22,
  },
  footerLink: {
    color: "#cbd5e1",
    fontSize: 13.5,
    fontWeight: 500,
    textDecoration: "none",
    transition: "color 0.15s ease",
  },
  bottomRow: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: 24,
    borderTop: "1px solid rgba(255, 255, 255, 0.06)",
    flexWrap: "wrap",
    gap: 16,
  },
  copyright: {
    fontSize: 12.5,
    color: "#64748b",
  },
  statusPill: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    fontSize: 12,
    color: "#94a3b8",
    fontFamily: "var(--font-mono)",
    backgroundColor: "rgba(255, 255, 255, 0.04)",
    border: "1px solid rgba(255, 255, 255, 0.09)",
    padding: "4px 12px",
    borderRadius: 9999,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: "50%",
    backgroundColor: "#10b981",
    boxShadow: "0 0 8px rgba(16, 185, 129, 0.7)",
  },
};
