/* The Bull Cat — $BULLCAT
   ---------------------------------------------------------
   Fill these in when socials / launch go live.
   -------------------------------------------------------- */
const CONFIG = {
  xUrl: "",       // "https://x.com/thebullcat"
  pumpUrl: "",    // "https://pump.fun/coin/<address>"
  chartUrl: "",   // "https://dexscreener.com/solana/<pair>"
  solscanUrl: "", // "https://solscan.io/token/<mint>"
  tgUrl: "",      // "https://t.me/thebullcat"
};
const SUPPLY = 1_000_000_000;
const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;

/* ---------- Boot intro ---------- */
(function () {
  const boot = document.getElementById("boot");
  const log = document.getElementById("bootLog");
  const bar = document.getElementById("bootBar");
  const skip = document.getElementById("bootSkip");
  if (!boot) return;

  const lines = [
    "> booting bull.cat kernel ...",
    "> mounting horns + hooves ......... <span class='ok'>ok</span>",
    "> loading emotional core .......... <span class='ok'>ok</span>",
    "> wiping tears .................... <span class='ok'>ok</span>",
    "> charging god-candle engine ...... <span class='gold'>ready</span>",
    "> herd status: <span class='ok'>BULLISH</span>",
    "<span class='dim'>> teary eyes, bullish heart. time to send it.</span>",
  ];

  const finish = () => {
    boot.classList.add("done");
    document.documentElement.classList.add("booted"); // fires the hero rise-from-coin reveal
    document.body.style.overflow = "";
    // safety net: guarantee the hero is visible even if the reveal animation glitches
    setTimeout(() => document.documentElement.classList.add("reveal-done"), 2100);
  };
  document.body.style.overflow = "hidden";
  skip && skip.addEventListener("click", finish);

  if (reduce) { log.innerHTML = lines.join("\n"); bar.style.width = "100%"; setTimeout(finish, 300); return; }

  let i = 0;
  const step = () => {
    if (i < lines.length) {
      log.innerHTML += (i ? "\n" : "") + lines[i];
      bar.style.width = Math.round(((i + 1) / lines.length) * 100) + "%";
      i++; setTimeout(step, 220);
    } else setTimeout(finish, 520);
  };
  setTimeout(step, 240);
  setTimeout(finish, 4200); // safety valve
})();

document.addEventListener("DOMContentLoaded", () => {
  /* ---- External links ---- */
  const wire = (sel, url) => {
    if (!url) return;
    document.querySelectorAll(sel).forEach((a) => { a.href = url; a.target = "_blank"; a.rel = "noopener"; a.removeAttribute("title"); });
  };
  wire("[data-x-link]", CONFIG.xUrl);
  wire("[data-pump-link]", CONFIG.pumpUrl);
  wire("[data-chart-link]", CONFIG.chartUrl);
  wire("[data-solscan]", CONFIG.solscanUrl);
  wire("[data-tg-link]", CONFIG.tgUrl);

  /* ---- Scroll engine: nav, progress, parallax, flywheel (rAF-throttled) ---- */
  const nav = document.querySelector(".nav");
  const progress = document.getElementById("progress");
  const scrollEls = [...document.querySelectorAll("[data-scroll]")];
  const flySection = document.getElementById("flywheel");
  const flySteps = [...document.querySelectorAll("#flySteps .fstep")];
  const flyProg = document.getElementById("flyProg");
  const FLY_C = 289; // 2*pi*46
  let ticking = false;
  const frame = () => {
    ticking = false;
    const y = scrollY;
    nav && nav.classList.toggle("scrolled", y > 8);
    if (progress) { const h = document.documentElement.scrollHeight - innerHeight; progress.style.width = (h > 0 ? (y / h) * 100 : 0) + "%"; }
    if (!reduce) {
      scrollEls.forEach((el) => {
        const sp = +el.dataset.scroll || 0;
        const r = el.getBoundingClientRect();
        const off = r.top + r.height / 2 - innerHeight / 2;
        el.style.transform = `translate3d(0, ${(off * sp).toFixed(1)}px, 0)`;
      });
    }
    if (flySection && flyProg) {
      const r = flySection.getBoundingClientRect();
      let p = (innerHeight - r.top) / (innerHeight + r.height); // 0 entering → 1 leaving
      p = Math.max(0, Math.min(1, p));
      flyProg.style.strokeDashoffset = FLY_C * (1 - p);
      flySteps.forEach((s) => s.classList.toggle("active", s.getBoundingClientRect().top < innerHeight * 0.72));
    }
  };
  const requestFrame = () => { if (!ticking) { ticking = true; requestAnimationFrame(frame); } };
  addEventListener("scroll", requestFrame, { passive: true });
  addEventListener("resize", requestFrame);
  frame();

  /* ---- Mobile menu ---- */
  const burger = document.getElementById("burger");
  const links = document.getElementById("navLinks");
  if (burger && links) {
    const toggle = (open) => { links.classList.toggle("open", open); burger.setAttribute("aria-expanded", String(open)); };
    burger.addEventListener("click", () => toggle(!links.classList.contains("open")));
    links.querySelectorAll("a").forEach((a) => a.addEventListener("click", () => toggle(false)));
  }

  /* ---- Copy CA ---- */
  const copyBtn = document.getElementById("copyCa");
  const caText = document.getElementById("caText");
  const copyLabel = document.getElementById("copyLabel");
  if (copyBtn && caText) {
    copyBtn.addEventListener("click", async () => {
      const value = caText.dataset.ca || caText.textContent.trim();
      try { await navigator.clipboard.writeText(value); }
      catch {
        const r = document.createRange(); r.selectNode(caText);
        const s = getSelection(); s.removeAllRanges(); s.addRange(r);
        document.execCommand("copy"); s.removeAllRanges();
      }
      const prev = copyLabel.textContent;
      copyLabel.textContent = "copied"; copyBtn.classList.add("is-copied");
      setTimeout(() => { copyLabel.textContent = prev; copyBtn.classList.remove("is-copied"); }, 1600);
    });
  }

  /* ---- Count-up ---- */
  const fmt = (n) => {
    if (n >= 1e9) return (n / 1e9).toFixed(n % 1e9 ? 1 : 0) + "B";
    if (n >= 1e6) return (n / 1e6).toFixed(0) + "M";
    return Math.round(n).toLocaleString();
  };
  const countUp = (el) => {
    const target = +el.dataset.count;
    if (reduce || !("requestAnimationFrame" in window)) { el.textContent = fmt(target); return; }
    const dur = 1200, start = performance.now();
    const guard = setTimeout(() => { el.textContent = fmt(target); }, dur + 500);
    const tick = (now) => {
      const p = Math.min((now - start) / dur, 1);
      el.textContent = fmt(target * (1 - Math.pow(1 - p, 3)));
      if (p < 1) requestAnimationFrame(tick); else { clearTimeout(guard); el.textContent = fmt(target); }
    };
    requestAnimationFrame(tick);
  };

  /* ---- Reveal: directional + staggered (IO + scroll/load fallback) ---- */
  const autoSel = ".head, .card, .step, .tokcard, .tcell, .story__text, .story__art, .ca, .faq__item, .phase, .checks li, .lcard, .lab__controls, .lab__out, .terminal, .quote__t, .quote__by, .buy__cta";
  const els = [...new Set([...document.querySelectorAll("[data-reveal]"), ...document.querySelectorAll(autoSel)])];
  const groupIdx = new Map();
  els.forEach((el) => {
    el.classList.add("reveal");
    const p = el.parentElement;
    const i = groupIdx.get(p) || 0;
    el.style.setProperty("--rd", Math.min(i, 7) * 70 + "ms");
    groupIdx.set(p, i + 1);
  });
  const done = new WeakSet();
  const reveal = (el) => { if (done.has(el)) return; done.add(el); el.classList.add("in"); el.querySelectorAll("[data-count]").forEach(countUp); };
  const inView = (el) => { const r = el.getBoundingClientRect(); return r.top < innerHeight * 0.92 && r.bottom > 0; };
  const scan = () => els.forEach((el) => { if (!done.has(el) && inView(el)) reveal(el); });
  if ("IntersectionObserver" in window) {
    const io = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) { reveal(e.target); io.unobserve(e.target); } }), { threshold: 0.12 });
    els.forEach((el) => io.observe(el));
  }
  addEventListener("scroll", scan, { passive: true });
  addEventListener("resize", scan);
  addEventListener("load", () => setTimeout(scan, 60));
  document.querySelectorAll(".hero [data-count]").forEach(countUp);
  scan();

  /* ---- Pointer parallax via CSS vars (composes with centering/bob) ---- */
  const pxEls = [...document.querySelectorAll("[data-parallax]")];
  if (!reduce && pxEls.length && matchMedia("(pointer:fine)").matches) {
    let mx = 0, my = 0, tx = 0, ty = 0, raf = 0;
    const loop = () => {
      tx += (mx - tx) * 0.08; ty += (my - ty) * 0.08;
      pxEls.forEach((el) => {
        const d = +el.dataset.parallax || 12;
        el.style.setProperty("--px", (tx * d).toFixed(1) + "px");
        el.style.setProperty("--py", (ty * d).toFixed(1) + "px");
      });
      raf = (Math.abs(mx - tx) > 0.002 || Math.abs(my - ty) > 0.002) ? requestAnimationFrame(loop) : 0;
    };
    addEventListener("pointermove", (e) => {
      mx = (e.clientX / innerWidth - 0.5) * 2;
      my = (e.clientY / innerHeight - 0.5) * 2;
      if (!raf) raf = requestAnimationFrame(loop);
    });
  }

  /* ---- Magnetic buttons ---- */
  if (!reduce && matchMedia("(pointer:fine)").matches) {
    document.querySelectorAll("[data-magnetic]").forEach((b) => {
      b.addEventListener("pointermove", (e) => {
        const r = b.getBoundingClientRect();
        b.style.transform = `translate(${((e.clientX - r.left) / r.width - 0.5) * 14}px, ${((e.clientY - r.top) / r.height - 0.5) * 18}px)`;
      });
      b.addEventListener("pointerleave", () => { b.style.transform = ""; });
    });
  }

  /* ---- Hero candlestick chart ---- */
  (function chart() {
    const cv = document.getElementById("heroChart");
    if (!cv || !cv.getContext) return;
    const ctx = cv.getContext("2d");
    const CW = 15, GAP = 9, STEP = CW + GAP;
    const up = "rgba(47,125,84,.6)", dn = "rgba(180,134,63,.5)";
    let W = 0, H = 0, price = 0, candles = [], off = 0, raf = 0;
    const mk = () => {
      const vol = H * 0.07, dir = Math.random() < 0.62 ? 1 : -1;
      const open = price;
      let close = open - dir * Math.random() * vol;
      close = Math.max(H * 0.16, Math.min(H * 0.86, close));
      const hi = Math.min(open, close) - Math.random() * vol * 0.6;
      const lo = Math.max(open, close) + Math.random() * vol * 0.6;
      price = close;
      return { open, close, hi, lo, u: close < open };
    };
    const build = () => {
      candles = []; price = H * 0.62;
      const n = Math.ceil(W / STEP) + 2;
      for (let i = 0; i < n; i++) candles.push(mk());
    };
    const paint = () => {
      ctx.clearRect(0, 0, W, H);
      for (let i = 0; i < candles.length; i++) {
        const c = candles[i], x = i * STEP - off, cx = x + CW / 2;
        ctx.strokeStyle = c.u ? up : dn; ctx.fillStyle = c.u ? up : dn; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.moveTo(cx, c.hi); ctx.lineTo(cx, c.lo); ctx.stroke();
        const top = Math.min(c.open, c.close), h = Math.max(2, Math.abs(c.close - c.open));
        ctx.fillRect(x, top, CW, h);
      }
    };
    const anim = () => {
      off += 0.4;
      if (off >= STEP) { off -= STEP; candles.push(mk()); candles.shift(); }
      paint();
      raf = requestAnimationFrame(anim);
    };
    const resize = () => {
      const dpr = Math.min(2, devicePixelRatio || 1);
      W = cv.clientWidth; H = cv.clientHeight;
      if (!W || !H) return;
      cv.width = W * dpr; cv.height = H * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      build(); paint();
    };
    const restart = () => { cancelAnimationFrame(raf); resize(); if (!reduce && W && H) anim(); };
    addEventListener("resize", restart);
    addEventListener("load", () => { if (!W || !H) restart(); });
    resize();
    if (!reduce && W && H) anim();
  })();

  /* ---- Market terminal: flip status to "online (pre-launch)" ---- */
  const mkt = document.getElementById("mktStatus");
  if (mkt) setTimeout(() => { mkt.textContent = "● pre-launch"; mkt.classList.add("ok"); }, 1400);

  /* ---- Dream calculator ---- */
  const bagInput = document.getElementById("labBag");
  const priceOut = document.getElementById("labPrice");
  const valueOut = document.getElementById("labValue");
  const mcBtns = [...document.querySelectorAll(".mc")];
  if (bagInput && priceOut && valueOut) {
    let mc = 10_000_000;
    const money = (n) => {
      if (n >= 1e9) return "$" + (n / 1e9).toFixed(2) + "B";
      if (n >= 1e6) return "$" + (n / 1e6).toFixed(2) + "M";
      if (n >= 1e3) return "$" + (n / 1e3).toFixed(1) + "K";
      return "$" + n.toLocaleString(undefined, { maximumFractionDigits: 2 });
    };
    const calc = () => {
      const bag = Math.max(0, +String(bagInput.value).replace(/[^\d.]/g, "") || 0);
      const price = mc / SUPPLY;
      priceOut.textContent = "$" + price.toFixed(8);
      valueOut.textContent = money(bag * price);
    };
    bagInput.addEventListener("input", () => {
      const raw = String(bagInput.value).replace(/[^\d]/g, "");
      bagInput.value = raw ? (+raw).toLocaleString() : "";
      calc();
    });
    mcBtns.forEach((b) => b.addEventListener("click", () => {
      mcBtns.forEach((x) => x.classList.remove("is-active"));
      b.classList.add("is-active"); mc = +b.dataset.mc; calc();
    }));
    calc();
  }
});
