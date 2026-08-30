import { Vibration, Platform } from "react-native";

export type ImpactStyle = "light" | "medium" | "heavy";

export class MobileHapticsService {
  private static instance: MobileHapticsService | null = null;
  private isEnabled: boolean = true;

  private constructor() {}

  public static getInstance(): MobileHapticsService {
    if (!MobileHapticsService.instance) {
      MobileHapticsService.instance = new MobileHapticsService();
    }
    return MobileHapticsService.instance;
  }

  public setEnabled(enabled: boolean): void {
    this.isEnabled = enabled;
  }

  public getIsEnabled(): boolean {
    return this.isEnabled;
  }

  /**
   * Warning haptic pulse triggered when an approval drawer opens.
   */
  public triggerWarning(): void {
    if (!this.isEnabled) return;
    this.vibrate([30, 40, 30]);
  }

  /**
   * Impact feedback triggered on button taps.
   */
  public triggerImpact(style: ImpactStyle = "medium"): void {
    if (!this.isEnabled) return;
    switch (style) {
      case "light":
        this.vibrate(10);
        break;
      case "heavy":
        this.vibrate(40);
        break;
      case "medium":
      default:
        this.vibrate(20);
        break;
    }
  }

  /**
   * Success notification haptic on approved action.
   */
  public triggerSuccess(): void {
    if (!this.isEnabled) return;
    this.vibrate([15, 30, 15]);
  }

  /**
   * Error notification haptic on denied action or invalid PIN.
   */
  public triggerError(): void {
    if (!this.isEnabled) return;
    this.vibrate([50, 50, 50]);
  }

  /**
   * Light selection tap on PIN digit entry or quick-action pill tap.
   */
  public triggerSelection(): void {
    if (!this.isEnabled) return;
    this.vibrate(8);
  }

  private vibrate(pattern: number | number[]): void {
    if (!this.isEnabled) return;

    // 1. Native iOS / Android platforms via React Native Vibration API
    if (typeof Platform !== "undefined" && (Platform.OS === "ios" || Platform.OS === "android")) {
      try {
        Vibration.vibrate(pattern);
        return;
      } catch {
        // Silently catch native vibration errors
      }
    }

    // 2. Web browser fallback via Navigator Vibration API
    if (typeof navigator !== "undefined" && typeof navigator.vibrate === "function") {
      try {
        navigator.vibrate(pattern);
      } catch {
        // Silently ignore browser vibration errors
      }
    }
  }
}

export const hapticsService = MobileHapticsService.getInstance();
