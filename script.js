/* The Bull Cat — $BULLCAT
   ---------------------------------------------------------
   Fill these in when socials / launch go live.
   -------------------------------------------------------- */
const CONFIG = {
  xUrl: "",     // e.g. "https://x.com/thebullcat"
  pumpUrl: "",  // e.g. "https://pump.fun/coin/<address>"
};

/* ---------- Boot / intro sequence ---------- */
(function boot() {
  const boot = document.getElementById("boot");
  const log = document.getElementById("bootLog");
  const bar = document.getElementById("bootBar");
  const skip = document.getElementById("bootSkip");
  if (!boot) return;

  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const lines = [
    "> booting bull.cat kernel ...",
    "> mounting horns + hooves ......... <span class='ok'>ok</span>",
    "> loading emotional core .......... <span class='ok'>ok</span>",
    "> wiping tears .................... <span class='ok'>ok</span>",
    "> charging god-candle engine ...... <span class='ok'>ok</span>",
    "> herd status: <span class='ok'>BULLISH</span>",
    "<span class='dim'>> teary eyes, bullish heart. time to send it.</span>",
  ];

  const finish = () => {
    boot.classList.add("done");
    document.body.style.overflow = "";
    window.addEventListener("scroll", () => {}, { once: true });
  };

  document.body.style.overflow = "hidden";
  skip && skip.addEventListener("click", finish);

  if (reduce) {
    log.innerHTML = lines.join("\n");
    bar.style.width = "100%";
    setTimeout(finish, 300);
    return;
  }

  let i = 0;
  const total = lines.length;
  const step = () => {
    if (i < total) {
      log.innerHTML += (i ? "\n" : "") + lines[i];
      bar.style.width = Math.round(((i + 1) / total) * 100) + "%";
      i++;
      setTimeout(step, 230);
    } else {
      setTimeout(finish, 520);
    }
  };
  setTimeout(step, 250);

  // safety valve
  setTimeout(finish, 4200);
})();

document.addEventListener("DOMContentLoaded", () => {
  /* ---- Wire external links (stay "#" until live) ---- */
  if (CONFIG.xUrl) {
    document.querySelectorAll("[data-x-link]").forEach((a) => {
      a.href = CONFIG.xUrl; a.target = "_blank"; a.rel = "noopener";
      a.removeAttribute("title");
    });
  }
  if (CONFIG.pumpUrl) {
    document.querySelectorAll("[data-pump-link]").forEach((a) => {
      a.href = CONFIG.pumpUrl; a.target = "_blank"; a.rel = "noopener";
    });
  }

  /* ---- Mobile menu ---- */
  const burger = document.getElementById("burger");
  const links = document.getElementById("navLinks");
  if (burger && links) {
    const toggle = (open) => {
      links.classList.toggle("open", open);
      burger.setAttribute("aria-expanded", String(open));
    };
    burger.addEventListener("click", () => toggle(!links.classList.contains("open")));
    links.querySelectorAll("a").forEach((a) => a.addEventListener("click", () => toggle(false)));
  }

  /* ---- Copy contract address ---- */
  const copyBtn = document.getElementById("copyCa");
  const caText = document.getElementById("caText");
  const copyLabel = document.getElementById("copyLabel");
  if (copyBtn && caText) {
    copyBtn.addEventListener("click", async () => {
      const value = caText.dataset.ca || caText.textContent.trim();
      try {
        await navigator.clipboard.writeText(value);
      } catch {
        const r = document.createRange();
        r.selectNode(caText);
        const sel = window.getSelection();
        sel.removeAllRanges(); sel.addRange(r);
        document.execCommand("copy"); sel.removeAllRanges();
      }
      const prev = copyLabel.textContent;
      copyLabel.textContent = "copied";
      copyBtn.classList.add("is-copied");
      setTimeout(() => { copyLabel.textContent = prev; copyBtn.classList.remove("is-copied"); }, 1600);
    });
  }

  /* ---- Count-up numbers ---- */
  const fmt = (n) => {
    if (n >= 1e9) return (n / 1e9).toFixed(n % 1e9 ? 1 : 0) + "B";
    if (n >= 1e6) return (n / 1e6).toFixed(0) + "M";
    return n.toLocaleString();
  };
  const reduceMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const countUp = (el) => {
    const target = +el.dataset.count;
    if (reduceMotion || !("requestAnimationFrame" in window)) { el.textContent = fmt(target); return; }
    const dur = 1100;
    const start = performance.now();
    // hard guarantee: no matter what happens with rAF, land on the real value
    const guard = setTimeout(() => { el.textContent = fmt(target); }, dur + 500);
    const tick = (now) => {
      const p = Math.min((now - start) / dur, 1);
      const eased = 1 - Math.pow(1 - p, 3);
      el.textContent = fmt(Math.floor(target * eased));
      if (p < 1) requestAnimationFrame(tick);
      else { clearTimeout(guard); el.textContent = fmt(target); }
    };
    requestAnimationFrame(tick);
  };

  /* ---- Reveal on scroll + trigger count-up ----
     Belt-and-suspenders: IntersectionObserver where it works, plus a
     scroll/resize/load bounding-rect fallback so content is never stuck
     hidden if IO doesn't fire. Idempotent via the WeakSet. ---- */
  const els = [...document.querySelectorAll(
    ".card, .step, .tokcard, .stat, .story, .ca, .faq__item, .phase, .checks"
  )];
  els.forEach((el) => el.classList.add("reveal"));

  const done = new WeakSet();
  const reveal = (el) => {
    if (done.has(el)) return;
    done.add(el);
    el.classList.add("in");
    el.querySelectorAll("[data-count]").forEach(countUp);
  };
  const inView = (el) => {
    const r = el.getBoundingClientRect();
    return r.top < innerHeight * 0.9 && r.bottom > 0;
  };
  const scan = () => els.forEach((el) => { if (!done.has(el) && inView(el)) reveal(el); });

  if ("IntersectionObserver" in window) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => { if (e.isIntersecting) { reveal(e.target); io.unobserve(e.target); } });
    }, { threshold: 0.12 });
    els.forEach((el) => io.observe(el));
  }

  addEventListener("scroll", scan, { passive: true });
  addEventListener("resize", scan);
  addEventListener("load", () => setTimeout(scan, 60));
  scan();
});
