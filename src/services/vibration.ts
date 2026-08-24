// Haptic feedback service with safe feature detection

class VibrationService {
  private enabled: boolean = true;

  public setEnabled(enabled: boolean) {
    this.enabled = enabled;
  }

  public isEnabled(): boolean {
    return this.enabled;
  }

  /** Short subtle pulse for countdown */
  public tick() {
    if (!this.enabled || typeof window === "undefined" || !("vibrate" in navigator)) return;
    try {
      navigator.vibrate(35);
    } catch {
      // Ignore vibration error
    }
  }

  /** Double pulse for transition / new exercise */
  public transition() {
    if (!this.enabled || typeof window === "undefined" || !("vibrate" in navigator)) return;
    try {
      navigator.vibrate([70, 50, 70]);
    } catch {
      // Ignore vibration error
    }
  }

  /** Success pattern for finished workout */
  public completion() {
    if (!this.enabled || typeof window === "undefined" || !("vibrate" in navigator)) return;
    try {
      navigator.vibrate([100, 60, 100, 60, 180]);
    } catch {
      // Ignore vibration error
    }
  }
}

export const vibrationService = new VibrationService();
