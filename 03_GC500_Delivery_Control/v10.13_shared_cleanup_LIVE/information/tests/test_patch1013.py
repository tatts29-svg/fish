"""Author: Andrew Fisher. Guarded information patch contract; no operational writes."""
import hashlib
import json
import sys
from pathlib import Path
HERE=Path(__file__).resolve().parent
sys.path.insert(0,str(HERE.parent))
from patch_information1013 import apply

source=Path(sys.argv[1] if len(sys.argv)>1 else '/workspace/private-today-audit14Oct2026/live.html').read_text()
candidate=apply(source)
checks=0
for name,value in [('reapplication',candidate),('wrong previous source',source.replace('typedSingle1012','wrongPreviousInventory'))]:
    try:
        apply(value)
        raise AssertionError(name+' should refuse')
    except ValueError:
        checks+=1
assert 'fmtStamp(x.d.set_at,x.d)' in candidate
checks+=1
start=candidate.index("moreInfo('pricing|earlier-source-notes'")
end=candidate.index('</ul>',start)
assert not any(x in candidate[start:end] for x in ['${open.length}','${assets.length}','${DATA.boq'])
checks+=1
result={'author':'Andrew Fisher','checks':checks,'passed':True,'sourceSha256':hashlib.sha256(source.encode()).hexdigest(),'candidateSha256':hashlib.sha256(candidate.encode()).hexdigest()}
print(json.dumps(result))
