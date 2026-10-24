"""Author: Andrew Fisher. v12.01 - Build cards: the stamp inked like a real stamp with CLOSED off, and a late delivery named for
what it was.

Andrew, 25 Oct 2026 (this chat): "Remove the closed and have stamp here like its been stamped with a stamp" and "Theres is a
lot saying item late. I want to know what was late".
  cards1201.css: a closed Build or Demob day card loses its CLOSED label (TODAY and UPCOMING stay); its stamp, the same artwork,
  sits centred in the taller gap beside the date as solid ink: no glow, no screen blend, no pulse; a fine speckle and a little
  uneven pressure; each card struck at its own angle.
  ontime1057 (the on-time list on the card and in More info): a delivery whose Coates booking text names no reference is called
  by the text's own words ("Knuckle Boom 61ft (18.6M) - Diesel") instead of "Item", and so is a reference with no register
  description; a bracket the text was cut off inside is left off; the kind "Item" is no longer printed beside a name; on the card a late time ("1 h 21 min late") never splits
  across two lines. Every figure, window and time is unchanged.
  Footer -> v12.01. No record, rate, servicing, crew card, QR code or server change.

    python3 patch_v1201.py page.html      (in place, on the live v11.99 page named by BASE)
"""
import hashlib, sys
from pathlib import Path
HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE.parent / 'toolchain'))
from rep import rep
BASE = '2c653073230aa8533fd2121cf87f3459c6fbde66a0aac22df564dc55161e671e'
ANCHOR = '<script id="steady1143-script">'
FOOT_OLD, FOOT_NEW = "+' · v11.99'; /* v8.19 release922", "+' · v12.01'; /* v8.19 release922"
WHAT = "const what = (u, r) => r && r.src === 'site' && r.site && r.site.ref ? named(r.site.ref, u.k).trim() : u.r && u.r.length === 1 ? named(u.r[0], u.k).trim() : u.r && u.r.length ? 'one of ' + u.r.map(x => named(x, u.k).trim()).join(' or ') : u.k;"
WHAT_NEW = "const what = (u, r) => r && r.src === 'site' && r.site && r.site.ref ? named(r.site.ref, itm1201(u)).trim() : u.r && u.r.length === 1 ? named(u.r[0], itm1201(u)).trim() : u.r && u.r.length ? 'one of ' + u.r.map(x => named(x, itm1201(u)).trim()).join(' or ') : said1201(u);"
HELPERS = (" /* v12.01 - a booking text that names no reference is called by its own words, not \"Item\" (Andrew, 25 Oct 2026: \"Theres is\n"
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


def patch(html):
    if 'cards1201-style' in html or 'const said1201' in html: raise ValueError('v12.01 already applied')
    if hashlib.sha256(html.encode('utf-8')).hexdigest() != BASE: raise ValueError('Wrong live base for v12.01 (expected v11.99 2c653073...)')
    if 'cards1197-script' not in html: raise ValueError('v11.99 Build cards are not on this page')
    k = html.index('<script id="ontime1057-script">'); e = html.index('</script>', k)
    for old, new, what in EDITS + [(WHAT, '', 'what')]:
        if html.count(old) != 1: raise ValueError('%s: %r must be there exactly once' % (what, old[:70]))
        if not k < html.index(old) < e: raise ValueError('%s: not inside the on-time script' % what)
    for once in (ANCHOR, FOOT_OLD):
        if html.count(once) != 1: raise ValueError('%r must be there exactly once' % once[:60])
    css = (HERE / 'cards1201.css').read_text(encoding='utf-8')
    if '</style' in css.lower(): raise ValueError('source would close its own tag')
    html = rep(html, WHAT, HELPERS + WHAT_NEW, 'on time: naming helpers and what()', 'page')
    for old, new, what in EDITS: html = rep(html, old, new, 'on time: ' + what, 'page')
    html = rep(html, ANCHOR, '<style id="cards1201-style">\n' + css + '</style>\n' + ANCHOR, 'Build cards: the stamp', 'page')
    return rep(html, FOOT_OLD, FOOT_NEW, 'footer', 'page')


if __name__ == '__main__':
    p = Path(sys.argv[1])
    p.write_text(patch(p.read_text(encoding='utf-8')), encoding='utf-8')
    print('v12.01 Build cards applied')
