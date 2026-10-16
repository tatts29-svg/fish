"""Author: Andrew Fisher. v10.43 - the person's name only, everywhere the page shows, copies or exports who did something
(Andrew: no mention on any tab that an entry was done through an assistant).

v10.30 strips " via Codex" / " via Claude" from everything the page escapes for display. 52 record entries are worded
"Andrew Fisher (via Claude)" - in brackets - which slipped through (WC41 and WC43 drawers showed "Marked by Andrew
Fisher (via Claude)"). The cleaner now takes both forms. The same cleaner now also runs on every CSV download (one
download path, fin745Download) and on every copy-to-clipboard, which do not go through the display escape.
The record is not changed: it keeps exactly what was written. Footer v10.42 -> v10.43. No record changes.

    python3 patch_v1043.py path/to/page.html   (on the live v10.42 page)
"""
import sys
from pathlib import Path

HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE.parent / 'toolchain'))
from rep import rep

MARK = '/* v10.43 - names-1043 */'
OLD_CLEAN = "function noAgent1030(s){ return s.indexOf(' via ') < 0 ? s : s.replace(/ via (?:Codex|Claude)(?: \\([^)]*\\))?/g, ''); }"
NEW_CLEAN = ("function noAgent1030(s){ " + MARK + " return !/via (?:Codex|Claude)/i.test(s) ? s : s.replace(/ ?\\(via (?:Codex|Claude)[^)]*\\)/gi, '')"
             ".replace(/ via (?:Codex|Claude)(?: \\([^)]*\\))?/gi, ''); }")
WRAP = r'''function servicing748Total(){ const s = servicing748(); return s ? s.total : 0; }
/* v10.43 - names-1043: exports and copies carry the person's name only, like the screen. */
(function(W){ const clean = t => (typeof t === 'string' && typeof noAgent1030 === 'function') ? noAgent1030(t) : t;
 const wrapDownload = () => { if (typeof W.fin745Download !== 'function' || W.fin745Download.names1043) return; const o = W.fin745Download;
  const f = function(name, text, type){ return o.call(this, name, clean(text), type); }; f.names1043 = true; W.fin745Download = f; try { fin745Download = f; } catch (e) {} };
 const wrapClip = () => { try { const c = W.navigator && W.navigator.clipboard; if (!c || !c.writeText || c.writeText.names1043) return; const o = c.writeText.bind(c);
  const f = t => o(clean(t)); f.names1043 = true; c.writeText = f; } catch (e) {} };
 wrapDownload(); wrapClip(); W.addEventListener('DOMContentLoaded', () => { wrapDownload(); wrapClip(); }); W.addEventListener('load', () => { wrapDownload(); wrapClip(); }); })(window);'''

REPLACEMENTS = [
    ('the cleaner takes the bracketed form', OLD_CLEAN, NEW_CLEAN),
    ('exports and copies cleaned', "function servicing748Total(){ const s = servicing748(); return s ? s.total : 0; }", WRAP),
    ('Release footer', "+ ' · v10.42'", "+ ' · v10.43'"),
]


def main():
    a = sys.argv[1:]
    if not a: sys.exit(__doc__)
    page = Path(a[0]); html = page.read_text(encoding='utf-8')
    if MARK in html: sys.exit('patch_v1043 refuses a repeat')
    if "+ ' · v10.42'" not in html: sys.exit('patch_v1043: not the v10.42 line - wrong base')
    for what, old, new in REPLACEMENTS: html = rep(html, old, new, what, str(page))
    page.write_text(html, encoding='utf-8')
    print('patch_v1043 applied: the person only - bracketed "(via ...)" cleaned, CSV downloads and copies cleaned; footer v10.42 -> v10.43')


if __name__ == '__main__':
    main()
