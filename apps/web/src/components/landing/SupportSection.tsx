"use client";

import React, { useState } from "react";

export function SupportSection() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "General Inquiry",
    message: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedTicket, setSubmittedTicket] = useState<{ id: string; email: string } | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.email || !formData.message) return;

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      const res = await fetch("/api/support", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await res.json();
      if (res.ok && data.ok) {
        setSubmittedTicket({ id: data.ticketId, email: formData.email });
        setFormData({ name: "", email: "", subject: "General Inquiry", message: "" });
      } else {
        setSubmitError(data.error || "Failed to submit support request. Please try again.");
      }
    } catch {
      setSubmitError("Network error while submitting support ticket. Please check your connection.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section id="support" style={styles.section}>
      <div style={styles.header}>
        <h2 style={styles.sectionTitle}>We’re Here to Help</h2>
        <p style={styles.sectionDesc}>
          Have an issue with local bridge pairing, custom tool hooks, or self-hosting? Reach our team directly.
        </p>
      </div>

      <div style={styles.grid}>
        {/* Contact Form Card */}
        <div className="saas-card" style={styles.formCard}>
          <h3 style={styles.cardTitle}>Send a Support Request</h3>
          <p style={styles.cardSubtitle}>
            Our engineering team typically responds within 2 hours during active hackathon hours.
          </p>

          {submittedTicket ? (
            <div style={styles.successBox}>
              <div style={styles.successIcon}>✓</div>
              <h4 style={styles.successTitle}>Support Request Logged!</h4>
              <p style={styles.successDesc}>
                Ticket <strong>{submittedTicket.id}</strong> has been created. An engineer will reply to {submittedTicket.email} shortly.
              </p>
              <button
                type="button"
                onClick={() => setSubmittedTicket(null)}
                style={{ ...styles.submitBtn, marginTop: 12, padding: "8px 18px", fontSize: 13 }}
              >
                Submit Another Request
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} style={styles.form}>
              {submitError && (
                <div style={{ padding: "10px 14px", backgroundColor: "#fef2f2", border: "1px solid #fecaca", borderRadius: 8, color: "#dc2626", fontSize: 13 }}>
                  {submitError}
                </div>
              )}
              <div style={styles.inputRow}>
                <div style={styles.fieldCol}>
                  <label style={styles.label}>Your Name</label>
                  <input
                    type="text"
                    required
                    placeholder="Jane Doe"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    style={styles.input}
                  />
                </div>
                <div style={styles.fieldCol}>
                  <label style={styles.label}>Work Email</label>
                  <input
                    type="email"
                    required
                    placeholder="jane@company.com"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    style={styles.input}
                  />
                </div>
              </div>

              <div style={styles.fieldCol}>
                <label style={styles.label}>Topic / Category</label>
                <select
                  value={formData.subject}
                  onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                  style={styles.select}
                >
                  <option value="General Inquiry">General Inquiry</option>
                  <option value="Local Daemon Troubleshooting">Local Daemon Troubleshooting</option>
                  <option value="PIN Pairing / Relay Issue">PIN Pairing / Relay Issue</option>
                  <option value="MCP Tool & Safety Gate Integration">MCP Tool &amp; Safety Gate Integration</option>
                  <option value="Self-Hosting / Enterprise Relay">Self-Hosting / Enterprise Relay</option>
                </select>
              </div>

              <div style={styles.fieldCol}>
                <label style={styles.label}>How can we help?</label>
                <textarea
                  required
                  rows={4}
                  placeholder="Describe your question or issue in detail..."
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  style={styles.textarea}
                />
              </div>

              <button type="submit" disabled={isSubmitting} style={styles.submitBtn}>
                <span>{isSubmitting ? "Submitting Ticket..." : "Submit Ticket"}</span>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M5 12h14M12 5l7 7-7 7" />
                </svg>
              </button>
            </form>
          )}
        </div>

        {/* Direct Channels Column */}
        <div style={styles.channelsCol}>
          {/* Channel 1: GitHub Issues */}
          <div className="saas-card" style={styles.channelCard}>
            <div style={styles.channelIconWell}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#182030" strokeWidth="2.2">
                <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22" />
              </svg>
            </div>
            <div>
              <h4 style={styles.channelTitle}>GitHub Issue Tracker</h4>
              <p style={styles.channelDesc}>
                Open bug reports, feature requests, or browse existing reproducible snippets.
              </p>
              <a
                href="https://github.com/agent-remote/agent-harness/issues"
                target="_blank"
                rel="noreferrer"
                style={styles.channelLink}
              >
                Open GitHub Issues &rarr;
              </a>
            </div>
          </div>

          {/* Channel 2: Live Community Discord */}
          <div className="saas-card" style={styles.channelCard}>
            <div style={styles.channelIconWell}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#e08a5b" strokeWidth="2.2">
                <circle cx="12" cy="12" r="10" />
                <path d="M8 12h.01M16 12h.01M9.5 16c1.5 1 3.5 1 5 0" />
              </svg>
            </div>
            <div>
              <h4 style={styles.channelTitle}>Developer Community</h4>
              <p style={styles.channelDesc}>
                Connect with maintainers, share agent workflows, and ask live questions in our discord.
              </p>
              <a
                href="https://discord.com"
                target="_blank"
                rel="noreferrer"
                style={styles.channelLink}
              >
                Join Developer Channel &rarr;
              </a>
            </div>
          </div>

          {/* Channel 3: Documentation & Guides */}
          <div className="saas-card" style={styles.channelCard}>
            <div style={styles.channelIconWell}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#228a7a" strokeWidth="2.2">
                <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1-2.5-2.5Z" />
                <path d="M6 6h10M6 10h10M6 14h6" />
              </svg>
            </div>
            <div>
              <h4 style={styles.channelTitle}>Docs &amp; Architecture Specs</h4>
              <p style={styles.channelDesc}>
                Read full specifications on the 6-digit PIN handshake and TrueFoundry Double-O track.
              </p>
              <a href="#architecture" style={styles.channelLink}>
                View Technical Specs &rarr;
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

const styles: Record<string, React.CSSProperties> = {
  section: {
    maxWidth: 1200,
    margin: "0 auto 100px",
    padding: "0 24px",
    position: "relative",
    zIndex: 10,
  },
  header: {
    textAlign: "center",
    marginBottom: 48,
  },
  sectionTag: {
    color: "#0d9488",
    fontSize: 12,
    fontFamily: "var(--font-mono)",
    fontWeight: 700,
    textTransform: "uppercase",
    letterSpacing: 1,
    backgroundColor: "rgba(13, 148, 136, 0.1)",
    border: "1px solid rgba(13, 148, 136, 0.25)",
    padding: "3px 12px",
    borderRadius: 9999,
  },
  sectionTitle: {
    fontFamily: "var(--font-display)",
    fontSize: "clamp(28px, 3.5vw, 42px)",
    fontWeight: 900,
    color: "#0f172a",
    letterSpacing: -1,
    marginTop: 8,
    marginBottom: 12,
  },
  sectionDesc: {
    color: "#475569",
    fontSize: 15.5,
    maxWidth: 620,
    margin: "0 auto",
    lineHeight: 1.6,
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "1.2fr 1fr",
    gap: 32,
    alignItems: "start",
  },
  formCard: {
    backgroundColor: "#ffffff",
    border: "1px solid #e2e8f0",
    borderRadius: 16,
    padding: 32,
    boxShadow: "0 4px 24px -4px rgba(15, 23, 42, 0.06)",
  },
  cardTitle: {
    fontFamily: "var(--font-display)",
    fontSize: 20,
    fontWeight: 800,
    color: "#0f172a",
    letterSpacing: -0.4,
    marginBottom: 6,
  },
  cardSubtitle: {
    color: "#64748b",
    fontSize: 13.5,
    lineHeight: 1.5,
    marginBottom: 24,
  },
  form: {
    display: "flex",
    flexDirection: "column",
    gap: 16,
  },
  inputRow: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: 16,
  },
  fieldCol: {
    display: "flex",
    flexDirection: "column",
    gap: 6,
  },
  label: {
    fontSize: 12,
    fontWeight: 700,
    color: "#0f172a",
    letterSpacing: 0.3,
  },
  input: {
    backgroundColor: "#ffffff",
    border: "1px solid #cbd5e1",
    borderRadius: 8,
    padding: "10px 14px",
    fontSize: 13.5,
    color: "#0f172a",
    outline: "none",
    transition: "border-color 0.15s ease",
  },
  select: {
    backgroundColor: "#ffffff",
    border: "1px solid #cbd5e1",
    borderRadius: 8,
    padding: "10px 14px",
    fontSize: 13.5,
    color: "#0f172a",
    outline: "none",
    cursor: "pointer",
  },
  textarea: {
    backgroundColor: "#ffffff",
    border: "1px solid #cbd5e1",
    borderRadius: 8,
    padding: "10px 14px",
    fontSize: 13.5,
    color: "#0f172a",
    outline: "none",
    resize: "vertical",
    fontFamily: "inherit",
  },
  submitBtn: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    background: "linear-gradient(135deg, #5b9bd5 0%, #3e82c5 100%)",
    color: "#ffffff",
    border: "1px solid rgba(255, 255, 255, 0.35)",
    borderRadius: 8,
    padding: "12px 24px",
    fontSize: 14,
    fontWeight: 700,
    cursor: "pointer",
    boxShadow: "0 4px 14px rgba(62, 130, 197, 0.35)",
    transition: "all 0.15s ease",
    marginTop: 4,
  },
  successBox: {
    backgroundColor: "rgba(13, 148, 136, 0.1)",
    border: "1px solid rgba(13, 148, 136, 0.3)",
    borderRadius: 12,
    padding: 24,
    textAlign: "center",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: 8,
  },
  successIcon: {
    width: 36,
    height: 36,
    borderRadius: "50%",
    backgroundColor: "#0d9488",
    color: "#ffffff",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontWeight: 900,
    fontSize: 18,
  },
  successTitle: {
    fontFamily: "var(--font-display)",
    fontSize: 17,
    fontWeight: 800,
    color: "#0f172a",
    margin: 0,
  },
  successDesc: {
    fontSize: 13.5,
    color: "#475569",
    lineHeight: 1.5,
    margin: 0,
  },
  channelsCol: {
    display: "flex",
    flexDirection: "column",
    gap: 16,
  },
  channelCard: {
    backgroundColor: "#ffffff",
    border: "1px solid #e2e8f0",
    borderRadius: 14,
    padding: 20,
    display: "flex",
    gap: 16,
    alignItems: "flex-start",
    boxShadow: "0 2px 10px rgba(15, 23, 42, 0.03)",
  },
  channelIconWell: {
    width: 44,
    height: 44,
    borderRadius: 10,
    backgroundColor: "#f8fafc",
    border: "1px solid #e2e8f0",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  channelTitle: {
    fontFamily: "var(--font-display)",
    fontSize: 16,
    fontWeight: 800,
    color: "#0f172a",
    letterSpacing: -0.3,
    marginBottom: 4,
  },
  channelDesc: {
    color: "#64748b",
    fontSize: 13,
    lineHeight: 1.5,
    marginBottom: 8,
  },
  channelLink: {
    color: "#ea580c",
    fontSize: 13,
    fontWeight: 700,
    textDecoration: "none",
    display: "inline-flex",
    alignItems: "center",
    gap: 4,
    transition: "color 0.15s ease",
  },
};
