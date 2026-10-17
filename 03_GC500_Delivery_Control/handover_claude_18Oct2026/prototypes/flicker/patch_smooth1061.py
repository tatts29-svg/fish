"""Author: Andrew Fisher. v10.61 (prototype, flicker part) - the page opens and changes tab without anything jumping.

Prototype only, built in the scratchpad from the live v10.60.1 page. Nothing here changes a figure, a record, a price,
a quantity, a date or any text: it changes WHEN things are drawn and what the page shows while it is busy.

  A  the first paint already has the header's finished shape: the Tools button that the script moves into the tab row
     is not drawn in the brand row first, the clock, countdown and footer lines that the script fills keep their line
     from the start, and the NO TWIN-STEER banner is in the page itself instead of being pushed in at DOMContentLoaded.
     All of the shape rules stop applying (html.hdr1061) the moment the script has laid the header out.
  B  the five hosted fonts are declared and preloaded in the head, so the header text is not drawn in a stand-in font
     and swapped about four seconds later; the hosted-media script does not declare them a second time.
  C  the first tab bar marks the tab the address will open (Today for a plain link), not Map explorer.
  D  a pressed tab reads as chosen at once and keeps moving (a compositor-only bar) while its page is drawn, so a
     2-11 s draw on a phone no longer looks like a tap that did nothing. CSS only, on the existing v5.93 .busy class.
     (Dimming the old pane was tried and dropped: it promoted the 15,000 px pane to a layer and blanked the header.)
  E  the 12 s "Saved copy - current record not confirmed" and "Shared record not reached" fallbacks count time the page
     spent waiting, not time its own script kept the phone busy; a real failure still shows them at once.
  F  the first-time milestone check that runs the moment Today is revealed (ms1026 unseenNow) reads the areas inside
     one asset hold, as every draw does, instead of rebuilding the whole asset list for every reference it looks up:
     the same answer, without the 5-6 s freeze between the page appearing and the celebration.

    python3 patch_smooth1061.py live_page.html out_page.html
"""
import os, re, sys

def rep(text, old, new, what, need=True):
    pat = '\n'.join('[ \t]*' + r'\s+'.join(re.escape(tok) for tok in l.split()) if l.split() else '[ \t]*' for l in old.split('\n'))
    ms = list(re.finditer(pat, text))
    if len(ms) != 1:
        if need: sys.exit(f'{what}: expected once, found {len(ms)}: {old[:90]!r}')
        print(f'  skip {what} ({len(ms)})'); return text
    m = ms[0]; return text[:m.start()] + new + text[m.end():]

PARTS = set((os.environ.get('PARTS') or 'ABCDEF').upper())

def font_files(t):
    m = re.search(r'"hostedMedia":\{"schema":"gc500-media-v1","manifest":"[0-9a-f]+","fonts":(\[[^\]]*\])', t)
    if not m: sys.exit('hostedMedia fonts not found')
    import json
    fonts = json.loads(m.group(1)); out = []
    for f in fonts:
        mm = re.search('"' + f['key'] + r'":\{"bytes":\d+,"file":"([0-9a-f]{64}\.woff2)"', t)
        if not mm: sys.exit('font file not found for ' + f['key'])
        out.append([f['family'], f['style'], f['weight'], mm.group(1)])
    return out

def banner_css(t):
    """the banner's own rules, copied verbatim out of twinsteer1053-style (its first four strings, up to the drawer
    note's rule) so the head has them before the banner paints; print keeps hiding it"""
    i = t.find("st.id = 'twinsteer1053-style';"); j = t.find("'.ts1053-drawer{", i)
    parts = re.findall(r"'((?:[^'\\]|\\.)*)'", t[t.find('st.textContent', i):j])
    css = ''.join(parts)
    if not css.startswith('#ts1053-banner{') or '@media (max-width:640px){#ts1053-banner{' not in css: sys.exit('banner css not found')
    return css + '\n@media print{#ts1053-banner{display:none!important}}'

def build(t):
    if 'smooth1061-early' in t: sys.exit('refuses a repeat')
    if 'shapes1060-script' not in t: sys.exit('needs the v10.60 page')
    head = []
    css = []
    if 'A' in PARTS:
        css.append('''/* A - until the page's script has laid the header out (html.hdr1061), the first paint keeps its finished shape */
html:not(.hdr1061) .brandrow > .tools{display:none}
html:not(.hdr1061) #tpodDate:empty::before,html:not(.hdr1061) #hzcdT:empty::before,html:not(.hdr1061) #hzcdSub:empty::before,
html:not(.hdr1061) #footL:empty::before,html:not(.hdr1061) #footR:empty::before{content:"\\00a0"}
html.cd1061:not(.hdr1061) .hzpod .num small.cdt:empty{display:inline}
@media(max-width:640px){html.cd1061:not(.hdr1061) .hzpod .num small.cdt:empty{display:block}}''')
        css.append(banner_css(t))
    if 'D' in PARTS:
        css.append('''/* D - a pressed tab is answered on the same frame and keeps moving while its page is drawn (transform/opacity only,
   so the compositor animates it even while the page's script holds the phone) */
nav.tabs button.busy{color:#fff;box-shadow:0 0 0 1px #ffb16b,0 0 13px 2px #ff873b60!important}
nav.tabs button.busy::after{content:'';position:absolute;left:12%;right:12%;bottom:-2.5px;height:2.5px;border-radius:2px;background:#ff6a13;box-shadow:0 0 12px 2px rgba(255,106,19,.55);transform-origin:50% 50%;animation:busy1061 .8s ease-in-out infinite alternate}
nav.tabs:has(button.busy) button[aria-selected="true"]:not(.busy)::after{opacity:.2}
@keyframes busy1061{from{transform:scaleX(.2);opacity:.55}to{transform:scaleX(1);opacity:1}}
@media (prefers-reduced-motion:reduce){nav.tabs button.busy::after{animation:none}}''')
    if css:
        head.append('<style id="smooth1061-early">\n' + '\n'.join(css) + '\n</style>')
    js = []
    if 'A' in PARTS:
        race = re.search(r'"race_days":\["(\d{4}-\d{2}-\d{2})"', t).group(1)
        js.append("/* A - the countdown line is there until race day (hzCountdownTick empties it from then on) */\nif(Date.now()<Date.parse('" + race + "T00:00:00+10:00'))document.documentElement.classList.add('cd1061');\n/* A - safety: if the page's script ever stops before it marks the header laid out, the shape rules still end at DOMContentLoaded */\ndocument.addEventListener('DOMContentLoaded',function(){document.documentElement.classList.add('hdr1061');});")
    if 'B' in PARTS:
        files = font_files(t)
        js.append('''/* B - the hosted fonts, declared and fetched before the first paint (same files, same rules as hostedMedia) */
(function(){var m=location.pathname.match(/^\\/(?:v|e)\\/([^/]+)\\/?$/);if(!m)return;var b='/m/'+m[1]+'/',F=''' + str(files).replace("'", '"') + ''',css='';
F.forEach(function(f){css+='@font-face{font-family:'+JSON.stringify(f[0])+';font-style:'+f[1]+';font-weight:'+f[2]+';font-display:swap;src:url('+JSON.stringify(b+f[3])+') format("woff2")}\\n';
var l=document.createElement('link');l.rel='preload';l.as='font';l.type='font/woff2';l.crossOrigin='anonymous';l.href=b+f[3];document.head.appendChild(l);});
var s=document.createElement('style');s.id='fonts1061';s.textContent=css;document.head.appendChild(s);})();''')
    if 'E' in PARTS:
        js.append('''/* E - a wait that counts waiting: a tick the page's own script held up counts as about one second, not the whole hold */
window.patient1061=function(ms,fn){var h={t:0,acc:0,last:performance.now(),off:false};function step(){if(h.off)return;var now=performance.now(),d=now-h.last;h.last=now;h.acc+=document.hidden?d:Math.min(d,1100);if(h.acc>=ms){h.off=true;fn();}else h.t=setTimeout(step,1000);}
h.t=setTimeout(step,1000);h.stop=function(){h.off=true;clearTimeout(h.t);};return h;};
window.patientStop1061=function(h){if(h&&h.stop)h.stop();else clearTimeout(h);};''')
    if js:
        head.append('<script id="smooth1061-head">/* Author: Andrew Fisher. v10.61 - smooth opening. */\n' + '\n'.join(js) + '\n</script>')
    t = rep(t, '<meta name="gc500-weather-v818"', '\n'.join(head) + '\n<meta name="gc500-weather-v818"', 'head early style/script')
    if 'A' in PARTS:
        t = rep(t, '<nav class="tabs" id="tabs" aria-label="Views"></nav>',
                '<div id="ts1053-banner" role="note"><span class="ts1053-ic" aria-hidden="true">⛔</span><b>NO TWIN-STEER TRUCKS</b> · <span class="ts1053-nw">Week 3 to demob</span> · <span class="ts1053-nw">track, Esplanade,</span> <span class="ts1053-nw">Macintosh Island Park</span></div><nav class="tabs" id="tabs" aria-label="Views"></nav>',
                'static twin-steer banner')
        t = rep(t, "syncBoot();\nwindow.addEventListener('popstate', onPop);",
                "syncBoot();\ndocument.documentElement.classList.add('hdr1061'); /* v10.61: the header is laid out; the first-paint shape rules stop */\nwindow.addEventListener('popstate', onPop);",
                'header laid out marker')
    if 'B' in PARTS:
        t = rep(t, 'document.head.appendChild(font);', "if(!document.getElementById('fonts1061'))document.head.appendChild(font); /* v10.61: already declared in the head */", 'hostedMedia font guard')
    if 'C' in PARTS:
        t = rep(t, "renderTabs();\n/* A deep link uses the later inline map/progress extensions too.",
                "{ const t1061 = state.tab, h1061 = (location.hash || '').replace(/^#/, ''); if (!h1061 || TABS.some(([k]) => k === h1061)) state.tab = h1061 || 'today'; renderTabs(); state.tab = t1061; } /* v10.61: the first bar marks the tab the address opens */\n/* A deep link uses the later inline map/progress extensions too.",
                'first tab bar marks the routed tab')
    if 'E' in PARTS:
        t = rep(t, "timer = setTimeout(() => { if (!settled) { show('saved'); update(); } }, 12000);",
                "timer = patient1061(12000, () => { if (!settled) { show('saved'); update(); } });", 'saved-copy wait')
        t = rep(t, "settled = true; clearTimeout(timer); show('ready');", "settled = true; patientStop1061(timer); show('ready');", 'saved-copy wait stop')
        t = rep(t, "clearTimeout(SYNC.ftimer); clearTimeout(SYNC.utimer);", "clearTimeout(SYNC.ftimer); patientStop1061(SYNC.utimer);", 'unreachable wait stop (syncStop)')
        t = rep(t, "clearTimeout(SYNC.utimer);\n SYNC.utimer = setTimeout(() => { if (SYNC.status === 'connecting') { SYNC.status = 'unreachable'; syncFooter(); } }, 12000);",
                "patientStop1061(SYNC.utimer);\n SYNC.utimer = patient1061(12000, () => { if (SYNC.status === 'connecting') { SYNC.status = 'unreachable'; syncFooter(); } });", 'unreachable wait')
    if 'F' in PARTS:
        t = rep(t, "const s = MS1025.seen(); return MS1025.allFacts().filter(f => f.reached && s[f.id] !== (f.reachedAt || 'reached')).map(f => ({f})); }",
                "const s = MS1025.seen(); const all = typeof W.holdAssets === 'function' ? W.holdAssets(() => MS1025.allFacts()) : MS1025.allFacts(); /* v10.61: one asset build for the whole check */ return all.filter(f => f.reached && s[f.id] !== (f.reachedAt || 'reached')).map(f => ({f})); }",
                'milestone check inside one asset hold')
    return t

if __name__ == '__main__':
    src, dst = sys.argv[1], sys.argv[2]
    t = open(src, encoding='utf-8').read()
    t = build(t)
    open(dst, 'w', encoding='utf-8').write(t)
    print('wrote', dst, len(t), 'parts', ''.join(sorted(PARTS)))
