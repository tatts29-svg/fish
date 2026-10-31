#!/usr/bin/env python3
"""v7.07 - the day's documents as real PDF files, one per load (see pdf707_src.js). Every tile on the plate is a
drop-down: Pre-start, Drivers (all loads, or one load), Install (the same) and Email (the PDFs attached through the
phone's share sheet). The sheets are laid out and fitted by the v7.00 code, photographed with html-to-image and set on
A4 pages with jsPDF, at the paper's own margins; the QR codes are drawn over their pictures as vector squares.
The two libraries are embedded in <script type="text/plain"> blocks and run on first use.
Build on the live page (kit716/GC500_v7.16: v7.16 no pre-bill + v7.17 quantities + v7.06 + v7.08 + v7.09 + v7.03 + v7.11 + weather + one line per truck + v7.02 Change deliveries; the Edit tile is put back on the plate).   python3 patch_v707.py <page.html> [pdf707_src.js] [pdf707.css] [lib dir]"""
import hashlib, os, re, sys
HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
from patch_v669 import rep  # noqa: E402

JS_START = "/* v7.06 - THE DAY'S DOCUMENTS, SMALLER, UNDER THE CAR, AND PRINTED FROM A PREVIEW."
JS_END = "function dpWireDay(pane){"
CSS_START = "/* v7.06 - the day's documents: one slim Coates plate under the banner"
CSS_END = "@media print{.dplate{display:none !important}}\n"
LIB_DIR = '/tmp/claude-0/stage13/lib'
LIBS = [('pdf7-h2i', 'html-to-image-1.11.13/package/dist/html-to-image.js', 'html-to-image 1.11.13 (MIT)'),
        ('pdf7-jspdf', 'jspdf-4.2.1/package/dist/jspdf.umd.min.js', 'jsPDF 4.2.1 (MIT)')]


def swap(t, a, b, new, what, keep_end):
    if t.count(a) != 1: sys.exit('%s start: %d' % (what, t.count(a)))
    i = t.index(a); j = t.find(b, i)
    if j < 0: sys.exit('%s end not found' % what)
    if not keep_end: j += len(b)
    return t[:i] + new + t[j:]


def lib_blocks(d):
    out = []
    for sid, rel, name in LIBS:
        src = open(os.path.join(d, rel), encoding='utf-8').read()
        if re.search(r'</script', src, re.I): sys.exit('%s holds a closing script tag' % rel)
        if 'Andrew Fisher' in src: sys.exit('%s holds the name the attribution scrub rewrites' % rel)
        out.append('<script type="text/plain" id="%s" data-lib="%s" data-sha256="%s">%s</script>\n'
                   % (sid, name, hashlib.sha256(src.encode('utf-8')).hexdigest(), src))
    return ''.join(out)


def patch(path, jsf, cssf, libd, need=True):
    t = open(path, encoding='utf-8').read(); bom = t.startswith('﻿'); t = t.lstrip('﻿'); n0 = len(t)
    if 'function pdf7Open(' in t: sys.exit('v7.07 already applied')
    if 'function dpZoomFit(' not in t: sys.exit('apply v7.06 first')
    js = open(jsf, encoding='utf-8').read().rstrip() + '\n'
    css = open(cssf, encoding='utf-8').read().rstrip() + '\n'
    bad = re.findall(r" \.[A-Za-z_]", js)
    if bad: sys.exit('the source holds a space before a dot, which the attribution scrub folds: %r' % bad[:5])
    if 'Andrew Fisher' in js: sys.exit('the source holds the name the attribution scrub rewrites')
    # 1. the plate and the PDF maker in place of v7.06's plate; the panel's style in place of the plate's
    t = swap(t, JS_START, JS_END, js, 'js', True)
    t = swap(t, CSS_START, CSS_END, css, 'css', False)
    # 1b. v7.02's Edit tile goes back on the rebuilt plate, after Email (its CSS, keyed on .dpt-edit, stays where it is)
    if 'function dpEditTile(' in t:
        i = t.find('function dpPlate(days, sel){'); j = t.find('\n}', i); ms = list(re.finditer(r'</section>`;', t[i:j]))
        if len(ms) != 1: sys.exit('plate edit tile: expected one </section>` in dpPlate, found %d' % len(ms))
        k = i + ms[0].start(); t = t[:k] + '${dpEditTile(d)}' + t[k:]
    # 2. dpPrint: a PDF run lays the sheets out off screen and hands them over instead of printing
    t = rep(t, "  document.body.classList.add('printing-day');\n  const done = () => { st.remove(); wrap.classList.remove('dpwrap'); document.body.classList.remove('printing-day'); };\n  if (link) DPBAR.done = done; else window.addEventListener('afterprint', done, {once: true});",
            "  const pdf = o && typeof o.pdf === 'function' ? o.pdf : null;   /* v7.07 - laid out for the PDF maker, off screen */\n"
            "  document.body.classList.add(pdf ? 'pdf7-make' : 'printing-day');\n"
            "  const done = () => { st.remove(); wrap.classList.remove('dpwrap'); document.body.classList.remove('printing-day', 'pdf7-make'); };\n"
            "  if (pdf) {} else if (link) DPBAR.done = done; else window.addEventListener('afterprint', done, {once: true});",
            'dp mode', path, need)
    t = rep(t, "const finish = r => { if (settled) return; settled = true; window.__dpLast = r; if (link) linkReady(r);",
            "const finish = r => { if (settled) return; settled = true; window.__dpLast = r; if (pdf) { pdf(r, wrap, done); return; } if (link) linkReady(r);",
            'dp finish', path, need)
    t = rep(t, "setTimeout(() => { if (!settled) { settled = true; if (link) { linkReady({timeout: true, failed: 0, over: []}); return; }",
            "setTimeout(() => { if (!settled) { settled = true; if (pdf) { pdf({timeout: true, failed: 0, over: []}, wrap, done); return; } if (link) { linkReady({timeout: true, failed: 0, over: []}); return; }",
            'dp timeout', path, need)
    # 2b. the navigate code in a table of several references: dpNavQrT (see pdf707_src.js)
    t = rep(t, "const rowsHtml = g.rows.map(r => { const a = r.a, m = masterLoc(a.key) || {}, w = whereText(a), link = (a.drawing_links || [])[0], P = posOf(a), W = dpPosWords(P), q = dpNavQr(P);",
            "const rowsHtml = g.rows.map(r => { const a = r.a, m = masterLoc(a.key) || {}, w = whereText(a), link = (a.drawing_links || [])[0], P = posOf(a), W = dpPosWords(P), q = dpNavQrT(P);   /* v7.07 */",
            'table qr', path, need)
    # 2c. the photo grid: where no layout reaches a useful size, the same size with more pictures beats one wide strip
    t = rep(t, "const s = Math.min(cw / 1.25, ch), score = (s >= 36 * MM ? 1000 + k * 20 : 0) + s / MM;",
            "const s = Math.min(cw / 1.25, ch), score = (s >= 36 * MM ? 1000 + k * 20 : 0) + s / MM + k * 0.25;   /* v7.07 - a tie goes to more pictures */",
            'grid tie', path, need)
    # 3. ps7Print: the same for the pre-start
    t = rep(t, " document.body.classList.add('printing-day');\n const done = () => { st.remove(); wrap.classList.remove('ps7wrap'); document.body.classList.remove('printing-day'); };\n if (o && o.keep) DPBAR.done = done;",
            " if (o && typeof o.pdf === 'function') {   /* v7.07 - laid out for the PDF maker, off screen */\n"
            "  document.body.classList.add('pdf7-make');\n"
            "  const fin = () => { st.remove(); wrap.classList.remove('ps7wrap'); document.body.classList.remove('pdf7-make'); };\n"
            "  (document.fonts && document.fonts.ready ? document.fonts.ready.catch(() => null) : Promise.resolve()).then(() => o.pdf({}, wrap, fin));\n"
            "  return;\n }\n"
            " document.body.classList.add('printing-day');\n const done = () => { st.remove(); wrap.classList.remove('ps7wrap'); document.body.classList.remove('printing-day'); };\n if (o && o.keep) DPBAR.done = done;",
            'ps7 mode', path, need)
    # 4. the two libraries, as text, at the end of the page
    if t.count('</body></html>') < 1 or not t.rstrip().endswith('</body></html>'): sys.exit('page end not found')
    k = t.rstrip().rfind('</body></html>')
    t = t[:k] + lib_blocks(libd) + t[k:]
    open(path, 'w', encoding='utf-8').write(('﻿' if bom else '') + t)
    print('ok', os.path.basename(path), n0, '->', len(t))


if __name__ == '__main__':
    p = sys.argv[1]
    patch(p, sys.argv[2] if len(sys.argv) > 2 else os.path.join(HERE, 'pdf707_src.js'),
          sys.argv[3] if len(sys.argv) > 3 else os.path.join(HERE, 'pdf707.css'),
          sys.argv[4] if len(sys.argv) > 4 else LIB_DIR, True)
