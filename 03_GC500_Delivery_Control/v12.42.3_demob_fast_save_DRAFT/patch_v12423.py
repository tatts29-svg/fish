"""v12.42.3 - Demob saves quicker (Andrew, 27 Oct 2026, on site at the Coates GC500 demob: "Delay when saving in demob can we make
this quicker"; see README.md).

On the live v12.42.2 page:
  1. the cards' module (singles1238, as it went live from v12.42.2_demob_loads) is replaced by this folder's singles1238_src.js
     (made from it by make_src_from_v12422.py);
  2. the page's keep-your-place step (Persistence1010's capture(), run by bump() before every save) reads the scroll position only of
     the elements that have actually scrolled, noted by one passive scroll listener, instead of reading every element on the tab.
     What it keeps and what restore() puts back are the same: the tab, and every scrolled element inside it in page order, with the
     same keys. restore() also notes the elements it scrolls back itself. bump(), save(), persist() and the sync are not touched;
  3. the footer reads v12.42.3.
Nothing else on the page is touched. Author: Andrew Fisher.
"""
import hashlib, os, sys
from pathlib import Path
HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE.parent / 'toolchain'))
from rep import rep
BASE = 'c83f1a27a3995852437afe4890bf4dd43d253aecb3128baa52b12a61d9b704ba'
OLD_SRC = HERE.parent / 'v12.42.2_demob_loads_LIVE' / 'singles1238_src.js'
NEW_SRC = HERE / 'singles1238_src.js'
FOOT_OLD, FOOT_NEW = "+' · v12.42.2'; /* v8.19 release922", "+' · v12.42.3'; /* v8.19 release922"
sha = lambda s: hashlib.sha256(s.encode('utf-8')).hexdigest()

# 2. Persistence1010 (shared save path): the scrolled elements, noted as they scroll
KEEP_OLD = """function capture(scope,drafts){
 if(!scope)return null;"""
KEEP_NEW = """// v12.42.3 - Keep-your-place reads the scroll position of the elements that have actually scrolled, not of every element on the tab.
// Reading scrollTop inside a card drawn with content-visibility:auto makes the browser lay that card out first, so on the Demob tab
// (401 cards, about 34,000 elements) one save laid the page out about 440 times to find the one strip that had scrolled (16 s on a
// 4x-throttled phone, 4 s on a desktop), before anything was stored. Every scroll, by a finger or by the page, sends a scroll event
// that passes the document on its way to the element, so one passive listener notes each element that scrolls (and lets go of the
// ones no longer on the page). restore() notes the elements it scrolls back itself, for a second save in the same moment.
// capture() keeps the same list as before: the tab itself and every scrolled element inside it, in page order, with the same keys.
const scrolled=new Set();
function noteScrolled(el){if(!el||el.nodeType!==1||scrolled.has(el))return;for(const x of scrolled)if(!x.isConnected)scrolled.delete(x);scrolled.add(el);}
document.addEventListener('scroll',ev=>noteScrolled(ev.target),{capture:true,passive:true});
function scrollers(scope){
 const out=[scope];
 for(const el of scrolled){if(!el.isConnected)scrolled.delete(el);else if(el!==scope&&scope.contains(el))out.push(el);}
 return out.sort((a,b)=>a===b?0:(a.compareDocumentPosition(b)&Node.DOCUMENT_POSITION_FOLLOWING)?-1:1);
}
function capture(scope,drafts){
 if(!scope)return null;"""
SCAN_OLD = """ if(scope.getClientRects().length||getComputedStyle(scope).display==='contents')for(const el of [scope,...scope.querySelectorAll('*')])if(el.scrollTop||el.scrollLeft)held.scroll.push({el,key:key(el,scope),top:el.scrollTop,left:el.scrollLeft}); /* load1066 */"""
SCAN_NEW = """ if(scope.getClientRects().length||getComputedStyle(scope).display==='contents')for(const el of scrollers(scope))if(el.scrollTop||el.scrollLeft)held.scroll.push({el,key:key(el,scope),top:el.scrollTop,left:el.scrollLeft}); /* load1066; v12.42.3: the scrolled elements only */"""
BACK_OLD = """ for(const pos of held.scroll){const el=pos.el.isConnected?pos.el:pos.el===held.scope?scope:[...scope.querySelectorAll('*')].find(el=>key(el,scope)===pos.key);if(el){el.scrollTop=pos.top;el.scrollLeft=pos.left;}}"""
BACK_NEW = """ for(const pos of held.scroll){const el=pos.el.isConnected?pos.el:pos.el===held.scope?scope:[...scope.querySelectorAll('*')].find(el=>key(el,scope)===pos.key);if(el){el.scrollTop=pos.top;el.scrollLeft=pos.left;noteScrolled(el);}}"""


def patch(text, path='page'):
    if sha(text) != BASE: raise ValueError('Live base is not the verified v12.42.2; rebuild and retest')
    if 'function noteScrolled(el)' in text: raise ValueError('v12.42.3 is already on this page')
    old = OLD_SRC.read_text(encoding='utf-8').rstrip() + '\n'
    new = NEW_SRC.read_text(encoding='utf-8').rstrip() + '\n'
    if text.count(old) != 1: raise ValueError('the v12.42.2 cards module is not on the page exactly once')
    if "REL = 'v12.42.3'" not in new: raise ValueError('the new module does not carry v12.42.3')
    text = text.replace(old, new)
    for a, b, what in ((KEEP_OLD, KEEP_NEW, 'Persistence1010 capture: the scrolled elements'), (SCAN_OLD, SCAN_NEW, 'Persistence1010 capture: read only the scrolled'),
                       (BACK_OLD, BACK_NEW, 'Persistence1010 restore: note what it scrolls back')):
        if text.count(a) != 1: raise ValueError(what + ': not found once')
        text = rep(text, a, b, what, path)
    if text.count(FOOT_OLD) != 1: raise ValueError('release footer v12.42.2 not found once')
    return text.replace(FOOT_OLD, FOOT_NEW)


if __name__ == '__main__':
    p = Path(sys.argv[1]); t = p.read_text(encoding='utf-8')
    p.write_text(patch(t, str(p)), encoding='utf-8')
    print('patch_v12423 applied: the Demob cards module replaced (quick saves), keep-your-place reads only scrolled elements; footer v12.42.2 -> v12.42.3')
