// Author: Andrew Fisher. Native daily-message preview on laptop and phone; live reads only.
const fs=require('fs'),path=require('path'),assert=require('node:assert/strict');
const R=path.resolve(__dirname,'..'),O=process.env.OUT;if(!O)throw Error('Set private OUT');fs.mkdirSync(O,{recursive:true});
const {open}=require(R+'/toolchain/harness/open_page.js');
const {installWriteGuard,ready840,nativeSnapshot}=require(R+'/v8.40_today_work_progress_LIVE/test_today840.cjs');
const guard=installWriteGuard(),report={author:'Andrew Fisher',scope:process.env.PAGE?'Candidate':'Actual public HTML',views:[]};
(async()=>{let s;try{for(const W of [1366,390]){
 s=await open({pageFile:process.env.PAGE,hash:'#today',W,H:900,mobile:W===390,dpr:W===390?2:1});const p=s.page;await ready840(p);await p.waitForFunction(()=>typeof daily861Message==='function');const before=await nativeSnapshot(p);
 const iso=await p.evaluate(()=>{go('timeline');const d=programmeDays().find(d=>d.iso>=todayIso()&&(d.deliveries||[]).length);if(!d)throw Error('No scheduled day available for preview');state.day=d.iso;state.tlView='day';renderTimeline();return d.iso;});
 await p.locator('.dplate [data-daily821-toggle="'+iso+'"]').click();const panel=p.locator('[data-daily821-panel="'+iso+'"]');assert(await panel.isVisible());
 await p.locator('[data-daily821-recipient="'+iso+'"]').selectOption({index:1});assert(await panel.locator('.daily861-preview').isVisible());
 const waitPopup=p.waitForEvent('popup');await p.locator('[data-daily821-preview="'+iso+'"]').click();const popup=await waitPopup;await popup.waitForFunction(()=>document.title.includes('Daily deliveries'),null,{timeout:25000});await p.waitForFunction(iso=>daily821Session(iso).prepared&&!daily821Session(iso).busy,iso);
 const model=await p.evaluate(iso=>{const s=daily821Session(iso),team=daily821Contacts().find(x=>x.id===s.recipient);return{message:daily861Message(iso,team,'[Daily run link]',s.prepared.weather861),weather:s.prepared.weather861,date:fmtDate(iso),first:team.name.split(/\s+/)[0],refs:s.prepared.model.loads.flatMap(l=>l.rows.map(r=>r.key))};},iso);
 const text=await panel.locator('.daily861-preview pre').textContent();assert.equal(text,model.message);assert(text.startsWith('Good morning, '+model.first+'.'));assert(text.includes(model.date));assert(text.includes(model.weather.text));assert(text.includes('Take 5'));assert(text.endsWith('[Daily run link]'));assert(text.length<=480);
 assert(await p.locator('[data-daily821-send="'+iso+'"]').isDisabled(),'View link cannot send');assert((await popup.locator('h1').textContent()).includes(model.date));
 const dayText=await popup.locator('body').innerText();for(const ref of model.refs)assert(dayText.includes(ref));
 await p.evaluate(()=>renderTimeline());assert(await panel.isVisible());assert.equal(await panel.locator('.daily861-preview pre').textContent(),text);
 assert(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));await panel.scrollIntoViewIfNeeded();await panel.screenshot({path:O+'/personal-message-'+W+'.png'});
 await p.locator('[data-daily821-close="'+iso+'"]').click();assert(!await panel.isVisible());await popup.close();
 const after=await nativeSnapshot(p);assert.deepEqual(after.collections,before.collections);assert.equal(s.errors.length,0,s.errors.join('\n'));
 report.views.push({width:W,personalGreeting:true,selectedDate:true,forecastPinned:true,take5:true,linkLast:true,viewCannotSend:true,dayPageReferencesMatch:true,redrawPreservesPreview:true,recordsPreserved:true});
 await s.browser.close();s=null;
 }assert(!guard.nonGetSeen.some(x=>x.operational),'No operational writes');const intentional=guard.consoleErrors.filter(x=>x.url==='https://tile.googleapis.com/v1/createSession'&&/ERR_BLOCKED_BY_CLIENT/.test(x.text));assert.equal(guard.consoleErrors.length,intentional.length,'No unexpected console errors');report.operationalWrites=0;report.unexpectedConsoleErrors=0;report.intentionalMapBlocks=intentional.length;fs.writeFileSync(O+'/native-ui861.json',JSON.stringify(report,null,2));console.log(JSON.stringify(report));
 }finally{if(s)await s.browser.close();await guard.closeAll();}})().catch(e=>{console.error(e.stack);process.exitCode=1;});
