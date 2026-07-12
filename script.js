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

  const finish = () => { boot.classList.add("done"); document.body.style.overflow = ""; };
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

  /* ---- Nav: scrolled state + progress bar ---- */
  const nav = document.querySelector(".nav");
  const progress = document.getElementById("progress");
  const onScroll = () => {
    const y = scrollY;
    nav && nav.classList.toggle("scrolled", y > 8);
    if (progress) {
      const h = document.documentElement.scrollHeight - innerHeight;
      progress.style.width = (h > 0 ? (y / h) * 100 : 0) + "%";
    }
  };
  addEventListener("scroll", onScroll, { passive: true });
  onScroll();

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

  /* ---- Reveal + counters (IO with scroll/load fallback) ---- */
  const els = [...document.querySelectorAll(
    ".card, .step, .tokcard, .tcell, .story, .ca, .faq__item, .phase, .checks, .fstep, .lcard, .lab, .terminal"
  )];
  els.forEach((el) => el.classList.add("reveal"));
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
  // hero counters aren't in the observed set — kick them once
  document.querySelectorAll(".hero [data-count]").forEach(countUp);
  scan();

  /* ---- Parallax (pointer + scroll), disabled for reduced motion / touch ---- */
  const pxEls = [...document.querySelectorAll("[data-parallax]")];
  if (!reduce && matchMedia("(pointer:fine)").matches) {
    let mx = 0, my = 0, tx = 0, ty = 0, raf = 0;
    addEventListener("pointermove", (e) => {
      mx = (e.clientX / innerWidth - 0.5) * 2;
      my = (e.clientY / innerHeight - 0.5) * 2;
      if (!raf) raf = requestAnimationFrame(loop);
    });
    const loop = () => {
      tx += (mx - tx) * 0.08; ty += (my - ty) * 0.08;
      pxEls.forEach((el) => {
        const d = +el.dataset.parallax || 12;
        el.style.transform = `translate(${tx * d}px, ${ty * d}px)`;
      });
      if (Math.abs(mx - tx) > 0.001 || Math.abs(my - ty) > 0.001) raf = requestAnimationFrame(loop);
      else raf = 0;
    };
  }

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
