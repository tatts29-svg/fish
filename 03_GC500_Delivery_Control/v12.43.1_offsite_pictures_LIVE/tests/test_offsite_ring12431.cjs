/* Author: Andrew Fisher. Source-extracted lifecycle checks with synthetic map points. */
'use strict';
const fs=require('fs'),path=require('path'),vm=require('vm'),assert=require('node:assert/strict');
const source=fs.readFileSync(path.join(__dirname,'../offsite_ring12431.js'),'utf8');
let checks=0;const same=(a,b,label)=>{assert.deepEqual(a,b,label);checks++;};
function rig(){
 const queue=new Map(),observers=[],parentObservers=[],mutations=[],docEvents={},hostEvents={},winEvents={},mediaEvents={};
 let next=1,arcs=[],dashes=[],clears=0;
 const g={setTransform(){},clearRect(){clears++;},save(){},restore(){},beginPath(){},stroke(){},arc(...a){arcs.push(a)},setLineDash(a){dashes.push(a)}};
 const canvas={width:500,height:300,style:{},setAttribute(){},getContext(){return g}};
 const cls=new Set(),parentFrame={ownerDocument:null};
 const hostDoc={hidden:false,defaultView:{IntersectionObserver:class{constructor(cb){this.cb=cb;parentObservers.push(this)}observe(el){this.el=el}disconnect(){this.disconnected=true}}},addEventListener:(name,fn)=>hostEvents[name]=fn,removeEventListener:name=>delete hostEvents[name]};parentFrame.ownerDocument=hostDoc;
 const document={hidden:false,body:{classList:{contains:key=>cls.has(key)}},head:{appendChild(){}},createElement:kind=>kind==='canvas'?canvas:{},addEventListener:(name,fn)=>docEvents[name]=fn};
 const media={matches:false,addEventListener:(name,fn)=>mediaEvents[name]=fn};
 const ctx={document,window:{frameElement:parentFrame,addEventListener:(name,fn)=>winEvents[name]=fn},mcanvas:{width:500,height:300,parentNode:{insertBefore(){}},nextSibling:null},dpr:2,
  matchMedia:()=>media,IntersectionObserver:class{constructor(cb){this.cb=cb;observers.push(this)}observe(el){this.el=el}disconnect(){this.disconnected=true}},MutationObserver:class{constructor(cb){this.cb=cb;mutations.push(this)}observe(){}disconnect(){this.disconnected=true}},
  requestAnimationFrame:cb=>{const id=next++;queue.set(id,cb);return id},cancelAnimationFrame:id=>queue.delete(id)};
 vm.createContext(ctx);const api=vm.runInContext(source,ctx);
 const pulse=t=>{const jobs=[...queue];queue.clear();for(const [id,cb]of jobs)cb(t)};
 const own=(on)=>observers[0].cb([{target:canvas,isIntersecting:on,intersectionRatio:on?1:0}]);
 const host=(on)=>parentObservers[0].cb([{target:parentFrame,isIntersecting:on,intersectionRatio:on?1:0}]);
 const reset=()=>{arcs=[];dashes=[];clears=0};
 return {api,ctx,cls,document,hostDoc,media,queue,pulse,own,host,reset,docEvents,hostEvents,winEvents,mediaEvents,mutations,observers,parentObservers,get arcs(){return arcs},get dashes(){return dashes},get clears(){return clears}};
}
const r=rig(),off=[{x:50,y:60,kind:'off'}],part=[{x:50,y:60,kind:'part'}];
r.api.set(off,.07);same(r.queue.size,0,'unobserved canvas cannot start animation');r.own(true);same(r.queue.size,0,'hidden host frame cannot start animation');r.host(true);same(r.queue.size,1,'visible canvas and host schedule one frame');
r.reset();r.pulse(900);same(r.arcs.length,3,'full departure has base border, steady ring and pulse');same(r.queue.size,1,'full departure continues one pulse loop');same(r.api.radius,10,'whole-plan radius is 5 CSS px');
r.api.set(off,99);same(r.api.radius,32,'zoomed radius capped at16 CSS px');same(r.queue.size,1,'set while active does not duplicate rAF');
for(const mode of ['in3d','fencing-map']){r.cls.add(mode);r.mutations[0].cb();same(r.queue.size,0,mode+' cancels pending animation');r.reset();r.pulse(1200);same(r.arcs.length,0,mode+' does not paint rings');r.api.set(off,.07);same(r.queue.size,0,mode+' set does not schedule');r.cls.delete(mode);r.mutations[0].cb();same(r.queue.size,1,mode+' exit resumes visible ring');}
r.host(false);same(r.queue.size,0,'offscreen parent iframe cancels loop');r.reset();r.pulse(1500);same(r.arcs.length,0,'offscreen parent iframe does not paint');r.api.set(off,.07);same(r.queue.size,0,'offscreen updates remain dormant');r.host(true);same(r.queue.size,1,'parent iframe reentry resumes');
r.own(false);same(r.queue.size,0,'offscreen canvas cancels loop');r.own(true);same(r.queue.size,1,'canvas reentry resumes');
r.document.hidden=true;r.docEvents.visibilitychange();same(r.queue.size,0,'hidden frame document stops');r.document.hidden=false;r.docEvents.visibilitychange();same(r.queue.size,1,'visible frame document resumes');
r.hostDoc.hidden=true;r.hostEvents.visibilitychange();same(r.queue.size,0,'hidden host document stops');r.hostDoc.hidden=false;r.hostEvents.visibilitychange();same(r.queue.size,1,'visible host document resumes');
r.media.matches=true;r.mediaEvents.change();r.reset();r.pulse(900);same(r.arcs.length,2,'reduced motion keeps steady ring without pulse');same(r.queue.size,0,'reduced motion has no continuous rAF');
r.media.matches=false;r.api.set(part,.07);r.reset();r.pulse(900);same(r.arcs.length,2,'partial departure stays a steady ring');same(r.queue.size,0,'partial-only layer has no continuous rAF');same(r.dashes.some(x=>x.length===2&&x[0]===8&&x[1]===6),true,'partial departure uses dashed stroke');
r.api.set(off,.07);r.reset();r.api.set([],.07);same(r.api.points.length,0,'empty state clears points');same(r.queue.size,0,'empty state cancels rAF');same(r.clears,1,'empty state clears old bitmap');
r.api.set(off,.07);r.winEvents.pagehide({persisted:true});same(r.queue.size,0,'pagehide stops animation');r.winEvents.pageshow();same(r.queue.size,1,'bfcache pageshow resumes');
// A mode switch before its mutation callback must still prevent the queued draw.
r.cls.add('in3d');r.reset();r.pulse(900);same(r.arcs.length,0,'frame checks mode before any draw');same(r.queue.size,0,'frame does not reschedule in hidden mode');
r.cls.delete('in3d');r.winEvents.pagehide({persisted:false});same([...r.observers,...r.parentObservers,...r.mutations].every(x=>x.disconnected),true,'unloaded iframe disconnects all observers');same(r.hostEvents.visibilitychange,undefined,'unloaded iframe removes host listener');r.winEvents.pageshow();same(r.queue.size,0,'disposed old frame cannot restart');
console.log(checks+' source-extracted offsite lifecycle checks PASS');
