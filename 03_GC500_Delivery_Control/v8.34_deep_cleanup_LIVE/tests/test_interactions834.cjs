// Author: Andrew Fisher. Private-output regression; operational writes stay in memory.
// PAGE and OUT are required. Optional MOB=1, REFERENCE, EXPECTED_NUMBER and REMOVED_NUMBER.
const fs = require('fs'), path = require('path'), crypto = require('crypto');
const {open} = require('../../toolchain/harness/open_page.js');
const {curlFetch} = require('../../toolchain/harness/curlfetch.js');
const pageFile = process.env.PAGE, out = process.env.OUT, mobile = !!process.env.MOB;
if (!pageFile || !out) throw Error('PAGE and a private OUT directory are required');
fs.mkdirSync(out, {recursive: true});
const report = {author:'Andrew Fisher', mobile, source:crypto.createHash('sha256').update(fs.readFileSync(pageFile)).digest('hex'), checks:[], actions:[], errors:[], consoleErrors:[],resourceFailures:[]};
const save = () => fs.writeFileSync(path.join(out, 'interactions.json'), JSON.stringify(report, null, 2));
const check = (name, pass, detail) => { report.checks.push({name, pass:!!pass, detail}); save(); if (!pass) throw Error(name); };
async function native() {
  const response = await curlFetch('https://gc500-production.up.railway.app/api/state', {'x-gc500-token':'Coates-GC500-2026','cache-control':'no-cache'}, 'GET');
  if (response.status !== 200) throw Error('Native read failed');
  return JSON.parse(response.body);
}
let harness, page, before;
const settle = async () => { await page.waitForTimeout(600); await page.evaluate(() => new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)))); };
async function metric(selector) {
  return page.evaluate(selector => {
    const el = document.querySelector(selector), main = document.querySelector('main'), wrap = el.closest('.tblwrap');
    return {mainY:main.scrollTop, tableX:wrap?.scrollLeft || 0, tableMax:wrap?wrap.scrollWidth-wrap.clientWidth:0, rowTop:el.closest('tr')?.getBoundingClientRect().top, targetTop:el.getBoundingClientRect().top,
      folds:document.querySelectorAll('#pane-pricing details.sfold').length, focused:document.activeElement === el,
      foldState:[...document.querySelectorAll('#pane-pricing details.sfold')].map(el=>[el.dataset.sfold,el.open]),
      drawerY:document.querySelector('#drawer').scrollTop, drawerBodyY:document.querySelector('#drawer .db')?.scrollTop || 0};
  }, selector);
}
async function contextAction(name, selector, action, drawer = false, middle = false) {
  const locator = page.locator(selector);
  await locator.evaluate(target=>{const details=[];for(let n=target.parentElement;n;n=n.parentElement)if(n.tagName==='DETAILS')details.unshift(n);for(const d of details)if(!d.open)d.querySelector(':scope > summary')?.click();});
  await settle();
  await locator.scrollIntoViewIfNeeded(); await settle();
  await locator.evaluate((el,middle) => { const wrap = el.closest('.tblwrap'); if (wrap) wrap.scrollLeft = middle?(wrap.scrollWidth-wrap.clientWidth)/2:wrap.scrollWidth; },middle);
  // Keep the control visible before recording context. Browser autofocusing an
  // off-screen input legitimately scrolls its table before onchange runs.
  await locator.scrollIntoViewIfNeeded();
  await settle();
  const pre = await metric(selector);
  await page.screenshot({path:path.join(out, name + '-before.png')});
  const writeStart = await page.evaluate(() => __capturedWrites.length);
  await action(locator); await settle();
  const post = await metric(selector);
  const writes = await page.evaluate(start => __capturedWrites.slice(start), writeStart);
  report.actions.push({name, selector, pre, post, writes}); save();
  await page.screenshot({path:path.join(out, name + '-after.png')});
  // Cell content can shorten a table: an end position must clamp to its new
  // browser maximum. A genuine middle position must remain exactly unchanged.
  check(name + ' keeps horizontal table position within its new bounds', Math.abs(post.tableX - Math.min(pre.tableX,post.tableMax)) <= 1,{before:pre.tableX,after:post.tableX,maxBefore:pre.tableMax,maxAfter:post.tableMax});
  if(middle) check(name+' keeps a genuine middle position exactly',pre.tableX>0&&pre.tableX<post.tableMax&&Math.abs(post.tableX-pre.tableX)<=1);
  if (drawer) {
    check(name + ' keeps drawer scroll', Math.abs(post.drawerY-pre.drawerY)<=1 && Math.abs(post.drawerBodyY-pre.drawerBodyY)<=1);
  } else {
    check(name + ' keeps the visible row anchor', Math.abs(post.rowTop-pre.rowTop)<=1, {before:pre.rowTop,after:post.rowTop});
    check(name + ' keeps folded presentation', post.folds === pre.folds && post.folds > 0);
    check(name + ' keeps each disclosure state',JSON.stringify(post.foldState)===JSON.stringify(pre.foldState));
  }
  check(name + ' captures native writes without sending them', writes.length > 0 && writes.every(w => /^(?:labour|rates|accRates|minDays|eventHours|stamps|by)\//.test(w.key)));
  return {pre,post,writes};
}
async function restoreFixture(tab) {
  await page.evaluate(tab => {
    S=JSON.parse(JSON.stringify(__fixture)); S.operator='Andrew Fisher via Codex';
    SYNC.queue={}; SYNC.inflight={}; RENDER_MEMO.clear(); HELD_MEMO.clear(); go(tab);
  }, tab); await settle();
}
(async () => {
  before = await native(); fs.writeFileSync(path.join(out,'native-before.json'),JSON.stringify(before));
  harness = await open({pageFile,W:mobile?390:1440,H:mobile?844:1000,mobile,dpr:mobile?2:1}); page=harness.page;
  page.on('console', m => { if(m.type()==='error') report.consoleErrors.push(m.text().slice(0,250)); });
  page.on('response', response=>{if(response.status()>=400)report.resourceFailures.push({status:response.status(),url:response.url().split('?')[0]});});
  page.on('requestfailed', request=>report.resourceFailures.push({url:request.url().split('?')[0],failure:request.failure()?.errorText}));
  page.on('dialog', d => d.dismiss());
  await page.waitForFunction(() => typeof SYNC!=='undefined' && SYNC.status==='live' && SYNC.first.size===Object.keys(SYNC_COLLS).length, null, {timeout:180000});
  if (process.env.REFERENCE) {
    const ref=process.env.REFERENCE;
    await page.evaluate(ref => {go('plant');openAsset(ref);},ref); await settle();
    report.supplied = await page.evaluate(ref => {
      const asset=assetOf(ref),html=suppliedBlock(asset),node=document.createElement('div');node.innerHTML=html;
      const line=[...node.querySelectorAll('p')].find(p=>p.textContent.startsWith('Asset numbers:'));
      return {canonical:[...new Set(assetNumbersOf(asset).map(n=>String(n).trim()).filter(Boolean))],line:line?.textContent||'',items:itemRows(asset)};
    },ref);
    check('Supplied numbers match the canonical projection', report.supplied.line === (report.supplied.canonical.length ? 'Asset numbers: '+report.supplied.canonical.join(', ') : ''));
    if(process.env.EXPECTED_NUMBER) check('Current number is displayed',report.supplied.line.includes(process.env.EXPECTED_NUMBER));
    if(process.env.REMOVED_NUMBER) check('Removed number is absent',!report.supplied.line.includes(process.env.REMOVED_NUMBER));
    await page.locator('#dclose').click(); await settle();
  }
  await page.route('**/api/version',r=>r.fulfill({status:200,contentType:'application/json',body:JSON.stringify({version:before.version,level:'edit'})}));
  await page.evaluate(() => {
    window.__fixture=JSON.parse(JSON.stringify(S)); window.__capturedWrites=[];
    SYNC.unsub.forEach(u=>u()); SYNC.unsub=[];clearTimeout(SYNC.timer);clearTimeout(SYNC.retry);SYNC.timer=SYNC.retry=null;SYNC.queue={};SYNC.inflight={};
    SYNC.db.doc=key=>({set:async body=>__capturedWrites.push({key,body:JSON.parse(JSON.stringify(body))}),delete:async()=>__capturedWrites.push({key,body:null})});
    if(SYNC.backend) SYNC.backend.upload=async()=>{throw Error('Regression forbids upload');};
    capability=()=> 'edit';mayWrite=()=>true;SYNC.readonly=false;SYNC.level='edit';S.operator='Andrew Fisher via Codex';document.body.classList.remove('viewonly');
  });
  await page.evaluate(()=>go('pricing'));await settle();
  const descriptor=await page.evaluate(()=>[...document.querySelectorAll('#pane-pricing [data-lab-all][data-on="1"]')].find(el=>el.closest('tr').cells[4].textContent.includes('not ticked'))?.dataset.labAll);
  check('Unticked group available for captured rehearsal',!!descriptor);
  const selector='#pane-pricing [data-lab-all='+JSON.stringify(descriptor)+'][data-on="1"]';
  const tick=await contextAction('pricing-tick',selector,el=>el.click());
  check('Tick button keeps focus',tick.post.focused);
  check('Tick uses native labour keys',tick.writes.some(w=>w.key.startsWith('labour/') && w.body && w.body._k.endsWith('|'+descriptor) && w.body.v===true));
  await restoreFixture('pricing');
  const rateKey=await page.locator('#pane-pricing input[data-rk]').first().getAttribute('data-rk');
  const rateSelector='#pane-pricing input[data-rk='+JSON.stringify(rateKey)+']';
  const rate=await contextAction('pricing-rate',rateSelector,async el=>{await el.fill('1');await el.press('Tab');});
  check('Rate uses its existing native key and value',rate.writes.some(w=>w.key.startsWith('rates/') && w.body?._k===rateKey && w.body.v==='1'));
  for(const [attr,collection] of [['data-ak','accRates'],['data-min','minDays'],['data-scope','rates']]) {
    await restoreFixture('pricing');
    const descriptor=await page.evaluate(attr=>[...document.querySelectorAll('#pane-pricing ['+attr+']')].find(el=>attr!=='data-scope'||el.getAttribute(attr).startsWith('rate|'))?.getAttribute(attr),attr);
    check(attr+' control available',!!descriptor);
    const selector='#pane-pricing ['+attr+'='+JSON.stringify(descriptor)+']';
    const value=(await page.locator(selector).inputValue())==='2'?'3':'2';
    const expectedKey=await page.evaluate(({attr,descriptor})=>attr==='data-scope'?scopeKey('rate',descriptor.split('|')[1]):descriptor,{attr,descriptor});
    const result=await contextAction('pricing-'+attr.slice(5),selector,async el=>{await el.fill(value);await el.press('Tab');});
    check(attr+' retains native key and setter value',result.writes.some(w=>w.key.startsWith(collection+'/')&&w.body?._k===expectedKey&&w.body.v===value));
    check(attr+' applies the intended field',await page.evaluate(({collection,key,value})=>S[collection][key]===value,{collection,key:expectedKey,value}));
  }
  await restoreFixture('pricing');
  const middleKey=await page.locator('#pane-pricing input[data-ak]').first().getAttribute('data-ak');
  await contextAction('pricing-ak-middle','#pane-pricing input[data-ak='+JSON.stringify(middleKey)+']',async el=>{await el.fill('3');await el.press('Tab');},false,true);
  if(process.env.REFERENCE) {
    await restoreFixture('plant');
    await page.evaluate(ref=>openAsset(ref),process.env.REFERENCE);await settle();
    await page.evaluate(()=>{const target=document.querySelector('#drawer input[data-lab]'),details=[];for(let n=target?.parentElement;n;n=n.parentElement)if(n.tagName==='DETAILS')details.unshift(n);for(const d of details)if(!d.open)d.querySelector(':scope > summary')?.click();});await settle();
    const labKey=await page.locator('#drawer input[data-lab]').first().getAttribute('data-lab');
    await contextAction('reference-tick','#drawer input[data-lab='+JSON.stringify(labKey)+']',el=>el.click(),true);
    await page.locator('#dclose').click();await settle();
  }
  report.capturedWrites=await page.evaluate(()=>__capturedWrites);
  check('No browser errors',harness.errors.length===0 && report.consoleErrors.length===0,{page:harness.errors,console:report.consoleErrors});
  check('No outgoing operational write attempts',harness.counts.blocked===0,harness.counts);
})().catch(e=>{report.error=String(e.stack||e);process.exitCode=1;}).finally(async()=>{
  if(harness){report.errors=harness.errors;report.network=harness.counts;await harness.browser.close();}
  try {const after=await native();fs.writeFileSync(path.join(out,'native-after.json'),JSON.stringify(after));report.nativeUnchanged=JSON.stringify(before)===JSON.stringify(after);report.checks.push({name:'Native record unchanged',pass:report.nativeUnchanged});if(!report.nativeUnchanged)process.exitCode=1;}catch(e){report.readbackError=String(e);process.exitCode=1;}
  save(); console.log(JSON.stringify({source:report.source,mobile,passed:report.checks.filter(c=>c.pass).length,total:report.checks.length,error:report.error,nativeUnchanged:report.nativeUnchanged}));
});
