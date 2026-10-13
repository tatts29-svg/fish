/* Author: Andrew Fisher. Read-only presentation checks; use shared browser flock externally. */
'use strict';
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),assert=require('node:assert/strict');
const {open}=require(path.resolve(__dirname,'../../toolchain/harness/open_page'));
const live=process.env.LIVE==='1',pageFile=live?undefined:process.env.PAGE;
if(!live&&!pageFile)throw new Error('Set PAGE to a candidate, or LIVE=1 for public source');
const out=process.env.OUT||'/workspace/private-gc5001010-presentation-browser';fs.mkdirSync(out,{recursive:true});
const mobile=process.env.MOBILE!=='0';
const report={author:'Andrew Fisher',mode:live?'LIVE':'PAGE',viewport:mobile?'phone':'desktop',checks:[],errors:[],blocked:0};
const check=(name,ok,detail)=>{report.checks.push({name,ok,...(detail===undefined?{}:{detail})});assert(ok,name+': '+JSON.stringify(detail));};
const keySelector=key=>'details[data-sfold="presentation1010|'+key+'"]';
let h;
(async()=>{
 h=await open({pageFile,mobile,W:mobile?390:1440,H:mobile?844:1000,dpr:1});const p=h.page;
 await p.waitForFunction(()=>SYNC.status==='live'&&GC500Refresh904.report().settled,null,{timeout:120000});
 report.url=p.url();
 const source=await p.evaluate(async()=>{const r=await fetch('/v/Coates-GC500-2026/?presentation-source=1010',{cache:'no-store'});if(!r.ok)throw new Error('Page source '+r.status);const bytes=await r.arrayBuffer();return {html:new TextDecoder().decode(bytes),sha256:[...new Uint8Array(await crypto.subtle.digest('SHA-256',bytes))].map(n=>n.toString(16).padStart(2,'0')).join('')};});
 const html=source.html;report.parentSha256=source.sha256;
 report.sourceRequests={...h.counts};
 if(process.env.EXPECTED_SHA&&process.env.EXPECTED_SHA!==report.parentSha256)fs.writeFileSync(path.join(out,'unexpected-source.html'),html);
 check('expected reviewed source',!process.env.EXPECTED_SHA||process.env.EXPECTED_SHA===report.parentSha256,report.parentSha256);
 check('presentation patch exists in requested source',html.includes("moreInfo('presentation1010|today-help'"));
 report.nativeVersionBefore=await p.evaluate(()=>SYNC.backend.readVersion821());
 const cases=[
  {route:'today',pane:'#pane-today',key:'today-help',phrase:'Press / on a keyboard'},
  {route:'subhired',pane:'#pane-subhired',key:'subhire-help',phrase:'Ownership is recorded per item'},
  {route:'timeline',pane:'#pane-timeline',key:'truck-order-help',phrase:'Change the order on the list below'},
  {route:'timeline',pane:'#pane-timeline',key:'truck-window-help',phrase:'The area check uses a Kingston load time'},
  {route:'plant',pane:'#pane-plant',key:'inventory-help',phrase:'Total on site = at locations + spares'},
  {route:'coatesway',pane:'#pane-coatesway',key:'coatesway-help',phrase:'This job, laid against the cog.'},
 ];
 for(const c of cases){
  await p.evaluate(({route})=>{
   if(route==='timeline'){
    const days=calendarDays(),preferred=['2026-10-14','2026-10-15','2026-10-12'];
    const options=[...preferred.map(iso=>days.find(d=>d.iso===iso)).filter(Boolean),...days];
    const day=options.find(d=>{const m=flow891Day(d);return m.loads>1&&m.deliveries.length>1&&m.unknownWindows>0;});
    if(!day)throw new Error('No native planning day covers both Truck flow help cases');
    state.day=day.iso;state.tlView='day';window.__presentation1010Day=day.iso;
   }
   go(route);
  },c);
  const selector=c.pane+' '+keySelector(c.key),detail=p.locator(selector);
  await detail.waitFor({state:'attached',timeout:30000});
  check(c.key+' exactly one disclosure',await detail.count()===1);
  await detail.evaluate(node=>{for(let parent=node.parentElement;parent;parent=parent.parentElement)if(parent.tagName==='DETAILS')parent.open=true;});
  check(c.key+' help starts closed',!(await detail.evaluate(node=>node.open)));
  check(c.key+' retained help text once',await p.locator(c.pane).evaluate((node,phrase)=>node.textContent.split(phrase).length-1,c.phrase)===1);
  const summary=detail.locator(':scope > summary');await summary.scrollIntoViewIfNeeded();await summary.focus();await summary.press('Enter');
  await p.waitForFunction(key=>SFOLD_OPEN.has('presentation1010|'+key),c.key);
  check(c.key+' opens by keyboard',await detail.evaluate(node=>node.open));
  await p.evaluate(()=>render());
  await detail.waitFor({state:'attached'});
  check(c.key+' stays open on full redraw',await detail.evaluate(node=>node.open));
  check(c.key+' text remains single after redraw',await p.locator(c.pane).evaluate((node,phrase)=>node.textContent.split(phrase).length-1,c.phrase)===1);
  if(c.route==='subhired')check('company buttons remain exposed',await p.locator('[data-supplier932-company]').first().isVisible());
  if(c.route==='timeline'){
   const facts=await p.evaluate(()=>{
    const d=calendarDays().find(x=>x.iso===state.day),m=flow891Day(d),card=document.querySelector('#pane-timeline .flow891');
    const outside=[...card.querySelectorAll('.flow891-note')].filter(n=>!n.closest('details[data-sfold^="presentation1010|"]')).map(n=>n.textContent);
    const critical=[...card.querySelectorAll('.flow891-flag,[data-flow891-first],[data-flow891-stagger]')];
    return {day:d.iso,unknown:m.unknownWindows,outside,criticalHidden:critical.some(n=>!!n.closest('details[data-sfold^="presentation1010|"]'))};
   });
   check('missing-window count remains outside help',facts.outside.some(x=>x.startsWith(facts.unknown+' load')&&x.includes('no arrival window yet')),facts);
   check('curfew and stagger warnings/actions not inside help',!facts.criticalHidden);
  }
  if(c.route==='plant'){
   const view=await p.evaluate(()=>({hint:document.querySelector('#invCard')?.textContent.includes('Select a quantity to see locations.'),warningsHidden:[...document.querySelectorAll('#invCard .invwarn')].some(n=>!!n.closest('details[data-sfold^="presentation1010|"]')),tables:document.querySelectorAll('#invCard table').length}));
   check('inventory hint and counts retained outside explanation',view.hint&&view.tables>0&&!view.warningsHidden,view);
  }
  if(c.route==='coatesway'){
   await p.waitForFunction(()=>!document.querySelector('#cwMachineState')?.textContent.includes('Asking the service'),null,{timeout:30000});
   check('machine ready metadata does not create duplicate More info',await p.locator('#cwmachine .presentation994-machine-info').count()===0);
   check('film and open control retained',await p.locator('#cwmachine video.cwloop').count()===1&&await p.locator('#cwOpenMachine').isVisible());
  }
  await detail.locator(':scope > summary').scrollIntoViewIfNeeded();
  await p.screenshot({path:path.join(out,c.key+'-'+report.viewport+'.png')});
 }
 report.nativeVersionAfter=await p.evaluate(()=>SYNC.backend.readVersion821());
 report.errors=h.errors;report.blocked=h.counts.blocked;
 check('zero page errors',report.errors.length===0,report.errors);
 check('zero attempted operational writes',report.blocked===0,report.blocked);
 fs.writeFileSync(path.join(out,'review.json'),JSON.stringify(report,null,2));
 console.log(JSON.stringify({passed:true,checks:report.checks.length,mode:report.mode,parentSha256:report.parentSha256,out}));
})().catch(error=>{report.failure=String(error);if(h){report.errors=h.errors;report.blocked=h.counts.blocked;}fs.writeFileSync(path.join(out,'review.json'),JSON.stringify(report,null,2));console.error(error);process.exitCode=1;}).finally(async()=>{if(h)await h.browser.close();});
