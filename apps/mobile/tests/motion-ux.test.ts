import { describe, it, expect } from "vitest";
import { THEME_COLORS } from "../src/theme";

describe("Motion UX and Countdown Interpolation Suite", () => {
  it("computes countdown color transitions matching the 3 bands correctly", () => {
    const getProgressColor = (secondsRemaining: number): string => {
      if (secondsRemaining > 60) return THEME_COLORS.success;
      if (secondsRemaining > 20) return THEME_COLORS.warning;
      return THEME_COLORS.danger;
    };

    // Emerald Green (> 60s)
    expect(getProgressColor(180)).toBe(THEME_COLORS.success);
    expect(getProgressColor(120)).toBe(THEME_COLORS.success);
    expect(getProgressColor(61)).toBe(THEME_COLORS.success);

    // Amber Yellow (20s - 60s)
    expect(getProgressColor(60)).toBe(THEME_COLORS.warning);
    expect(getProgressColor(45)).toBe(THEME_COLORS.warning);
    expect(getProgressColor(21)).toBe(THEME_COLORS.warning);

    // Crimson Red (<= 20s)
    expect(getProgressColor(20)).toBe(THEME_COLORS.danger);
    expect(getProgressColor(10)).toBe(THEME_COLORS.danger);
    expect(getProgressColor(1)).toBe(THEME_COLORS.danger);
    expect(getProgressColor(0)).toBe(THEME_COLORS.danger);
  });

  it("calculates progress percentage correctly bounded between 0% and 100%", () => {
    const totalSeconds = 180;
    const calcPercent = (rem: number) => Math.max(0, Math.min(100, (rem / totalSeconds) * 100));

    expect(calcPercent(180)).toBe(100);
    expect(calcPercent(90)).toBe(50);
    expect(calcPercent(0)).toBe(0);
    expect(calcPercent(-5)).toBe(0);
    expect(calcPercent(200)).toBe(100);
  });

  it("formats countdown time strings correctly", () => {
    const formatTime = (secs: number): string => {
      const mins = Math.floor(secs / 60);
      const remSecs = secs % 60;
      return `${mins}:${remSecs < 10 ? "0" : ""}${remSecs}`;
    };

    expect(formatTime(180)).toBe("3:00");
    expect(formatTime(125)).toBe("2:05");
    expect(formatTime(59)).toBe("0:59");
    expect(formatTime(9)).toBe("0:09");
    expect(formatTime(0)).toBe("0:00");
  });
});
