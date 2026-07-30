export default async function handler(req, res) {
  // Headers CORS para permitir llamados desde cualquier origen del sitio web
  res.setHeader('Access-Control-Allow-Credentials', 'true');
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

  const apiKey = (process.env.RESEND_API_KEY || '').trim();

  if (!apiKey) {
    return res.status(500).json({ error: 'RESEND_API_KEY no configurada en Vercel' });
  }

  const sendRequest = async (fromSender) => {
    return fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
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
    let data = await response.json().catch(() => ({}));

    if (!response.ok) {
      console.warn(`Remitente primario [${primaryFrom}] falló (${response.status}). Reintentando con [${fallbackFrom}]...`, data);
      const fallbackResponse = await sendRequest(fallbackFrom);
      const fallbackData = await fallbackResponse.json().catch(() => ({}));

      if (fallbackResponse.ok) {
        return res.status(200).json(fallbackData);
      } else {
        const errorMsg = data.message || fallbackData.message || `Resend API devolvió código ${response.status}`;
        console.error('Resend API rechazó ambos remitentes:', { primary: data, fallback: fallbackData });
        return res.status(response.status || 400).json({
          error: errorMsg,
          primaryError: data,
          fallbackError: fallbackData
        });
      }
    }

    return res.status(200).json(data);
  } catch (error) {
    console.error('Excepción al enviar correo vía Resend:', error);
    return res.status(500).json({ error: error.message || 'Error interno del servidor al enviar correo' });
  }
}

