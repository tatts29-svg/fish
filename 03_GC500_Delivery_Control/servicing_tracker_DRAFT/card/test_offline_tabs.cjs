/* Author: Andrew Fisher. Local-only phone checks for fresh scans, tabs, clock and header. */
'use strict';
const { chromium } = require('playwright');
const { createMock } = require('./mock_server');
const { buildCardHtml, trackerConfig } = require('./build_card');
const DATA = require('../tracker_data.json');
const assert = require('node:assert/strict'), fs = require('node:fs'), path = require('node:path');
let count=0; const check=(name,good)=>{assert.ok(good,name); count++; console.log('PASS '+name);};
(async()=>{
 const mock=createMock({control:true}); await mock.listen();
 let browser; try {
  mock.setNow('2026-10-23T21:59:30Z');
  const made=await fetch(mock.base+'/api/cards',{method:'POST',headers:{'content-type':'application/json','x-gc500-token':mock.options.editToken},body:JSON.stringify({load:'card-reliability-local',title:'Local test',run_date:'2026-10-23',expires:'2026-10-26',keys:[],targets:[],html:buildCardHtml(DATA),tracker:trackerConfig(DATA)})}).then(r=>r.json());
  const token=made.token,links=made.tracker.links,base=mock.base+'/d/'+token, url=r=>base+'#r='+r+'.'+links[r];
  browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||undefined});
  const ctx=await browser.newContext({viewport:{width:360,height:640},deviceScaleFactor:2,isMobile:true,hasTouch:true});
  const errors=[],csp=[]; ctx.on('page',p=>{p.on('pageerror',e=>errors.push(e.message));});
  await ctx.addInitScript(()=>{window.violations=[];document.addEventListener('securitypolicyviolation',e=>window.violations.push(e.violatedDirective));});
  const a=await ctx.newPage(); await a.goto(url('WC06')); await a.waitForFunction(()=>document.querySelector('#readiness').textContent==='Ready for offline scans');
  await a.waitForFunction(()=>/^Live/.test(document.querySelector('#status').textContent));
  check('first online visit explicitly confirms offline cache readiness',await a.locator('#readiness').innerText()==='Ready for offline scans');
  await a.locator('[data-job="WC06-FWF|pump"]').click();
  await a.waitForFunction(()=>svc1067.outbox().length===0);
  await ctx.setOffline(true);
  const b=await ctx.newPage(); await b.goto(url('WC07')); await b.waitForFunction(()=>window.svc1067);
  check('fresh second QR opens without signal after initial cache',await b.locator('#refh').innerText()==='WC07');
  check('fresh offline card retains another reference confirmed tick',await b.evaluate(()=>svc1067.groupStats(svc1067.areas.flatMap(a=>a.refs),'2026-10-23',svc1067.jobStates(Object.keys(localStorage).filter(k=>k.includes('.snapshot.')).map(k=>JSON.parse(localStorage.getItem(k))).sort((a,b)=>b.serverAt-a.serverAt||b.cursor-a.cursor)[0].ticks,svc1067.now())).d)>0);
  await b.locator('[data-job="WC07-FWF|pump"]').click();
  await a.locator('[data-job="WC06-FWF|clean"]').click();
  check('two open tabs keep both offline taps',await a.evaluate(()=>svc1067.outbox().length)===2);
  await b.close(); await ctx.setOffline(false); await a.evaluate(()=>window.dispatchEvent(new Event('online')));
  await a.waitForFunction(()=>svc1067.outbox().length===0);
  check('closing second tab cannot lose its queued tick',mock.ticks(token).some(t=>t.ref==='WC07'&&t.task==='pump') && mock.ticks(token).some(t=>t.ref==='WC06'&&t.task==='clean'));
  mock.setNow('2026-10-23T22:01:00Z'); const c=await ctx.newPage(); await c.goto(url('WC09')); await c.waitForFunction(()=>/^Live/.test(document.querySelector('#status').textContent));
  check('fresh scan after 08:00 offers previous-day Stay',await c.locator('[data-stay]').count()===1);
  await c.locator('[data-stay]').click();
  check('late-day window says late ticks and explicit expiry',/Late ticks/.test(await c.locator('#window').innerText()) && /This choice ends/.test(await c.locator('#banners').innerText()));
  const heights=await c.evaluate(()=>({header:document.querySelector('header').getBoundingClientRect().height,overflow:document.documentElement.scrollWidth>innerWidth}));
  check('sticky header under 112 px at 360 x 640 with Stay active',heights.header<=112);
  check('small phone has no sideways overflow',!heights.overflow);
  await c.locator('[data-job]').first().scrollIntoViewIfNeeded();
  check('job button can scroll clear of sticky header',await c.locator('[data-job]').first().evaluate(el=>el.getBoundingClientRect().top>=document.querySelector('header').getBoundingClientRect().bottom));
  const out=process.env.CARD_TEST_EVIDENCE||path.join(__dirname,'evidence'); fs.mkdirSync(out,{recursive:true}); await c.screenshot({path:path.join(out,'card_compact_late_360.png')});
  await ctx.setOffline(true); const old=await ctx.newPage();await old.goto(url('WC31'));await old.waitForFunction(()=>window.svc1067);
  const changed=JSON.parse(JSON.stringify(DATA));const changedRef=changed.areas.flatMap(a=>a.refs).find(r=>r.ref==='WC31');changedRef.lines[0].qty++;
  const storedCard=mock.cards.get(token);storedCard.html=buildCardHtml(changed);storedCard.tracker=trackerConfig(changed); // Keep same days AND updated timestamp: script identity must catch this.
  await ctx.setOffline(false);await old.evaluate(()=>window.dispatchEvent(new Event('online')));await old.waitForFunction(()=>/Reload/.test(document.querySelector('#banners').textContent));
  check('old offline shell detects changed quantity with same days and timestamp',await old.locator('[data-job]:not([disabled])').count()===0);
  check('stale shell cannot promise current offline readiness',await old.locator('#readiness').innerText()==='Card changed · reload before ticking');
  await old.reload();await old.waitForFunction(()=>/^Live/.test(document.querySelector('#status').textContent));
  check('reloaded current script clears stale warning and shows changed quantity',!/Reload/.test(await old.locator('#banners').innerText()) && (await old.locator('.count').innerText()).startsWith(changedRef.lines.reduce((n,l)=>n+l.qty,0)+' units'));
  for(const p of ctx.pages())csp.push(...await p.evaluate(()=>window.violations));
  check('no CSP violations with pinned script and own worker',csp.length===0);
  check('no page errors',errors.length===0);
  const virgin=await browser.newContext(); await virgin.setOffline(true); const v=await virgin.newPage(); let failed=false;try{await v.goto(url('WC31'));}catch(_){failed=true;}
  check('first-ever offline visit is honestly unavailable without prior cache',failed);
  await virgin.close();
  const delayed=await browser.newContext({viewport:{width:360,height:640}});await delayed.addInitScript(()=>{const digest=crypto.subtle.digest.bind(crypto.subtle);crypto.subtle.digest=(...args)=>new Promise(resolve=>{digest(...args).then(bytes=>{window.releaseDigest=()=>resolve(bytes);});});});
  const pending=await delayed.newPage();await pending.goto(url('WC31'));await pending.waitForFunction(()=>/^Live/.test(document.querySelector('#status').textContent)&&window.releaseDigest);
  check('current GET with pending local digest disables jobs',await pending.locator('[data-job]:not([disabled])').count()===0);
  await pending.evaluate(()=>window.releaseDigest());await pending.waitForFunction(()=>document.querySelector('[data-job]:not([disabled])'));
  check('matching digest enables jobs without another poll',await pending.locator('[data-job]:not([disabled])').count()>0);await delayed.close();
  await ctx.close(); console.log(`${count} passed, 0 failed`);
 } finally { if(browser)await browser.close();await mock.close(); }
})().catch(e=>{console.error(e);process.exitCode=1;});
