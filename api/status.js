// GET /api/status?id=<request_id> — poll a fal.ai queue job and, when done,
// return the finished image URL. Key stays server-side.

const FAL_KEY = process.env.FAL_KEY;
const MODEL = "fal-ai/flux-pro/kontext";

module.exports = async function handler(req, res) {
  if (!FAL_KEY) {
    res.status(501).json({ error: "The meme generator is not configured yet (missing FAL_KEY on the server)." });
    return;
  }

  const id = String((req.query && req.query.id) || "");
  if (!id || !/^[\w-]{6,80}$/.test(id)) {
    res.status(400).json({ error: "Invalid request id." });
    return;
  }

  try {
    const base = `https://queue.fal.run/${MODEL}/requests/${id}`;
    const sRes = await fetch(`${base}/status`, { headers: { Authorization: `Key ${FAL_KEY}` } });
    const st = await sRes.json().catch(() => ({}));

    if (st.status === "COMPLETED") {
      const rRes = await fetch(base, { headers: { Authorization: `Key ${FAL_KEY}` } });
      const out = await rRes.json().catch(() => ({}));
      const url = out?.images?.[0]?.url || null;
      res.status(200).json({ status: url ? "COMPLETED" : "FAILED", image: url });
      return;
    }
    res.status(200).json({ status: st.status || "IN_QUEUE" });
  } catch (err) {
    res.status(500).json({ error: "Server error while polling fal.ai." });
  }
};
