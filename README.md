# The Bull Cat — $BULLCAT

The most emotional warrior on the Solana network. Horns of a bull, heart of a
crying kitten. **Teary eyes, bullish heart. Time to send it.**

Official landing page for the $BULLCAT memecoin, launching on
[pump.fun](https://pump.fun).

## Design

A cohesive, warm, low-contrast system — cream / espresso / muted-green / gold
(Space Grotesk display, Inter body, Space Mono for data) — layered with
on-chain-terminal functionality. Highlights:

- Boot-up intro sequence + full-page scroll-progress bar
- Layered animated hero (gradient mesh, grid, orbit, pointer parallax, floating cards)
- Live **market terminal** panel (price / volume / liquidity / mcap) ready to wire on launch
- Animated **flywheel** (tears → hold → pump → god-candle loop)
- **Dream calculator** — pick a target market cap, get token price and bag value
- Tokenomics with count-up + copy-to-clipboard contract address
- Timeline **roadmap** with status badges, listings grid, FAQ

## Stack

Plain, dependency-free static site — HTML, CSS and vanilla JavaScript. Loads
instantly and hosts anywhere (GitHub Pages, Vercel, Netlify, Cloudflare Pages).

```
index.html    markup and content
styles.css    warm layered design system
script.js     boot, progress, parallax, count-up, calculator, copy, reveal, menu
assets/       transparent logo / character art (also used as favicon)
```

## Run locally

Any static server works:

```bash
python -m http.server 8000
# then open http://localhost:8000
```

## Configure before launch

Fill these in when the token goes live:

1. **Links** — set `CONFIG.xUrl`, `CONFIG.pumpUrl`, `CONFIG.chartUrl`,
   `CONFIG.solscanUrl` and `CONFIG.tgUrl` at the top of `script.js`. Every
   matching button/card wires up automatically; until then they stay inert.
2. **Contract address** — replace the `data-ca` value on `#caText` in
   `index.html` (and its visible text) with the real CA.

## Disclaimer

$BULLCAT is a meme coin with no intrinsic value or expectation of financial
return. Nothing here is financial advice.
