#!/usr/bin/env python3
"""Author: Andrew Fisher. Exact-source quantity text on the existing map boxes."""
from pathlib import Path
import hashlib,json,sys
HERE=Path(__file__).resolve().parent
sys.path.insert(0,str(HERE.parents[1]/'toolchain'))
from rep import rep as once
BASE={'explorer.js':'3ced06d864cd1e060c76cb7f7841c66f942c1194e676892f29a9430782ca36a1','explorer-merge.js':'00f88dcf8d18529cc1a20ab6c729a5921a7d87ff65d411d9bc92c7ceef2c7ac3','index.html':'00a0075219d89ef8d2fd95513e9e84c164dca5a53ae0b4de160288977575cbfe'}
def rep(text,old,new):return once(text,old,new,'v10.10 map quantities','explorer')
def apply(source,output):
 source,output=Path(source),Path(output);original={name:(source/name).read_bytes() for name in BASE}
 for name,raw in original.items():
  if hashlib.sha256(raw).hexdigest()!=BASE[name]:raise ValueError('Wrong source or already patched: '+name)
 js=original['explorer.js'].decode()
 js=rep(js,'const MAP1009_STATES = Object.freeze({',(HERE/'map_quantity1010.js').read_text()+'\nconst MAP1009_STATES = Object.freeze({')
 js=rep(js,'return Object.assign({state}, model, {label,detail:available && row && typeof row.label === \'string\' ? row.label : label});', 'return Object.assign({state}, model, {label,detail:available && row && typeof row.label === \'string\' ? row.label : label,quantity1010:quantity1010View(row&&row.quantity,state,available)});')
 js=rep(js,'else rows.set(key, {key,state:row.state,label:row.label});','else rows.set(key, {key,state:row.state,label:row.label,quantity:row.quantity||null});')
 old="selected.code + ' · ' + status.label + (status.detail.toLowerCase() !== status.label.toLowerCase() ? ' · ' + status.detail : '')"
 new="referenceQuantity1010(selected,status)+' · '+status.label+(status.quantity1010.summary?' · '+status.quantity1010.summary:'')+(status.quantity1010.items.length?' · '+(status.quantity1010.items.length===1?status.quantity1010.items[0].item:status.quantity1010.all.join(' · ')):'')+(status.detail.toLowerCase()!==status.label.toLowerCase()?' · '+status.detail:'')"
 js=rep(js,old,new)
 js=rep(js,"'+mapGlyph1009(status)+' '+esc(status.label)+'</em>'", "'+mapGlyph1009(status)+' '+quantity1010Html(status)+'</em>'")
 begin=js.index('function label1009(ctx, it, c, r, selected1009, colour) {');end=js.index('window.GC500MapCompletion1009=',begin)
 label='''function label1009(ctx,it,c,r,selected1009,colour){
 const sharedStatus=mapStatus1009(it),status=selected1009&&sharedStatus,q=status&&status.quantity1010,pad=8*dpr,maxWidth=Math.min(300*dpr,canvas.width-8*dpr);
 const statusText=status?status.label.toUpperCase()+(q.summary?' · '+q.summary:''):'';
 const quantityLines=status&&!q.summary?q.lines.slice(0,3):[];
 ctx.save();ctx.font=`800 ${12*dpr}px Inter,sans-serif`;const reference=fitReference1010(it,sharedStatus,maxWidth-pad*2,text=>textWidth887(ctx,text)),main=textWidth887(ctx,reference);
 ctx.font=`800 ${10*dpr}px Inter,sans-serif`;const sub=textWidth887(ctx,statusText),more=quantityLines.map(line=>textWidth887(ctx,line));
 const w=Math.min(maxWidth,Math.max(main,sub,...more)+pad*2),h=(status?40+quantityLines.length*14:20)*dpr;
 const x=Math.min(Math.max(4*dpr,c.x+r*.75),canvas.width-w-4*dpr),y=Math.min(Math.max(4*dpr,c.y-r*.75-h-8*dpr),canvas.height-h-4*dpr);
 ctx.fillStyle='#101c23';ctx.strokeStyle=selected1009?'#ff821f':colour;ctx.lineWidth=(selected1009?2:1)*dpr;ctx.beginPath();ctx.roundRect(x,y,w,h,5*dpr);ctx.fill();ctx.stroke();
 labelBounds1010.push({it,x:x/dpr,y:y/dpr,w:w/dpr,h:h/dpr});
 ctx.textAlign='left';ctx.textBaseline='middle';ctx.font=`800 ${12*dpr}px Inter,sans-serif`;ctx.fillStyle='#fff';ctx.fillText(reference,x+pad,y+(status?12:10)*dpr);
 if(status){ctx.font=`800 ${10*dpr}px Inter,sans-serif`;ctx.fillStyle=status.colour;ctx.fillText(statusText,x+pad,y+28*dpr);
  ctx.font=`600 ${10*dpr}px Inter,sans-serif`;ctx.fillStyle='#e0e7ed';quantityLines.forEach((line,i)=>{let text=line;while(text.length>1&&textWidth887(ctx,text)>w-pad*2)text=text.slice(0,-1);if(text!==line)text=text.slice(0,-1)+'…';ctx.fillText(text,x+pad,y+(43+i*14)*dpr);});}
 ctx.restore();
}
'''
 js=rep(js,js[begin:end],label)
 js=rep(js,'function drawMarks(v) {\n  const dn', 'function drawMarks(v) {\n  labelBounds1010=[];\n  const dn')
 hit_start=js.index('function markAt(x, y) {');hit_end=js.index('/* search on the drawing',hit_start);hit=js[hit_start:hit_end]
 js=rep(js,hit,hit.replace('return best && best.m; }','return best && best.m || labelHit1010(x,y); }'))
 style='\n(()=>{const style=document.createElement(\'style\');style.id=\'quantity1010-style\';style.textContent='+json.dumps((HERE/'quantity1010.css').read_text())+';document.head.appendChild(style);})();\n'
 js=rep(js,'let marksDrawn = false;',style+'let marksDrawn = false;')
 merge=original['explorer-merge.js'].decode()
 merge=rep(merge,'      ${lines887}\n',"      ${typeof quantity1010Card==='function'?quantity1010Card(it):''}\n      ${lines887}\n")
 merge=rep(merge,'    card(lastCode); el.scrollTop = scroll;',"""    const quantities=el.querySelector('.map1010-quantities'),quantityOpen=quantities?quantities.open:null,quantityFocus=!!(quantities&&focus===quantities.querySelector('summary'));
    card(lastCode);
    const nextQuantity=el.querySelector('.map1010-quantities');if(nextQuantity&&quantityOpen!==null){nextQuantity.open=quantityOpen;if(quantityFocus)nextQuantity.querySelector('summary').focus({preventScroll:true});}
    el.scrollTop = scroll;""")
 changed={'explorer.js':js.encode(),'explorer-merge.js':merge.encode()};index=original['index.html'].decode()
 for name,raw in changed.items():index=rep(index,name+'?v='+BASE[name][:12],name+'?v='+hashlib.sha256(raw).hexdigest()[:12])
 changed['index.html']=index.encode();output.mkdir(parents=True,exist_ok=True);evidence={'author':'Andrew Fisher','changedFiles':{}}
 for name,raw in changed.items():
  (output/name).write_bytes(raw);evidence['changedFiles']['explorer/'+name]={'base':BASE[name],'candidate':hashlib.sha256(raw).hexdigest(),'bytes':len(raw)}
 (HERE/'evidence').mkdir(exist_ok=True);(HERE/'evidence/source-bound.json').write_text(json.dumps(evidence,indent=2)+'\n');return evidence
if __name__=='__main__':print(json.dumps(apply(sys.argv[1],sys.argv[2]),indent=2))
