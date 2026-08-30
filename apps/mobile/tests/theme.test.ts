import { describe, it, expect } from "vitest";
import { THEME, THEME_COLORS, THEME_TYPOGRAPHY, THEME_SPACING, THEME_RADII } from "../src/theme.js";

describe("Mobile UI Theme Tokens", () => {
  it("defines the exact dark developer palette from ui-context.md", () => {
    expect(THEME_COLORS.backgroundBase).toBe("#090d16");
    expect(THEME_COLORS.cardSurface).toBe("#0f172a");
    expect(THEME_COLORS.border).toBe("#1e293b");
    expect(THEME_COLORS.primaryAccent).toBe("#ffffff");
    expect(THEME_COLORS.success).toBe("#22c55e");
    expect(THEME_COLORS.danger).toBe("#ef4444");
    expect(THEME_COLORS.warning).toBe("#f59e0b");
    expect(THEME_COLORS.textPrimary).toBe("#f8fafc");
    expect(THEME_COLORS.textMuted).toBe("#94a3b8");
  });

  it("contains complete typography and scale definitions", () => {
    expect(THEME_TYPOGRAPHY.fontSize.pin).toBe(32);
    expect(THEME_TYPOGRAPHY.fontSize.sm).toBe(13);
    expect(THEME_TYPOGRAPHY.fontSize.md).toBe(15);
    expect(THEME_TYPOGRAPHY.fontFamily.sans).toContain("Segoe UI");
    expect(THEME_TYPOGRAPHY.fontFamily.mono).toContain("Fira Code");
  });

  it("contains spacing and radii definitions", () => {
    expect(THEME_SPACING.sm).toBe(8);
    expect(THEME_SPACING.md).toBe(12);
    expect(THEME_SPACING.lg).toBe(16);
    expect(THEME_RADII.md).toBe(10);
    expect(THEME_RADII.full).toBe(9999);
  });

  it("exports unified theme object", () => {
    expect(THEME.colors).toBe(THEME_COLORS);
    expect(THEME.typography).toBe(THEME_TYPOGRAPHY);
    expect(THEME.spacing).toBe(THEME_SPACING);
    expect(THEME.radii).toBe(THEME_RADII);
  });
});
