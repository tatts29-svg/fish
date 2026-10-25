"""Author: Andrew Fisher. Explicit door-lock declaration on the native crew card and night report."""
import hashlib,json,re,sys
from pathlib import Path
HERE=Path(__file__).resolve().parent
sys.path.insert(0,str(HERE.parent/'toolchain'))
from rep import rep
BASES={'6ccc030d201729e50015d77aa2f140ba63660fe32e0a5fc44c958d47b6636a16':'v12.19'}
def patch(text):
 assert 'var SvcLock1221 =' not in text,'Already applied'
 version=BASES.get(hashlib.sha256(text.encode()).hexdigest());assert version,'Wrong verified live base'
 def r(s,a,b,label):return rep(s,a,b,label,'page')
 helper=(HERE/'lock1221_shared.js').read_text()
 m=re.search(r'var SVC1067_CARD=(\{[^\n]+\});',text);assert m
 bundle=json.loads(m[1]);crew=bundle['html'];bundle['data']['tasks']['lockup']='Locked (doors locked)'
 crew=r(crew,'var SvcState =',helper+'\nvar SvcState =','shared declaration helper')
 crew=r(crew,"var selectedCrew1173=''",(HERE/'lock1221_crew.js').read_text()+"\nvar selectedCrew1173=''",'declaration prompt')
 crew=r(crew,'if(e.crew_group)w.crew_group=e.crew_group;return w;', 'if(e.crew_group)w.crew_group=e.crew_group;if(e.lock_declaration)w.lock_declaration=e.lock_declaration;return w;','declaration wire')
 crew=r(crew,"crewReady1173=j.crew_groups_version===1;", "lockReady1221=j.lock_declarations_version===1;keep('lock-capability1221',lockReady1221);\ncrewReady1173=j.crew_groups_version===1;",'server capability')
 crew=r(crew,'if (sending || final || !outbox.length) return;', "if (sending || final || !outbox.length) return;\n  if(!lockReady1221&&outbox.some(function(e){return !!e.lock_declaration;})){schedulePump(SLOW_MS);return;}",'server downgrade protection')
 crew=r(crew,'var ev = outbox[idx];', "var ev = outbox[idx];\n        if(ev.lock_declaration&&!SvcLock1221.same(ev.lock_declaration,sv.lock_declaration)){lockReady1221=false;keep('lock-capability1221',false);return;}",'verify stored declaration echo')
 crew=r(crew,'function tapJob(key) {','function tapJob(key, declaration) {','tap signature')
 crew=r(crew,'var ev = { crew_group:selectedCrew1173,', "if(task==='lockup'){if(!declaration){declareLock1221(key);return;}if(!lockReady1221||!SvcLock1221.valid(declaration)||declaration.units!==LINE[lineId].qty||declaration.crew!==SvcCrews1173.label(D,selectedCrew1173))return;}\n  var ev = { crew_group:selectedCrew1173,",'require declaration on lock only')
 crew=r(crew,'  queueEvent(ev);', "  if(task==='lockup')ev.lock_declaration=declaration;\n  queueEvent(ev);",'queue the declaration with its tick')
 crew=r(crew,'</style>',(HERE/'lock1221.css').read_text()+'\n</style>','prompt CSS')
 bundle['html']=crew
 text=r(text,m[0],'var SVC1067_CARD='+json.dumps(bundle,ensure_ascii=False,separators=(',',':')).replace('</','<\\/')+';','updated native card bundle')
 m=re.search(r'var SVC1067_DATA=(\{[^\n]+\});',text);assert m
 data=json.loads(m[1]);data['tasks']['lockup']='Locked (doors locked)'
 text=r(text,m[0],'var SVC1067_DATA='+json.dumps(data,ensure_ascii=False,separators=(',',':')).replace('</','<\\/')+';','panel label')
 text=r(text,'\nvar SvcState =','\n'+helper+'\nvar SvcState =','main declaration helper')
 text=r(text,'tasks, areas, crews: [...crews.values()]', 'lockDeclarations: SvcLock1221.report(I,day), tasks, areas, crews: [...crews.values()]','night report evidence model')
 text=r(text,"areas + leftBlocks + how + '</div>'", "areas + leftBlocks + how + SvcLock1221.html(R) + '</div>'",'print declaration evidence')
 text=r(text,'guard=0;while(s&&guard++<20)', "guard=0,budget=document.querySelectorAll('.sheet.flow .body > *').length+20;while(s&&guard++<budget)",'paginate all declaration history')
 text=r(text,"+' · "+version+"'; /* v8.19 release922", "+' · v12.21'; /* v8.19 release922",'footer')
 return text
if __name__=='__main__':
 p=Path(sys.argv[1]);p.write_text(patch(p.read_text()));print('v12.21 door-lock declaration applied')
