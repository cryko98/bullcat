// POST /api/generate — submit a Bull Cat meme edit to fal.ai (nano-banana edit).
//
// Security:
//  * SSRF: `image` MUST be an inline data:image/... base64 URI. We never accept
//    a URL, so neither this server nor fal can be pointed at internal hosts
//    (e.g. 169.254.169.254 metadata) or arbitrary external endpoints.
//  * Abuse: best-effort per-IP sliding-window rate limit. NOTE: serverless
//    instances are ephemeral and may run in parallel, so this is a speed bump,
//    not a hard guarantee. For a strict limit back it with a shared store
//    (Vercel KV / Upstash Redis).
//
// The FAL key is read from FAL_KEY and is never sent to the browser.

const FAL_KEY = process.env.FAL_KEY;
const MODEL = "fal-ai/nano-banana/edit";

const MAX_IMAGE_CHARS = 8_000_000; // ~6 MB of base64
const MAX_PROMPT_CHARS = 1500;
const RATE_MAX = 3; // generations…
const RATE_WINDOW_MS = 60_000; // …per minute, per IP

// Inline images only — never a fetchable URL.
const DATA_IMAGE = /^data:image\/(png|jpeg|jpg|webp);base64,[A-Za-z0-9+/]+={0,2}$/;

const hits = new Map(); // ip -> timestamps[]

const clientIp = (req) => {
  const xff = req.headers["x-forwarded-for"];
  if (typeof xff === "string" && xff) return xff.split(",")[0].trim();
  if (Array.isArray(xff) && xff.length) return String(xff[0]).trim();
  return (req.socket && req.socket.remoteAddress) || "unknown";
};

const rateLimited = (ip) => {
  const now = Date.now();
  const cutoff = now - RATE_WINDOW_MS;
  if (hits.size > 5000) {
    for (const [k, v] of hits) if (!v.some((t) => t > cutoff)) hits.delete(k);
  }
  const recent = (hits.get(ip) || []).filter((t) => t > cutoff);
  if (recent.length >= RATE_MAX) { hits.set(ip, recent); return true; }
  recent.push(now);
  hits.set(ip, recent);
  return false;
};

module.exports = async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    res.status(405).json({ error: "Method not allowed" });
    return;
  }
  if (!FAL_KEY) {
    res.status(501).json({ error: "The meme generator is not configured yet (missing FAL_KEY on the server)." });
    return;
  }
  if (rateLimited(clientIp(req))) {
    res.setHeader("Retry-After", "60");
    res.status(429).json({ error: "Easy there — Bull Cat only makes a few memes a minute. Try again shortly." });
    return;
  }

  try {
    const body = typeof req.body === "string" ? JSON.parse(req.body || "{}") : (req.body || {});
    const prompt = String(body.prompt || "").slice(0, MAX_PROMPT_CHARS);
    const image = typeof body.image === "string" ? body.image.replace(/\s/g, "") : "";

    if (!prompt) { res.status(400).json({ error: "Missing prompt." }); return; }
    if (!image || image.length > MAX_IMAGE_CHARS || !DATA_IMAGE.test(image)) {
      res.status(400).json({ error: "Reference image must be an inline data:image/... base64 URI." });
      return;
    }

    const falRes = await fetch(`https://queue.fal.run/${MODEL}`, {
      method: "POST",
      headers: { Authorization: `Key ${FAL_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({ prompt, image_urls: [image] }),
    });

    const data = await falRes.json().catch(() => ({}));
    if (!falRes.ok || !data.request_id) {
      res.status(falRes.ok ? 502 : falRes.status).json({
        error: (data && (data.detail || data.error)) || "fal.ai rejected the request.",
        detail: data,
      });
      return;
    }

    res.status(200).json({
      id: data.request_id,
      statusUrl: data.status_url || null,
      resultUrl: data.response_url || null,
    });
  } catch (err) {
    res.status(500).json({ error: "Server error contacting fal.ai: " + ((err && err.message) || err) });
  }
};
