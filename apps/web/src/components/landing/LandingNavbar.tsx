"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { AirLinkAgentLogo } from "../ui/AirLinkAgentLogo";

export function LandingNavbar() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <header style={styles.headerWrapper}>
      <nav
        style={{
          ...styles.glassNav,
          ...(scrolled ? styles.glassNavScrolled : {}),
        }}
      >
        {/* Animated Origami Airplane & Agent Doodle Logo */}
        <Link href="/" style={styles.brandLink}>
          <AirLinkAgentLogo size={32} showText={true} textColor="#0f172a" />
        </Link>

        {/* Center Navigation Links with Frosted Hover Pills */}
        <div style={styles.navLinks}>
          <a href="#features" style={styles.navLink}>
            Features
          </a>
          <a href="#how-it-works" style={styles.navLink}>
            How It Works
          </a>
          <a href="#faqs" style={styles.navLink}>
            FAQs
          </a>
          <a href="#support" style={styles.navLink}>
            Customer Support
          </a>
        </div>

        {/* Right CTA Button */}
        <a
          href="https://expo.dev/accounts/tyraaa19/projects/airlink-monorepo/builds/6f4f8f2a-a760-469c-93e0-4f32bedf3e61"
          target="_blank"
          rel="noreferrer"
          style={styles.launchBtn}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3" />
          </svg>
          <span>Download App (.APK)</span>
        </a>
      </nav>
    </header>
  );
}

const styles: Record<string, React.CSSProperties> = {
  headerWrapper: {
    position: "fixed",
    top: 14,
    left: 0,
    right: 0,
    zIndex: 100,
    width: "100%",
    padding: "0 24px",
    display: "flex",
    justifyContent: "center",
    pointerEvents: "none",
  },
  glassNav: {
    pointerEvents: "auto",
    width: "100%",
    maxWidth: 1140,
    margin: "0 auto",
    padding: "8px 12px 8px 20px",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.72)",
    backdropFilter: "blur(24px) saturate(190%)",
    WebkitBackdropFilter: "blur(24px) saturate(190%)",
    border: "1px solid rgba(255, 255, 255, 0.95)",
    borderRadius: 9999,
    boxShadow: "0 8px 28px rgba(0, 0, 0, 0.04), inset 0 1px 2px rgba(255, 255, 255, 1)",
    outline: "none",
    transition: "all 0.25s cubic-bezier(0.16, 1, 0.3, 1)",
  },
  glassNavScrolled: {
    backgroundColor: "rgba(255, 255, 255, 0.88)",
    backdropFilter: "blur(28px) saturate(200%)",
    WebkitBackdropFilter: "blur(28px) saturate(200%)",
    border: "1px solid rgba(255, 255, 255, 0.95)",
    boxShadow: "0 12px 36px rgba(0, 0, 0, 0.07), inset 0 1px 2px rgba(255, 255, 255, 1)",
  },
  brandLink: {
    display: "flex",
    alignItems: "center",
    gap: 9,
    textDecoration: "none",
  },
  navLinks: {
    display: "flex",
    alignItems: "center",
    gap: 6,
  },
  navLink: {
    color: "#334155",
    fontSize: 13.5,
    fontWeight: 600,
    textDecoration: "none",
    padding: "6px 14px",
    borderRadius: 9999,
    transition: "all 0.15s ease",
  },
  rightActions: {
    display: "flex",
    alignItems: "center",
    gap: 8,
  },
  downloadNavBtn: {
    display: "inline-flex",
    alignItems: "center",
    gap: 6,
    backgroundColor: "rgba(15, 23, 42, 0.08)",
    color: "#0f172a",
    padding: "8px 14px",
    borderRadius: 9999,
    fontSize: 12.5,
    fontWeight: 700,
    textDecoration: "none",
    border: "1px solid rgba(15, 23, 42, 0.12)",
    transition: "all 0.15s ease",
  },
  launchBtn: {
    display: "inline-flex",
    alignItems: "center",
    gap: 8,
    background: "linear-gradient(135deg, #5b9bd5 0%, #3e82c5 100%)",
    color: "#ffffff",
    padding: "9px 18px",
    borderRadius: 9999,
    fontSize: 13,
    fontWeight: 700,
    textDecoration: "none",
    border: "1px solid rgba(255, 255, 255, 0.35)",
    boxShadow: "0 4px 14px rgba(62, 130, 197, 0.35)",
    transition: "all 0.15s ease",
  },
};
