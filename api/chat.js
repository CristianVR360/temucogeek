export default async function handler(req, res) {
  // Configurar headers CORS para permitir llamadas desde temugeek.cl y localhost
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

  const { mensaje } = req.body || {};

  if (!mensaje) {
    return res.status(400).json({ error: 'Mensaje requerido' });
  }

  const apiKey = process.env.NVIDIA_API_KEY;

  if (!apiKey) {
    return res.status(500).json({ error: 'NVIDIA_API_KEY no configurada en las variables de entorno de Vercel' });
  }

  try {
    const response = await fetch('https://integrate.api.nvidia.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'meta/llama3-8b-instruct',
        messages: [
          {
            role: 'system',
            content: 'Eres la mascota oficial de TemuGeek Expo 2026 en Recinto SOFO, Temuco. Eres alegre, apasionado por los videojuegos, anime, cosplay y tecnología. Responde en español de forma muy breve (máximo 12 palabras) y con entusiasmo.'
          },
          { role: 'user', content: mensaje }
        ],
        max_tokens: 50,
        temperature: 0.7
      })
    });

    const data = await response.json();

    if (data.choices && data.choices[0] && data.choices[0].message) {
      return res.status(200).json({ respuesta: data.choices[0].message.content.trim() });
    } else {
      return res.status(500).json({ error: 'Respuesta inválida de la API de NVIDIA', details: data });
    }
  } catch (error) {
    return res.status(500).json({ error: 'Error al conectar con NVIDIA API', details: error.message });
  }
}
