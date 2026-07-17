/* The Bull Cat — Meme Lab
   ---------------------------------------------------------
   Talks only to the site's own /api endpoints, which proxy fal.ai with a
   server-side FAL_KEY. The cat logo is the locked reference image; prompts
   only reskin the world / hat / accessories. Bull horns are always enforced.
   -------------------------------------------------------- */
(function () {
  const go = document.getElementById("memeGo");
  if (!go) return;

  const promptEl = document.getElementById("memePrompt");
  const chips = document.getElementById("memeChips");
  const note = document.getElementById("memeNote");
  const result = document.getElementById("memeResult");
  const placeholder = document.getElementById("memePlaceholder");
  const actions = document.getElementById("memeActions");
  const dl = document.getElementById("memeDownload");
  const again = document.getElementById("memeAgain");
  const refImg = document.getElementById("memeRef");

  // Identity lock: keep the reference cat pixel-for-pixel, change only what's asked.
  const LOCK =
    "This is a picture of Bull Cat: a chubby crying cream-white cat wearing a brown horned " +
    "aviator cap, sitting and facing the camera. KEEP THE CAT EXACTLY AS IN THIS REFERENCE " +
    "IMAGE — the same face, the same crying teary eyes, the same pink nose, whiskers, fur, " +
    "body shape, sitting pose, size, framing and the same art style. Do NOT redraw, restyle, " +
    "re-pose, zoom or replace the cat, and keep his horned cap unless a different hat is " +
    "explicitly requested (and every hat must keep the bull horns). Change ONLY the following, " +
    "and leave everything else pixel-identical to the reference: ";
  const TAIL = " Do not alter anything that was not requested.";

  const buildPrompt = (u) => {
    u = (u || "").trim();
    const change = u ? u + "." : "place him on a fresh, clean studio background.";
    return LOCK + change + TAIL;
  };

  /* ---- Reference image: composite onto white, downscale, to data URL ---- */
  let refPromise = null;
  const getRef = () => {
    if (refPromise) return refPromise;
    refPromise = new Promise((resolve, reject) => {
      const done = () => {
        try {
          const S = 640;
          const c = document.createElement("canvas");
          c.width = S; c.height = S;
          const x = c.getContext("2d");
          x.fillStyle = "#ffffff"; x.fillRect(0, 0, S, S);
          const nw = refImg.naturalWidth || 1080, nh = refImg.naturalHeight || 1080;
          const s = Math.min(S / nw, S / nh);
          const w = nw * s, h = nh * s;
          x.drawImage(refImg, (S - w) / 2, (S - h) / 2, w, h);
          resolve(c.toDataURL("image/jpeg", 0.9));
        } catch (e) { reject(e); }
      };
      if (refImg.complete && refImg.naturalWidth) done();
      else { refImg.addEventListener("load", done, { once: true }); refImg.addEventListener("error", reject, { once: true }); }
    });
    return refPromise;
  };

  /* ---- Chips append to the prompt ---- */
  chips && chips.addEventListener("click", (e) => {
    const b = e.target.closest("[data-add]");
    if (!b) return;
    const add = b.dataset.add;
    const cur = promptEl.value.trim();
    if (cur.toLowerCase().includes(add.toLowerCase())) return;
    promptEl.value = cur ? cur.replace(/[.,\s]*$/, "") + ", " + add : add;
    promptEl.focus();
  });

  /* ---- Loading state ---- */
  const MSGS = [
    "summoning bull cat…", "sharpening the horns…", "wiping the tears…",
    "painting the scene…", "adding the drip…", "rendering the god-candle…", "almost there…",
  ];
  let msgTimer = null, busy = false;
  const setBusy = (on) => {
    busy = on;
    go.disabled = on;
    go.textContent = on ? "Generating…" : "Generate ›";
    result.classList.toggle("is-loading", on);
    if (on) {
      let i = 0;
      note.textContent = MSGS[0];
      note.className = "meme__note is-info";
      msgTimer = setInterval(() => { i = (i + 1) % MSGS.length; note.textContent = MSGS[i]; }, 2600);
    } else if (msgTimer) { clearInterval(msgTimer); msgTimer = null; }
  };

  const fail = (msg) => {
    setBusy(false);
    note.textContent = msg;
    note.className = "meme__note is-error";
  };

  /* ---- Cooldown: 3 memes per rolling hour, with a live countdown ---- */
  const COOLDOWN_KEY = "bullcat_meme_cooldown";
  let cooldownUntil = 0;
  let cooldownTimer = null;
  const startCooldown = (sec) => {
    cooldownUntil = Date.now() + Math.max(1, sec) * 1000;
    try { localStorage.setItem(COOLDOWN_KEY, String(cooldownUntil)); } catch (_) {}
    clearInterval(cooldownTimer);
    const tick = () => {
      const left = Math.round((cooldownUntil - Date.now()) / 1000);
      if (left <= 0) {
        clearInterval(cooldownTimer); cooldownTimer = null; cooldownUntil = 0;
        try { localStorage.removeItem(COOLDOWN_KEY); } catch (_) {}
        go.disabled = false; go.textContent = "Generate ›";
        note.textContent = "You're good to go — 3 fresh memes ready."; note.className = "meme__note is-info";
        return;
      }
      const m = Math.floor(left / 60), s = left % 60;
      go.disabled = true; go.textContent = "On cooldown";
      note.textContent = `You've made your 3 memes — back in ${m}:${String(s).padStart(2, "0")}`;
      note.className = "meme__note is-info";
    };
    tick();
    cooldownTimer = setInterval(tick, 1000);
  };
  // Resume a countdown that was still running before a reload.
  try {
    const saved = +localStorage.getItem(COOLDOWN_KEY);
    if (saved && saved > Date.now()) startCooldown(Math.round((saved - Date.now()) / 1000));
  } catch (_) {}

  const showResult = async (url) => {
    setBusy(false);
    note.textContent = "";
    note.className = "meme__note";
    placeholder && (placeholder.hidden = true);
    let img = result.querySelector(".meme__img");
    if (!img) { img = document.createElement("img"); img.className = "meme__img"; img.alt = "Generated Bull Cat meme"; result.appendChild(img); }
    img.src = url;
    actions.hidden = false;
    // Force a real download (cross-origin) via blob when possible.
    dl.href = url; dl.removeAttribute("download");
    try {
      const blob = await (await fetch(url)).blob();
      const obj = URL.createObjectURL(blob);
      dl.href = obj; dl.setAttribute("download", "bullcat-meme.jpg"); dl.removeAttribute("target");
    } catch (_) { /* keep direct link (opens in new tab) */ }
  };

  /* ---- Poll the queue job (up to ~2.5 min) ---- */
  const poll = async (job, tries) => {
    if (tries > 75) { fail("This one took too long — please try again."); return; }
    try {
      const qs = "s=" + encodeURIComponent(job.statusUrl || "") + "&r=" + encodeURIComponent(job.resultUrl || "") +
                 (job.id ? "&id=" + encodeURIComponent(job.id) : "");
      const r = await fetch("/api/status?" + qs);
      const d = await r.json().catch(() => ({}));
      if (r.status === 501) { fail(d.error || "The generator isn't configured yet."); return; }
      if (d.status === "COMPLETED" && d.image) { showResult(d.image); return; }
      if (d.status === "FAILED" || d.status === "ERROR") {
        fail(d.error ? "Generation failed: " + d.error : "Generation failed — try a different prompt.");
        return;
      }
      setTimeout(() => poll(job, tries + 1), 2000);
    } catch (_) { setTimeout(() => poll(job, tries + 1), 2500); }
  };

  /* ---- Generate ---- */
  const generate = async () => {
    if (busy) return;
    if (cooldownUntil > Date.now()) { startCooldown(Math.round((cooldownUntil - Date.now()) / 1000)); return; }
    setBusy(true);
    let ref;
    try { ref = await getRef(); } catch (_) { fail("Couldn't load the reference image."); return; }
    try {
      const r = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: buildPrompt(promptEl.value), image: ref }),
      });
      const d = await r.json().catch(() => ({}));
      if (r.status === 501) { fail(d.error || "The meme generator isn't live yet — check back at launch."); return; }
      if (r.status === 429) { setBusy(false); startCooldown(d.retryAfterSec || 3600); return; }
      if (!r.ok || !d.id) { fail(d.error || "Couldn't start the generation. Try again."); return; }
      poll(d, 0);
    } catch (_) {
      fail("Network error — is the generator API deployed?");
    }
  };

  go.addEventListener("click", generate);
  again && again.addEventListener("click", () => { actions.hidden = true; promptEl.focus(); note.textContent = ""; });
  promptEl.addEventListener("keydown", (e) => { if ((e.metaKey || e.ctrlKey) && e.key === "Enter") generate(); });
})();
