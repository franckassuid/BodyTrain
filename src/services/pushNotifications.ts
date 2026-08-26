// Web Push API service and subscription manager for PWA (iOS 16.4+ standalone & Android/Desktop)

export interface PushSubscriptionState {
  isSupported: boolean;
  isIos: boolean;
  isStandalone: boolean;
  isSecureContext: boolean;
  permission: NotificationPermission;
  isSubscribed: boolean;
  subscription: PushSubscription | null;
  error?: string;
}

// Real VAPID Public Key configured on server
const PUBLIC_VAPID_KEY =
  "BMAA1nSAHdlaE3pOrNvVOMK6qys9akFfaJwoK5qiJFpd0lpK_nFfZZNLkKiHeArjRKD5IB2E8mvr1KckFgpwBbk";

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

// Local in-memory timer for in-app / background tab reminder fallback
let localReminderTimer: number | null = null;

export const pushNotificationService = {
  checkEnvironment(): {
    isSupported: boolean;
    isIos: boolean;
    isStandalone: boolean;
    isSecureContext: boolean;
    canUsePush: boolean;
  } {
    if (typeof window === "undefined") {
      return { isSupported: false, isIos: false, isStandalone: false, isSecureContext: false, canUsePush: false };
    }

    const isSecureContext =
      window.isSecureContext ||
      window.location.protocol === "https:" ||
      window.location.hostname === "localhost" ||
      window.location.hostname === "127.0.0.1";

    const isIos =
      /iPad|iPhone|iPod/.test(navigator.userAgent) ||
      (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
    const isStandalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      (window.navigator as unknown as { standalone?: boolean }).standalone === true;
    const isSupported = "serviceWorker" in navigator && "PushManager" in window && "Notification" in window;

    // On iOS Safari, Web Push is strictly enabled only when added to Home Screen as standalone PWA
    const canUsePush = isSupported && (!isIos || isStandalone);

    return {
      isSupported,
      isIos,
      isStandalone,
      isSecureContext,
      canUsePush,
    };
  },

  async getSubscriptionState(): Promise<PushSubscriptionState> {
    const env = this.checkEnvironment();
    if (!env.isSupported) {
      return {
        isSupported: false,
        isIos: env.isIos,
        isStandalone: env.isStandalone,
        isSecureContext: env.isSecureContext,
        permission: "default",
        isSubscribed: false,
        subscription: null,
      };
    }

    const permission = Notification.permission;
    try {
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.getSubscription();
      return {
        isSupported: true,
        isIos: env.isIos,
        isStandalone: env.isStandalone,
        isSecureContext: env.isSecureContext,
        permission,
        isSubscribed: Boolean(sub),
        subscription: sub,
      };
    } catch {
      return {
        isSupported: true,
        isIos: env.isIos,
        isStandalone: env.isStandalone,
        isSecureContext: env.isSecureContext,
        permission,
        isSubscribed: false,
        subscription: null,
      };
    }
  },

  /** Request notification permission and subscribe to Web Push */
  async subscribe(
    reminderTime = "07:30",
    activeDays: number[] = [1, 2, 3, 4, 5, 6]
  ): Promise<PushSubscription | null> {
    const env = this.checkEnvironment();
    if (!env.canUsePush) {
      throw new Error(
        env.isIos && !env.isStandalone
          ? "Sur iPhone/iPad (iOS), vous devez ajouter l'application à l'écran d'accueil (« Sur l'écran d'accueil ») pour activer les notifications de rappel."
          : "Les notifications Web Push ne sont pas supportées sur ce navigateur."
      );
    }

    const permission = await Notification.requestPermission();
    if (permission !== "granted") {
      throw new Error("Autorisation de notification refusée par l'utilisateur.");
    }

    const reg = await navigator.serviceWorker.ready;
    let subscription = await reg.pushManager.getSubscription();

    if (!subscription) {
      const convertedVapidKey = urlBase64ToUint8Array(PUBLIC_VAPID_KEY);
      subscription = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: convertedVapidKey.buffer as ArrayBuffer,
      });
    }

    // Register subscription and schedule on backend server
    try {
      const res = await fetch("/api/push/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subscription,
          reminderTime,
          activeDays,
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || "Europe/Paris",
        }),
      });

      if (!res.ok) {
        console.warn("Server subscription registration returned status:", res.status);
      }
    } catch (e) {
      console.warn("Backend push endpoint unreachable, subscription maintained locally.", e);
    }

    // Setup in-app background interval fallback
    this.startLocalSchedulerFallback(reminderTime, activeDays);

    return subscription;
  },

  /** Update schedule on backend for active subscription */
  async updateSchedule(
    reminderTime: string,
    activeDays: number[]
  ): Promise<boolean> {
    // Also update local fallback
    this.startLocalSchedulerFallback(reminderTime, activeDays);

    try {
      const reg = await navigator.serviceWorker.ready;
      const subscription = await reg.pushManager.getSubscription();
      if (!subscription) return false;

      const res = await fetch("/api/push/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subscription,
          reminderTime,
          activeDays,
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || "Europe/Paris",
        }),
      });

      return res.ok;
    } catch (e) {
      console.error("Failed to update push schedule:", e);
      return false;
    }
  },

  /** Unsubscribe from Web Push */
  async unsubscribe(): Promise<boolean> {
    if (localReminderTimer) {
      clearInterval(localReminderTimer);
      localReminderTimer = null;
    }

    try {
      const reg = await navigator.serviceWorker.ready;
      const subscription = await reg.pushManager.getSubscription();
      if (subscription) {
        try {
          await fetch("/api/push/unsubscribe", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ endpoint: subscription.endpoint }),
          });
        } catch {
          // ignore
        }
        return await subscription.unsubscribe();
      }
      return true;
    } catch (e) {
      console.error("Failed to unsubscribe", e);
      return false;
    }
  },

  /** Send a real remote Web Push via the backend server (Apple APNs / Google FCM) */
  async testServerPush(reminderTime = "07:30", activeDays: number[] = [1, 2, 3, 4, 5, 6]): Promise<boolean> {
    const reg = await navigator.serviceWorker.ready;
    let subscription = await reg.pushManager.getSubscription();

    if (!subscription) {
      subscription = await this.subscribe(reminderTime, activeDays);
    }

    if (!subscription) {
      return this.showLocalTestNotification();
    }

    try {
      const res = await fetch("/api/push/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subscription }),
      });

      if (!res.ok) throw new Error("Server push test failed");
      return true;
    } catch {
      return this.showLocalTestNotification();
    }
  },

  /** Show a direct local test notification via Service Worker */
  async showLocalTestNotification(): Promise<boolean> {
    if (!("Notification" in window)) return false;

    if (Notification.permission !== "granted") {
      const perm = await Notification.requestPermission();
      if (perm !== "granted") return false;
    }

    try {
      const reg = await navigator.serviceWorker.ready;
      await reg.showNotification("BodyTrain • Séance matinale", {
        body: "Bonjour ! Prêt pour votre réveil en mouvement de 7 minutes ?",
        icon: "/icons/icon-192.png",
        badge: "/icons/badge-monochrome.png",
        data: { url: "/" },
        tag: "morning-reminder",
      } as NotificationOptions);
      return true;
    } catch {
      return false;
    }
  },

  /** In-app local timer fallback when browser tab is open / backgrounded */
  startLocalSchedulerFallback(reminderTime: string, activeDays: number[]) {
    if (localReminderTimer) {
      clearInterval(localReminderTimer);
    }

    let lastSentDate = "";

    localReminderTimer = window.setInterval(() => {
      if (Notification.permission !== "granted") return;

      const now = new Date();
      const currentHours = String(now.getHours()).padStart(2, "0");
      const currentMins = String(now.getMinutes()).padStart(2, "0");
      const currentTime = `${currentHours}:${currentMins}`;
      const currentDate = now.toDateString();
      const currentDay = now.getDay();

      if (activeDays.includes(currentDay) && currentTime === reminderTime) {
        if (lastSentDate !== currentDate) {
          lastSentDate = currentDate;
          this.showLocalTestNotification();
        }
      }
    }, 15000);
  },
};
