export interface RateLimiterOptions {
  maxAttempts?: number | undefined;
  windowMs?: number | undefined;
  lockoutMs?: number | undefined;
}

export interface IPRecord {
  attempts: number;
  windowStart: number;
  lockedUntil: number | null;
}

export interface RateLimitResult {
  locked: boolean;
  remainingLockoutMs: number;
  attempts: number;
}

/**
 * IPRateLimiter
 * In-memory anti-brute-force rate limiter tracking failed pairing attempts per IP address.
 * Locks out an IP for 5 minutes after 3 consecutive failed PIN attempts within a 5-minute window.
 */
export class IPRateLimiter {
  readonly maxAttempts: number;
  readonly windowMs: number;
  readonly lockoutMs: number;
  private readonly _records = new Map<string, IPRecord>();

  constructor(options: RateLimiterOptions = {}) {
    this.maxAttempts = options.maxAttempts ?? 3;
    this.windowMs = options.windowMs ?? 300_000; // 5 minutes
    this.lockoutMs = options.lockoutMs ?? 300_000; // 5 minutes
  }

  /**
   * Checks if an IP address is currently locked out.
   */
  isLocked(ip: string): boolean {
    const record = this._records.get(ip);
    if (!record || record.lockedUntil === null) {
      return false;
    }

    const now = Date.now();
    if (now < record.lockedUntil) {
      return true;
    }

    // Lockout expired, reset record
    this._records.delete(ip);
    return false;
  }

  /**
   * Returns the remaining lockout duration in milliseconds, or 0 if not locked.
   */
  getRemainingLockoutMs(ip: string): number {
    const record = this._records.get(ip);
    if (!record || record.lockedUntil === null) {
      return 0;
    }

    const remaining = record.lockedUntil - Date.now();
    return remaining > 0 ? remaining : 0;
  }

  /**
   * Records a failed pairing attempt for the given IP address.
   * If attempts reach maxAttempts within windowMs, applies a lockout.
   */
  recordFailure(ip: string): RateLimitResult {
    const now = Date.now();
    let record = this._records.get(ip);

    // If currently locked, return existing lock state
    if (record && record.lockedUntil !== null) {
      if (now < record.lockedUntil) {
        return {
          locked: true,
          remainingLockoutMs: record.lockedUntil - now,
          attempts: record.attempts,
        };
      } else {
        // Lockout expired
        record = undefined;
        this._records.delete(ip);
      }
    }

    // Check if previous window expired
    if (!record || now - record.windowStart > this.windowMs) {
      record = {
        attempts: 1,
        windowStart: now,
        lockedUntil: null,
      };
    } else {
      record.attempts += 1;
    }

    // Check if threshold exceeded
    if (record.attempts >= this.maxAttempts) {
      record.lockedUntil = now + this.lockoutMs;
      this._records.set(ip, record);
      return {
        locked: true,
        remainingLockoutMs: this.lockoutMs,
        attempts: record.attempts,
      };
    }

    this._records.set(ip, record);
    return {
      locked: false,
      remainingLockoutMs: 0,
      attempts: record.attempts,
    };
  }

  /**
   * Records a successful pairing attempt, clearing any tracked failures for the IP.
   */
  recordSuccess(ip: string): void {
    this._records.delete(ip);
  }

  /**
   * Resets rate-limit records for a specific IP address.
   */
  reset(ip: string): void {
    this._records.delete(ip);
  }

  /**
   * Clears all tracked rate-limit records from memory.
   */
  clear(): void {
    this._records.clear();
  }

  /**
   * Prunes expired records and lockouts to maintain zero memory leak.
   */
  pruneExpired(): number {
    const now = Date.now();
    let pruned = 0;

    for (const [ip, record] of this._records.entries()) {
      if (record.lockedUntil !== null) {
        if (now >= record.lockedUntil) {
          this._records.delete(ip);
          pruned++;
        }
      } else if (now - record.windowStart > this.windowMs) {
        this._records.delete(ip);
        pruned++;
      }
    }

    return pruned;
  }

  /**
   * Returns total count of currently tracked IPs.
   */
  getTrackedCount(): number {
    return this._records.size;
  }
}
