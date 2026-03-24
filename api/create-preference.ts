import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { amount, description, email, accessToken, backUrl } = req.body;

  if (!accessToken) {
    return res.status(401).json({ error: 'Access token is required' });
  }

  try {
    const amountValue = Number(parseFloat(String(amount)).toFixed(2));
    let origin = req.headers.origin || (req.headers.referer ? new URL(req.headers.referer).origin : 'https://tanakabarbearia.vercel.app');
    if (origin.endsWith('/')) origin = origin.slice(0, -1);
    const finalBackUrl = backUrl || origin;

    const response = await fetch('https://api.mercadopago.com/checkout/preferences', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`
      },
      body: JSON.stringify({
        items: [
          {
            title: 'Serviços de Barbearia',
            quantity: 1,
            unit_price: amountValue,
            currency_id: 'BRL'
          }
        ],
        payer: {
          email: email || 'test_user_12345678@testuser.com'
        },
        binary_mode: false,
        back_urls: {
          success: finalBackUrl,
          failure: finalBackUrl,
          pending: finalBackUrl
        },
        auto_return: 'approved'
      })
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('MP Preference Error:', data);
      return res.status(response.status).json(data);
    }

    return res.status(200).json(data);
  } catch (error) {
    console.error('Server Error:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
}
