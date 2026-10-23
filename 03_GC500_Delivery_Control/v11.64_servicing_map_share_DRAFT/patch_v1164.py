"""Author: Andrew Fisher. Share servicing-map locations/areas and unfinished jobs."""
import hashlib
import os
from pathlib import Path
import sys

HERE = Path(__file__).resolve().parent
sys.path.insert(0, os.path.join(str(HERE), '..', 'toolchain'))
from rep import rep

path = Path(sys.argv[1])
raw = path.read_bytes()
text = raw.decode('utf-8')
assert 'var SvcShare1164 =' not in text, 'v11.64 already applied'
assert hashlib.sha256(raw).hexdigest() == (HERE / 'BASE_SHA256').read_text().strip(), 'Wrong live base; rebuild and retest'
assert 'rwDay1163' in text, 'Missing v11.63 base'

def replace(old, new, label):
    global text
    text = rep(text, old, new, label, str(path))

replace('var SvcMap1099 = (function () {', (HERE / 'share1164_src.js').read_text() + '\nvar SvcMap1099 = (function () {', 'read-only servicing picture')
replace("}).join('')+'</article>';}).join(''):'<p>Select a map symbol to see its servicing progress.</p>';",
        "}).join('')+'<button type=\"button\" data-share1164-ref=\"'+esc(r.ref)+'\" data-ro>Share map + jobs</button></article>';}).join(''):'<p>Select a map symbol to see its servicing progress.</p>';", 'reference share button')
replace('<button type="button" data-map-fit data-ro>Fit map</button></div>',
        '<button type="button" data-map-fit data-ro>Fit map</button><button type="button" data-share1164-area data-ro hidden>Share area + jobs</button></div>', 'area share button')
replace("var selectedIndex=m.areas.findIndex(function(a){return a.id===I.filter;});",
        "q('[data-share1164-area]').hidden=!I.filter;\nvar selectedIndex=m.areas.findIndex(function(a){return a.id===I.filter;});", 'share selected area')
replace("if(b.hasAttribute('data-map-refresh')){",
        "if(b.hasAttribute('data-share1164-ref')){SvcShare1164.open(I,{kind:'ref',id:b.getAttribute('data-share1164-ref')});return;}\n    if(b.hasAttribute('data-share1164-area')){if(I.filter)SvcShare1164.open(I,{kind:'area',id:I.filter});return;}\n    if(b.hasAttribute('data-map-refresh')){", 'share delegated actions')
replace("I.M=M;var G=geometry(M);I.m=model(M);",
        "I.M=M;SvcShare1164.context(I);var G=geometry(M);I.m=model(M);", 'invalidate changed night or tracker')
replace("I.destroy=function(){I.dead=true;I.detailToken++;", "I.destroy=function(){SvcShare1164.close(I);I.dead=true;I.detailToken++;", 'close private snapshot on unmount')
replace("mapInput1099 = {D:data,S:SvcState,events:model.events,now:now,lastRead:clockNow,day:day,readStatus:status,refresh:function(){failures1099=0;return poll();}};",
        "mapInput1099 = {D:data,S:SvcState,events:model.events,now:now,lastRead:clockNow,day:day,context1164:selected,test1164:meta.load!=='servicing-tracker:GC500-2026',readStatus:status,refresh:function(){failures1099=0;return poll();}};", 'scope snapshot to tracker and service night')
replace('</head>\n<body>', '<style>\n' + (HERE / 'share1164.css').read_text() + '\n</style>\n</head>\n<body>', 'picture preview styles')
replace("+' · v11.63';", "+' · v11.64';", 'release footer')
path.write_text(text, encoding='utf-8')
