import type { NextApiRequest, NextApiResponse } from 'next';
import axios from 'axios';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  try {
    const { text } = req.body;
    const params = new URLSearchParams();
    params.append('text', text);
    const response = await axios.post('http://localhost:8000/predict', params, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    });
    res.status(200).json(response.data);
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
} 