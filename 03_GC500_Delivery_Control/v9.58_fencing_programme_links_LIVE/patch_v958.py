# Author: Andrew Fisher
from pathlib import Path
import sys
HERE=Path(__file__).resolve().parent
sys.path.insert(0,str(HERE.parent/'toolchain'))
from rep import rep
p=Path(sys.argv[1]);raw=p.read_bytes();s=raw.decode('utf-8-sig')
assert 'const FENCE_PROGRAMME958 =' not in s,'v9.58 is already applied'
assert 'function installFlatFeet957' in s and " · v9.57'; /* v8.19" in s,'Requires v9.57 base'
s=rep(s,'function fenceByWeek(dockets){', (HERE/'programme958.js').read_text()+'\nfunction fenceByWeekBefore958(dockets){','task catalogue and read-only attribution',str(p))
s=rep(s,'function fenceByArea(dockets){', 'function fenceByWeek(dockets){ return fenceProgrammeAdjust958(fenceByWeekBefore958(dockets), fenceProgrammeReviews958(dockets)); }\nfunction fenceByArea(dockets){','weekly forecast attribution',str(p))
s=rep(s,'${fenceCcbDetail847(d)}${fenceTraceRegister837(d)}','${fenceCcbDetail847(d)}${fenceProgrammeDetail958(d)}${fenceTraceRegister837(d)}','reviewed task links in existing details',str(p))
s=rep(s,"${wk.update ? planUpdateCard(wk.update) : ''}","${fenceProgrammeWeekBasis958(wk)}${wk.update ? planUpdateCard(wk.update) : ''}",'weekly attribution basis',str(p))
s=rep(s,'<td>${words(row.fields)}${(row.conflicts||[]).map', '<td>${words(row.fields)}${fenceProgrammeTask958(row)}${(row.conflicts||[]).map','task-specific credit and remaining allowance',str(p))
s=rep(s," · v9.57'; /* v8.19"," · v9.58'; /* v8.19",'footer',str(p))
p.write_bytes((b'\xef\xbb\xbf' if raw.startswith(b'\xef\xbb\xbf') else b'')+s.encode())
