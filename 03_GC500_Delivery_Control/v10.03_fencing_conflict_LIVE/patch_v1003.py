"""Author: Andrew Fisher. Preserve the reviewed fencing correction through stale-copy sync."""
import hashlib,sys
from pathlib import Path
HERE=Path(__file__).resolve().parent
sys.path.insert(0,str(HERE.parent/'toolchain'))
from rep import rep
BASE_SHA='0ed900c790e1cf21686d4b24566d0919e920032c25e66da205fbe4c68494468b'
def apply(text):
    if hashlib.sha256(text.encode()).hexdigest()!=BASE_SHA:raise ValueError('Requires exact live v10.02; refuses repeat application')
    text=rep(text,'function mergeRecords(mine, theirs){',(HERE/'fencing1003.js').read_text()+'\nfunction mergeRecords(mine, theirs){','Source-reviewed docket identity','v10.03')
    old=" A.added = (A.added || []).filter(x => x && x.key && !dead(x.key)); B.added = (B.added || []).filter(x => x && x.key && !dead(x.key));"
    text=rep(text,old," A.fenceDockets=fenceDockets1003(A.fenceDockets,out.deleted); B.fenceDockets=fenceDockets1003(B.fenceDockets,out.deleted);\n"+old,'Normalise after native tombstones','v10.03')
    text=rep(text,(HERE/'union1003.before.txt').read_text(),(HERE/'union1003.js').read_text(),'Semantic list equality and new-conflict notices','v10.03')
    text=rep(text,'const loc = (S.fenceDockets || []).map(d => {','const loc = fenceDockets1003(S.fenceDockets,S.deleted).map(d => {','Price reviewed docket once','v10.03')
    return rep(text,"+ ' · v10.02'","+ ' · v10.03'",'Release footer','v10.03')
if __name__=='__main__':
    page=Path(sys.argv[1]);page.write_text(apply(page.read_text()))
