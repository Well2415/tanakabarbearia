import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { amount, description, email, accessToken } = req.body;

  if (!accessToken) {
    return res.status(401).json({ error: 'Access token is required' });
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
        transaction_amount: Number(parseFloat(String(amount)).toFixed(2)),
        description: description,
        payment_method_id: 'pix',
        payer: {
          email: email || 'contato@tanakabarbearia.com.br',
          first_name: 'Cliente',
          last_name: 'Tanaka'
        }
      })
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('MP Pix Error:', data);
      return res.status(response.status).json(data);
    }

    return res.status(200).json(data);
  } catch (error) {
    console.error('Server Error:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
}
