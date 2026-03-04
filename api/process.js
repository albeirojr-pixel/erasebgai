const https = require("https");

module.exports = function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const token = process.env.HF_API_TOKEN;
  if (!token) return res.status(500).json({ error: "Token not configured" });

  const chunks = [];
  req.on("data", (chunk) => chunks.push(chunk));
  req.on("end", () => {
    const imageBuffer = Buffer.concat(chunks);
    const options = {
      hostname: "api-inference.huggingface.co",
      path: "/models/briaai/REMBG-1.4",
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/octet-stream",
        "Content-Length": imageBuffer.length,
      },
    };
    const hfReq = https.request(options, (hfRes) => {
      const out = [];
      hfRes.on("data", (c) => out.push(c));
      hfRes.on("end", () => {
        const buf = Buffer.concat(out);
        if (hfRes.statusCode === 503) return res.status(503).json({ error: "model_loading" });
        if (hfRes.statusCode === 429) return res.status(429).json({ error: "rate_limit" });
        if (hfRes.statusCode !== 200) return res.status(hfRes.statusCode).json({ error: buf.toString() });
        res.setHeader("Content-Type", "image/png");
        res.status(200).send(buf);
      });
    });
    hfReq.on("error", (err) => res.status(500).json({ error: err.message }));
    hfReq.write(imageBuffer);
    hfReq.end();
  });
};