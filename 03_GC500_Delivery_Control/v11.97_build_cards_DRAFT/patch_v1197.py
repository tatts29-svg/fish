"""Author: Andrew Fisher. v11.97 - Build cards: delivery windows and the recorded weather.

Andrew, 25 Oct 2026 (this chat): "Lets push our limits and do improvement with the build cards. Also we shouldc have a delivery
window can we mention this Delivery booked betweem this time and this time".
  cards1197_src.js + cards1197.css: every load with a Coates booking text says "Delivery booked between HH:MM and HH:MM" (and
  any re-booked window), from the booking texts already on the page (ontime1057, texts to 22 Oct 2026 04:57); every Build day
  card gets a row with the day's booked windows on a time line and when each was done (the on-time model's own figures).
  history1197.json: the Build card weather for 10-22 Oct 2026 from the Bureau of Meteorology's Gold Coast Seaway daily
  observations (IDCJDW4050.202610), converted by weather1197.py on v9.84's rules after it reproduced all 33 archived rows;
  added to the v9.84 archive (BuildHistory984) under its own source entry. Nothing estimated.
  Footer -> v11.97. No record, rate, servicing, crew card, QR code or server change.

    python3 patch_v1197.py page.html      (in place, on the live v11.95 page named by BASE)
"""
import hashlib, json, sys
from pathlib import Path
HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE.parent / 'toolchain'))
from rep import rep
BASE = '5868677a6bb4a59b4a9ffb6c8b2014a5be0b07661dfafeec74f8e149d1e3000b'
ANCHOR = '<script id="steady1143-script">'
ARCHIVE_NOTE = 'Reviewed historical station observations; no forecast substitution or record writes.'
ARCHIVE_AT = 'const ARCHIVE = '
FOOT_OLD, FOOT_NEW = "+' · v11.95'; /* v8.19 release922", "+' · v11.97'; /* v8.19 release922"


def weather(html):
    """add 10-22 Oct to the v9.84 archive: same rules, its own source entry, the archived rows untouched"""
    if html.count(ARCHIVE_NOTE) != 1: raise ValueError('the weather archive must be there exactly once')
    a = html.index(ARCHIVE_AT, html.index(ARCHIVE_NOTE)) + len(ARCHIVE_AT)
    archive, n = json.JSONDecoder().raw_decode(html[a:])
    if json.dumps(archive, indent=2, ensure_ascii=False) != html[a:a + n]: raise ValueError('the archive text does not round-trip')
    ext = json.loads((HERE / 'history1197.json').read_text(encoding='utf-8'))
    if archive['coverage'] != {'from': '2026-09-07', 'through': '2026-10-09'}: raise ValueError('archive coverage moved: %r' % archive['coverage'])
    if ext['source_id'] in archive['sources']: raise ValueError('source %s already in the archive' % ext['source_id'])
    clash = sorted(set(ext['days']) & set(archive['days']))
    if clash: raise ValueError('days already in the archive: %s' % clash)
    for iso, row in ext['days'].items():
        if row.get('source_id') != ext['source_id'] or row.get('date') != iso or row.get('src') != 'bom-history': raise ValueError('bad row %s' % iso)
    archive['coverage'] = {'from': archive['coverage']['from'], 'through': ext['coverage']['through']}
    archive['sources'][ext['source_id']] = ext['source']
    archive['days'].update(ext['days'])
    return html[:a] + json.dumps(archive, indent=2, ensure_ascii=False) + html[a + n:]


def patch(html):
    if 'cards1197-script' in html: raise ValueError('v11.97 already applied')
    if hashlib.sha256(html.encode('utf-8')).hexdigest() != BASE: raise ValueError('Wrong live base for v11.97 (expected v11.95 5868677a...)')
    for need in ('ontime1057-script', 'loadcards991-script', 'function timeline846Line(d, g, n, open, timed) {', 'function ldLine(d, g, n, open, timed){ return timeline846Line(d, g, n, open, timed); }',
                 "W.ontime1057 = {version: 'v10.59', what, model, siteOf, cardRow, moreHtml, toDate, units: U, exportAt: T.export_at};",
                 '</span><span class="ld-x" aria-hidden="true"></span></button>', '<span class="bc984-crew"><span class="bc984-crew-head">',
                 "'<span class=\"bc984-load-row ot1056 ot1057 ot1056-' + tone", 'window.BuildHistory984=Object.freeze({get,status,dates:()=>dates', ANCHOR, FOOT_OLD):
        if need not in html: raise ValueError('the page has no %r' % need[:70])
    for once in (ANCHOR, FOOT_OLD, 'function timeline846Line(d, g, n, open, timed) {'):
        if html.count(once) != 1: raise ValueError('%r must be there exactly once' % once[:60])
    if html.index('id="ontime1057-script"') > html.index(ANCHOR): raise ValueError('the on-time script must load before the anchor')
    src = (HERE / 'cards1197_src.js').read_text(encoding='utf-8')
    css = (HERE / 'cards1197.css').read_text(encoding='utf-8')
    if '</script' in src.lower() or '</style' in css.lower(): raise ValueError('source would close its own tag')
    html = weather(html)
    block = '<style id="cards1197-style">\n' + css + '</style>\n<script id="cards1197-script">\n' + src + '\n</script>\n' + ANCHOR
    html = rep(html, ANCHOR, block, 'Build cards: delivery windows', 'page')
    return rep(html, FOOT_OLD, FOOT_NEW, 'footer', 'page')


if __name__ == '__main__':
    p = Path(sys.argv[1])
    p.write_text(patch(p.read_text(encoding='utf-8')), encoding='utf-8')
    print('v11.97 Build cards applied')
