"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import gsap from "gsap";
import { GsapMovingClouds } from "./GsapMovingClouds";

export function PanoramicLandscapeHero() {
  const [pinInput, setPinInput] = useState("");
  const [isInputOpen, setIsInputOpen] = useState(false);
  const router = useRouter();

  const heroContainerRef = useRef<HTMLElement>(null);
  const headlineRef = useRef<HTMLHeadingElement>(null);
  const subtitleRef = useRef<HTMLParagraphElement>(null);
  const ctaRef = useRef<HTMLDivElement>(null);

  const line1 = ["Step", "Away", "From", "Your", "Desk"];
  const line2 = ["While", "Your", "Agent", "Codes."];

  useEffect(() => {
    const ctx = gsap.context(() => {
      const tl = gsap.timeline({ defaults: { ease: "power3.out" } });

      // Staggered word-by-word appearing / reveal effect with de-blur
      tl.fromTo(
        ".hero-word-inner",
        {
          y: 48,
          opacity: 0,
          filter: "blur(12px)",
          rotateX: -20,
        },
        {
          y: 0,
          opacity: 1,
          filter: "blur(0px)",
          rotateX: 0,
          duration: 0.95,
          stagger: 0.065,
          ease: "power3.out",
        }
      );

      // Subtitle smooth appearing transition
      if (subtitleRef.current) {
        tl.fromTo(
          subtitleRef.current,
          {
            y: 28,
            opacity: 0,
            filter: "blur(8px)",
          },
          {
            y: 0,
            opacity: 1,
            filter: "blur(0px)",
            duration: 0.85,
            ease: "power3.out",
          },
          "-=0.45"
        );
      }

      // CTA Buttons elastic popping reveal
      if (ctaRef.current) {
        tl.fromTo(
          ctaRef.current,
          {
            y: 24,
            opacity: 0,
            scale: 0.92,
          },
          {
            y: 0,
            opacity: 1,
            scale: 1,
            duration: 0.8,
            ease: "back.out(1.7)",
          },
          "-=0.4"
        );
      }
    }, heroContainerRef);

    return () => ctx.revert();
  }, []);

  const handlePairSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanPin = pinInput.replace(/\D/g, "");
    if (cleanPin.length === 6) {
      router.push(`/pair?pin=${cleanPin}`);
    } else {
      router.push("/pair");
    }
  };

  return (
    <section ref={heroContainerRef} style={styles.heroSection}>
      {/* Full-bleed Landscape Artwork Background */}
      <div style={styles.backgroundArtwork} />

      {/* Atmospheric Soft Light & Radial Vignette */}
      <div style={styles.ambientOverlay} />

      {/* GSAP Multi-Layered Moving Clouds & Parallax */}
      <GsapMovingClouds />

      {/* Centered Hero Content Container */}
      <div style={styles.contentContainer}>
        {/* Massive All-Black Display Headline with Appearing Word GSAP Reveal */}
        <h1 ref={headlineRef} style={styles.headline}>
          <span style={styles.lineWrapper}>
            {line1.map((word, idx) => (
              <span key={`l1-${idx}`} style={styles.wordWrapper}>
                <span className="hero-word-inner" style={styles.wordInner}>
                  {word}
                </span>
                {idx < line1.length - 1 && "\u00A0"}
              </span>
            ))}
          </span>
          <br />
          <span style={styles.lineWrapper}>
            {line2.map((word, idx) => (
              <span key={`l2-${idx}`} style={styles.wordWrapper}>
                <span className="hero-word-inner" style={styles.wordInner}>
                  {word}
                </span>
                {idx < line2.length - 1 && "\u00A0"}
              </span>
            ))}
          </span>
        </h1>

        {/* Clean, Large Value Proposition Subtitle */}
        <p ref={subtitleRef} style={styles.subtitle}>
          The open-source universal remote for your workstation coding agent.
          Stream tokens with sub-50ms latency, review Git diffs, and approve critical bash commands from anywhere.
        </p>

        {/* Hero CTA Button Row */}
        <div ref={ctaRef} style={styles.ctaWrapper}>
          {!isInputOpen ? (
            <div style={styles.dualCtaRow}>
              {/* Primary Action Capsule Pill */}
              <div style={styles.capsuleGlowOuter}>
                <button
                  type="button"
                  onClick={() => setIsInputOpen(true)}
                  style={styles.capsuleBtn}
                >
                  <span>Pair &amp; Control</span>
                  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <path d="M5 12h14M12 5l7 7-7 7" />
                  </svg>
                </button>
              </div>

              {/* Secondary Frosted Glass CTA */}
              <a href="#how-it-works" style={styles.secondaryCtaBtn}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                  <circle cx="12" cy="12" r="10" />
                  <polygon points="10 8 16 12 10 16 10 8" />
                </svg>
                <span>How It Works</span>
              </a>
            </div>
          ) : (
            <div style={styles.pinModalCard}>
              <div style={styles.pinModalHeader}>
                <div style={styles.pinModalHeaderLeft}>
                  <span style={{ fontSize: 13 }}>🚀</span>
                  <span style={styles.pinModalTitle}>AirLink PIN Pairing</span>
                </div>
                <div style={styles.pinModalHeaderRight}>
                  <span style={styles.pinModalTls}>WebSocket E2E</span>
                  <button
                    type="button"
                    onClick={() => setIsInputOpen(false)}
                    style={styles.pinCloseBtn}
                  >
                    ✕
                  </button>
                </div>
              </div>

              <div style={styles.pinCenterCardExact}>
                <div style={styles.pinLockCircleExact}>
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#38bdf8" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                  </svg>
                </div>

                <span style={styles.pinMainTitleExact}>Workstation Session PIN</span>
                <span style={styles.pinSubtitleExact}>Pairing with MacBook-Pro-M3</span>

                {/* 6 Interactive PIN Digit Boxes with Hidden Auto-Focused Input */}
                <form onSubmit={handlePairSubmit} style={{ width: "100%", position: "relative" }}>
                  <div style={styles.pinBoxesRowExact}>
                    {[0, 1, 2, 3, 4, 5].map((i) => (
                      <div
                        key={i}
                        style={{
                          ...styles.pinBoxExact,
                          borderColor: pinInput.length === i ? "#38bdf8" : "rgba(59, 130, 246, 0.55)",
                          boxShadow: pinInput.length === i ? "0 0 12px rgba(56, 189, 248, 0.4)" : "0 4px 14px rgba(0, 0, 0, 0.5)",
                        }}
                      >
                        {pinInput[i] || ""}
                      </div>
                    ))}
                  </div>

                  <input
                    type="text"
                    inputMode="numeric"
                    maxLength={6}
                    autoFocus
                    value={pinInput}
                    onChange={(e) => {
                      const val = e.target.value.replace(/\D/g, "").slice(0, 6);
                      setPinInput(val);
                      if (val.length === 6) {
                        router.push(`/pair?pin=${val}`);
                      }
                    }}
                    style={styles.invisiblePinInput}
                  />

                  {pinInput.length === 6 && (
                    <button type="submit" style={styles.connectNowBtn}>
                      Connect to Session →
                    </button>
                  )}
                </form>

                <span style={styles.pinExpiryTextExact}>
                  🔒 Ephemeral session • Auto-expires
                </span>
              </div>

              <div style={styles.screenBottomBlockExact}>
                <div style={styles.hostInfoCardExact}>
                  <div style={styles.hostInfoRowExact}>
                    <span style={styles.hostInfoLabelExact}>WebSocket Relay:</span>
                    <span style={styles.hostInfoValueExact}>sub-50ms (Direct)</span>
                  </div>
                  <div style={styles.hostInfoRowExact}>
                    <span style={styles.hostInfoLabelExact}>Security:</span>
                    <span style={styles.hostInfoValueExact}>E2E Encrypted</span>
                  </div>
                </div>

                <div style={styles.tunnelStatusRowExact}>
                  <span style={styles.tunnelDotExact} />
                  <span style={styles.tunnelTextExact}>WebSocket Relay Active</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

const styles: Record<string, React.CSSProperties> = {
  heroSection: {
    position: "relative",
    width: "100%",
    minHeight: "84vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
    padding: "130px 24px 120px",
  },
  backgroundArtwork: {
    position: "absolute",
    inset: 0,
    backgroundImage: "url('/screenshot-hero.png')",
    backgroundSize: "cover",
    backgroundPosition: "center center",
    backgroundRepeat: "no-repeat",
    filter: "contrast(1.22) saturate(1.2) brightness(0.97)",
    zIndex: 0,
  },
  ambientOverlay: {
    position: "absolute",
    inset: 0,
    background:
      "linear-gradient(180deg, rgba(15, 23, 42, 0.04) 0%, rgba(2, 132, 199, 0.04) 40%, rgba(255, 255, 255, 0.55) 78%, #ffffff 100%)",
    zIndex: 1,
    pointerEvents: "none",
  },
  contentContainer: {
    position: "relative",
    zIndex: 2,
    maxWidth: 960,
    margin: "0 auto",
    textAlign: "center",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: 24,
  },
  headline: {
    fontFamily: "var(--font-display)",
    fontSize: "clamp(46px, 5.8vw, 74px)",
    fontWeight: 900,
    color: "#0f172a",
    lineHeight: 1.08,
    letterSpacing: -2.2,
    textShadow: "0 2px 6px rgba(255, 255, 255, 0.95), 0 0 35px rgba(255, 255, 255, 0.85)",
  },
  lineWrapper: {
    display: "inline-block",
  },
  wordWrapper: {
    display: "inline-block",
    overflow: "hidden",
    verticalAlign: "top",
    paddingBottom: 4,
  },
  wordInner: {
    display: "inline-block",
    color: "#0f172a",
    willChange: "transform, opacity, filter",
  },
  subtitle: {
    fontFamily: "var(--font-sans)",
    fontSize: "clamp(17px, 1.6vw, 21px)",
    color: "#334155",
    lineHeight: 1.65,
    maxWidth: 760,
    fontWeight: 500,
    textShadow: "0 1px 2px rgba(255, 255, 255, 0.85)",
    willChange: "transform, opacity, filter",
  },
  ctaWrapper: {
    marginTop: 10,
    display: "flex",
    justifyContent: "center",
  },
  dualCtaRow: {
    display: "flex",
    alignItems: "center",
    gap: 16,
    flexWrap: "wrap",
    justifyContent: "center",
  },
  capsuleGlowOuter: {
    padding: 3,
    borderRadius: 9999,
    background: "linear-gradient(135deg, rgba(255, 255, 255, 0.95) 0%, rgba(91, 155, 213, 0.45) 50%, rgba(62, 130, 197, 0.35) 100%)",
    backdropFilter: "blur(14px)",
    WebkitBackdropFilter: "blur(14px)",
    boxShadow: "0 14px 35px rgba(62, 130, 197, 0.25), 0 0 20px rgba(91, 155, 213, 0.2), 0 0 0 1px rgba(255, 255, 255, 0.85)",
    transition: "transform 0.2s cubic-bezier(0.16, 1, 0.3, 1)",
  },
  capsuleBtn: {
    display: "inline-flex",
    alignItems: "center",
    gap: 12,
    background: "linear-gradient(135deg, #5b9bd5 0%, #3e82c5 100%)",
    color: "#ffffff",
    padding: "15px 32px",
    borderRadius: 9999,
    fontSize: 15,
    fontWeight: 700,
    border: "1px solid rgba(255, 255, 255, 0.35)",
    cursor: "pointer",
    boxShadow: "0 8px 20px rgba(62, 130, 197, 0.35)",
    transition: "all 0.15s ease",
  },
  secondaryCtaBtn: {
    display: "inline-flex",
    alignItems: "center",
    gap: 9,
    backgroundColor: "rgba(255, 255, 255, 0.82)",
    backdropFilter: "blur(14px)",
    WebkitBackdropFilter: "blur(14px)",
    color: "#0f172a",
    padding: "15px 26px",
    borderRadius: 9999,
    fontSize: 14.5,
    fontWeight: 700,
    textDecoration: "none",
    border: "1px solid rgba(15, 23, 42, 0.12)",
    boxShadow: "0 4px 16px rgba(15, 23, 42, 0.06)",
    transition: "all 0.15s ease",
  },
  pinModalCard: {
    backgroundColor: "#090d16",
    border: "1px solid rgba(255, 255, 255, 0.12)",
    borderRadius: 24,
    padding: "16px 16px 18px",
    width: "100%",
    maxWidth: 340,
    boxShadow: "0 25px 60px -10px rgba(15, 23, 42, 0.4), 0 0 0 1px rgba(0, 0, 0, 0.2)",
    display: "flex",
    flexDirection: "column",
    gap: 10,
    animation: "pop-in 0.25s cubic-bezier(0.23, 1, 0.32, 1) both",
  },
  pinModalHeader: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    border: "1px solid rgba(255, 255, 255, 0.09)",
    borderRadius: 10,
    padding: "8px 12px",
  },
  pinModalHeaderLeft: {
    display: "flex",
    alignItems: "center",
    gap: 7,
  },
  pinModalTitle: {
    fontSize: 12,
    fontWeight: 700,
    color: "#ffffff",
  },
  pinModalHeaderRight: {
    display: "flex",
    alignItems: "center",
    gap: 8,
  },
  pinModalTls: {
    fontSize: 11,
    fontFamily: "var(--font-mono)",
    color: "#94a3b8",
    fontWeight: 600,
  },
  pinCloseBtn: {
    background: "transparent",
    border: "none",
    color: "#94a3b8",
    fontSize: 12,
    cursor: "pointer",
    padding: "2px 4px",
  },
  pinCenterCardExact: {
    backgroundColor: "#0c1322",
    border: "1px solid rgba(255, 255, 255, 0.08)",
    borderRadius: 16,
    padding: "22px 14px",
    textAlign: "center",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
  },
  pinLockCircleExact: {
    width: 48,
    height: 48,
    borderRadius: "50%",
    backgroundColor: "rgba(37, 99, 235, 0.18)",
    border: "1.5px solid rgba(59, 130, 246, 0.35)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  pinMainTitleExact: {
    fontSize: 15,
    fontWeight: 800,
    color: "#ffffff",
    letterSpacing: -0.2,
  },
  pinSubtitleExact: {
    fontSize: 11.5,
    color: "#94a3b8",
    marginTop: 3,
    marginBottom: 12,
  },
  pinBoxesRowExact: {
    display: "flex",
    gap: 5.5,
    justifyContent: "center",
    marginBottom: 4,
  },
  pinBoxExact: {
    width: 35,
    height: 44,
    backgroundColor: "#0a101f",
    border: "1.5px solid rgba(59, 130, 246, 0.55)",
    borderRadius: 8,
    color: "#ffffff",
    fontFamily: "var(--font-mono)",
    fontSize: 20,
    fontWeight: 900,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    boxShadow: "0 4px 14px rgba(0, 0, 0, 0.5)",
    transition: "all 0.15s ease",
  },
  invisiblePinInput: {
    position: "absolute",
    opacity: 0,
    top: 0,
    left: 0,
    width: "100%",
    height: "100%",
    cursor: "pointer",
  },
  connectNowBtn: {
    marginTop: 10,
    width: "100%",
    backgroundColor: "#2563eb",
    color: "#ffffff",
    border: "none",
    borderRadius: 7,
    padding: "9px",
    fontSize: 12,
    fontWeight: 700,
    cursor: "pointer",
    animation: "fade-up 0.2s ease-out",
  },
  pinExpiryTextExact: {
    fontSize: 10,
    color: "#64748b",
    fontFamily: "var(--font-mono)",
    marginTop: 10,
  },
  screenBottomBlockExact: {
    display: "flex",
    flexDirection: "column",
    gap: 8,
  },
  hostInfoCardExact: {
    backgroundColor: "#0c1322",
    border: "1px solid rgba(255, 255, 255, 0.08)",
    borderRadius: 9,
    padding: "10px 12px",
    display: "flex",
    flexDirection: "column",
    gap: 5,
  },
  hostInfoRowExact: {
    display: "flex",
    justifyContent: "space-between",
    fontSize: 11,
  },
  hostInfoLabelExact: {
    color: "#94a3b8",
    fontSize: 10.5,
  },
  hostInfoValueExact: {
    color: "#ffffff",
    fontWeight: 700,
    fontFamily: "var(--font-mono)",
    fontSize: 11,
  },
  tunnelStatusRowExact: {
    display: "flex",
    alignItems: "center",
    gap: 7,
    justifyContent: "center",
    backgroundColor: "rgba(6, 78, 59, 0.35)",
    border: "1px solid rgba(16, 185, 129, 0.35)",
    borderRadius: 8,
    padding: "9px 12px",
  },
  tunnelDotExact: {
    width: 7,
    height: 7,
    borderRadius: "50%",
    backgroundColor: "#10b981",
    boxShadow: "0 0 8px #10b981",
  },
  tunnelTextExact: {
    fontSize: 11.5,
    color: "#34d399",
    fontWeight: 700,
  },
};
