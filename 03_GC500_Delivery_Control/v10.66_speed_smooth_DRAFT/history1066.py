"""Author: Andrew Fisher. Avoid repeated history copies during historical day reads."""
import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent / 'toolchain'))
from rep import rep

HISTORY = """/* v10.66: raw audit history depends on the record, not event pricing dates. */
function historyRead1066(key, field){
 if (typeof ASSETS_HELD==='undefined'||!ASSETS_HELD) return histOf_(key,field);
 heldFresh775();
 const k='histOf1066|'+field+'|'+key;
 if (HELD_MEMO.has(k)) return HELD_MEMO.get(k);
 const rows=histOf_(key,field);HELD_MEMO.set(k,rows);return rows;
}
function histOf(key, field){return historyRead1066(key,field).slice();}
function historyLast1066(key,field,cut){
 const rows=historyRead1066(key,field);
 for(let i=rows.length-1;i>=0;i--)if(rows[i].at<=cut)return rows[i];
 return null;
}"""

def apply(text, path):
    text=rep(text,"function histOf(key, field){ return typeof heldMemo === 'function' && ASSETS_HELD ? heldMemo('histOf1066|' + field + '|' + key, () => histOf_(key, field)).slice() : histOf_(key, field); } /* load1066 */",HISTORY,'read raw histories once without unrelated event signature',path)
    for field, variable, last in [('history','hist','last'),('done_history','dh','lastDone'),('levelled_history','lh','lastLvl'),('steps_history','sh','lastStp')]:
        old=f"const {variable} = histOf(key, '{field}').filter(h => h.at <= cut);\n const {last} = {variable}[{variable}.length - 1] || null;"
        new=f"const {last} = historyLast1066(key, '{field}', cut);"
        text=rep(text,old,new,'replay latest '+field+' directly from sorted history',path)
    return text
