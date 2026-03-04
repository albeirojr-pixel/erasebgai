module.exports = async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const token = process.env.HF_API_TOKEN;
  if (!token) {
    return res.status(500).json({ error: "API token not configured" });
  }

  try {
    const chunks = [];
    for await (const chunk of req) {
      chunks.push(chunk);
    }
    const imageBuffer = Buffer.concat(chunks);

    const hfResponse = await fetch(
      "https://api-inference.huggingface.co/models/briaai/REMBG-1.4",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/octet-stream",
        },
        body: imageBuffer,
      }
    );

    if (!hfResponse.ok) {
      const errorText = await hfResponse.text();
      console.error("HF Error:", hfResponse.status, errorText);

      if (hfResponse.status === 503) {
        return res.status(503).json({
          error: "model_loading",
          message: "El modelo está iniciando, espera 20 segundos e intenta de nuevo.",
        });
      }
      if (hfResponse.status === 429) {
        return res.status(429).json({
          error: "rate_limit",
          message: "Demasiadas solicitudes. Espera un momento.",
        });
      }
      return res.status(hfResponse.status).json({ error: errorText });
    }

    const arrayBuffer = await hfResponse.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    res.setHeader("Content-Type", "image/png");
    res.setHeader("Content-Length", buffer.length);
    return res.status(200).send(buffer);

  } catch (err) {
    console.error("Handler error:", err);
    return res.status(500).json({ error: err.message });
  }
};

module.exports.config = {
  api: {
    bodyParser: false,
  },
};