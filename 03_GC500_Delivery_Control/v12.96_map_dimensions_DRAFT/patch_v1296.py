"""Author: Andrew Fisher. Available dimensions alongside map quantities."""
from pathlib import Path
import sys, hashlib
HERE=Path(__file__).resolve().parent
sys.path.insert(0,str(HERE.parent/'toolchain'))
from rep import rep
BASE='6f4f3a35ad52cc794bc0f8e696cae978cef23965d72e6bf53e45f1c017b0a35a'
def apply(s):
 if hashlib.sha256(s.encode()).hexdigest()!=BASE:raise ValueError('Requires exact live95 base')
 def r(a,b,label):
  nonlocal s
  s=rep(s,a,b,label,'dimensions')
 r('/* Author: Andrew Fisher. Read-only contents and photographs for the selected pickup references. */',(HERE/'dim1296_src.js').read_text()+'\n/* Author: Andrew Fisher. Read-only contents and photographs for the selected pickup references. */','shared size projection')
 r("const descriptions=status?.quantity1010?.all?.length?[...status.quantity1010.all]:[name];", "const descriptions=status?.quantity1010?.all?.length?[...status.quantity1010.all]:[name];\n   for(const row of parent.MapDimensions1296.read(code,false))for(const group of row.groups)if(group.basis)descriptions.push(row.type+' · '+group.basis+' '+group.text+' · each');",'map area descriptions')
 r(' function consent(){return !!panel.querySelector', ''' function size1296(r,it){
  const rows=parent.MapDimensions1296.read(r.key,true),row=rows.find(x=>x.type===it.type);
  return '<small class="dimensions1296">Dimensions per unit: '+(row?.groups?.length?row.groups.map(g=>e((row.groups.length>1?g.n+' × ':'')+(g.basis?g.basis+' ':'')+g.text)).join('<br>'):'To confirm')+'</small>';
 }
 function consent(){return !!panel.querySelector''','demob size formatter')
 r("+it.n+' remaining</b>'+it.units.map", "+it.n+' remaining</b>'+size1296(r,it)+it.units.map",'demob quantity dimensions')
 r("states=new Map(H.mapStates().map(x=>[norm(x.key),x]));", "states=parent.MapDimensions1296.batch(()=>new Map(H.mapStates().map(x=>[norm(x.key),{...x,dimension:parent.MapDimensions1296.compact(parent.MapDimensions1296.read(x.key,false))}])));",'cached departed dimensions')
 r("const common=on?{code:it.code", "const dimension=on?on.dimension:d?.dimension||'';\n   const common=on?{dimension,code:it.code",'map size lookup')
 r("wording:onsite.wording(on)}:{code:it.code", "wording:onsite.wording(on)}:{dimension,code:it.code",'departed size')
 r("const f=(small?9:10)*px,pad=5*px,h=(sub?29:19)*px;g.font='800 '+f+'px Inter,sans-serif';\n   const width=Math.max(g.measureText(label).width+2*pad,sub?(sub.length*4.5+10)*px:0),doorPoints=", "const f=(small?9:10)*px,pad=5*px,dim=!small?q.dimension||'':'',h=((sub?29:19)+(dim?13:0))*px;g.font='800 '+f+'px Inter,sans-serif';\n   const width=Math.min(cv.width-4*px,Math.max(g.measureText(label).width+2*pad,sub?(sub.length*4.5+10)*px:0,dim?(dim.length*4.4+10)*px:0)),doorPoints=",'size label box')
 r("if(sub){g.font='500 '+8*px+'px Inter,sans-serif';g.fillStyle='#c2d1d6';g.fillText(sub,box.x+box.w/2,box.y+21*px);}", "if(sub){g.font='500 '+8*px+'px Inter,sans-serif';g.fillStyle='#c2d1d6';g.fillText(sub,box.x+box.w/2,box.y+21*px);}\n   if(dim){g.font='600 '+8*px+'px Inter,sans-serif';g.fillStyle='#e5edf1';g.fillText(dim,box.x+box.w/2,box.y+(sub?34:22)*px,box.w-2*pad);}",'dimension subline')
 r("kind:q.kind,n:q.n,total:q.total,shape:q.shape", "kind:q.kind,n:q.n,total:q.total,dimension:q.dimension||'',shape:q.shape",'dimension inspection')
 r("quantityLabel:r.ref+' · '+wording(row(r.ref)),completionLabel", "quantityLabel:r.ref+' · '+wording(row(r.ref))+sizeSuffix1296(r.ref),completionLabel",'3D equipment label')
 # The existing two setPins paths must stay equivalent.
 a="n:(p.n||'')+' · '+wording(row(p.k))"
 if s.count(a)!=2:raise ValueError('Expected two 3D pin paths')
 s=s.replace(a,a+"+sizeSuffix1296(p.k)")
 r(' const clonePins=ps=>', " function sizeSuffix1296(key){const t=row(key)?.dimension;return t?' · '+t:'';}\n const clonePins=ps=>",'3D size suffix')
 r("const sig=JSON.stringify(next.map(r=>[r.key", "parent.MapDimensions1296.batch(()=>{for(const r of next){const sizes=parent.MapDimensions1296.read(r.key,true);r.dimension=parent.MapDimensions1296.compact(sizes);r.dimensionToken=JSON.stringify(sizes);}});const sig=JSON.stringify(next.map(r=>[r.key",'cached remaining dimensions')
 r("r.items.map(it=>it.places)]));", "r.items.map(it=>it.places),r.dimensionToken]));",'dimension refresh fingerprint')
 r("+' · v12.95';", "+' · v12.96';",'footer')
 return s
if __name__=='__main__':
 p=Path(sys.argv[1]);p.write_text(apply(p.read_text()))
