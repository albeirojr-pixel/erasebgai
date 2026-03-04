// api/rmbg.js

// 1. Esto evita que Vercel intente procesar la imagen como texto
export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req, res) {
  // CORS y Seguridad
  res.setHeader("Access-Control-Allow-Origin", "*");
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const token = process.env.HF_API_TOKEN;
  if (!token) return res.status(500).json({ error: "Token no configurado en Vercel" });

  try {
    // 2. Leemos la imagen como datos binarios puros (Buffer)
    const chunks = [];
    for await (const chunk of req) {
      chunks.push(chunk);
    }
    const imageBuffer = Buffer.concat(chunks);

    // 3. Llamada a Hugging Face
    const hfRes = await fetch("https://api-inference.huggingface.co/models/briaai/REMBG-1.4", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/octet-stream",
      },
      body: imageBuffer,
    });

    // Manejo de estados de Hugging Face
    if (hfRes.status === 503) {
      return res.status(503).json({ error: "model_loading" });
    }

    if (!hfRes.ok) {
      const errorText = await hfRes.text();
      return res.status(hfRes.status).json({ error: errorText });
    }

    // 4. Enviamos la imagen procesada de vuelta
    const outputBuffer = await hfRes.arrayBuffer();
    res.setHeader("Content-Type", "image/png");
    return res.send(Buffer.from(outputBuffer));

  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}