import { hapticsService, ImpactStyle } from "./haptics";

export type AudioAlertType = "approval" | "decision" | "success" | "error" | "click";

export class FeedbackService {
  private static instance: FeedbackService | null = null;
  private isAudioEnabled: boolean = true;
  private isHapticsEnabled: boolean = true;

  private constructor() {}

  public static getInstance(): FeedbackService {
    if (!FeedbackService.instance) {
      FeedbackService.instance = new FeedbackService();
    }
    return FeedbackService.instance;
  }

  public setAudioEnabled(enabled: boolean): void {
    this.isAudioEnabled = enabled;
  }

  public getIsAudioEnabled(): boolean {
    return this.isAudioEnabled;
  }

  public setHapticsEnabled(enabled: boolean): void {
    this.isHapticsEnabled = enabled;
    hapticsService.setEnabled(enabled);
  }

  public getIsHapticsEnabled(): boolean {
    return this.isHapticsEnabled;
  }

  /**
   * Alert when an agent requires human-in-the-loop approval.
   * Emits a warning haptic pulse and synthesized double-tone chime.
   */
  public triggerApprovalAlert(): void {
    if (this.isHapticsEnabled) {
      hapticsService.triggerWarning();
    }
    if (this.isAudioEnabled) {
      this.playTone([520, 660], [0.08, 0.12]);
    }
  }

  /**
   * Feedback when developer approves or denies an action.
   */
  public triggerDecision(approved: boolean): void {
    if (this.isHapticsEnabled) {
      if (approved) {
        hapticsService.triggerSuccess();
      } else {
        hapticsService.triggerError();
      }
    }
    if (this.isAudioEnabled) {
      if (approved) {
        this.playTone([440, 880], [0.06, 0.1]);
      } else {
        this.playTone([330, 220], [0.08, 0.14]);
      }
    }
  }

  /**
   * Feedback on button tap or pill selection.
   */
  public triggerSelection(impact: ImpactStyle = "light"): void {
    if (this.isHapticsEnabled) {
      hapticsService.triggerImpact(impact);
    }
  }

  /**
   * Feedback on successful turn completion.
   */
  public triggerTurnComplete(): void {
    if (this.isHapticsEnabled) {
      hapticsService.triggerSuccess();
    }
    if (this.isAudioEnabled) {
      this.playTone([587.33, 880], [0.06, 0.12]);
    }
  }

  /**
   * Feedback on error, disconnect, or lockout.
   */
  public triggerError(): void {
    if (this.isHapticsEnabled) {
      hapticsService.triggerError();
    }
    if (this.isAudioEnabled) {
      this.playTone([260, 220], [0.1, 0.15]);
    }
  }

  /**
   * Synthesized audio tone player via Web Audio API (cross-platform safe fallback).
   */
  private playTone(frequencies: number[], durations: number[]): void {
    if (typeof window === "undefined") return;

    try {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtx) return;

      const ctx = new AudioCtx();
      let startTime = ctx.currentTime;

      frequencies.forEach((freq, index) => {
        const duration = durations[index] || 0.1;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = "sine";
        osc.frequency.setValueAtTime(freq, startTime);

        gain.gain.setValueAtTime(0.08, startTime);
        gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(startTime);
        osc.stop(startTime + duration);

        startTime += duration + 0.02;
      });

      setTimeout(
        () => {
          try {
            ctx.close();
          } catch {
            // Ignore context close errors
          }
        },
        (startTime - ctx.currentTime + 0.2) * 1000,
      );
    } catch {
      // Audio playback unavailable or blocked by autoplay policy
    }
  }
}

export const feedbackService = FeedbackService.getInstance();
