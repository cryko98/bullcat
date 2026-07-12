# The Bull Cat — $BULLCAT

The most emotional warrior on the Solana network. Horns of a bull, heart of a
crying kitten. **Teary eyes, bullish heart. Time to send it.**

Official landing page for the $BULLCAT memecoin, launching on
[pump.fun](https://pump.fun).

## Design

Cream editorial zine meets dark on-chain terminal — a monospace-driven system
(JetBrains Mono / Space Mono headings, Inter body) with a boot-up intro,
scanline terminal sections, `> key : value` command blocks, live-style stat
readouts with count-up, and alternating warm-cream / terminal-black bands.

## Stack

Plain, dependency-free static site — HTML, CSS and vanilla JavaScript. Loads
instantly and hosts anywhere (GitHub Pages, Vercel, Netlify, Cloudflare Pages).

```
index.html    markup and content
styles.css    cream-editorial x terminal design system
script.js     boot intro, mobile menu, copy-address, count-up, scroll reveal
assets/       logo + character art (also used as favicon)
```

## Run locally

Any static server works:

```bash
python -m http.server 8000
# then open http://localhost:8000
```

## Configure before launch

Two placeholders need real values when the token goes live:

1. **X (Twitter) link + pump.fun link** — set `CONFIG.xUrl` and `CONFIG.pumpUrl`
   at the top of `script.js`.
2. **Contract address** — replace the `data-ca` value on `#caText` in
   `index.html` (and its visible text) with the real CA.

## Disclaimer

$BULLCAT is a meme coin with no intrinsic value or expectation of financial
return. Nothing here is financial advice.
