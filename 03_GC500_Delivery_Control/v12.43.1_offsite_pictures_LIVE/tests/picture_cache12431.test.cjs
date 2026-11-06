/* Author: Andrew Fisher. Source-extracted picture lifetime tests; no browser or network. */
'use strict';
const fs = require('fs'), path = require('path'), vm = require('vm'), cp = require('child_process'), assert = require('assert');
const root = path.resolve(__dirname, '..'), input = process.argv[2];
if (!input) throw Error('Usage: node tests/picture_cache12431.test.cjs SOURCE_HTML');
let source = fs.readFileSync(input, 'utf8');
const replacements = JSON.parse(cp.execFileSync('python3', [path.join(root, 'picture_cache12431.py')], {encoding: 'utf8'}));
let checks = 0;
function check(value, why) { assert.ok(value, why); checks++; }
if (!source.includes('const PicCache12431 =')) for (const [a,b,label] of replacements) {
 check(source.split(a).length === 2, 'exact anchor: ' + label); source = source.replace(a,b);
}
check(source.includes('PicCache12431.remember(id, L); const url = PicCache12431.get(id);'), 'render tracks moved coordinates and touches cache');
check(source.includes(fs.readFileSync(path.join(root,'picture_cache12431.js'),'utf8').trim()), 'integrated helper matches reviewed source exactly');
const start = source.indexOf('const PIC = new Map(), PFAIL = new Map(), PQ = [], FLY = new Set(); let pbusy = 0;');
const end = source.indexOf('function picsState()', start);
check(start >= 0 && end > start, 'extract actual Singles1238 picture implementation');
const code = source.slice(start,end) + '\nglobalThis.TEST={PIC,PFAIL,PQ,FLY,LBY,PicCache12431,picId,show,want,pump,arm,drawPic,busy:()=>pbusy};';
class Classes { constructor(...xs) { this.s = new Set(xs); } contains(x) { return this.s.has(x); } add(x) { this.s.add(x); } remove(x) { this.s.delete(x); } }
function fixture() {
 const revoked = [], created = [], calls = [], timers = [], observers = [], mutations = [], deferred = [], delayed = new Set(), failures = new Set(), listeners = {};
 const doc = {hidden: false, visibilityState: 'visible', cards: [], body: {}, addEventListener(t,f) { (listeners[t] ||= []).push(f); }};
 const pane = {id: 'pane-demob', hidden: false, classList: new Classes('on'), parentElement: doc.body, querySelectorAll() { return doc.cards.filter(a=>a.isConnected); }};
 doc.getElementById = id => id === pane.id ? pane : null;
 doc.querySelectorAll = selector => doc.cards.filter(a=>a.isConnected).flatMap(a=>a.imgs.filter(im=>im.isConnected)).filter(im => !selector.includes(':not(.on)') || !im.classList.contains('on'));
 doc.createElement = tag => { assert.equal(tag,'canvas'); return {getContext:()=>({drawImage(){}}), toBlob(fn){fn({size:100,type:'image/jpeg'});}}; };
 class IO { constructor(fn,options){this.fn=fn;this.options=options;this.targets=new Set();observers.push(this);} observe(a){this.targets.add(a);} unobserve(a){this.targets.delete(a);} disconnect(){this.targets.clear();} emit(es){this.fn(es.map(([target,isIntersecting])=>({target,isIntersecting})));} }
 class MO { constructor(fn){this.fn=fn;mutations.push(this);} observe(){} disconnect(){} }
 const urls = {createObjectURL(){const u='blob:synthetic-'+(created.length+1);created.push(u);return u;},revokeObjectURL(u){revoked.push(u);}};
 const W = {URL:urls,IntersectionObserver:IO,MutationObserver:MO,setTimeout(fn){timers.push(fn);return timers.length;}};
 const context = {D:doc,W,URL:urls,Map,Set,Date,Promise,console,getComputedStyle:()=>({overflowY:'visible'}),
  Image:class {constructor(){this.naturalWidth=1000;this.naturalHeight=824;}set src(value){queueMicrotask(()=>this.onload());}},
  Find1176:{VIEWS:['close','wide','site'].map(key=>({key})),picture(L,V){calls.push(L.label+'|'+V.key);if(failures.has(L.label))return Promise.reject(Error('synthetic picture failure'));if(delayed.has(L.label))return new Promise(resolve=>deferred.push({L,V,resolve}));return Promise.resolve({dataUrl:'data:image/jpeg;base64,AA=='});}}};
 vm.createContext(context);vm.runInContext(code,context,{filename:'source-extracted-singles1238-pictures.js'});
 const T = context.TEST;
 function card(key,lat=1,label=key) {
  const a={key,nodeType:1,isConnected:true,hidden:false,imgs:[],closest(sel){return sel==='[hidden]'&&this.hidden?this:null;},querySelectorAll(){return this.imgs.filter(im=>im.isConnected);},querySelector(){return this.imgs.find(im=>im.isConnected)||null;},matches(sel){return sel.includes('article.sg1238');}};
  for (const v of ['close','wide','site']) {
   const L={label,lat,lon:2},id=T.picId({key},v,L),attrs=new Map([['data-pi1238',id]]);
   const frame={wait:true,message:false,querySelector(sel){if(sel==='.w1238'&&this.wait)return{remove:()=>{this.wait=false;}};if(sel==='.nm1238'&&this.message)return{};return null;},insertAdjacentHTML(where,html){if(html.includes('w1238'))this.wait=true;if(html.includes('nm1238'))this.message=true;}};
   const im={nodeType:1,isConnected:true,parentNode:frame,classList:new Classes(),currentSrc:'',getAttribute(k){return attrs.get(k)||null;},removeAttribute(k){attrs.delete(k);if(k==='src')this.currentSrc='';},closest(sel){return sel==='article.sg1238'?a:null;},remove(){this.isConnected=false;},matches(sel){return sel.includes('img[data-pi1238]');}};
   Object.defineProperty(im,'src',{get(){return attrs.get('src')||'';},set(u){attrs.set('src',u);im.currentSrc=u;}});
   a.imgs.push(im);T.PicCache12431.remember(id,L);
  }
  doc.cards.push(a);return a;
 }
 function detach(a){a.isConnected=false;a.imgs.forEach(im=>im.isConnected=false);}
 function index(){T.PicCache12431.arm(null);return observers.at(-1);}
 function fire(t,ev={}){for(const fn of listeners[t]||[])fn(ev);}
 async function settle(){for(let i=0;i<4;i++){while(timers.length)timers.shift()();await new Promise(setImmediate);}}
 function resolveDraws(){for(const d of deferred.splice(0))d.resolve({dataUrl:'data:image/jpeg;base64,AA=='});}
 return {T,doc,pane,W,card,detach,index,settle,fire,resolveDraws,created,revoked,calls,observers,mutations,deferred,delayed,failures};
}
(async()=>{
 // The budget applies while scrolling through a large connected list; returning reloads evicted pictures.
 const f=fixture(), cards=Array.from({length:110},(_,i)=>f.card('A'+i));let io=f.index();
 io.emit(cards.map(a=>[a,false]));
 for(let i=0;i<cards.length;i++){
  io.emit((i?[[cards[i-1],false]]:[]).concat([[cards[i],true]]));await f.settle();
  check(f.T.PIC.size<=96,'96-entry budget after scroll '+i);
  check(cards[i].imgs.every(im=>im.src&&!f.revoked.includes(im.src)),'visible sources survive scroll '+i);
 }
 check(io.targets.size===110,'continuous IO keeps cards observed after first entry');
 check(cards[0].imgs.every(im=>!im.src&&!im.classList.contains('on')),'eviction resets offscreen images for re-entry');
 const before=f.calls.length;io.emit([[cards[109],false],[cards[0],true]]);await f.settle();
 check(f.calls.length===before+3&&cards[0].imgs.every(im=>im.classList.contains('on')),'re-entry redraws all three evicted pictures');
 check(f.T.PIC.size<=96,'re-entry stays within budget');
 check(new Set(f.revoked).size===f.revoked.length,'each old URL revoked once');
 // Multiple unit cards at the same reference share one draw and retain that URL while either card is near.
 const d=fixture(), d1=d.card('SAME'),d2=d.card('SAME');io=d.index();io.emit([[d1,true],[d2,true]]);await d.settle();
 check(d.calls.length===3&&d.T.PIC.size===3,'shared reference draws once per view');
 check(d1.imgs.every((im,i)=>im.src===d2.imgs[i].src),'shared reference uses identical URLs');
 io.emit([[d1,false],[d2,true]]);d.T.PicCache12431.sweep();check(d.revoked.length===0,'second visible unit protects shared sources');
 // A pin change keeps the displayed old URLs until the old DOM is replaced, then reclaims them.
 const m=fixture(), old=m.card('MOVE',1);io=m.index();io.emit([[old,true]]);await m.settle();const oldUrls=old.imgs.map(im=>im.src);
 const moved=m.card('MOVE',3);m.T.PicCache12431.sweep();check(oldUrls.every(u=>!m.revoked.includes(u)),'old displayed coordinates protected before DOM replacement');
 m.detach(old);io=m.index();io.emit([[moved,true]]);await m.settle();
 check(oldUrls.every(u=>m.revoked.includes(u)),'superseded coordinate URLs reclaimed');
 check(m.T.PIC.size===3&&m.T.LBY.size===3,'old coordinate cache and location metadata removed: '+JSON.stringify({pics:[...m.T.PIC.keys()],loc:[...m.T.LBY.keys()]}));
 // A changed coordinate may finish after rerender. It must not enter the new card or survive as obsolete cache.
 const r=fixture();r.delayed.add('old');const ro=r.card('RACE',1,'old');io=r.index();io.emit([[ro,true]]);
 check(r.T.FLY.size===3&&r.T.busy()===3,'three native draws remain in flight');
 const rn=r.card('RACE',4,'new');r.detach(ro);io=r.index();io.emit([[rn,true]]);
 check(r.T.LBY.size===6,'in-flight old coordinate metadata retained until completion');
 r.resolveDraws();await r.settle();
 check(r.revoked.length===3&&r.T.PIC.size===3&&r.T.LBY.size===3,'late obsolete results reclaimed after in-flight release');
 check(rn.imgs.every(im=>im.src&&!r.revoked.includes(im.src)),'new moved card uses live URLs');
 // Hiding the pane cancels queued work and does not write returned images into the hidden cards.
 const h=fixture();h.delayed.add('hold');const hs=[h.card('H1',1,'hold'),h.card('H2',1,'hold')];io=h.index();io.emit(hs.map(a=>[a,true]));
 check(h.T.FLY.size===3&&h.T.PQ.length===3,'queue obeys three-draw concurrency');h.pane.classList.remove('on');h.T.PicCache12431.sweep();
 check(h.T.PQ.length===0&&h.T.FLY.size===3,'pane hide drops queued work and preserves in-flight jobs');
 h.resolveDraws();await h.settle();check(h.calls.length===3&&hs.every(a=>a.imgs.every(im=>!im.src)),'hidden completion does not paint or start queued jobs');
 h.delayed.clear();h.pane.classList.add('on');h.index();await h.settle();check(hs.every(a=>a.imgs.every(im=>im.src)),'pane return resumes cached and missing pictures');
 // Old IO callbacks cannot reactivate stale roots after a scroller changes.
 const q=fixture(), qa=q.card('ROOT');const prior=q.index();prior.emit([[qa,true]]);await q.settle();q.T.PicCache12431.arm({id:'new-scroll-root'});const current=q.observers.at(-1);
 current.emit([[qa,false]]);prior.emit([[qa,true]]);check(!q.T.PicCache12431.wanted(qa.imgs[0].getAttribute('data-pi1238')),'stale old-root callback ignored');
 current.emit([[qa,true]]);check(q.T.PicCache12431.wanted(qa.imgs[0].getAttribute('data-pi1238')),'new-root callback reactivates card');
 // Background-tab work is deferred, and an unrelated share/download URL is never in the owned cache.
 const share=q.W.URL.createObjectURL({type:'share-file'});q.doc.hidden=true;q.fire('visibilitychange');await q.settle();
 check(!q.T.PicCache12431.wanted(qa.imgs[0].getAttribute('data-pi1238')),'background document blocks draw demand');
 q.doc.hidden=false;q.fire('visibilitychange');await q.settle();check(!q.revoked.includes(share),'independent share URL untouched');
 const id=qa.imgs[0].getAttribute('data-pi1238'),held=q.T.PIC.get(id),duplicate=q.W.URL.createObjectURL({});q.T.PicCache12431.put(id,duplicate);
 check(q.T.PIC.get(id)===held&&q.revoked.includes(duplicate)&&!q.revoked.includes(held),'duplicate completion preserves displayed URL');
 // A decoding image may still expose its old currentSrc while its new src is set.
 const c=fixture(), ca=c.card('DECODE');io=c.index();io.emit([[ca,true]]);await c.settle();const cid=ca.imgs[0].getAttribute('data-pi1238'),currentUrl=ca.imgs[0].src,orphan='a|DECODE|0.000000,2.000000|close';
 c.T.PIC.set(orphan,'blob:old-decoding');ca.imgs[0].currentSrc='blob:old-decoding';c.T.PicCache12431.remember(orphan,{label:'prior'});c.T.PicCache12431.remember(cid,{label:'now'});c.T.PicCache12431.sweep();
 check(!c.revoked.includes('blob:old-decoding'),'currentSrc protects old image during replacement decode');ca.imgs[0].currentSrc=currentUrl;c.fire('load',{target:ca.imgs[0]});await c.settle();
 check(c.revoked.includes('blob:old-decoding')&&!c.revoked.includes(currentUrl),'load completion releases old decoding URL');
 // Mutation callbacks reindex removed/replaced image nodes, and filtered cards do not keep requesting.
 const z=fixture(), za=z.card('MUTATION');io=z.index();io.emit([[za,true]]);await z.settle();za.hidden=true;
 z.mutations.at(-1).fn([{type:'attributes',target:za,attributeName:'hidden'}]);await z.settle();
 check(!z.T.PicCache12431.wanted(za.imgs[0].getAttribute('data-pi1238')),'filter hidden attribute blocks card demand');
 z.detach(za);z.mutations.at(-1).fn([{type:'childList',target:z.pane,addedNodes:[],removedNodes:[za]}]);await z.settle();
 check(io.targets.size===0,'removed card mutation releases observer target');
 const zb=z.card('MUTATION',6);z.mutations.at(-1).fn([{type:'childList',target:z.pane,addedNodes:[zb.imgs[0]],removedNodes:[]}]);await z.settle();io.emit([[zb,true]]);await z.settle();
 check(zb.imgs.every(im=>im.src)&&z.T.PIC.size===3,'image insertion mutation reindexes replacement coordinates');
 // Failures retain the existing cooldown/placeholder and never leak an in-flight slot.
 const er=fixture();er.failures.add('bad');const ec=er.card('ERROR',1,'bad');io=er.index();io.emit([[ec,true]]);await er.settle();
 check(er.T.FLY.size===0&&er.T.busy()===0&&er.T.PFAIL.size===3,'failed source draws release concurrency and keep cooldown');
 check(ec.imgs.every(im=>!im.isConnected&&im.parentNode.message),'native failure placeholder remains available');
 for(let i=0;i<120;i++)er.T.PFAIL.set('unused-'+i,Date.now());er.T.PicCache12431.sweep();check(er.T.PFAIL.size<=96,'failure metadata bounded');
 for(const key of er.T.PFAIL.keys())er.T.PFAIL.set(key,0);er.T.PicCache12431.sweep();check(er.T.PFAIL.size===0,'expired failure metadata reclaimed');
 console.log(JSON.stringify({author:'Andrew Fisher',checks,passed:true,source:path.basename(input),scope:'source-extracted cache/queue/observer lifecycle; no browser or network'}));
})().catch(e=>{console.error(e.stack);process.exitCode=1;});
