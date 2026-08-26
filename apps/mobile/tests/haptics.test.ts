import { describe, it, expect, beforeEach } from "vitest";
import { MobileHapticsService } from "../src/services/haptics.js";

describe("Mobile Haptics Service", () => {
  let service: MobileHapticsService;

  beforeEach(() => {
    service = MobileHapticsService.getInstance();
    service.setEnabled(true);
  });

  it("is a singleton instance", () => {
    const s1 = MobileHapticsService.getInstance();
    const s2 = MobileHapticsService.getInstance();
    expect(s1).toBe(s2);
  });

  it("allows toggling haptic feedback on and off", () => {
    expect(service.getIsEnabled()).toBe(true);
    service.setEnabled(false);
    expect(service.getIsEnabled()).toBe(false);
    service.setEnabled(true);
    expect(service.getIsEnabled()).toBe(true);
  });

  it("executes trigger functions safely without throwing exceptions in node/test environments", () => {
    expect(() => service.triggerWarning()).not.toThrow();
    expect(() => service.triggerImpact("light")).not.toThrow();
    expect(() => service.triggerImpact("medium")).not.toThrow();
    expect(() => service.triggerImpact("heavy")).not.toThrow();
    expect(() => service.triggerSuccess()).not.toThrow();
    expect(() => service.triggerError()).not.toThrow();
    expect(() => service.triggerSelection()).not.toThrow();
  });
});
