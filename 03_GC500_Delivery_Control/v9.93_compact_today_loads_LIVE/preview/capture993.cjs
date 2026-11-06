// Author: Andrew Fisher. Local preview only; shared harness blocks every operational write.
const fs=require('fs'),path=require('path'),crypto=require('crypto'),assert=require('assert/strict'),{spawnSync}=require('child_process');
const out=process.env.OUTDIR||'/workspace/private-gc500-v993-preview/'+(process.env.MOB==='1'?'phone':'desktop');
fs.mkdirSync(out,{recursive:true});
// Keep the video encoder runtime local to the preview, without modifying the shared harness or browser cache.
const runtime=path.join(out,'.video-runtime');
const metadata=JSON.parse(fs.readFileSync(path.join(path.dirname(require.resolve('playwright-core/package.json')),'browsers.json')));
const revision=metadata.browsers.find(b=>b.name==='ffmpeg').revision;
const encoder=path.join(runtime,'ffmpeg-'+revision,'ffmpeg-linux');fs.mkdirSync(path.dirname(encoder),{recursive:true});
if(!fs.existsSync(encoder))fs.symlinkSync('/usr/bin/ffmpeg',encoder);
process.env.PLAYWRIGHT_BROWSERS_PATH=runtime;
const {chromium}=require('playwright');
const originalLaunch=chromium.launch.bind(chromium),mobile=process.env.MOB==='1',width=mobile?390:1440,height=mobile?844:960;
chromium.launch=async function(options){const browser=await originalLaunch(options),originalContext=browser.newContext.bind(browser);browser.newContext=options=>originalContext({...options,recordVideo:{dir:path.join(out,'raw'),size:{width,height}}});return browser;};
const {open}=require('../../toolchain/harness/open_page');
(async()=>{
 const hash=crypto.createHash('sha256').update(fs.readFileSync(process.env.PAGE)).digest('hex');assert.equal(hash,process.env.EXPECTED_SHA,'Preview candidate hash');
 const h=await open({pageFile:process.env.PAGE,hash:'#day/2026-10-12',W:width,H:height,mobile}),p=h.page;let checks=0;
 const check=(ok,label)=>{assert(ok,label);checks++;};let rawVideo,sequenceSeconds,sequenceEndedAt,recordingStoppedAt;
 const save=async name=>p.screenshot({path:path.join(out,name+'.png')});
 const alignPanel=async selector=>{
  await p.waitForTimeout(350);
  for(let i=0;i<3;i++){
   await p.locator(selector).evaluate(n=>{const sc=ldScroller(n),header=document.querySelector('header.top'),main=document.querySelector('main'),top=Math.max(header?.getBoundingClientRect().bottom||0,main?.getBoundingClientRect().top||0)+12;sc.scrollTo({top:sc.scrollTop+n.getBoundingClientRect().top-top,behavior:'instant'});});
   await p.waitForTimeout(350);
  }
 };

 let evidence;
 try{
  await p.waitForFunction(()=>SYNC.status==='live'&&SYNC.first.size===Object.keys(SYNC_COLLS).length&&DOCS.state==='ready',null,{timeout:150000});
  await p.evaluate(()=>{state.day='2026-10-12';state.tlLoad=null;go('timeline');renderTimeline();});
  const snapshot=()=>p.evaluate(()=>({records:JSON.stringify(S),money:JSON.stringify(pl770Model()),staff:document.querySelector('.staff988').outerHTML,statuses:[...document.querySelectorAll('.lc991-summary .tl841-ref')].map(n=>({ref:n.dataset.tl841Ref,status:n.querySelector('.tl841-status')?.textContent,stage:n.querySelector('.tl841-gantry')?.dataset.tl841Stage})),facts:[...document.querySelectorAll('.lc991-summary .r931-fact')].map(n=>({label:n.querySelector('span')?.textContent,value:n.querySelector('strong')?.textContent}))}));
  const before=await snapshot(),cards=p.locator('#pane-timeline .lc991'),first=()=>cards.first();
  check(await cards.count()===6,'Six real Monday loads retained');
  check(before.statuses[0].ref==='P45'&&before.statuses[0].stage==='1','Real first load remains Off site');
  const roster=await p.evaluate(()=>{const m=DailyStaff988.day(state.day),panel=document.querySelector('.staff988'),can=capability()==='edit'&&!SYNC.readonly&&state.day>=todayIso()&&m.ready;return {expectedNames:m.names,shownNames:[...panel.querySelectorAll('.staff988-names>li:not(.staff988-unnamed)')].map(n=>n.textContent),count:m.count,label:panel.querySelector('.staff988-heading>strong')?.textContent,canEdit:can,editPresent:!!panel.querySelector('[data-staff988-edit]')};});
  check(JSON.stringify(roster.expectedNames)===JSON.stringify(roster.shownNames)&&roster.label===(roster.count===null?'Not recorded':roster.count+' available'),'Daily roster names and availability count match the native record');
  check(roster.editPresent===roster.canEdit,'Native roster controls follow existing access permissions');
  if(roster.editPresent){await p.locator('[data-staff988-edit]>summary').click();check(await p.locator('[data-staff988-save]').isVisible(),'Native roster edit controls remain accessible');await p.locator('[data-staff988-edit]>summary').click();}
  const nativeFacts=await p.evaluate(()=>[...document.querySelectorAll('.lc991')].flatMap(card=>Loading931.loadProducts931(Loading931.findLoad(state.day,card.dataset.tl846Load)).flatMap(product=>product.facts.filter(f=>/\d/.test(f.values.join(' · '))&&/\b(?:mm|kg)\b/.test(f.values.join(' · '))).map(f=>({label:f.label,value:f.values.join(' · ')})))));
  check(JSON.stringify(nativeFacts)===JSON.stringify(before.facts),'Every original numeric strong text and qualification matches native data');
  const numericStyles=await p.locator('.lc991-summary .lc993-value,.lc991-summary .lc993-reading:not(:has(.lc993-value))').evaluateAll(ns=>ns.map(n=>({text:n.textContent,fontSize:getComputedStyle(n).fontSize,opacity:getComputedStyle(n).opacity})));
  check(numericStyles.length>0&&numericStyles.every(n=>n.fontSize===(mobile?'18px':'19px')&&n.opacity==='1'),'Displayed numeric readings have the intended readable size and full opacity');
  const geometry=await cards.evaluateAll(nodes=>nodes.map(n=>{const r=n.getBoundingClientRect();return {width:r.width,height:r.height,left:r.left,right:r.right,lights:n.querySelectorAll('.lc991-summary .tl841-gantry').length,refs:n.querySelectorAll('.lc991-summary .tl841-ref').length,clipped:n.scrollHeight>n.clientHeight+1};}));
  check(geometry.every(n=>n.left>=0&&n.right<=width&&n.lights===n.refs&&!n.clipped),'Cards fit without clipping; one gantry per real reference');
  await alignPanel('#pane-timeline .bc984-more');await save('staff-and-card');
  const flow=p.locator('#pane-timeline details.flow909').first();await flow.locator(':scope > summary').click();check(await flow.getAttribute('open')!==null,'Native Truck flow opens');await flow.scrollIntoViewIfNeeded();await save('truck-flow-open');await flow.locator(':scope > summary').click();check(await flow.getAttribute('open')===null,'Native Truck flow closes');
  await first().scrollIntoViewIfNeeded();await save('closed-build');await first().screenshot({path:path.join(out,'closed-card.png')});
  const weighted=cards.filter({hasText:/Mass \d/}).first();
  if(await weighted.count()){await weighted.scrollIntoViewIfNeeded();await weighted.screenshot({path:path.join(out,'known-weight-card.png')});}
  await first().scrollIntoViewIfNeeded();
  await first().locator('.lc991-toggle').click();await p.waitForTimeout(350);
  check(await first().locator('.lc991-toggle').getAttribute('aria-expanded')==='true','Native Details opens');
  check(await first().locator('.lc991-detail .ld-qr').isVisible(),'Native navigation QR remains available');
  await first().locator('.lc991-record > summary').click();check(await first().locator('.ldb').isVisible(),'Photos, notes and delivery record opens');
  await first().locator('.lc991-record > summary').click();
  await first().locator('[data-tl841-open]').first().click();check(await p.locator('#timeline841-dialog').isVisible(),'Native progress dialog opens without a write');await p.keyboard.press('Escape');
  await first().locator('.lc991-toggle').click();await p.waitForTimeout(350);
  await p.emulateMedia({reducedMotion:'reduce'});await first().locator('.lc991-toggle').click();
  check(await first().evaluate(n=>n.getAnimations({subtree:true}).every(a=>a.playState!=='running')),'Reduced motion suppresses running card animations');
  await first().locator('.lc991-toggle').click();await p.emulateMedia({reducedMotion:'no-preference'});
  await p.locator('#motionBtn').evaluate(button=>button.click());
  check(await p.evaluate(()=>motionOff()),'Real Motion Off control updates the native motion preference');
  await first().locator('.lc991-toggle').click();const motionOffAnimations=await first().evaluate(n=>n.getAnimations({subtree:true}).filter(a=>a.playState==='running').map(a=>({type:a.constructor.name,name:a.animationName||a.transitionProperty||'',target:a.effect?.target?.className,currentTime:a.currentTime})));check(motionOffAnimations.length===0,'Global Motion Off suppresses running card animations: '+JSON.stringify(motionOffAnimations));
  await first().locator('.lc991-toggle').click();await p.locator('#motionBtn').evaluate(button=>button.click());
  await p.evaluate(()=>timeline841Motion());
  const offscreen=await p.evaluate(()=>[...document.querySelectorAll('#pane-timeline .tl841-gantry')].filter(g=>{const r=g.getBoundingClientRect();return r.bottom<0||r.top>innerHeight;}).map(g=>g.classList.contains('tl841-live')));
  check(offscreen.length>0&&offscreen.every(v=>!v),'Offscreen native lamps are paused');
  // Record only genuine hover/open/close motion on the actual Off-site P45 card.
  await alignPanel('#pane-timeline .bc984-more');await p.mouse.move(2,2);await p.waitForTimeout(500);
  const start=Date.now();
  await p.waitForTimeout(1000);await first().evaluate(n=>{const sc=ldScroller(n);sc.scrollTo({top:sc.scrollTop+n.getBoundingClientRect().top-145,behavior:'smooth'});});await p.waitForTimeout(700);await first().hover();await p.waitForTimeout(1800);await first().locator('.lc991-toggle').click();await p.waitForTimeout(1800);
  await save('details-open');await first().locator('.lc991-toggle').click();await p.waitForTimeout(1800);await p.mouse.move(2,2);await p.waitForTimeout(1200);
  sequenceEndedAt=Date.now();sequenceSeconds=(sequenceEndedAt-start)/1000;
  const after=await snapshot();check(before.records===after.records&&before.money===after.money,'Preview interactions preserve exact shared records and P&L');
  check(before.staff===after.staff,'Daily available staff unchanged');
  check(JSON.stringify(before.statuses)===JSON.stringify(after.statuses)&&JSON.stringify(before.facts)===JSON.stringify(after.facts),'Statuses, original numeric facts and certainty labels remain unchanged');
  check(h.errors.length===0,'No browser errors');check(h.counts.blocked===0,'No attempted operational writes');
  rawVideo=await p.video().path();
  evidence={author:'Andrew Fisher',previewOnly:true,ready:false,published:false,pass:true,checks,mobile,width,height,sha256:hash,geometry,roster,numericStyles,recordedStatus:before.statuses[0],originalFactsPreserved:true,staffPreserved:true,recordsPreserved:true,errors:h.errors,writes:h.counts.blocked,sequenceSeconds,rawVideo};
 }finally{recordingStoppedAt=Date.now();await p.context().close();await h.browser.close();}
 // The preservation checks happen after the animation sequence. Measure that tail instead of guessing.
 evidence.postSequenceSeconds=(recordingStoppedAt-sequenceEndedAt)/1000;
 fs.writeFileSync(path.join(out,'checks.json'),JSON.stringify(evidence,null,2));
 const encoded=spawnSync('python',[path.join(__dirname,'encode993.py'),out],{encoding:'utf8'});assert.equal(encoded.status,0,encoded.stderr);
 console.log(fs.readFileSync(path.join(out,'checks.json'),'utf8'));
})().catch(e=>{console.error(e.stack);process.exit(1)});
