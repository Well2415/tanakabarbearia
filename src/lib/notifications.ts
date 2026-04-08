import { supabase } from './supabase';
import { storage } from './storage';

// Substitua por sua chave pública VAPID (Gerada via CLI do web-push)
const VAPID_PUBLIC_KEY = 'BMh3k1YCD3Ur162NEJxTl9lWj8cHUFeLZmu_KE5lR0wrShhmdKqxeRsJB77nSkGp9WgEFT7CZrDgDYHYkUujVu4';

function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export const notificationManager = {
  isIOS() {
    return /iphone|ipad|ipod/.test(window.navigator.userAgent.toLowerCase());
  },

  isStandalone() {
    return window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone === true;
  },

  async isSupported() {
    const isIOS = this.isIOS();
    const isStandalone = this.isStandalone();
    if (isIOS) return isStandalone && 'serviceWorker' in navigator && 'PushManager' in window;
    return 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window;
  },

  async getPermissionStatus() {
    if (!this.isSupported()) return 'denied';
    return Notification.permission;
  },

  async getSubscription() {
    if (!this.isSupported()) return null;
    try {
      const registration = await navigator.serviceWorker.ready;
      return await registration.pushManager.getSubscription();
    } catch (error) {
      return null;
    }
  },

  async requestPermission() {
    if (!this.isSupported()) return false;
    const permission = await Notification.requestPermission();
    return permission === 'granted';
  },

  async subscribe() {
    try {
      if (!VAPID_PUBLIC_KEY || VAPID_PUBLIC_KEY.includes('X_X')) return null;
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY)
      });
      return subscription;
    } catch (error: any) {
      return null;
    }
  },

  async syncSubscriptionWithUser(userId: string, subscription: PushSubscription | null) {
    if (!userId) return;
    try {
      const subString = subscription ? JSON.stringify(subscription) : null;
      if (subString) {
        await storage.registerPushSubscription(userId, subString);
      }
      await storage.updateUserPushSubscription(userId, subString);
    } catch (error) {
      // Silent error in production
    }
  },

  async sendPushNotification(userId: string, title: string, body: string, url: string = '/') {
    try {
      const { data, error } = await supabase.functions.invoke('send-push', {
        body: { userId, title, body, url }
      });

      // Salva o log no banco de dados para controle administrativo
      await supabase.from('notification_logs').insert([{
        userId,
        title,
        body,
        status: (data?.success && !error) ? 'success' : 'error',
        errorMessage: error ? (error.message || JSON.stringify(error)) : (data?.success ? null : data?.message)
      }]);

      return data;
    } catch (error: any) {
      return null;
    }
  }
};
