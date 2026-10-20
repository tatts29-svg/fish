"""Author: Andrew Fisher. Port of the v10.57 performance draft (0a1b93c6) onto live v10.60.1: the parts that measure faster
with identical output. Index unit-identity records and work-record keys inside the existing synchronous asset hold, reuse the
day-work snapshot within a hold, batch the completion read, and share one asset list across the Site-vs-Baseplan drawer check.
Not taken: the syncFooter hold wrapper (adds an asset build to most polls). No record, figure, text or layout changes.
Usage: python3 patch_v1061_codexport.py page.html   (writes in place)"""
import os, sys
from pathlib import Path
sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..', '..', 'toolchain'))
from rep import rep
D = Path(__file__).resolve().parent / 'draft'
sys.path.insert(0, str(D))
import importlib.util
_s = importlib.util.spec_from_file_location('p1057', str(D / 'patch_v1057.py')); P = importlib.util.module_from_spec(_s); _s.loader.exec_module(P)

ALIGN_OLD = 'requestAnimationFrame(() => { q = false; try { drawer(); costs(); } catch (x) {} });'
ALIGN_NEW = ("requestAnimationFrame(() => { q = false; try { const dr1061 = D.getElementById('drawer'), pc1061 = D.getElementById('pane-costs'); "
             "if ((dr1061 && dr1061.classList.contains('on')) || (pc1061 && !pc1061.querySelector('#align1055'))) holdAssets(() => { drawer(); costs(); }); } catch (x) {} });")

def patch(text, path='page.html'):
    if 'unitEvidenceKeys1057' in text: raise ValueError('already installed')
    if 'W.align1055 = {scan, DIFFS};' not in text: raise ValueError('requires the v10.55+ live base')
    def ch(old, new, label):
        nonlocal text; text = rep(text, old, new, label, path)
    ch(P.OLD_METADATA, P.NEW_METADATA, 'index unit identity records within each hold')
    ch('docs=metadata925(env.loads).filter(d=>d.ref===a.key),claimed=new Set(),rows=[];', 'docs=metadata925(env.loads,a.key),claimed=new Set(),rows=[];', 'read one reference from the index')
    ch(P.OLD_SCOPE, P.NEW_SCOPE, 'index work-record keys within each hold')
    ch('window.gc500CompleteKeys897 = function () { try { return allAssets().filter(verified897).map(a => a.key); } catch (e) { return null; } };',
       'window.gc500CompleteKeys897 = function () { try { return holdAssets(() => allAssets().filter(verified897).map(a => a.key)); } catch (e) { return null; } };', 'one asset list per completion read')
    ch(" let cachedKey='', cached;\n function native() {", " let cachedKey='', cached;\n function native() { return heldMemo('buildWork1057', nativeRead1057); }\n function nativeRead1057() {", 'one day-work snapshot per hold')
    ch("reset:()=>{cached=null;cachedKey='';}", "reset:()=>{cached=null;cachedKey='';HELD_MEMO.delete('buildWork1057');}", 'reset clears the held snapshot')
    ch(ALIGN_OLD, ALIGN_NEW, 'one asset list per Site-vs-Baseplan check, only when there is something to check')
    return text

if __name__ == '__main__':
    p = Path(sys.argv[1]); out = Path(sys.argv[2]) if len(sys.argv) > 2 else p
    out.write_text(patch(p.read_text(encoding='utf8'), str(p)), encoding='utf8'); print('wrote', out)
