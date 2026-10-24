"""Author: Andrew Fisher. Extend existing map searches without changing operational records."""
import hashlib,json,re,sys
from pathlib import Path
HERE=Path(__file__).resolve().parent
sys.path.insert(0,str(HERE.parent/'toolchain'))
from rep import rep
def patch(html):
 if 'id="search1208-script"' in html:raise ValueError('v12.08 already applied')
 if hashlib.sha256(html.encode()).hexdigest()!=(HERE/'BASE_SHA256').read_text().strip():raise ValueError('Exact live base changed; rebuild and retest')
 def module(id,sha):
  m=re.search(r'<script id="'+id+r'">([\s\S]*?)</script>',html)
  if not m or hashlib.sha256(m[1].encode()).hexdigest()!=(HERE/sha).read_text().strip():raise ValueError(id+' source changed')
  return m
 spot=module('spot1117-script','SPOT_SHA256');find=module('find1178-script','FIND_SHA256')
 parent=(HERE/'search1208_parent.js').read_text().replace('__CATALOG1208__',(HERE/'legend1208.json').read_text().strip())
 frame=(HERE/'search1208_frame.js').read_text()
 code=rep(spot[1],'  window.GC500Area1206=areaFrame1206();','  window.GC500Area1206=areaFrame1206();\n'+frame+'\n  searchFrame1208();','complete map search','spot')
 code=rep(code,"button.disabled=!prepared||running;","button.disabled=!prepared||running;\n  const lift=()=>{const t=document.getElementById('toast');if(t)t.style.bottom=(card.offsetHeight+24)+'px';};lift();box.querySelectorAll('details').forEach(d=>d.addEventListener('toggle',lift));",'area toast clears expanded card','spot')
 html=rep(html,spot[0],'<script id="search1208-script">\n'+parent+'\n</script>\n<script id="spot1117-script">'+code+'</script>','map frame','page')
 code=find[1]
 a=code.index('function search(q){');b=code.index('\n\n/* ---- the pictures:',a)
 code=rep(code,code[a:b],"function search(q){ return W.MapSearch1208.search(q); }",'complete parent matches','finder')
 code=rep(code,'function open(L){\n if (!L) return null;','function open(L){\n if (!L) return null;\n if(L.code1208)W.MapSearch1208.select(L);','select map search result','finder')
 code=rep(code,'if (rows.length) open(rows[0]);','if (rows.length) W.MapSearch1208.showAll();','submit shows all','finder')
 code=rep(code,'rows.length ? rows.map(rowHtml).join(\'\')',"rows.length ? '<p class=\"hint\">'+r.placed+' mapped locations · '+r.unplaced+' without an exact position</p><button type=\"button\" class=\"btn sm\" data-showall1208>Show all locations</button>'+rows.map(rowHtml).join('')",'result totals','finder')
 code=rep(code,"list.addEventListener('click', ev => { const b", "list.addEventListener('click', ev => { if(ev.target.closest('[data-showall1208]')){W.MapSearch1208.showAll();return;} const b",'all locations button','finder')
 code=rep(code,'Asset no, reference, gate, VMS, stand or turn — e.g. 1244536, WC41, gate 6, VMS 10, stand 5, turn 2','Reference, asset no or map symbol — e.g. toilets, first aid, hydrants, camera, gate 6','search examples','finder')
 parent=(HERE/'search1208_parent.js').read_text().replace('__CATALOG1208__',(HERE/'legend1208.json').read_text().strip())
 html=rep(html,find[0],'<script id="find1178-script">'+code+'</script>','complete map module','page')
 f=re.search(r"\+' · v(\d+\.\d+)'; /\* v8.19 release922",html)
 return rep(html,f[0],"+' · v12.08'; /* v8.19 release922",'footer','page')
if __name__=='__main__':
 p=Path(sys.argv[1]);p.write_text(patch(p.read_text()));print('v12.08 complete map matches applied')
