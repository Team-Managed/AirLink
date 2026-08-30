/**
 * UI Theme Tokens for Agent Remote Mobile Client
 * Strict adherence to ui-context.md and Spec 07/08/09.
 */

export const THEME_COLORS = {
  // Base & Surfaces
  backgroundBase: "#090d16", // Deep obsidian navy
  cardSurface: "#0f172a", // Slate 900
  cardSurfaceDeep: "#0c1322", // Deep card surface (Screen 1 & 5)
  cardSurfaceHover: "#1e293b", // Slate 800
  boxInset: "#0a101f", // PIN and Code box inset
  border: "#1e293b", // Slate 800
  borderFocus: "rgba(255, 255, 255, 0.4)", // White accent border
  borderLight: "#334155", // Slate 700

  // Frosted Glass & Translucent Panels
  glassPanel: "rgba(255, 255, 255, 0.06)",
  glassBorder: "rgba(255, 255, 255, 0.08)",
  glassBorderLight: "rgba(255, 255, 255, 0.12)",
  glassSubtle: "rgba(255, 255, 255, 0.03)",

  // Primary Accent & Brand Highlights (Clean Minimal White)
  primaryAccent: "#ffffff", // Pure White Accent
  primaryAccentHover: "#f1f5f9",
  primaryAccentBg: "rgba(255, 255, 255, 0.1)",
  brandBlue: "#ffffff", // Action button white

  // Status & Semantic Colors
  success: "#22c55e", // Emerald Green (Added lines, success)
  successBg: "rgba(34, 197, 94, 0.15)",
  emeraldBadgeBg: "rgba(6, 78, 59, 0.35)",
  emeraldBadgeBorder: "rgba(16, 185, 129, 0.35)",
  emeraldText: "#34d399",

  danger: "#ef4444", // Crimson Red (Removed lines, errors, deny)
  dangerBg: "rgba(239, 68, 68, 0.15)",
  delText: "#f87171",
  delLineBg: "rgba(239, 68, 68, 0.12)",
  addLineBg: "rgba(34, 197, 94, 0.12)",

  warning: "#f59e0b", // Amber Yellow (Approvals, warning pulse)
  warningBg: "rgba(245, 158, 11, 0.15)",
  warningOrange: "#ea580c",
  warningOrangeBg: "rgba(234, 88, 12, 0.1)",
  warningOrangeBorder: "rgba(234, 88, 12, 0.3)",

  // Text Hierarchy
  textPrimary: "#f8fafc", // Slate 50
  textSecondary: "#cbd5e1", // Slate 300
  textMuted: "#94a3b8", // Slate 400
  textDim: "#64748b", // Slate 500

  // Code & Terminal Surfaces
  codeBg: "#030712", // Pure dark slate for logs and terminal code
  codeInlineBg: "#1e293b",

  // Overlays & Modals
  backdrop: "rgba(3, 7, 18, 0.85)",
  drawerHandle: "#475569",
} as const;

export const THEME_TYPOGRAPHY = {
  fontFamily: {
    sans: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    mono: "'Fira Code', 'JetBrains Mono', Menlo, Monaco, Consolas, monospace",
  },
  fontSize: {
    xs: 11,
    sm: 13,
    md: 15,
    lg: 18,
    xl: 22,
    xxl: 28,
    pin: 32,
  },
  lineHeight: {
    xs: 16,
    sm: 18,
    md: 22,
    lg: 26,
    xl: 30,
    xxl: 36,
  },
  fontWeight: {
    regular: "400",
    medium: "500",
    semibold: "600",
    bold: "700",
    heavy: "800",
  } as const,
} as const;

export const THEME_SPACING = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
} as const;

export const THEME_RADII = {
  sm: 6,
  md: 10,
  lg: 14,
  xl: 18,
  full: 9999,
} as const;

export const THEME = {
  colors: THEME_COLORS,
  typography: THEME_TYPOGRAPHY,
  spacing: THEME_SPACING,
  radii: THEME_RADII,
} as const;

export type Theme = typeof THEME;
