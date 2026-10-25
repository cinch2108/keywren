# Keywren: free online device & skills tests

Static site, no backend, no accounts. Every test runs in the browser; camera, microphone, keystrokes and results never leave the device. Results and settings are saved only in the visitor's local storage.

**Tools (one crawlable page each):** Typing Speed Test (`/`), Keyboard Tester (`/keyboard-tester/`), Mic Test (`/mic-test/`), Webcam Test (`/webcam-test/`), Dead Pixel & Screen Test (`/dead-pixel-test/`), Mouse & CPS Test (`/mouse-test/`), Refresh Rate Test (`/refresh-rate-test/`).

## Files
- `template.html`: the single source page with all seven tools, each wrapped in `<!--view:x-->…<!--/view:x-->`. **Edit this, never the generated `index.html` files.**
- `build_pages.py`: generates `index.html` + 6 tool folders, keeping only that page's tool (title, description, canonical, OG/Twitter tags, H1, lead, How-to, 4 FAQs, FAQPage + BreadcrumbList JSON-LD, cross-links, team footer) and `sitemap.xml`, and refreshes the team footer in `privacy.html`, `terms.html`, `404.html`. Run `python3 build_pages.py` after any change.
- `app.js`: frame-buster, pure logic module (`KW`, exported for Node tests) + browser UI. No inline scripts, handlers or style attributes; strict-CSP friendly.
- `styles.css`, `privacy.html`, `terms.html`, `404.html`, `_headers`, `robots.txt`, `sitemap.xml`, `ads.txt`, `.nojekyll`.

## How the tests work
- **Typing**: deterministic word lists, WPM = correct chars (incl. spaces) / 5 / minutes; accuracy counts every wrong keystroke even if fixed. Last 50 results in `kw.typing.history`.
- **Keyboard**: 104-key layout (main block, nav cluster, numpad) driven by `event.code`; keys held at once are tracked for ghosting/rollover; shortcuts are blocked while the box is ticked.
- **Mic**: `getUserMedia` with echo cancellation/noise suppression/AGC off, Web Audio `AnalyserNode` for RMS/peak dBFS and waveform, `MediaRecorder` for 5/10/30 s clips kept as in-memory blob URLs.
- **Webcam**: requested vs delivered resolution from `getSettings()` and the video element, measured FPS via `requestVideoFrameCallback` (falls back to `getVideoPlaybackQuality()`), PNG snapshots from a canvas.
- **Screen**: 13 fullscreen tests (Fullscreen API, falls back to a fixed overlay), arrows/Space/click to step, H hides the label, Esc exits.
- **Mouse**: CPS over 1/5/10/30 s (best per mode in `kw.cps.best`), every button 0–4, wheel, double clicks, and "chatter" (same button pressed again within 80 ms).
- **Refresh rate**: rAF frame-time median → Hz, snapped to common rates (±4%), live frame-time graph with dropped frames, and a three-lane UFO motion test (every frame / ½ / ¼).
- **Media lifecycle**: every camera/mic stream is registered with one `Media` helper that stops all tracks (and closes the AudioContext) on Stop, on `visibilitychange` → hidden and on `pagehide`. Camera/mic are only requested after the user presses Start.

## Local preview
From the parent of a folder named `keywren` containing this repo: `python3 -m http.server 8000`, then open http://localhost:8000/keywren/ (mirrors the Pages sub-path). Camera and mic need a secure context: `localhost` and https both work, `file://` and plain-http LAN IPs don't.

## Tests
From the parent folder: `node keywren-test.js` (logic checks) and `node --experimental-websocket keywren-ui-test.js` (headless Chrome over CDP with `--use-fake-ui-for-media-stream --use-fake-device-for-media-stream`; set `BASE=http://localhost:PORT/keywren/` to point at a server that serves this folder as `/keywren/`).

## GitHub Pages (https://cinch2108.github.io/keywren/)
This folder is the repo root for `cinch2108/keywren` (Settings → Pages → Deploy from branch `main`, folder `/`). It is served from the `/keywren/` sub-path, so:
- All internal links and assets are relative (`styles.css`, `../mic-test/`, `./`). Never add root-absolute links like `href="/..."`.
- The base URL `https://cinch2108.github.io/keywren` is set in `DOMAIN` at the top of `build_pages.py` plus `template.html`, `robots.txt`, `privacy.html`, `terms.html`. For a custom domain, change it there, rebuild and add a `CNAME` file.
- `404.html` is served for any missing URL at any depth, so it uses `<base href="/keywren/">`. If the repo is renamed, update that line.
- `.nojekyll` makes Pages serve files as-is.
- `robots.txt` here is informational only: crawlers only read `https://cinch2108.github.io/robots.txt`, which belongs to the root (LocalForge PDF) repo. It currently allows everything except `/404.html`, so `/keywren/` is crawlable, but it only lists the root sitemap: submit `https://cinch2108.github.io/keywren/sitemap.xml` in Search Console (URL-prefix property `https://cinch2108.github.io/keywren/`).
- All team sites share the `cinch2108.github.io` origin, so local storage is shared; Keywren's keys are all prefixed `kw.*`.

### Headers GitHub Pages can't set
GitHub Pages ignores `_headers` (kept for a future move to Netlify/Cloudflare Pages).
- **Permissions-Policy cannot be set on GitHub Pages.** It is not valid as a `<meta>` tag, so on Pages camera and microphone access is governed only by the browser's own per-site permission prompt (the whole `cinch2108.github.io` origin shares that permission with the other team sites). Keywren only calls `getUserMedia` after a click on Start and stops the tracks when the tab is hidden or left. `_headers` has `camera=(self), microphone=(self), fullscreen=(self)` and denies everything else for when a host that supports headers is used.
- **Content-Security-Policy** and **Referrer-Policy**: set as `<meta>` tags on every page. `media-src` allows `blob:` and `mediastream:` for recordings and the live camera.
- **frame-ancestors** / **X-Frame-Options**: can't be set; `app.js` starts with a frame-buster. Privacy, terms and 404 have no JS and nothing interactive.
- **Strict-Transport-Security**: github.io is HSTS-preloaded and Pages enforces HTTPS.
- **X-Content-Type-Options**, **Cross-Origin-Opener-Policy**: cannot be set on Pages.

### Contact email
The privacy and terms pages use the placeholder **contact@example.com**. Replace it before launch: `grep -rl contact@example.com .`

## Launch checklist
1. [x] Base URL set to `https://cinch2108.github.io/keywren`.
2. [ ] Replace `contact@example.com` in `privacy.html` and `terms.html`.
3. [x] Repo `cinch2108/keywren` created, Pages enabled from `main` `/`.
4. [ ] Apply to AdSense (or another network) and put your publisher line in `ads.txt`.
5. [ ] Paste ad units into the four `data-ad-slot` containers in `template.html` (top 970x90, rail 300x250 ×2, footer 728x90) and rebuild.
6. [ ] Add ad network domains to the CSP meta in `template.html` (script-src, img-src, frame-src, connect-src). For EU/UK traffic use a Google-certified CMP or wire the banner's choice (`localStorage['kw.consent']`, `"granted"`/`"denied"`) to Consent Mode.
7. [ ] Make a 1200x630 `og.png` and add `og:image` / `twitter:image`.
8. [ ] Submit the sitemap in Google Search Console and Bing Webmaster Tools.
9. [ ] Test on real hardware: a phone (iOS Safari camera/mic prompts), a high refresh monitor, and Lighthouse (aim for 95+).
