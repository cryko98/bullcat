// POST /api/generate  — submit a Bull Cat meme edit to fal.ai (FLUX Kontext).
// The FAL key is read from the FAL_KEY environment variable and never sent to
// the browser. Returns { id, statusUrl, resultUrl } — the client polls status.
//
// IMPORTANT: fal's queue exposes status/result under the *base app* path
// (fal-ai/flux-pro), NOT the endpoint subpath (fal-ai/flux-pro/kontext).
// So we return the status_url / response_url fal gives us and poll those
// verbatim instead of reconstructing them.

const FAL_KEY = process.env.FAL_KEY;
// Gemini 2.5 Flash Image ("nano-banana") edit — strong at keeping the input
// subject identical while only changing background / adding accessories.
const MODEL = "fal-ai/nano-banana/edit";

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

  try {
    const body = typeof req.body === "string" ? JSON.parse(req.body || "{}") : (req.body || {});
    const prompt = String(body.prompt || "").slice(0, 1500);
    const image = body.image;

    if (!prompt || !image || typeof image !== "string") {
      res.status(400).json({ error: "Missing prompt or reference image." });
      return;
    }

    const falRes = await fetch(`https://queue.fal.run/${MODEL}`, {
      method: "POST",
      headers: { Authorization: `Key ${FAL_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        prompt,
        image_urls: [image], // nano-banana takes an array of reference images
      }),
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
