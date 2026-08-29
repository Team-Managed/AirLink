import type { Metadata, Viewport } from "next";
import "./globals.css";

export const viewport: Viewport = {
  themeColor: "#e8ece6",
  width: "device-width",
  initialScale: 1,
};

export const metadata: Metadata = {
  title: "AirLink | Autonomous Coding Agent Teleoperation & Safety Gate",
  description:
    "Over-the-air coding agent teleoperation and human-in-the-loop safety gate. Stream tokens, inspect diffs, and approve workstation commands from any phone or browser.",
  keywords: [
    "airlink",
    "coding agent",
    "remote harness",
    "trueforge",
    "deepseek",
    "claude",
    "human in the loop",
    "developer tools",
    "mcp",
    "teleoperation",
  ],
  authors: [{ name: "AirLink Team" }],
  openGraph: {
    title: "AirLink | Autonomous Coding Agent Teleoperation & Safety Gate",
    description:
      "Stream tokens, inspect visual diffs, and approve critical bash commands from any phone or browser.",
    url: "https://airlink.dev",
    siteName: "AirLink",
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
          href="https://fonts.googleapis.com/css2?family=Fira+Code:wght@400;500;600;700&family=Inter:wght@400;500;600;700;800&family=Manrope:wght@500;600;700;800;900&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
