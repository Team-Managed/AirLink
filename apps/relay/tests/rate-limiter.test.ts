import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { IPRateLimiter } from "../src/rate-limiter.js";

describe("IPRateLimiter", () => {
  let limiter: IPRateLimiter;

  beforeEach(() => {
    vi.useFakeTimers();
    limiter = new IPRateLimiter({
      maxAttempts: 3,
      windowMs: 300_000, // 5 min
      lockoutMs: 300_000, // 5 min
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  it("permits initial attempts and tracks failure count", () => {
    const ip = "192.168.1.100";

    expect(limiter.isLocked(ip)).toBe(false);

    const res1 = limiter.recordFailure(ip);
    expect(res1.locked).toBe(false);
    expect(res1.attempts).toBe(1);
    expect(limiter.isLocked(ip)).toBe(false);

    const res2 = limiter.recordFailure(ip);
    expect(res2.locked).toBe(false);
    expect(res2.attempts).toBe(2);
    expect(limiter.isLocked(ip)).toBe(false);
  });

  it("locks out IP address after 3 consecutive failed PIN attempts", () => {
    const ip = "192.168.1.100";

    limiter.recordFailure(ip); // 1
    limiter.recordFailure(ip); // 2
    const res3 = limiter.recordFailure(ip); // 3 -> Lockout!

    expect(res3.locked).toBe(true);
    expect(res3.attempts).toBe(3);
    expect(res3.remainingLockoutMs).toBe(300_000);
    expect(limiter.isLocked(ip)).toBe(true);
    expect(limiter.getRemainingLockoutMs(ip)).toBeGreaterThan(0);
  });

  it("rejects subsequent attempts during lockout and preserves remaining lockout time", () => {
    const ip = "10.0.0.1";

    limiter.recordFailure(ip);
    limiter.recordFailure(ip);
    limiter.recordFailure(ip);

    // Fast-forward 100 seconds
    vi.advanceTimersByTime(100_000);

    const res4 = limiter.recordFailure(ip);
    expect(res4.locked).toBe(true);
    expect(res4.remainingLockoutMs).toBe(200_000);
    expect(limiter.isLocked(ip)).toBe(true);
  });

  it("clears lockout automatically after 5 minutes elapse", () => {
    const ip = "10.0.0.2";

    limiter.recordFailure(ip);
    limiter.recordFailure(ip);
    limiter.recordFailure(ip);
    expect(limiter.isLocked(ip)).toBe(true);

    // Fast-forward 300,001 ms
    vi.advanceTimersByTime(300_001);

    expect(limiter.isLocked(ip)).toBe(false);
    expect(limiter.getRemainingLockoutMs(ip)).toBe(0);
  });

  it("resets window if attempts occur outside 5-minute window", () => {
    const ip = "10.0.0.3";

    const res1 = limiter.recordFailure(ip);
    expect(res1.attempts).toBe(1);

    // Advance 301 seconds (past window)
    vi.advanceTimersByTime(301_000);

    const res2 = limiter.recordFailure(ip);
    expect(res2.attempts).toBe(1); // Reset to 1, not 2
    expect(limiter.isLocked(ip)).toBe(false);
  });

  it("resets failure records upon successful authentication", () => {
    const ip = "10.0.0.4";

    limiter.recordFailure(ip);
    limiter.recordFailure(ip);
    expect(limiter.getTrackedCount()).toBe(1);

    limiter.recordSuccess(ip);
    expect(limiter.getTrackedCount()).toBe(0);
    expect(limiter.isLocked(ip)).toBe(false);
  });

  it("prunes expired records and lockouts from memory", () => {
    const ip1 = "10.0.0.5";
    const ip2 = "10.0.0.6";

    limiter.recordFailure(ip1); // normal window
    limiter.recordFailure(ip2);
    limiter.recordFailure(ip2);
    limiter.recordFailure(ip2); // locked

    expect(limiter.getTrackedCount()).toBe(2);

    vi.advanceTimersByTime(300_001);

    const pruned = limiter.pruneExpired();
    expect(pruned).toBe(2);
    expect(limiter.getTrackedCount()).toBe(0);
  });
});
