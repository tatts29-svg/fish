# Author: Andrew Fisher
from pathlib import Path
import sys,hashlib
here=Path(__file__).resolve().parent
sys.path.insert(0,str(here.parent/'toolchain'))
from rep import rep
p=Path(sys.argv[1]);s=p.read_text()
if 'build983-script' in s:raise SystemExit('Already applied')
if hashlib.sha256(p.read_bytes()).hexdigest()!='f27008ce5293921f69c5f0b812ff46f5dddb00453e7d3748d99909aa22561bd2':raise SystemExit('Wrong live base')
for old,new in [("['timeline','Timeline']","['timeline','Build']"),('Open the Timeline →','Open Build →'),("'Open Timeline', id + '-plan-destination'","'Open Build', id + '-plan-destination'"),("+ ' · v9.82'","+ ' · v9.83'")]:s=rep(s,old,new,'Build naming',str(p))
old_workers="""  const override=document.createElement('details');override.dataset.workers979Task='';override.innerHTML='<summary>Task worker override</summary>';task.replaceWith(override);override.append(task);
  if(!(crew883Plan(day,asset.key).people||[]).length){task.querySelector('[data-workers911-placeholder]')?.remove();}"""
new_workers="""  task.dataset.workers983Selection='';
  if(!(crew883Plan(day,asset.key).people||[]).length && capability()==='edit'&&!SYNC.readonly){
   const people=task.querySelector('[data-crew883-people]');
   if(people&&!people.children.length)people.innerHTML=crew883PersonHtml(day,{slot:null,roles:[]},0,true);
  }"""
s=rep(s,old_workers,new_workers,'Visible roster worker selection',str(p))
s=rep(s,'</head>\n<body','<style id="build983-style">'+(here/'build983.css').read_text()+'</style>\n</head>\n<body','Build layout',str(p))
s=rep(s,'</body>\n</html>','<script id="build983-script">'+(here/'build983.js').read_text()+'</script>\n</body>\n</html>','Build motion',str(p))
p.write_text(s)
