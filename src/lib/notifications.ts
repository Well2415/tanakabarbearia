import { supabase } from './supabase';

// Substitua por sua chave pública VAPID (Gerada via CLI do web-push)
const VAPID_PUBLIC_KEY = 'BMBl_XN_C4P_XU_68f0_X_XpX_X_X_X_X_X_X_X_X_X_X_X_X_X_X_X_X_X_X_X_X_X_X_X_X_X_X_X_X_X_X_X_X_X'; 

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
    } catch (error) {
      console.error('Erro ao subscrever para Push:', error);
      return null;
    }
  },

  async syncSubscriptionWithUser(userId: string, subscription: PushSubscription | null) {
    if (!userId) return;

    try {
      // Salva a inscrição no perfil do usuário no Supabase
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

  async sendTestNotification(userId: string) {
    // Nota: O envio real deve ser feito via servidor (Edge Functions)
    // Este método é apenas um exemplo de como disparar o processo
    console.log('Solicitando envio de notificação de teste para o usuário:', userId);
    
    // Aqui faríamos um fetch para uma rota de API que usa o web-push
    // fetch('/api/send-push', { method: 'POST', body: JSON.stringify({ userId, message: 'Teste!' }) });
  }
};
