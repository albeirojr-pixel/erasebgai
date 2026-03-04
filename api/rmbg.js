// Ruta: api/rmbg.js

// 1. Apagamos el parser por defecto de Vercel (ESTA ES LA CLAVE)
export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req, res) {
  // Configuración de CORS
  res.setHeader("Access-Control-Allow-Origin", "*");
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const token = process.env.HF_API_TOKEN;
  if (!token) return res.status(500).json({ error: "Token not configured" });

  try {
    // 2. Ahora sí podemos leer el stream limpiamente
    const chunks = [];
    for await (const chunk of req) chunks.push(chunk);
    const imageBuffer = Buffer.concat(chunks);

    // 3. Petición a Hugging Face
    const hfRes = await fetch("https://api-inference.huggingface.co/models/briaai/REMBG-1.4", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/octet-stream",
      },
      body: imageBuffer,
    });

    if (hfRes.status === 503) return res.status(503).json({ error: "model_loading" });
    if (hfRes.status === 429) return res.status(429).json({ error: "rate_limit" });
    
    if (!hfRes.ok) {
      const errorText = await hfRes.text();
      return res.status(hfRes.status).json({ error: errorText });
    }

    // 4. Convertimos la respuesta para enviarla de vuelta al frontend
    const arrayBuffer = await hfRes.arrayBuffer();
    const buf = Buffer.from(arrayBuffer);
    
    res.setHeader("Content-Type", "image/png");
    return res.send(buf);

  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}