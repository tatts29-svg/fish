# Author: Andrew Fisher
from pathlib import Path
import sys,hashlib
here=Path(__file__).resolve().parent
sys.path.insert(0,str(here.parent/'toolchain'))
from rep import rep
p=Path(sys.argv[1]);s=p.read_text()
if hashlib.sha256(p.read_bytes()).hexdigest()!='5f5ac67334f382985d57e136277a6321bf47565ac1033e35cf203c631ae1e45c':raise SystemExit('Wrong live base')
if 'progressHealth985' in s:raise SystemExit('Already applied')
s=rep(s,"+ ' · v9.84'","+ ' · v9.85'",'version',str(p))
s=rep(s,"let revision='',lastDay=todayIso(),paused=false,printing=false,suspended=false,rendering=false;", "let revision='',healthRevision='',lastDay=todayIso(),paused=false,printing=false,suspended=false,rendering=false;",'Cache health revision',str(p))
s=rep(s,"function begin(){const key=todayIso()+JSON.stringify(S);if(key!==revision){revision=key;facts.clear();progress.clear();}}", "function progressHealth985(){return JSON.stringify(todayWorkHealth840());}\nfunction begin(){healthRevision=progressHealth985();const key=todayIso()+healthRevision+JSON.stringify(S);if(key!==revision){revision=key;facts.clear();progress.clear();}}",'Readiness participates in cache invalidation',str(p))
s=rep(s,"try{const value=progress881Model(iso);progress.set(iso,value);return value;}","try{const value=progress881Model(iso);if(value?.ready)progress.set(iso,value);return value;}",'Do not retain loading result',str(p))
a="const previousGo=go;go=function(){const result=previousGo.apply(this,arguments);sync();return result;};"
s=rep(s,a,a+"\n/* Empty collection hydration and connection health can change without changing S. */\nconst previousFooter985=syncFooter;syncFooter=function(){const result=previousFooter985.apply(this,arguments);if(active()&&!rendering&&healthRevision!==progressHealth985())renderTimeline();return result;};",'Refresh cards on native health transition',str(p))
p.write_text(s)
