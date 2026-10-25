/* Keywren: typing speed test, keyboard tester, mic test, webcam test, dead pixel/screen test,
   mouse/CPS test and refresh rate test. Everything runs locally; nothing is uploaded.
   Pure logic lives in KW (unit-tested in Node); the browser UI only starts the tool on the current page. */
'use strict';
/* Frame-buster: GitHub Pages can't send frame-ancestors / X-Frame-Options, so if another origin frames this page, break out (or blank the page if breaking out is blocked). */
if (typeof window !== 'undefined' && window.top !== window.self) {
  let sameOrigin = false;
  try { sameOrigin = window.top.location.origin === window.location.origin; } catch (e) { sameOrigin = false; }
  if (!sameOrigin) {
    try { window.top.location.replace(window.location.href); } catch (e) { /* sandboxed */ }
    document.documentElement.style.display = 'none';
  }
}
const KW = (() => {
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  const r1 = v => Math.round(v * 10) / 10, r2 = v => Math.round(v * 100) / 100;
  const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  /* ---------- typing ---------- */
  const WORDS = ('the be of and a to in he have it that for they with as not on she at by this we you do but from or which one would all will there say who make when can more if no man out other so what time up go about than into could state only new year some take come these know see use get like then first any work now may such give over think most even find day also after way many must look before great back through long where much should well people down own just because good each those feel seem how high too place little world very still nation hand old life tell write become here show house both between need mean call develop under last right move thing general school never same another begin while number part turn real leave might want point form off child few small since against ask late home interest large person end open public follow during present without again hold govern around possible head consider word program problem however lead system set order eye plan run keep face fact group play stand increase early course change help line city put close case force meet once water upon war build hear light unite live every country bring center let side try provide continue name certain power pay result question study woman member until far night always service away report something company week church toward start social room figure nature though young less enough almost read include president nothing yet better big boy cost business value second why clear expect family complete act sense mind experience art next near direct car law industry important girl god several matter usual rather per often kind among white reason action return foot care simple within love human along appear doctor believe speak active student month drive concern best door hope example inform body ever least probable understand reach effect different idea whole control condition field pass fall note special talk particular today measure walk teach low hour type carry rate remain full street easy although record sit determine level local sure receive thus moment spirit train college religion perhaps music grow free cause serve age book board recent sound office cut step class true history position above strong friend necessary add court deal tax support party whether either land material happen education death agree arm mother across quite anything town past view society manage answer break organize half fire lose money stop actual already effort wait department able political learn voice air together shall cover common subject draw short wife treat limit road letter color behind produce send term total university rise century success minute remember purpose test fight watch situation south ago difference stage father table rest bear entire market prepare explain offer plant charge ground west picture hard front lie modern dark surface rule regard dance peace observe future wall farm claim firm operation further pressure property morning amount top outside piece sport similar sell').split(' ');
  function rng(seed) { let s = (seed >>> 0) || 0x9e3779b9; return () => { s ^= s << 13; s >>>= 0; s ^= s >>> 17; s ^= s << 5; s >>>= 0; return s / 4294967296; }; }
  function makeText(n, opt = {}, rand = Math.random) {
    const out = []; let cap = !!opt.punct, prev = '';
    for (let i = 0; i < n; i++) {
      let w; do { w = WORDS[Math.floor(rand() * WORDS.length)]; } while (w === prev);
      prev = w;
      if (opt.num && rand() < 0.1) w = String(Math.floor(rand() * (rand() < 0.5 ? 100 : 10000)));
      if (opt.punct) {
        if (cap && /^[a-z]/.test(w)) w = w[0].toUpperCase() + w.slice(1);
        cap = false;
        const r = rand();
        if (i === n - 1 || r < 0.07) { w += '.'; cap = true; } else if (r < 0.13) w += ','; else if (r < 0.15) { w += '?'; cap = true; } else if (r < 0.16) w += ';';
      }
      out.push(w);
    }
    return out.join(' ');
  }
  // net WPM counts only correctly typed characters (spaces included), 5 characters = 1 word
  function typingScore(target, typed, ms) {
    let correct = 0, wrong = 0;
    for (let i = 0; i < typed.length; i++) typed[i] === target[i] ? correct++ : wrong++;
    const min = Math.max(ms, 1) / 60000;
    return { correct, wrong, wpm: Math.round(correct / 5 / min), raw: Math.round(typed.length / 5 / min) };
  }
  const accuracy = (keys, errs) => keys > 0 ? r1(clamp((keys - errs) / keys * 100, 0, 100)) : 100;
  function typingLevel(wpm) {
    return wpm >= 100 ? 'Elite' : wpm >= 80 ? 'Very fast' : wpm >= 60 ? 'Fast' : wpm >= 40 ? 'Average' : wpm >= 25 ? 'Getting there' : 'Beginner';
  }
  const DURS = [15, 30, 60, 120];
  function sanitizeHistory(a) {
    if (!Array.isArray(a)) return [];
    return a.filter(x => x && typeof x === 'object' && Number.isFinite(x.t) && DURS.includes(x.d) && Number.isFinite(x.wpm))
      .slice(-50).map(x => ({ t: x.t, d: x.d, wpm: clamp(Math.round(x.wpm), 0, 400), raw: clamp(Math.round(Number(x.raw) || 0), 0, 400), acc: clamp(r1(Number(x.acc) || 0), 0, 100) }));
  }
  const bestOf = (h, d) => h.filter(x => d == null || x.d === d).reduce((m, x) => Math.max(m, x.wpm), 0);

  /* ---------- keyboard ---------- */
  // Full-size ANSI layout in key units: [code, label, width] or a number = gap. Tall keys (h:2) marked with a 4th item.
  const ROWS = [
    [['Escape', 'Esc'], 1, ['F1'], ['F2'], ['F3'], ['F4'], .5, ['F5'], ['F6'], ['F7'], ['F8'], .5, ['F9'], ['F10'], ['F11'], ['F12'], .5, ['PrintScreen', 'PrtSc'], ['ScrollLock', 'ScrLk'], ['Pause', 'Pause']],
    [['Backquote', '`'], ['Digit1', '1'], ['Digit2', '2'], ['Digit3', '3'], ['Digit4', '4'], ['Digit5', '5'], ['Digit6', '6'], ['Digit7', '7'], ['Digit8', '8'], ['Digit9', '9'], ['Digit0', '0'], ['Minus', '-'], ['Equal', '='], ['Backspace', 'Backspace', 2], .5, ['Insert', 'Ins'], ['Home', 'Home'], ['PageUp', 'PgUp'], .5, ['NumLock', 'Num'], ['NumpadDivide', '/'], ['NumpadMultiply', '*'], ['NumpadSubtract', '-']],
    [['Tab', 'Tab', 1.5], ...'QWERTYUIOP'.split('').map(c => ['Key' + c, c]), ['BracketLeft', '['], ['BracketRight', ']'], ['Backslash', '\\', 1.5], .5, ['Delete', 'Del'], ['End', 'End'], ['PageDown', 'PgDn'], .5, ['Numpad7', '7'], ['Numpad8', '8'], ['Numpad9', '9'], ['NumpadAdd', '+', 1, 2]],
    [['CapsLock', 'Caps', 1.75], ...'ASDFGHJKL'.split('').map(c => ['Key' + c, c]), ['Semicolon', ';'], ['Quote', "'"], ['Enter', 'Enter', 2.25], 4, ['Numpad4', '4'], ['Numpad5', '5'], ['Numpad6', '6']],
    [['ShiftLeft', 'Shift', 2.25], ...'ZXCVBNM'.split('').map(c => ['Key' + c, c]), ['Comma', ','], ['Period', '.'], ['Slash', '/'], ['ShiftRight', 'Shift', 2.75], 1.5, ['ArrowUp', '↑'], 1.5, ['Numpad1', '1'], ['Numpad2', '2'], ['Numpad3', '3'], ['NumpadEnter', 'Ent', 1, 2]],
    [['ControlLeft', 'Ctrl', 1.25], ['MetaLeft', 'Win', 1.25], ['AltLeft', 'Alt', 1.25], ['Space', 'Space', 6.25], ['AltRight', 'Alt', 1.25], ['MetaRight', 'Win', 1.25], ['ContextMenu', 'Menu', 1.25], ['ControlRight', 'Ctrl', 1.25], .5, ['ArrowLeft', '←'], ['ArrowDown', '↓'], ['ArrowRight', '→'], .5, ['Numpad0', '0', 2], ['NumpadDecimal', '.']],
  ];
  function layout() {
    const keys = [];
    ROWS.forEach((row, y) => {
      let x = 0;
      for (const k of row) {
        if (typeof k === 'number') { x += k; continue; }
        const w = k[2] || 1, h = k[3] || 1;
        keys.push({ code: k[0], label: k[1] || k[0], x, y, w, h });
        x += w;
      }
    });
    return keys;
  }
  const CODE_ALIAS = { OSLeft: 'MetaLeft', OSRight: 'MetaRight', Apps: 'ContextMenu' };
  const normCode = c => CODE_ALIAS[c] || c;
  function rolloverLabel(max) {
    if (max <= 0) return 'Rollover: not measured yet';
    if (max >= 10) return `Rollover: ${max} keys at once (N-key rollover)`;
    if (max >= 6) return `Rollover: ${max} keys at once (6-key rollover or better)`;
    return `Rollover: ${max} key${max > 1 ? 's' : ''} at once so far. Hold more keys to test`;
  }
  function modString(e) { return ['ctrlKey', 'shiftKey', 'altKey', 'metaKey'].filter(m => e[m]).map(m => m.replace('Key', '')).join(' + ') || 'none'; }
  const LOCATIONS = ['standard (0)', 'left (1)', 'right (2)', 'numpad (3)'];

  /* ---------- audio ---------- */
  function levels(buf) {
    let sum = 0, peak = 0;
    for (let i = 0; i < buf.length; i++) { const v = buf[i]; sum += v * v; const a = Math.abs(v); if (a > peak) peak = a; }
    const rms = buf.length ? Math.sqrt(sum / buf.length) : 0;
    const db = rms > 0 ? Math.max(-100, 20 * Math.log10(rms)) : -100;
    const peakDb = peak > 0 ? Math.max(-100, 20 * Math.log10(peak)) : -100;
    return { rms, db: r1(db), peakDb: r1(peakDb) };
  }
  const dbToPct = db => clamp((db + 60) / 60, 0, 1);
  const micState = db => db <= -70 ? 'Silent' : db < -45 ? 'Quiet' : db < -12 ? 'Good level' : db < -3 ? 'Loud' : 'Clipping';

  /* ---------- video ---------- */
  const gcd = (a, b) => b ? gcd(b, a % b) : a;
  const RATIOS = [[16, 9], [4, 3], [16, 10], [3, 2], [1, 1], [21, 9], [5, 4], [9, 16], [3, 4]];
  function aspect(w, h) {
    if (!(w > 0 && h > 0)) return '–';
    const r = w / h;
    for (const [a, b] of RATIOS) if (Math.abs(r - a / b) / (a / b) < 0.015) return a + ':' + b;
    const g = gcd(Math.round(w), Math.round(h)); return (w / g) + ':' + (h / g);
  }
  const megapixels = (w, h) => r1(w * h / 1e6);
  function parseRes(s) { const m = /^(\d{3,4})x(\d{3,4})$/.exec(String(s)); return m ? { w: +m[1], h: +m[2] } : { w: 1280, h: 720 }; }
  function snapName(d) { const p = n => String(n).padStart(2, '0'); return `keywren-snapshot-${d.getFullYear()}${p(d.getMonth() + 1)}${p(d.getDate())}-${p(d.getHours())}${p(d.getMinutes())}${p(d.getSeconds())}.png`; }

  /* ---------- screen ---------- */
  const SCREEN = [
    { id: 'black', name: 'Black', tip: 'Look for bright dots: stuck or hot pixels. Also check corners for backlight bleed.' },
    { id: 'white', name: 'White', tip: 'Look for black or dark dots: dead pixels. Also check for dust under the panel.' },
    { id: 'red', name: 'Red', tip: 'Any dot that is not red is a stuck subpixel.' },
    { id: 'green', name: 'Green', tip: 'Any dot that is not green is a stuck subpixel.' },
    { id: 'blue', name: 'Blue', tip: 'Any dot that is not blue is a stuck subpixel.' },
    { id: 'cyan', name: 'Cyan', tip: 'Green + blue subpixels on, red off.' },
    { id: 'magenta', name: 'Magenta', tip: 'Red + blue subpixels on, green off.' },
    { id: 'yellow', name: 'Yellow', tip: 'Red + green subpixels on, blue off.' },
    { id: 'gray', name: '50% grey', tip: 'Should look even. Patches or clouds show uniformity problems.' },
    { id: 'dark', name: 'Dark grey (uniformity)', tip: 'In a dark room, look for glow, clouding or brighter corners (IPS glow, backlight bleed).' },
    { id: 'grad', name: 'Grey gradient', tip: 'Should be smooth. Visible stripes mean banding (limited colour depth or processing).' },
    { id: 'rgb', name: 'Colour gradients', tip: 'Red, green, blue and white ramps should all be smooth without steps.' },
    { id: 'grid', name: 'Pixel grid', tip: 'A one-pixel checkerboard. Shimmer or moiré can mean scaling is not 100%.' },
  ];
  const cycle = (i, d, n) => ((i + d) % n + n) % n;

  /* ---------- mouse ---------- */
  const cps = (clicks, ms) => ms > 0 ? r2(clicks / (ms / 1000)) : 0;
  const CPS_MODES = [1, 5, 10, 30];
  function cpsLevel(v) { return v >= 12 ? 'Lightning' : v >= 9 ? 'Very fast' : v >= 7 ? 'Fast' : v >= 5 ? 'Average' : 'Warming up'; }
  function sanitizeBest(o) { const out = {}; if (o && typeof o === 'object') for (const m of CPS_MODES) { const v = Number(o[m]); if (Number.isFinite(v) && v > 0 && v < 100) out[m] = r2(v); } return out; }
  const CHATTER_MS = 80; // two presses of the same button closer than this are almost always switch bounce
  const isChatter = (gapMs, btn) => btn === 0 || btn === 2 ? gapMs >= 0 && gapMs < CHATTER_MS : false;
  const BUTTONS = ['Left', 'Middle (wheel)', 'Right', 'Back (4)', 'Forward (5)'];

  /* ---------- refresh rate ---------- */
  const RATES = [24, 30, 48, 50, 60, 72, 75, 85, 90, 100, 120, 144, 165, 170, 175, 180, 200, 240, 280, 300, 360, 480, 500, 540];
  function snapRate(hz) {
    if (!(hz > 0)) return 0;
    let best = RATES[0]; for (const r of RATES) if (Math.abs(r - hz) < Math.abs(best - hz)) best = r;
    return Math.abs(best - hz) / best <= 0.04 ? best : Math.round(hz);
  }
  function frameStats(d) {
    const a = d.filter(x => Number.isFinite(x) && x > 0 && x < 1000);
    if (a.length < 2) return null;
    const s = [...a].sort((x, y) => x - y), med = s[Math.floor(s.length / 2)];
    const mean = a.reduce((m, x) => m + x, 0) / a.length;
    const sd = Math.sqrt(a.reduce((m, x) => m + (x - mean) * (x - mean), 0) / a.length);
    // a "dropped" frame is a gap of at least 1.5 normal frames; count how many frames were skipped
    const dropped = a.reduce((m, x) => m + (x >= med * 1.5 ? Math.round(x / med) - 1 : 0), 0);
    const hz = 1000 / med;
    return { median: r2(med), mean: r2(mean), min: r2(s[0]), max: r2(s[s.length - 1]), sd: r2(sd), hz: r1(hz), snapped: snapRate(hz), dropped };
  }

  return { esc, clamp, rng, makeText, WORDS, typingScore, accuracy, typingLevel, DURS, sanitizeHistory, bestOf, ROWS, layout, normCode, rolloverLabel, modString, LOCATIONS, levels, dbToPct, micState, aspect, megapixels, parseRes, snapName, SCREEN, cycle, cps, CPS_MODES, cpsLevel, sanitizeBest, isChatter, CHATTER_MS, BUTTONS, RATES, snapRate, frameStats };
})();
if (typeof module !== 'undefined' && module.exports) module.exports = KW;

if (typeof document !== 'undefined') (() => {
  const $ = (s, r = document) => r.querySelector(s), $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const el = (tag, cls, text) => { const e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; };
  const store = {
    get(k, d) { try { const v = localStorage.getItem(k); return v == null ? d : JSON.parse(v); } catch (e) { return d; } },
    set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { /* private mode / full */ } },
    del(k) { try { localStorage.removeItem(k); } catch (e) { /* ignore */ } },
  };
  let toastT = 0;
  const toast = m => { const t = $('#toast'); t.textContent = m; t.classList.add('show'); clearTimeout(toastT); toastT = setTimeout(() => t.classList.remove('show'), 2200); };
  const msg = (box, text, kind) => { box.hidden = !text; box.textContent = text || ''; box.className = 'msg mt2' + (kind ? ' ' + kind : ''); };
  function seg(box, cb) {
    box.addEventListener('click', e => {
      const b = e.target.closest('button'); if (!b || !box.contains(b)) return;
      for (const x of box.children) x.classList.toggle('on', x === b);
      cb(b);
    });
  }
  const segSet = (box, attr, v) => { for (const x of box.children) x.classList.toggle('on', x.dataset[attr] === String(v)); };

  /* Camera and mic streams are stopped whenever the page is hidden or left, so nothing keeps recording in the background. */
  const Media = {
    stops: new Set(),
    stopAll(reason) { for (const f of [...this.stops]) f(reason); },
  };
  document.addEventListener('visibilitychange', () => { if (document.hidden) Media.stopAll('hidden'); });
  window.addEventListener('pagehide', () => Media.stopAll('left'));

  const mediaError = (err, what) => {
    const n = err && err.name;
    if (n === 'NotAllowedError' || n === 'SecurityError') return `${what} access was blocked. Click the camera or lock icon in the address bar, allow the ${what.toLowerCase()} for this site, then press Start again.`;
    if (n === 'NotFoundError' || n === 'OverconstrainedError' || n === 'DevicesNotFoundError') return `No ${what.toLowerCase()} was found. Plug one in (or pick another device) and press Start again.`;
    if (n === 'NotReadableError' || n === 'TrackStartError' || n === 'AbortError') return `Your ${what.toLowerCase()} is busy or failed to start. Close other apps or tabs that may be using it (video calls, recorders) and try again.`;
    return `Could not start the ${what.toLowerCase()}${n ? ' (' + n + ')' : ''}. Try another browser or device.`;
  };
  const watchPerm = (name, pill) => {
    const show = s => { pill.textContent = 'Permission: ' + (s === 'granted' ? 'allowed' : s === 'denied' ? 'blocked' : 'not asked yet'); pill.className = 'pill' + (s === 'granted' ? ' ok' : s === 'denied' ? ' bad' : ''); };
    try { if (navigator.permissions && navigator.permissions.query) navigator.permissions.query({ name }).then(p => { show(p.state); p.onchange = () => show(p.state); }).catch(() => {}); } catch (e) { /* unsupported name */ }
    return show;
  };
  async function fillDevices(sel, kind, currentId) {
    if (!navigator.mediaDevices || !navigator.mediaDevices.enumerateDevices) return;
    const list = (await navigator.mediaDevices.enumerateDevices()).filter(d => d.kind === kind);
    sel.textContent = '';
    list.forEach((d, i) => { const o = el('option', null, d.label || `${kind === 'audioinput' ? 'Microphone' : 'Camera'} ${i + 1}`); o.value = d.deviceId; sel.appendChild(o); });
    if (!list.length) { const o = el('option', null, 'No devices found'); o.value = ''; sel.appendChild(o); }
    if (currentId) sel.value = currentId;
    sel.disabled = list.length < 1;
  }

  /* ================= typing speed test ================= */
  function typing() {
    const box = $('#ty-box'), words = $('#ty-words'), inp = $('#ty-in');
    const HKEY = 'kw.typing.history', OKEY = 'kw.typing.opts';
    const opts = Object.assign({ d: 60, punct: false, num: false }, store.get(OKEY, {}));
    if (!KW.DURS.includes(opts.d)) opts.d = 60;
    $('#ty-punct').checked = !!opts.punct; $('#ty-num').checked = !!opts.num; segSet($('#ty-dur'), 's', opts.d);
    let target = '', spans = [], typed = '', startAt = 0, timer = 0, done = false, keys = 0, errs = 0;
    const saveOpts = () => store.set(OKEY, { d: opts.d, punct: !!opts.punct, num: !!opts.num });

    function render() {
      words.textContent = ''; spans = [];
      const frag = document.createDocumentFragment();
      const ws = target.split(' ');
      ws.forEach((w, wi) => {
        const we = el('span', 'w');
        for (const ch of w) { const c = el('span', 'c', ch); we.appendChild(c); spans.push(c); }
        if (wi < ws.length - 1) { const c = el('span', 'c sp', ' '); we.appendChild(c); spans.push(c); }
        frag.appendChild(we);
      });
      words.appendChild(frag);
      if (spans[0]) spans[0].classList.add('cur');
      words.style.transform = 'translateY(0)';
    }
    function reset() {
      clearInterval(timer); timer = 0; startAt = 0; done = false; typed = ''; keys = 0; errs = 0;
      target = KW.makeText(Math.round(opts.d / 60 * 260) + 30, opts);
      inp.value = ''; inp.readOnly = false; render();
      $('#ty-time').textContent = opts.d; $('#ty-wpm').textContent = '0'; $('#ty-acc').textContent = '100%'; $('#ty-err').textContent = '0';
      box.classList.remove('finished', 'running');
    }
    function scroll() {
      const cur = spans[Math.min(typed.length, spans.length - 1)]; if (!cur) return;
      const lh = cur.offsetHeight || 40, top = cur.offsetTop;
      words.style.transform = `translateY(${-Math.max(0, top - lh)}px)`;
    }
    function update(v) {
      if (done) return;
      if (v.length > target.length) v = v.slice(0, target.length);
      if (!startAt && v.length > 0) { startAt = performance.now(); timer = setInterval(tick, 100); box.classList.add('running'); }
      for (let i = typed.length; i < v.length; i++) { keys++; if (v[i] !== target[i]) errs++; }
      const lo = Math.min(typed.length, v.length), hi = Math.max(typed.length, v.length);
      if (spans[typed.length]) spans[typed.length].classList.remove('cur');
      for (let i = lo; i < hi && i < spans.length; i++) {
        spans[i].classList.remove('ok', 'bad');
        if (i < v.length) spans[i].classList.add(v[i] === target[i] ? 'ok' : 'bad');
      }
      typed = v;
      if (spans[typed.length]) spans[typed.length].classList.add('cur');
      scroll(); live();
      if (typed.length >= target.length) finish();
    }
    function live() {
      const el_ = startAt ? performance.now() - startAt : 0;
      const sc = KW.typingScore(target, typed, Math.max(el_, 1000));
      $('#ty-wpm').textContent = startAt ? sc.wpm : 0;
      $('#ty-acc').textContent = KW.accuracy(keys, errs) + '%';
      $('#ty-err').textContent = sc.wrong;
    }
    function tick() {
      const left = opts.d * 1000 - (performance.now() - startAt);
      $('#ty-time').textContent = Math.max(0, Math.ceil(left / 1000));
      live();
      if (left <= 0) finish();
    }
    function finish() {
      if (done) return;
      done = true; clearInterval(timer); timer = 0; inp.readOnly = true;
      const ms = Math.min(performance.now() - startAt, opts.d * 1000);
      const sc = KW.typingScore(target, typed, ms), acc = KW.accuracy(keys, errs);
      const hist = KW.sanitizeHistory(store.get(HKEY, []));
      const prevBest = KW.bestOf(hist, opts.d);
      hist.push({ t: Date.now(), d: opts.d, wpm: sc.wpm, raw: sc.raw, acc });
      store.set(HKEY, KW.sanitizeHistory(hist));
      $('#tr-wpm').textContent = sc.wpm; $('#tr-acc').textContent = acc + '%'; $('#tr-raw').textContent = sc.raw;
      $('#tr-chars').textContent = sc.correct + ' / ' + sc.wrong; $('#tr-rank').textContent = KW.typingLevel(sc.wpm);
      $('#ty-best-flag').hidden = !(sc.wpm > prevBest && hist.length > 1);
      $('#ty-time').textContent = '0';
      $('#ty-result').hidden = false; box.classList.remove('running'); box.classList.add('finished');
      renderHist();
      $('#ty-again').focus();
    }
    function renderHist() {
      const hist = KW.sanitizeHistory(store.get(HKEY, []));
      const tb = $('#ty-hist tbody'); tb.textContent = '';
      for (const h of hist.slice().reverse().slice(0, 15)) {
        const tr = el('tr');
        [new Date(h.t).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }), h.d + ' s', h.wpm, h.raw, h.acc + '%'].forEach(v => tr.appendChild(el('td', null, String(v))));
        tb.appendChild(tr);
      }
      $('#ty-hist').hidden = !hist.length; $('#ty-hist-empty').hidden = !!hist.length; $('#ty-clear').disabled = !hist.length;
      const b = KW.bestOf(hist, opts.d); $('#ty-best').textContent = `Best (${opts.d} s): ` + (b ? b + ' WPM' : '–');
    }
    const restart = () => { $('#ty-result').hidden = true; reset(); inp.focus(); };
    inp.addEventListener('input', () => { if (inp.value.length > target.length) inp.value = inp.value.slice(0, target.length); update(inp.value); });
    inp.addEventListener('paste', e => e.preventDefault());
    inp.addEventListener('drop', e => e.preventDefault());
    inp.addEventListener('keydown', e => { if (e.key === 'Escape') { e.preventDefault(); restart(); } });
    inp.addEventListener('focus', () => box.classList.add('focused'));
    inp.addEventListener('blur', () => box.classList.remove('focused'));
    box.addEventListener('mousedown', e => { if (e.target !== inp) { e.preventDefault(); inp.focus(); } });
    document.addEventListener('keydown', e => {
      if (e.target === inp || e.ctrlKey || e.metaKey || e.altKey) return;
      if (e.key === 'Escape' && !$('#ty-result').hidden) { restart(); return; }
      if (e.target === document.body && e.key.length === 1 && !done) inp.focus();
    });
    seg($('#ty-dur'), b => { opts.d = +b.dataset.s; saveOpts(); renderHist(); restart(); });
    $('#ty-punct').addEventListener('change', e => { opts.punct = e.target.checked; saveOpts(); restart(); });
    $('#ty-num').addEventListener('change', e => { opts.num = e.target.checked; saveOpts(); restart(); });
    $('#ty-restart').addEventListener('click', restart);
    $('#ty-again').addEventListener('click', restart);
    $('#ty-clear').addEventListener('click', () => { store.del(HKEY); renderHist(); toast('History cleared'); });
    reset(); renderHist();
    return { get target() { return target; }, get typed() { return typed; }, get done() { return done; }, finish, restart, opts };
  }

  /* ================= keyboard tester ================= */
  function keyboard() {
    const kb = $('#kb'), keys = KW.layout(), els = new Map(), labels = new Map();
    for (const k of keys) {
      const d = el('div', 'key' + (k.w >= 1.5 ? ' wide' : '') + (k.h > 1 ? ' tall' : '') + (k.y === 0 ? ' r0' : ''), k.label);
      d.style.gridColumn = `${Math.round(k.x * 4) + 1} / span ${Math.round(k.w * 4)}`;
      d.style.gridRow = `${k.y + 1} / span ${k.h}`;
      d.dataset.code = k.code; kb.appendChild(d); els.set(k.code, d); labels.set(k.code, k.label);
    }
    const tested = new Set(), held = new Set(); let max = 0; const log = [];
    const showInfo = (e, code) => {
      $('#ki-key').textContent = e.key === ' ' ? '" " (space)' : JSON.stringify(e.key);
      $('#ki-code').textContent = code || '(empty)';
      $('#ki-kc').textContent = e.keyCode + ' / ' + e.which;
      $('#ki-loc').textContent = KW.LOCATIONS[e.location] || String(e.location);
      $('#ki-rep').textContent = String(e.repeat);
      $('#ki-mod').textContent = KW.modString(e);
      $('#ki-type').textContent = e.type;
    };
    const paint = () => {
      const onBoard = [...tested].filter(c => els.has(c)).length;
      $('#kb-tested').textContent = onBoard + ' / ' + keys.length;
      $('#kb-held').textContent = held.size; $('#kb-max').textContent = max;
      const hl = $('#kb-heldlist'); hl.textContent = '';
      if (!held.size) hl.appendChild(el('span', 'hint', 'No keys held'));
      for (const c of held) hl.appendChild(el('kbd', null, labels.get(c) || c));
      const p = $('#kb-nkro'); p.textContent = KW.rolloverLabel(max); p.className = 'pill' + (max >= 6 ? ' ok' : max > 0 ? ' warn' : '');
      const ol = $('#kb-log'); ol.textContent = '';
      for (const l of log) ol.appendChild(el('li', null, l));
    };
    const addLog = (e, code) => { log.unshift(`${e.type === 'keydown' ? '▼' : '▲'} ${(code || '?').padEnd(14)} key=${JSON.stringify(e.key)}${e.repeat ? ' (repeat)' : ''}`); if (log.length > 30) log.pop(); };
    document.addEventListener('keydown', e => {
      if ($('#kb-block').checked) e.preventDefault();
      const code = KW.normCode(e.code);
      if (code) { tested.add(code); if (!held.has(code)) { held.add(code); max = Math.max(max, held.size); } }
      const k = els.get(code); if (k) k.classList.add('down', 'done');
      $('#kb-last').textContent = labels.get(code) || code || e.key;
      showInfo(e, code); addLog(e, code); paint();
    });
    document.addEventListener('keyup', e => {
      if ($('#kb-block').checked) e.preventDefault();
      const code = KW.normCode(e.code);
      if (code) { tested.add(code); held.delete(code); }
      const k = els.get(code); if (k) { k.classList.remove('down'); k.classList.add('done'); }
      showInfo(e, code); addLog(e, code); paint();
    });
    const release = () => { held.clear(); for (const k of els.values()) k.classList.remove('down'); paint(); };
    window.addEventListener('blur', release);
    $('#kb-reset').addEventListener('click', () => { tested.clear(); max = 0; log.length = 0; for (const k of els.values()) k.classList.remove('down', 'done'); release(); $('#kb-last').textContent = '–'; });
    paint();
    return { tested, held, get max() { return max; } };
  }

  /* ================= microphone test ================= */
  function mic() {
    const showPerm = watchPerm('microphone', $('#mic-perm'));
    const cv = $('#mic-wave'), g = cv.getContext('2d'), box = $('#mic-msg');
    let stream = null, ctx = null, an = null, buf = null, raf = 0, rec = null, recT = 0, recTick = 0, url = null, peakHold = -100, peakT = 0, lastTxt = 0, recLen = 5;
    const btns = on => { $('#mic-start').disabled = false; $('#mic-start').textContent = on ? 'Restart' : 'Start mic test'; $('#mic-stop').disabled = !on; $('#mic-rec').disabled = !on || typeof MediaRecorder === 'undefined'; };
    function draw() {
      raf = requestAnimationFrame(draw);
      an.getFloatTimeDomainData(buf);
      const lv = KW.levels(buf), now = performance.now();
      $('#mic-bar').style.transform = `scaleX(${KW.dbToPct(lv.db)})`;
      if (lv.peakDb > peakHold || now - peakT > 1500) { peakHold = lv.peakDb; peakT = now; }
      $('#mic-peak').style.left = (KW.dbToPct(peakHold) * 100) + '%';
      if (now - lastTxt > 120) {
        lastTxt = now; $('#mic-db').textContent = (lv.db <= -100 ? '-∞' : lv.db.toFixed(1)) + ' dB';
        const st = KW.micState(lv.db), p = $('#mic-state'); p.textContent = st;
        p.className = 'pill' + (st === 'Good level' || st === 'Loud' ? ' ok' : st === 'Clipping' ? ' bad' : st === 'Quiet' ? ' warn' : '');
      }
      const W = cv.width, H = cv.height; g.clearRect(0, 0, W, H);
      g.strokeStyle = 'rgba(255,255,255,.07)'; g.lineWidth = 1; g.beginPath(); g.moveTo(0, H / 2); g.lineTo(W, H / 2); g.stroke();
      const grad = g.createLinearGradient(0, 0, W, 0); grad.addColorStop(0, '#19c3d6'); grad.addColorStop(1, '#8be05a');
      g.strokeStyle = grad; g.lineWidth = 3; g.beginPath();
      const step = buf.length / W;
      for (let x = 0; x < W; x++) { const v = buf[Math.floor(x * step)]; const y = H / 2 - v * H * 0.48; x ? g.lineTo(x, y) : g.moveTo(x, y); }
      g.stroke();
    }
    function stop(reason) {
      Media.stops.delete(stop);
      cancelAnimationFrame(raf); raf = 0;
      if (rec && rec.state !== 'inactive') { try { rec.stop(); } catch (e) { /* already stopped */ } }
      clearTimeout(recT); clearInterval(recTick);
      if (stream) stream.getTracks().forEach(t => t.stop());
      if (ctx) ctx.close().catch(() => {});
      stream = null; ctx = null; an = null;
      $('#mic-bar').style.transform = 'scaleX(0)'; $('#mic-peak').style.left = '0%'; $('#mic-db').textContent = '– dB';
      $('#mic-state').textContent = 'Off'; $('#mic-state').className = 'pill';
      g.clearRect(0, 0, cv.width, cv.height);
      btns(false); $('#mic-rec').textContent = '● Record';
      if (reason === 'hidden') msg(box, 'The microphone was turned off because you switched tabs. Press Start mic test to continue.', 'warn');
      else if (reason === 'user') msg(box, 'Microphone off.', '');
    }
    async function start(deviceId) {
      if (stream) stop('restart');
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) { msg(box, 'This browser can’t access a microphone here. Use a recent Chrome, Edge, Firefox or Safari over https.', 'bad'); return; }
      msg(box, 'Waiting for permission… allow the microphone in your browser’s prompt.', '');
      $('#mic-start').disabled = true;
      try {
        stream = await navigator.mediaDevices.getUserMedia({ audio: { deviceId: deviceId ? { exact: deviceId } : undefined, echoCancellation: false, noiseSuppression: false, autoGainControl: false }, video: false });
      } catch (err) { stream = null; btns(false); msg(box, mediaError(err, 'Microphone'), 'bad'); if (err && err.name === 'NotAllowedError') showPerm('denied'); return; }
      if (document.hidden) { stream.getTracks().forEach(t => t.stop()); stream = null; btns(false); return; }
      Media.stops.add(stop); showPerm('granted'); btns(true);
      const AC = window.AudioContext || window.webkitAudioContext;
      ctx = new AC(); an = ctx.createAnalyser(); an.fftSize = 2048; buf = new Float32Array(an.fftSize);
      ctx.createMediaStreamSource(stream).connect(an); // not connected to the speakers, so no feedback
      if (ctx.state === 'suspended') ctx.resume().catch(() => {});
      const tr = stream.getAudioTracks()[0], s = tr.getSettings ? tr.getSettings() : {};
      $('#mi-dev').textContent = tr.label || 'Microphone';
      $('#mi-rate').textContent = ((s.sampleRate || ctx.sampleRate) / 1000) + ' kHz';
      $('#mi-ch').textContent = s.channelCount ? String(s.channelCount) : '–';
      $('#mi-proc').textContent = ['echoCancellation', 'noiseSuppression', 'autoGainControl'].map(k => (k === 'echoCancellation' ? 'echo cancel' : k === 'noiseSuppression' ? 'noise suppr.' : 'auto gain') + ' ' + (s[k] ? 'on' : 'off')).join(', ');
      tr.addEventListener('ended', () => { if (stream) { stop('ended'); msg(box, 'The microphone was disconnected.', 'warn'); } });
      const st = stream;
      await fillDevices($('#mic-dev'), 'audioinput', s.deviceId).catch(() => {});
      if (stream !== st) return; // stopped (or restarted) while starting
      msg(box, 'Listening. Speak, clap or tap the mic: the meter and waveform should move.', 'ok');
      btns(true); peakHold = -100; draw();
    }
    function record() {
      if (!stream) return;
      if (rec && rec.state === 'recording') { rec.stop(); return; }
      const types = ['audio/webm;codecs=opus', 'audio/webm', 'audio/ogg;codecs=opus', 'audio/mp4'];
      const type = types.find(t => MediaRecorder.isTypeSupported && MediaRecorder.isTypeSupported(t)) || '';
      const chunks = [];
      try { rec = new MediaRecorder(stream, type ? { mimeType: type } : undefined); } catch (e) { msg(box, 'Recording isn’t supported in this browser.', 'bad'); return; }
      rec.ondataavailable = e => { if (e.data && e.data.size) chunks.push(e.data); };
      rec.onstop = () => {
        clearTimeout(recT); clearInterval(recTick); $('#mic-rec').textContent = '● Record'; $('#mic-rec-t').textContent = '';
        if (!chunks.length) return;
        const blob = new Blob(chunks, { type: rec.mimeType || type || 'audio/webm' });
        if (url) URL.revokeObjectURL(url);
        url = URL.createObjectURL(blob);
        $('#mic-audio').src = url; $('#mic-dl').href = url;
        $('#mic-dl').download = 'keywren-mic-test.' + (/ogg/.test(blob.type) ? 'ogg' : /mp4/.test(blob.type) ? 'm4a' : 'webm');
        $('#mic-play').hidden = false; toast('Recording ready: press play');
      };
      rec.start(250);
      const t0 = performance.now();
      $('#mic-rec').textContent = '■ Stop recording';
      recTick = setInterval(() => { $('#mic-rec-t').textContent = ((performance.now() - t0) / 1000).toFixed(1) + ' / ' + recLen + ' s'; }, 100);
      recT = setTimeout(() => { if (rec && rec.state === 'recording') rec.stop(); }, recLen * 1000);
    }
    $('#mic-start').addEventListener('click', () => start($('#mic-dev').value || undefined));
    $('#mic-stop').addEventListener('click', () => stop('user'));
    $('#mic-dev').addEventListener('change', e => { if (stream) start(e.target.value); });
    $('#mic-rec').addEventListener('click', record);
    seg($('#mic-len'), b => { recLen = +b.dataset.s; });
    window.addEventListener('pagehide', () => { if (url) URL.revokeObjectURL(url); });
    btns(false);
    return { get stream() { return stream; }, get ctx() { return ctx; }, get url() { return url; }, start, stop };
  }

  /* ================= webcam test ================= */
  function webcam() {
    const showPerm = watchPerm('camera', $('#cam-perm'));
    const v = $('#cam-video'), box = $('#cam-msg');
    let stream = null, frames = 0, fpsT0 = 0, vfc = 0, fpsTimer = 0, lastQ = 0; const snaps = [];
    const btns = on => { $('#cam-start').disabled = false; $('#cam-start').textContent = on ? 'Restart' : 'Start webcam test'; $('#cam-stop').disabled = !on; $('#cam-snap').disabled = !on; $('#cam-empty').hidden = on; $('#cam-stage').classList.toggle('on', on); };
    const readout = () => {
      if (!stream) return;
      const tr = stream.getVideoTracks()[0], s = tr && tr.getSettings ? tr.getSettings() : {};
      const w = v.videoWidth || s.width || 0, h = v.videoHeight || s.height || 0;
      $('#cam-wh').textContent = w && h ? `${w}×${h}` : '–';
      $('#cam-ar').textContent = KW.aspect(w, h);
      $('#cam-mp').textContent = w && h ? KW.megapixels(w, h) + ' MP' : '–';
      $('#cam-fpsr').textContent = s.frameRate ? (Math.round(s.frameRate * 10) / 10) + '' : '–';
    };
    function countFrame() { frames++; vfc = v.requestVideoFrameCallback(countFrame); }
    function startFps() {
      frames = 0; fpsT0 = performance.now();
      if (v.requestVideoFrameCallback) vfc = v.requestVideoFrameCallback(countFrame);
      else lastQ = v.getVideoPlaybackQuality ? v.getVideoPlaybackQuality().totalVideoFrames : 0;
      fpsTimer = setInterval(() => {
        const now = performance.now(), dt = (now - fpsT0) / 1000;
        if (!v.requestVideoFrameCallback && v.getVideoPlaybackQuality) { const q = v.getVideoPlaybackQuality().totalVideoFrames; frames = q - lastQ; lastQ = q; }
        $('#cam-fps').textContent = dt > 0 ? (Math.round(frames / dt * 10) / 10).toFixed(1) : '–';
        frames = 0; fpsT0 = now; readout();
      }, 1000);
    }
    function stop(reason) {
      Media.stops.delete(stop);
      clearInterval(fpsTimer); if (vfc && v.cancelVideoFrameCallback) v.cancelVideoFrameCallback(vfc); vfc = 0;
      if (stream) stream.getTracks().forEach(t => t.stop());
      stream = null; v.pause(); v.srcObject = null;
      for (const id of ['#cam-wh', '#cam-ar', '#cam-fps', '#cam-fpsr', '#cam-mp']) $(id).textContent = '–';
      btns(false);
      if (reason === 'hidden') msg(box, 'The camera was turned off because you switched tabs. Press Start webcam test to continue.', 'warn');
      else if (reason === 'user') msg(box, 'Camera off.', '');
    }
    async function start(deviceId) {
      if (stream) stop('restart');
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) { msg(box, 'This browser can’t access a camera here. Use a recent Chrome, Edge, Firefox or Safari over https.', 'bad'); return; }
      const r = KW.parseRes($('#cam-res').value);
      msg(box, 'Waiting for permission… allow the camera in your browser’s prompt.', '');
      $('#cam-start').disabled = true;
      try {
        stream = await navigator.mediaDevices.getUserMedia({ video: { deviceId: deviceId ? { exact: deviceId } : undefined, width: { ideal: r.w }, height: { ideal: r.h } }, audio: false });
      } catch (err) { stream = null; btns(false); msg(box, mediaError(err, 'Camera'), 'bad'); if (err && err.name === 'NotAllowedError') showPerm('denied'); return; }
      if (document.hidden) { stream.getTracks().forEach(t => t.stop()); stream = null; btns(false); return; }
      Media.stops.add(stop); showPerm('granted');
      const st = stream; v.srcObject = st;
      btns(true); // Stop works straight away, even while the video is still starting
      try { await v.play(); } catch (e) { /* autoplay blocked; muted video should play */ }
      if (stream !== st) return; // stopped (or restarted) while starting
      const tr = st.getVideoTracks()[0];
      tr.addEventListener('ended', () => { if (stream) { stop('ended'); msg(box, 'The camera was disconnected.', 'warn'); } });
      const s = tr.getSettings ? tr.getSettings() : {};
      await fillDevices($('#cam-dev'), 'videoinput', s.deviceId).catch(() => {});
      if (stream !== st) return;
      btns(true); readout(); startFps();
      const got = (v.videoWidth || s.width) + '×' + (v.videoHeight || s.height);
      msg(box, `Camera on: ${tr.label || 'camera'} at ${got}. ` + ((v.videoWidth || s.width) < r.w ? `It can’t do ${r.w}×${r.h}, so the browser picked the closest size.` : ''), 'ok');
    }
    function snapshot() {
      if (!stream || !v.videoWidth) return;
      const c = document.createElement('canvas'); c.width = v.videoWidth; c.height = v.videoHeight;
      const g = c.getContext('2d');
      if ($('#cam-mirror').checked) { g.translate(c.width, 0); g.scale(-1, 1); }
      g.drawImage(v, 0, 0, c.width, c.height);
      c.toBlob(b => {
        if (!b) return;
        const url = URL.createObjectURL(b), name = KW.snapName(new Date());
        const fig = el('figure', 'snap'), img = el('img'); img.src = url; img.alt = 'Webcam snapshot ' + c.width + '×' + c.height;
        const a = el('a', 'btn sm', 'Download PNG'); a.href = url; a.download = name;
        fig.appendChild(img); fig.appendChild(a);
        $('#cam-snaps').prepend(fig); snaps.unshift({ url, fig });
        while (snaps.length > 6) { const o = snaps.pop(); o.fig.remove(); URL.revokeObjectURL(o.url); }
        toast('Snapshot saved below');
      }, 'image/png');
    }
    $('#cam-start').addEventListener('click', () => start($('#cam-dev').value || undefined));
    $('#cam-stop').addEventListener('click', () => stop('user'));
    $('#cam-dev').addEventListener('change', e => { if (stream) start(e.target.value); });
    $('#cam-res').addEventListener('change', () => { store.set('kw.cam.res', $('#cam-res').value); if (stream) start($('#cam-dev').value || undefined); });
    $('#cam-mirror').addEventListener('change', e => { v.classList.toggle('mirror', e.target.checked); store.set('kw.cam.mirror', e.target.checked); });
    const savedRes = store.get('kw.cam.res', null); if (savedRes && [...$('#cam-res').options].some(o => o.value === savedRes)) $('#cam-res').value = savedRes;
    $('#cam-mirror').checked = store.get('kw.cam.mirror', true) !== false; v.classList.toggle('mirror', $('#cam-mirror').checked);
    v.addEventListener('loadedmetadata', readout); v.addEventListener('resize', readout);
    $('#cam-snap').addEventListener('click', snapshot);
    window.addEventListener('pagehide', () => snaps.forEach(s => URL.revokeObjectURL(s.url)));
    btns(false);
    return { get stream() { return stream; }, start, stop, snapshot, snaps };
  }

  /* ================= dead pixel / screen test ================= */
  function screenTest() {
    const list = $('#scr-list'), stage = $('#scr-stage'), N = KW.SCREEN.length;
    let idx = 0, open = false, hideT = 0;
    KW.SCREEN.forEach((t, i) => {
      const b = el('button', 'sw'); b.type = 'button'; b.dataset.i = i;
      b.appendChild(el('i', 'st-' + t.id)); b.appendChild(el('span', null, t.name));
      b.addEventListener('click', () => show(i)); list.appendChild(b);
    });
    const info = () => {
      const dpr = window.devicePixelRatio || 1;
      $('#sc-res').textContent = `${screen.width}×${screen.height}`;
      $('#sc-phys').textContent = `${Math.round(screen.width * dpr)}×${Math.round(screen.height * dpr)}`;
      $('#sc-dpr').textContent = (Math.round(dpr * 100) / 100) + '×';
      $('#sc-vp').textContent = `${innerWidth}×${innerHeight}`;
      $('#sc-depth').textContent = screen.colorDepth + '-bit';
    };
    function paint() {
      const t = KW.SCREEN[idx];
      stage.className = 'stage st-' + t.id;
      $('#scr-name').textContent = `${idx + 1}/${N} · ${t.name}`; $('#scr-tip').textContent = t.tip;
    }
    function show(i) {
      idx = KW.cycle(i, 0, N); open = true; stage.hidden = false; paint();
      document.body.classList.add('noscroll'); stage.focus({ preventScroll: true });
      if (stage.requestFullscreen && !document.fullscreenElement) stage.requestFullscreen().catch(() => { /* overlay still covers the window */ });
      idle();
    }
    function close() {
      if (!open) return;
      open = false; stage.hidden = true; document.body.classList.remove('noscroll'); stage.classList.remove('nocursor');
      if (document.fullscreenElement && document.exitFullscreen) document.exitFullscreen().catch(() => {});
      $('#scr-start').focus({ preventScroll: true });
    }
    const go = d => { idx = KW.cycle(idx, d, N); paint(); };
    const idle = () => { stage.classList.remove('nocursor'); clearTimeout(hideT); hideT = setTimeout(() => stage.classList.add('nocursor'), 1500); };
    stage.addEventListener('click', () => go(1));
    stage.addEventListener('contextmenu', e => { e.preventDefault(); go(-1); });
    stage.addEventListener('mousemove', idle);
    document.addEventListener('keydown', e => {
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      if (!open) { if ((e.key === 'f' || e.key === 'F') && !/INPUT|SELECT|TEXTAREA/.test(e.target.tagName)) { e.preventDefault(); show(0); } return; }
      if (['ArrowRight', 'ArrowDown', ' ', 'PageDown', 'Enter'].includes(e.key)) { e.preventDefault(); go(1); }
      else if (['ArrowLeft', 'ArrowUp', 'PageUp', 'Backspace'].includes(e.key)) { e.preventDefault(); go(-1); }
      else if (e.key === 'h' || e.key === 'H') $('#scr-label').hidden = !$('#scr-label').hidden;
      else if (e.key === 'Home') { idx = 0; paint(); }
      else if (e.key === 'Escape') { e.preventDefault(); close(); }
    });
    document.addEventListener('fullscreenchange', () => { if (!document.fullscreenElement && open) close(); });
    $('#scr-start').addEventListener('click', () => show(0));
    window.addEventListener('resize', info); info();
    return { show, close, get idx() { return idx; }, get open() { return open; } };
  }

  /* ================= mouse / CPS test ================= */
  function mouse() {
    const area = $('#cps-area'), BKEY = 'kw.cps.best';
    let mode = store.get('kw.cps.mode', 5); if (!KW.CPS_MODES.includes(mode)) mode = 5;
    let best = KW.sanitizeBest(store.get(BKEY, {})), state = 'idle', clicks = 0, t0 = 0, iv = 0, coolUntil = 0;
    segSet($('#cps-mode'), 's', mode);
    const showBest = () => { $('#cps-best').textContent = best[mode] ? best[mode].toFixed(2) : '–'; };
    const resetCps = () => { clearInterval(iv); state = 'idle'; clicks = 0; $('#cps-val').textContent = '0.00'; $('#cps-clicks').textContent = '0'; $('#cps-time').textContent = mode.toFixed(1); $('#cps-big').textContent = 'Click to start'; $('#cps-sub').textContent = 'The timer starts on your first click'; area.classList.remove('run', 'done'); showBest(); };
    function end() {
      clearInterval(iv); state = 'done'; coolUntil = performance.now() + 700;
      const v = KW.cps(clicks, mode * 1000), nb = !best[mode] || v > best[mode];
      if (nb && v > 0) { best[mode] = v; store.set(BKEY, best); }
      $('#cps-val').textContent = v.toFixed(2); $('#cps-time').textContent = '0.0';
      $('#cps-big').textContent = v.toFixed(2) + ' CPS'; $('#cps-sub').textContent = `${clicks} clicks in ${mode} s · ${KW.cpsLevel(v)}${nb && v > 0 ? ' · new best!' : ''} · click to go again`;
      area.classList.remove('run'); area.classList.add('done'); showBest();
    }
    function hit() {
      const now = performance.now();
      if (state === 'done') { if (now < coolUntil) return; resetCps(); }
      if (state === 'idle') {
        state = 'run'; t0 = now; clicks = 0; area.classList.add('run'); $('#cps-sub').textContent = 'Keep clicking!';
        iv = setInterval(() => {
          const el_ = performance.now() - t0, left = mode * 1000 - el_;
          $('#cps-time').textContent = Math.max(0, left / 1000).toFixed(1);
          $('#cps-val').textContent = KW.cps(clicks, Math.max(el_, 100)).toFixed(2);
          if (left <= 0) end();
        }, 50);
      }
      if (state === 'run') { clicks++; $('#cps-clicks').textContent = clicks; $('#cps-big').textContent = clicks; }
    }
    area.addEventListener('pointerdown', e => { if (e.button !== 0) return; e.preventDefault(); hit(); });
    area.addEventListener('keydown', e => { if ((e.key === ' ' || e.key === 'Enter') && !e.repeat) { e.preventDefault(); hit(); } });
    area.addEventListener('contextmenu', e => e.preventDefault());
    seg($('#cps-mode'), b => { mode = +b.dataset.s; store.set('kw.cps.mode', mode); resetCps(); });
    resetCps();

    // buttons / wheel / double-click tester
    const mb = $('#mb-area'), counts = [0, 0, 0, 0, 0], dbl = [0, 0, 0, 0, 0], lastDown = [-1e9, -1e9, -1e9, -1e9, -1e9];
    let up = 0, down = 0, chatter = 0, wheelT = 0;
    const tb = $('#mb-table tbody'), cells = KW.BUTTONS.map(n => { const tr = el('tr'); tr.appendChild(el('td', null, n)); const a = el('td', 'mono', '0'), b = el('td', 'mono', '0'); tr.appendChild(a); tr.appendChild(b); tb.appendChild(tr); return [a, b]; });
    const paint = () => { cells.forEach(([a, b], i) => { a.textContent = counts[i]; b.textContent = dbl[i]; }); $('#mb-up').textContent = up; $('#mb-down').textContent = down; $('#mb-chat').textContent = chatter; };
    mb.addEventListener('mousedown', e => {
      e.preventDefault();
      const b = e.button; if (b < 0 || b > 4) return;
      const now = performance.now(), gap = now - lastDown[b]; lastDown[b] = now;
      counts[b]++; pressedIn[b] = true; $('#mz-' + b).classList.add('on');
      if (e.detail >= 2 || (b !== 0 && gap < 500)) { dbl[b]++; $('#mb-int').textContent = Math.round(gap) + ' ms'; }
      if (KW.isChatter(gap, b)) { chatter++; msg($('#mb-warn'), `Two ${KW.BUTTONS[b].toLowerCase()} presses only ${Math.round(gap)} ms apart. If you only clicked once, your switch may be double-clicking (chatter).`, 'warn'); }
      paint();
    });
    // Chrome navigates Back/Forward on button-up unless the up event is cancelled; the up target is not always inside
    // the area, so remember which buttons were pressed in it.
    const pressedIn = [false, false, false, false, false];
    const release = e => { const b = e.button; if (b < 0 || b > 4) return; $('#mz-' + b).classList.remove('on'); if ((b === 3 || b === 4) && (pressedIn[b] || mb.contains(e.target))) e.preventDefault(); if (e.type === 'mouseup') pressedIn[b] = false; };
    window.addEventListener('pointerup', release, true);
    window.addEventListener('mouseup', release, true);
    mb.addEventListener('auxclick', e => e.preventDefault());
    mb.addEventListener('contextmenu', e => e.preventDefault());
    mb.addEventListener('wheel', e => {
      e.preventDefault();
      const w = $('#mz-wheel');
      if (e.deltaY < 0) { up++; w.className = 'wheel up'; } else if (e.deltaY > 0) { down++; w.className = 'wheel down'; }
      clearTimeout(wheelT); wheelT = setTimeout(() => { w.className = 'wheel'; }, 180); paint();
    }, { passive: false });
    mb.addEventListener('mousemove', e => { const r = mb.getBoundingClientRect(); $('#mb-pos').textContent = `x ${Math.round(e.clientX - r.left)}, y ${Math.round(e.clientY - r.top)}`; });
    $('#mb-reset').addEventListener('click', () => { counts.fill(0); dbl.fill(0); lastDown.fill(-1e9); up = down = chatter = 0; $('#mb-int').textContent = '–'; msg($('#mb-warn'), ''); paint(); });
    paint();
    return { get state() { return state; }, get clicks() { return clicks; }, counts, dbl, get up() { return up; }, get down() { return down; }, get best() { return best; } };
  }

  /* ================= refresh rate test ================= */
  function refresh() {
    const gc = $('#rr-graph'), g = gc.getContext('2d'), uc = $('#rr-ufo'), u = uc.getContext('2d');
    let last = 0, deltas = [], n = 0, lastUi = 0, speed = 960, stats = null;
    const lanes = [1, 2, 4], pos = [0, 0, 0];
    const reset = () => { last = 0; deltas = []; n = 0; stats = null; $('#rr-hz').textContent = '–'; $('#rr-snap').textContent = 'Measuring… keep this tab in front'; };
    function ufo(x, y, s) {
      u.fillStyle = 'rgba(25,195,214,.35)'; u.beginPath(); u.ellipse(x, y - 8 * s, 16 * s, 14 * s, 0, Math.PI, 0); u.fill();
      const gr = u.createLinearGradient(x - 40 * s, 0, x + 40 * s, 0); gr.addColorStop(0, '#19c3d6'); gr.addColorStop(1, '#8be05a');
      u.fillStyle = gr; u.beginPath(); u.ellipse(x, y, 40 * s, 11 * s, 0, 0, Math.PI * 2); u.fill();
      u.fillStyle = '#05161b'; for (let k = -2; k <= 2; k++) { u.beginPath(); u.arc(x + k * 13 * s, y, 2.6 * s, 0, Math.PI * 2); u.fill(); }
    }
    function frame(t) {
      requestAnimationFrame(frame);
      if (document.hidden) { last = 0; return; }
      if (last) { const d = t - last; deltas.push(d); if (deltas.length > 240) deltas.shift(); }
      const dt = last ? Math.min(t - last, 100) : 0; last = t; n++;
      if (t - lastUi > 250 && deltas.length > 20) {
        lastUi = t; stats = KW.frameStats(deltas.slice(-120));
        if (stats) {
          $('#rr-hz').textContent = stats.hz.toFixed(1) === String(stats.snapped) + '.0' ? stats.snapped : stats.hz.toFixed(1);
          $('#rr-snap').textContent = `Your display is most likely running at ${stats.snapped} Hz`;
          $('#rr-ft').textContent = stats.mean.toFixed(2) + ' ms'; $('#rr-jit').textContent = '±' + stats.sd.toFixed(2) + ' ms';
          $('#rr-mm').textContent = stats.min.toFixed(1) + ' / ' + stats.max.toFixed(1); $('#rr-drop').textContent = KW.frameStats(deltas).dropped;
        }
      }
      // frame-time graph
      const W = gc.width, H = gc.height, med = stats ? stats.median : 16.7, top = Math.max(med * 3, 34);
      g.clearRect(0, 0, W, H);
      g.strokeStyle = 'rgba(255,255,255,.12)'; g.lineWidth = 1; g.setLineDash([6, 6]); const ym = H - med / top * H; g.beginPath(); g.moveTo(0, ym); g.lineTo(W, ym); g.stroke(); g.setLineDash([]);
      const bw = W / 240;
      deltas.forEach((d, i) => { const h = Math.min(H, d / top * H); g.fillStyle = d >= med * 1.5 ? '#ff6b7f' : '#19c3d6'; g.fillRect(i * bw, H - h, Math.max(1, bw - 1), h); });
      g.fillStyle = 'rgba(255,255,255,.5)'; g.font = '22px Inter, sans-serif'; g.fillText(med.toFixed(1) + ' ms', 8, Math.max(24, ym - 8));
      // motion lanes
      const UW = uc.width, UH = uc.height, k = UW / Math.max(1, uc.clientWidth), lh = UH / lanes.length;
      u.clearRect(0, 0, UW, UH);
      lanes.forEach((div, i) => {
        if (n % div === 0) pos[i] = (pos[i] + speed * k * dt / 1000 * div) % (UW + 120);
        const y = lh * i + lh / 2 + 6;
        u.strokeStyle = 'rgba(255,255,255,.06)'; u.beginPath(); u.moveTo(0, lh * (i + 1)); u.lineTo(UW, lh * (i + 1)); u.stroke();
        ufo(pos[i] - 60, y, 1.25);
        const hz = stats ? stats.snapped : 60;
        u.fillStyle = 'rgba(255,255,255,.75)'; u.font = '600 22px Inter, sans-serif'; u.fillText(`${Math.round(hz / div)} fps${div === 1 ? ' (full rate)' : ''}`, 12, lh * i + 30);
      });
    }
    document.addEventListener('visibilitychange', () => { if (!document.hidden) reset(); });
    $('#rr-reset').addEventListener('click', reset);
    seg($('#rr-speed'), b => { speed = +b.dataset.v; });
    reset(); requestAnimationFrame(frame);
    return { get stats() { return stats; }, get deltas() { return deltas; }, reset };
  }

  const page = document.body.dataset.page;
  const inits = { typing, keyboard, mic, webcam, screen: screenTest, mouse, refresh };
  const api = inits[page] ? inits[page]() : null;

  /* ---------- consent (needed before showing personalised ads in EU/UK) ---------- */
  const CKEY = 'kw.consent';
  if (!store.get(CKEY, null)) $('#consent').classList.add('show');
  $('#c-yes').addEventListener('click', () => { store.set(CKEY, 'granted'); $('#consent').classList.remove('show'); });
  $('#c-no').addEventListener('click', () => { store.set(CKEY, 'denied'); $('#consent').classList.remove('show'); });

  window.__keywren = { page, api, Media };
})();
