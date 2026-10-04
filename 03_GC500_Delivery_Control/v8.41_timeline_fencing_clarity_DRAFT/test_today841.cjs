// Author: Andrew Fisher. Independent read-only Today integration checks, v8.41.
// PAGE and private OUT required. Run under /tmp/gc500-browser.lock.
// LIVE=1 verifies upstream public bytes and never supplies a local page substitute.
// Browser/native values and screenshots are private evidence; no fixtures from the live record belong here.
'use strict';
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const {oracle840,nativeInputs,nativeSnapshot,installWriteGuard,ready840}=require('../v8.40_today_work_progress_LIVE/test_today840.cjs');
const hash=b=>crypto.createHash('sha256').update(b).digest('hex');
const same=(a,b)=>JSON.stringify(a)===JSON.stringify(b);
const round=n=>Math.round(n*100)/100;
const fmt=n=>n==null||!Number.isFinite(n)?'—':Number(n).toLocaleString('en-AU',{maximumFractionDigits:2});
const rowDefs=[['clean','m'],['scrim','m'],['v_gates','each'],['ped_gates','each'],['ccb_event','m'],['ccb_demarc','m'],['relocation','m'],['removal','m'],['fence_blocks','each'],['labour','h']];

// Separate native-input oracle: no calls to todayFencingSummary841 or its helpers.
function fencingOracle841(input){
 const builds=input.weeks.filter(w=>w.phase==='Build');
 const finite=value=>value!=null&&String(value).trim()!==''&&Number.isFinite(Number(value));
 const valid=(value,unit)=>finite(value)&&Number(value)>=0&&(unit!=='each'||Number.isInteger(Number(value)));
 return rowDefs.flatMap(([id,unit],index)=>{
  const optional=index>=8,columns=input.columns.filter(c=>c.key===id),column=columns.length===1?columns[0]:null;
  const supported=column&&(unit==='h'?['h','hr'].includes(column.unit):column.unit===unit)&&(optional?!column.programme_type:!!column.programme_type);
  if(!supported)return optional?[]:[{id,unit,recorded:null,planned:null,remaining:null,pct:null,offProgramme:null,recordCount:0}];
  const plans=builds.map(w=>w.plan),unique=new Set(plans.filter(Boolean).map(p=>p.sheet));
  const known=!optional&&plans.length>0&&unique.size===plans.length&&plans.every(p=>p&&p.sheet&&(p.year===2026||p.rolled_forward)&&valid(p.totals[column.programme_type],unit));
  const planned=known?round(plans.reduce((sum,p)=>sum+Number(p.totals[column.programme_type]),0)):null;
  const eligible=[],off=[];let excludedIssue=false;
  for(const d of input.dockets){
   const raw=(d.quantities||{})[id];if(raw==null||String(raw).trim()==='')continue;
   const dated=/^\d{4}-\d{2}-\d{2}$/.test(d.date||'');
   const period=dated?input.weeks.find(w=>w.start&&w.end&&w.start<=d.date&&w.end>=d.date):null;
   if(dated&&d.date>input.asOf||period&&period.phase!=='Build')continue;
   if(!valid(raw,unit)){excludedIssue=true;continue;}
   if(Number(raw)===0)continue;
   if(!dated||!d.usable||!builds.some(w=>w.sheet===d.week)||period&&period.sheet!==d.week){excludedIssue=true;continue;}
   ((d.scope||'programme')==='programme'?eligible:off).push(Number(raw));
  }
  const rawRecorded=eligible.reduce((n,q)=>n+q,0),recorded=round(rawRecorded),offProgramme=round(off.reduce((n,q)=>n+q,0));
  if(optional&&!recorded&&!offProgramme&&!excludedIssue)return [];
  return [{id,unit,recorded,planned,remaining:planned==null?null:round(Math.max(0,planned-rawRecorded)),pct:planned>0?round(Math.min(100,rawRecorded/planned*100)):null,offProgramme,recordCount:eligible.length}];
 });
}
async function fencingInputs841(page,day){return page.evaluate(asOf=>({asOf,columns:FCOL.map(c=>({key:c.key,unit:c.unit,programme_type:c.programme_type})),weeks:(DATA.weeks||[]).map(w=>{const p=progSheetOf(w.sheet);return {sheet:w.sheet,phase:w.phase,start:w.start,end:w.end,plan:p?{sheet:p.sheet,year:p.year,rolled_forward:p.rolled_forward,totals:p.totals||{}}:null};}),dockets:allDockets().map(d=>({date:d.date,week:d.week,scope:d.scope,usable:d.usable,quantities:d.quantities||{}}))}),day);}
async function settle(page,ms=300){await page.waitForTimeout(ms);}
async function boardTop(page){await page.evaluate(()=>{const m=document.querySelector('main'),b=document.querySelector('#gc500-work-board840');m.scrollTop+=b.getBoundingClientRect().top-m.getBoundingClientRect().top-14;});await settle(page);}
async function focusState(page){return page.evaluate(()=>({token:document.activeElement?.dataset.tw840Focus||null,reference:document.activeElement?.dataset.tw840Reference||null,id:document.activeElement?.id||null,main:document.querySelector('main').scrollTop,x:scrollX,y:scrollY,dialog:document.querySelector('#gc500-work-dialog840')?.scrollTop||0}));}
async function motionState(page){return page.evaluate(()=>{const p=document.querySelector('#pane-today'),m=p.closest('main'),clip=m.getBoundingClientRect();return {work:TodayWork840.report(),native:window.TodayMotion820?.report?.()||null,active:[...document.querySelectorAll('#gc500-work-board840 .tw840-running')].map(e=>({id:e.dataset.tw840Area,track:getComputedStyle(e.querySelector('.tw841-motion-track i')).animationName,play:getComputedStyle(e.querySelector('.tw841-motion-track i')).animationPlayState})),dialog:!!document.querySelector('#gc500-work-dialog840')?.open,visible:[...document.querySelectorAll('[data-tw840-area]')].filter(e=>{const r=(e.querySelector('.tw841-motion-track')||e).getBoundingClientRect();return !p.hidden&&getComputedStyle(p).display!=='none'&&r.bottom>Math.max(0,clip.top)&&r.top<Math.min(innerHeight,clip.bottom)&&r.right>clip.left&&r.left<clip.right;}).map(e=>e.dataset.tw840Area),animations:document.getAnimations().filter(a=>{const target=a.effect?.target;return target instanceof Element&&target.closest('#gc500-work-board840')&&a.playState==='running';}).map(a=>({name:a.animationName||null,state:a.playState,currentTime:a.currentTime,id:a.effect?.target?.closest('[data-tw840-area]')?.dataset.tw840Area||null})),preferences:{stored:localStorage.getItem('gc500.motion'),attribute:document.documentElement.dataset.motion,media:matchMedia('(prefers-reduced-motion: reduce)').matches}};});}
async function waitMotion(page,predicate){await page.waitForFunction(predicate,null,{timeout:3500}).catch(()=>{});await settle(page,80);return motionState(page);}
function activeVisible(state){return state.work.running&&state.active.length===1&&state.active[0].id===state.work.running&&state.visible.includes(state.work.running)&&!state.native?.running;}
async function geometry(page){return page.evaluate(()=>{
 const b=document.querySelector('#gc500-work-board840'),m=document.querySelector('main'),rect=e=>{const r=e.getBoundingClientRect();return {left:r.left,right:r.right,top:r.top,bottom:r.bottom,width:r.width,height:r.height};};
 const effects=e=>{const result=[];for(let n=e;n&&n!==b.parentElement;n=n.parentElement){const s=getComputedStyle(n);if(s.filter!=='none'||s.transform!=='none')result.push({tag:n.tagName,cls:n.className,filter:s.filter,transform:s.transform});}return result;};
 const selectors='.tw840-top h3,.tw840-scope,.tw840-counts button>span:first-child,.tw840-count-link,.tw840-preview p,.tw840-footer span,.tw840-reading,.tw841-fence-label,.tw841-fence-value strong';
 const labels=[...b.querySelectorAll(selectors)].map(e=>{const s=getComputedStyle(e);return {text:e.textContent,cls:e.className,size:parseFloat(s.fontSize),color:s.color,shadow:s.textShadow,filter:s.filter,effects:effects(e),rect:rect(e)};});
 return {width:innerWidth,document:document.documentElement.scrollWidth,main:{client:m.clientWidth,scroll:m.scrollWidth,top:m.scrollTop},board:{client:b.clientWidth,scroll:b.scrollWidth},labels,cards:[...b.querySelectorAll('[data-tw840-area]')].map(e=>({id:e.dataset.tw840Area,rect:rect(e),client:e.clientWidth,scroll:e.scrollWidth,heading:rect(e.querySelector('h3')),motion:rect(e.querySelector('[data-tw840-motion]')),filter:e.querySelector('.tw840-reading')?getComputedStyle(e.querySelector('.tw840-reading')).filter:null,buttons:[...e.querySelectorAll('.tw840-counts button,[data-tw840-fence-row]')].map(rect),svgIds:[...e.querySelectorAll('svg [id]')].map(n=>n.id)}))};
 });}

async function run(){
 const {PAGE,OUT,CANDIDATE_SHA}=process.env;if(!PAGE||!OUT)throw Error('Set PAGE and a private OUT directory');
 fs.mkdirSync(OUT,{recursive:true});const bytes=fs.readFileSync(PAGE),candidate=hash(bytes),live=process.env.LIVE==='1',smoke=process.env.INITIAL_ONLY==='1';
 if(CANDIDATE_SHA&&candidate!==CANDIDATE_SHA)throw Error('Candidate SHA mismatch');
 const report={author:'Andrew Fisher',at:new Date().toISOString(),candidate,bytes:bytes.length,live,smoke,scope:live?'Actual public view HTML, no local page substitution; GET-only transport':'Candidate at native public view address with live GETs; no writes or publication',checks:[],views:[]};
 const check=(name,pass,evidence)=>{report.checks.push({name,pass:!!pass,evidence});console.log((pass?'PASS ':'FAIL ')+name);fs.writeFileSync(path.join(OUT,'checks841.json'),JSON.stringify({candidate,checks:report.checks},null,2));};
 const guard=installWriteGuard(),toolchain=process.env.GC500_TOOLCHAIN||path.resolve(__dirname,'../toolchain'),{open}=require(path.join(toolchain,'harness/open_page.js'));let session;
 const views=[{name:'desktop',W:1700,H:1100,dpr:1},{name:'phone',W:390,H:844,dpr:2,mobile:true},{name:'4k',W:3840,H:2160,dpr:1}].filter(v=>!process.env.VIEWS||process.env.VIEWS.split(',').includes(v.name));
 try{
  for(const view of views){
   session=await open({pageFile:live?undefined:PAGE,hash:'#today',...view});const p=session.page;
   if(live){const upstream=guard.fulfilledDocuments.at(-1),received=guard.documentResponses.at(-1),bom=bytes.subarray(0,3).equals(Buffer.from([239,187,191])),stripped=bom&&received?.sha===hash(bytes.subarray(3))&&received.bytes===bytes.length-3;const exact=upstream?.sha===candidate&&upstream.bytes===bytes.length&&upstream.status===200;const browser=received?.status===200&&(received.sha===candidate&&received.bytes===bytes.length||stripped);check(view.name+' exact upstream public bytes',exact,upstream);check(view.name+' exact browser bytes or leading BOM removal only',browser,{received,stripped});check(view.name+' actual public HTML with zero local substitutions',session.counts.page===0,session.counts);if(!exact||!browser||session.counts.page)throw Error('Public content differs from frozen candidate');}
   await ready840(p);await p.waitForFunction(()=>typeof todayFencingSummary841==='function',null,{timeout:10000});
   const initialNative=await nativeSnapshot(p),entry=await motionState(p);const evidence={view,initialNative,entry};report.views.push(evidence);
   check(view.name+' native public view remains read only',await p.evaluate(()=>capability()==='view'&&location.pathname.startsWith('/v/Coates-GC500-2026')),await p.evaluate(()=>({capability:capability(),syncReadonly:SYNC.readonly,level:SYNC.level})));
   await boardTop(p);let motion=await waitMotion(p,()=>!!TodayWork840.report().running);
   evidence.firstVisible=motion;
   check(view.name+' first visible work display animates without a click',activeVisible(motion)&&motion.work.running===motion.visible[0],motion);
   check(view.name+' real CSS motion stays on that one display',motion.animations.length>0&&motion.animations.every(a=>a.id===motion.work.running)&&motion.active.every(a=>a.track==='tw841-travel'&&a.play==='running'),motion);
   const model=await p.evaluate(()=>({day:todayIso(),health:todayWorkHealth840(),areas:todayWorkMetrics840(todayIso()),fencing:todayFencingSummary841(todayIso())}));evidence.model=model;
   const source=await nativeInputs(p,model.day),expected=oracle840(source);evidence.nativeInputs=source;
   check(view.name+' full shared-record hydration',model.health.ready&&model.health.status==='live'&&model.areas.length===6,model.health);
   for(const e of expected){const actual=model.areas.find(a=>a.id===e.id),keys=e.id==='fencing'?['total','knownTotal','done','remaining','pct','totalRefs','completeRefs']:['total','knownTotal','done','remaining','pct','totalRefs','completeRefs','unknownQuantityRefs','shortConflictRefs','unrecordedRefs'];const differences=keys.filter(k=>actual[k]!==e[k]).map(k=>({key:k,expected:e[k],actual:actual[k]}));check(view.name+' '+e.id+' unchanged native work arithmetic',!differences.length,differences);}
   const countUI=await p.locator('[data-tw840-area]:not([data-tw840-area=fencing])').evaluateAll(cards=>cards.map(e=>({id:e.dataset.tw840Area,done:e.querySelector('[data-tw840-mode=done] strong').textContent,left:e.querySelector('[data-tw840-mode=left] strong').textContent,reading:e.querySelector('.tw840-reading').textContent,sr:e.querySelector('.tw840-sr').textContent})));
   const countMismatch=countUI.filter(u=>{const a=model.areas.find(x=>x.id===u.id);return u.done!==fmt(a.done)||u.left!==fmt(a.remaining)||u.reading!==(a.pct==null?'—':Math.round(Math.max(0,Math.min(100,a.pct)))+'%')||u.sr!==(a.pct==null?'Completion percentage unavailable':Math.round(Math.max(0,Math.min(100,a.pct)))+'% recorded complete');});
   check(view.name+' displayed completed remaining and percentage values match native model',countUI.length===5&&!countMismatch.length,{countUI,countMismatch});
   const fenceInputs=await fencingInputs841(p,model.day),fenceExpected=fencingOracle841(fenceInputs);evidence.fencingInputs=fenceInputs;evidence.fencingExpected=fenceExpected;
   const projection=row=>Object.fromEntries(['id','unit','recorded','planned','remaining','pct','offProgramme','recordCount'].map(k=>[k,row[k]]));
   check(view.name+' every fencing type independently reconciles to native columns plans and dockets',same(fenceExpected,model.fencing.summaryRows.map(projection)),{expected:fenceExpected,actual:model.fencing.summaryRows.map(projection)});
   check(view.name+' unlike fencing work types have no combined total or percentage',model.fencing.total===undefined&&model.fencing.pct===undefined&&!await p.locator('[data-tw840-area=fencing] .tw840-reading').count(),{hasTotal:model.fencing.total!==undefined,hasPercentage:model.fencing.pct!==undefined});
   const fenceUI=await p.locator('[data-tw840-area=fencing]').evaluate(card=>({cards:document.querySelectorAll('[data-tw840-area=fencing]').length,rows:[...card.querySelectorAll('[data-tw840-fence-row]')].map(e=>({id:e.dataset.tw840FenceRow,label:e.querySelector('.tw841-fence-label').textContent,recorded:e.querySelector('.tw841-recorded strong').textContent,remaining:e.querySelector('.tw841-remaining strong').textContent,units:[...e.querySelectorAll('.tw841-fence-value small')].map(n=>n.textContent),text:e.textContent,client:e.clientWidth,scroll:e.scrollWidth})),text:card.textContent}));evidence.fencingUI=fenceUI;
   check(view.name+' all fencing types remain within the one existing Fencing card',fenceUI.cards===1&&same(fenceUI.rows.map(r=>r.id),model.fencing.summaryRows.map(r=>r.id)),fenceUI);
   for(const row of model.fencing.summaryRows){const ui=fenceUI.rows.find(r=>r.id===row.id);check(view.name+' '+row.id+' rendered fencing values keep their own unit',!!ui&&ui.label===row.label&&ui.recorded===fmt(row.recorded)&&ui.remaining===fmt(row.remaining)&&same(ui.units,[row.unit,row.unit])&&ui.scroll<=ui.client+1,{row,ui});}
   const clean=model.fencing.summaryRows.find(r=>r.id==='clean'),oldFence=model.areas.find(a=>a.id==='fencing');check(view.name+' clean-fence model is preserved separately from other work types',clean.recorded===oldFence.done&&clean.planned===oldFence.total&&clean.remaining===oldFence.remaining&&clean.pct===oldFence.pct,{clean,oldFence});
   await boardTop(p);const geom=await geometry(p);evidence.geometry=geom;
   check(view.name+' native main board and all six cards fit horizontally',geom.document<=geom.width+1&&geom.main.scroll<=geom.main.client+1&&geom.board.scroll<=geom.board.client+1&&geom.cards.every(c=>c.scroll<=c.client+1),geom);
   check(view.name+' headings clear motion controls and targets remain at least 44 pixels',geom.cards.every(c=>c.heading.right<=c.motion.left+1&&c.motion.width>=44&&c.motion.height>=44&&c.buttons.every(b=>b.width>=44&&b.height>=44)),geom.cards);
   check(view.name+' text and text-bearing card ancestors have no blur transform or shadow',geom.labels.length>0&&geom.labels.every(t=>t.shadow==='none'&&t.filter==='none'&&!t.effects.length),geom.labels.filter(t=>t.shadow!=='none'||t.filter!=='none'||t.effects.length));
   check(view.name+' scope and count labels remain legible at native size',geom.labels.filter(t=>/tw840-scope/.test(t.cls)||/Recorded complete|Left to record complete/.test(t.text)).every(t=>t.size>=12),geom.labels.map(t=>({text:t.text,size:t.size})));
   const svgIds=geom.cards.flatMap(c=>c.svgIds);check(view.name+' instrument readings remain unfiltered and SVG IDs are unique',geom.cards.filter(c=>c.id!=='fencing').every(c=>c.filter==='none')&&new Set(svgIds).size===svgIds.length,{svgIds,filters:geom.cards.map(c=>c.filter)});
   await p.screenshot({path:path.join(OUT,'today841-'+view.name+'.png')});
   await p.locator('[data-tw840-jump=fencing]').click();await settle(p);await p.screenshot({path:path.join(OUT,'today841-'+view.name+'-fencing.png')});
   if(!smoke){
    for(const row of model.fencing.summaryRows){
     await p.locator('[data-tw840-fence-detail='+row.id+']').click();await settle(p,100);
     const detail=await p.locator('#gc500-work-dialog840').evaluate(d=>({open:d.open,title:d.querySelector('h2').textContent,totals:[...d.querySelectorAll('.tw841-fence-totals>div')].map(e=>({label:e.querySelector('dt').textContent,value:[...e.querySelector('dd').childNodes].filter(n=>n.nodeType===Node.TEXT_NODE).map(n=>n.textContent).join('').trim(),unit:e.querySelector('dd small').textContent})),basis:d.querySelector('.tw840-definition').textContent,destination:d.querySelector('[data-tw840-destination]')?.dataset.tw840Destination,scroll:d.scrollWidth,client:d.clientWidth,left:d.getBoundingClientRect().left,right:d.getBoundingClientRect().right}));
     const want=[['Programme quantity',row.planned],['Recorded work',row.recorded],['Left to record',row.remaining]].map(([label,n])=>({label,value:fmt(n),unit:row.unit}));
     check(view.name+' '+row.id+' detail shows its own programme basis and native destination',detail.open&&detail.title===row.label&&same(detail.totals,want)&&detail.basis.includes(row.note)&&detail.destination==='fencing'&&detail.scroll<=detail.client+1&&detail.left>=0&&detail.right<=view.W,{detail,want});
     const prior=await focusState(p);await p.evaluate(()=>renderToday());await settle(p,100);const refreshed=await focusState(p);
     check(view.name+' '+row.id+' fencing dialog survives native refresh',await p.locator('#gc500-work-dialog840').evaluate(d=>d.open)&&prior.token===refreshed.token&&Math.abs(prior.main-refreshed.main)<=1,{prior,refreshed});
     if(row.id==='scrim')await p.screenshot({path:path.join(OUT,'today841-'+view.name+'-fencing-detail.png')});
     await p.keyboard.press('Escape');await p.waitForFunction(token=>!document.querySelector('#gc500-work-dialog840').open&&document.activeElement?.dataset.tw840Focus===token,'fence-'+row.id,{timeout:1500}).catch(()=>{});const closed=await focusState(p);
     check(view.name+' '+row.id+' fencing row regains focus without a scroll jump',closed.token==='fence-'+row.id&&Math.abs(prior.main-closed.main)<=1,{prior,closed});
    }
    await p.locator('[data-tw840-jump=equipment]').click();await settle(p,700);motion=await motionState(p);
    const jumped=await p.evaluate(()=>{const h=document.querySelector('[data-tw840-area=equipment] h3'),n=document.querySelector('.tw840-nav'),m=document.querySelector('main');return {focused:document.activeElement===h,heading:h.getBoundingClientRect().top,navBottom:n.getBoundingClientRect().bottom,main:m.scrollTop,x:scrollX,y:scrollY};});
    check(view.name+' category jump lands under sticky nav and focuses its heading',jumped.focused&&jumped.heading>=jumped.navBottom-1&&jumped.main>0&&jumped.x===0&&jumped.y===0,jumped);
    check(view.name+' scrolling hands automatic motion to one visible card',activeVisible(motion)&&!motion.active.some(a=>!motion.visible.includes(a.id)),motion);
    let before=await focusState(p);await p.evaluate(()=>renderToday());await settle(p);let after=await focusState(p);
    check(view.name+' Today redraw preserves focus and main scroll',before.token===after.token&&Math.abs(before.main-after.main)<=1&&before.x===after.x&&before.y===after.y,{before,after});
    await p.evaluate(()=>render());await settle(p);after=await focusState(p);check(view.name+' full redraw preserves focus and main scroll',before.token===after.token&&Math.abs(before.main-after.main)<=1,{before,after});
    await settle(p,6500);after=await focusState(p);check(view.name+' focus scroll and one-visible motion survive native polling',before.token===after.token&&Math.abs(before.main-after.main)<=1&&activeVisible(await motionState(p)),{before,after,motion:await motionState(p)});
    await boardTop(p);motion=await motionState(p);check(view.name+' returning to the first work row resumes visible automatic motion',activeVisible(motion),motion);
    const selected=motion.work.running;await p.locator('[data-tw840-motion='+selected+']').click();await settle(p);motion=await motionState(p);
    check(view.name+' manual Pause stops automatic work motion',!motion.work.running&&!motion.active.length&&!motion.animations.length,motion);
    await p.evaluate(()=>renderToday());await settle(p,700);motion=await motionState(p);check(view.name+' explicit manual Pause survives redraw and health timer',!motion.work.running&&!motion.active.length,motion);
    await p.locator('[data-tw840-motion='+selected+']').click();await settle(p);motion=await motionState(p);check(view.name+' manual Play resumes the selected visible instrument',activeVisible(motion)&&motion.work.running===selected,motion);
    await p.evaluate(()=>{localStorage.setItem('gc500.motion','off');motionApply();});motion=await waitMotion(p,()=>!TodayWork840.report().running);check(view.name+' global Motion Off stops all work effects',!motion.work.running&&!motion.active.length&&!motion.animations.length,motion);
    await p.evaluate(()=>{localStorage.setItem('gc500.motion','subtle');motionApply();});motion=await waitMotion(p,()=>!!TodayWork840.report().running);check(view.name+' global Motion On resumes visible autoplay',activeVisible(motion),motion);
    await p.emulateMedia({reducedMotion:'reduce'});motion=await waitMotion(p,()=>!TodayWork840.report().running);check(view.name+' reduced-motion preference stops all work effects',motion.work.reduced&&!motion.work.running&&!motion.active.length&&!motion.animations.length,motion);
    await p.emulateMedia({reducedMotion:'no-preference'});motion=await waitMotion(p,()=>!!TodayWork840.report().running);check(view.name+' returning to normal motion resumes visible autoplay',activeVisible(motion),motion);
    await p.locator('[data-tw840-detail=buildings][data-tw840-mode=left]').click();await settle(p);motion=await motionState(p);check(view.name+' work details stop both work and native Programme motion',motion.dialog&&!motion.work.running&&!motion.active.length&&!motion.native?.running&&!motion.native?.animations,motion);
    before=await focusState(p);await p.evaluate(()=>renderToday());await settle(p);after=await focusState(p);check(view.name+' open details survive native redraw without moving focus or scroll',await p.locator('#gc500-work-dialog840').evaluate(d=>d.open)&&before.token===after.token&&Math.abs(before.main-after.main)<=1&&Math.abs(before.dialog-after.dialog)<=1,{before,after});
    await p.screenshot({path:path.join(OUT,'today841-'+view.name+'-detail.png')});await p.keyboard.press('Escape');motion=await waitMotion(p,()=>!!TodayWork840.report().running);after=await focusState(p);check(view.name+' closing details restores trigger focus scroll and automatic motion',after.token==='buildings-left'&&Math.abs(before.main-after.main)<=1&&activeVisible(motion),{after,before,motion});
    const programme=p.locator('#pane-today .racecard');await programme.scrollIntoViewIfNeeded();await settle(p);await programme.locator('.today-motion-button').click();await settle(p,100);motion=await motionState(p);check(view.name+' native Programme selection retains its own exclusive motion',motion.native?.running==='programme'&&motion.native.animations>0&&!motion.work.running&&!motion.active.length,motion);
    await p.evaluate(()=>document.querySelector('[data-tw840-detail=fencing][data-tw840-mode=done]').click());await settle(p);motion=await motionState(p);check(view.name+' work modal also cancels running Programme effects and guard',motion.dialog&&!motion.native?.running&&!motion.native?.animations&&!motion.native?.guardActive&&!motion.work.running,motion);await p.keyboard.press('Escape');
    await p.evaluate(()=>go('timeline'));await settle(p);motion=await motionState(p);check(view.name+' leaving Today releases work effects',!motion.work.running&&!motion.active.length&&!motion.animations.length&&await p.locator('#pane-timeline').isVisible(),motion);
    await p.evaluate(()=>go('today'));await settle(p);await boardTop(p);motion=await waitMotion(p,()=>!!TodayWork840.report().running);check(view.name+' returning to Today resumes one visible instrument',activeVisible(motion),motion);
   }
   evidence.finalNative=await nativeSnapshot(p);check(view.name+' native record collections stay unchanged during UI testing',same(initialNative.collections,evidence.finalNative.collections));
   check(view.name+' original native media source descriptors stay unchanged',same(initialNative.media,evidence.finalNative.media)&&initialNative.media.some(s=>s.type==='video/mp4'),{before:initialNative.media,after:evidence.finalNative.media});
   check(view.name+' browser reports no runtime errors',session.errors.length===0,session.errors);evidence.network=session.counts;await session.browser.close();session=null;
   if(process.env.STOP_AFTER_FAILED_VIEW==='1'&&report.checks.some(c=>!c.pass))break;
  }
  check('Frozen candidate bytes remain unchanged',hash(fs.readFileSync(PAGE))===candidate);
 }catch(error){check('Browser integration execution',false,String(error.message).replace(/\/e\/[^\s/?]+/g,'/e/[redacted]'));if(session){report.failureErrors=session.errors;try{await session.page.screenshot({path:path.join(OUT,'today841-failure.png')});report.failureState=await session.page.evaluate(()=>({body:document.body.innerText.slice(0,15000),motion:window.TodayWork840?.report?.(),sync:typeof SYNC!=='undefined'?{status:SYNC.status,first:[...SYNC.first],errors:SYNC.errors}:null}));}catch{}}}
 finally{if(session)await session.browser.close();await guard.closeAll();report.guard=guard;check('Every non-GET request is aborted before transport',guard.nonGetSeen.length===guard.blocked.length,{seen:guard.nonGetSeen,blocked:guard.blocked});check('No operational write was attempted',!guard.nonGetSeen.some(r=>r.operational),guard.nonGetSeen.filter(r=>r.operational));const expectedBlockedConsole=guard.consoleErrors.filter(e=>/Failed to load resource: net::ERR_BLOCKED_BY_CLIENT/.test(e.text)&&guard.blocked.some(b=>!b.operational&&b.url===e.url)),unexpectedConsole=guard.consoleErrors.filter(e=>!expectedBlockedConsole.includes(e));check('No console errors apart from explicitly blocked non-operational requests',unexpectedConsole.length===0,{expectedBlockedConsole,unexpectedConsole});report.passed=report.checks.filter(c=>c.pass).length;report.total=report.checks.length;fs.writeFileSync(path.join(OUT,'today841.json'),JSON.stringify(report,null,2));console.log(JSON.stringify({passed:report.passed,total:report.total,candidate}));if(report.passed!==report.total)process.exitCode=1;}
}
module.exports={fencingOracle841,fencingInputs841,motionState,geometry};
if(require.main===module)run().catch(error=>{console.error(String(error.message).replace(/\/e\/[^\s/?]+/g,'/e/[redacted]'));process.exitCode=2;});
