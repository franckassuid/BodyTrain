// Screen WakeLock Service to keep device display on during active workout sessions

class WakeLockService {
  private sentinel: any | null = null;
  private isActive: boolean = false;

  constructor() {
    if (typeof window !== "undefined" && typeof document !== "undefined") {
      document.addEventListener("visibilitychange", this.handleVisibilityChange);
    }
  }

  private handleVisibilityChange = async () => {
    if (this.isActive && document.visibilityState === "visible") {
      await this.acquire();
    }
  };

  /** Acquire screen wake lock so display does not turn off */
  public async acquire(): Promise<boolean> {
    this.isActive = true;
    if (typeof navigator === "undefined" || !("wakeLock" in navigator)) {
      return false;
    }

    try {
      if (this.sentinel) {
        return true;
      }
      this.sentinel = await (navigator as any).wakeLock.request("screen");
      this.sentinel.addEventListener("release", () => {
        this.sentinel = null;
      });
      return true;
    } catch (err) {
      console.warn("[WakeLock] Could not acquire screen wake lock:", err);
      return false;
    }
  }

  /** Release screen wake lock to restore standard OS timeout */
  public async release(): Promise<void> {
    this.isActive = false;
    if (this.sentinel) {
      try {
        await this.sentinel.release();
      } catch {
        // ignore
      }
      this.sentinel = null;
    }
  }

  public isSupported(): boolean {
    return typeof navigator !== "undefined" && "wakeLock" in navigator;
  }
}

export const wakeLockService = new WakeLockService();
