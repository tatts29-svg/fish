/* Author: Andrew Fisher. Supplier printing with actual native lifecycle and synthetic data only. */
'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
if(!process.env.PAGE)throw new Error('Set PAGE to a built page containing supplier_print841_patch.');
const html=fs.readFileSync(process.env.PAGE,'utf8');
function between(start,end){const a=html.indexOf(start),b=html.indexOf(end,a+start.length);assert.ok(a>=0&&b>a,'Page contains '+start);return html.slice(a,b);}
const adapter=between('function timeline841MergeProof(','function ldLine(');
const supplier=between('function supplierPrint841Snapshot(','function renderPass(');
const native=between('function dpPrint(iso, doc, o){','function dayPrint(iso){');
const prestart=between('function ps7Print(iso, o){','function renderPrestarts(){');
const flush=async()=>{for(let i=0;i<24;i++)await Promise.resolve();};
const deferred=()=>{let resolve;const promise=new Promise(r=>{resolve=r;});return {promise,resolve};};
const copy=x=>JSON.parse(JSON.stringify(x));
const NOW='2026-10-04T04:00:00.000Z';
const proof=stage=>({stage,at:NOW,by:'Synthetic operator',history:[]});
const onSite=extra=>({recorded:true,state:'on site',where:'local',set_at:NOW,...extra});
function fixture(options={}){
 const keys=['SYN_A','SYN_B','SYN_OUT','SYN_UNSCHEDULED','SYN_CANCEL','SYN_MOVED','SYN_TRANSIT','SYN_ON','SYN_LOCATION','SYN_INSTALLED','SYN_DONE','SYN_RENTAL'];
 const data={assets:Object.fromEntries(keys.map(key=>[key,{key}])),raw:copy(options.raw||{}),deliveries:copy(options.deliveries||{}),calls:[],printed:[],timers:[],events:{},windowEvents:{},nodes:new Map(),plan:{loads:[{n:1,date:'2026-10-09',stops:[{drops:[{ref:'SYN_A'},{ref:'SYN_B'}]}]},{n:2,date:'2026-10-10',stops:[{drops:[{ref:'SYN_B'}]}]}]}};
 data.assets.SYN_CANCEL._cancelled=true;
 const inbound=keys.filter(key=>!['SYN_OUT','SYN_UNSCHEDULED'].includes(key));
 data.native=[{iso:'2026-10-05',loads:[{kind:'deliveries',rows:inbound.map(key=>({a:{key}}))},{kind:'removals',rows:[{a:{key:'SYN_OUT'}}]}]}];
 if(options.drops)data.plan.loads[0].stops=[{drops:copy(options.drops)}];
 class Element{
  constructor(tag){this.tagName=tag;this.dataset={};this.hidden=false;this.parts=new Map();this._id='';this._html='';this.isConnected=false;this.style={setProperty(){},removeProperty(){}};const classes=new Set();this.classList={add:(...xs)=>xs.forEach(x=>classes.add(x)),remove:(...xs)=>xs.forEach(x=>classes.delete(x)),contains:x=>classes.has(x),toggle:(x,on)=>on?classes.add(x):classes.delete(x)};}
  set id(id){this._id=id;}get id(){return this._id;}
  set innerHTML(value){this._html=value;this.parts.clear();}get innerHTML(){return this._html;}
  appendChild(el){el.isConnected=true;if(el.id)data.nodes.set(el.id,el);return el;}
  remove(){this.isConnected=false;if(data.nodes.get(this.id)===this)data.nodes.delete(this.id);}
  setAttribute(){}getAttribute(){return null;}removeAttribute(){}getBoundingClientRect(){return {width:100,height:100};}focus(){document.activeElement=this;}getClientRects(){return this.hidden?[]:[{}];}
  querySelector(sel){if(sel==='.rs819'&&!this.innerHTML.includes('rs819'))return null;if(!this.parts.has(sel))this.parts.set(sel,new Element('synthetic'));return this.parts.get(sel);}
  querySelectorAll(){return [];}
 }
 const document={body:new Element('body'),head:new Element('head'),fonts:{ready:options.fonts||Promise.resolve()},activeElement:null,createElement:tag=>new Element(tag),getElementById:id=>data.nodes.get(id)||null,querySelector:()=>null,querySelectorAll:sel=>sel.startsWith('#')&&data.nodes.has(sel.slice(1))?[data.nodes.get(sel.slice(1))]:[],addEventListener:(type,fn)=>{(data.events[type]||(data.events[type]=[])).push(fn);}};
 document.activeElement=document.body;
 let context;
 const fire=type=>{for(const entry of [...(data.windowEvents[type]||[])]){if(!entry.active)continue;if(entry.once)entry.active=false;entry.fn();}};
 const window={addEventListener:(type,fn,o)=>{(data.windowEvents[type]||(data.windowEvents[type]=[])).push({fn,once:!!(o&&o.once),active:true});},removeEventListener:(type,fn)=>{for(const x of data.windowEvents[type]||[])if(x.fn===fn)x.active=false;},print:()=>{data.calls.push(['print']);const ep=document.body.classList.contains('ep819-printing'),day=document.body.classList.contains('printing-day');data.printed.push({ep,day,html:(data.nodes.get(ep?'ep819print':'dayprint')||{}).innerHTML||''});if(options.onPrint)options.onPrint(context,data);if(options.afterprint)fire('afterprint');if(options.throwPrint)throw new Error('Synthetic print failure');}};
 context=vm.createContext({window,document,EP819:data.plan,EPF819:{open:new Set(),folds:new Set()},S:{delivery:data.raw},CROW:new Map(),SYNC:{readonly:!!options.readonly},state:{},
  programmeDays:()=>{if(options.failProgramme)throw new Error('Synthetic unavailable programme');return data.native;},dpLoads:d=>d.loads,
  assetOf:key=>data.assets[key]||null,deliveryOf:key=>data.deliveries[key]||{recorded:false,state:'not on site',done:false},chargeLines:()=>[],shortOf:()=>[],movedAway:key=>data.deliveries[key]?.moved||null,
  capability:()=>options.readonly?'view':'edit',mayWrite:()=>!options.readonly,whoAmI:()=>options.noOperator?'':'Synthetic operator',
  setLight:(key,state)=>{data.calls.push(['light',key,state]);if(options.refuse||options.noOperator)return false;const record=data.raw[key]||(data.raw[key]={});record.state=state;record.history=(record.history||[]).concat([{state,at:NOW,by:'Synthetic operator'}]);data.deliveries[key]={recorded:true,state,where:'local'};return true;},setDone:()=>{throw new Error('Unexpected Complete write');},bump:()=>data.calls.push(['bump']),flash:message=>data.calls.push(['flash',message]),
  esc:x=>x,epLabel819:()=> 'Synthetic supplier plan',epRunSheet819:load=>'<div class="rs819">'+load.stops.flatMap(s=>s.drops.map(d=>d.ref||d.name||'')).join(',')+'</div>',epFit819:()=>[],
  dpWaitDocs:()=>Promise.resolve(),dpPage:(d,g,doc)=>doc+':'+g.rows.map(r=>r.a.key).join(','),pl782Pages:()=>'',PL782_CSS:'',DRV782_CSS:'',drvValid782:()=>false,DRV782_OK:{},DP_DOC:{drv:{kick:'Drivers'},ins:{kick:'Installation'}},DP_MAIL:{drivers:'Drivers',install:'Installation',prestart:'Prestart'},fmtDate:x=>x,dpZoomFit:()=>{},setHash:value=>data.calls.push(['hash',value]),render:()=>data.calls.push(['render']),drvCheck782:(iso,only,go)=>go(),
  dpFit:w=>{w.__over=[];},dpShrink:()=>{},dpCut:()=>Promise.resolve(),dpFail:()=>{},printAsk:()=>{throw new Error('Unexpected print warning');},
  ps7Day:iso=>data.native.find(d=>d.iso===iso),ps7State:()=>({batch:'Synthetic batch'}),ps7Page:()=>'<div class="ps7">Synthetic prestart</div>',PS7_CSS:'',
  setTimeout:(fn,ms)=>{const timer={fn,ms,id:data.timers.length+1,cancelled:false};data.timers.push(timer);return timer.id;},clearTimeout:id=>{const t=data.timers.find(x=>x.id===id);if(t)t.cancelled=true;}
 });
 vm.runInContext(adapter+'\n'+native+'\n'+prestart+'\n'+supplier,context,{filename:'built-native-supplier-print.js'});
 return {data,context,document,Element,fire,
  open:(n=1,options)=>context.ep819Print(n,options),close:()=>context.ep819Close(),
  run:(ms=80)=>{const pending=data.timers.filter(t=>!t.cancelled&&t.ms===ms);for(const t of pending){t.cancelled=true;t.fn();}},
  click:selector=>{const target={closest:sel=>sel===selector?target:null,dataset:{}};for(const handler of data.events.click||[])handler({target});},
  writes:()=>data.calls.filter(c=>c[0]==='light'),prints:()=>data.calls.filter(c=>c[0]==='print')};
}
const tests=[];function test(name,fn){tests.push({name,fn});}
test('snapshot uses only exact displayed drop refs in canonical native inbound loads',()=>{
 const f=fixture({drops:[{ref:'SYN_A'},{ref:'SYN_A'},{ref:'SYN_OUT'},{ref:'SYN_UNSCHEDULED'},{ref:'SYN_UNKNOWN'},{ref:'SYN_CANCEL'},{ref:' SYN_B '},{name:'SYN_B',task_ref:'SYN_B'}]});
 const before=JSON.stringify([f.data.plan,f.data.native]),wrap=f.open(1,{hold:true}),r=wrap.__supplierPrint841;
 assert.deepEqual(copy(r.refs),['SYN_A']);assert.equal(Object.isFrozen(r.refs),true);assert.equal(Object.isFrozen(r.loads[0].rows),true);assert.equal(r.date,'2026-10-09');assert.equal(JSON.stringify([f.data.plan,f.data.native]),before);
});
test('a hold preview never prints or writes delivery',()=>{const f=fixture();f.open(1,{hold:true});f.run();assert.equal(f.prints().length,0);assert.deepEqual(f.data.raw,{});assert.equal(f.data.timers.length,0);});
test('automatic supplier print uses native transitions after print with the supplier audit date',()=>{
 const f=fixture();f.open();f.run();assert.equal(f.prints().length,1);assert.deepEqual(f.writes(),[['light','SYN_A','in transit'],['light','SYN_B','in transit']]);assert.ok(f.data.calls.findIndex(x=>x[0]==='print')<f.data.calls.findIndex(x=>x[0]==='light'));
 assert.equal(f.data.raw.SYN_A.history[0].print_day,'2026-10-09');assert.equal(f.data.raw.SYN_A.history[0].because,'Run sheet print requested');assert.equal(f.data.native[0].iso,'2026-10-05');
});
test('explicit native preview button prints the frozen selection and retries do not duplicate records',()=>{
 const f=fixture();f.open(1,{hold:true});f.data.plan.loads[0].stops=[{drops:[{ref:'SYN_OUT'}]}];f.click('[data-ep819-go]');f.click('[data-ep819-go]');
 assert.equal(f.prints().length,2);assert.deepEqual(f.writes(),[['light','SYN_A','in transit'],['light','SYN_B','in transit']]);assert.equal(f.data.raw.SYN_A.history.length,1);assert.equal(f.data.raw.SYN_OUT,undefined);
});
test('manual print before the automatic timer cancels the duplicate automatic request',()=>{
 const f=fixture();f.open();f.click('[data-ep819-go]');f.run();assert.equal(f.prints().length,1);assert.equal(f.writes().length,2);
});
test('view-only supplier print stays available without record changes',()=>{const f=fixture({readonly:true});f.open();f.run();assert.equal(f.prints().length,1);assert.deepEqual(f.writes(),[]);assert.deepEqual(f.data.raw,{});});
test('thrown automatic and explicit print callbacks leave records unchanged',()=>{
 for(const hold of [false,true]){const f=fixture({throwPrint:true});f.open(1,{hold});if(hold)f.click('[data-ep819-go]');else f.run();assert.equal(f.prints().length,1);assert.deepEqual(f.data.raw,{});}
});
test('cancelled, moved, observed arrival and later stages are excluded while rental-only arrival advances',()=>{
 const deliveries={SYN_MOVED:{moved:{to:'SYN_A'}},SYN_TRANSIT:{recorded:true,state:'in transit'},SYN_ON:onSite(),SYN_LOCATION:onSite(),SYN_INSTALLED:onSite(),SYN_DONE:onSite({done:true}),SYN_RENTAL:onSite({where:'rental'})};
 const raw={SYN_LOCATION:{timeline841:proof(3)},SYN_INSTALLED:{timeline841:proof(4)}};
 const f=fixture({deliveries,raw,drops:['SYN_CANCEL',...Object.keys(deliveries)].map(ref=>({ref}))});f.open();f.run();assert.deepEqual(f.writes(),[['light','SYN_RENTAL','in transit']]);assert.deepEqual(f.data.raw.SYN_LOCATION,raw.SYN_LOCATION);assert.deepEqual(f.data.raw.SYN_INSTALLED,raw.SYN_INSTALLED);
});
test('references cancelled, moved or removed after preparation are checked again at print time',()=>{
 for(const change of [f=>{f.data.assets.SYN_A._cancelled=true;},f=>{f.data.deliveries.SYN_A={moved:{to:'SYN_B'}};},f=>{delete f.data.assets.SYN_A;}]){const f=fixture({drops:[{ref:'SYN_A'}]});f.open();change(f);f.run();assert.equal(f.prints().length,1);assert.deepEqual(f.writes(),[]);}
});
test('unknown-only and unavailable native programme print sheets without fabricating any references',()=>{
 for(const options of [{drops:[{ref:'SYN_UNKNOWN'},{name:'SYN_A',task_ref:'SYN_A'}]},{failProgramme:true}]){const f=fixture(options);f.open();f.run();assert.equal(f.prints().length,1);assert.deepEqual(f.writes(),[]);}
});
test('native setter refusal or missing operator cannot create successful supplier transitions',()=>{
 for(const options of [{refuse:true},{noOperator:true}]){const f=fixture(options);f.open();f.run();assert.deepEqual(f.data.raw,{});assert.ok(!f.data.calls.some(x=>x[0]==='bump'));}
});
test('closing a preview invalidates even an already-queued automatic callback',()=>{
 const f=fixture();f.open();const pending=f.data.timers[0].fn;f.close();pending();assert.equal(f.prints().length,0);assert.deepEqual(f.writes(),[]);
});
test('closing and reopening the same wrapper cannot revive the old load timer',()=>{
 const f=fixture();f.open(1);const pending=f.data.timers[0].fn;f.open(2,{hold:true});pending();assert.equal(f.prints().length,0);f.click('[data-ep819-go]');assert.deepEqual(f.writes(),[['light','SYN_B','in transit']]);
});
test('an old queued timer cannot clear a replacement timer and cause a duplicate automatic print',()=>{
 const f=fixture();f.open(1);const old=f.data.timers[0].fn;f.open(2);old();f.click('[data-ep819-go]');f.run();assert.equal(f.prints().length,1);assert.deepEqual(f.writes(),[['light','SYN_B','in transit']]);
});
test('replacing the supplier wrapper prevents a stale print request',()=>{
 const f=fixture();f.open();const replacement=new f.Element('div');replacement.id='ep819print';replacement.innerHTML='<div class="rs819"></div>';f.document.body.appendChild(replacement);f.run();assert.equal(f.prints().length,0);assert.deepEqual(f.writes(),[]);
});
test('starting another native print generation invalidates pending supplier requests',()=>{
 const f=fixture();f.open();f.context.timeline841PrintStart();f.run();assert.equal(f.prints().length,0);assert.deepEqual(f.writes(),[]);
});
test('opening a supplier preview invalidates old native wrapper print callbacks',()=>{
 const f=fixture(),wrap=new f.Element('div');wrap.id='dayprint';f.document.body.appendChild(wrap);const token=f.context.timeline841PrintStart();wrap.dataset.timeline841Print=String(token);wrap.__timeline841print=()=>{};
 f.open(1,{hold:true});assert.equal(f.context.timeline841PrintCurrent(token,wrap),false);assert.equal(wrap.__timeline841print,null);assert.equal(wrap.dataset.timeline841Print,undefined);assert.deepEqual(f.writes(),[]);
});
test('cross-route generation changes inside window.print block post-print mutation',()=>{
 const f=fixture({onPrint:c=>c.timeline841PrintStart()});f.open();f.run();assert.equal(f.prints().length,1);assert.deepEqual(f.writes(),[]);
});
test('cancellation and arrival recorded during window.print are preserved by the shared policy',()=>{
 const f=fixture({onPrint:(c,data)=>{data.assets.SYN_A._cancelled=true;data.deliveries.SYN_B=onSite();}});f.open();f.run();assert.equal(f.prints().length,1);assert.deepEqual(f.writes(),[]);assert.equal(f.data.deliveries.SYN_B.state,'on site');
});
test('manual Close inside window.print blocks post-print mutation',()=>{
 const f=fixture({onPrint:c=>c.ep819Close()});f.open();f.run();assert.equal(f.prints().length,1);assert.deepEqual(f.writes(),[]);
});
test('replacing the supplier load inside window.print blocks the older mutation',()=>{
 const f=fixture({onPrint:c=>c.ep819Print(2,{hold:true})});f.open();f.run();assert.equal(f.prints().length,1);assert.deepEqual(f.writes(),[]);
});
test('synchronous natural afterprint cleanup still records a successful print request',()=>{
 const f=fixture({afterprint:true});f.open();f.run();assert.equal(f.prints().length,1);assert.deepEqual(f.writes(),[['light','SYN_A','in transit'],['light','SYN_B','in transit']]);assert.equal(f.context.epOpen819(),false);
});
test('throwing print after natural cleanup never records a delivery transition',()=>{
 const f=fixture({afterprint:true,throwPrint:true});f.open();f.run();assert.equal(f.prints().length,1);assert.deepEqual(f.writes(),[]);assert.equal(f.context.epOpen819(),false);
});
test('asynchronous natural afterprint closes after the already recorded print request',()=>{
 const f=fixture();f.open();f.run();assert.equal(f.context.epOpen819(),true);assert.equal(f.writes().length,2);f.fire('afterprint');assert.equal(f.context.epOpen819(),false);assert.equal(f.writes().length,2);
});
test('a stale afterprint listener cannot close or authorise a replacement preview',()=>{
 const f=fixture();f.open(1);const old=f.data.windowEvents.afterprint[0].fn;f.open(2,{hold:true});old();assert.equal(f.context.epOpen819(),true);assert.deepEqual(f.writes(),[]);f.click('[data-ep819-go]');assert.deepEqual(f.writes(),[['light','SYN_B','in transit']]);
});
test('supplier preview to native driver print selects native content before recording native refs',async()=>{
 const f=fixture({drops:[{ref:'SYN_B'}]});f.open(1,{hold:true});f.data.native[0].loads=[{kind:'deliveries',rows:[{a:{key:'SYN_A'}}]}];f.context.dpPrint('2026-10-05','drv',{});await flush();
 assert.equal(f.context.epOpen819(),false);assert.equal(f.data.nodes.get('ep819print').hidden,true);assert.deepEqual(f.data.printed,[{ep:false,day:true,html:'drv:SYN_A'}]);assert.deepEqual(f.writes(),[['light','SYN_A','in transit']]);
});
test('supplier preview to native driver link clears supplier print CSS before delayed startup',async()=>{
 const f=fixture({drops:[{ref:'SYN_B'}]});f.open(1,{hold:true});f.data.native[0].loads=[{kind:'deliveries',rows:[{a:{key:'SYN_A'}}]}];f.context.dpFromLink('drivers','2026-10-05',0);assert.equal(f.document.body.classList.contains('ep819-printing'),false);f.run(300);await flush();
 assert.deepEqual(f.data.printed,[{ep:false,day:true,html:'drv:SYN_A'}]);assert.deepEqual(f.writes(),[['light','SYN_A','in transit']]);
});
test('supplier preview to native prestart prints only the prestart content without delivery writes',async()=>{
 const f=fixture();f.open(1,{hold:true});f.context.ps7Print('2026-10-05',{});await flush();assert.deepEqual(f.data.printed,[{ep:false,day:true,html:'<div class="ps7">Synthetic prestart</div>'}]);assert.deepEqual(f.writes(),[]);
});
test('native preview to supplier clears native content and bar without changing the selected route',async()=>{
 const f=fixture();f.context.dpFromLink('drivers','2026-10-05',0);f.run(300);await flush();const oldPrint=f.data.nodes.get('dayprint').__timeline841print,oldBar=f.data.nodes.get('dpbar').querySelector('[data-dpbar-print]').onclick;f.open(2,{hold:true});
 assert.equal(f.data.nodes.has('dpbar'),false);assert.equal(f.data.nodes.has('dayPage'),false);assert.equal(f.data.nodes.get('dayprint').innerHTML,'');
 for(const cls of ['printing-day','pdf7-make','dpbar-on'])assert.equal(f.document.body.classList.contains(cls),false);
 assert.equal(f.data.calls.some(x=>x[0]==='hash'||x[0]==='render'),false);const count=f.prints().length;oldPrint();oldBar();assert.equal(f.prints().length,count);f.click('[data-ep819-go]');assert.equal(f.data.printed.at(-1).ep,true);assert.equal(f.data.printed.at(-1).day,false);assert.match(f.data.printed.at(-1).html,/SYN_B/);
});
test('pending native driver preparation cannot print or restore native CSS after a supplier preview opens',async()=>{
 const fonts=deferred(),f=fixture({fonts:fonts.promise});f.context.dpPrint('2026-10-05','drv',{});await flush();f.open(2,{hold:true});fonts.resolve();await flush();assert.equal(f.prints().length,0);assert.deepEqual(f.writes(),[]);assert.equal(f.context.epOpen819(),true);assert.equal(f.document.body.classList.contains('printing-day'),false);
});
test('pending prestart print and PDF callbacks cannot consume a newer supplier preview',async()=>{
 for(const pdf of [false,true]){const fonts=deferred(),f=fixture({fonts:fonts.promise}),captures=[];f.context.ps7Print('2026-10-05',pdf?{pdf:()=>captures.push(true)}:{});f.open(2,{hold:true});fonts.resolve();await flush();assert.equal(f.prints().length,0);assert.equal(captures.length,0);assert.equal(f.context.epOpen819(),true);assert.equal(f.document.body.classList.contains('printing-day'),false);assert.equal(f.document.body.classList.contains('pdf7-make'),false);}
});
(async()=>{let passed=0;const failures=[];for(const t of tests){try{await t.fn();passed++;console.log('PASS '+t.name);}catch(e){failures.push({name:t.name,error:e.message});console.error('FAIL '+t.name+': '+e.message);}}console.log(JSON.stringify({author:'Andrew Fisher',passed,total:tests.length,failures}));process.exitCode=failures.length?1:0;})().catch(e=>{console.error(e);process.exitCode=1;});
