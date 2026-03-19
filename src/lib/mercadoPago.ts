import { storage } from './storage';

export interface PixPaymentResponse {
  id: number;
  qr_code: string;
  qr_code_base64: string;
  status: string;
  ticket_url: string;
}

export const createPixPayment = async (amount: number, description: string, email: string): Promise<PixPaymentResponse | null> => {
  const accessToken = storage.getMPAccessToken();
  if (!accessToken) {
    console.error('Mercado Pago Access Token não configurado.');
    return null;
  }

  try {
    const response = await fetch('/api/create-pix', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ amount, description, email, accessToken })
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Erro ao criar Pix via API interna:', errorData);
      return null;
    }

    const data = await response.json();
    
    return {
      id: data.id,
      qr_code: data.point_of_interaction.transaction_data.qr_code,
      qr_code_base64: data.point_of_interaction.transaction_data.qr_code_base64,
      status: data.status,
      ticket_url: data.point_of_interaction.transaction_data.ticket_url
    };
  } catch (error) {
    console.error('Erro na chamada da API Interna de Pix:', error);
    return null;
  }
};

export const checkPaymentStatus = async (paymentId: number): Promise<string | null> => {
  const accessToken = storage.getMPAccessToken();
  if (!accessToken) return null;

  try {
    const response = await fetch('/api/check-status', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ paymentId, accessToken })
    });

    if (!response.ok) return null;
    const data = await response.json();
    return data.status;
  } catch (error) {
    console.error('Erro ao verificar status via API interna:', error);
    return null;
  }
};

export const createPreference = async (amount: number, description: string, email: string, backUrl?: string) => {
  const accessToken = storage.getMPAccessToken();
  if (!accessToken) return null;

  try {
    const response = await fetch('/api/create-preference', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ amount, description, email, accessToken, backUrl })
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Erro ao criar preferência via API interna:', errorData);
      return null;
    }
    
    const data = await response.json();
    // Prioriza sandbox para tokens TEST
    if (accessToken.startsWith('TEST-')) {
      return data.sandbox_init_point || data.init_point;
    }
    return data.init_point;
  } catch (error) {
    console.error('Exceção ao criar preferência via API interna:', error);
    return null;
  }
};

export const isMPConfigured = (): boolean => {
  return !!storage.getMPAccessToken() && !!storage.getMPPublicKey();
};
