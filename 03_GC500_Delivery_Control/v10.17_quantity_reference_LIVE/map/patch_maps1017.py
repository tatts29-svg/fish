#!/usr/bin/env python3
"""Author: Andrew Fisher. Preserve source-only request quantities and provenance in maps."""
from pathlib import Path
import hashlib,json,sys
HERE=Path(__file__).resolve().parent
sys.path.insert(0,str(HERE.parents[1]/'toolchain'))
from rep import rep as once
BASE={'explorer.js':'5b71f3a8994f4dac72f2161970f68e77dab58b7e607a16e92b7d4d8db0da36e8','explorer-merge.js':'80d0066577308b29f5e66e2d63a8642a47637d1754e419ae11399c980346e384','index.html':'9c24098ca71a7f5f17383fc96bd8f4ccedeef4cb0520dbb70c759354df01d1af'}
def rep(text,old,new):return once(text,old,new,'v10.17 source requests','explorer')
def apply(source,output):
 source,output=Path(source),Path(output);original={name:(source/name).read_bytes() for name in BASE}
 for name,raw in original.items():
  if hashlib.sha256(raw).hexdigest()!=BASE[name]:raise ValueError('Wrong source or already patched: '+name)
 js=original['explorer.js'].decode()
 js=rep(js,'function buildItems() {',(HERE/'source_requests1017.js').read_text()+'\nfunction buildItems() {')
 old="reg: {name: i.name, drawing: i.drawing, asset_numbers:i.assets || '', ownership:i.ownership || '', location:i.location || ''}, cat: c, names: []}"
 new="reg: Object.assign({name: i.name, drawing: i.drawing, asset_numbers:i.assets || '', ownership:i.ownership || '', location:i.location || ''},sourceRequestFields1017(i)), cat: c, names: []}"
 js=rep(js,old,new)
 js=rep(js,"function placeWord(it) { if (it.cat", "function placeWord(it) { if(it.reg&&it.reg.sourceRequest1017)return 'source schedule request · no exact map position'; if (it.cat")
 js=rep(js,"' more in the register with no place on it yet'","' more references with no place on it yet'")
 js=rep(js,"(it.cat && it.cat.host ? ' is in the register but has no place on the master plan yet'", "(it.reg&&it.reg.sourceRequest1017 ? ' is a source schedule request with no exact position on the master plan yet' : it.cat && it.cat.host ? ' is in the register but has no place on the master plan yet'")
 js=rep(js,"  return statusModel1009(MAP1009.rows.get(it.code), MAP1009.available);","  return sourceRequestStatus1017(it)||statusModel1009(MAP1009.rows.get(it.code), MAP1009.available);")
 js=rep(js,"const code=String(it&&it.code||''),items=status&&status.quantity1010&&status.quantity1010.items;", "const code=String(it&&it.reg&&it.reg.sourceRequest1017?it.reg.sourceKey1017:it&&it.code||''),items=status&&status.quantity1010&&status.quantity1010.items;")
 merge=original['explorer-merge.js'].decode()
 merge=rep(merge,'<b>${escH(code)}</b>${typeof ok897', '<b>${escH(it.reg&&it.reg.sourceRequest1017?it.reg.sourceKey1017:code)}</b>${typeof ok897')
 merge=rep(merge,"      ${!it.places.length ? '<div class=\"xc-s\">In the register, with no place on the master plan yet.</div>' : ''}","      ${typeof sourceRequestCard1017==='function'&&it.reg&&it.reg.sourceRequest1017?sourceRequestCard1017(it):!it.places.length ? '<div class=\"xc-s\">In the register, with no place on the master plan yet.</div>' : ''}")
 merge=rep(merge,"if (!code || !info || typeof window.GC500ExplorerRefreshCard897 !== 'function') return false;","if (!code || (!info&&!(selected&&selected.reg&&selected.reg.sourceRequest1017)) || typeof window.GC500ExplorerRefreshCard897 !== 'function') return false;")
 merge=rep(merge,"const signature = JSON.stringify([code, info]);","const signature = JSON.stringify([code, info,selected&&selected.reg&&selected.reg.sourceRequest1017?selected.reg:null]);")
 merge=rep(merge,"const quantities=el.querySelector('.map1010-quantities')","const quantities=el.querySelector('.map1010-quantities,.map-source1017')")
 merge=rep(merge,"const nextQuantity=el.querySelector('.map1010-quantities')","const nextQuantity=el.querySelector('.map1010-quantities,.map-source1017')")
 changed={'explorer.js':js.encode(),'explorer-merge.js':merge.encode()};index=original['index.html'].decode()
 for name,raw in changed.items():index=rep(index,name+'?v='+BASE[name][:12],name+'?v='+hashlib.sha256(raw).hexdigest()[:12])
 changed['index.html']=index.encode();output.mkdir(parents=True,exist_ok=True);evidence={'author':'Andrew Fisher','changedFiles':{}}
 for name,raw in changed.items():
  (output/name).write_bytes(raw);evidence['changedFiles']['explorer/'+name]={'base':BASE[name],'candidate':hashlib.sha256(raw).hexdigest(),'bytes':len(raw)}
 (HERE/'evidence').mkdir(exist_ok=True);(HERE/'evidence/source-bound.json').write_text(json.dumps(evidence,indent=2)+'\n');return evidence
if __name__=='__main__':print(json.dumps(apply(sys.argv[1],sys.argv[2]),indent=2))
