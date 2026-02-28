export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle preflight
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Solo permitir POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Obtener el body como buffer
    const chunks = [];
    for await (const chunk of req) {
      chunks.push(chunk);
    }
    const buffer = Buffer.concat(chunks);

    // Llamar a Hugging Face Inference API
    const response = await fetch(
      'https://api-inference.huggingface.co/models/briaai/REMBG-1.4',
      {
        headers: {
          'Authorization': `Bearer ${process.env.HF_API_TOKEN}`,
        },
        method: 'POST',
        body: buffer,
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('HF API Error:', errorText);
      
      if (response.status === 503) {
        return res.status(503).json({ error: 'Model is loading, please retry in 20 seconds' });
      }
      
      return res.status(response.status).json({ error: 'Processing failed' });
    }

    // Retornar la imagen procesada
    const imageBuffer = await response.arrayBuffer();
    
    res.setHeader('Content-Type', 'image/png');
    res.setHeader('Cache-Control', 'no-cache');
    res.status(200).send(Buffer.from(imageBuffer));

  } catch (error) {
    console.error('API Route Error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}