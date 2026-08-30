"use client";

import React, { useState } from "react";

interface FaqItem {
  question: string;
  answer: string;
  category: string;
}

const FAQS: FaqItem[] = [
  {
    category: "Security & Privacy",
    question: "Is my source code or API keys saved on your servers?",
    answer:
      "No. AirLink operates with an ephemeral, zero-retention policy. Tokens, AST diffs, and bash commands are routed purely in-memory through encrypted WebSocket channels and immediately discarded. Your BYOK credentials never leave your browser memory.",
  },
  {
    category: "Connectivity",
    question: "How does teleoperation work without port forwarding or ngrok?",
    answer:
      "Your local workstation daemon initiates an outbound WebSocket connection to the ephemeral relay and generates a cryptographically random 6-digit PIN. When you enter the PIN on your phone or web browser, the relay pairs the two streams instantly without opening inbound router ports.",
  },
  {
    category: "Safety & Approvals",
    question: "What happens if a bash command is deemed dangerous while I am away?",
    answer:
      "AirLink intercepts all write operations and bash commands via our Human-in-the-Loop (HITL) gate. If a destructive command (like rm -rf, git push --force, or sudo) is attempted, the agent pauses for 180 seconds and sends an instant push notification with a 1-tap Approve/Deny action.",
  },
  {
    category: "Agent Compatibility",
    question: "Which coding agent frameworks and models are supported?",
    answer:
      "AirLink supports TrueForge, DeepSeek R1, Claude 3.7 Sonnet, OpenAI o3-mini, Gemini 2.0 Flash, and any agent protocol supporting standard JSON-RPC event streams.",
  },
  {
    category: "Platform Support",
    question: "Can I use AirLink on both iOS and Android?",
    answer:
      "Yes. AirLink runs as an installable Progressive Web App (PWA) with native mobile haptics, as well as a standalone web remote for desktop browsers and a native VS Code sidebar extension.",
  },
  {
    category: "Self-Hosting",
    question: "Can I self-host the entire AirLink Relay on my own infrastructure?",
    answer:
      "Absolutely. The entire AirLink repository is 100% open-source under the MIT license. You can deploy the relay on Cloudflare Workers, Docker, or Kubernetes with a single command.",
  },
];

export function FaqSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const toggleFaq = (idx: number) => {
    setOpenIndex(openIndex === idx ? null : idx);
  };

  return (
    <section id="faqs" style={styles.section}>
      <div style={styles.header}>
        <h2 style={styles.sectionTitle}>Frequently Asked Questions</h2>
        <p style={styles.sectionDesc}>
          Everything you need to know about AirLink architecture, privacy, security, and teleoperation.
        </p>
      </div>

      <div style={styles.faqList}>
        {FAQS.map((faq, idx) => {
          const isOpen = openIndex === idx;
          return (
            <div
              key={faq.question}
              className="saas-card"
              style={{
                ...styles.faqCard,
                borderColor: isOpen ? "#2563eb" : "#e2e8f0",
              }}
            >
              <button
                type="button"
                onClick={() => toggleFaq(idx)}
                style={styles.faqQuestionBtn}
                aria-expanded={isOpen}
              >
                <div style={styles.questionTextCol}>
                  <span style={styles.categoryText}>{faq.category}</span>
                  <span style={styles.questionText}>{faq.question}</span>
                </div>
                <div
                  style={{
                    ...styles.chevronWrap,
                    transform: isOpen ? "rotate(180deg)" : "rotate(0deg)",
                  }}
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#0f172a" strokeWidth="2.5">
                    <polyline points="6 9 12 15 18 9" />
                  </svg>
                </div>
              </button>

              {isOpen && (
                <div style={styles.faqAnswer}>
                  <p style={styles.answerText}>{faq.answer}</p>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}

const styles: Record<string, React.CSSProperties> = {
  section: {
    maxWidth: 960,
    margin: "0 auto 90px",
    padding: "0 24px",
    position: "relative",
    zIndex: 10,
  },
  header: {
    textAlign: "center",
    marginBottom: 44,
  },
  sectionTitle: {
    fontFamily: "var(--font-display)",
    fontSize: "clamp(28px, 3.5vw, 40px)",
    fontWeight: 900,
    color: "#0f172a",
    letterSpacing: -1,
    marginBottom: 10,
  },
  sectionDesc: {
    color: "#475569",
    fontSize: 15.5,
    maxWidth: 580,
    margin: "0 auto",
    lineHeight: 1.6,
  },
  faqList: {
    display: "flex",
    flexDirection: "column",
    gap: 14,
  },
  faqCard: {
    backgroundColor: "#ffffff",
    border: "1px solid #e2e8f0",
    borderRadius: 12,
    padding: 0,
    overflow: "hidden",
    boxShadow: "0 2px 8px rgba(15, 23, 42, 0.04)",
    transition: "border-color 0.2s ease, box-shadow 0.2s ease",
  },
  faqQuestionBtn: {
    width: "100%",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "20px 24px",
    backgroundColor: "transparent",
    border: "none",
    textAlign: "left",
    cursor: "pointer",
    gap: 16,
  },
  questionTextCol: {
    display: "flex",
    flexDirection: "column",
    alignItems: "flex-start",
    gap: 4,
  },
  categoryText: {
    fontSize: 11,
    fontFamily: "var(--font-mono)",
    fontWeight: 700,
    color: "#2563eb",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  questionText: {
    fontFamily: "var(--font-display)",
    fontSize: 16.5,
    fontWeight: 800,
    color: "#0f172a",
    letterSpacing: -0.3,
  },
  chevronWrap: {
    width: 28,
    height: 28,
    borderRadius: "50%",
    backgroundColor: "#f1f5f9",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    transition: "transform 0.25s cubic-bezier(0.16, 1, 0.3, 1)",
    flexShrink: 0,
  },
  faqAnswer: {
    padding: "0 24px 22px",
    borderTop: "1px solid #e2e8f0",
    marginTop: 4,
    paddingTop: 16,
  },
  answerText: {
    color: "#334155",
    fontSize: 14.5,
    lineHeight: 1.65,
    margin: 0,
  },
};
