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
    const response = await fetch('https://api.mercadopago.com/v1/payments', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`,
        'X-Idempotency-Key': Date.now().toString()
      },
      body: JSON.stringify({
        transaction_amount: amount,
        description: description,
        payment_method_id: 'pix',
        payer: {
          email: email || 'contato@tanakabarbearia.com.br', // Fallback email
          first_name: 'Cliente',
          last_name: 'Tanaka'
        }
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Erro ao criar pagamento MP:', errorData);
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
    console.error('Erro na chamada da API do Mercado Pago:', error);
    return null;
  }
};
