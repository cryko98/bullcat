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
- **Meme Lab** — fal.ai image generator that reskins the cat from a prompt
- Timeline **roadmap** with status badges, listings grid, FAQ

## Stack

Static HTML / CSS / vanilla JS front end, plus two tiny serverless functions
(`/api`) that proxy fal.ai. The page itself hosts anywhere; the Meme Lab needs a
host that runs serverless functions (Vercel, Netlify, Cloudflare Pages).

```
index.html      markup and content
styles.css      warm layered design system
script.js       boot, progress, parallax, count-up, calculator, copy, reveal, menu
meme.js         Meme Lab client (prompt → /api → result)
api/generate.js serverless: submit a fal.ai job (reads FAL_KEY)
api/status.js   serverless: poll the job and return the image
assets/         transparent logo / character art (also used as favicon)
```

## Meme Lab (fal.ai)

The generator uses the cat logo as a **locked reference image** and edits it with
[nano-banana](https://fal.ai/models/fal-ai/nano-banana/edit) (Gemini 2.5 Flash
Image) on fal.ai, chosen because it keeps the input subject identical while only
changing the background and adding accessories. The prompt (in `meme.js`) forbids
re-posing or restyling the cat and forces bull horns onto any hat.

To make it live:

1. Create a fal.ai account and API key.
2. Deploy the repo to a serverless host (Vercel is easiest — it picks up `/api`
   automatically) and set an environment variable **`FAL_KEY`** to your key.
3. That's it — the front end calls `/api/generate` and `/api/status`; the key
   never touches the browser. Until `FAL_KEY` is set, the Meme Lab shows a
   friendly "not live yet" message instead of erroring.

The identity + bull-horn constraints live in `meme.js` (`LOCK` / `RENDER`); the
model id lives in both `api/*.js` files if you ever want to swap it.

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
3. **Meme Lab** — set the `FAL_KEY` environment variable on your host (see below).

## Disclaimer

$BULLCAT is a meme coin with no intrinsic value or expectation of financial
return. Nothing here is financial advice.
