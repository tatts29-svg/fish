/* Author: Andrew Fisher. Source/render checks only; no browser or native writes. */
'use strict';
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const [candidatePath,basePath]=process.argv.slice(2);
if(!candidatePath||!basePath)throw new Error('Usage: node check_presentation1010.cjs candidate.html base.html');
const candidate=fs.readFileSync(candidatePath,'utf8'),base=fs.readFileSync(basePath,'utf8');
let checks=0,scripts=0;
const check=(name,fn)=>{fn();checks++;};
const between=(text,start,end)=>{const first=text.indexOf(start);assert(first>=0,start);const last=text.indexOf(end,first+start.length);assert(last>first,end);return text.slice(first,last);};
const keys=['today-help','subhire-help','truck-order-help','truck-window-help','coatesway-help','inventory-help'];
for(const key of keys)check('one stable disclosure '+key,()=>assert.equal(candidate.split("moreInfo('presentation1010|"+key+"'").length-1,1));
check('all inline scripts parse',()=>{
 for(const match of candidate.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script\s*>/gi)){
  if(/\bsrc\s*=|\btype\s*=\s*["'](?:application\/json|importmap|module)/i.test(match[1]))continue;
  new vm.Script(match[2],{filename:'inline-script-'+(++scripts)});
 }
 assert(scripts>90);
});
for(const [name,start,end] of [
 ['shared DATA','const DATA = ','\nconst '],
 ['critical curfew','/* curfew */','/* share */'],
 ['staff render and save','const names=m.names.map(n=>','function mount(pane,day,before)'],
 ['Demob render','function renderDemob816(){','function dayHtml816'],
 ['P&L ledger renderer','function statement(rows) {','const priorOnsite = onsiteCompleteHtml979;'],
 ['More info persistence','function moreInfo(key, inner){','function foldStories(root){'],
 ['machine actions and status',' <div class="cwmact">','function machineCardWire(){'],
])check(name+' unchanged',()=>assert.equal(between(candidate,start,end),between(base,start,end)));
check('machine introduction exists once inside retained help',()=>{
 assert.equal(candidate.split('This job, laid against the cog.').length-1,1);
 const render=between(candidate,'function renderCoatesWay_held(){','function machineCardHtml(){');
 assert(!render.includes('This job, laid against the cog.'));
 const card=between(candidate,'function machineCardHtml(){','function machineCardWire(){');
 assert(card.includes("moreInfo('presentation1010|coatesway-help'"));
 assert(card.includes('id="cwOpenMachine"'));assert(card.includes('id="cwMachineState"'));
});

const esc=x=>String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
let model;
const ctx={esc,SFOLD_OPEN:new Set(),flow891Day:()=>model,capability:()=> 'edit',SYNC:{readonly:false},
 FLOW891_PEOPLE_PER_UNLOAD:2,FLOW891_TRUCKS_AT_ONCE:7,flow891Refs:g=>g.ref,flow891Span:()=> 'window',
 flow891Clock:String,flow891PitLaneMax:()=>({words:'limit 2'}),clock782:()=> '05:00',LOAD_BY782:300,
 UNLOAD_MIN782:30,GUIDE826:'https://example.test/guide',navUrl:()=> 'https://example.test/map',fmtDate:String,
 FLOW891:{source:'Fixture',holding:{ll:[-27,153],name:'Holding',approx:'10 m'},
 areas:{mainBeach:{words:'1',said:'one'},pitLane:{words:'2',said:'two'},helenPark:{words:'4',said:'four'}},
 oversized:{total:7,split:'4 + 2 + 1',said:'seven'},curfew:{said:'curfew'},order:{said:'order'}}};
vm.createContext(ctx);
vm.runInContext(between(candidate,'function moreInfo(key, inner){','/* a fold drawn'),ctx);
vm.runInContext(between(candidate,'function flow891Card(d){','const dayPanelsBefore891'),ctx);
const fixture=(unknown=2)=>({loads:2,people:{count:4,allows:2,names:4},
 deliveries:[{n:1,g:{ref:'WC01'},win:{known:false}},{n:2,g:{ref:'WC02'},win:{known:false}}],areas:[],
 unknownWindows:unknown,oversized:{count:1,peak:1,untimed:1},
 curfew:[{n:2,id:'load-2',g:{ref:'WC02'},curfew:{state:'late',words:'Arrival misses curfew',fix:'move earlier'}}],share:[]});
check('unknown count visible; method closed',()=>{
 model=fixture();const html=ctx.flow891Card({iso:'2026-10-14'});
 assert(html.includes('2 loads have no arrival window yet.</p><details'));
 assert(html.includes('data-sfold="presentation1010|truck-window-help"><summary'));
 assert(html.includes('Arrival misses curfew'));
 assert(html.includes('data-flow891-first="load-2"'));
 assert(html.includes('WC01')&&html.includes('WC02'));
});
check('fresh count changes without changing disclosure identity',()=>{
 model=fixture(1);const html=ctx.flow891Card({iso:'2026-10-15'});
 assert(html.includes('1 load has no arrival window yet.</p><details'));
 assert(!html.includes('2 loads have no arrival window yet'));
 assert(html.includes('data-sfold="presentation1010|truck-window-help"'));
});
check('cleared window warning leaves no stale disclosure',()=>{
 model=fixture(0);const html=ctx.flow891Card({iso:'2026-10-14'});
 assert(!html.includes('presentation1010|truck-window-help'));
 assert(html.includes('Arrival misses curfew'));
});
check('expanded help persists through redraw',()=>{
 ctx.SFOLD_OPEN.add('presentation1010|truck-order-help');model=fixture();
 assert(ctx.flow891Card({iso:'2026-10-14'}).includes('data-sfold="presentation1010|truck-order-help" open'));
});
check('no load / stale content guard',()=>{model={loads:0};assert.equal(ctx.flow891Card({iso:'2026-10-14'}),'');});
console.log(JSON.stringify({author:'Andrew Fisher',checks,scripts,operationalWrites:0},null,2));
