// Author: Andrew Fisher. Read-only candidate checks. All operational writes blocked by shared harness.
const {open}=require('../../toolchain/harness/open_page');
const fs=require('fs'),assert=require('assert/strict'),crypto=require('crypto');
(async()=>{
 const mobile=process.env.MOB==='1',out=process.env.OUTDIR;
 const h=await open({pageFile:process.env.PAGE,hash:'#day/2026-10-12',W:mobile?360:1440,H:1000,mobile});
 const p=h.page;let checks=0;const check=(ok,label)=>{assert(ok,label);checks++};
 try{
  await p.waitForFunction(()=>SYNC.status==='live'&&SYNC.first.size===Object.keys(SYNC_COLLS).length&&DOCS.state==='ready',null,{timeout:150000});
  await p.evaluate(()=>{state.day='2026-10-12';go('timeline');renderTimeline()});
  const before=await p.evaluate(()=>({state:JSON.stringify(S),money:JSON.stringify(pl770Model()),staff:document.querySelector('.staff988').outerHTML,flow:document.querySelector('.flow891').outerHTML,order:[...document.querySelectorAll('.ld[data-tl846-load]')].map(n=>n.dataset.tl846Load)}));
  const cards=p.locator('#pane-timeline .lc990'),first=()=>cards.first(),toggle=()=>first().locator('.lc990-toggle');
  check(await cards.count()===6,'Six native loads retained');
  const closed=await cards.evaluateAll(nodes=>nodes.map(n=>({height:n.getBoundingClientRect().height,hidden:n.querySelector('.lc990-detail').hidden,inert:n.querySelector('.lc990-detail').inert,
   time:!!n.querySelector('.lc990-summary .ld-t'),refs:!!n.querySelector('.lc990-summary .tl841-ref'),status:!!n.querySelector('.lc990-summary .tl841-status'),nav:!!n.querySelector('.lc990-actions .ld-nav'),
   summaryLights:n.querySelectorAll('.lc990-summary .tl841-gantry').length,warning:[...n.querySelectorAll('.flow891-chip')].every(w=>!!w.closest('.lc990-warnings')),
   targets:[...n.querySelectorAll('.lc990-actions button,.lc990-actions a,.lc990-warnings button')].every(x=>x.getBoundingClientRect().height>=44),right:n.getBoundingClientRect().right})));
  check(closed.every(n=>n.hidden&&n.inert),'Closed details hidden and inert');
  check(closed.every(n=>n.time&&n.refs&&n.status&&n.nav&&!n.summaryLights),'Essential identity and status remain; progress in Details');
  check(closed.every(n=>n.warning&&n.targets),'Every warning remains visible and header targets are at least 44px');
  check(closed.every(n=>n.height<=(mobile?260:160)),'Closed cards are compact: '+closed.map(n=>n.height).join(','));
  check(closed.every(n=>n.right<=(mobile?360:1440)),'Cards stay inside viewport');
  const warnings=await p.locator('.lc990-warnings').allTextContents();
  check(warnings.filter(x=>/Curfew first/i.test(x)).length===2,'Both curfew-first warnings stay visible');
  check(await p.locator('.lc990-summary .ld-t b.nt').count()===2,'Both missing load times remain explicit');
  const screenshot=async name=>{if(out){fs.mkdirSync(out,{recursive:true});await p.screenshot({path:out+'/'+name+'.png'});}};
  await p.locator('.staff988').evaluate(n=>{const sc=ldScroller(n);sc.scrollTop+=n.getBoundingClientRect().top-140});await screenshot('closed');
  await toggle().focus();await p.keyboard.press('Enter');await p.waitForTimeout(250);
  check(await toggle().getAttribute('aria-expanded')==='true','Keyboard Enter opens native details');
  check(await first().locator('.lc990-detail').isVisible(),'Expanded body visible');
  check(await first().locator('.lc990-detail .ld-qr').isVisible(),'Native QR visible in Details');
  check(await first().locator('.ld-qr').getAttribute('href')===await first().locator('.lc990-actions .ld-nav').getAttribute('href'),'QR and Navigate retain the same destination');
  check(await first().locator('.timeline968-loading').isVisible(),'Sizes and weights available when expanded');
  check((await first().innerText()).includes('Nominal description'),'Nominal size uncertainty label retained');
  check(await first().locator('.ldb').count()===1,'Native photos/notes/delivery body retained once');
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
  const popupPromise=p.waitForEvent('popup');await first().locator('.lc990-actions .ld-nav').click();const popup=await popupPromise;
  await popup.waitForLoadState('domcontentloaded');check(popup.url().includes('destination=-27.988119'),'Navigate still opens the correct native destination');await popup.close();
  for(let i=0;i<6;i++){
   await toggle().click();await p.waitForFunction(()=>document.querySelector('.lc990-toggle')?.getAttribute('aria-expanded')==='false');check(await toggle().getAttribute('aria-expanded')==='false','Repeated close '+i);
   check(await p.evaluate(()=>document.activeElement?.classList.contains('lc990-toggle')),'Close retains keyboard focus '+i);
   await toggle().click();await p.waitForFunction(()=>document.querySelector('.lc990-toggle')?.getAttribute('aria-expanded')==='true');check(await toggle().getAttribute('aria-expanded')==='true','Repeated open '+i);
  }
  await toggle().click();await p.waitForTimeout(50);await toggle().click();await p.waitForTimeout(250);
  check(await toggle().getAttribute('aria-expanded')==='true','Rapid repeated close/open cancels cleanly');
  await cards.nth(1).locator('.lc990-toggle').click();await p.waitForTimeout(240);
  check(await p.locator('.lc990.on').count()===1,'Native single-open-load state preserved');
  await p.evaluate(()=>{state.day='2026-10-14';renderTimeline()});
  check((await p.locator('#pane-timeline').innerText()).includes('ALL TRUCKS ON SITE BEFORE 07:00'),'14 October arrival/curfew restriction preserved');
  check(await p.locator('#pane-timeline .staff988').count()===1,'One Available staff panel preserved on another day');
  // Check every lamp stage using only generated DOM fixtures; native records and status projection are untouched.
  const lamps=await p.evaluate(()=>{
   const results=[];
   for(let stage=0;stage<=5;stage++){
    const host=document.createElement('div');host.innerHTML='<div class="ld tl846"><div class="tl846-layout"><button class="ldl" data-ld="fixture-'+stage+'" aria-expanded="true"><span class="ld-n">Load fixture</span><span class="ld-refs"><span class="tl841-ref" data-tl841-ref="fixture">'+timeline841Lights({stage,label:'Fixture '+stage,why:'Browser-only fixture'})+'</span></span></button><div class="tl846-controls"></div></div></div>';
    document.querySelector('#pane-timeline').append(host);LoadCards990.apply(host);
    const gantry=host.querySelector('.tl841-gantry');gantry.classList.add('tl841-live');
    const animations=[...gantry.querySelectorAll('.tl841-halo')].map(n=>getComputedStyle(n).animationName);
    results.push({stage,animations,current:gantry.querySelectorAll('.lc990-current').length});host.remove();
   }
   return results;
  });
  check(lamps.every(x=>x.current===(x.stage>=2&&x.stage<=4?1:0)),'Only actual active stage 2–4 marked current');
  check(lamps.every(x=>x.animations.filter(a=>a!=='none').length===(x.stage>=2&&x.stage<=4?1:0)),'Off site, unknown and completed lights steady; only current stage pulses');
  await p.emulateMedia({reducedMotion:'reduce'});
  await p.evaluate(()=>{state.day='2026-10-12';state.tlLoad=null;renderTimeline()});
  await toggle().click();
  check(await toggle().getAttribute('aria-expanded')==='true','Reduced motion opens immediately');
  check(await first().evaluate(n=>n.getAnimations({subtree:true}).every(a=>a.playState!=='running')),'Reduced motion suppresses card/sweep/lamp animation');
  await toggle().click();check(await toggle().getAttribute('aria-expanded')==='false','Reduced motion closes immediately');
  await p.emulateMedia({reducedMotion:'no-preference'});
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
  const result={author:'Andrew Fisher',pass:true,checks,mobile,width:mobile?360:1440,sha256:crypto.createHash('sha256').update(fs.readFileSync(process.env.PAGE)).digest('hex'),closedHeights:closed.map(x=>x.height),lamps,errors:h.errors,writes:h.counts.blocked};
  if(out)fs.writeFileSync(out+'/checks.json',JSON.stringify(result,null,2));console.log(JSON.stringify(result));
 }finally{await h.browser.close()}
})().catch(e=>{console.error(e.stack);process.exit(1)});
