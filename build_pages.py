# Generates one SEO page per tool from template.html. Run: python3 build_pages.py
import re, json, os
DOMAIN = "https://cinch2108.github.io/keywren"
SELF = "keywren"
# ---- "More free tools" team footer: edit this ONE list, then run `python3 build_pages.py`. ----
# Applied to every generated page plus privacy.html, terms.html and 404.html. The current site is left out.
TEAM = [
    ("chroma",     "Chroma",     "https://cinch2108.github.io/chroma/",     "Color palettes, contrast checker & gradients"),
    ("textforge",  "Textforge",  "https://cinch2108.github.io/textforge/",  "Word counter, JSON, Base64, diff & regex"),
    ("hourlark",   "Hourlark",   "https://cinch2108.github.io/hourlark/",   "Timer, stopwatch, Pomodoro & world clock"),
    ("numora",     "Numora",     "https://cinch2108.github.io/numora/",     "30 calculators & a unit converter"),
    ("pixelsmith", "Pixelsmith", "https://cinch2108.github.io/pixelsmith/", "Compress, resize & convert images"),
    ("mintkit",    "Mintkit",    "https://cinch2108.github.io/mintkit/",    "QR codes, barcodes & passwords"),
    ("tagloom",    "Tagloom",    "https://cinch2108.github.io/tagloom/",    "SEO tools: meta tags, sitemaps & schema"),
    ("postsmith",  "Postsmith",  "https://cinch2108.github.io/postsmith/",  "Social media tools: fancy text, counters & hashtags"),
    ("mediaforge", "Mediaforge", "https://cinch2108.github.io/mediaforge/", "Convert, compress & trim video and audio"),
    ("sheetwise",  "Sheetwise",  "https://cinch2108.github.io/datakit/",    "CSV & Excel tools: convert, clean & merge"),
    ("localforge", "LocalForge PDF", "https://cinch2108.github.io/",        "Merge, split, compress & sign PDFs"),
    ("keywren",    "Keywren",    "https://cinch2108.github.io/keywren/",    "Typing, keyboard, mic, webcam & screen tests"),
]
def team_html():
    items = ''.join(f'<li><a href="{u}" rel="noopener">{n}</a><span>{d.replace("&", "&amp;")}</span></li>' for k, n, u, d in TEAM if k != SELF)
    return f'<!--team--><nav class="more-tools" aria-label="More free tools"><h2>More free tools</h2><ul>{items}</ul></nav><!--/team-->'
def add_team(s):
    import re as _re
    if '<!--team-->' in s: return _re.sub(r'<!--team-->.*?<!--/team-->', lambda m: team_html(), s, flags=_re.S)
    if '<footer>' in s: return s.replace('<footer>', '<footer>' + team_html(), 1)
    return s.replace('</main>', '</main><footer>' + team_html() + '</footer>', 1)


BRAND = "Keywren"
T = open('template.html', encoding='utf-8').read()
PAGES = [
 dict(p='typing', blurb='WPM and accuracy in 15 s to 2 min', slug='', tab='Typing', name='Typing Speed Test',
  title='Typing Speed Test: Check Your WPM &amp; Accuracy Free | Keywren',
  desc='Free typing speed test with 15, 30, 60 and 120 second modes. Live error highlighting, WPM, raw speed and accuracy, plus a results history saved on your device.',
  h1='Typing speed test <span>with live error highlighting.</span>',
  lead='Find your real words per minute in 15 seconds to 2 minutes. Mistakes light up as you type, and every result is saved in your browser so you can watch yourself improve.',
  how=['Pick a test length: 15, 30, 60 or 120 seconds. Turn on punctuation or numbers for a harder test.',
       'Click the text box (or just start typing). The clock starts on your first keystroke.',
       'Type the words you see. Correct letters turn white, wrong ones turn red. Press Backspace to fix a mistake.',
       'When time runs out you see your WPM, raw WPM, accuracy and correct and wrong characters.',
       'Press Esc or Try again for a fresh text. Your results history and personal best are saved in this browser.'],
  faq=[('How is WPM calculated?','Keywren counts every correctly typed character, including spaces, divides by 5 (the standard length of a “word”) and then by the minutes taken. Raw WPM counts every character you typed, right or wrong, so the gap between the two shows how much mistakes cost you.'),
       ('What is a good typing speed?','Most people type 35–45 WPM. 60 WPM is fast and comfortable for office work, 80 WPM and above is very fast, and competitive typists reach 120 WPM or more. Accuracy above 95% matters more than raw speed.'),
       ('How is accuracy measured?','Accuracy is the share of your keystrokes that were correct when you made them. Fixing a mistake with Backspace still counts the original error, so accuracy shows how cleanly you type, not just the final text.'),
       ('Are my results uploaded anywhere?','No. The test runs entirely in your browser and your last 50 results are kept only in this browser’s local storage. Clear history removes them.')]),
 dict(p='keyboard', blurb='Light up every key, check ghosting and rollover', slug='keyboard-tester', tab='Keyboard', name='Keyboard Tester',
  title='Keyboard Tester: Test Every Key, Ghosting &amp; Rollover | Keywren',
  desc='Free online keyboard tester. A full-size on-screen keyboard lights up every key you press, shows key codes and event details, and checks ghosting and key rollover.',
  h1='Keyboard tester for <span>every key and combo.</span>',
  lead='Press each key and watch it light up on a full-size layout. See the exact key code and event data, and hold several keys at once to check for ghosting and rollover limits.',
  how=['Press any key. It turns bright while held and stays green once it has been tested.',
       'Work across the whole keyboard until “Keys tested” reaches the total, including F-keys, arrows and the numpad.',
       'Check the Last key event panel for event.key, event.code, keyCode, location (left, right or numpad) and modifiers.',
       'To test ghosting, hold several keys together (for example W, A, S, D and Space). Every key you hold should appear in the list.',
       '“Block browser shortcuts” stops keys like F5, Tab and Space from scrolling or reloading the page. Untick it to use Tab normally.'],
  faq=[('What is keyboard ghosting?','Ghosting is when a keyboard can’t detect a key because of the other keys you are holding. Cheap keyboards share wiring between keys, so some combinations silently drop a key press. Hold your common game or shortcut combos here to see if any key goes missing.'),
       ('What does N-key rollover (NKRO) mean?','Rollover is how many keys a keyboard can register at the same time. 6-key rollover is common on USB keyboards; NKRO keyboards register every key. The “Most keys at once” box shows the most simultaneous keys Keywren saw.'),
       ('Why don’t some keys work in the tester?','Some keys are handled by your operating system before the browser sees them, such as the Windows key on some systems, Fn, media keys and Print Screen (which may only send a key-up). Laptops also combine keys with Fn in hardware.'),
       ('What is the difference between event.key and event.code?','event.code is the physical key position (for example KeyQ), which stays the same in every language layout. event.key is the character it produces, such as “q”, “Q” or “a” on an AZERTY keyboard.')]),
 dict(p='mic', blurb='Level meter, waveform and playback', slug='mic-test', tab='Mic', name='Mic Test',
  title='Mic Test: Check Your Microphone Online (Level &amp; Playback) | Keywren',
  desc='Test your microphone online with a live level meter, waveform, device picker and a short recording you can play back. Audio never leaves your device.',
  h1='Mic test with a live <span>level meter and playback.</span>',
  lead='See instantly whether your microphone works, how loud it is and how you actually sound. Pick between microphones, record a short clip and play it back. The audio never leaves this tab.',
  how=['Press Start mic test and allow microphone access when your browser asks.',
       'Speak normally. The meter and waveform should move; aim for “Good level”, around −30 to −12 dB on speech.',
       'If nothing moves, choose a different microphone in the device list. Headsets and webcams each show up as their own microphone.',
       'Pick a length and press Record, then play the clip back to hear echo, noise or distortion.',
       'Press Stop when you are done. The mic also turns off by itself when you switch tabs or leave the page.'],
  faq=[('Why does my browser say the microphone is blocked?','You (or a setting) denied permission earlier. Click the lock or camera icon in the address bar, set Microphone to Allow for this site and press Start mic test again. On macOS, also check System Settings → Privacy & Security → Microphone.'),
       ('Is my voice recorded or uploaded?','No. The level meter and waveform are computed in your browser with the Web Audio API, and recordings are stored in memory in this tab only. Nothing is sent to a server, and the recording is deleted when you leave the page.'),
       ('What is a good microphone level?','For speech, peaks around −12 dB and an average around −20 to −30 dB are ideal. If the meter shows “Clipping” your voice will distort, so move back or lower the input gain. “Quiet” means people may struggle to hear you.'),
       ('Why is echo cancellation turned off?','Keywren asks for the raw microphone signal so you hear what the mic really picks up. Video call apps usually turn on echo cancellation, noise suppression and auto gain, so you may sound slightly different in a call.')]),
 dict(p='webcam', blurb='Real resolution, FPS and snapshots', slug='webcam-test', tab='Webcam', name='Webcam Test',
  title='Webcam Test: Check Your Camera, Resolution &amp; FPS Online | Keywren',
  desc='Test your webcam online. Pick a camera, see the real resolution and measured frame rate, mirror the image and save a snapshot. Video never leaves your device.',
  h1='Webcam test with <span>real resolution and FPS.</span>',
  lead='Check that your camera works before a call. See the resolution it really delivers, measure its frame rate, switch between cameras and save a snapshot. Video stays on your device.',
  how=['Press Start webcam test and allow camera access when your browser asks.',
       'Choose a resolution to request (720p by default). The readout shows what the camera actually delivers.',
       'Watch Measured FPS for a few seconds. Low light often makes webcams drop to 15 FPS or less.',
       'Use the device list to switch between cameras, and untick Mirror to see the image the way others see it.',
       'Press Take snapshot to save a full-resolution PNG. Press Stop when done; the camera also turns off when you switch tabs.'],
  faq=[('Why is my webcam not working?','Check that no other app (Zoom, Teams, the Camera app) is using it, that your browser has camera permission for this site, and on laptops that there is no privacy shutter or camera key turned off. Then press Start again or pick another camera from the list.'),
       ('Why is the resolution lower than my camera’s spec?','The browser picks the closest mode the camera offers. Many webcams only reach their top resolution at a lower frame rate, or deliver 1080p only over USB 3. Try a different resolution, a different USB port, or better lighting.'),
       ('Why is my frame rate low?','In dim light, webcams lengthen the exposure, which lowers the frame rate. Busy USB hubs and power saving can also reduce it. Add light in front of you and check Measured FPS again.'),
       ('Are snapshots or video uploaded?','No. The video is shown directly from your camera inside this page, and snapshots are created in your browser. Nothing is sent anywhere; you choose whether to download a snapshot.')]),
 dict(p='screen', blurb='Find dead and stuck pixels in fullscreen', slug='dead-pixel-test', tab='Screen', name='Dead Pixel Test',
  title='Dead Pixel Test: Fullscreen Colours, Gradients &amp; Uniformity | Keywren',
  desc='Free dead pixel and screen test. Fullscreen solid colours, gradients, uniformity and pixel-grid tests with keyboard navigation to find dead or stuck pixels and bleed.',
  h1='Dead pixel and screen test <span>in fullscreen.</span>',
  lead='Find dead pixels, stuck pixels, backlight bleed and colour banding on any monitor, laptop, TV or phone. Thirteen fullscreen tests, switched with the arrow keys.',
  how=['Clean the screen first so dust is not mistaken for a dead pixel.',
       'Press Start fullscreen test (or F). The first screen is solid black.',
       'Use the → and ← arrow keys, Space, or a click to step through black, white, red, green, blue and the other tests.',
       'On each colour, scan the whole screen slowly, including the corners. Press H to hide the label so it doesn’t cover anything.',
       'Press Esc to exit. Use the dark grey and gradient tests in a dark room to check for glow, bleed and banding.'],
  faq=[('What is the difference between a dead and a stuck pixel?','A dead pixel stays black on every colour, which shows up best on the white screen. A stuck pixel stays one colour (often red, green or blue) and shows up best on black or a contrasting colour. Stuck pixels can sometimes be fixed; dead pixels usually can’t.'),
       ('How many dead pixels are acceptable?','It depends on the maker’s pixel policy. Many manufacturers only replace a monitor with several dead or bright pixels, and some promise zero bright pixels. Check your warranty and test as soon as you buy a screen so you can return it in time.'),
       ('What is backlight bleed?','Light from the backlight leaking around the edges of an LCD panel, visible as bright patches on a dark screen. Use the black and dark grey tests in a dim room. A little glow on IPS panels at an angle is normal.'),
       ('Does this test work on phones and TVs?','Yes. Open the page in your phone or smart TV browser and use fullscreen. On touch screens tap to go to the next colour. Some phone browsers don’t allow fullscreen; the test then fills the browser window instead.')]),
 dict(p='mouse', blurb='CPS click speed, buttons, scroll and double-clicks', slug='mouse-test', tab='Mouse', name='Mouse Test',
  title='Mouse Test: CPS Click Speed, Buttons, Scroll &amp; Double-Click | Keywren',
  desc='Free mouse test: a clicks-per-second (CPS) test with 1, 5, 10 and 30 second modes, plus a button, scroll wheel and double-click tester that spots chattering switches.',
  h1='Mouse test and <span>CPS click speed test.</span>',
  lead='Measure how fast you can click, then check every mouse button, the scroll wheel and side buttons. Keywren also flags suspiciously fast double clicks, a sign of a worn switch.',
  how=['Choose a CPS test length: 1, 5, 10 or 30 seconds.',
       'Click inside the big box as fast as you can. The timer starts on your first click and your clicks per second appear when it ends.',
       'Your best score for each length is saved in your browser. Click again to retry.',
       'In the tester below, press each button inside the box, including middle, back and forward. Scroll up and down to test the wheel.',
       'Single-click slowly a few times. If “Suspected chatter” goes up, your mouse may be registering double clicks on its own.'],
  faq=[('What is a good CPS score?','Most people click 6–7 times per second. 8–10 CPS is fast, and advanced techniques like jitter clicking or butterfly clicking can reach 12–20 CPS. Short tests give higher numbers than 30-second tests because your hand tires.'),
       ('How do I know if my mouse double clicks by itself?','Click once, slowly, many times in the tester. A healthy switch registers one press per click. If Keywren sees two presses of the same button less than 80 ms apart, it counts it as suspected chatter, which usually means the switch is wearing out.'),
       ('Why don’t my side buttons work?','Back and forward buttons are buttons 4 and 5. Some mice need their own software to send them, and some are remapped to keyboard shortcuts. If the tester shows nothing, check your mouse software or try another USB port.'),
       ('Will clicking here navigate away or open menus?','No. Inside the test boxes, right-click menus, middle-click scrolling and back/forward navigation are blocked so you can test every button safely.')]),
 dict(p='refresh', blurb='Measure your monitor’s real Hz', slug='refresh-rate-test', tab='Refresh rate', name='Refresh Rate Test',
  title='Refresh Rate Test: Check Your Monitor Hz &amp; Frame Times | Keywren',
  desc='Measure your monitor’s real refresh rate in Hz, see a live frame-time graph with dropped frames, and compare motion at full, half and quarter frame rate.',
  h1='Refresh rate test: <span>see your real Hz.</span>',
  lead='Check whether your 120 Hz, 144 Hz or 240 Hz screen is really running at that speed. Keywren measures frame times in your browser, graphs every frame and shows the difference in motion.',
  how=['Open this page on the screen you want to test and keep the tab in front. Wait a few seconds for the number to settle.',
       'Read the measured Hz and the likely refresh rate under it. It should match your monitor’s setting.',
       'Watch the frame-time graph: an even line is smooth, and red bars are dropped frames.',
       'Compare the moving lanes. The top lane updates every frame; the lower lanes show half and quarter frame rate.',
       'If the number is too low, check your display settings, cable and graphics driver, then press Measure again.'],
  faq=[('Why does the test show 60 Hz on my 144 Hz monitor?','Usually the monitor is set to 60 Hz in your operating system (Windows: Settings → Display → Advanced display; macOS: Displays → Refresh Rate), the cable or port can’t carry the higher rate, or the browser is limiting frame rate in battery-saver mode.'),
       ('How accurate is a browser refresh rate test?','Browsers draw once per screen refresh, so timing many frames gives an accurate average, usually within a fraction of a Hz. Busy computers can drop frames, so close heavy apps for the cleanest result. Variable refresh (G-Sync, FreeSync) may show a range.'),
       ('What are dropped frames?','A dropped frame is a refresh where the browser could not draw in time, so a frame took two or more refresh intervals. A few are normal; many in a row cause stutter. Switching tabs pauses the test because hidden tabs don’t draw.'),
       ('What does the motion test show?','All lanes move at the same speed, but the lower lanes only update every second or fourth frame. On a high refresh screen the top lane looks clearly smoother, which is the benefit you get from a higher refresh rate.')]),
]
def rel(d, p): return ('../' * d) + p
def href(d, q): return rel(d, q['slug'] + '/' if q['slug'] else '') or './'
def page_url(p): return f"{DOMAIN}/{p['slug'] + '/' if p['slug'] else ''}"
strip = lambda s: re.sub(r'<[^>]+>', '', s).replace('&amp;', '&')

assert T.count('data-ad-slot=') == 4
assert all(f'<!--view:{p["p"]}-->' in T for p in PAGES)
for p in PAGES:
    d = 1 if p['slug'] else 0
    s = T
    s = re.sub(r'<title>.*?</title>', f"<title>{p['title']}</title>", s, flags=re.S)
    s = re.sub(r'<meta name="description" content="[^"]*">', f'<meta name="description" content="{p["desc"]}">', s)
    s = re.sub(r'<link rel="canonical" href="[^"]*">', f'<link rel="canonical" href="{page_url(p)}">', s)
    s = re.sub(r'<meta property="og:url" content="[^"]*">', f'<meta property="og:url" content="{page_url(p)}">', s)
    s = re.sub(r'<meta property="og:title" content="[^"]*">', f'<meta property="og:title" content="{p["title"]}">', s)
    s = re.sub(r'<meta property="og:description" content="[^"]*">', f'<meta property="og:description" content="{p["desc"]}">', s)
    s = re.sub(r'<meta name="twitter:title" content="[^"]*">', f'<meta name="twitter:title" content="{p["title"]}">', s)
    s = re.sub(r'<meta name="twitter:description" content="[^"]*">', f'<meta name="twitter:description" content="{p["desc"]}">', s)
    s = s.replace('"url":"https://cinch2108.github.io/keywren/"', f'"url":"{page_url(p)}"', 1)
    s = s.replace('<body>', f'<body data-page="{p["p"]}"' + ('' if p['slug'] else ' data-home="1"') + '>', 1)
    s = re.sub(r'<h1>.*?</h1>', f"<h1>{p['h1']}</h1>", s, count=1, flags=re.S)
    s = re.sub(r'(<section class="hero">.*?)<p>.*?</p>', lambda m: m.group(1) + f"<p>{p['lead']}</p>", s, count=1, flags=re.S)
    s = s.replace('<div class="logo"><i></i>Keywren</div>', f'<a class="logo" href="{href(d, PAGES[0])}" aria-label="{BRAND} home"><i></i>{BRAND}</a>', 1)
    tabs = ''.join(f'<a class="tab{" active" if q is p else ""}" href="{href(d, q)}"{" aria-current=" + chr(34) + "page" + chr(34) if q is p else ""}>{q["tab"]}</a>' for q in PAGES)
    s = re.sub(r'<nav class="tabs" id="tabs" aria-label="Tools">.*?</nav>', f'<nav class="tabs" id="tabs" aria-label="Tools">{tabs}</nav>', s, flags=re.S)
    # keep only this page's tool
    for q in PAGES:
        if q is p:
            s = s.replace(f'<!--view:{q["p"]}-->\n', '').replace(f'<!--/view:{q["p"]}-->\n', '')
        else:
            s = re.sub(rf'<!--view:{q["p"]}-->.*?<!--/view:{q["p"]}-->\n', '', s, flags=re.S)
    s = s.replace('class="view"', 'class="view active"')
    for a in ['styles.css', 'app.js', 'privacy.html', 'terms.html']:
        s = s.replace(f'"{a}"', f'"{rel(d, a)}"')
    others = ''.join(f'<a href="{href(d, q)}">{q["name"]}<span>{q["blurb"]}</span></a>' for q in PAGES if q is not p)
    art = f'''<article class="seo">
<h2>How to use the {p["name"].replace("Test", "test").replace("Tester", "tester")}</h2>
<ol>{''.join(f"<li>{x}</li>" for x in p["how"])}</ol>
<h2>Frequently asked questions</h2>
{''.join(f"<details><summary>{q}</summary><p>{a}</p></details>" for q, a in p["faq"])}
<h2>More free device tests</h2>
<div class="toollinks">{others}</div>
</article>'''
    s = s.replace('<!-- AD SLOT: footer 728x90 -->', art + '\n<!-- AD SLOT: footer 728x90 -->', 1)
    faq = {"@context": "https://schema.org", "@type": "FAQPage", "mainEntity": [{"@type": "Question", "name": strip(q), "acceptedAnswer": {"@type": "Answer", "text": strip(a)}} for q, a in p["faq"]]}
    crumbs = {"@context": "https://schema.org", "@type": "BreadcrumbList", "itemListElement": [{"@type": "ListItem", "position": 1, "name": BRAND, "item": DOMAIN + "/"}] + ([{"@type": "ListItem", "position": 2, "name": p["name"], "item": page_url(p)}] if p['slug'] else [])}
    ld = lambda o: json.dumps(o, ensure_ascii=False).replace('</', '<\\/')
    s = s.replace('</head>', f'<script type="application/ld+json">{ld(faq)}</script>\n<script type="application/ld+json">{ld(crumbs)}</script>\n</head>', 1)
    assert '<!--view:' not in s and s.count('class="view active"') == 1, p['p']
    out = (p['slug'] + '/index.html') if p['slug'] else 'index.html'
    os.makedirs(os.path.dirname(out) or '.', exist_ok=True)
    s = add_team(s)
    open(out, 'w', encoding='utf-8').write(s)

open('sitemap.xml', 'w').write('<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'
    + ''.join(f'  <url><loc>{page_url(p)}</loc><lastmod>2026-10-25</lastmod></url>\n' for p in PAGES)
    + f'  <url><loc>{DOMAIN}/privacy.html</loc></url>\n  <url><loc>{DOMAIN}/terms.html</loc></url>\n</urlset>\n')
print('built', len(PAGES), 'pages')

# team footer on the static pages
for _f in ['privacy.html', 'terms.html', '404.html']:
    if os.path.exists(_f):
        _s = open(_f, encoding='utf-8').read()
        open(_f, 'w', encoding='utf-8').write(add_team(_s))
