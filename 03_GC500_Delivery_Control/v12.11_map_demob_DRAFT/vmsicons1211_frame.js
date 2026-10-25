/* Author: Andrew Fisher. Crisp numbered VMS signs; shared pins remain exact with separate, linked labels. */
function vmsIcons1211(){
 'use strict';
 const root=document.createElement('div');root.id='vmsicons1211';root.setAttribute('aria-label','VMS board map markers');stage.appendChild(root);
 const css=document.createElement('style');css.textContent=`#vmsicons1211{position:absolute;inset:0;z-index:8;pointer-events:none;overflow:hidden}#vmsicons1211>svg{position:absolute;inset:0;width:100%;height:100%;overflow:visible}#vmsicons1211 button{position:absolute;width:76px;height:64px;padding:0;border:0;background:transparent;box-shadow:none;pointer-events:auto;cursor:pointer;color:white;display:flex;flex-direction:column;align-items:center;justify-content:flex-start;gap:0;filter:drop-shadow(0 2px 2px #000a)}#vmsicons1211 button>svg{width:44px;height:40px;flex-shrink:0}#vmsicons1211 button b{font:800 12px/18px Inter,sans-serif;white-space:nowrap;padding:0 5px;border:1px solid white;border-radius:4px;background:#121923;color:#ffe28a}#vmsicons1211 button:focus-visible{outline:3px solid #fff;outline-offset:2px}#vmsicons1211 button[aria-pressed=true] b{background:#e95700;color:white}#vmsicons1211 button[data-departed=true] b{background:#075239;color:white}#vmsicons1211 button small{font:800 9px/12px Inter,sans-serif;background:#075239;padding:0 3px;border-radius:2px}`;document.head.appendChild(css);
 const NS='http://www.w3.org/2000/svg',lines=document.createElementNS(NS,'svg');lines.setAttribute('aria-hidden','true');root.appendChild(lines);let signature='',shown=[];
 const sign='<svg viewBox="0 0 44 40" aria-hidden="true"><path d="M13 28v7M31 28v7M8 36h28" fill="none" stroke="#fff" stroke-width="4"/><rect x="2" y="2" width="40" height="27" rx="4" fill="#131820" stroke="#fff" stroke-width="4"/><rect x="3" y="3" width="38" height="25" rx="3" fill="#131820" stroke="#ffbd37" stroke-width="2"/><path d="M9 10h16M9 15h23M9 20h16M25 9l7 6-7 6" fill="none" stroke="#ffca47" stroke-width="2.5" stroke-linecap="round" stroke-dasharray="1 4"/></svg>';
 function layout(points,w,h){
  const placed=[];for(const p of points){let best=null,score=Infinity;
   for(let row=0;row<5;row++)for(const dx of [0,-82,82,-164,164]){const x=Math.max(2,Math.min(w-78,p.x-38+dx)),y=Math.max(2,Math.min(h-66,p.y-66-row*68));const overlaps=placed.filter(q=>x<q.left+78&&x+78>q.left&&y<q.top+66&&y+66>q.top).length,s=overlaps*100000+Math.abs(dx)+row*80;
    if(s<score){score=s;best={...p,left:x,top:y};}}
   placed.push(best);
  }return placed;
 }
 function paint(v){
  const candidates=[...new Map(marks.map(m=>m.it).concat(selected?[selected]:[]).filter(it=>it.location1210?.kind==='vms').map(it=>[it.code,it])).values()].sort((a,b)=>a.code.localeCompare(b.code,undefined,{numeric:true}));
  const M=sheetToDevice(v.scale,sw,sh),points=[];
  for(const it of candidates)it.places.forEach((b,place)=>{const g=toGeo((b[0]+b[2])/2,(b[1]+b[3])/2),p=applyM(M,g.x,g.y);if(p.x<0||p.y<0||p.x>sw||p.y>sh)return;points.push({code:it.code,label:it.sourceLabel1210||it.code,place,x:p.x,y:p.y,selected:selected===it,departed:mapStatus1009(it)?.departure1211?.complete===true});});
  const next=JSON.stringify([sw,sh,points.map(p=>({...p,x:Math.round(p.x*10)/10,y:Math.round(p.y*10)/10}))]);if(next===signature)return;signature=next;shown=layout(points,sw,sh);root.querySelectorAll('button').forEach(b=>b.remove());lines.replaceChildren();
  for(const p of shown){const line=document.createElementNS(NS,'path');line.setAttribute('d','M'+(p.left+38)+' '+(p.top+58)+'L'+p.x+' '+p.y);line.setAttribute('stroke','#ffce56');line.setAttribute('stroke-width','2');lines.appendChild(line);const dot=document.createElementNS(NS,'circle');dot.setAttribute('cx',p.x);dot.setAttribute('cy',p.y);dot.setAttribute('r','3');dot.setAttribute('fill','#ffce56');dot.setAttribute('stroke','#111');lines.appendChild(dot);
   const button=document.createElement('button');button.type='button';button.dataset.vms1211=p.code;button.dataset.departed=String(p.departed);button.setAttribute('aria-label',p.label+(p.departed?' · left site':'')+' · show board location');button.setAttribute('aria-pressed',String(p.selected));button.style.left=p.left+'px';button.style.top=p.top+'px';button.innerHTML=sign;const label=document.createElement('b');label.textContent=p.label;button.appendChild(label);if(p.departed){const note=document.createElement('small');note.textContent='LEFT SITE';button.appendChild(note);}button.onclick=ev=>{ev.stopPropagation();GC500Search1210.select(p.code,p.place);};root.appendChild(button);
  }
 }
 const draw=drawMarks;drawMarks=function(v){const result=draw.apply(this,arguments);paint(v);return result;};
 window.GC500VmsIcons1211=Object.freeze({layout,get state(){return shown.map(p=>({...p}));}});requestPaint();
}
