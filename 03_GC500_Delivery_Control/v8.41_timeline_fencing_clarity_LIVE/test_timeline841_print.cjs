/* Author: Andrew Fisher. Actual native print functions, synthetic DOM/records only; no network or browser. */
'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
if(!process.env.PAGE)throw new Error('Set PAGE to the built v8.41 hosted HTML to test.');
const html=fs.readFileSync(process.env.PAGE,'utf8');
function between(start,end){const a=html.indexOf(start),b=html.indexOf(end,a+start.length);assert.ok(a>=0&&b>a,'Built page contains '+start);return html.slice(a,b);}
const adapter=between('function timeline841MergeProof(','function ldLine(');
const native=between('function dpPrint(iso, doc, o){','function dayPrint(iso){');
const plain=x=>JSON.parse(JSON.stringify(x));
const deferred=()=>{let resolve,reject;const promise=new Promise((a,b)=>{resolve=a;reject=b;});return {promise,resolve,reject};};
const flush=async()=>{for(let i=0;i<24;i++)await Promise.resolve();};
const load=(kind,key)=>({kind,rows:[{a:{key}}]});
function fixture(options={}){
 const nodes=new Map(),calls=[],timers=[],events={},docs=[],checks=[],raw={},resolved={};
 let clock=0;
 class Element{
  constructor(tag){this.tagName=tag;this.dataset={};this.children=[];this.parts=new Map();this._id='';this._html='';this.style={setProperty(){},removeProperty(){}};const classes=new Set();this.classList={add:(...xs)=>xs.forEach(x=>classes.add(x)),remove:(...xs)=>xs.forEach(x=>classes.delete(x)),contains:x=>classes.has(x)};}
  set id(v){this._id=v;}get id(){return this._id;}
  set innerHTML(v){this._html=v;this.parts.clear();}get innerHTML(){return this._html;}
  appendChild(e){this.children.push(e);e.parentNode=this;if(e.id)nodes.set(e.id,e);return e;}
  remove(){if(nodes.get(this.id)===this)nodes.delete(this.id);this.removed=true;}
  setAttribute(){}addEventListener(){}
  querySelectorAll(){return [];}
  querySelector(sel){if(!this.parts.has(sel))this.parts.set(sel,new Element('synthetic'));return this.parts.get(sel);}
 }
 const document={body:new Element('body'),head:new Element('head'),fonts:{ready:options.fonts||Promise.resolve()},addEventListener(){},createElement:tag=>new Element(tag),getElementById:id=>nodes.get(id)||null,querySelectorAll:sel=>sel.startsWith('#')&&nodes.has(sel.slice(1))?[nodes.get(sel.slice(1))]:[]};
 const days=[{iso:'2026-10-04'}],loads=[load('deliveries','SYN_A'),load('removals','SYN_B'),load('deliveries','SYN_C')];
 const assets=Object.fromEntries(['SYN_A','SYN_B','SYN_C'].map(key=>[key,{key}]));
 let context;
 const window={addEventListener:(name,fn)=>{(events[name]||(events[name]=[])).push(fn);},print:()=>{calls.push(['print']);if(options.onPrint)options.onPrint(context);if(options.throwPrint)throw new Error('Synthetic print failure');}};
 context=vm.createContext({window,document,Date,Promise,Map,Set,S:{delivery:raw},CROW:new Map(),SYNC:{readonly:!!options.readonly,on:!!options.syncPending,status:options.syncPending?'waiting':'live'},state:{},
  capability:()=>options.readonly?'view':'edit',assetOf:key=>assets[key],deliveryOf:key=>resolved[key]||{recorded:false,state:'not on site',done:false},chargeLines:()=>[],shortOf:()=>[],movedAway:()=>null,mayWrite:()=>!options.readonly,whoAmI:()=> 'Synthetic operator',
  setLight:(key,state)=>{calls.push(['light',key,state]);raw[key]={state,history:[{state}]};resolved[key]={recorded:true,state};return true;},setDone:()=>{throw new Error('Unexpected Complete write');},bump:()=>calls.push(['bump']),flash:message=>calls.push(['flash',message]),
  programmeDays:()=>days,dpLoads:()=>loads,dpPage:(d,g,doc)=>doc+':'+g.rows[0].a.key+';',pl782Pages:()=>'',PL782_CSS:'',DRV782_CSS:'',drvValid782:()=>false,DRV782_OK:{},DP_DOC:{drv:{kick:'Drivers'},ins:{kick:'Installation'}},DP_MAIL:{drivers:'Drivers',install:'Installation',prestart:'Prestart'},
  // This fixture has no supplier preview. Actual cross-route cleanup is covered
  // by test_supplier_print841.cjs with both native and supplier entry functions.
  supplierPrint841Dismiss:()=>{},epOpen819:()=>false,
  fmtDate:x=>x,esc:x=>x,dpZoomFit:()=>calls.push(['zoom']),setHash:()=>{},render:()=>{},ps7Day:()=>days[0],ps7Print:()=>calls.push(['prestart']),
  drvCheck782:(iso,only,go)=>{calls.push(['check',iso,only]);if(options.deferChecks)checks.push(go);else go();},
  dpWaitDocs:()=>{const d=deferred();docs.push(d);if(!options.deferDocs)d.resolve();return d.promise;},
  dpFit:w=>{calls.push(['fit',w.innerHTML]);w.__over=[];},dpShrink:w=>calls.push(['shrink',w.innerHTML]),dpCut:w=>{calls.push(['cut',w.innerHTML]);return Promise.resolve();},dpFail:()=>calls.push(['fail']),printAsk:(r,go,done)=>{calls.push(['ask']);context.lastAsk={go,done};},
  setTimeout:(fn,ms)=>{const t={fn,ms,id:++clock,cancelled:false};timers.push(t);return t.id;},clearTimeout:id=>{const t=timers.find(x=>x.id===id);if(t)t.cancelled=true;}
 });
 vm.runInContext(adapter+'\n'+native,context,{filename:'actual-built-print.js'});
 return {context,document,nodes,calls,docs,checks,raw,resolved,events,Element,
  runTimers:ms=>{const due=timers.filter(t=>!t.cancelled&&t.ms===ms);due.forEach(t=>{t.cancelled=true;t.fn();});},
  print:options=>context.dpPrint('2026-10-04','drv',options),
  writes:()=>calls.filter(c=>c[0]==='light'),prints:()=>calls.filter(c=>c[0]==='print')};
}
const tests=[];function test(name,run){tests.push({name,run});}
test('native go prints first and advances only selected inbound references',async()=>{
 const f=fixture();f.print();await flush();assert.equal(f.prints().length,1);assert.deepEqual(f.writes(),[['light','SYN_A','in transit'],['light','SYN_C','in transit']]);assert.ok(f.calls.findIndex(c=>c[0]==='print')<f.calls.findIndex(c=>c[0]==='light'));assert.equal(f.raw.SYN_B,undefined);
});
test('native numeric-string single selection is exact and invalid selection has no fallback',async()=>{
 const f=fixture();f.print({only:'2'});await flush();assert.deepEqual(f.writes(),[['light','SYN_C','in transit']]);
 const bad=fixture();bad.print({only:99});await flush();assert.equal(bad.docs.length,0);assert.equal(bad.prints().length,0);assert.deepEqual(bad.raw,{});
});
test('native throwing print callback cannot advance delivery',async()=>{
 const f=fixture({throwPrint:true});f.print({only:0});await flush();assert.equal(f.prints().length,1);assert.deepEqual(f.raw,{});
});
test('native direct link and bar retry share the rendered inbound selection without duplicate writes',async()=>{
 const f=fixture();f.context.dpFromLink('drivers','2026-10-04',2);f.runTimers(300);await flush();assert.equal(f.prints().length,1);assert.deepEqual(f.writes(),[['light','SYN_C','in transit']]);
 f.nodes.get('dpbar').querySelector('[data-dpbar-print]').onclick();assert.equal(f.prints().length,2);assert.equal(f.writes().length,1);
});
test('native PDF and non-driver paths prepare sheets without delivery changes',async()=>{
 const pdf=fixture(),results=[];pdf.print({only:0,pdf:(r,w,done)=>results.push({r,html:w.innerHTML,done})});await flush();assert.equal(results.length,1);assert.equal(results[0].html,'drv:SYN_A;');assert.equal(pdf.prints().length,0);assert.deepEqual(pdf.raw,{});
 const ins=fixture();ins.context.dpPrint('2026-10-04','ins',{only:0});await flush();assert.equal(ins.prints().length,1);assert.deepEqual(ins.raw,{});
});
test('native view-only print remains available without delivery writes',async()=>{
 const f=fixture({readonly:true});f.print({only:0});await flush();assert.equal(f.prints().length,1);assert.deepEqual(f.raw,{});
});
test('interleaved native document hydration keeps only the newest request',async()=>{
 const f=fixture({deferDocs:true});f.print({only:0});f.print({only:2});assert.equal(f.docs.length,2);f.docs[1].resolve();await flush();f.docs[0].resolve();await flush();assert.equal(f.prints().length,1);assert.deepEqual(f.writes(),[['light','SYN_C','in transit']]);assert.equal(f.nodes.get('dayprint').innerHTML,'drv:SYN_C;');
});
test('closing native preview while document hydration waits prevents late preparation',async()=>{
 const f=fixture({deferDocs:true});f.print({only:0});f.context.dpBarClose();f.docs[0].resolve();await flush();assert.equal(f.prints().length,0);assert.equal(f.nodes.has('dayprint'),false);assert.deepEqual(f.raw,{});
});
test('replacing a native wrapper while fonts wait prevents stale printing',async()=>{
 const fonts=deferred(),f=fixture({fonts:fonts.promise});f.print({only:0});await flush();const replacement=new f.Element('div');replacement.id='dayprint';f.document.body.appendChild(replacement);fonts.resolve();await flush();assert.equal(f.prints().length,0);assert.deepEqual(f.raw,{});
});
test('native print callback invalidation is checked before status mutation',async()=>{
 const f=fixture({onPrint:c=>c.dpBarClose()});f.print({only:0});await flush();assert.equal(f.prints().length,1);assert.deepEqual(f.raw,{});
});
test('closing a native link bar before delayed startup prevents print and writes',async()=>{
 const f=fixture();f.context.dpFromLink('drivers','2026-10-04',0);f.context.dpBarClose();f.runTimers(300);await flush();assert.equal(f.docs.length,0);assert.equal(f.prints().length,0);assert.deepEqual(f.raw,{});
});
test('replacing a native link bar invalidates its older delayed startup',async()=>{
 const f=fixture();f.context.dpFromLink('drivers','2026-10-04',0);f.context.dpFromLink('drivers','2026-10-04',2);f.runTimers(300);await flush();assert.equal(f.docs.length,1);assert.deepEqual(f.writes(),[['light','SYN_C','in transit']]);
});
test('closing native link while the manual check waits invalidates its continuation',async()=>{
 const f=fixture({deferChecks:true});f.context.dpFromLink('drivers','2026-10-04',0);f.runTimers(300);assert.equal(f.checks.length,1);f.context.dpBarClose();f.checks[0]();await flush();assert.equal(f.docs.length,0);assert.equal(f.prints().length,0);assert.deepEqual(f.raw,{});
});
test('superseded native preparation does not fit or crop the replacement sheet',async()=>{
 const fonts=deferred(),f=fixture({fonts:fonts.promise});f.print({only:0});await flush();f.print({only:2});await flush();fonts.resolve();await flush();
 for(const operation of ['fit','shrink','cut'])assert.equal(f.calls.filter(c=>c[0]===operation).length,1,operation+' must run only for the current sheet');
 assert.deepEqual(f.writes(),[['light','SYN_C','in transit']]);
});
test('old native afterprint callbacks cannot dismiss the replacement sheet',async()=>{
 const f=fixture();f.print({only:0});await flush();const old=f.events.afterprint[0];f.print({only:2});await flush();old();assert.equal(f.nodes.get('dayprint').classList.contains('dpwrap'),true);assert.equal(f.document.body.classList.contains('printing-day'),true);assert.ok(f.nodes.has('dayPage'));
});
(async()=>{let passed=0;const failures=[];for(const t of tests){try{await t.run();passed++;console.log('PASS '+t.name);}catch(e){failures.push({name:t.name,error:e.message});console.error('FAIL '+t.name+': '+e.message);}}console.log(JSON.stringify({author:'Andrew Fisher',passed,total:tests.length,failures}));process.exitCode=failures.length?1:0;})().catch(e=>{console.error(e);process.exitCode=1;});
