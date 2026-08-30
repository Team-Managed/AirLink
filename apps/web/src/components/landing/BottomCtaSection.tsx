"use client";

import React from "react";

export function BottomCtaSection() {
  return (
    <section style={styles.ctaSection}>
      <div style={styles.cardContainer}>
        {/* Bright, Vivid Hero Artwork Background inside the Box */}
        <div style={styles.cardArtwork} />

        {/* Soft Luminous Daylight Vignette */}
        <div style={styles.cardOverlay} />

        {/* Foreground Content with Solid Black Typography */}
        <div style={styles.content}>
          <h2 style={styles.title}>
            Teleoperate Your Agents <br />
            From Any Phone or Browser.
          </h2>
          <p style={styles.description}>
            Zero port-forwarding, end-to-end encrypted PIN authentication, and sub-50ms token streaming.
            Leave your workstation with full peace of mind.
          </p>

          {/* Primary Download App Button */}
          <div style={styles.downloadWrapper}>
            <a
              href="https://expo.dev/accounts/tyraaa19/projects/airlink-monorepo/builds/6f4f8f2a-a760-469c-93e0-4f32bedf3e61"
              target="_blank"
              rel="noreferrer"
              style={styles.pairBtn}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3" />
              </svg>
              <span>Download Android App (.APK)</span>
            </a>
          </div>

          <div style={styles.trustRow}>
            <span>100% Local-First</span>
            <span>•</span>
            <span>Zero Data Retention</span>
            <span>•</span>
            <span>Open Source MIT</span>
          </div>
        </div>
      </div>
    </section>
  );
}

const styles: Record<string, React.CSSProperties> = {
  ctaSection: {
    maxWidth: 1140,
    margin: "30px auto 80px",
    padding: "0 24px",
    position: "relative",
    zIndex: 10,
  },
  cardContainer: {
    position: "relative",
    backgroundColor: "#ffffff",
    borderRadius: 28,
    padding: "68px 32px",
    textAlign: "center",
    boxShadow: "0 25px 60px -15px rgba(15, 23, 42, 0.14), 0 0 0 1px rgba(15, 23, 42, 0.06)",
    overflow: "hidden",
  },
  cardArtwork: {
    position: "absolute",
    inset: 0,
    backgroundImage: "url('/screenshot-hero.png')",
    backgroundSize: "cover",
    backgroundPosition: "center center",
    backgroundRepeat: "no-repeat",
    filter: "contrast(1.22) saturate(1.2) brightness(0.98)",
    zIndex: 0,
  },
  cardOverlay: {
    position: "absolute",
    inset: 0,
    background:
      "linear-gradient(180deg, rgba(255, 255, 255, 0.15) 0%, rgba(255, 255, 255, 0.65) 55%, rgba(255, 255, 255, 0.95) 100%)",
    zIndex: 1,
  },
  content: {
    position: "relative",
    zIndex: 2,
    maxWidth: 720,
    margin: "0 auto",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: 20,
  },
  title: {
    fontFamily: "var(--font-display)",
    fontSize: "clamp(32px, 4vw, 48px)",
    fontWeight: 900,
    color: "#0f172a",
    lineHeight: 1.12,
    letterSpacing: -1.4,
    textShadow: "0 2px 8px rgba(255, 255, 255, 0.9), 0 0 30px rgba(255, 255, 255, 0.8)",
  },
  description: {
    color: "#334155",
    fontSize: "clamp(15px, 1.3vw, 17.5px)",
    lineHeight: 1.65,
    maxWidth: 600,
    fontWeight: 500,
    textShadow: "0 1px 4px rgba(255, 255, 255, 0.95)",
  },
  ctaForm: {
    marginTop: 6,
    width: "100%",
    maxWidth: 440,
    display: "flex",
    justifyContent: "center",
  },
  inputWrapper: {
    width: "100%",
    display: "flex",
    alignItems: "center",
    backgroundColor: "rgba(15, 23, 42, 0.92)",
    backdropFilter: "blur(14px)",
    WebkitBackdropFilter: "blur(14px)",
    border: "1px solid rgba(255, 255, 255, 0.25)",
    borderRadius: 9999,
    padding: "6px 8px 6px 18px",
    gap: 10,
    boxShadow: "0 14px 35px rgba(0, 0, 0, 0.24)",
  },
  pinLabel: {
    fontFamily: "var(--font-mono)",
    fontSize: 12.5,
    fontWeight: 800,
    color: "#94a3b8",
    letterSpacing: 0.5,
  },
  pinInput: {
    flex: 1,
    backgroundColor: "transparent",
    border: "none",
    color: "#ffffff",
    fontFamily: "var(--font-mono)",
    fontSize: 14.5,
    fontWeight: 700,
    outline: "none",
    minWidth: 0,
  },
  downloadWrapper: {
    display: "flex",
    justifyContent: "center",
    marginTop: 10,
    marginBottom: 4,
  },
  pairBtn: {
    display: "inline-flex",
    alignItems: "center",
    gap: 10,
    background: "linear-gradient(135deg, #5b9bd5 0%, #3e82c5 100%)",
    color: "#ffffff",
    border: "1px solid rgba(255, 255, 255, 0.4)",
    borderRadius: 9999,
    padding: "16px 36px",
    fontSize: 15.5,
    fontWeight: 800,
    textDecoration: "none",
    cursor: "pointer",
    boxShadow: "0 10px 28px rgba(62, 130, 197, 0.45)",
    transition: "all 0.15s ease",
  },
  trustRow: {
    display: "flex",
    alignItems: "center",
    gap: 12,
    color: "#475569",
    fontSize: 12.5,
    fontFamily: "var(--font-mono)",
    fontWeight: 600,
    flexWrap: "wrap",
    justifyContent: "center",
    textShadow: "0 1px 3px rgba(255, 255, 255, 0.9)",
  },
};
