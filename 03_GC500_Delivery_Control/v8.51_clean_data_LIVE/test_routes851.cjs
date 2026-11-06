// Author: Andrew Fisher. Generic GET-only route, scroll and disclosure audit.
'use strict';
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const root=process.env.REPO,OUT=process.env.OUT,SHA=process.env.CANDIDATE_SHA,PAGE=process.env.PAGE;
const baseline=process.env.BASE_REPORT?JSON.parse(fs.readFileSync(process.env.BASE_REPORT,'utf8')):null;
if(!root||!OUT||!SHA)throw Error('REPO OUT CANDIDATE_SHA required');
const {installWriteGuard,ready840,nativeSnapshot}=require(path.join(root,'v8.40_today_work_progress_LIVE/test_today840.cjs'));
const {open}=require(path.join(root,'toolchain/harness/open_page.js'));const hash=x=>crypto.createHash('sha256').update(x).digest('hex');
const guard=installWriteGuard(),report={author:'Andrew Fisher',expected:SHA,at:new Date().toISOString(),live:!PAGE,views:[],checks:[]};fs.mkdirSync(OUT,{recursive:true});
const save=()=>fs.writeFileSync(path.join(OUT,'route-audit.json'),JSON.stringify(report,null,2));
const check=(name,pass)=>{report.checks.push({name,pass:!!pass});console.log((pass?'PASS ':'FAIL ')+name);save();};
async function inspect(p){return p.evaluate(()=>{
 const visible=e=>{const r=e.getBoundingClientRect(),s=getComputedStyle(e);if(!(r.width>0&&r.height>0&&s.visibility!=='hidden'&&s.display!=='none'))return false;for(let a=e.parentElement;a;a=a.parentElement)if(a.matches('details:not([open])')&&!a.querySelector(':scope > summary')?.contains(e))return false;return true;};
 const main=document.querySelector('main'),pane=main.querySelector('.pane:not([hidden])'),m=main.getBoundingClientRect();
 const metric=e=>({client:e.clientWidth,scroll:e.scrollWidth,height:e.clientHeight,content:e.scrollHeight});
 const label=e=>(e.labels?.[0]?.innerText||e.getAttribute('aria-label')||e.title||e.placeholder||e.innerText||e.name||e.id||'').trim().replace(/\s+/g,' ').slice(0,160);
 const paragraphs=[...pane.querySelectorAll('p')].filter(visible).map(e=>e.innerText.trim()).filter(Boolean),frequency=new Map();for(const t of paragraphs)frequency.set(t,(frequency.get(t)||0)+1);
 const overflow=[];for(const e of pane.querySelectorAll('*')){if(!visible(e))continue;const r=e.getBoundingClientRect();if(r.left>=m.left-2&&r.right<=m.right+2)continue;
  let scroller=null;for(let a=e.parentElement;a&&a!==main;a=a.parentElement){const s=getComputedStyle(a);if(/auto|scroll|hidden|clip/.test(s.overflowX)&&a.scrollWidth>a.clientWidth+1){scroller={tag:a.tagName,id:a.id,class:a.className,overflow:s.overflowX,client:a.clientWidth,scroll:a.scrollWidth};break;}}
  if(!scroller&&overflow.length<30)overflow.push({tag:e.tagName,id:e.id,class:e.className,left:Math.round(r.left),right:Math.round(r.right),text:label(e)});
 }
 return {route:state.tab,hash:location.hash,pane:pane.id,top:main.scrollTop,dimensions:{window:innerWidth,document:document.documentElement.scrollWidth,main:metric(main),pane:metric(pane)},overflow,
  controls:[...pane.querySelectorAll('input,select,textarea')].filter(visible).map(e=>({tag:e.tagName,type:e.type,id:e.id,name:e.name,label:label(e),disabled:e.disabled,readOnly:!!e.readOnly,ro:!!e.closest('[data-ro]')})),
  paragraphs:paragraphs.map(t=>({words:t.split(/\s+/).length,text:t.slice(0,600)})),duplicateParagraphs:[...frequency].filter(([text,n])=>n>1&&text.length>45).map(([text,n])=>({n,text:text.slice(0,300)})),
  heading:[...pane.querySelectorAll('h1,h2,h3')].filter(visible).slice(0,8).map(e=>e.innerText),summary:[...pane.querySelectorAll('details > summary')].filter(visible).map(e=>({label:label(e),open:e.parentElement.open}))};
 });}
(async()=>{let s;try{for(const view of [{name:'laptop',W:1366,H:900},{name:'phone',W:390,H:844,dpr:2,mobile:true}]){
 s=await open({pageFile:PAGE,hash:'#today',...view});const p=s.page;await ready840(p);await p.waitForFunction(()=>DOCS.state==='ready');
 const source=guard.fulfilledDocuments.at(-1),browserDocument=guard.documentResponses.at(-1);if(source?.sha!==SHA)throw Error('Source hash mismatch');
 const browserExact=browserDocument?.status===200&&((browserDocument.sha===source.sha&&browserDocument.bytes===source.bytes)||(source.utf8Bom&&browserDocument.sha===source.shaWithoutBom&&browserDocument.bytes===source.bytes-3));
 check(view.name+' exact upstream and browser document identity with intended source mode',source.sha===SHA&&browserExact&&(PAGE?s.counts.page>0:s.counts.page===0));
 const snap=await nativeSnapshot(p),vr={view,source,substitutions:s.counts.page,initialCollectionsHash:hash(JSON.stringify(snap.collections)),routes:[],errors:[]};report.views.push(vr);save();
 const tabs=await p.evaluate(()=>TABS.map(t=>t[0]));
 for(const tab of tabs){const e0=s.errors.length;await p.evaluate(t=>go(t),tab);await p.waitForTimeout(tab==='map'?2500:450);
  await p.evaluate(()=>document.querySelector('main').scrollTo({top:0,left:0,behavior:'instant'}));await p.waitForTimeout(80);
  const before=await inspect(p),r={requested:tab,entry:before,errors:[]};vr.routes.push(r);save();
  const fold=p.locator('main .pane:not([hidden]) details > summary').filter({visible:true}).first();
  if(await fold.count()){
   const original=await fold.evaluate(e=>({open:e.parentElement.open,text:e.textContent}));
   try{await fold.click({timeout:4000});await p.waitForTimeout(120);const changed=await fold.evaluate(e=>e.parentElement.open);await fold.click({timeout:4000});await p.waitForTimeout(120);r.fold={label:original.text,changed:changed!==original.open,restored:await fold.evaluate(e=>e.parentElement.open)===original.open};}catch(e){r.fold={error:e.message.slice(0,240)};}
  }
  await p.evaluate(()=>document.querySelector('main').scrollTo({top:0,left:0,behavior:'instant'}));await p.mouse.move(view.W-40,view.H-130);await p.mouse.wheel(0,650);await p.waitForTimeout(180);
  r.wheel=await p.evaluate(()=>{const m=document.querySelector('main');return {top:m.scrollTop,max:m.scrollHeight-m.clientHeight};});
  await p.evaluate(()=>{const m=document.querySelector('main');m.scrollTo({top:m.scrollHeight,behavior:'instant'});});await p.waitForTimeout(120);
  r.bottom=await p.evaluate(()=>{const m=document.querySelector('main');return {top:m.scrollTop,max:m.scrollHeight-m.clientHeight};});
  await p.evaluate(()=>document.querySelector('main').scrollTo({top:0,left:0,behavior:'instant'}));await p.waitForTimeout(80);r.top=await p.evaluate(()=>document.querySelector('main').scrollTop);
  if(['today','fencing','timeline','plant','docs','costs','pricing','change','runsheet'].includes(tab)||before.overflow.length||before.dimensions.main.scroll>before.dimensions.main.client+1)await p.screenshot({path:path.join(OUT,view.name+'-'+tab+'.png')});
  r.errors=s.errors.slice(e0);save();
  check(view.name+' '+tab+' route, viewport and actual wheel/top/bottom scroll work',r.errors.length===0&&before.dimensions.main.scroll<=before.dimensions.main.client+1&&before.dimensions.document<=before.dimensions.window+1&&(r.wheel.max<=20||r.wheel.top>0)&&Math.abs(r.bottom.top-r.bottom.max)<=2&&r.top<=1);
  if(r.fold)check(view.name+' '+tab+' native disclosure opens and closes',r.fold.changed&&r.fold.restored);
  const previous=baseline?.views.find(v=>v.view.name===view.name)?.routes.find(r=>r.requested===tab);
  if(previous)check(view.name+' '+tab+' native route and permission destination preserved',before.route===previous.entry.route&&before.pane===previous.entry.pane&&before.hash===previous.entry.hash);
 }
 await p.evaluate(()=>go('plant'));await p.waitForTimeout(150);await p.evaluate(()=>go('timeline'));await p.waitForTimeout(150);await p.goBack();await p.waitForTimeout(300);vr.back=await p.evaluate(()=>({hash:location.hash,route:state.tab}));
 const after=await nativeSnapshot(p);vr.finalCollectionsHash=hash(JSON.stringify(after.collections));vr.errors=s.errors;vr.nativeFunctionsUnchanged=JSON.stringify(snap.functions)===JSON.stringify(after.functions);
 check(view.name+' all 22 routes and Back preserve records and native functions',vr.routes.length===22&&vr.back.route==='plant'&&vr.back.hash==='#plant'&&vr.initialCollectionsHash===vr.finalCollectionsHash&&vr.nativeFunctionsUnchanged&&!vr.errors.length);
 await s.browser.close();s=null;save();
 }}catch(e){report.error=e.stack;}finally{if(s)await s.browser.close();await guard.closeAll();report.guard=guard;
 check('No operational writes and every non-GET request blocked',!guard.nonGetSeen.some(r=>r.operational)&&guard.nonGetSeen.length===guard.blocked.length);
 const unexpected=guard.consoleErrors.filter(e=>!(/Failed to load resource: net::ERR_BLOCKED_BY_CLIENT/.test(e.text)&&guard.blocked.some(b=>!b.operational&&b.url===e.url)));
 check('No unexpected console errors',!unexpected.length);report.passed=report.checks.filter(c=>c.pass).length;report.total=report.checks.length;save();
 console.log(JSON.stringify({views:report.views.length,routes:report.views.map(v=>v.routes.length),error:report.error,passed:report.passed,total:report.total,operationalWrites:guard.nonGetSeen.filter(r=>r.operational).length}));if(report.error||report.passed!==report.total)process.exitCode=1;}})();
