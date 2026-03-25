import { supabase } from './supabase';

// Substitua por sua chave pública VAPID (Gerada via CLI do web-push)
const VAPID_PUBLIC_KEY = 'BAnf46iN1M5P7xS2W8D9G0H1J2K3L4M5N6O7P8Q9R0S1T2U3V4W5X6Y7Z8A9B0C1D2E3F4G5H6I7J8K9L0M1N2O3';

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
  async isSupported() {
    return 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window;
  },

  async getPermissionStatus() {
    if (!this.isSupported()) return 'denied';
    return Notification.permission;
  },

  async requestPermission() {
    if (!this.isSupported()) return false;
    const permission = await Notification.requestPermission();
    return permission === 'granted';
  },

  async subscribe() {
    try {
      if (!VAPID_PUBLIC_KEY || VAPID_PUBLIC_KEY.includes('X_X')) {
        console.warn('Chave VAPID não configurada corretamente.');
        return null;
      }

      const registration = await navigator.serviceWorker.ready;

      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY)
      });

      console.log('Inscrição PWA criada:', subscription);
      return subscription;
    } catch (error: any) {
      console.error('Erro ao subscrever para Push:', error);
      window.alert(`Erro ao ativar: ${error.message || JSON.stringify(error)}`);
      return null;
    }
  },

  async syncSubscriptionWithUser(userId: string, subscription: PushSubscription | null) {
    if (!userId) return;

    try {
      const { error } = await supabase
        .from('users')
        .update({ pushSubscription: subscription ? JSON.stringify(subscription) : null })
        .eq('id', userId);

      if (error) throw error;
      console.log('Inscrição sincronizada com sucesso no Supabase.');
    } catch (error) {
      console.error('Erro ao sincronizar inscrição:', error);
    }
  },

  async sendPushNotification(userId: string, title: string, body: string, url: string = '/') {
    try {
      // Chama a Edge Function do Supabase
      const { data, error } = await supabase.functions.invoke('send-push', {
        body: { userId, title, body, url }
      });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Erro ao disparar Edge Function de Push:', error);
      return null;
    }
  }
};
