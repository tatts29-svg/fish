"""Author: Andrew Fisher. Read-only shift reports for the selected servicing night."""
import hashlib
import os
import sys
from pathlib import Path
HERE=Path(__file__).resolve().parent
sys.path.insert(0,os.path.join(str(HERE),'..','toolchain'))
from rep import rep
path=Path(sys.argv[1]);raw=path.read_bytes();text=raw.decode('utf-8')
assert 'var SvcShift1168 =' not in text,'Shift report already applied'
assert hashlib.sha256(raw).hexdigest()==(HERE/'BASE_SHA256').read_text().strip(),'Wrong live base; rebuild and retest'
assert 'var SvcShare1164 =' in text and "+' · v11.67';" in text,'Expected live v11.67'
def replace(old,new,label):
 global text
 text=rep(text,old,new,label,str(path))
replace('var SvcMap1099 = (function () {',(HERE/'shift1168_src.js').read_text()+'\nvar SvcMap1099 = (function () {','shift report module')
replace('<button type="button" data-map-fit data-ro>Fit map</button>','<button type="button" data-map-fit data-ro>Fit map</button><button type="button" data-shift1168 data-ro>Shift report</button>','shift report button')
replace("if(b.hasAttribute('data-map-fit')){fit(I.filter);return;}","if(b.hasAttribute('data-shift1168')){SvcShift1168.open(I);return;}\n    if(b.hasAttribute('data-map-fit')){fit(I.filter);return;}",'report action')
replace('I.M=M;SvcShare1164.context(I);','I.M=M;SvcShare1164.context(I);SvcShift1168.context(I);','report context lifecycle')
replace('I.destroy=function(){SvcShare1164.close(I);','I.destroy=function(){SvcShift1168.close(I);SvcShare1164.close(I);','close report on unmount')
replace('</head>\n<body>','<style>\n'+(HERE/'shift1168.css').read_text()+'\n</style>\n</head>\n<body>','report styles')
replace("+' · v11.67';","+' · v11.68';",'release footer')
path.write_text(text,encoding='utf-8')
