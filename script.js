/* The Bull Cat — $BULLCAT
   ---------------------------------------------------------
   Config: fill these in when the socials / launch go live.
   -------------------------------------------------------- */
const CONFIG = {
  xUrl: "",        // e.g. "https://x.com/thebullcat"
  pumpUrl: "",     // e.g. "https://pump.fun/coin/<address>"
};

document.addEventListener("DOMContentLoaded", () => {
  /* ---- Wire up external links (kept as "#" until live) ---- */
  if (CONFIG.xUrl) {
    document.querySelectorAll("[data-x-link]").forEach((a) => {
      a.href = CONFIG.xUrl;
      a.target = "_blank";
      a.rel = "noopener";
      a.removeAttribute("title");
    });
  }
  if (CONFIG.pumpUrl) {
    document.querySelectorAll("[data-pump-link]").forEach((a) => {
      a.href = CONFIG.pumpUrl;
      a.target = "_blank";
      a.rel = "noopener";
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
    burger.addEventListener("click", () =>
      toggle(!links.classList.contains("open"))
    );
    links.querySelectorAll("a").forEach((a) =>
      a.addEventListener("click", () => toggle(false))
    );
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
        sel.removeAllRanges();
        sel.addRange(r);
        document.execCommand("copy");
        sel.removeAllRanges();
      }
      const prev = copyLabel.textContent;
      copyLabel.textContent = "Copied";
      copyBtn.classList.add("is-copied");
      setTimeout(() => {
        copyLabel.textContent = prev;
        copyBtn.classList.remove("is-copied");
      }, 1600);
    });
  }

  /* ---- Reveal on scroll ---- */
  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) {
          e.target.classList.add("in");
          io.unobserve(e.target);
        }
      });
    },
    { threshold: 0.15 }
  );
  document
    .querySelectorAll(".card, .step, .tok__card, .story, .ca, .faq__item")
    .forEach((el) => {
      el.classList.add("reveal");
      io.observe(el);
    });
});
