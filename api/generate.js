// POST /api/generate — submit a Bull Cat meme edit to fal.ai (nano-banana edit).
//
// Security:
//  * SSRF: `image` MUST be an inline data:image/... base64 URI. We never accept
//    a URL, so neither this server nor fal can be pointed at internal hosts
//    (e.g. 169.254.169.254 metadata) or arbitrary external endpoints.
//  * Abuse: 3 generations per rolling hour, per IP (sliding window). If
//    UPSTASH_REDIS_REST_URL + UPSTASH_REDIS_REST_TOKEN are set the limit is
//    durable & shared across serverless instances (hard cap). Otherwise it
//    falls back to an in-memory window (best-effort — resets on cold start).
//
// The FAL key is read from FAL_KEY and is never sent to the browser.

const FAL_KEY = process.env.FAL_KEY;
const MODEL = "fal-ai/nano-banana/edit";

const MAX_IMAGE_CHARS = 8_000_000; // ~6 MB of base64
const MAX_PROMPT_CHARS = 1500;
const RATE_MAX = 3; // generations…
const RATE_WINDOW_MS = 60 * 60 * 1000; // …per rolling hour, per IP

// Inline images only — never a fetchable URL.
const DATA_IMAGE = /^data:image\/(png|jpeg|jpg|webp);base64,[A-Za-z0-9+/]+={0,2}$/;

const clientIp = (req) => {
  const xff = req.headers["x-forwarded-for"];
  if (typeof xff === "string" && xff) return xff.split(",")[0].trim();
  if (Array.isArray(xff) && xff.length) return String(xff[0]).trim();
  return (req.socket && req.socket.remoteAddress) || "unknown";
};

/* ---------- Durable limiter (Upstash Redis REST) with in-memory fallback ---------- */
const UPSTASH_URL = process.env.UPSTASH_REDIS_REST_URL;
const UPSTASH_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN;
const useRedis = !!(UPSTASH_URL && UPSTASH_TOKEN);

async function redisPipeline(cmds) {
  const r = await fetch(`${UPSTASH_URL}/pipeline`, {
    method: "POST",
    headers: { Authorization: `Bearer ${UPSTASH_TOKEN}`, "Content-Type": "application/json" },
    body: JSON.stringify(cmds),
  });
  if (!r.ok) throw new Error("redis " + r.status);
  return r.json(); // [{ result }, ...]
}

const memHits = new Map(); // ip -> timestamps[] (fallback only)

// Returns { ok, retryAfterSec }. Records the hit when allowed.
async function checkLimit(ip) {
  const now = Date.now();
  const cutoff = now - RATE_WINDOW_MS;

  if (useRedis) {
    try {
      const key = `bc:rl:${ip}`;
      const read = await redisPipeline([
        ["ZREMRANGEBYSCORE", key, 0, cutoff],
        ["ZCARD", key],
        ["ZRANGE", key, 0, 0, "WITHSCORES"], // oldest still in window
      ]);
      const count = Number((read[1] && read[1].result) || 0);
      if (count >= RATE_MAX) {
        const oldest = Number(((read[2] && read[2].result) || [])[1] || now);
        return { ok: false, retryAfterSec: Math.max(1, Math.ceil((oldest + RATE_WINDOW_MS - now) / 1000)) };
      }
      await redisPipeline([
        ["ZADD", key, String(now), `${now}:${Math.random().toString(36).slice(2)}`],
        ["PEXPIRE", key, String(RATE_WINDOW_MS)],
      ]);
      return { ok: true, retryAfterSec: 0 };
    } catch (_) {
      // Redis unavailable → fall through to in-memory so the site keeps working.
    }
  }

  // In-memory sliding window (best-effort on serverless).
  if (memHits.size > 5000) {
    for (const [k, v] of memHits) if (!v.some((t) => t > cutoff)) memHits.delete(k);
  }
  const recent = (memHits.get(ip) || []).filter((t) => t > cutoff);
  if (recent.length >= RATE_MAX) {
    memHits.set(ip, recent);
    return { ok: false, retryAfterSec: Math.max(1, Math.ceil((recent[0] + RATE_WINDOW_MS - now) / 1000)) };
  }
  recent.push(now);
  memHits.set(ip, recent);
  return { ok: true, retryAfterSec: 0 };
}

const waitPhrase = (sec) => {
  const m = Math.ceil(sec / 60);
  return m >= 60 ? "about an hour" : `about ${m} minute${m === 1 ? "" : "s"}`;
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

  const gate = await checkLimit(clientIp(req));
  if (!gate.ok) {
    res.setHeader("Retry-After", String(gate.retryAfterSec));
    res.status(429).json({
      error: `You've used your 3 memes for now — come back in ${waitPhrase(gate.retryAfterSec)}.`,
      retryAfterSec: gate.retryAfterSec,
    });
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
