// Author: Andrew Fisher. Read-only candidate checks. All operational writes blocked by shared harness.
const fs=require('fs'),assert=require('assert/strict'),crypto=require('crypto');
const publicMode=process.env.PUBLIC==='1';
let servedHash;
if(publicMode){
 assert(!process.env.PAGE,'PUBLIC=1 must not have PAGE set');
 const fetcher=require('../../toolchain/harness/curlfetch'),original=fetcher.curlFetch;
 fetcher.curlFetch=async function(url,...args){const r=await original(url,...args);if(/^https:\/\/gc500-production\.up\.railway\.app\/v\/Coates-GC500-2026\/?(?:[?#].*)?$/.test(url))servedHash=crypto.createHash('sha256').update(r.body).digest('hex');return r;};
}else assert.equal(crypto.createHash('sha256').update(fs.readFileSync(process.env.PAGE)).digest('hex'),process.env.EXPECTED_SHA,'Candidate bytes match expected hash');
const {open}=require('../../toolchain/harness/open_page');
(async()=>{
 const mobile=process.env.MOB==='1',out=process.env.OUTDIR;
 const h=await open({pageFile:publicMode?undefined:process.env.PAGE,hash:'#day/2026-10-12',W:mobile?360:1440,H:1000,mobile});
 const p=h.page;let checks=0;const check=(ok,label)=>{assert(ok,label);checks++};
 try{
  await p.waitForFunction(()=>SYNC.status==='live'&&SYNC.first.size===Object.keys(SYNC_COLLS).length&&DOCS.state==='ready',null,{timeout:150000});
  if(publicMode){check(h.counts.page===0,'Public check has no local HTML substitution');check(servedHash===process.env.EXPECTED_SHA,'Actually served HTML matches release hash');}
  await p.evaluate(()=>{state.day='2026-10-12';go('timeline');renderTimeline()});
  const before=await p.evaluate(()=>({state:JSON.stringify(S),money:JSON.stringify(pl770Model()),staff:document.querySelector('.staff988').outerHTML,flow:document.querySelector('.flow891').outerHTML,order:[...document.querySelectorAll('.ld[data-tl846-load]')].map(n=>n.dataset.tl846Load)}));
  const cards=p.locator('#pane-timeline .lc991'),first=()=>cards.first(),toggle=()=>first().locator('.lc991-toggle');
  check(await cards.count()===6,'Six native loads retained');
  const report=()=>p.evaluate(()=>{const got=Timeline841.report();return {version:got.version,dialog:got.dialog,rows:got.rows,expected:[...document.querySelectorAll('#pane-timeline .tl841-ref')].map(ref=>{const card=ref.closest('.lc991'),g=[...card.querySelectorAll('.lc991-progress-ref')].find(n=>n.querySelector('b')?.textContent.startsWith(ref.dataset.tl841Ref+' ·'))?.querySelector('.tl841-gantry');return {key:ref.dataset.tl841Ref,stage:Number(g?.dataset.tl841Stage),running:g?.classList.contains('tl841-live')};})};});
  const closedReport=await report();
  check(closedReport.version==='8.41'&&JSON.stringify(closedReport.rows)===JSON.stringify(closedReport.expected),'Progress report preserves native key/stage/running data with collapsed cards');
  check(closedReport.rows.every(r=>!r.running),'Collapsed progress lights do not animate');
  const ruleIcons=await p.evaluate(()=>[...document.querySelectorAll('.bc984-day')].map(n=>({title:n.querySelector('.bc984-rule-title')?.textContent,key:n.querySelector('[data-rule989-key]')?.dataset.rule989Key,bg:getComputedStyle(n.querySelector('[data-rule989-key]')).backgroundColor})));
  const keys={'Risk Assessment':'assess-risk','High-Risk Work':'general-rule','Training and Competency':'competency','Fit for Work':'fit-for-work','Tools and Equipment':'general-rule','Critical Risk Non-Negotiables':'general-rule'};
  check(ruleIcons.length>20&&ruleIcons.every(i=>i.key===keys[i.title]&&i.bg==='rgba(0, 0, 0, 0)'),'All Build Life Saving Rule icons retain transparent outlines and exact canonical mapping');
  const closed=await cards.evaluateAll(nodes=>nodes.map(n=>({height:n.getBoundingClientRect().height,hidden:n.querySelector('.lc991-detail').hidden,inert:n.querySelector('.lc991-detail').inert,
   time:!!n.querySelector('.lc991-summary .ld-t'),refs:!!n.querySelector('.lc991-summary .tl841-ref'),status:!!n.querySelector('.lc991-summary .tl841-status'),nav:!!n.querySelector('.lc991-actions .ld-nav'),
   summaryLights:n.querySelectorAll('.lc991-summary .tl841-gantry').length,warning:[...n.querySelectorAll('.flow891-chip')].every(w=>!!w.closest('.lc991-warnings')),
   targets:[...n.querySelectorAll('.lc991-actions button,.lc991-actions a,.lc991-warnings button')].every(x=>x.getBoundingClientRect().height>=44),right:n.getBoundingClientRect().right})));
  check(closed.every(n=>n.hidden&&n.inert),'Closed details hidden and inert');
  check(closed.every(n=>n.time&&n.refs&&n.status&&n.nav&&!n.summaryLights),'Essential identity and status remain; progress in Details');
  check(closed.every(n=>n.warning&&n.targets),'Every warning remains visible and header targets are at least 44px');
  check(closed.every(n=>n.height<=(mobile?260:160)),'Closed cards are compact: '+closed.map(n=>n.height).join(','));
  check(closed.every(n=>n.right<=(mobile?360:1440)),'Cards stay inside viewport');
  const warnings=await p.locator('.lc991-warnings').allTextContents();
  check(warnings.filter(x=>/Curfew first/i.test(x)).length===2,'Both curfew-first warnings stay visible');
  check(await p.locator('.lc991-summary .ld-t b.nt').count()===2,'Both missing load times remain explicit');
  const screenshot=async name=>{if(out){fs.mkdirSync(out,{recursive:true});await p.screenshot({path:out+'/'+name+'.png'});}};
  await p.locator('.staff988').evaluate(n=>{const sc=ldScroller(n);sc.scrollTop+=n.getBoundingClientRect().top-140});await screenshot('closed');
  await toggle().focus();await p.keyboard.press('Enter');await p.waitForTimeout(250);
  check(await toggle().getAttribute('aria-expanded')==='true','Keyboard Enter opens native details');
  check(await first().locator('.lc991-detail').isVisible(),'Expanded body visible');
  const openReport=await report();check(JSON.stringify(openReport.rows)===JSON.stringify(openReport.expected),'Progress report still reads the same moved native nodes when expanded');
  check(await first().locator('.lc991-detail .ld-qr').isVisible(),'Native QR visible in Details');
  check(await first().locator('.ld-qr').getAttribute('href')===await first().locator('.lc991-actions .ld-nav').getAttribute('href'),'QR and Navigate retain the same destination');
  check(await first().locator('.timeline968-loading').isVisible(),'Sizes and weights available when expanded');
  check((await first().innerText()).includes('Nominal description'),'Nominal size uncertainty label retained');
  check(await first().locator('.ldb').count()===1,'Native photos/notes/delivery body retained once');
  check(!(await first().locator('.ldb').isVisible())&&await first().locator('.lc991-record > summary').innerText()==='Photos, notes & delivery record','Verbose native delivery record stays behind one clearly labelled fold');
  await first().locator('.lc991-record > summary').click();
  check(await first().locator('.ldb').isVisible(),'Photos, notes and delivery record remain accessible');
  await p.evaluate(()=>renderTimeline());
  check(await first().locator('.lc991-record').getAttribute('open')!==null,'Record fold remains open after native rerender');
  const instantRecord=await p.evaluate(()=>{const fold=document.querySelector('.lc991-record');fold.open=false;renderTimeline();const closed=!document.querySelector('.lc991-record').open;document.querySelector('.lc991-record').open=true;renderTimeline();return {closed,reopened:document.querySelector('.lc991-record').open};});
  check(instantRecord.closed&&instantRecord.reopened,'Immediate close/open followed by native redraw preserves current fold state before queued toggle callbacks');
  await first().locator('.lc991-record > summary').click();
  if(out){const layout=await first().locator('.timeline968-loading').evaluate(n=>[n,...n.querySelectorAll(':scope > *, :scope > * > *')].map(el=>{const s=getComputedStyle(el),r=el.getBoundingClientRect();return {tag:el.tagName,class:el.className,h:r.height,w:r.width,padding:s.padding,margin:s.margin,display:s.display,minHeight:s.minHeight};}));fs.writeFileSync(out+'/sizes-layout.json',JSON.stringify(layout,null,2));}
  await screenshot('open');
  await first().locator('[data-tl841-open]').first().click();
  check(await p.locator('#timeline841-dialog').isVisible(),'Progress action still opens native dialog');
  await p.keyboard.press('Escape');check(await p.locator('#timeline841-dialog').count()===0,'Progress dialog closes with Escape');
  await first().locator('[data-timeline968-more]').first().locator(':scope > summary').click();
  check(await first().locator('[data-timeline968-more]').first().getAttribute('open')!==null,'Supporting instructions expand');
  await first().locator('[data-drop911-open]').click();
  check(await p.locator('#drops911-workspace').isVisible(),'Arrange loads still opens the native workspace');
  await p.locator('[data-drop911-close]').click();
  check(await p.locator('#drops911-workspace').count()===0,'Arrange loads closes without changing order');
  await first().locator('[data-tl841-print]').click();
  check(await p.locator('#drv782').isVisible(),'Run sheet retains native pre-dispatch safety checks');
  check((await p.locator('#drv782').innerText()).includes('hold affected trucks'),'Run sheet keeps unresolved truck warnings');
  await p.locator('#drv782 [data-print946-close]').click();
  await p.context().route('https://www.google.com/maps/dir/**',route=>route.fulfill({status:200,contentType:'text/html',body:'<title>Navigation test</title>'}));
  const popupPromise=p.waitForEvent('popup');await first().locator('.lc991-actions .ld-nav').click();const popup=await popupPromise;
  await popup.waitForLoadState('domcontentloaded');check(popup.url().includes('destination=-27.988119'),'Navigate still opens the correct native destination');await popup.close();
  for(let i=0;i<6;i++){
   await toggle().click();await p.waitForFunction(()=>document.querySelector('.lc991-toggle')?.getAttribute('aria-expanded')==='false');check(await toggle().getAttribute('aria-expanded')==='false','Repeated close '+i);
   check(await p.evaluate(()=>document.activeElement?.classList.contains('lc991-toggle')),'Close retains keyboard focus '+i);
   await toggle().click();await p.waitForFunction(()=>document.querySelector('.lc991-toggle')?.getAttribute('aria-expanded')==='true');check(await toggle().getAttribute('aria-expanded')==='true','Repeated open '+i);
  }
  await toggle().click();await p.waitForTimeout(50);await toggle().click();await p.waitForTimeout(250);
  check(await toggle().getAttribute('aria-expanded')==='true','Rapid repeated close/open cancels cleanly');
  await cards.nth(1).locator('.lc991-toggle').click();await p.waitForTimeout(240);
  check(await p.locator('.lc991.on').count()===1,'Native single-open-load state preserved');
  await p.evaluate(()=>{state.day='2026-10-14';renderTimeline()});
  check((await p.locator('#pane-timeline').innerText()).includes('ALL TRUCKS ON SITE BEFORE 07:00'),'14 October arrival/curfew restriction preserved');
  check(await p.locator('#pane-timeline .staff988').count()===1,'One Available staff panel preserved on another day');
  const wednesday=await cards.evaluateAll(ns=>ns.map(n=>{const r=n.getBoundingClientRect(),list=n.closest('.ldlist').getBoundingClientRect(),s=n.querySelector('.lc991-summary').getBoundingClientRect();return {refs:[...n.querySelectorAll('.lc991-summary [data-tl841-ref]')].map(x=>x.dataset.tl841Ref),width:r.width,listWidth:list.width,summaryWidth:s.width,right:r.right,height:r.height,times:n.querySelectorAll('.lc991-summary .ld-t').length,untimed:!!n.querySelector('.lc991-summary.lc991-untimed')};}));
  check(wednesday.length===4&&JSON.stringify(wednesday.flatMap(r=>r.refs))===JSON.stringify(['P25','P66','P65','P67']),'Wednesday retains exactly the four confirmed loads in native order');
  check(wednesday.every(r=>r.width>=r.listWidth*.95&&r.summaryWidth>r.width*(mobile?.7:.5)&&r.right<=(mobile?360:1440)),'Untimed Wednesday cards and summaries fill the available width without overflow');
  check(wednesday.every(r=>r.times===0&&r.untimed&&r.height<(mobile?245:145)),'Untimed cards have no invented time column or inflated height');
  await cards.first().scrollIntoViewIfNeeded();await screenshot('wednesday-closed');
  // Exercise the real warning helper with isolated return values; never alter a shared record.
  const warningFixture=await p.evaluate(()=>{
   const saved={deliveryOf,shortWords,toiletRows962};let ticks;
   try{deliveryOf=()=>({done:true});shortWords=()=> 'CHAIR 1 of 2';toiletRows962=()=>({complete:false,done:1,quantity:2,status:'1/2 installed'});ticks=ldTicks({key:'QA991-only'});}finally{deliveryOf=saved.deliveryOf;shortWords=saved.shortWords;toiletRows962=saved.toiletRows962;}
   const host=document.createElement('div');host.id='qa991-warnings';host.innerHTML='<div class="ld tl846"><div class="tl846-layout"><button class="ldl" data-ld="qa991-warnings" aria-expanded="false"><span class="ld-n"><b>1</b></span><span class="ld-refs"><span class="tl841-ref" data-tl841-ref="QA991"><span class="tl846-identity"><span class="tl841-status finished">Finished</span></span><span class="tl846-ticks">'+ticks+'</span>'+timeline841Lights({stage:5,label:'Finished',why:'DOM-only regression fixture'})+'</span></span></button><div class="tl846-controls"></div></div></div>';
   document.querySelector('#pane-timeline').append(host);LoadCards991.apply(host);
   const value={warnings:[...host.querySelectorAll('.ld-tk.sh')].map(n=>({text:n.textContent,title:n.title,visible:n.getBoundingClientRect().width>0&&!n.closest('[hidden]'),summary:!!n.closest('.lc991-ref-exceptions')})),detailHidden:host.querySelector('.lc991-detail').hidden,report:Timeline841.report().rows.find(r=>r.key==='QA991')};host.remove();return value;
  });
  check(warningFixture.detailHidden&&warningFixture.warnings.length===2&&warningFixture.warnings.every(w=>w.visible&&w.summary),'Short-delivery and incomplete-install warnings remain visible even on a collapsed Finished reference');
  check(warningFixture.warnings.some(w=>w.text==='1/2 installed')&&warningFixture.warnings.some(w=>w.text==='Short · CHAIR 1 of 2'&&w.title==='Short: CHAIR 1 of 2'),'Warning preserves native item/count and explanation');
  check(warningFixture.report?.stage===5&&!warningFixture.report.running,'Progress report remains valid for collapsed exception fixture');
  // Check every lamp stage using only generated DOM fixtures; native records and status projection are untouched.
  const lamps=await p.evaluate(()=>{
   const results=[];
   for(let stage=0;stage<=5;stage++){
    const host=document.createElement('div');host.innerHTML='<div class="ld tl846"><div class="tl846-layout"><button class="ldl" data-ld="fixture-'+stage+'" aria-expanded="true"><span class="ld-n">Load fixture</span><span class="ld-refs"><span class="tl841-ref" data-tl841-ref="fixture">'+timeline841Lights({stage,label:'Fixture '+stage,why:'Browser-only fixture'})+'</span></span></button><div class="tl846-controls"></div></div></div>';
    document.querySelector('#pane-timeline').append(host);LoadCards991.apply(host);
    const gantry=host.querySelector('.tl841-gantry');gantry.classList.add('tl841-live');
    const animations=[...gantry.querySelectorAll('.tl841-halo')].map(n=>getComputedStyle(n).animationName);
    results.push({stage,animations,current:gantry.querySelectorAll('.lc991-current').length});host.remove();
   }
   return results;
  });
  check(lamps.every(x=>x.current===(x.stage>=2&&x.stage<=4?1:0)),'Only actual active stage 2–4 marked current');
  check(lamps.every(x=>x.animations.filter(a=>a!=='none').length===(x.stage>=2&&x.stage<=4?1:0)),'Off site, unknown and completed lights steady; only current stage pulses');
  const motion=await p.evaluate(()=>{
   const host=document.createElement('div');host.id='qa991-motion';host.style.cssText='position:fixed;top:180px;left:20px;width:300px;z-index:99999';
   host.innerHTML='<div class="ld tl846"><div class="tl846-layout"><button class="ldl" data-ld="qa991-motion" aria-expanded="true"><span class="ld-n"><b>1</b></span><span class="ld-refs"><span class="tl841-ref" data-tl841-ref="QA991-motion">'+timeline841Lights({stage:3,label:'Location',why:'DOM-only motion fixture'})+'</span></span></button><div class="tl846-controls"></div></div><div class="ldb"><input id="qa991-note" value="Retain unsaved note"></div></div>';
   const pane=document.querySelector('#pane-timeline');pane.append(host);const input=host.querySelector('input');input.focus();input.setSelectionRange(3,7);LoadCards991.apply(host);const retainedFocus=document.activeElement===input&&input.selectionStart===3&&input.selectionEnd===7&&host.querySelector('.lc991-record').open;const g=host.querySelector('.tl841-gantry'),read=()=>{timeline841Motion();const css=getComputedStyle(g.querySelector('.lc991-current .tl841-halo'));return g.classList.contains('tl841-live')&&css.animationName!=='none'&&css.animationPlayState==='running';};
   const visible=read(),motion=document.documentElement.dataset.motion;document.documentElement.dataset.motion='off';const globalOff=read();if(motion===undefined)delete document.documentElement.dataset.motion;else document.documentElement.dataset.motion=motion;
   const hiddenDescriptor=Object.getOwnPropertyDescriptor(document,'hidden');Object.defineProperty(document,'hidden',{value:true,configurable:true});const hidden=read();if(hiddenDescriptor)Object.defineProperty(document,'hidden',hiddenDescriptor);else delete document.hidden;
   const modal=document.createElement('div');modal.setAttribute('aria-modal','true');modal.style.cssText='position:fixed;inset:0';document.body.append(modal);const modalOpen=read();modal.remove();
   pane.classList.remove('on');const inactive=read();pane.classList.add('on');host.style.top='-2000px';const offscreen=read();host.style.top='180px';const restored=read();return {visible,globalOff,hidden,modalOpen,inactive,offscreen,restored,retainedFocus};
  });
  check(motion.retainedFocus,'Moving the original record preserves focused unsaved input and selection');
  check(motion.visible&&motion.restored,'Visible current-stage lights resume through native motion controller');
  check(!motion.globalOff&&!motion.hidden&&!motion.modalOpen&&!motion.inactive&&!motion.offscreen,'Global pause, hidden document, modal, inactive tab and offscreen position all stop lamps: '+JSON.stringify(motion));
  await p.emulateMedia({media:'print'});
  check(await p.locator('#qa991-motion .lc991-current .tl841-halo').evaluate(n=>getComputedStyle(n).animationName==='none'),'Print CSS stops the otherwise active current-stage pulse');
  await p.emulateMedia({media:'screen'});
  await p.emulateMedia({reducedMotion:'reduce'});
  check(await p.locator('#qa991-motion .lc991-current .tl841-halo').evaluate(n=>getComputedStyle(n).animationName==='none'),'OS reduced motion stops the otherwise active current-stage pulse');
  await p.evaluate(()=>document.querySelector('#qa991-motion').remove());
  await p.evaluate(()=>{state.day='2026-10-12';state.tlLoad=null;renderTimeline()});
  await toggle().click();
  check(await toggle().getAttribute('aria-expanded')==='true','Reduced motion opens immediately');
  check(await first().evaluate(n=>n.getAnimations({subtree:true}).every(a=>a.playState!=='running')),'Reduced motion suppresses card/sweep/lamp animation');
  await toggle().click();check(await toggle().getAttribute('aria-expanded')==='false','Reduced motion closes immediately');
  await p.emulateMedia({reducedMotion:'no-preference'});
  // A delayed close belongs only to the card on which it started.
  await toggle().click();await p.waitForTimeout(230);await toggle().click();
  await p.evaluate(()=>{state.day='2026-10-14';state.tlLoad=null;renderTimeline();});await p.waitForTimeout(240);
  check(await cards.count()===4&&await p.locator('.lc991.on').count()===0,'Delayed close callback cannot open/close a replacement day');
  await p.evaluate(()=>{state.day='2026-10-12';state.tlLoad=null;renderTimeline();});
  // Header warnings remain native Truck flow links.
  await first().locator('[data-flow891-jump]').click();
  check(await p.locator('.flow891.flow891-lit').count()===1,'Warning still targets Truck flow');
  const after=await p.evaluate(()=>({state:JSON.stringify(S),money:JSON.stringify(pl770Model()),staff:document.querySelector('.staff988').outerHTML,order:[...document.querySelectorAll('.ld[data-tl846-load]')].map(n=>n.dataset.tl846Load),flow:document.querySelector('.flow891').outerHTML.replace(' flow891-lit','')}));
  check(before.state===after.state&&before.money===after.money,'All actions preserve exact records and P&L');
  if(out&&before.staff!==after.staff){fs.writeFileSync(out+'/staff-before.html',before.staff);fs.writeFileSync(out+'/staff-after.html',after.staff);}
  check(before.staff===after.staff,'Available staff and edit availability markup unchanged');
  check(JSON.stringify(before.order)===JSON.stringify(after.order),'Load order unchanged');
  check(before.flow===after.flow,'Truck flow markup unchanged');
  check(h.errors.length===0,'No browser errors: '+h.errors.join(';'));
  check(h.counts.blocked===0,'No attempted operational writes');
  const result={author:'Andrew Fisher',pass:true,checks,mobile,width:mobile?360:1440,public:publicMode,sha256:publicMode?servedHash:crypto.createHash('sha256').update(fs.readFileSync(process.env.PAGE)).digest('hex'),wednesday,warningFixture,motion,closedHeights:closed.map(x=>x.height),lamps,errors:h.errors,writes:h.counts.blocked};
  if(out)fs.writeFileSync(out+'/checks.json',JSON.stringify(result,null,2));console.log(JSON.stringify(result));
 }finally{await h.browser.close()}
})().catch(e=>{console.error(e.stack);process.exit(1)});
