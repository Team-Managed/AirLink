"use client";

import React, { useState } from "react";
import Link from "next/link";
import { AirLinkAgentLogo } from "../ui/AirLinkAgentLogo";

export function LandingFooter() {
  const [email, setEmail] = useState("");
  const [isSubscribing, setIsSubscribing] = useState(false);
  const [subscribed, setSubscribed] = useState(false);
  const [subscribeError, setSubscribeError] = useState<string | null>(null);

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;

    setIsSubscribing(true);
    setSubscribeError(null);

    try {
      const res = await fetch("/api/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim() }),
      });

      const data = await res.json();
      if (res.ok && data.ok) {
        setSubscribed(true);
        setEmail("");
        setTimeout(() => setSubscribed(false), 5000);
      } else {
        setSubscribeError(data.error || "Failed to subscribe");
        setTimeout(() => setSubscribeError(null), 4000);
      }
    } catch {
      setSubscribeError("Network error. Please try again.");
      setTimeout(() => setSubscribeError(null), 4000);
    } finally {
      setIsSubscribing(false);
    }
  };

  return (
    <footer style={styles.footer}>
      <div style={styles.container}>
        <div style={styles.topRow}>
          {/* Brand Column */}
          <div style={styles.brandCol}>
            <div style={styles.brandTitleRow}>
              <AirLinkAgentLogo size={32} showText={true} textColor="#0f172a" />
            </div>
            <p style={styles.brandTagline}>
              Simplifying the way you supervise, teleoperate, and deploy autonomous coding agents with tools designed for speed.
            </p>
          </div>

          {/* SITE MAP */}
          <div style={styles.linksCol}>
            <span style={styles.colHeader}>SITE MAP</span>
            <a href="#features" style={styles.footerLink}>
              Features
            </a>
            <a href="#architecture" style={styles.footerLink}>
              Architecture
            </a>
            <a href="#install" style={styles.footerLink}>
              Install Guide
            </a>
            <Link href="/pair" style={styles.footerLink}>
              Web Remote
            </Link>
          </div>

          {/* RESOURCES */}
          <div style={styles.linksCol}>
            <span style={styles.colHeader}>RESOURCES</span>
            <a
              href="https://github.com/agent-remote/agent-harness"
              target="_blank"
              rel="noreferrer"
              style={styles.footerLink}
            >
              GitHub Repository
            </a>
            <a
              href="https://github.com/agent-remote/agent-harness/blob/main/LICENSE"
              target="_blank"
              rel="noreferrer"
              style={styles.footerLink}
            >
              MIT License
            </a>
            <a href="#architecture" style={styles.footerLink}>
              Protocol Specs
            </a>
            <span style={styles.footerItem}>TrueFoundry AI Agent Track</span>
          </div>

          {/* JOIN US */}
          <div style={styles.joinCol}>
            <span style={styles.colHeader}>JOIN US</span>
            <div style={styles.socialRow}>
              {/* GitHub */}
              <a
                href="https://github.com/agent-remote/agent-harness"
                target="_blank"
                rel="noreferrer"
                style={styles.socialCircle}
                title="GitHub"
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2">
                  <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22" />
                </svg>
              </a>
              {/* Twitter / X */}
              <a
                href="https://twitter.com"
                target="_blank"
                rel="noreferrer"
                style={styles.socialCircle}
                title="Twitter / X"
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2">
                  <path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z" />
                </svg>
              </a>
              {/* Discord */}
              <a
                href="https://discord.com"
                target="_blank"
                rel="noreferrer"
                style={styles.socialCircle}
                title="Discord"
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2">
                  <circle cx="12" cy="12" r="10" />
                  <path d="M8 12h.01M16 12h.01M9.5 16c1.5 1 3.5 1 5 0" />
                </svg>
              </a>
            </div>

            {/* Email / PIN Subscribe Pill */}
            <div>
              <form onSubmit={handleSubscribe} style={styles.subscribePill}>
                <input
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  disabled={isSubscribing}
                  onChange={(e) => setEmail(e.target.value)}
                  style={styles.subscribeInput}
                />
                <button type="submit" disabled={isSubscribing} style={styles.subscribeBtn}>
                  {isSubscribing ? "..." : subscribed ? "Subscribed!" : "Subscribe"}
                </button>
              </form>
              {subscribeError && (
                <span style={{ fontSize: 11.5, color: "#dc2626", marginTop: 4, display: "block" }}>
                  {subscribeError}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Bottom Status & Copyright */}
        <div style={styles.bottomRow}>
          <span style={styles.copyright}>
            &copy; {new Date().getFullYear()} AirLink. Built for the TrueFoundry AI Agent Hackathon.
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
    borderTop: "1px solid #e2e8f0",
    backgroundColor: "#ffffff",
    padding: "64px 24px 40px",
    position: "relative",
    zIndex: 10,
  },
  container: {
    maxWidth: 1200,
    margin: "0 auto",
    display: "flex",
    flexDirection: "column",
    gap: 48,
  },
  topRow: {
    display: "grid",
    gridTemplateColumns: "1.4fr 0.9fr 1fr 1.3fr",
    gap: 48,
  },
  brandCol: {
    display: "flex",
    flexDirection: "column",
    gap: 12,
  },
  brandTitleRow: {
    display: "flex",
    alignItems: "center",
    gap: 10,
  },
  logoMark: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  brandName: {
    fontFamily: "var(--font-display)",
    fontSize: 19,
    fontWeight: 800,
    color: "#0f172a",
    letterSpacing: -0.5,
  },
  brandTagline: {
    color: "#64748b",
    fontSize: 13.5,
    lineHeight: 1.6,
    maxWidth: 320,
  },
  linksCol: {
    display: "flex",
    flexDirection: "column",
    gap: 12,
  },
  colHeader: {
    fontSize: 12,
    fontWeight: 700,
    color: "#94a3b8",
    letterSpacing: 0.8,
    textTransform: "uppercase",
    marginBottom: 4,
  },
  footerLink: {
    color: "#334155",
    fontSize: 13.5,
    fontWeight: 500,
    textDecoration: "none",
    transition: "color 0.15s ease",
  },
  footerItem: {
    color: "#64748b",
    fontSize: 13.5,
  },
  joinCol: {
    display: "flex",
    flexDirection: "column",
    gap: 14,
  },
  socialRow: {
    display: "flex",
    gap: 10,
  },
  socialCircle: {
    width: 36,
    height: 36,
    borderRadius: "50%",
    border: "1px solid #e2e8f0",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#ffffff",
    transition: "all 0.15s ease",
    textDecoration: "none",
  },
  subscribePill: {
    display: "flex",
    alignItems: "center",
    backgroundColor: "#ffffff",
    border: "1px solid #e2e8f0",
    borderRadius: 9999,
    padding: "4px 4px 4px 14px",
    width: "100%",
    maxWidth: 320,
    boxShadow: "0 1px 3px rgba(0, 0, 0, 0.04)",
  },
  subscribeInput: {
    flex: 1,
    border: "none",
    backgroundColor: "transparent",
    outline: "none",
    fontSize: 12.5,
    color: "#0f172a",
    minWidth: 0,
  },
  subscribeBtn: {
    background: "linear-gradient(135deg, #5b9bd5 0%, #3e82c5 100%)",
    color: "#ffffff",
    border: "1px solid rgba(255, 255, 255, 0.35)",
    borderRadius: 9999,
    padding: "7px 16px",
    fontSize: 12,
    fontWeight: 700,
    cursor: "pointer",
    whiteSpace: "nowrap",
    boxShadow: "0 2px 8px rgba(62, 130, 197, 0.35)",
    transition: "all 0.15s ease",
  },
  bottomRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    borderTop: "1px solid #f1f5f9",
    paddingTop: 24,
    flexWrap: "wrap",
    gap: 12,
  },
  copyright: {
    color: "#94a3b8",
    fontSize: 12.5,
  },
  statusPill: {
    display: "inline-flex",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#f8fafc",
    border: "1px solid #e2e8f0",
    padding: "3px 10px",
    borderRadius: 9999,
    fontSize: 11.5,
    color: "#0f766e",
    fontWeight: 600,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: "50%",
    backgroundColor: "#10b981",
  },
};
