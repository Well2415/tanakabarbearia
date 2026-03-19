import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { paymentId, accessToken } = req.body;

  if (!accessToken) {
    return res.status(401).json({ error: 'Access token is required' });
  }

  try {
    const response = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('MP Status Error:', data);
      return res.status(response.status).json(data);
    }

    return res.status(200).json({ status: data.status });
  } catch (error) {
    console.error('Server Error:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
}
