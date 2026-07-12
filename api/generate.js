// POST /api/generate  — submit a Bull Cat meme edit to fal.ai (FLUX Kontext).
// The FAL key is read from the FAL_KEY environment variable and never sent to
// the browser. Returns { id } (a fal queue request id) for the client to poll.

const FAL_KEY = process.env.FAL_KEY;
const MODEL = "fal-ai/flux-pro/kontext";

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
        image_url: image,
        num_images: 1,
        guidance_scale: 3.5,
        output_format: "jpeg",
        safety_tolerance: "5",
      }),
    });

    const data = await falRes.json().catch(() => ({}));
    if (!falRes.ok) {
      res.status(falRes.status).json({ error: data?.detail || "fal.ai rejected the request.", detail: data });
      return;
    }
    res.status(200).json({ id: data.request_id });
  } catch (err) {
    res.status(500).json({ error: "Server error while contacting fal.ai." });
  }
};
