"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";

type InstallTab = "windows" | "posix" | "npx";

export default function LandingPage() {
  const [activeTab, setActiveTab] = useState<InstallTab>("windows");
  const [copied, setCopied] = useState<boolean>(false);

  // Interactive Simulator State
  const [simStep, setSimStep] = useState<"pending_approval" | "approved_executing" | "completed">(
    "pending_approval",
  );
  const [simCountdown, setSimCountdown] = useState<number>(180);
  const [simThoughtExpanded, setSimThoughtExpanded] = useState<boolean>(false);

  const installCommands: Record<InstallTab, string> = {
    windows: "irm https://agent-remote.dev/install.ps1 | iex",
    posix: "curl -fsSL https://agent-remote.dev/install.sh | bash",
    npx: "npx @agent-remote/cli",
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(installCommands[activeTab]);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleApproveSim = () => {
    setSimStep("approved_executing");
    setTimeout(() => {
      setSimStep("completed");
    }, 2200);
  };

  const handleResetSim = () => {
    setSimStep("pending_approval");
    setSimCountdown(180);
  };

  useEffect(() => {
    if (simStep !== "pending_approval") return;
    const interval = setInterval(() => {
      setSimCountdown((prev) => (prev > 1 ? prev - 1 : 180));
    }, 1000);
    return () => clearInterval(interval);
  }, [simStep]);

  return (
    <main style={styles.main}>
      {/* 1. Header / Navbar */}
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

      {/* 2. Hero Section */}
      <section style={styles.heroSection}>
        <div style={styles.heroTagContainer}>
          <span style={styles.heroTag}>OPEN-SOURCE CODING AGENT REMOTE HARNESS</span>
        </div>

        <h1 style={styles.heroTitle}>
          Control Your Local Coding Agent <br />
          <span style={styles.heroGradient}>From Anywhere</span>
        </h1>

        <p style={styles.heroSubtitle}>
          Zero port-forwarding remote harness for TrueForge, DeepSeek R1, 0x Alpha, and Claude.
          Stream tokens in real time, review unified Git diffs, and approve sensitive bash commands
          directly from your phone or browser.
        </p>

        {/* 3. One-Click Install Command Bar */}
        <div id="install" style={styles.installBox}>
          <div style={styles.installTabs}>
            <button
              style={{
                ...styles.installTabButton,
                ...(activeTab === "windows" ? styles.installTabActive : {}),
              }}
              onClick={() => setActiveTab("windows")}
            >
              PowerShell (Windows)
            </button>
            <button
              style={{
                ...styles.installTabButton,
                ...(activeTab === "posix" ? styles.installTabActive : {}),
              }}
              onClick={() => setActiveTab("posix")}
            >
              curl (macOS / Linux)
            </button>
            <button
              style={{
                ...styles.installTabButton,
                ...(activeTab === "npx" ? styles.installTabActive : {}),
              }}
              onClick={() => setActiveTab("npx")}
            >
              npx Instant Run
            </button>
          </div>

          <div style={styles.commandRow}>
            <span style={styles.commandPrefix}>$</span>
            <code style={styles.commandCode}>{installCommands[activeTab]}</code>
            <button style={styles.copyButton} onClick={handleCopy}>
              {copied ? "Copied" : "Copy Command"}
            </button>
          </div>
        </div>

        <div style={styles.heroActions}>
          <Link href="/pair" style={styles.primaryCta}>
            Pair Remote Host
          </Link>
          <a href="#simulator" style={styles.secondaryCta}>
            Try Interactive Demo
          </a>
        </div>
      </section>

      {/* 4. Interactive Live Demo Simulator */}
      <section id="simulator" style={styles.simulatorSection}>
        <div style={styles.sectionHeader}>
          <span style={styles.sectionBadge}>LIVE PRODUCT SIMULATOR</span>
          <h2 style={styles.sectionTitle}>Experience Remote Agent Control</h2>
          <p style={styles.sectionSubtitle}>
            Test how human-in-the-loop approvals, diff cards, and live tokens behave in real time.
          </p>
        </div>

        <div style={styles.terminalCard}>
          <div style={styles.terminalHeader}>
            <div style={styles.windowControls}>
              <span style={{ ...styles.windowDot, backgroundColor: "#ef4444" }} />
              <span style={{ ...styles.windowDot, backgroundColor: "#f59e0b" }} />
              <span style={{ ...styles.windowDot, backgroundColor: "#22c55e" }} />
            </div>
            <div style={styles.terminalTitle}>agent-remote [paired to 834-192 (MacBook Pro)]</div>
            <div style={styles.terminalStatusDot}>
              <span style={styles.pulseDot} />
              <span style={styles.statusText}>Relay Tunnel Active</span>
            </div>
          </div>

          <div style={styles.terminalBody}>
            {/* Prompt */}
            <div style={styles.simPromptRow}>
              <span style={styles.simPromptPrefix}>&gt;</span>
              <span style={styles.simPromptText}>
                Implement SlidingWindow rate limiting in apps/relay and run test suite
              </span>
            </div>

            {/* Collapsible Thought */}
            <div style={styles.thoughtBox}>
              <div
                style={styles.thoughtHeader}
                onClick={() => setSimThoughtExpanded(!simThoughtExpanded)}
              >
                <span>Thinking Process (TrueForge + DeepSeek R1)</span>
                <span style={styles.toggleText}>{simThoughtExpanded ? "Collapse" : "Expand"}</span>
              </div>
              {simThoughtExpanded && (
                <p style={styles.thoughtText}>
                  Checking existing rate limiter tests in apps/relay/tests/rate-limiter.test.ts.
                  Creating an in-memory sliding window queue capped at 3 failed attempts per 300s
                  window.
                </p>
              )}
            </div>

            {/* Tool Action */}
            <div style={styles.toolCallBox}>
              <div style={styles.toolBadge}>tool: write_file</div>
              <code style={styles.toolCode}>apps/relay/src/rate-limiter.ts</code>
            </div>

            {/* Diff Card Preview */}
            <div style={styles.diffCard}>
              <div style={styles.diffHeader}>
                <span style={styles.diffFile}>apps/relay/src/rate-limiter.ts</span>
                <span style={styles.diffStats}>+14 -2 lines</span>
              </div>
              <pre style={styles.diffContent}>
                <span style={styles.diffContext}>@@ -12,4 +12,16 @@</span>
                {"\n"}
                <span style={styles.diffRemoved}>- const isBlocked = attempts &gt; 5;</span>
                {"\n"}
                <span style={styles.diffAdded}>
                  + // Invariant: Max 3 failed attempts per 5-minute lockout window
                </span>
                {"\n"}
                <span style={styles.diffAdded}>
                  + public isLockedOut(clientIp: string): boolean &#123;
                </span>
                {"\n"}
                <span style={styles.diffAdded}>+ const record = this.records.get(clientIp);</span>
                {"\n"}
                <span style={styles.diffAdded}>
                  + return record ? record.attempts &gt;= 3 : false;
                </span>
                {"\n"}
                <span style={styles.diffAdded}>+ &#125;</span>
              </pre>
            </div>

            {/* Simulated Approval Drawer / Gate */}
            {simStep === "pending_approval" && (
              <div style={styles.simApprovalGate}>
                <div style={styles.gateHeader}>
                  <div style={styles.gateWarningDot} />
                  <span style={styles.gateTitle}>Approval Required: write_file</span>
                  <span style={styles.timerBadge}>{simCountdown}s Auto-Deny</span>
                </div>
                <p style={styles.gateDescription}>
                  Agent is modifying core rate limiter file. Review the diff above and approve
                  execution.
                </p>
                <div style={styles.gateActions}>
                  <button
                    style={styles.gateDenyButton}
                    onClick={() => alert("Simulated Deny action triggered.")}
                  >
                    Deny
                  </button>
                  <button style={styles.gateApproveButton} onClick={handleApproveSim}>
                    Approve on Device
                  </button>
                </div>
              </div>
            )}

            {simStep === "approved_executing" && (
              <div style={styles.simExecutingBox}>
                <div style={styles.spinner} />
                <span style={styles.executingText}>
                  Approved by developer. Running test suite on workstation...
                </span>
              </div>
            )}

            {simStep === "completed" && (
              <div style={styles.simCompletedBox}>
                <div style={styles.simSuccessRow}>
                  <span>Action approved and executed cleanly</span>
                  <button style={styles.resetButton} onClick={handleResetSim}>
                    Reset Demo
                  </button>
                </div>
                <pre style={styles.simOutput}>
                  apps/relay/tests/rate-limiter.test.ts (7 tests) 19ms{"\n"}
                  All 7 tests passed! Sequence synced to seq_id: 42.
                </pre>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* 5. Four Feature Pillars Grid */}
      <section id="features" style={styles.featuresSection}>
        <div style={styles.sectionHeader}>
          <span style={styles.sectionBadge}>CORE PILLARS</span>
          <h2 style={styles.sectionTitle}>Engineered for Real Developers</h2>
          <p style={styles.sectionSubtitle}>
            Built with strict security invariants, zero bloat, and resilient networking.
          </p>
        </div>

        <div style={styles.featureGrid}>
          <div style={styles.featureCard}>
            <div style={styles.featureIconBadge}>01</div>
            <h3 style={styles.featureTitle}>Zero-Config PIN Pairing</h3>
            <p style={styles.featureDescription}>
              No port-forwarding, ngrok tunnels, or cloud accounts. Type the 6-digit PIN displayed
              on your terminal or VS Code extension to pair instantly.
            </p>
          </div>

          <div style={styles.featureCard}>
            <div style={styles.featureIconBadge}>02</div>
            <h3 style={styles.featureTitle}>Real-Time Token & Tool Stream</h3>
            <p style={styles.featureDescription}>
              Stream live reasoning tokens, collapsible thoughts, and terminal output windows
              directly from TrueForge and frontier LLMs.
            </p>
          </div>

          <div style={styles.featureCard}>
            <div style={styles.featureIconBadge}>03</div>
            <h3 style={styles.featureTitle}>Dual-Surface HITL Approvals</h3>
            <p style={styles.featureDescription}>
              Approve or deny sensitive bash commands and file writes from either your mobile app or
              workstation with automatic 180s safety timeouts.
            </p>
          </div>

          <div style={styles.featureCard}>
            <div style={styles.featureIconBadge}>04</div>
            <h3 style={styles.featureTitle}>The Elevator Problem Solved</h3>
            <p style={styles.featureDescription}>
              500-event monotonic sequence ring buffer (
              <code style={styles.codeSnippet}>seq_id</code>) on your PC catches up missed tokens
              instantly when your phone reconnects.
            </p>
          </div>
        </div>
      </section>

      {/* 6. Architecture Diagram Section */}
      <section id="architecture" style={styles.architectureSection}>
        <div style={styles.sectionHeader}>
          <span style={styles.sectionBadge}>SYSTEM ARCHITECTURE</span>
          <h2 style={styles.sectionTitle}>Zero-Retention Relay Pipeline</h2>
          <p style={styles.sectionSubtitle}>
            All sensitive code, TrueForge execution, and local file operations remain strictly on
            your workstation.
          </p>
        </div>

        <div style={styles.archGrid}>
          <div style={styles.archCard}>
            <div style={styles.archBadge}>LAYER 1: CLIENT</div>
            <h4 style={styles.archTitle}>Mobile & Web Apps</h4>
            <p style={styles.archText}>
              Expo React Native (iOS/Android) and Next.js Web Client. In-device encrypted key vault
              via SecureStore.
            </p>
          </div>

          <div style={styles.archConnector}>[Socket.io Tunnel]</div>

          <div style={styles.archCard}>
            <div style={styles.archBadge}>LAYER 2: RELAY</div>
            <h4 style={styles.archTitle}>Cloud Message Bridge</h4>
            <p style={styles.archText}>
              Stateless Node.js WebSocket relay. Ephemeral PIN rooms with zero disk storage and IP
              brute-force protection.
            </p>
          </div>

          <div style={styles.archConnector}>[Outbound WebSocket]</div>

          <div style={styles.archCard}>
            <div style={styles.archBadge}>LAYER 3: WORKSTATION</div>
            <h4 style={styles.archTitle}>TrueForge Core Bridge</h4>
            <p style={styles.archText}>
              Local CLI & VS Code Extension wrapping{" "}
              <code style={styles.codeSnippet}>bridge-core</code>. Runs MCP tools and LLMs locally.
            </p>
          </div>
        </div>
      </section>

      {/* 7. Multiplatform Ecosystem */}
      <section style={styles.ecosystemSection}>
        <div style={styles.sectionHeader}>
          <span style={styles.sectionBadge}>MULTIPLATFORM</span>
          <h2 style={styles.sectionTitle}>One Engine. Every Surface.</h2>
        </div>

        <div style={styles.ecosystemGrid}>
          <div style={styles.ecoCard}>
            <div style={styles.ecoBadge}>CLI</div>
            <h4 style={styles.ecoTitle}>Interactive CLI Host</h4>
            <p style={styles.ecoText}>
              Compact boxen banner, bold PIN, and keyboard approval prompt in any terminal.
            </p>
          </div>
          <div style={styles.ecoCard}>
            <div style={styles.ecoBadge}>IDE</div>
            <h4 style={styles.ecoTitle}>VS Code Extension</h4>
            <p style={styles.ecoText}>
              Status bar PIN item, Activity Bar chat webview, and native in-editor visual diffs.
            </p>
          </div>
          <div style={styles.ecoCard}>
            <div style={styles.ecoBadge}>APP</div>
            <h4 style={styles.ecoTitle}>Expo Mobile App</h4>
            <p style={styles.ecoText}>
              Tactile haptics, spring bottom-sheet approvals, and live virtualized terminal feed.
            </p>
          </div>
          <div style={styles.ecoCard}>
            <div style={styles.ecoBadge}>WEB</div>
            <h4 style={styles.ecoTitle}>Next.js Web Client</h4>
            <p style={styles.ecoText}>
              Zero-install browser remote client (<code style={styles.codeSnippet}>/pair</code>)
              with full monitoring.
            </p>
          </div>
        </div>
      </section>

      {/* 8. Footer */}
      <footer style={styles.footer}>
        <div style={styles.footerContent}>
          <div style={styles.footerBrand}>
            <span style={styles.brandTitle}>AGENT REMOTE</span>
          </div>
          <p style={styles.footerText}>
            Open-Source Coding Agent Universal Remote Control. Built for TrueFoundry & Qodo
            Hackathon tracks.
          </p>
          <div style={styles.footerLinks}>
            <Link href="/pair" style={styles.footerLink}>
              Web Client (/pair)
            </Link>
            <a href="https://github.com/agent-remote/agent-harness" style={styles.footerLink}>
              GitHub Repo
            </a>
            <a href="https://agent-remote.dev/install.sh" style={styles.footerLink}>
              install.sh
            </a>
            <a href="https://agent-remote.dev/install.ps1" style={styles.footerLink}>
              install.ps1
            </a>
          </div>
        </div>
      </footer>
    </main>
  );
}

const styles: Record<string, React.CSSProperties> = {
  main: {
    backgroundColor: "#090d16",
    color: "#f8fafc",
    minHeight: "100vh",
    display: "flex",
    flexDirection: "column",
  },
  nav: {
    borderBottom: "1px solid #1e293b",
    backgroundColor: "rgba(9, 13, 22, 0.8)",
    backdropFilter: "blur(12px)",
    position: "sticky",
    top: 0,
    zIndex: 50,
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
    gap: 8,
  },
  brandTitle: {
    fontFamily: "var(--font-mono)",
    fontWeight: 800,
    fontSize: 16,
    letterSpacing: 1.5,
  },
  versionBadge: {
    backgroundColor: "#0f172a",
    border: "1px solid #1e293b",
    color: "#38bdf8",
    fontSize: 11,
    padding: "2px 6px",
    borderRadius: 4,
    fontFamily: "var(--font-mono)",
  },
  navLinks: {
    display: "flex",
    alignItems: "center",
    gap: 20,
  },
  navLink: {
    color: "#94a3b8",
    fontSize: 14,
    fontWeight: 500,
    transition: "color 0.2s",
  },
  githubLink: {
    color: "#cbd5e1",
    fontSize: 14,
    fontWeight: 500,
  },
  launchButton: {
    backgroundColor: "#38bdf8",
    color: "#090d16",
    padding: "8px 16px",
    borderRadius: 6,
    fontSize: 13,
    fontWeight: 700,
    transition: "transform 0.15s, opacity 0.15s",
  },
  heroSection: {
    maxWidth: 960,
    margin: "0 auto",
    padding: "80px 24px 40px",
    textAlign: "center",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
  },
  heroTagContainer: {
    marginBottom: 16,
  },
  heroTag: {
    backgroundColor: "rgba(56, 189, 248, 0.1)",
    border: "1px solid rgba(56, 189, 248, 0.3)",
    color: "#38bdf8",
    padding: "4px 12px",
    borderRadius: 20,
    fontSize: 11,
    fontFamily: "var(--font-mono)",
    fontWeight: 700,
    letterSpacing: 1,
  },
  heroTitle: {
    fontSize: 48,
    lineHeight: 1.15,
    fontWeight: 800,
    letterSpacing: -1,
    marginBottom: 20,
  },
  heroGradient: {
    background: "linear-gradient(135deg, #38bdf8 0%, #818cf8 50%, #c084fc 100%)",
    WebkitBackgroundClip: "text",
    WebkitTextFillColor: "transparent",
  },
  heroSubtitle: {
    color: "#94a3b8",
    fontSize: 18,
    lineHeight: 1.6,
    maxWidth: 720,
    marginBottom: 36,
  },
  installBox: {
    width: "100%",
    maxWidth: 680,
    backgroundColor: "#0f172a",
    border: "1px solid #1e293b",
    borderRadius: 12,
    overflow: "hidden",
    marginBottom: 32,
    boxShadow: "0 10px 30px rgba(0,0,0,0.5)",
  },
  installTabs: {
    display: "flex",
    borderBottom: "1px solid #1e293b",
    backgroundColor: "#090d16",
  },
  installTabButton: {
    flex: 1,
    padding: "10px 14px",
    backgroundColor: "transparent",
    border: "none",
    color: "#64748b",
    fontFamily: "var(--font-sans)",
    fontSize: 13,
    fontWeight: 600,
    cursor: "pointer",
    transition: "color 0.2s",
  },
  installTabActive: {
    color: "#38bdf8",
    borderBottom: "2px solid #38bdf8",
    backgroundColor: "#0f172a",
  },
  commandRow: {
    display: "flex",
    alignItems: "center",
    padding: "16px 20px",
    gap: 12,
    backgroundColor: "#05080f",
  },
  commandPrefix: {
    color: "#38bdf8",
    fontFamily: "var(--font-mono)",
    fontWeight: 700,
  },
  commandCode: {
    flex: 1,
    color: "#f8fafc",
    fontFamily: "var(--font-mono)",
    fontSize: 14,
    textAlign: "left",
    overflowX: "auto",
    whiteSpace: "nowrap",
  },
  copyButton: {
    backgroundColor: "#1e293b",
    border: "1px solid #334155",
    color: "#f8fafc",
    padding: "6px 14px",
    borderRadius: 6,
    fontSize: 12,
    fontWeight: 600,
    cursor: "pointer",
    transition: "background 0.2s",
  },
  heroActions: {
    display: "flex",
    gap: 16,
    alignItems: "center",
  },
  primaryCta: {
    backgroundColor: "#38bdf8",
    color: "#090d16",
    padding: "12px 24px",
    borderRadius: 8,
    fontSize: 15,
    fontWeight: 700,
  },
  secondaryCta: {
    backgroundColor: "#0f172a",
    border: "1px solid #1e293b",
    color: "#f8fafc",
    padding: "12px 24px",
    borderRadius: 8,
    fontSize: 15,
    fontWeight: 600,
  },
  simulatorSection: {
    maxWidth: 1040,
    margin: "0 auto",
    padding: "40px 24px 80px",
    width: "100%",
  },
  sectionHeader: {
    textAlign: "center",
    marginBottom: 36,
  },
  sectionBadge: {
    color: "#38bdf8",
    fontSize: 11,
    fontFamily: "var(--font-mono)",
    fontWeight: 700,
    letterSpacing: 1.5,
  },
  sectionTitle: {
    fontSize: 32,
    fontWeight: 800,
    marginTop: 8,
    marginBottom: 10,
  },
  sectionSubtitle: {
    color: "#94a3b8",
    fontSize: 16,
    maxWidth: 600,
    margin: "0 auto",
  },
  terminalCard: {
    backgroundColor: "#0f172a",
    border: "1px solid #1e293b",
    borderRadius: 12,
    overflow: "hidden",
    boxShadow: "0 20px 40px rgba(0,0,0,0.6)",
  },
  terminalHeader: {
    backgroundColor: "#090d16",
    borderBottom: "1px solid #1e293b",
    padding: "12px 18px",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
  },
  windowControls: {
    display: "flex",
    gap: 6,
  },
  windowDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  terminalTitle: {
    fontFamily: "var(--font-mono)",
    fontSize: 12,
    color: "#94a3b8",
  },
  terminalStatusDot: {
    display: "flex",
    alignItems: "center",
    gap: 6,
  },
  pulseDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#22c55e",
  },
  statusText: {
    color: "#22c55e",
    fontSize: 11,
    fontFamily: "var(--font-mono)",
  },
  terminalBody: {
    padding: 24,
    display: "flex",
    flexDirection: "column",
    gap: 16,
    backgroundColor: "#05080f",
  },
  simPromptRow: {
    display: "flex",
    gap: 10,
    alignItems: "center",
    backgroundColor: "#0f172a",
    padding: "10px 14px",
    borderRadius: 6,
    borderLeft: "3px solid #38bdf8",
  },
  simPromptPrefix: {
    color: "#38bdf8",
    fontWeight: 700,
    fontFamily: "var(--font-mono)",
  },
  simPromptText: {
    color: "#f8fafc",
    fontSize: 13,
    fontFamily: "var(--font-mono)",
  },
  thoughtBox: {
    backgroundColor: "#0f172a",
    border: "1px solid #1e293b",
    borderRadius: 6,
    padding: 12,
  },
  thoughtHeader: {
    display: "flex",
    justifyContent: "space-between",
    fontSize: 12,
    color: "#94a3b8",
    cursor: "pointer",
    fontStyle: "italic",
  },
  toggleText: {
    color: "#38bdf8",
    fontStyle: "normal",
    fontSize: 11,
  },
  thoughtText: {
    color: "#94a3b8",
    fontSize: 12,
    lineHeight: 1.5,
    marginTop: 8,
    fontStyle: "italic",
  },
  toolCallBox: {
    display: "flex",
    alignItems: "center",
    gap: 10,
  },
  toolBadge: {
    backgroundColor: "rgba(56, 189, 248, 0.1)",
    border: "1px solid #38bdf8",
    color: "#38bdf8",
    padding: "3px 8px",
    borderRadius: 4,
    fontSize: 11,
    fontFamily: "var(--font-mono)",
    fontWeight: 700,
  },
  toolCode: {
    color: "#cbd5e1",
    fontSize: 12,
    fontFamily: "var(--font-mono)",
  },
  diffCard: {
    backgroundColor: "#0f172a",
    border: "1px solid #1e293b",
    borderRadius: 8,
    overflow: "hidden",
  },
  diffHeader: {
    backgroundColor: "#1e293b",
    padding: "8px 12px",
    display: "flex",
    justifyContent: "space-between",
    fontSize: 11,
    fontFamily: "var(--font-mono)",
  },
  diffFile: {
    color: "#f8fafc",
    fontWeight: 600,
  },
  diffStats: {
    color: "#22c55e",
  },
  diffContent: {
    padding: 12,
    fontSize: 12,
    lineHeight: 1.6,
    fontFamily: "var(--font-mono)",
    margin: 0,
    backgroundColor: "#05080f",
  },
  diffContext: { color: "#64748b" },
  diffRemoved: { color: "#ef4444", backgroundColor: "rgba(239, 68, 68, 0.1)", display: "block" },
  diffAdded: { color: "#22c55e", backgroundColor: "rgba(34, 197, 94, 0.1)", display: "block" },
  simApprovalGate: {
    backgroundColor: "#0f172a",
    border: "1px solid #f59e0b",
    borderRadius: 8,
    padding: 16,
    boxShadow: "0 0 20px rgba(245, 158, 11, 0.15)",
  },
  gateHeader: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    marginBottom: 8,
  },
  gateWarningDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#f59e0b",
  },
  gateTitle: {
    color: "#f8fafc",
    fontWeight: 700,
    fontSize: 14,
    flex: 1,
  },
  timerBadge: {
    color: "#f59e0b",
    fontFamily: "var(--font-mono)",
    fontSize: 12,
    fontWeight: 600,
  },
  gateDescription: {
    color: "#94a3b8",
    fontSize: 12,
    marginBottom: 14,
  },
  gateActions: {
    display: "flex",
    gap: 12,
  },
  gateDenyButton: {
    flex: 1,
    backgroundColor: "rgba(239, 68, 68, 0.1)",
    border: "1px solid #ef4444",
    color: "#ef4444",
    padding: "10px",
    borderRadius: 6,
    fontWeight: 700,
    cursor: "pointer",
  },
  gateApproveButton: {
    flex: 2,
    backgroundColor: "#22c55e",
    border: "none",
    color: "#090d16",
    padding: "10px",
    borderRadius: 6,
    fontWeight: 700,
    cursor: "pointer",
  },
  simExecutingBox: {
    display: "flex",
    alignItems: "center",
    gap: 12,
    padding: 14,
    backgroundColor: "#0f172a",
    borderRadius: 6,
    border: "1px solid #38bdf8",
  },
  spinner: {
    width: 16,
    height: 16,
    border: "2px solid #1e293b",
    borderTop: "2px solid #38bdf8",
    borderRadius: "50%",
  },
  executingText: {
    color: "#38bdf8",
    fontSize: 13,
    fontFamily: "var(--font-mono)",
  },
  simCompletedBox: {
    padding: 16,
    backgroundColor: "#0f172a",
    borderRadius: 8,
    border: "1px solid #22c55e",
  },
  simSuccessRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    color: "#22c55e",
    fontWeight: 700,
    fontSize: 13,
    marginBottom: 8,
  },
  resetButton: {
    backgroundColor: "#1e293b",
    border: "1px solid #334155",
    color: "#f8fafc",
    padding: "4px 8px",
    borderRadius: 4,
    fontSize: 11,
    cursor: "pointer",
  },
  simOutput: {
    color: "#cbd5e1",
    fontSize: 11,
    fontFamily: "var(--font-mono)",
    margin: 0,
    backgroundColor: "#05080f",
    padding: 10,
    borderRadius: 4,
  },
  featuresSection: {
    maxWidth: 1100,
    margin: "0 auto",
    padding: "60px 24px",
  },
  featureGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
    gap: 24,
  },
  featureCard: {
    backgroundColor: "#0f172a",
    border: "1px solid #1e293b",
    borderRadius: 12,
    padding: 24,
    transition: "border 0.2s",
  },
  featureIconBadge: {
    display: "inline-block",
    backgroundColor: "rgba(56, 189, 248, 0.1)",
    color: "#38bdf8",
    fontFamily: "var(--font-mono)",
    fontWeight: 800,
    fontSize: 13,
    padding: "4px 10px",
    borderRadius: 6,
    marginBottom: 16,
    border: "1px solid rgba(56, 189, 248, 0.2)",
  },
  featureTitle: {
    fontSize: 17,
    fontWeight: 700,
    marginBottom: 8,
  },
  featureDescription: {
    color: "#94a3b8",
    fontSize: 14,
    lineHeight: 1.5,
  },
  codeSnippet: {
    backgroundColor: "#05080f",
    color: "#38bdf8",
    padding: "2px 4px",
    borderRadius: 4,
    fontFamily: "var(--font-mono)",
    fontSize: 12,
  },
  architectureSection: {
    maxWidth: 1100,
    margin: "0 auto",
    padding: "60px 24px",
  },
  archGrid: {
    display: "flex",
    flexWrap: "wrap",
    alignItems: "center",
    justifyContent: "center",
    gap: 16,
  },
  archCard: {
    flex: "1 1 240px",
    backgroundColor: "#0f172a",
    border: "1px solid #1e293b",
    borderRadius: 12,
    padding: 20,
    textAlign: "center",
  },
  archBadge: {
    fontSize: 10,
    fontFamily: "var(--font-mono)",
    color: "#38bdf8",
    fontWeight: 700,
    marginBottom: 6,
  },
  archTitle: {
    fontSize: 16,
    fontWeight: 700,
    marginBottom: 8,
  },
  archText: {
    color: "#94a3b8",
    fontSize: 13,
    lineHeight: 1.4,
  },
  archConnector: {
    color: "#64748b",
    fontFamily: "var(--font-mono)",
    fontSize: 12,
    fontWeight: 600,
  },
  ecosystemSection: {
    maxWidth: 1100,
    margin: "0 auto",
    padding: "60px 24px",
  },
  ecosystemGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
    gap: 20,
  },
  ecoCard: {
    backgroundColor: "#0f172a",
    border: "1px solid #1e293b",
    borderRadius: 10,
    padding: 20,
  },
  ecoBadge: {
    display: "inline-block",
    backgroundColor: "#1e293b",
    color: "#38bdf8",
    fontFamily: "var(--font-mono)",
    fontWeight: 700,
    fontSize: 11,
    padding: "2px 6px",
    borderRadius: 4,
    marginBottom: 10,
  },
  ecoTitle: {
    fontSize: 15,
    fontWeight: 700,
    marginBottom: 6,
  },
  ecoText: {
    color: "#94a3b8",
    fontSize: 13,
    lineHeight: 1.4,
  },
  footer: {
    borderTop: "1px solid #1e293b",
    backgroundColor: "#05080f",
    padding: "40px 24px",
    marginTop: "auto",
  },
  footerContent: {
    maxWidth: 1100,
    margin: "0 auto",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: 16,
    textAlign: "center",
  },
  footerBrand: {
    display: "flex",
    alignItems: "center",
    gap: 8,
  },
  footerText: {
    color: "#64748b",
    fontSize: 13,
    maxWidth: 600,
  },
  footerLinks: {
    display: "flex",
    gap: 20,
    flexWrap: "wrap",
    justifyContent: "center",
  },
  footerLink: {
    color: "#94a3b8",
    fontSize: 13,
  },
};
