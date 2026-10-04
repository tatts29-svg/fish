// Author: Andrew Fisher. Read-only candidate/native integration checks.
// PAGE, BASE and private OUT are required; optional CANDIDATE_SHA and GC500_TOOLCHAIN.
// This file contains generic logic only. Actual records and screenshots go to private OUT.
'use strict';
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const hash=b=>crypto.createHash('sha256').update(b).digest('hex');
const round=n=>Math.round(n*100)/100;
const definitions=[
 ['buildings','Portable buildings',/building|ticket\s*box|\bcont(?:ainer)?\b/i],
 ['toilets','Toilets & amenities',/toilet|\bfwf\b|pan\s*block|pee\s*panel/i],
 ['generators','Generators',/generator|\d\s*kva\b|\bkva\b/i],
 ['lighting','Lighting towers',/light(?:ing)?\s*tower/i],
 ['equipment','Forklifts & access',/forklift|telehandler|scissor|boom\s*lift|cherry\s*picker|\bewp\b|access\s*platform/i]
];
// Independent native-input oracle: no calls to todayWorkMetrics840 or its helpers.
function oracle840(input){
 const productGroups={Access:'Forklifts & access',VMS:'VMS boards',Trakmat:'Track mat',WFB:'Water-filled barriers',Toilet:'Toilets & amenities','Portable Building':'Portable buildings',Generator:'Generators','Light Tower':'Lighting towers'};
 const group=a=>productGroups[a.product]||a.product||(a.discipline==='Access & plant'?'Forklifts & access':a.discipline);
 const accessory=/tank|sink|fridge|refrigerator(?!\s*cont)|chair|table|desk|stair|step|tynes?|tines?|attachment|forklift\s*forks/i;
 const active=input.assets.filter(a=>!a.cancelled&&!a.relocation&&!a.restOf&&!a.movedAway),out=[];
 for(const[id,category,accepts]of definitions){const rows=[];for(const a of active.filter(a=>group(a)===category)){
   const separatePart=/\b(?:tynes?|tines?|attachments?|forks)\b|^(?:stairs?|steps?|fridge|chairs?|tables?|desks?|cables?)\b/i;
   const relevant=a.lines.filter(l=>!separatePart.test(l.item)&&!(accessory.test(l.item)&&!accepts.test(l.item)));
   if(!relevant.length&&a.lines.length)continue;
   const physical=relevant.filter(l=>l.item&&accepts.test(l.item)&&!(id==='toilets'&&/tank/i.test(l.item)));
   const qty=q=>q!=null&&Number.isInteger(q)&&q>=0;
   const known=physical.filter(l=>qty(l.quantity)).reduce((sum,l)=>sum+l.quantity,0);
   const unknown=!a.lines.length||physical.length!==relevant.length||physical.some(l=>!qty(l.quantity));
   if(!unknown&&known===0)continue;
   const conflict=!!a.delivery.done&&physical.some(l=>a.shortItems.includes(l.item)),complete=!!a.delivery.done&&!conflict;
   rows.push({key:a.key,quantity:unknown?null:known,knownQuantity:known,recordedComplete:!!a.delivery.done,complete,done:complete?known:0,remaining:unknown||conflict?null:known-(complete?known:0),unknown,conflict,unrecorded:!a.delivery.recorded&&!a.delivery.done});
  }
  const knownTotal=rows.reduce((s,r)=>s+r.knownQuantity,0),done=rows.reduce((s,r)=>s+r.done,0),unknown=rows.filter(r=>r.unknown).length,conflicts=rows.filter(r=>r.conflict).length,total=unknown?null:knownTotal;
  out.push({id,total,knownTotal,done,remaining:total==null||conflicts?null:Math.max(0,total-done),pct:total>0&&!conflicts?round(done/total*100):null,totalRefs:rows.length,completeRefs:rows.filter(r=>r.complete).length,unknownQuantityRefs:unknown,shortConflictRefs:conflicts,unrecordedRefs:rows.filter(r=>r.unrecorded).length,rows});
 }
 const builds=input.weeks.filter(w=>w.phase==='Build'),seen=new Set();let known=!!input.clean&&builds.length>0,total=0;
 for(const w of builds){const p=w.plan;const value=p?.quantity;if(!p||!(p.year===2026||p.rolledForward)||value==null||String(value).trim()===''||!Number.isFinite(Number(value))||Number(value)<0||!p.sheet||seen.has(p.sheet)){known=false;continue;}seen.add(p.sheet);total+=Number(value);}
 const buildNames=new Set(builds.map(w=>w.sheet)),dockets=input.clean?input.dockets.filter(d=>{const q=d.quantity;if(q==null||!Number.isFinite(Number(q))||Number(q)<=0||!/^\d{4}-\d{2}-\d{2}$/.test(d.date||'')||d.date>input.asOf||!d.usable||(d.scope||'programme')!=='programme')return false;const dated=input.weeks.find(w=>w.start&&w.end&&w.start<=d.date&&w.end>=d.date);return (!dated||dated.phase==='Build')&&buildNames.has(d.week)&&(!dated||dated.sheet===d.week);}):[];
 const done=input.clean?round(dockets.reduce((sum,d)=>sum+Number(d.quantity),0)):null;total=round(total);
 out.splice(2,0,{id:'fencing',total:known?total:null,knownTotal:total,done,remaining:known&&done!=null?round(Math.max(0,total-done)):null,pct:known&&total>0&&done!=null?round(Math.min(100,done/total*100)):null,totalRefs:dockets.length,completeRefs:dockets.length,rows:dockets.map(d=>({docketId:d.id||null,quantity:Number(d.quantity),done:Number(d.quantity)}))});return out;
}

function installWriteGuard(){
 const state={nonGetSeen:[],blocked:[],consoleErrors:[]};const safe=value=>{try{const u=new URL(value);return u.origin+(u.pathname.startsWith('/e/')?'/e/[redacted]':u.pathname);}catch{return '[unparseable]';}};
 const entry=r=>({method:r.method(),url:safe(r.url()),operational:r.url().startsWith('https://gc500-production.up.railway.app/')});
 const {chromium}=require('playwright'),launch=chromium.launch.bind(chromium);
 chromium.launch=async options=>{const browser=await launch(options),newContext=browser.newContext.bind(browser);browser.newContext=async options=>{
   const context=await newContext({...options,serviceWorkers:'block'});context.on('request',r=>{if(!/^(data|blob):/.test(r.url())&&r.method()!=='GET')state.nonGetSeen.push(entry(r));});
   const wrapRoutes=o=>{const route=o.route.bind(o);o.route=(pattern,handler,options)=>route(pattern,async(r,...args)=>{const q=r.request();if(!/^(data|blob):/.test(q.url())&&q.method()!=='GET'){state.blocked.push(entry(q));return r.abort('blockedbyclient');}return handler(r,...args);},options);};
   wrapRoutes(context);const newPage=context.newPage.bind(context);context.newPage=async()=>{const p=await newPage();wrapRoutes(p);p.on('console',m=>{if(m.type()==='error')state.consoleErrors.push({text:m.text().replace(/\/e\/[^\s/?]+/g,'/e/[redacted]').slice(0,500),url:safe(m.location()?.url||'')});});return p;};return context;
  };return browser;};return state;
}

async function nativeInputs(page,asOf){return page.evaluate(day=>{
 const cleanColumns=FCOL.filter(c=>c.unit==='m'&&/Temporary Fence/i.test(c.programme_type||'')&&/Clean/i.test(c.programme_type||'')),clean=cleanColumns.length===1?cleanColumns[0]:null;
 return {asOf:day,clean:clean?{key:clean.key,programmeType:clean.programme_type}:null,
  assets:allAssets().map(a=>({key:a.key,product:a.product||null,discipline:a.discipline||null,cancelled:!!a._cancelled,relocation:!!a.relocation,restOf:!!a.rest_of,movedAway:!!movedAway(a.key),lines:(chargeLines(a)||[]).map(l=>({item:String(l.item||'').trim(),quantity:qtyOf(l)})),delivery:deliveryAsOf(a.key,day),shortItems:(shortOf(a)||[]).map(s=>s.item)})),
  weeks:(DATA.weeks||[]).map(w=>{const p=progSheetOf(w.sheet),q=p&&clean?(p.totals||{})[clean.programme_type]:null;return {sheet:w.sheet,start:w.start,end:w.end,phase:w.phase,plan:p?{sheet:p.sheet,year:p.year,rolledForward:!!p.rolled_forward,quantity:q}:null};}),
  dockets:allDockets().map(d=>({id:d.id||null,date:d.date||null,week:d.week||null,usable:!!d.usable,scope:d.scope||null,quantity:clean?(d.quantities||{})[clean.key]:null}))};
 },asOf);}

async function nativeSnapshot(page){return page.evaluate(()=>{
 const functions={};for(const name of ['renderTimeline','renderTimeline_held','paneHeadingHtml','dsnBoard','motionApply','lightTally','allAssets','progressAsOf','askedTot']){try{const fn=eval(name);functions[name]=typeof fn==='function'?fn.toString():null;}catch{functions[name]=null;}}
 const header=document.querySelector('header.top');const headerShape=header?[...header.querySelectorAll('*')].map(e=>({tag:e.tagName,id:e.id||null,role:e.getAttribute('role'),type:e.getAttribute('type')})):null;
 const media=[...document.querySelectorAll('#pane-today .bhero[data-board="video"] video source')].map(e=>({type:e.type,src:e.getAttribute('src')}));
 const nativeCollections=Object.fromEntries(Object.entries(SYNC_COLLS).map(([key,d])=>[key,d.get()]));
 return {functions,headerShape,media,collections:nativeCollections,tabs:TABS.map(t=>t[0]),timelineTally:lightTally(allAssets()),date:todayIso(),motion:window.TodayMotion820?.report?.()||null};
 });}

async function ready840(page,candidate=true){
 await page.waitForFunction(()=>typeof go==='function'&&typeof SYNC!=='undefined',null,{timeout:45000});
 await page.waitForFunction(()=>SYNC.status==='live'&&SYNC.first.size===Object.keys(SYNC_COLLS).length,null,{timeout:180000});
 if(candidate){await page.waitForFunction(()=>typeof todayWorkMetrics840==='function'&&window.TodayWork840&&todayWorkHealth840().ready,null,{timeout:15000});await page.locator('#gc500-work-board840').waitFor({state:'visible',timeout:15000});}
}
const eq=(a,b)=>JSON.stringify(a)===JSON.stringify(b);
const fmt=n=>n==null||!Number.isFinite(n)?'—':Number(n).toLocaleString('en-AU',{maximumFractionDigits:2});
async function geometry840(page){return page.evaluate(()=>{
 const main=document.querySelector('main'),board=document.querySelector('#gc500-work-board840'),nav=board?.querySelector('.tw840-nav');
 const rect=e=>{const r=e.getBoundingClientRect();return {x:r.x,y:r.y,right:r.right,bottom:r.bottom,width:r.width,height:r.height};};
 return {width:innerWidth,windowX:scrollX,windowY:scrollY,document:document.documentElement.scrollWidth,main:{client:main.clientWidth,scroll:main.scrollWidth,top:main.scrollTop,rect:rect(main)},board:{client:board.clientWidth,scroll:board.scrollWidth,rect:rect(board)},nav:rect(nav),cards:[...board.querySelectorAll('[data-tw840-area]')].map(e=>({id:e.dataset.tw840Area,rect:rect(e),client:e.clientWidth,scroll:e.scrollWidth,heading:rect(e.querySelector('h3')),motion:rect(e.querySelector('[data-tw840-motion]')),buttons:[...e.querySelectorAll('.tw840-counts button')].map(rect),filter:getComputedStyle(e.querySelector('.tw840-segments')).filter,svgIds:[...e.querySelectorAll('svg [id]')].map(x=>x.id)}))};
 });}
async function boardTop840(page){await page.evaluate(()=>{const main=document.querySelector('main'),b=document.querySelector('#gc500-work-board840');main.scrollTop+=b.getBoundingClientRect().top-main.getBoundingClientRect().top-14;});await page.waitForTimeout(300);}
async function focus840(page){return page.evaluate(()=>({token:document.activeElement?.dataset.tw840Focus||null,id:document.activeElement?.id||null,reference:document.activeElement?.dataset.tw840Reference||null,main:document.querySelector('main').scrollTop,x:scrollX,y:scrollY,dialog:document.querySelector('#gc500-work-dialog840')?.scrollTop||0}));}
async function model840(page){return page.evaluate(()=>({day:todayIso(),health:todayWorkHealth840(),areas:todayWorkMetrics840(todayIso()),report:TodayWork840.report()}));}
async function motion840(page){return page.evaluate(()=>({work:TodayWork840.report(),native:window.TodayMotion820?.report?.()||null,active:[...document.querySelectorAll('#gc500-work-board840 .tw840-running')].map(e=>({id:e.dataset.tw840Area,sheen:getComputedStyle(e.querySelector('.tw840-display'),'::after').animationName,play:getComputedStyle(e.querySelector('.tw840-display'),'::after').animationPlayState})),dialog:!!document.querySelector('#gc500-work-dialog840')?.open}));}
async function run(){
 const {PAGE,BASE,OUT,CANDIDATE_SHA}=process.env;if(!PAGE||!BASE||!OUT)throw Error('Set PAGE, BASE and a private OUT directory');
 fs.mkdirSync(OUT,{recursive:true});const candidate=hash(fs.readFileSync(PAGE)),base=hash(fs.readFileSync(BASE));if(CANDIDATE_SHA&&candidate!==CANDIDATE_SHA)throw Error('Candidate SHA mismatch before browser launch');
 const initial=process.env.INITIAL_ONLY==='1';
 const report={author:'Andrew Fisher',at:new Date().toISOString(),candidate,base,scope:'Local candidate at public view address; live GETs only; emulated desktop and phone; no publication',initial,checks:[],views:[]};
 const check=(name,pass,evidence)=>{report.checks.push({name,pass:!!pass,evidence});console.log((pass?'PASS ':'FAIL ')+name);};
 const guard=installWriteGuard(),toolchain=process.env.GC500_TOOLCHAIN||path.resolve(__dirname,'../toolchain'),{open}=require(path.join(toolchain,'harness/open_page.js'));let session,baseline;const baselines={};
 try{
  if(!initial){session=await open({pageFile:BASE,hash:'#today',W:1700,H:1100});await ready840(session.page,false);await session.page.evaluate(()=>{localStorage.setItem('gc500.band','shown');go('today');});for(const bview of [{name:'desktop',width:1700,height:1100},{name:'phone',width:390,height:844},{name:'4k',width:3840,height:2160}]){await session.page.setViewportSize({width:bview.width,height:bview.height});await session.page.evaluate(()=>render());await session.page.waitForTimeout(400);baselines[bview.name]=await nativeSnapshot(session.page);}baseline=baselines.desktop;report.baselines=baselines;check('Baseline live hydration',true,{collections:Object.keys(baseline.collections).length});await session.browser.close();session=null;}
  for(const view of [{name:'desktop',W:1700,H:1100,dpr:1},{name:'phone',W:390,H:844,dpr:2,mobile:true},{name:'4k',W:3840,H:2160,dpr:1}]){
   session=await open({pageFile:PAGE,hash:'#today',...view});const p=session.page;await ready840(p);const model=await model840(p),input=await nativeInputs(p,model.day),expected=oracle840(input),native=await nativeSnapshot(p);const evidence={view,model,input,expected,native};report.views.push(evidence);
   check(view.name+' full shared-record hydration',model.health.ready&&model.health.status==='live',{health:model.health,collections:Object.keys(native.collections).length});
   check(view.name+' six native work categories',eq(model.areas.map(x=>x.id),['buildings','toilets','fencing','generators','lighting','equipment'])&&model.areas.find(x=>x.id==='equipment')?.name==='Equipment');
   for(const e of expected){const actual=model.areas.find(x=>x.id===e.id),fields=['total','knownTotal','done','remaining','pct','totalRefs','completeRefs',...(e.id==='fencing'?[]:['unknownQuantityRefs','shortConflictRefs','unrecordedRefs'])];const diff=fields.filter(k=>!eq(e[k],actual[k])).map(k=>({field:k,expected:e[k],actual:actual[k]}));
    const rowFields=e.id==='fencing'?['docketId','quantity','done']:['key','quantity','knownQuantity','recordedComplete','complete','done','remaining'];const reduce=rows=>rows.map(r=>Object.fromEntries(rowFields.map(k=>[k,r[k]]))).sort((a,b)=>String(a.key||a.docketId).localeCompare(String(b.key||b.docketId)));
    check(view.name+' '+e.id+' independent native arithmetic and row membership',!diff.length&&eq(reduce(e.rows),reduce(actual.rows)),{diff,expectedRows:reduce(e.rows),actualRows:reduce(actual.rows)});
   }
   const ui=await p.locator('[data-tw840-area]').evaluateAll(nodes=>nodes.map(e=>({id:e.dataset.tw840Area,done:e.querySelector('[data-tw840-mode=done] strong').textContent,left:e.querySelector('[data-tw840-mode=left] strong').textContent,caption:e.querySelector('.tw840-caption').textContent,sr:e.querySelector('.tw840-sr').textContent,heading:e.querySelector('h3').textContent})));
   const mismatch=ui.filter(u=>{const a=model.areas.find(x=>x.id===u.id),suffix=a.unit==='m'?'m':'';return u.done!==fmt(a.done)+suffix||u.left!==fmt(a.remaining)+suffix||u.sr!==(a.pct==null?'Completion percentage unavailable':Math.round(Math.max(0,Math.min(100,a.pct)))+'% '+(a.id==='fencing'?'clean work recorded':'recorded complete'));});
   check(view.name+' rendered counts and OLED agree with live model',mismatch.length===0,{ui,mismatch});
   const markers=await p.evaluate(()=>({old:[...document.querySelectorAll('#pane-today .island.lights,#pane-today .island.dialcard,#pane-today [data-lf-go],#pane-today .advicecard,#pane-today [data-advice]')].filter(e=>e.getBoundingClientRect().height>0).map(e=>e.className||e.dataset),sample:/illustrative sample|sample data|demonstration data/i.test(document.querySelector('#gc500-work-board840').textContent),tabs:TABS.length}));
   check(view.name+' Today delivery-workflow blocks removed and 22 tabs retained',!markers.old.length&&!markers.sample&&markers.tabs===22,markers);
   if(baseline){baseline=baselines[view.name];const changed=Object.keys(baseline.functions).filter(k=>baseline.functions[k]!==native.functions[k]);check(view.name+' Timeline and native calculation functions preserved',changed.length===0,{changed});check(view.name+' header structure and media source descriptors preserved',!!native.headerShape?.length&&!!baseline.headerShape?.length&&native.media.length>0&&eq(baseline.headerShape,native.headerShape)&&eq(baseline.media,native.media),{headerSame:eq(baseline.headerShape,native.headerShape),mediaSame:eq(baseline.media,native.media)});}
   await boardTop840(p);const geom=await geometry840(p);evidence.geometry=geom;
   check(view.name+' page main and six cards have no horizontal overflow',geom.document<=geom.width+1&&geom.main.scroll<=geom.main.client+1&&geom.board.scroll<=geom.board.client+1&&geom.cards.every(c=>c.scroll<=c.client+1),geom);
   check(view.name+' headings clear motion controls and touch targets are usable',geom.cards.every(c=>c.heading.right<=c.motion.x+1&&c.motion.width>=44&&c.motion.height>=44&&c.buttons.every(b=>b.height>=44&&b.width>=44)),geom.cards);
   const ids=geom.cards.flatMap(c=>c.svgIds);check(view.name+' vector digits have unique IDs and no blur filter',new Set(ids).size===ids.length&&geom.cards.every(c=>c.filter==='none'),{ids,filters:geom.cards.map(c=>c.filter)});
   await p.screenshot({path:path.join(OUT,'today840-'+view.name+'.png')});
   if(view.name==='phone'){await p.locator('[data-tw840-detail=toilets][data-tw840-mode=left]').click();await p.screenshot({path:path.join(OUT,'today840-phone-detail.png')});await p.keyboard.press('Escape');}
   if(!initial){
    await p.locator('[data-tw840-jump=equipment]').click();await p.waitForTimeout(700);const jumped=await p.evaluate(()=>{const h=document.querySelector('[data-tw840-area=equipment] h3'),nav=document.querySelector('.tw840-nav'),main=document.querySelector('main');return {focused:document.activeElement===h,heading:h.getBoundingClientRect().top,navBottom:nav.getBoundingClientRect().bottom,mainTop:main.scrollTop,x:scrollX,y:scrollY};});check(view.name+' category jump focuses heading below sticky nav in native main',jumped.focused&&jumped.heading>=jumped.navBottom-1&&jumped.mainTop>0&&jumped.x===0&&jumped.y===0,jumped);
    let before=await focus840(p);await p.evaluate(()=>renderToday());await p.waitForTimeout(250);let after=await focus840(p);check(view.name+' forced native redraw retains focused category and main scroll',before.token===after.token&&Math.abs(before.main-after.main)<=1&&before.x===after.x&&before.y===after.y,{before,after});
    await p.evaluate(()=>render());await p.waitForTimeout(250);after=await focus840(p);check(view.name+' full native render retains focused category and main scroll',before.token===after.token&&Math.abs(before.main-after.main)<=1,{before,after});
    await p.waitForTimeout(6500);after=await focus840(p);check(view.name+' focus and native main scroll survive polling window',before.token===after.token&&Math.abs(before.main-after.main)<=1,{before,after});
    for(const a of model.areas){for(const mode of ['done','left']){const selector='[data-tw840-detail='+a.id+'][data-tw840-mode='+mode+']';await p.locator(selector).click();const state=await p.evaluate(()=>{const d=document.querySelector('#gc500-work-dialog840');return {open:d.open,mode:d.dataset.mode,rows:[...d.querySelectorAll('.tw840-detail-row')].map(r=>({key:r.querySelector('[data-tw840-reference]')?.dataset.tw840Reference||null,quantity:r.querySelector('strong').textContent})),scroll:d.scrollWidth,client:d.clientWidth,rect:{right:d.getBoundingClientRect().right,left:d.getBoundingClientRect().left},motion:TodayWork840.report().running};});
      const rows=a.rows.filter(r=>mode==='done'?(r.complete||r.done>0):(!r.complete||r.remaining>0));const want=rows.map(r=>({key:r.key||null,quantity:fmt(mode==='done'?r.done:r.remaining)+(a.unit==='m'?' m':'')}));
      check(view.name+' '+a.id+' '+mode+' detail reflects record rows without overflow',state.open&&state.mode===mode&&eq(state.rows,want)&&state.scroll<=state.client+1&&state.rect.left>=0&&state.rect.right<=view.W&&state.motion==null,{state,want});
      if(view.name==='desktop'&&a.id==='buildings'&&mode==='left'&&rows.filter(r=>r.key).length>2){
       await p.locator('#gc500-work-dialog840 [data-tw840-reference]').nth(1).focus();const refBefore=await focus840(p);
       try{await p.evaluate(()=>{window.__qaNativeMetric840=todayWorkMetrics840;todayWorkMetrics840=function(day){const areas=__qaNativeMetric840(day),target=areas.find(a=>a.id==='buildings'),focused=document.activeElement?.dataset.tw840Reference;target.rows=target.rows.filter((r,i)=>i!==0||r.key===focused).reverse();return areas;};renderToday();});await p.waitForTimeout(150);const refAfter=await focus840(p);check('Modal reference identity survives local model row reorder/removal',refAfter.reference===refBefore.reference&&refAfter.reference!=null,{before:refBefore,after:refAfter,scope:'In-memory derived-model reorder only; native records and network untouched'});}
       finally{await p.evaluate(()=>{todayWorkMetrics840=__qaNativeMetric840;delete window.__qaNativeMetric840;renderToday();});await p.waitForTimeout(150);}
       await p.locator('#gc500-work-dialog840 [data-tw840-close]').focus();
      }
      const focusBefore=await focus840(p);await p.evaluate(()=>renderToday());await p.waitForTimeout(150);const focusAfter=await focus840(p);check(view.name+' '+a.id+' '+mode+' modal survives redraw',await p.locator('#gc500-work-dialog840').evaluate(d=>d.open)&&focusBefore.token===focusAfter.token&&Math.abs(focusBefore.main-focusAfter.main)<=1,{focusBefore,focusAfter});await p.keyboard.press('Escape');const closed=await focus840(p);check(view.name+' '+a.id+' '+mode+' close returns trigger focus',closed.token===a.id+'-'+mode&&Math.abs(closed.main-focusBefore.main)<=1,{closed,focusBefore});
     }}
    const programme=p.locator('#pane-today .racecard');await programme.scrollIntoViewIfNeeded();await p.waitForTimeout(200);await programme.locator('.today-motion-button').click();let nativeBefore=await motion840(p);check(view.name+' original programme motion is still usable',nativeBefore.native?.running==='programme'&&nativeBefore.native.animations>0,nativeBefore);
    await p.evaluate(()=>document.querySelector('[data-tw840-detail=buildings][data-tw840-mode=left]').click());let modalMotion=await motion840(p);check(view.name+' work modal also stops native programme motion',modalMotion.dialog&&!modalMotion.native?.running&&modalMotion.native?.animations===0&&!modalMotion.native?.guardActive,modalMotion);await p.keyboard.press('Escape');
    await boardTop840(p);await p.locator('[data-tw840-motion=buildings]').click();let m=await motion840(p);check(view.name+' selected visible work card alone animates',m.work.running==='buildings'&&m.active.length===1&&m.active[0].sheen==='tw840-sheen'&&!m.native?.running,m);
    await p.locator('[data-tw840-motion=buildings]').click();m=await motion840(p);check(view.name+' work pause halts the sheen',m.work.running==null&&!m.active.length,m);
    await p.locator('[data-tw840-motion=buildings]').click();await p.evaluate(()=>{localStorage.setItem('gc500.motion','off');motionApply();});m=await motion840(p);check(view.name+' native motion Off halts work animation',m.work.running==null&&!m.active.length,m);
    await p.evaluate(()=>{localStorage.setItem('gc500.motion','subtle');motionApply();});await p.emulateMedia({reducedMotion:'reduce'});m=await motion840(p);check(view.name+' reduced motion prevents work animation',m.work.reduced&&m.work.running==null&&!m.active.length,m);await p.emulateMedia({reducedMotion:'no-preference'});await p.waitForTimeout(150);
    await p.locator('[data-tw840-motion=buildings]').click();await p.locator('[data-tw840-detail=buildings][data-tw840-mode=left]').click();m=await motion840(p);check(view.name+' open details pause work animation',m.dialog&&!m.work.running&&!m.active.length,m);await p.keyboard.press('Escape');
    await p.evaluate(()=>go('timeline'));await p.waitForTimeout(500);m=await motion840(p);check(view.name+' Timeline navigation releases work animation',!m.work.running&&!m.active.length&&await p.locator('#pane-timeline').isVisible(),m);await p.evaluate(()=>go('today'));await p.waitForTimeout(250);
   }
   if(!initial&&view.name==='desktop'){
    await p.evaluate(()=>{localStorage.setItem('gc500.band','shown');go('today');});const hero=p.locator('#pane-today .bhero[data-board=video]');await hero.scrollIntoViewIfNeeded();await p.waitForTimeout(300);
    const mediaState=()=>p.evaluate(()=>{const h=document.querySelector('#pane-today .bhero[data-board=video]'),v=h.querySelector('video');return {paused:v.paused,time:v.currentTime,handler:typeof h.querySelector('.bplay').onclick==='function',sources:[...v.querySelectorAll('source')].map(s=>({type:s.type,src:s.getAttribute('src')})),playing:h.classList.contains('playing'),error:v.error?.code||null};});
    let media=await mediaState();check('Native MP4 remains paused with Play handler before explicit playback',media.paused&&media.handler&&media.sources.some(s=>s.type==='video/mp4'),media);
    await hero.locator('.bplay').click();let played=true;try{await p.waitForFunction(()=>{const v=document.querySelector('#pane-today .bhero video');return v&&!v.paused&&v.currentTime>.4;},null,{timeout:18000});}catch{played=false;}media=await mediaState();check('Original native video supports explicit real playback',played&&media.playing&&!media.paused,media);
    await p.evaluate(()=>{window.__qaOldVideo840=document.querySelector('#pane-today .bhero video');window.__qaOldPlay840=document.querySelector('#pane-today .bhero .bplay');renderToday();});await p.waitForTimeout(200);const replaced=await p.evaluate(()=>({oldPaused:__qaOldVideo840.paused,oldConnected:__qaOldVideo840.isConnected,oldHandler:!!__qaOldPlay840.onclick,newPaused:document.querySelector('#pane-today .bhero video').paused}));check('Native redraw disposes old player and leaves replacement paused',replaced.oldPaused&&!replaced.oldConnected&&!replaced.oldHandler&&replaced.newPaused,replaced);
    await p.evaluate(()=>go('timeline'));await p.waitForTimeout(150);check('Leaving Today releases native media resources',await p.evaluate(()=>!BOARD_RUN.stopMedia&&!BOARD_RUN.disposeMedia));await p.evaluate(()=>go('today'));
   }
   evidence.finalNative=await nativeSnapshot(p);check(view.name+' browser has no runtime errors',session.errors.length===0,session.errors);evidence.network=session.counts;await session.browser.close();session=null;
  }
  check('Exact candidate remains unchanged throughout checks',hash(fs.readFileSync(PAGE))===candidate);
 }catch(e){check('Integration execution',false,String(e.message).replace(/\/e\/[^\s/?]+/g,'/e/[redacted]'));if(session){report.failureErrors=session.errors;try{await session.page.screenshot({path:path.join(OUT,'today840-failure.png')});report.failureState=await session.page.evaluate(()=>({body:document.body.innerText.slice(0,12000),sync:typeof SYNC!=='undefined'?{status:SYNC.status,first:[...SYNC.first],errors:SYNC.errors}:null}));}catch{}}}
 finally{if(session)await session.browser.close();report.guard=guard;check('Every non-GET request blocked before transport',guard.nonGetSeen.length===guard.blocked.length,{seen:guard.nonGetSeen,blocked:guard.blocked});check('No operational record-write attempt',!guard.nonGetSeen.some(x=>x.operational),guard.nonGetSeen.filter(x=>x.operational));report.passed=report.checks.filter(c=>c.pass).length;report.total=report.checks.length;fs.writeFileSync(path.join(OUT,'today840.json'),JSON.stringify(report,null,2));console.log(JSON.stringify({passed:report.passed,total:report.total,candidate}));if(report.passed!==report.total)process.exitCode=1;}
}
module.exports={oracle840,nativeInputs,nativeSnapshot,installWriteGuard,ready840,motion840};
if(require.main===module)run().catch(e=>{console.error(String(e.message).replace(/\/e\/[^\s/?]+/g,'/e/[redacted]'));process.exitCode=2;});
