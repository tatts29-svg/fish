/* Author: Andrew Fisher. Read-only viewport, text and navigation audit. Private detailed evidence only. */
'use strict';
const fs=require('fs'),path=require('path'),crypto=require('crypto');
const {open}=require(process.env.HARNESS||'../../record_14Oct2026_purchase_order/readonly_page.cjs');
const out=process.env.OUT_DIR;if(!out)throw Error('Private OUT_DIR required');fs.mkdirSync(out,{recursive:true});
const hash=body=>crypto.createHash('sha256').update(body).digest('hex'),binding=()=>({pageSha256:hash(fs.readFileSync(process.env.PAGE)),mapFiles:process.env.MAP_CODE?Object.fromEntries(['index.html','explorer.js','explorer-merge.js'].map(f=>[f,hash(fs.readFileSync(path.join(process.env.MAP_CODE,f)))])):null});
const finalMode=process.env.FINAL==='1',mobile=process.env.MOB==='1';
const report={author:'Andrew Fisher',...binding(),viewportMode:finalMode?(mobile?'Phone profile390×844,DPR2':'Desktop1440×1000 and3840×2160,DPR1'):'One desktop Chromium context resized to390,1440,3840 CSS pixels; touch-device specifics are separately audited.',routes:[],checks:[],errors:[],consoleAfterInitialLoad:[]};
const aliases={progress:'today',journal:'today',breakdowns:'today',variances:'today',edit:'today',add:'today',register:'plant',pricing:'costs'};
const hashes=['#timeline','#day/2026-09-28','#change/2026-09-28','#print/drivers/2026-09-28','#sheet/__satellite3d','#plant','#today'];
const tabHash=(t,h)=>t==='map'?['#map','#sheet/__explorer'].includes(h):t==='timeline'?(h==='#timeline'||/^#day\/\d{4}-\d{2}-\d{2}$/.test(h)):t==='change'?(h==='#change'||/^#change\/\d{4}-\d{2}-\d{2}$/.test(h)):h==='#'+(aliases[t]||t);
function save(){fs.writeFileSync(path.join(out,'flow-review.json'),JSON.stringify(report,null,2));}
function ck(name,pass,detail){report.checks.push({name,pass:!!pass,...detail?{detail}:{}});save();}
function measure(){
 const pane=document.getElementById('pane-'+state.tab),main=document.querySelector('main');
 const visible=el=>{if(!el||!el.getClientRects().length)return false;const s=getComputedStyle(el);return s.visibility!=='hidden'&&s.display!=='none'&&Number(s.opacity)!==0;};
 const selector=el=>{if(el.id)return '#'+el.id;const parts=[];for(let n=el;n&&n!==pane&&parts.length<4;n=n.parentElement){parts.unshift(n.tagName.toLowerCase()+(n.classList.length?'.'+[...n.classList].slice(0,3).join('.'):''));}return '#'+pane.id+' '+parts.join(' > ');};
 const rgba=x=>{const n=String(x).match(/[\d.]+/g)?.map(Number);return n?.length>=3?[n[0],n[1],n[2],n.length>3?n[3]:1]:null;};
 const luminance=c=>c.slice(0,3).map(v=>v/255).map(v=>v<=.04045?v/12.92:((v+.055)/1.055)**2.4).reduce((s,v,i)=>s+v*[.2126,.7152,.0722][i],0);
 const background=el=>{for(let n=el;n;n=n.parentElement){const s=getComputedStyle(n);if(s.backgroundImage!=='none')return null;const c=rgba(s.backgroundColor);if(c&&c[3]>=.999)return c;if(c&&c[3]>.01)return null;}return [255,255,255,1];};
 const contrast=[],clipped=[],small=[],controls=[...pane.querySelectorAll('button,input,select,textarea,summary,a[href],[role=button]')].filter(visible);
 for(const el of pane.querySelectorAll('*')){
  if(!visible(el))continue;const direct=[...el.childNodes].filter(n=>n.nodeType===3).map(n=>n.textContent).join(' ').trim();if(!direct)continue;
  const s=getComputedStyle(el),fg=rgba(s.color),bg=background(el);if(!fg||!bg||fg[3]<.999||el.closest('[disabled],[aria-disabled=true]'))continue;
  const a=luminance(fg),b=luminance(bg),ratio=(Math.max(a,b)+.05)/(Math.min(a,b)+.05),large=parseFloat(s.fontSize)>=24||(parseFloat(s.fontSize)>=18.66&&Number(s.fontWeight)>=700),minimum=large?3:4.5;
  if(ratio<minimum-.05)contrast.push({selector:selector(el),text:direct.slice(0,90),ratio:+ratio.toFixed(2),minimum,color:s.color,background:bg,font:s.fontSize,weight:s.fontWeight});
 }
 for(const el of controls){const b=el.getBoundingClientRect(),s=getComputedStyle(el),text=(el.innerText||el.getAttribute('aria-label')||el.placeholder||el.type||'').trim();
  if(el.scrollWidth>el.clientWidth+3&&s.textOverflow!=='ellipsis'&&s.overflowX==='hidden')clipped.push({selector:selector(el),text:text.slice(0,70),client:el.clientWidth,scroll:el.scrollWidth});
  if(text&&b.width>=8&&b.height>=8&&(b.height<32||b.width<32))small.push({selector:selector(el),text:text.slice(0,70),width:Math.round(b.width),height:Math.round(b.height)});
 }
 const folds=Persistence1010.capture(pane,false).folds.filter(x=>x[1]).map(x=>x[0]);
 return {tab:state.tab,pane:pane.id,hash:location.hash,shown:visible(pane),visiblePanes:[...document.querySelectorAll('main > .pane')].filter(visible).map(p=>p.id),documentWidth:document.documentElement.scrollWidth,viewport:innerWidth,scroll:{top:main.scrollTop,max:main.scrollHeight-main.clientHeight,document:document.scrollingElement.scrollTop},folds,contrast,clipped,small,controlCount:controls.length};
}
(async()=>{let h;try{
 h=await open({pageFile:process.env.PAGE,W:mobile||!finalMode?390:1440,H:mobile||!finalMode?844:1000,dpr:mobile?2:1,mobile});const p=h.page;p.on('console',m=>{if(m.type()==='error')report.consoleAfterInitialLoad.push({text:m.text(),location:m.location()});});await p.waitForFunction(()=>SYNC.status==='live'&&GC500Refresh904.report().settled&&Routes1016.ready(),null,{timeout:180000});
 const before=await p.evaluate(()=>({version:SYNC.backend.readVersion821(),native:JSON.stringify(S)}));report.nativeVersion=before.version;
 const tabs=await p.evaluate(()=>TABS.map(t=>t[0]));
 ck('All22 declared routes are covered',tabs.length===22&&new Set(tabs).size===22);
 for(const [width,height] of (finalMode?(mobile?[[390,844]]:[[1440,1000],[3840,2160]]):[[390,844],[1440,1000],[3840,2160]])){
  await p.setViewportSize({width,height});
  for(const tab of tabs){
   const time=Date.now(),goMs=await p.evaluate(t=>{const start=performance.now();go(t);return performance.now()-start;},tab);await p.waitForTimeout(['today','map','coatesway'].includes(tab)?650:160);
   const first=await p.evaluate(measure);const route={requested:tab,width,height,goMs:Math.round(goMs),renderMs:Date.now()-time,initial:first};
   if(finalMode){ck(width+' '+tab+' canonical pane and hash',first.shown&&first.pane==='pane-'+(aliases[tab]||tab)&&first.visiblePanes.length===1&&tabHash(tab,first.hash));ck(width+' '+tab+' no overflow, clipped controls or measured contrast failure',first.documentWidth<=width+1&&!first.clipped.length&&!first.contrast.length);}
   if(width===390){
    await p.evaluate(()=>{const pane=document.getElementById('pane-'+state.tab),folds=[...pane.querySelectorAll('details')].filter(d=>d.querySelector('summary')?.getClientRects().length);for(const d of [folds[0],folds.at(-1)].filter(Boolean))d.open=true;const last=folds.at(-1);if(last)last.querySelector('summary').scrollIntoView({block:'center'});document.dispatchEvent(new WheelEvent('wheel',{bubbles:true,deltaY:1}));});await p.waitForTimeout(70);
    const a=await p.evaluate(measure);await p.evaluate(()=>Idle1006.redraw());await p.waitForTimeout(150);const b=await p.evaluate(measure);
    route.afterOpen=b;ck(tab+' open disclosures survive redraw',a.folds.every(k=>b.folds.includes(k)),{before:a.folds.length,after:b.folds.length});
    ck(tab+' reading position survives redraw',Math.abs(Math.min(a.scroll.top,b.scroll.max)-b.scroll.top)<4&&Math.abs(a.scroll.document-b.scroll.document)<4,{before:a.scroll,after:b.scroll});
   }
   report.routes.push(route);save();console.log(JSON.stringify({width,requested:tab,actual:first.tab,ms:route.renderMs,overflow:first.documentWidth>width+1,contrast:first.contrast.length,clipped:first.clipped.length}));
   if(['today','timeline','plant','costs','runsheet'].includes(tab)&&width!==1440)await p.screenshot({path:path.join(out,width+'-'+tab+'.png')});
  }
 }
 if(finalMode){await p.setViewportSize({width:mobile?390:1440,height:mobile?844:1000});report.links=[];for(const requested of hashes){await p.evaluate(value=>{location.hash=value;},requested);await p.waitForTimeout(requested.startsWith('#print')?2500:650);const actual=await p.evaluate(()=>{const visible=[...document.querySelectorAll('main > .pane')].filter(p=>!p.hidden&&p.offsetWidth&&p.offsetHeight&&getComputedStyle(p).visibility!=='hidden');return {hash:location.hash,pane:visible.length===1?visible[0].id:null,bar:!!document.getElementById('dpbar')};});const expected=requested.startsWith('#change/')?'change':requested.startsWith('#sheet/')?'map':requested==='#plant'?'plant':requested==='#today'?'today':'timeline';ck('Deep link '+requested,actual.pane==='pane-'+expected&&(actual.hash===requested||(requested==='#sheet/__satellite3d'&&actual.hash==='#sheet/__explorer'))&&actual.bar===requested.startsWith('#print/'),actual);report.links.push({requested,...actual});await p.evaluate(()=>document.querySelector('#dpbar [data-dpbar-x]')?.click());await p.waitForTimeout(150);}}
 await p.setViewportSize({width:390,height:844});await p.evaluate(()=>{go('subhired');openAsset('P33');});await p.waitForTimeout(350);
 const drawer=()=>{const d=document.getElementById('drawer'),db=d.querySelector('.db');return {open:d.classList.contains('on'),selected:state.sel,tab:state.tab,scroll:d.scrollTop,body:db.scrollTop,folds:Persistence1010.capture(d,false).folds.filter(x=>x[1]).map(x=>x[0])};};
 await p.evaluate(()=>{const d=document.getElementById('drawer'),folds=[...d.querySelectorAll('details')].filter(x=>x.querySelector('summary')?.getClientRects().length);folds.slice(-2).forEach(x=>x.open=true);folds.at(-1)?.querySelector('summary').scrollIntoView({block:'center'});document.dispatchEvent(new WheelEvent('wheel',{bubbles:true,deltaY:1}));});
 const da=await p.evaluate(drawer);await p.waitForTimeout(5100);await p.evaluate(()=>Idle1006.redraw());await p.waitForTimeout(200);const db=await p.evaluate(drawer);
 ck('Open drawer survives poll and redraw with reading position',db.open&&db.selected==='P33'&&da.folds.every(k=>db.folds.includes(k))&&Math.abs(da.scroll-db.scroll)<4&&Math.abs(da.body-db.body)<4,{before:da,after:db});
 await p.locator('#drawer [data-nav934-back]').click();await p.waitForTimeout(150);ck('Drawer Back restores supplier page',await p.evaluate(()=>state.tab==='subhired'&&!document.getElementById('drawer').classList.contains('on')));
 await p.evaluate(()=>{go('plant');});await p.waitForTimeout(100);await p.evaluate(()=>go('timeline'));await p.waitForTimeout(100);await p.goBack();await p.waitForTimeout(150);ck('Browser Back restores Equipment',await p.evaluate(()=>state.tab==='plant'));
 const end=await p.evaluate(()=>({version:SYNC.backend.readVersion821(),native:JSON.stringify(S)}));ck('Native record remains unchanged',before.version===end.version&&before.native===end.native,{before:before.version,after:end.version});
 ck('Exact application and map inputs remained unchanged',JSON.stringify(binding())===JSON.stringify({pageSha256:report.pageSha256,mapFiles:report.mapFiles}));
 report.errors=h.errors;report.requests=h.counts;ck('No application errors or operational writes',h.errors.length===0&&h.counts.blocked===0,{errors:h.errors,requests:h.counts});
 }catch(error){report.failure=String(error.stack||error);process.exitCode=1;}finally{if(h)await h.browser.close();if(report.checks.some(x=>!x.pass))process.exitCode=1;save();console.log(JSON.stringify({routes:report.routes.length,checks:report.checks.length,failed:report.checks.filter(x=>!x.pass).map(x=>x.name),failure:report.failure}));}
})().catch(e=>{console.error(e);process.exitCode=1;});
