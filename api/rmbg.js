export const config = {
  api: { bodyParser: false }, // Crucial para procesar imágenes
};

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).send("Method not allowed");

  const token = process.env.HF_API_TOKEN;
  
  try {
    // Leemos la imagen enviada desde el navegador
    const chunks = [];
    for await (const chunk of req) chunks.push(chunk);
    const imageBuffer = Buffer.concat(chunks);

    // Llamada a Hugging Face
    const response = await fetch(
      "https://api-inference.huggingface.co/models/briaai/REMBG-1.4",
      {
        headers: { Authorization: `Bearer ${token}` },
        method: "POST",
        body: imageBuffer,
      }
    );

    // Si el modelo se está cargando (Error 503 común en HF)
    if (response.status === 503) {
      return res.status(503).json({ error: "model_loading" });
    }

    if (!response.ok) {
      const errorMsg = await response.text();
      return res.status(response.status).json({ error: errorMsg });
    }

    const outputBuffer = await response.arrayBuffer();
    res.setHeader("Content-Type", "image/png");
    return res.send(Buffer.from(outputBuffer));

  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}