"""Author: Andrew Fisher. v10.44 - the person's name only, everywhere: a page-wide safety net (taken over from the other
agent's unfinished v10.43 fencing review, whose person-name half found name fields drawn by routines other than esc()).

v10.30/v10.43 clean " via Codex/Claude" and "(via Claude)" from everything that goes through esc(), CSV downloads and
copies. About a dozen views draw who-did-it fields through their own small escape routines (night-service run sheet
and print, transport evidence, area sign-off, pre-starts, and more), often inside closed sections, so the cleaner never
saw them. Instead of patching each call, one observer cleans any text or title that lands on the page with an agent
name in it, the moment it lands. It only touches text that contains "via Codex" or "via Claude", so everything else is
left exactly as drawn. recorderDisplay772 uses the full cleaner too. The record is not changed. Footer v10.43 -> v10.44.

    python3 patch_v1044.py path/to/page.html   (on the live v10.43 page)
"""
import sys
from pathlib import Path

HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE.parent / 'toolchain'))
from rep import rep

MARK = '/* v10.44 - names-everywhere-1044 */'
OLD_REC = "function recorderDisplay772(value){\n return esc(String(value == null ? '' : value).replace(/ via (?:Codex|Claude)(?: \\([^)]*\\))?$/, ''));\n}"
NEW_REC = "function recorderDisplay772(value){ " + MARK + "\n return esc(noAgent1030(String(value == null ? '' : value)));\n}"
ANCHOR = "/* v10.43 - names-1043: exports and copies carry the person's name only, like the screen. */"
NET = ANCHOR + r'''
/* v10.44 - names-everywhere-1044: whatever routine drew it, an agent name never stays on the page. */
(function(W){ const RX = /via (?:Codex|Claude)/i, D = W.document;
 const fix = t => (typeof noAgent1030 === 'function' ? noAgent1030(t) : t.replace(/ ?\(via (?:Codex|Claude)[^)]*\)/gi, '').replace(/ via (?:Codex|Claude)(?: \([^)]*\))?/gi, ''));
 const cleanText = n => { const v = n.nodeValue; if (v && RX.test(v)) { const c = fix(v); if (c !== v) n.nodeValue = c; } };
 const cleanEl = el => { if (!el || el.nodeType !== 1) return; const tag = el.tagName; if (tag === 'SCRIPT' || tag === 'STYLE' || tag === 'TEXTAREA') return;
  const t = el.textContent; if (t && RX.test(t)) { const w = D.createTreeWalker(el, NodeFilter.SHOW_TEXT, {acceptNode: n => { const p = n.parentNode && n.parentNode.tagName; return p === 'SCRIPT' || p === 'STYLE' || p === 'TEXTAREA' ? NodeFilter.FILTER_REJECT : NodeFilter.FILTER_ACCEPT; }}); let n; while ((n = w.nextNode())) cleanText(n); }
  if (el.hasAttribute && el.hasAttribute('title') && RX.test(el.getAttribute('title'))) el.setAttribute('title', fix(el.getAttribute('title')));
  if (el.querySelectorAll) el.querySelectorAll('[title]').forEach(x => { const v = x.getAttribute('title'); if (RX.test(v)) x.setAttribute('title', fix(v)); }); };
 const start = () => { if (!D.body || W.__names1044) return; W.__names1044 = true; cleanEl(D.body);
  new MutationObserver(ms => { for (const m of ms) { if (m.type === 'characterData') cleanText(m.target); else if (m.type === 'attributes') { if (m.target.nodeType === 1) { const v = m.target.getAttribute('title'); if (v && RX.test(v)) m.target.setAttribute('title', fix(v)); } }
   else m.addedNodes.forEach(n => n.nodeType === 3 ? cleanText(n) : cleanEl(n)); } }).observe(D.body, {childList: true, subtree: true, characterData: true, attributes: true, attributeFilter: ['title']}); };
 if (D.body) start(); D.addEventListener('DOMContentLoaded', start); })(window);'''

REPLACEMENTS = [
    ('recorderDisplay772 uses the full cleaner', OLD_REC, NEW_REC),
    ('page-wide safety net', ANCHOR, NET),
    ('Release footer', "+ ' · v10.43'", "+ ' · v10.44'"),
]


def main():
    a = sys.argv[1:]
    if not a: sys.exit(__doc__)
    page = Path(a[0]); html = page.read_text(encoding='utf-8')
    if MARK in html: sys.exit('patch_v1044 refuses a repeat')
    if "+ ' · v10.43'" not in html: sys.exit('patch_v1044: not the v10.43 line - wrong base')
    for what, old, new in REPLACEMENTS: html = rep(html, old, new, what, str(page))
    page.write_text(html, encoding='utf-8')
    print('patch_v1044 applied: agent names cleaned wherever they are drawn (page-wide observer), recorderDisplay772 full cleaner; footer v10.43 -> v10.44')


if __name__ == '__main__':
    main()
