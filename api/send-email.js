export default async function handler(req, res) {
  // Headers CORS para permitir llamados desde el sitio web
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization'
  );

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método no permitido' });
  }

  const { to, subject, html, from } = req.body || {};

  if (!to || !subject || !html) {
    return res.status(400).json({ error: 'Faltan campos requeridos (to, subject, html)' });
  }

  const apiKey = process.env.RESEND_API_KEY;

  if (!apiKey) {
    return res.status(500).json({ error: 'RESEND_API_KEY no configurada en Vercel' });
  }

  const sendRequest = async (fromSender) => {
    return fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey.trim()}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from: fromSender,
        to: Array.isArray(to) ? to : [to],
        subject: subject,
        html: html
      })
    });
  };

  try {
    const primaryFrom = from || process.env.FROM_EMAIL || 'TemuGeek Expo <hola@temugeek.cl>';
    const fallbackFrom = 'TemuGeek Expo <onboarding@resend.dev>';

    let response = await sendRequest(primaryFrom);

    if (!response.ok) {
      console.warn(`Fallback a sender secundario por respuesta ${response.status}`);
      response = await sendRequest(fallbackFrom);
    }

    const data = await response.json();
    return res.status(response.status).json(data);
  } catch (error) {
    console.error('Error al enviar correo vía Resend:', error);
    return res.status(500).json({ error: error.message });
  }
}
