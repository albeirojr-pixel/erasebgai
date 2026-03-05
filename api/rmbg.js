// api/rmbg.js
export const config = {
  api: {
    bodyParser: false, // Esto permite que la imagen pase sin ser alterada
  },
};

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const token = process.env.HF_API_TOKEN;
  if (!token) return res.status(500).json({ error: "Token missing in Vercel settings" });

  try {
    // Recolectamos los pedazos de la imagen
    const chunks = [];
    for await (const chunk of req) chunks.push(chunk);
    const imageBuffer = Buffer.concat(chunks);

    // Llamamos a Hugging Face
    const hfRes = await fetch("https://api-inference.huggingface.co/models/briaai/REMBG-1.4", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/octet-stream",
      },
      body: imageBuffer,
    });

    if (hfRes.status === 503) return res.status(503).json({ error: "model_loading" });

    if (!hfRes.ok) {
      const errorText = await hfRes.text();
      return res.status(hfRes.status).json({ error: errorText });
    }

    const arrayBuffer = await hfRes.arrayBuffer();
    res.setHeader("Content-Type", "image/png");
    return res.send(Buffer.from(arrayBuffer));

  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}