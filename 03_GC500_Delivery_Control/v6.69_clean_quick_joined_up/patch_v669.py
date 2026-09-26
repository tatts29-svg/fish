#!/usr/bin/env python3
"""v6.69 - CLEAN, QUICK AND JOINED UP (Andrew, 26 Sep 2026: "check all pages... everything adds up... no stalling, no lags,
no errors... maps all work as they should... smooth, no delay with opening or searching or zooming in").

  1. Ten lookups the page's packing had broken: a space inside a selector had been squeezed out, so "a marker inside the
     map" read as "the map that is itself a marker" and found nothing. Show on map could not find its callout, the
     drawer's moved-line and notice links did nothing, the tile figures were never fitted, the showcase circuit trace
     never measured, the read-only chip never reached a pane. Put back.
  2. The amber board on Today drew seven thousand blurred circles every time it paged (0.8 s, every 6 s). Now two stamps.
  3. The register rows' traffic light was a 92-piece drawing per row (21,000 elements on Plant). The row edition now
     draws the same housing from shared parts - 21 pieces a row, identical to look at.
  4. A page worked the day's figures out two or three times over in one draw (dsnState, rentalOf). Once per draw now.

  python3 patch_v669.py <page.html> [builder.py]
"""
import os, re, sys

def rep(text, old, new, what, path, need=True):
    pat = '\n'.join('[ \t]*' + r'\s+'.join(re.escape(tok) for tok in l.split()) if l.split() else '[ \t]*' for l in old.split('\n'))
    ms = list(re.finditer(pat, text))
    if len(ms) != 1:
        if need: sys.exit(f'{what} in {os.path.basename(path)}: expected once, found {len(ms)}: {old[:90]!r}')
        print(f'  skip {what} in {os.path.basename(path)} ({len(ms)})'); return text
    m = ms[0]; return text[:m.start()] + new + text[m.end():]

SELECTORS = [("'#pane-map.mk:not(.gpsmk)'", "'#pane-map .mk:not(.gpsmk)'"), ("'#pane-map.mk'", "'#pane-map .mk'"),
    ("'#drawer.movedline [data-k]'", "'#drawer .movedline [data-k]'"), ("'#drawer.notice [data-k]'", "'#drawer .notice [data-k]'"),
    ("'#showPlate.gc3dgeo'", "'#showPlate .gc3dgeo'"), ("'.card,.dsn.grp,.mcard,.hubcard,.clocard,.dcard'", "'.card,.dsn .grp,.mcard,.hubcard,.clocard,.dcard'"),
    ("'.island.hubgo[data-go]'", "'.island .hubgo[data-go]'"), ("'.pane.on.kpi.v'", "'.pane.on .kpi .v'"),
    ("'.shcircuit.edge'", "'.shcircuit .edge'"), ("'main.pane'", "'main .pane'")]

LED_OLD = """for (let yy = 0; yy < ROWS; yy++) for (let xx = 0; xx < COLS; xx++) {
 const lit = on[yy * COLS + xx];
 const cx = xx * PITCH + PITCH / 2, cy = yy * PITCH + PITCH / 2;
 if (lit) { g.shadowColor = 'rgba(255,150,20,.55)'; g.shadowBlur = PITCH * 0.33; g.fillStyle = '#ffb020'; }
 else { g.shadowBlur = 0; g.fillStyle = 'rgba(90,70,50,.20)'; }
 g.beginPath(); g.arc(cx, cy, r, 0, 6.2832); g.fill();
 }
 g.shadowBlur = 0;"""
LED_NEW = """/* v6.69 - THE SAME LAMPS FROM TWO STAMPS. Seven thousand circles each with its own blur took 0.8 s and froze the page
    every time the board paged. The dark lamps are one repeating tile laid in a single fill; each lit lamp is one copy
    of a lamp drawn once with its halo. Same pitch, same colours, same glow - a few milliseconds. */
 const tile = document.createElement('canvas'); tile.width = tile.height = PITCH;
 { const k = tile.getContext('2d'); k.fillStyle = 'rgba(90,70,50,.20)'; k.beginPath(); k.arc(PITCH / 2, PITCH / 2, r, 0, 6.2832); k.fill(); }
 g.fillStyle = g.createPattern(tile, 'repeat'); g.fillRect(0, 0, COLS * PITCH, ROWS * PITCH);
 const lamp = document.createElement('canvas'); lamp.width = lamp.height = PITCH * 2;
 { const k = lamp.getContext('2d'); k.shadowColor = 'rgba(255,150,20,.55)'; k.shadowBlur = PITCH * 0.33; k.fillStyle = '#ffb020';
   k.beginPath(); k.arc(PITCH, PITCH, r, 0, 6.2832); k.fill(); }
 for (let yy = 0; yy < ROWS; yy++) for (let xx = 0; xx < COLS; xx++) if (on[yy * COLS + xx]) g.drawImage(lamp, xx * PITCH - PITCH / 2, yy * PITCH - PITCH / 2);"""

# the row edition of the traffic light: the fixed parts of the housing and lenses drawn once in the defs, used by every row
C = {'r': '#ff3b2f', 'a': '#ffb300', 'g': '#2ee56f'}; CX = {'r': 30, 'a': 78, 'g': 126}
OCT = 'M6 0H150L156 6V54L150 60H6L0 54V6Z'
def bolt(x, y): return (f'<g transform="translate({x} {y})"><circle r="2.6" fill="url(#hzBolt)"/><circle r="2.6" fill="none" stroke="#000" stroke-opacity=".55" stroke-width=".6"/>'
                        '<polygon points="1.15,0.575,1 -.575,1 -1.15,0 -.575,-1.575,-1" fill="#0a0a0b" fill-opacity=".85"/></g>')
HOUSE = ('<g id="hzHouse">' f'<path d="{OCT}" fill="url(#hzBody)"/><path d="{OCT}" fill="url(#hzSheen)"/>'
    '<path d="M9.2 4.4H146.8L151.6 9.2V50.8L146.8 55.6H9.2L4.4 50.8V9.2Z" fill="url(#hzPanel)" stroke="#000" stroke-opacity=".5" stroke-width=".8"/>'
    '<path d="M4.4 50.8V9.2L9.2 4.4H146.8" fill="none" stroke="#000" stroke-opacity=".55" stroke-width="1"/>'
    '<path d="M151.6 9.2V50.8L146.8 55.6H9.2" fill="none" stroke="#fff" stroke-opacity=".07" stroke-width="1"/>'
    f'<path d="{OCT}" fill="none" stroke="#000" stroke-opacity=".8" stroke-width="1"/>'
    '<path d="M1 53.6V6.4L6.4 1H149.6" fill="none" stroke="#fff" stroke-opacity=".18" stroke-width="1"/>'
    + bolt(5.6, 5.6) + bolt(150.4, 5.6) + bolt(5.6, 54.4) + bolt(150.4, 54.4)
    + ''.join(f'<g transform="translate({CX[c]} 30)"><circle r="22.4" fill="url(#hzBezel)"/><circle r="20.3" fill="url(#hzBezelIn)"/>'
              '<circle r="19.2" fill="#050506"/><circle r="18" fill="url(#hzWell)"/></g>' for c in 'rag') + '</g>')
OVER = ('<g id="hzOver">' + ''.join(f'<g transform="translate({CX[c]} 30)"><path d="M-15.6 -9A18 18 0 0 1 -3 -17.7" fill="none" stroke="#fff" stroke-opacity=".28" stroke-width="1" stroke-linecap="round"/>'
        '<ellipse cx="-6" cy="-8.5" rx="9.5" ry="5.8" fill="url(#hzGlass)"/><circle r="18" fill="none" stroke="#000" stroke-opacity=".65" stroke-width="1"/></g>' for c in 'rag') + '</g>')
LAMPS = ''.join(f'<g id="hzLamp{c.upper()}"><circle r="29" fill="{C[c]}" opacity=".5" filter="url(#hzBloom)"/>'
    f'<circle r="20.6" fill="none" stroke="{C[c]}" stroke-width="3.2" opacity=".55" filter="url(#hzHalo)"/><circle r="18" fill="url(#hzCore{c.upper()})"/>'
    f'<circle r="18" fill="url(#hzDotsOn{c.upper()})"/><circle r="7" fill="#fff" opacity=".34" filter="url(#hzHot)"/></g>' for c in 'rag')
DEFS = '\n  <!-- v6.69 - the row edition of the instrument: the fixed parts drawn once here, used by every register row -->\n  ' + HOUSE + '\n  ' + OVER + '\n  ' + LAMPS + '\n'

LITE_FN = """/* v6.69 - THE ROW EDITION. A register row's light was the full 92-piece drawing, 219 times over - 21,000 elements, most
   of the Plant page's weight and most of its wait. The housing, the bezels and the glass never change, so they are drawn
   once in the defs and used; what a row keeps as its own is what the state and the press targets touch: each lens's
   dark matrix, its lamp, its shade and a ring for the keyboard. Same drawing, same lamps, 21 pieces. */
function lampSvgLite(w, h){
 const lens = c => `<g class="lens ${c}" transform="translate(${LAMP_CX[c]} 30)"><circle class="bz" r="22.4" fill="none"/><circle class="dots off" r="18" fill="url(#hzDotsOff${c.toUpperCase()})"/><g class="lamp"><use href="#hzLamp${c.toUpperCase()}"/></g><circle class="shade" r="18" fill="url(#hzShade)"/></g>`;
 return `<svg class="hz lite" viewBox="0 0 156 60" width="${w}" height="${h}" aria-hidden="true" focusable="false"><use href="#hzHouse"/>${lens('r')}${lens('a')}${lens('g')}<use href="#hzOver"/></svg>`;
}
"""
MEMO = """/* v6.69 - WORKED OUT ONCE PER DRAW. The day's figures (dsnState) and a key's rental lines (rentalOf) were worked out two
   and three times over in a single draw - Where we are built the whole day three times to open. Inside a draw the
   record cannot change, so the first answer is kept until the draw ends; outside one nothing is kept. */
const HELD_MEMO = new Map();
function heldMemo(k, f){ if (!ASSETS_HELD) return f(); if (HELD_MEMO.has(k)) return HELD_MEMO.get(k); const v = f(); HELD_MEMO.set(k, v); return v; }
"""

def patch(path, need):
    t = open(path, encoding='utf-8').read(); bom = t.startswith('﻿'); t = t.lstrip('﻿'); n0 = len(t)
    if need:
        for a, b in SELECTORS:
            if t.count(a) < 1: sys.exit(f'selector {a} not in page')
            t = t.replace(a, b)
    t = rep(t, LED_OLD, LED_NEW, 'led stamps', path, need)
    t = rep(t, "const LAMP_SIZE = {sm: [78, 30], md: [106, 41], lg: [158, 61], xl: [234, 90]};",
            "const LAMP_SIZE = {sm: [78, 30], md: [106, 41], lg: [158, 61], xl: [234, 90]};\n" + LITE_FN, 'lite fn', path, need)
    t = rep(t, ">${lensBtns(key, d, !!o.labels, lampSvg(state, w, h))}${words}</span>`;",
            ">${lensBtns(key, d, !!o.labels, o.size === 'sm' ? lampSvgLite(w, h) : lampSvg(state, w, h))}${words}</span>`;", 'lite ctl', path, need)
    t = rep(t, ">${lampSvg(state, w, h)}${words}</span>`;", ">${o.size === 'sm' ? lampSvgLite(w, h) : lampSvg(state, w, h)}${words}</span>`;", 'lite img', path, need)
    if t.count('</defs></svg>') == 1 and 'id="hzHouse"' not in t:
        t = t.replace('</defs></svg>', DEFS + '</defs></svg>', 1)
    elif need: sys.exit('defs anchor')
    t = rep(t, "@media print{ .skipwork{display:none} }", "@media print{ .skipwork{display:none} .dstat .hz.lite > use{display:none !important} }", 'print lite', path, need)
    t = rep(t, "let ASSETS_HELD = null;", MEMO.replace('const HELD_MEMO', 'let ASSETS_HELD = null;\nconst HELD_MEMO', 1), 'memo', path, need)
    t = rep(t, """if (ASSETS_HELD) return fn();
 ASSETS_HELD = buildAllAssets();
 try { return fn(); } finally { ASSETS_HELD = null; }""", """if (ASSETS_HELD) return fn();
 ASSETS_HELD = buildAllAssets(); HELD_MEMO.clear();
 try { return fn(); } finally { ASSETS_HELD = null; HELD_MEMO.clear(); }""", 'hold clears', path, need)
    t = rep(t, "function rentalOf(key){", "function rentalOf(key){ return heldMemo('rental|' + key, () => rentalOf_(key)); }\nfunction rentalOf_(key){", 'rental memo', path, need)
    t = rep(t, "function dsnState(asOf){", "function dsnState(asOf){ return heldMemo('dsn|' + asOf, () => dsnState_(asOf)); }\nfunction dsnState_(asOf){", 'dsn memo', path, need)
    open(path, 'w', encoding='utf-8').write(('﻿' if bom else '') + t); print('ok', os.path.basename(path), n0, '->', len(t))

if __name__ == '__main__':
    patch(sys.argv[1], True)
    if len(sys.argv) > 2: patch(sys.argv[2], False)
