// Author: Andrew Fisher. Integrated Today checks against the live record through the read-only harness.
// PAGE overrides the candidate. Evidence contains checks/hashes only; screenshots stay in private OUT.
const fs = require('fs'), path = require('path'), crypto = require('crypto'), assert = require('assert/strict');
const {open} = require('../toolchain/harness/open_page');
const candidate = process.env.PAGE || path.join(__dirname, '../build/GC500_v8.20/GC500_Delivery_Control_hosted.html');
const outDir = process.env.OUT || '/tmp/gc500-today820';
fs.mkdirSync(outDir, {recursive: true});
const mobile = process.env.MOB === '1';
const report = {author:'Andrew Fisher', scope:'Integrated native Today; read-only service harness', mobile, candidate_sha256:crypto.createHash('sha256').update(fs.readFileSync(candidate)).digest('hex'), checks:[], errors:[], limits:['Software Chromium checks do not establish physical-device frame rates.', 'Document-hidden and print lifecycle events are simulated.']};
(async () => {
  const s = await open({pageFile:candidate, hash:'#today', W:mobile?390:1440, H:mobile?844:1100, mobile, dpr:mobile?2:1});
  const p = s.page;
  const button = key => p.locator('[data-today-card="'+key+'"] .today-motion-button');
  const state = () => p.evaluate(() => TodayMotion820.report());
  const none = async () => { await p.waitForFunction(() => TodayMotion820.report().running === null && TodayMotion820.report().animations === 0); assert.equal((await state()).guardActive, false); };
  const play = async key => { await button(key).click(); await p.waitForFunction(k => TodayMotion820.report().running === k, key); };
  const check = async (name, fn) => { try { await fn(); report.checks.push({name,pass:true}); } catch (e) { report.checks.push({name,pass:false,error:e.message.slice(0,350)}); } };
  const reset = async () => {
    await p.emulateMedia({reducedMotion:'no-preference'});
    await p.evaluate(() => { document.documentElement.dataset.motion='subtle'; go('today'); TodayMotion820.destroy(); });
    await p.addScriptTag({content:fs.readFileSync(path.join(__dirname,'today820_src.js'),'utf8')});
    await p.locator('#pane-today .inst').scrollIntoViewIfNeeded();
  };
  try {
    await p.waitForFunction(() => typeof SYNC !== 'undefined' && SYNC.status === 'live' && SYNC.first.size === Object.keys(SYNC_COLLS).length, null, {timeout:150000});
    await p.evaluate(() => renderToday());
    await p.waitForFunction(() => window.TodayMotion820?.report().cards === 3);
    await check('No initial selection, automatic animation or preference timer', async () => { const r=await state(); assert.equal(r.selected,null); await none(); assert.equal(await p.locator('.today-motion-button').count(),3); });
    await check('Native status tallies and delivery geometry remain accurate', async () => {
      assert(await p.evaluate(() => { const t=lightTally(allAssets()); return Number(document.querySelector('#pane-today [data-lf-go="red"] b').textContent)===t.red && Number(document.querySelector('#pane-today [data-lf-go="green"] b').textContent)===t.green; }));
      const before=await p.locator('#pane-today .cgauge.gi').evaluate(x=>({angle:x.style.getPropertyValue('--gi-to'),text:x.textContent,transform:getComputedStyle(x.querySelector('.gineedle')).transform}));
      await play('delivery'); await p.waitForTimeout(1700);
      const after=await p.locator('#pane-today .cgauge.gi').evaluate(x=>({angle:x.style.getPropertyValue('--gi-to'),text:x.textContent,transform:getComputedStyle(x.querySelector('.gineedle')).transform}));
      assert.deepEqual(after,before);
    });
    await check('Only selected card animates; explicit pause stops guard and effects', async () => {
      for (const key of ['lights','delivery','programme']) { await play(key); const owners=await p.evaluate(()=>[...new Set(document.querySelector('#pane-today .inst').getAnimations({subtree:true}).filter(x=>x.playState==='running').map(x=>x.effect.target.closest('[data-today-card]')?.dataset.todayCard||'outside'))]); assert.deepEqual(owners,[key]); assert.equal(await p.locator('.today-motion-button[aria-pressed="true"]').count(),1); }
      await button('programme').click(); await none();
    });
    await check('Reduced motion switches off active effects and does not resume automatically', async () => { await play('delivery'); await p.emulateMedia({reducedMotion:'reduce'}); await none(); assert.equal(await p.locator('.today-motion-button:disabled').count(),3); await p.emulateMedia({reducedMotion:'no-preference'}); await none(); });
    await check('Global Motion Off stops active effects without changing selection facts', async () => { await play('lights'); await p.evaluate(()=>document.documentElement.dataset.motion='off'); await none(); assert.equal(await p.locator('.today-motion-button:disabled').count(),3); await p.evaluate(()=>document.documentElement.dataset.motion='subtle'); await none(); });
    await check('A real Today rerender retains selection, cancels detached effects and never replays readings', async () => {
      await play('delivery'); await p.waitForTimeout(1700);
      // renderToday rebuilds earlier sections too. Keep the selected card onscreen within
      // the same task so this check exercises refresh continuity, not an offscreen stop.
      await p.evaluate(()=>{window.__today820Old=document.querySelector('[data-today-card="delivery"]').getAnimations({subtree:true});renderToday();document.querySelector('#pane-today .inst .dialcard').scrollIntoView({block:'center'});});
      await p.waitForTimeout(150); assert.equal((await state()).selected,'delivery'); assert.equal(await p.locator('.today-motion-button').count(),3);
      assert(await p.evaluate(()=>window.__today820Old.every(x=>x.playState==='idle')));
      assert(await p.evaluate(()=>document.querySelector('[data-today-card="delivery"]').getAnimations({subtree:true}).every(x=>!x.effect.target.matches('.gineedle,.gifill,.dled i'))));
    });
    await check('Visible card replacement retains active ambient motion without replaying the reading', async () => {
      if((await state()).running==='delivery')await button('delivery').click();
      await play('delivery');await p.waitForTimeout(1700);
      await p.evaluate(()=>{const x=document.querySelector('[data-today-card="delivery"]');window.__today820Old=x.getAnimations({subtree:true});x.replaceWith(x.cloneNode(true));});
      await p.waitForTimeout(150);assert.equal((await state()).running,'delivery');assert(await p.evaluate(()=>window.__today820Old.every(x=>x.playState==='idle')));
      assert(await p.evaluate(()=>document.querySelector('[data-today-card="delivery"]').getAnimations({subtree:true}).every(x=>!x.effect.target.matches('.gineedle,.gifill,.dled i'))));
    });
    await check('Native red-status filter still opens Equipment; returning stays paused', async () => { await p.locator('#pane-today .lights [data-lf-go="red"]').click(); await p.waitForFunction(()=>state.light==='red'&&state.tab!=='today'); await none(); await p.evaluate(()=>go('today')); await none(); assert.equal(await p.locator('.today-motion-button').count(),3); });
    await check(mobile?'Native phone programme link still opens embedded Where we are':'Native programme day action opens the correct Timeline day', async () => {
      await play('programme');
      if(mobile) {
        // The native rail deliberately omits small week hit areas on coarse/phone pointers.
        assert.equal(await p.locator('#pane-today .racecard [data-week-day]').count(),0);
        await p.locator('#pane-today .racecard [data-go="progress"]').click();
        await p.waitForFunction(()=>state.tab==='today'&&document.querySelector('#pane-today #pane-progress.wwa793'));
      } else {
        await p.evaluate(()=>{const x=document.querySelector('#pane-today .racecard [data-week-day]');window.__today820Week=x.dataset.weekDay;x.click();});
        await p.waitForFunction(()=>state.tab==='timeline'&&state.day===window.__today820Week);
      }
      await none();await p.evaluate(()=>go('today'));
    });
    await check('Keyboard Enter and Space play/pause the native control', async () => { await button('lights').scrollIntoViewIfNeeded(); await button('lights').focus(); await p.keyboard.press('Enter'); assert.equal((await state()).running,'lights'); await p.keyboard.press('Space'); await none(); });
    await check('Print and document hidden events stop active motion without replay', async () => { await play('delivery'); await p.evaluate(()=>window.dispatchEvent(new Event('beforeprint'))); await none(); await p.evaluate(()=>window.dispatchEvent(new Event('afterprint'))); await none(); await play('lights'); await p.evaluate(()=>{Object.defineProperty(document,'hidden',{configurable:true,value:true});document.dispatchEvent(new Event('visibilitychange'));}); await none(); await p.evaluate(()=>{delete document.hidden;document.dispatchEvent(new Event('visibilitychange'));}); await none(); });
    await check('Offscreen card stops and does not restart when scrolled back', async () => { await play('lights'); await p.evaluate(()=>{const main=document.querySelector('main');main.scrollTop=main.scrollHeight;}); await none(); await button('lights').scrollIntoViewIfNeeded(); await none(); });
    await check('Main scroll clipping behind the fixed header stops selected motion', async () => { await play('lights'); await p.evaluate(()=>{const main=document.querySelector('main'),card=document.querySelector('[data-today-card="lights"]');main.scrollTop+=card.getBoundingClientRect().bottom-main.getBoundingClientRect().top+2;}); await p.waitForFunction(()=>TodayMotion820.report().running===null,null,{timeout:1200}); await none(); });
    await check('320, 390 and 1440 pixel Today cards and buttons remain contained', async () => {
      for(const width of [320,390,1440]) { await p.setViewportSize({width,height:1000}); await p.waitForTimeout(100); const measures=await p.locator('[data-today-card]').evaluateAll(xs=>xs.map(x=>{const b=x.getBoundingClientRect(),p=x.querySelector('.today-motion-button').getBoundingClientRect();return {key:x.dataset.todayCard,left:b.left,right:b.right,overflow:x.scrollWidth-x.clientWidth,buttonLeft:p.left,buttonRight:p.right};})); for(const m of measures) {assert(m.left>=-1&&m.right<=width+1,JSON.stringify(m));assert(m.overflow<=1,JSON.stringify(m));assert(m.buttonLeft>=m.left&&m.buttonRight<=m.right,JSON.stringify(m));} }
    });
    await check('Repeated controller installation does not duplicate controls or listeners', async () => { await reset(); assert.equal(await p.locator('.today-motion-button').count(),3); assert.equal(await p.locator('#today-motion-static-guard').count(),1); await play('lights'); await button('lights').click(); await none(); });
    await p.setViewportSize({width:mobile?390:1440,height:mobile?844:1100});
    await p.evaluate(()=>go('today')); await p.locator('#pane-today .inst').scrollIntoViewIfNeeded();
    if(mobile) {
      for(const key of ['lights','delivery','programme']) {
        await p.evaluate(key=>{const main=document.querySelector('main'),card=document.querySelector('[data-today-card="'+key+'"]');main.scrollTop+=card.getBoundingClientRect().top-main.getBoundingClientRect().top;},key);
        await p.waitForTimeout(100);await p.screenshot({path:path.join(outDir,'today-phone-'+key+'.png')});
        if(key==='delivery') {await p.evaluate(()=>document.querySelector('main').scrollBy(0,450));await p.screenshot({path:path.join(outDir,'today-phone-delivery-lower.png')});}
      }
    } else await p.locator('#pane-today .inst').screenshot({path:path.join(outDir,'today-desktop.png')});
    await check('No page errors or attempted operational writes', async () => { assert.deepEqual(s.errors,[]); assert.equal(s.counts.blocked,0); });
    report.errors=s.errors; report.requests=s.counts; report.passed=report.checks.every(c=>c.pass);
  } finally { await s.browser.close(); fs.writeFileSync(path.join(outDir,mobile?'today820-phone.json':'today820-desktop.json'),JSON.stringify(report,null,2)); console.log(JSON.stringify({mobile,candidate:report.candidate_sha256,checks:report.checks,errors:report.errors,requests:report.requests,passed:report.passed})); }
  if(!report.passed)process.exitCode=1;
})().catch(e=>{console.error(e.stack);process.exitCode=1;});
