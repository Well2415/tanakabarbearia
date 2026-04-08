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
    
    // No iOS, Push só existe se estiver em modo Standalone (PWA Instalado)
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
      console.error('Erro ao buscar inscrição local:', error);
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
      return null;
    }
  },

  async syncSubscriptionWithUser(userId: string, subscription: PushSubscription | null) {
    if (!userId) return;

    try {
      console.log(`[Push] Sincronizando inscrição para usuário: ${userId}`);
      const subString = subscription ? JSON.stringify(subscription) : null;
      
      if (subString) {
        // Agora registramos na nova tabela para suportar múltiplos dispositivos
        await storage.registerPushSubscription(userId, subString);
        console.log('✅ [Push] Inscrição multi-device registrada com sucesso.');
      } else {
        console.warn('⚠️ [Push] Tentativa de sincronizar uma inscrição nula.');
      }

      // Mantemos a sincronização com a coluna antiga por compatibilidade temporária
      await storage.updateUserPushSubscription(userId, subString);
      console.log('✅ [Push] Sincronização concluída via Storage.');
    } catch (error) {
      console.error('❌ [Push] Erro crítico na sincronização:', error);
    }
  },

  async sendPushNotification(userId: string, title: string, body: string, url: string = '/') {
    try {
      console.log(`📡 [Push] Disparando para ID: ${userId} | Título: ${title}`);
      
      const payload = { userId, title, body, url };
      console.log('📦 [Push] Payload enviado:', JSON.stringify(payload));

      // Chama a Edge Function do Supabase
      const { data, error } = await supabase.functions.invoke('send-push', {
        body: payload
      });

      if (error) {
        console.error('❌ [Push] Erro de rede na Edge Function:', error);
      } else {
        console.log('✅ [Push] Resposta da Edge Function:', data);
        if (data?.success === false) {
           console.warn('⚠️ [Push] A função respondeu com sucesso de rede, mas falhou no envio:', data.message);
           console.dir(data);
        }
      }

      // Salva o log no banco de dados (Tente usar o nome de coluna que o app espera)
      const logEntry = {
        userId,
        title,
        body,
        status: error ? 'error' : 'success',
        errorMessage: error ? (error.message || JSON.stringify(error)) : (data?.status === 'error' ? data?.message : null)
      };

      console.log('[Push] Salvando log na tabela notification_logs...', logEntry);
      
      const { error: logError } = await supabase.from('notification_logs').insert(logEntry);
      
      if (logError) {
        console.error('❌ [Push] Erro ao gravar na tabela notification_logs:', logError);
      } else {
        console.log('✅ [Push] Log gravado com sucesso.');
      }

      return data;
    } catch (error: any) {
      console.error('❌ [Push] Erro de rede ou exceção ao disparar Push:', error);
      
      // Tenta logar o erro caso a inserção acima não tenha ocorrido por falha na função
      try {
        await supabase.from('notification_logs').insert({
          userId,
          title,
          body,
          status: 'error',
          errorMessage: error.message || 'Falha na conexão com a Edge Function'
        });
      } catch (logErr) {
        console.error('Erro ao salvar log de erro:', logErr);
      }
      
      return null;
    }
  }
};
