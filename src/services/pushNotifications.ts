// Web Push API service and subscription manager

export interface PushSubscriptionState {
  isSupported: boolean;
  isIos: boolean;
  isStandalone: boolean;
  permission: NotificationPermission;
  isSubscribed: boolean;
  subscription: PushSubscription | null;
  error?: string;
}

// Public VAPID key (demo key for local and client-side setup)
const PUBLIC_VAPID_KEY =
  "BEl62iUYgUivxIkv69yViEuiBIa-Ib9-SkvMeAtA3LFgDzkrxZJjSgSnfckjBJuBkr3qBUYIhbQFLXYp5Nksh8U";

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

export const pushNotificationService = {
  checkEnvironment(): {
    isSupported: boolean;
    isIos: boolean;
    isStandalone: boolean;
    canUsePush: boolean;
  } {
    if (typeof window === "undefined") {
      return { isSupported: false, isIos: false, isStandalone: false, canUsePush: false };
    }

    const isIos = /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
    const isStandalone = window.matchMedia("(display-mode: standalone)").matches || (window.navigator as unknown as { standalone?: boolean }).standalone === true;
    const isSupported = "serviceWorker" in navigator && "PushManager" in window && "Notification" in window;

    // On iOS Safari, Web Push is only possible when installed as PWA on Home Screen (iOS 16.4+)
    const canUsePush = isSupported && (!isIos || isStandalone);

    return {
      isSupported,
      isIos,
      isStandalone,
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
        permission,
        isSubscribed: !!sub,
        subscription: sub,
      };
    } catch {
      return {
        isSupported: true,
        isIos: env.isIos,
        isStandalone: env.isStandalone,
        permission,
        isSubscribed: false,
        subscription: null,
      };
    }
  },

  /** Request notification permission and subscribe to Web Push */
  async subscribe(reminderTime = "07:30", activeDays: number[] = [1, 2, 3, 4, 5, 6]): Promise<PushSubscription | null> {
    const env = this.checkEnvironment();
    if (!env.canUsePush) {
      throw new Error(
        env.isIos && !env.isStandalone
          ? "Sur iOS, vous devez d'abord ajouter BodyTrain à l'écran d'accueil pour activer les notifications de rappel."
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

    // Register anonymous subscription on backend endpoint
    try {
      await fetch("/api/push/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subscription,
          reminderTime,
          activeDays,
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        }),
      });
    } catch {
      // Backend may be offline, subscription still exists locally
      console.warn("Backend push endpoint unreachable, subscription maintained locally.");
    }

    return subscription;
  },

  /** Unsubscribe from Web Push */
  async unsubscribe(): Promise<boolean> {
    try {
      const reg = await navigator.serviceWorker.ready;
      const subscription = await reg.pushManager.getSubscription();
      if (subscription) {
        // Notify backend to remove anonymous subscription
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

  /** Show a direct test notification via Service Worker */
  async showTestNotification(): Promise<boolean> {
    if (!("Notification" in window)) return false;

    if (Notification.permission !== "granted") {
      const perm = await Notification.requestPermission();
      if (perm !== "granted") return false;
    }

    try {
      const reg = await navigator.serviceWorker.ready;
      await reg.showNotification("BodyTrain • Séance matinale", {
        body: "Bonjour ! Prêt pour ton réveil en mouvement de 7 minutes ?",
        icon: "/icons/icon-192.png",
        badge: "/icons/icon-192.png",
        data: { url: "/" },
        tag: "morning-reminder",
      });
      return true;
    } catch (e) {
      console.warn("ServiceWorker notification failed, using window Notification", e);
      try {
        new Notification("BodyTrain • Séance matinale", {
          body: "Bonjour ! Prêt pour ton réveil en mouvement de 7 minutes ?",
          icon: "/icons/icon-192.png",
        });
        return true;
      } catch {
        return false;
      }
    }
  },
};
