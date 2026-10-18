"""Author: Andrew Fisher. v10.66 speed and smoothness, rebuilt on exact live v10.65.

One implementation of each overlapping prototype is retained. No operational data
is edited. This patch is a draft until the final candidate passes the release gates.
Usage: python3 patch_v1066.py PAGE [OUTPUT]
"""
from pathlib import Path
import hashlib
import json
import sys

HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE))
sys.path.insert(0, str(HERE.parent / 'toolchain'))
from rep import rep
from history1066 import apply as apply_history
from build_reads1066 import apply as apply_build_reads
from dom_batch1066 import apply as apply_dom_batch
from today_models1066 import apply as apply_today_models
from today_report1066 import apply as apply_today_report
from boot_sync1066 import apply as apply_boot_sync

BASE_SHA256 = 'c62adee5817153a56d538e1db015b0ef66a8a6e75609bc4d6e09a47bedfafbd8'

CARRY = """let ASSETS_HELD = null;
const HELD_MEMO = new Map();
var REC_EPOCH1066 = 0; /* v10.66: saves and received records invalidate carried reads. */
function carryContext1066(){
 // The native current() checks event dates on every read, including same-task edits.
 const config = window.EventConfig1013 ? window.EventConfig1013.current() : null;
 return {epoch:REC_EPOCH1066,day:todayIso(),config,record:typeof S==='undefined'?null:S,
  docsAt:typeof DOCS==='undefined'?0:DOCS.at,docsState:typeof DOCS==='undefined'?'':DOCS.state,
  files:typeof DOCS==='undefined'?null:DOCS.files,
  health:typeof todayWorkHealth840==='function'?JSON.stringify(todayWorkHealth840()):'',
  view:typeof state==='undefined'?'':JSON.stringify(state)};
}
function sameCarry1066(a,b){return !!a&&Object.keys(b).every(k=>a[k]===b[k]);}
function holdCarry1066(carry,fn){
 if(ASSETS_HELD)return holdAssets(fn);
 const before=carryContext1066();
 const remember=()=>{const after=carryContext1066();
  if(!HELD_STALE775&&sameCarry1066(before,after)){
   carry.context=after;carry.assets=ASSETS_HELD;carry.memo=new Map(HELD_MEMO);
  }else{carry.context=null;carry.assets=null;carry.memo=null;}
 };
 if(!carry.assets||!carry.memo||!sameCarry1066(carry.context,before))
  return holdAssets(()=>{try{const result=fn();remember();return result;}catch(e){carry.context=null;throw e;}});
 ASSETS_HELD=carry.assets;HELD_MEMO.clear();carry.memo.forEach((v,k)=>HELD_MEMO.set(k,v));HELD_STALE775=false;
 try{const result=fn();remember();return result;}catch(e){carry.context=null;throw e;}
 finally{ASSETS_HELD=null;HELD_MEMO.clear();HELD_STALE775=false;}
}
"""

def patch(text, path='page.html'):
    if 'smooth1066-early' in text or 'function holdCarry1066(' in text:
        raise ValueError('v10.66 is already applied')
    if "' · v10.65'" not in text or 'id="shapes1060-script"' not in text:
        raise ValueError('requires the live v10.65 footer and shapes layer')
    actual = hashlib.sha256(text.encode('utf-8')).hexdigest()
    if actual != BASE_SHA256:
        raise ValueError(f'wrong live base: expected {BASE_SHA256}, got {actual}')

    rows = json.loads((HERE / 'speed1066_hunks.json').read_text(encoding='utf-8'))
    for row in rows:
        new = CARRY if row['id'] == 34 else row['new']
        text = rep(text, row['old'], new, row['label'], path)

    # Event changes during a held calculation must invalidate its asset list as
    # well as memo entries. Keep the native immediate signature validation.
    old = "const current=makeCurrent(()=>typeof DATA==='undefined'?{}:DATA,()=>{try{if(typeof RENDER_MEMO!=='undefined')RENDER_MEMO.clear();}catch(e){}try{if(typeof HELD_MEMO!=='undefined')HELD_MEMO.clear();}catch(e){}});"
    new = "const current=makeCurrent(()=>typeof DATA==='undefined'?{}:DATA,()=>{try{if(typeof REC_EPOCH1066==='number')REC_EPOCH1066++;}catch(e){}try{if(typeof RENDER_MEMO!=='undefined')RENDER_MEMO.clear();}catch(e){}try{if(typeof HELD_MEMO!=='undefined')HELD_MEMO.clear();if(typeof ASSETS_HELD!=='undefined'&&ASSETS_HELD)HELD_STALE775=true;}catch(e){}});"
    text = rep(text, old, new, 'invalidate carried and held reads when event dates change', path)
    text = apply_history(text, path)
    text = apply_build_reads(text, path)
    for row in json.loads((HERE / 'today1066_hunks.json').read_text(encoding='utf-8')):
        text = rep(text, row['old'], row['new'], row['id'], path)
    text = apply_dom_batch(text, path)
    text = apply_today_models(text, path)
    text = apply_today_report(text, path)
    text = apply_boot_sync(text, path)
    text = rep(text, "+ ' · v10.65'", "+ ' · v10.66'", 'release footer', path)
    return text

def main():
    path = Path(sys.argv[1])
    out = Path(sys.argv[2]) if len(sys.argv) > 2 else path
    text = patch(path.read_text(encoding='utf-8'), str(path))
    out.write_text(text, encoding='utf-8')
    print('Patched v10.66 speed and smoothness:', out)

if __name__ == '__main__':
    main()
