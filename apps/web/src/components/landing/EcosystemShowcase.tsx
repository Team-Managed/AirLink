"use client";

import React from "react";

export function EcosystemShowcase() {
  const ecosystem = [
    {
      title: "Interactive Terminal CLI",
      desc: "Zero-dependency global CLI with interactive prompt REPL, git diff viewer, test runner, and pairing display.",
      code: "npx @agent-remote/cli",
    },
    {
      title: "VS Code Extension",
      desc: "Native sidebar panel host with chat view, active status bar item, one-click PIN copy, and action buttons.",
      code: "code --install-extension agent-remote.vsix",
    },
    {
      title: "Mobile App (iOS & Android)",
      desc: "React Native Expo client featuring haptics, audio chimes, collapsible tool cards, and spring approval drawer.",
      code: "pnpm --filter @agent-remote/mobile start",
    },
    {
      title: "Browser Web Remote",
      desc: "Zero-install web client connecting to your workstation bridge directly over WebSockets from any browser.",
      code: "https://agent-remote.dev/pair",
    },
  ];

  return (
    <section style={styles.ecosystemSection}>
      <div style={styles.sectionHeader}>
        <h2 style={styles.sectionTitle}>Multiplatform Ecosystem</h2>
        <p style={styles.sectionSubtitle}>
          Use your preferred client without locking into proprietary hosting.
        </p>
      </div>

      <div style={styles.ecosystemGrid}>
        {ecosystem.map((e) => (
          <div key={e.title} style={styles.ecoCard}>
            <h3 style={styles.ecoTitle}>{e.title}</h3>
            <p style={styles.ecoDesc}>{e.desc}</p>
            <div style={styles.ecoCodeBox}>
              <code>{e.code}</code>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

const styles: Record<string, React.CSSProperties> = {
  ecosystemSection: {
    maxWidth: 1100,
    margin: "0 auto 120px",
    padding: "0 24px",
  },
  sectionHeader: {
    textAlign: "center",
    marginBottom: 48,
  },
  sectionTitle: {
    fontSize: "clamp(24px, 3vw, 36px)",
    fontWeight: 800,
    color: "#f8fafc",
    marginBottom: 12,
  },
  sectionSubtitle: {
    color: "#94a3b8",
    fontSize: 15,
  },
  ecosystemGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
    gap: 20,
  },
  ecoCard: {
    backgroundColor: "#0f172a",
    border: "1px solid #1e293b",
    borderRadius: 12,
    padding: 24,
    display: "flex",
    flexDirection: "column",
  },
  ecoTitle: {
    fontSize: 16,
    fontWeight: 700,
    color: "#f8fafc",
    marginBottom: 8,
  },
  ecoDesc: {
    color: "#94a3b8",
    fontSize: 13,
    lineHeight: 1.5,
    marginBottom: 16,
    flex: 1,
  },
  ecoCodeBox: {
    backgroundColor: "#05080f",
    border: "1px solid #1e293b",
    borderRadius: 6,
    padding: "8px 12px",
    color: "#38bdf8",
    fontSize: 11,
    fontFamily: "var(--font-mono)",
    overflowX: "auto",
  },
};
