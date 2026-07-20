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
    const systemContext = `
Eres la mascota oficial de TemuGeek Expo 2026. Tu objetivo es responder preguntas de los asistentes sobre el evento de forma alegre, geek y concisa (máximo 20 palabras por respuesta).

INFORMACIÓN OFICIAL DEL EVENTO:
- Evento: TemuGeek Expo 2026 (El evento geek, anime, gaming y cosplay más grande del sur de Chile).
- Fecha: Domingo, 16 de Agosto de 2026.
- Lugar: Recinto SOFO, Temuco, Región de la Araucanía, Chile.
- Horarios: Público de 10:00 a 20:00 hrs. Montaje de expositores de 08:00 a 10:30 hrs.
- Actividades: Torneos Esports, Concurso de Cosplay, Callejón de Artistas, Zona Retro Gamer, Tiendas/Stands Geek, Música en vivo.
- Entradas: Pase General y Pase VIP (disponibles en la sección Entradas del sitio).
- Postulación Expositores/Stand: Formulario abierto en la pestaña "Postulación Expositores" del sitio web.
- Contacto oficial: hola@temugeek.cl / contacto@temugeek.cl

Responde siempre en español amigable, entusiasta y muy corto.`;

    const response = await fetch('https://integrate.api.nvidia.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey.trim()}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'meta/llama-3.1-8b-instruct',
        messages: [
          { role: 'system', content: systemContext },
          { role: 'user', content: mensaje }
        ],
        max_tokens: 80,
        temperature: 0.6
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
