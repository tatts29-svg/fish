"""Author: Andrew Fisher. v12.04 (claimed as v12.01) - Build cards: the stamp inked like a real stamp with CLOSED off, a late
delivery named for what it was, and the card tidied so it no longer reads crowded.

Andrew, 25 Oct 2026 (this chat): "Remove the closed and have stamp here like its been stamped with a stamp", "Theres is a lot
saying item late. I want to know what was late", "Do we need ti make cards a little wider", then of the Build cards on his
monitor: "Looks over crowded how can we fix", and to the mock-up: "build it".
  cards1201.css: a closed Build or Demob day card loses its CLOSED label (TODAY and UPCOMING stay); its stamp, the same artwork,
  sits centred in the taller gap beside the date as solid ink: no glow, no screen blend, no pulse; a fine speckle and a little
  uneven pressure; each card struck at its own angle. The tidy-up: 440 px cards on a computer screen (1280 px and wider; phones
  unchanged); the chart key on one line without the counts; What went in without the boxes; the staff names on one line; a
  slimmer life-saving-rule strip; a smaller Coates on time ring.
  cards1197 (the v11.99 card wrapper): on a day with the delivery-window chart, the day's deliveries figure moves into the
  chart's heading ("1/2 REFERENCES IN · 4 COATES TEXTS") and its own row comes off, so the figure shows once; the card still
  reads it out. A day of pickups keeps its row.
  ontime1057 (the on-time list on the card and in More info): a delivery whose Coates booking text names no reference is called
  by the text's own words ("Knuckle Boom 61ft (18.6M) - Diesel") instead of "Item", and so is a reference with no register
  description; a bracket the text was cut off inside is left off; the kind "Item" is no longer printed beside a name; on the
  card a late time ("1 h 21 min late") never splits across two lines. Every figure, window and time is unchanged.
  Footer -> v12.04. No record, rate, servicing, crew card, QR code or server change.

    python3 patch_v1204.py page.html      (in place, on the live v12.03 page named by BASE)
"""
import hashlib, sys
from pathlib import Path
HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE.parent / 'toolchain'))
from rep import rep
BASE = '682fcc85862c2ba91c2d201b4406901d8d881f4d9e64bdc8e3ef30d00c1c0e69'
ANCHOR = '<script id="steady1143-script">'
FOOT_OLD, FOOT_NEW = "+' · v12.03'; /* v8.19 release922", "+' · v12.04'; /* v8.19 release922"
WHAT = "const what = (u, r) => r && r.src === 'site' && r.site && r.site.ref ? named(r.site.ref, u.k).trim() : u.r && u.r.length === 1 ? named(u.r[0], u.k).trim() : u.r && u.r.length ? 'one of ' + u.r.map(x => named(x, u.k).trim()).join(' or ') : u.k;"
WHAT_NEW = "const what = (u, r) => r && r.src === 'site' && r.site && r.site.ref ? named(r.site.ref, itm1201(u)).trim() : u.r && u.r.length === 1 ? named(u.r[0], itm1201(u)).trim() : u.r && u.r.length ? 'one of ' + u.r.map(x => named(x, itm1201(u)).trim()).join(' or ') : said1201(u);"
HELPERS = (" /* v12.04 - a booking text that names no reference is called by its own words, not \"Item\" (Andrew, 25 Oct 2026: \"Theres is\n"
           "    a lot saying item late. I want to know what was late\"); a bracket the text was cut off inside is left off */\n"
           " const said1201 = u => { const t = String(u && u.i || '').replace(/\\s*\\([^)]*$/, '').replace(/\\s+-\\s+/g, ' – ').replace(/\\s+/g, ' ').trim(); return t || (u && u.k) || ''; };\n"
           " const kind1201 = u => u && u.k && u.k !== 'Item' ? ' · ' + u.k : '';\n"
           " const lbl1201 = u => u && u.r && u.r.length ? u.k : said1201(u);\n"
           " const itm1201 = u => u && u.k === 'Item' ? said1201(u) : (u && u.k) || '';\n ")
EDITS = [
    ("if (seen.length) M.unpaired.push({refs, seen, k: g[0].k});", "if (seen.length) M.unpaired.push({refs, seen, k: itm1201(g[0])});", 'site record, not paired: named'),
    ("const u = r.u, bits = ['<b>' + e(what(u, r)) + '</b>', e(u.k), e('window ' + win(u.w))];",
     "const u = r.u, bits = ['<b>' + e(what(u, r)) + '</b>'].concat(u.k && u.k !== 'Item' ? [e(u.k)] : [], [e('window ' + win(u.w))]);", 'More info line: no "Item"'),
    ("if (bad.length === 1) { const r = bad[0]; return head + ' · ' + r.u.k + (r.failed || r.laterDay ? '' : ' ' + dur(r.lateBy)); }",
     "if (bad.length === 1) { const r = bad[0]; return head + ' · ' + lbl1201(r.u) + (r.failed || r.laterDay ? '' : ' ' + dur(r.lateBy)); }", 'short why: the one late delivery named'),
    ("' Booked for this day before then: ' + e(M.units.map(u => u.k + ' · ' + who(u) + ' · ' + win(u.w)).join('; '))",
     "' Booked for this day before then: ' + e(M.units.map(u => lbl1201(u) + ' · ' + who(u) + ' · ' + win(u.w)).join('; '))", 'booked before the texts: named'),
    ("e(what(u)) + '</b> · ' + e(u.k + ' · window ' + win(u.w)", "e(what(u)) + '</b>' + e(kind1201(u) + ' · window ' + win(u.w)", 'aside list: no "Item"'),
    ("e(M.ontime.map(r => what(r.u, r) + ' · ' + r.u.k + ' · window ' + win(r.u.w)", "e(M.ontime.map(r => what(r.u, r) + kind1201(r.u) + ' · window ' + win(r.u.w)", 'on time list: no "Item"'),
    ("return what(u) + ' · ' + u.k + ' · window ' + win(u.w)", "return what(u) + kind1201(u) + ' · window ' + win(u.w)", 'site list: no "Item"'),
    ("show.map(r => '<span class=\"ot1059-late\"><b>' + e(name(r)) + '</b> · ' + e(by(r)) + '</span>')",
     "show.map(r => '<span class=\"ot1059-late\"><b>' + e(name(r)) + '</b> · <span class=\"ot1201-by\">' + e(by(r)) + '</span></span>')", 'card list: a time never splits'),
    ("e(M.nob.map(({u}) => u.k + ' · ' + who(u) + ' · Coates text ' + (u.t || u.f)).join('; '))",
     "e(M.nob.map(({u}) => lbl1201(u) + ' · ' + who(u) + ' · Coates text ' + (u.t || u.f)).join('; '))", 'no booking text list: named'),
]
# the v11.99 card wrapper: the day's deliveries figure told once, in the delivery-window chart's heading
WRAP = " function wrapCards(){\n  const B = W.BuildCards984; if (!B || typeof B.html !== 'function' || B.html.__bw1197) return;"
PACK = (" /* v12.04 - one deliveries block (Andrew, 25 Oct 2026, of the Build cards: \"Looks over crowded how can we fix\"): on a day\n"
        "    with the delivery-window chart, the day's deliveries figure moves into the chart's heading (\"1/2 REFERENCES IN · 4 COATES\n"
        "    TEXTS\") and its own row comes off; the figure is the same one, and the card still reads it out. A day of pickups keeps its row. */\n"
        " const LOAD1204 = /<span class=\"bc984-load-row\"><span class=\"bc984-label\">DAY[’']S (?:DELIVERIES|LOADS)<span class=\"bc984-at-close\">([^<]*)<\\/span><\\/span><span class=\"bc984-load-count(?: long)?\">([^<]*)<\\/span><\\/span>/;\n"
        " const HEAD1204 = /(<span class=\"bw1197-head\"><span class=\"bc984-label\">[^<]*<span class=\"bc984-at-close\">)(\\d+) COATES BOOKING TEXT(S?)<\\/span>/;\n"
        " function pack1204(h){\n"
        "  const m = LOAD1204.exec(h); if (!m || !HEAD1204.test(h)) return h;\n"
        "  const basis = m[1], v = m[2].replace(/\\s+/g, ' ').trim(), unit = /LOADS/.test(basis) ? ' LOADS' : /REFERENCES/.test(basis) ? ' REFERENCES' : '';\n"
        "  const got = /^(\\d+) \\/ (\\d+)$/.exec(v), plan = /^(\\d+) planned$/.exec(v);\n"
        "  const said = got && unit && /RECEIVED/.test(basis) ? got[1] + '/' + got[2] + unit + ' IN' : plan && unit ? plan[1] + unit + ' PLANNED' : v.toUpperCase();\n"
        "  return h.replace(m[0], '').replace(HEAD1204, (x, a, n, s) => a + said + ' · ' + n + ' COATES TEXT' + s + '</span>');\n"
        " }\n")
INSERTED = "    h = h.slice(0, i) + row.html + h.slice(i);\n    h = h.replace(/(<span class=\"bc984-load-row ot1056 ot1057 ot1056-(good|mid|bad)\"[^>]*>"
INSERTED_NEW = "    h = h.slice(0, i) + row.html + h.slice(i);\n    h = pack1204(h);\n    h = h.replace(/(<span class=\"bc984-load-row ot1056 ot1057 ot1056-(good|mid|bad)\"[^>]*>"
EXPORT = "W.cards1197 = Object.freeze(Object.assign({version: 'v11.99', bandHtml, cardRow}, core));"
EXPORT_NEW = "W.cards1197 = Object.freeze(Object.assign({version: 'v11.99', bandHtml, cardRow, pack1204}, core));"


def inside(html, tag, edits):
    k = html.index('<script id="%s">' % tag); e = html.index('</script>', k)
    for old, new, what in edits:
        if html.count(old) != 1: raise ValueError('%s: %r must be there exactly once' % (what, old[:70]))
        if not k < html.index(old) < e: raise ValueError('%s: not inside %s' % (what, tag))


def patch(html):
    if 'cards1201-style' in html or 'const said1201' in html or 'function pack1204' in html: raise ValueError('v12.04 already applied')
    if hashlib.sha256(html.encode('utf-8')).hexdigest() != BASE: raise ValueError('Wrong live base for v12.04 (expected v12.03 682fcc85...)')
    if 'cards1197-script' not in html: raise ValueError('v11.99 Build cards are not on this page')
    inside(html, 'ontime1057-script', EDITS + [(WHAT, '', 'what')])
    CARDS = [(WRAP, '', 'card wrapper'), (INSERTED, '', 'the chart row put in'), (EXPORT, '', 'cards1197 export')]
    inside(html, 'cards1197-script', CARDS)
    for once in (ANCHOR, FOOT_OLD):
        if html.count(once) != 1: raise ValueError('%r must be there exactly once' % once[:60])
    css = (HERE / 'cards1201.css').read_text(encoding='utf-8')
    if '</style' in css.lower(): raise ValueError('source would close its own tag')
    html = rep(html, WHAT, HELPERS + WHAT_NEW, 'on time: naming helpers and what()', 'page')
    for old, new, what in EDITS: html = rep(html, old, new, 'on time: ' + what, 'page')
    html = rep(html, WRAP, PACK + WRAP, 'cards: one deliveries block', 'page')
    html = rep(html, INSERTED, INSERTED_NEW, 'cards: packed after the chart row goes in', 'page')
    html = rep(html, EXPORT, EXPORT_NEW, 'cards: pack1204 exported for the checks', 'page')
    html = rep(html, ANCHOR, '<style id="cards1201-style">\n' + css + '</style>\n' + ANCHOR, 'Build cards: the stamp and the tidy-up', 'page')
    return rep(html, FOOT_OLD, FOOT_NEW, 'footer', 'page')


if __name__ == '__main__':
    p = Path(sys.argv[1])
    p.write_text(patch(p.read_text(encoding='utf-8')), encoding='utf-8')
    print('v12.04 Build cards applied')
