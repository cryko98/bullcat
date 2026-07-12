// GET /api/status?s=<statusUrl>&r=<resultUrl>  — poll a fal.ai queue job and,
// when finished, return the image URL. We fetch the exact status_url /
// response_url that fal handed us at submit time (see generate.js). Key stays
// server-side. A legacy ?id= fallback reconstructs the base-app path.

const FAL_KEY = process.env.FAL_KEY;
const MODEL = "fal-ai/nano-banana/edit";
// Base app (queue lives here, WITHOUT the endpoint subpath) e.g. fal-ai/flux-pro
const BASE_APP = MODEL.split("/").slice(0, 2).join("/");

const isFalUrl = (u) => typeof u === "string" && /^https:\/\/queue\.fal\.run\/[\w./-]+\/requests\/[\w-]+/.test(u);

module.exports = async function handler(req, res) {
  if (!FAL_KEY) {
    res.status(501).json({ error: "The meme generator is not configured yet (missing FAL_KEY on the server)." });
    return;
  }

  const q = req.query || {};
  let statusUrl = q.s;
  let resultUrl = q.r;

  // Fallback for older clients that only send the request id.
  if (!isFalUrl(statusUrl) && q.id && /^[\w-]{6,80}$/.test(q.id)) {
    statusUrl = `https://queue.fal.run/${BASE_APP}/requests/${q.id}/status`;
    resultUrl = `https://queue.fal.run/${BASE_APP}/requests/${q.id}`;
  }
  // Safety net: the queue lives under the base app, so strip the endpoint
  // subpath if it ever shows up (…/flux-pro/kontext/requests → …/flux-pro/requests).
  if (typeof statusUrl === "string") statusUrl = statusUrl.replace(`/${MODEL}/requests/`, `/${BASE_APP}/requests/`);

  if (!isFalUrl(statusUrl)) {
    res.status(400).json({ error: "Invalid status url." });
    return;
  }

  try {
    const sRes = await fetch(statusUrl, { headers: { Authorization: `Key ${FAL_KEY}` } });
    const st = await sRes.json().catch(() => ({}));

    if (!sRes.ok) {
      res.status(200).json({ status: "ERROR", error: `fal status ${sRes.status}`, detail: st });
      return;
    }

    const status = st.status || "IN_QUEUE";
    if (status === "COMPLETED") {
      // Derive the bare result URL from the (reliable) status URL — strip a
      // trailing /status, and never keep a /response suffix (that 405s).
      const rUrl = statusUrl.replace(/\/(status|response)(\?.*)?$/, "");
      const rRes = await fetch(rUrl, { headers: { Authorization: `Key ${FAL_KEY}` } });
      const out = await rRes.json().catch(() => ({}));
      const url = out && out.images && out.images[0] && out.images[0].url;
      res.status(200).json({ status: url ? "COMPLETED" : "FAILED", image: url || null, detail: url ? undefined : out });
      return;
    }
    res.status(200).json({ status });
  } catch (err) {
    res.status(200).json({ status: "ERROR", error: "Poll failed: " + ((err && err.message) || err) });
  }
};
