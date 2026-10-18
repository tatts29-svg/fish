/* Author: Andrew Fisher. Deferred decorative artwork preserves visible, focus, refresh and print behavior. */
'use strict';
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict');
const source=fs.readFileSync(path.join(__dirname,'..','build_art1066_src.js'),'utf8');
let checks=0;const check=(x,why)=>{assert.ok(x,why);checks++;};
function rig(withObserver){
 const trace=[],observers=[],documentEvents={},windowEvents={},frames=[];
 const cards=[-1000,0,420,840,1260].map((left,i)=>{
  const slot={dataset:{bc1066Sky:['rain','sun','cloud','part','storm'][i],bc1066Ready:'false'},html:''};
  Object.defineProperty(slot,'innerHTML',{get(){return this.html;},set(v){trace.push('write:'+i);this.html=v;}});
  return {slot,left,isConnected:true,getBoundingClientRect(){trace.push('read:'+i);return {left:this.left,right:this.left+400,width:400,height:700};},querySelectorAll(){return [this.slot];},closest(){return this;}};
 });
 const strip={events:{},width:400,getBoundingClientRect(){trace.push('read:strip');return {left:0,right:this.width,width:this.width,height:this.width?720:0};},querySelectorAll(){return cards;},addEventListener(n,f){this.events[n]=f;}};
 const pane={querySelector(){return strip;}},doc={hidden:false,querySelectorAll(){return cards;},getElementById(){return pane;},addEventListener(n,f){documentEvents[n]=f;}};
 const ctx=vm.createContext({document:doc,window:{addEventListener(n,f){windowEvents[n]=f;}},WX818:{art(kind,flag){check(flag===false,'original weather-art argument retained');return '<svg>'+kind+'</svg>';}},active:()=>ctx.activeFlag,requestAnimationFrame:f=>(frames.push(f),frames.length),cancelAnimationFrame:id=>{frames[id-1]=null;},activeFlag:true});
 if(withObserver)ctx.IntersectionObserver=class{constructor(fn,options){this.fn=fn;this.options=options;this.targets=[];observers.push(this);}observe(x){this.targets.push(x);}disconnect(){this.disconnected=true;}};
 vm.runInContext(source+'\nthis.api={artMount1066,flushArt1066,stopArt1066};',ctx);
 return {ctx,cards,strip,pane,doc,trace,observers,documentEvents,windowEvents,frames};
}
for(const observed of [true,false]){
 const r=rig(observed),{ctx,cards,strip,pane,doc,trace}=r;
 doc.hidden=true;ctx.api.artMount1066(pane);check(cards.every(x=>x.slot.html===''),'hidden page does not warm artwork');
 doc.hidden=false;strip.width=0;ctx.api.artMount1066(pane);check(cards.every(x=>x.slot.html===''),'loading CSS with zero geometry does not mount every artwork');strip.width=400;ctx.api.artMount1066(pane);
 check(cards[1].slot.html==='<svg>sun</svg>'&&cards[2].slot.html==='<svg>cloud</svg>','viewport and next card use exact weather artwork');
 check(!cards[0].slot.html&&!cards[3].slot.html&&!cards[4].slot.html,'distant artwork stays unmounted');
 check(trace.slice(trace.findIndex(x=>x.startsWith('write:'))).every(x=>!x.startsWith('read:')),'viewport geometry is read before SVG writes');
 const before=trace.filter(x=>x.startsWith('write:')).length;ctx.api.artMount1066(pane);check(trace.filter(x=>x.startsWith('write:')).length===before,'unchanged mount does not replace visible SVGs');
 strip.events.focusin({target:cards[4]});check(cards[4].slot.html==='<svg>storm</svg>','keyboard focus hydrates exact card before focus paint');
 if(observed){
  const ob=r.observers[0];check(ob.options.root===strip&&ob.targets.length===cards.length,'observer is rooted to the horizontal strip');
  ob.fn([{target:cards[0],isIntersecting:true,intersectionRect:{width:0,height:0}}]);check(!cards[0].slot.html,'zero-area intersection does not warm hidden artwork');
  ob.fn([{target:cards[3],isIntersecting:true,intersectionRect:{width:100,height:100}}]);check(cards[3].slot.html==='<svg>part</svg>','swiping into observer margin hydrates artwork');
  doc.hidden=true;ob.fn([{target:cards[0],isIntersecting:true,intersectionRect:{width:100,height:100}}]);check(!cards[0].slot.html,'hidden observer delivery does no work');doc.hidden=false;
 }else{
  check(typeof strip.events.scroll==='function','fallback observes strip scroll');
  strip.events.scroll();strip.events.scroll();check(r.frames.length===1,'fallback scroll is frame-coalesced');r.frames[0]();
 }
 cards[1].slot.dataset.bc1066Ready='false';cards[1].slot.dataset.bc1066Sky='rain';ctx.api.artMount1066(pane);check(cards[1].slot.html==='<svg>rain</svg>','changed visible weather refreshes immediately');
 cards[0].left=0;ctx.api.artMount1066(pane);check(cards[0].slot.html==='<svg>rain</svg>','reconciling a restored distant viewport fills its artwork synchronously');
 ctx.activeFlag=false;ctx.api.stopArt1066();check(!r.observers.length||r.observers[0].disconnected,'departure releases observer');
 if(observed){ctx.activeFlag=true;cards[0].slot.html='';cards[0].slot.dataset.bc1066Ready='false';r.observers[0].fn([{target:cards[0],isIntersecting:true,intersectionRect:{width:100,height:100}}]);check(!cards[0].slot.html,'obsolete observer callback cannot hydrate a departed strip');}
 doc.hidden=true;ctx.api.flushArt1066();check(cards.every(x=>x.slot.dataset.bc1066Ready==='true'&&x.slot.html==='<svg>'+x.slot.dataset.bc1066Sky+'</svg>'),'print synchronously materializes every original artwork even while hidden');
}
console.log(JSON.stringify({author:'Andrew Fisher',checks,passed:true}));
