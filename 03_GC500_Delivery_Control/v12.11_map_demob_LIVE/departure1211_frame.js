/* Author: Andrew Fisher. Departure flags come from the shared collection record, independently of installation ticks. */
function departureFrame1211(){
 const H=parent.Departure1211;let states=new Map();
 const key=it=>norm(it?.reg?.sourceRequest1017?it.reg.sourceKey1017:it?.code||'');
 const host=mapHostStatus1009;mapHostStatus1009=function(){const r=host.apply(this,arguments);states=new Map(H.mapStates().map(x=>[norm(x.key),x]));return r?{...r,states:r.states.map(x=>{const d=states.get(norm(x.key));return d?.collected?{...x,state:d.issues.length?'review':d.complete?'moved':'partial',label:x.label+' · '+d.label+' · '+d.last}:x;})}:r;};
 const get=mapStatus1009;mapStatus1009=function(it){const s=get.apply(this,arguments),d=states.get(key(it));if(!d?.collected)return s;
  const quantities={items:d.items.map(i=>({item:i.type,quantity:i.n}))};return {...s,quantity1010:quantity1010View(quantities,'moved',true),state:d.issues.length?'review':d.complete?'moved':'partial',label:d.label,detail:d.label+' · '+d.last+(d.unknown?' · other quantities unknown':''),shape:d.complete?'octagon':'diamond',glyph:d.complete?'↗':'↗',colour:d.issues.length?'#ffaaa3':'#7fffc1',fill:d.issues.length?'#742923':'#075239',departure1211:d};
 };
 for(const name of ['referenceQuantity1010','fitReference1010']){const old=window[name];window[name]=function(it,status){const d=states.get(key(it));return d?.collected?it.code+' · '+(d.issues.length?'review departure':d.complete?'LEFT SITE':d.remaining+' to leave'+(d.unknown?' + ?':'')):old.apply(this,arguments);};}
 const draw=drawMarks;drawMarks=function(v){const left=ITEMS.filter(it=>it.places.length&&states.get(key(it))?.collected);if(left.length)marksDrawn=true;const result=draw.apply(this,arguments);if(!left.length)return result;
  show(mcanvas,true);marksDrawn=true;const ctx=mctx,M=sheetToDevice(dpr*v.scale,canvas.width,canvas.height);ctx.save();ctx.setTransform(1,0,0,1,0,0);
  for(const it of left)for(const b of it.places){const p=toGeo((b[0]+b[2])/2,(b[1]+b[3])/2),c=applyM(M,p.x,p.y);if(c.x<0||c.y<0||c.x>canvas.width||c.y>canvas.height)continue;const d=states.get(key(it));
   ctx.fillStyle=d.issues.length?'#742923':'#075239';ctx.strokeStyle='#b5ffe0';ctx.lineWidth=2*dpr;ctx.beginPath();ctx.roundRect(c.x-28*dpr,c.y-22*dpr,56*dpr,19*dpr,4*dpr);ctx.fill();ctx.stroke();ctx.fillStyle='white';ctx.textAlign='center';ctx.textBaseline='middle';ctx.font='800 '+10*dpr+'px Inter,sans-serif';ctx.fillText(d.issues.length?'REVIEW':d.complete?'LEFT SITE':d.collected+' LEFT',c.x,c.y-12*dpr);
  }ctx.restore();return result;
 };
 complete897Pull();requestPaint();
 window.GC500Departure1211=Object.freeze({get state(){return [...states.values()].map(({key,collected,remaining,complete,label,last})=>({key,collected,remaining,complete,label,last}));},refresh:()=>{complete897Pull();requestPaint();}});
}
