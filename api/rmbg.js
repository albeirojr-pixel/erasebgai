module.exports = async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const token = process.env.HF_API_TOKEN;
  if (!token) return res.status(500).json({ error: "Token not configured" });

  try {
    const chunks = [];
    for await (const chunk of req) chunks.push(chunk);
    const imageBuffer = Buffer.concat(chunks);

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
    if (!hfRes.ok) return res.status(hfRes.status).json({ error: await hfRes.text() });

    const buf = Buffer.from(await hfRes.arrayBuffer());
    res.setHeader("Content-Type", "image/png");
    res.status(200).send(buf);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};