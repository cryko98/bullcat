# The Bull Cat — $BULLCAT

The most emotional warrior on the Solana network. Horns of a bull, heart of a
crying kitten. **Teary eyes, bullish heart. Time to send it.**

Official landing page for the $BULLCAT memecoin, launching on
[pump.fun](https://pump.fun).

## Stack

Plain, dependency-free static site — HTML, CSS and vanilla JavaScript. Loads
instantly and hosts anywhere (GitHub Pages, Vercel, Netlify, Cloudflare Pages).

```
index.html    markup and content
styles.css    warm "sticker" design system
script.js     mobile menu, copy-address, scroll reveal
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
