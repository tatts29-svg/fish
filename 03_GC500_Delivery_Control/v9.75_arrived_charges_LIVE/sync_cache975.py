# Author: Andrew Fisher. Invalidate view-model caches when shared records change.
from pathlib import Path
import sys
sys.path.insert(0,str(Path(__file__).resolve().parent.parent/'toolchain'))
from rep import rep

def apply_sync_cache975(s):
    if 'function sharedCache975()' in s:
        raise ValueError('Shared-cache975 already applied')
    s=rep(s,'function syncFold(name, docs){','''/* Author: Andrew Fisher. Native hydration and polling invalidate the same caches as a local save.
   The deferred redraw is presentation; data readers must see the received record immediately. */
function sharedCache975(){
 RENDER_MEMO.clear();
 if (ASSETS_HELD) HELD_STALE775 = true;
 else HELD_MEMO.clear();
}
function syncFold(name, docs){''','Shared-cache invalidation helper',__file__)
    s=rep(s,' c.set(next);\n return true;\n}\nfunction syncFirst(){',' c.set(next);\n sharedCache975();\n return true;\n}\nfunction syncFirst(){','Invalidate after shared collection changes',__file__)
    s=rep(s,' const {merged, report} = mergeRecords(S, theirs);\n S = merged;\n names.forEach(name => { const last = {};',' const {merged, report} = mergeRecords(S, theirs);\n S = merged;\n sharedCache975();\n names.forEach(name => { const last = {};','Invalidate after editable initial merge',__file__)
    return s
