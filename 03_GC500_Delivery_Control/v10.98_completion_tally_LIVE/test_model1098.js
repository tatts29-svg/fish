/* Author: Andrew Fisher. Synthetic reference tests against the actual page functions. */
'use strict';
const fs=require('fs'),vm=require('vm'),assert=require('assert');
const createScope=require('./completion1098_src.js');
const base=fs.readFileSync(process.env.BASE_PAGE,'utf8'), page=fs.readFileSync(process.env.PAGE,'utf8');
let passed=0;
function check(name,fn){fn();passed++;process.stdout.write('PASS '+name+'\n');}
function fn(text,name){const start=text.indexOf('function '+name+'(');assert(start>=0,name);const end=text.indexOf('\n}',start);assert(end>start,name);return text.slice(start,end+2);}
function context(text,excluded=[],variant={}){
 const health={ready:true,loading:false,basis:'test'}, day='2026-10-21';
 const assets=[['BAR-A',10,true],['BAR-B',20,false],['BAR-C',30,true],['BAR-D',40,false],['GEN-A',2,true]].map(([key,q,done])=>({key,name:key,product:key.startsWith('BAR')?'WFB':'Generator',discipline:key.startsWith('BAR')?'Water-filled barriers':'Generators',q,done,charge:12345,pin:[1,2],history:[{done}]}));
 assets.forEach(a=>Object.assign(a,variant[a.key]||{}));
 const delivery=(key,date)=>{const a=assets.find(x=>x.key===key);return {done:date<'2026-10-21'?false:a.done,recorded:true,state:'on site',where:'person'};};
 const lines=a=>[{item:a.product==='WFB'?'TL2 Barrier':'Generator',quantity:a.q,rate:12.34}];
 const native=()=>assets.map(a=>({a,cls:lines(a),asked:a.q||1,askedBy:new Map([[lines(a)[0].item,a.q||1]]),onBy:new Map([[lines(a)[0].item,a.q||1]]),d:delivery(a.key,day),st:{in:'2026-10-20'},unitsOn:a.q||1,due:true,nums:[],subs:[],accs:[],t:{total:a.charge}}));
 const c={console,CompletionScope1098:createScope({schema:1,excluded_references:excluded}),todayIso:()=>day,todayWorkHealth840:()=>health,todayGroupHealth841:()=>health,
 allAssets:()=>assets,assetOf:key=>assets.find(a=>a.key===key),chargeLines:lines,qtyOf:l=>l.quantity,shortOf:()=>[],deliveryAsOf:delivery,
 toiletRows962:()=>null,toiletItem962:()=>null,DATA:{weeks:[]},FCOL:[],allDockets:()=>[],fenceInstallationWeeks847:()=>[],
 ProgressPercent1012:{ratio:(a,b)=>Math.min(100,a/b*100)},physicalCountAssets963:a=>({assets:a,aliases:[],pending:[]}),
 dsnState:()=>({rows:native(),byDisc:new Map(),P:{areas:0,areasDone:0}}),tradeCharges:()=>new Map(),fenceTypes:()=>[],fenceDerived:()=>({charged:123,cost:45}),
 todayFencingSummary841:()=>({summaryRows:[]}),isMiscRow:()=>false};
 vm.createContext(c);
 for(const name of ['todayWorkMetrics840','todayGroupDetails841','todayWorkSummary842','todayTypeMetrics843']) vm.runInContext(fn(text,name),c);
 c.todayWorkSummary848=c.todayWorkSummary842;
 const ms=text.slice(text.indexOf('<script id="ms1025-script">'));
 Object.assign(c,{S:{delivery:Object.fromEntries(assets.map((a,i)=>[a.key,{history:[{state:'on site',at:'2026-10-'+(10+i)+'T00:00:00Z',by:'Synthetic installer'}],done_at:'2026-10-21T00:00:00Z',done_history:a.done?[{done:true,at:'2026-10-21T00:00:00Z'}]:[]}]))},MIN_REFS:3,dayOf:x=>String(x).slice(0,10),daysBetween:(a,b)=>(Date.parse(b)-Date.parse(a))/86400000});
 c.area=(id,day)=>c.todayWorkMetrics840(day).find(a=>a.id===id);
 for(const name of ['refsOf','facts']) vm.runInContext(fn(ms,name),c);
 return {c,assets,read:(date=day)=>{const areas=c.todayWorkMetrics840(date),groups=c.todayGroupDetails841(date,areas),summary=c.todayWorkSummary842(date,areas,groups,{summaryRows:[]}),types=c.todayTypeMetrics843(date,groups,summary);return {areas,groups,summary,types};}};
}
const obj=x=>JSON.parse(JSON.stringify(x));
const area=(m,id='barriers')=>m.areas.find(a=>a.id===id);
const type=m=>m.types.instruments.find(t=>t.name==='TL2 Barrier');
const reading=m=>({total:area(m).total,done:area(m).done,left:area(m).remaining,pct:area(m).pct,rows:obj(area(m).rows),plan:obj(m.summary.byId.barriers.plan),type:{total:type(m).total,done:type(m).done,left:type(m).left,pct:type(m).pct,rows:obj(type(m).rows)}});
check('empty scope preserves old completion and arrival readings',()=>assert.deepStrictEqual(reading(context(page).read()),reading(context(base).read())));
check('excluded complete and unfinished references leave numerator and denominator',()=>{
 const m=context(page,['BAR-C','BAR-D']).read();assert.equal(area(m).total,30);assert.equal(area(m).done,10);assert.equal(area(m).remaining,20);assert(Math.abs(area(m).pct-100/3)<1e-9);
 assert.deepStrictEqual(obj(area(m).rows.map(r=>r.key)),['BAR-A','BAR-B']);assert.equal(type(m).total,30);assert.equal(type(m).done,10);assert.equal(type(m).left,20);assert(Math.abs(type(m).pct-100/3)<1e-9);
});
check('schedule, arrivals, finance, register quantities, pins and status are preserved',()=>{
 const old=context(base),fresh=context(page,['BAR-C','BAR-D']),before=JSON.stringify(fresh.assets),a=old.read(),b=fresh.read();
 assert.equal(before,JSON.stringify(fresh.assets));assert.deepStrictEqual(obj(fresh.assets),obj(old.assets));
 assert.deepStrictEqual(obj(b.summary.byId.barriers.plan),obj(a.summary.byId.barriers.plan));assert.deepStrictEqual(obj(type(b).plan),obj(type(a).plan));
 const ga=a.groups.equipment.groups[0],gb=b.groups.equipment.groups[0];assert.deepStrictEqual(obj(gb.summary),obj(ga.summary));assert.equal(gb.types[0].total,100);assert.equal(gb.types[0].onSite,100);
 assert.deepStrictEqual(obj(b.groups.fencing.money),obj(a.groups.fencing.money));assert.equal(fresh.assets.length,5);assert.equal(fresh.assets[2].done,true);
 assert.equal(b.groups.__coverage.allRepresented,true);assert.equal(b.types.coverage.allRepresented,true);
});
check('other categories are unchanged',()=>{
 const a=context(base).read(),b=context(page,['BAR-C','BAR-D']).read();assert.deepStrictEqual(obj(area(b,'generators')),obj(area(a,'generators')));
});
check('completion scope also applies to dated historical readings',()=>{
 const m=context(page,['BAR-C','BAR-D']).read('2026-10-20');assert.equal(area(m).total,30);assert.equal(area(m).done,0);assert.equal(area(m).pct,0);
});
check('excluded unknown quantities do not block known completion scope',()=>{
 const m=context(page,['BAR-C','BAR-D'],{'BAR-C':{q:null}}).read();assert.equal(area(m).total,30);assert.equal(type(m).total,30);assert.equal(type(m).done,10);
});
check('all excluded yields no artificial 100 percent',()=>{
 const m=context(page,['BAR-A','BAR-B','BAR-C','BAR-D']).read();assert.equal(area(m).total,0);assert.equal(area(m).done,0);assert.equal(area(m).pct,null);assert.equal(type(m).total,0);assert.equal(type(m).pct,null);
});
check('complete included scope reaches exactly 100 while record statuses stay separate',()=>{
 const m=context(page,['BAR-B','BAR-D']).read();assert.equal(area(m).done,40);assert.equal(area(m).total,40);assert.equal(area(m).pct,100);assert.equal(type(m).pct,100);
});
check('exclusions are named in scope notes while source type keys remain visible',()=>{
 const m=context(page,['BAR-C','BAR-D']).read();assert(area(m).notes.some(n=>n.includes('BAR-C')&&n.includes('BAR-D')));assert(type(m).issues.some(n=>n.includes('Outside the completion count')));assert.deepStrictEqual(obj(type(m).keys),['BAR-A','BAR-B','BAR-C','BAR-D']);
});
check('milestone factual reference set retains excluded records and actual site history',()=>{
 const a=context(base),b=context(page,['BAR-A','BAR-C']),old=a.c.facts('barriers','2026-10-21'),now=b.c.facts('barriers','2026-10-21');
 assert.equal(now.total,2);assert.equal(now.recordTotal1098,4);assert.equal(now.complete,0);assert.equal(now.onsite,4);
 for(const k of ['firstOn','levelled','steps','numbered','numbersTotal','noNumber','withAcc','notLevelled','noSteps','noAcc','onsiteBy','movedMany','reticked','noHistory','types']) assert.deepStrictEqual(obj(now[k]),obj(old[k]),k);
 assert.equal(now.firstOn.key,'BAR-A');assert.equal(b.c.refsOf(b.c.area('barriers','2026-10-21')).length,4);
});
check('milestone unchanged without completion exclusions',()=>{
 assert.deepStrictEqual(obj(context(page).c.facts('barriers','2026-10-21')),obj(context(base).c.facts('barriers','2026-10-21')));
});
process.stdout.write('Passed '+passed+' synthetic native-model tests.\n');
