import type { Metadata, Viewport } from "next";
import "./globals.css";

export const viewport: Viewport = {
  themeColor: "#090d16",
  width: "device-width",
  initialScale: 1,
};

export const metadata: Metadata = {
  title: "Agent Remote | Open-Source Coding Agent Universal Remote Control",
  description:
    "Control your local coding workstation agents (TrueForge, DeepSeek R1, 0x Alpha, Claude) from your phone or browser with zero port-forwarding, live token streaming, and dual-surface human-in-the-loop approvals.",
  keywords: [
    "coding agent",
    "remote harness",
    "trueforge",
    "deepseek",
    "claude",
    "human in the loop",
    "developer tools",
    "mcp",
  ],
  authors: [{ name: "Agent Remote Team" }],
  openGraph: {
    title: "Agent Remote | Universal Remote Control for Coding Agents",
    description:
      "Stream tokens, inspect visual diffs, and approve critical bash commands from any phone or browser.",
    url: "https://agent-remote.dev",
    siteName: "Agent Remote",
    locale: "en_US",
    type: "website",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          href="https://fonts.googleapis.com/css2?family=Fira+Code:wght@400;500;600;700&family=Inter:wght@400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
