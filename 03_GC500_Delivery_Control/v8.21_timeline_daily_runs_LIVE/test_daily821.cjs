/* Author: Andrew Fisher. Real page, read-only record. Card/SMS operations are intercepted local fixtures only. */
const fs=require('fs'),path=require('path'),assert=require('assert');
const {open}=require('../toolchain/harness/open_page');
const out=process.env.EVIDENCE||'/workspace/private-v821-browser';fs.mkdirSync(out,{recursive:true});
(async()=>{const checks=[],pageFile=process.env.PAGE||path.resolve(__dirname,'../build/GC500_v8.21/GC500_Delivery_Control_hosted.html');const h=await open({pageFile,hash:'#timeline',W:1440,H:1100});let cards=[],sms=[],statusGets=0,mode='success';const check=(name,ok)=>{assert(ok,name);checks.push(name);};try{
 const p=h.page;await p.waitForFunction(()=>SYNC.status==='live'&&SYNC.first.size===Object.keys(SYNC_COLLS).length);
 await p.evaluate(()=>{state.tlDate='2026-10-07';state.day='2026-10-07';state.tlDay='2026-10-07';state.tlView='day';renderTimeline();});
 const date=await p.locator('[data-daily821-toggle]').first().getAttribute('data-daily821-toggle');
 // Select via the native date action, not an invented selector state.
 await p.evaluate(()=>{state.day='2026-10-07';state.tlDay='2026-10-07';if(typeof tlSelectDay==='function')tlSelectDay('2026-10-07');});
 await p.evaluate(()=>{DAILY821.open='2026-10-07';document.querySelector('#pane-timeline').innerHTML=dayBlock(calendarDays().find(d=>d.iso==='2026-10-07'),true);});
 const iso='2026-10-07',sel='[data-daily821-recipient="'+iso+'"]';
 const contacts=await p.evaluate(()=>daily821Contacts());check('Only native installer contacts, unique valid mobiles',contacts.length===4&&contacts.every(x=>/^\+614\d{8}$/.test(x.to)));
 await p.selectOption(sel,contacts[0].id);
 check('View link cannot send',await p.locator('[data-daily821-send]').isDisabled());
 // Everything below exercises the real frontend against mocked writes and mocked permission answers.
 const version=await p.evaluate(()=>SYNC.backend.readVersion821());let mockVersion=version;
 await p.route('**/api/version',route=>route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({version:mockVersion,level:'edit'})}));
 await p.route('**/api/cards',async route=>{assert.equal(route.request().method(),'POST');const body=route.request().postDataJSON();cards.push(body);await route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({token:'fixture-only',url:'/d/fixture-only'})});});
 await p.route('**/api/sms',async route=>{if(route.request().method()==='GET'){await route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({configured:mode!=='disabled',today:{left:mode==='quota'?0:500,cap:500}})});return;}const body=route.request().postDataJSON();sms.push(body);if(mode==='timeout'){await route.abort('timedout');return;}if(mode==='rejected'){await route.fulfill({status:429,contentType:'application/json',body:JSON.stringify({error:'test quota refusal'})});return;}await route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({messages:mode==='missing'?[]:[{to:body.to[0],status:'SUCCESS',message_id:'fixture-1'}]})});});
 await p.route('**/api/sms/status?*',async route=>{statusGets++;assert.equal(route.request().method(),'GET');await route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({messages:[{message_id:'fixture-1',delivery_status:'delivered'}]})});});
 await p.evaluate(()=>{window.capability=()=> 'edit';window.mayWrite=()=>true;SYNC.readonly=false;SYNC.level='edit';S.operator='Fixture operator';});
 const prepare=async()=>{await p.evaluate(async iso=>{await daily821Prepare(daily821Session(iso));},iso);for(const pp of h.browser.contexts()[0].pages())if(pp!==p)await pp.close();};
 const state=()=>p.evaluate(iso=>{const s=daily821Session(iso);return {busy:s.busy,locked:s.locked,ready:!!s.prepared,configured:s.prepared&&s.prepared.configured,message:s.message,rows:s.rows};},iso);
 await prepare();check('Preview is local and does not publish a card or SMS',cards.length===0&&sms.length===0);check('Fresh preview enables send',(await state()).configured&&!await p.locator('[data-daily821-send]').isDisabled());
 const info=await p.evaluate(iso=>{const m=daily821Model(iso),d=programmeDays().find(d=>d.iso===iso);return{refs:m.loads.flatMap(l=>l.rows.map(r=>r.key)),count:m.loads.length,native:dpLoads({...d,removals:[]}).filter(g=>g.kind==='deliveries').length,html:daily821Session(iso).prepared.html};},iso);
 check('Native load counts preserved',info.count===info.native&&info.count>0);check('Cancelled and unrelated dates absent',!info.refs.includes('WC32')&&!info.refs.includes('P08'));check('No full app, directory or finance in standalone HTML',!info.html.includes('/v/Coates')&&!info.html.includes('/e/')&&!info.html.includes('const DATA')&&!/\b(?:Revenue|Direct costs|payroll)\b/.test(info.html)&&!info.html.includes(contacts[0].to));
 check('Shared truck and split loads retained',info.refs.filter(x=>x==='WC20').length===4&&info.count<info.refs.length);
 fs.writeFileSync(path.join(out,'installer-day-fixture.html'),info.html);
 await p.evaluate(async iso=>{const s=daily821Session(iso);await Promise.all([daily821Send(s),daily821Send(s)]);},iso);
 check('Double click produces exactly one card and one SMS',cards.length===1&&sms.length===1);
 check('Recipient and dated card bound exactly',sms[0].to.length===1&&sms[0].to[0]===contacts[0].to&&cards[0].run_date===iso&&cards[0].expires==='2026-10-08');
 check('New frozen token, no load record mutation',!('token'in cards[0])&&cards[0].load==='installer-day:'+iso);
 check('Acceptance is pending, not delivered',(await state()).locked&&(await state()).rows[0].delivery_status==='pending'&&/Delivery is not confirmed/.test((await state()).message));
 await p.evaluate(async iso=>await daily821Status(daily821Session(iso)),iso);check('Read-only status refresh confirms delivery without another send',statusGets===1&&sms.length===1&&(await state()).rows[0].delivery_status==='delivered');
 const reset=()=>p.evaluate(iso=>{const s=daily821Session(iso);s.locked=false;s.rows=[];s.prepared=null;daily821Save(s);daily821Refresh(s);},iso);
 await reset();await prepare();mockVersion=version+1;await p.evaluate(async iso=>await daily821Send(daily821Session(iso)),iso);check('Changed server revision blocks both card and SMS',cards.length===1&&sms.length===1&&/changed/.test((await state()).message));mockVersion=version;
 await reset();mode='disabled';await prepare();check('Unavailable provider disables sending',!(await state()).configured&&await p.locator('[data-daily821-send]').isDisabled());
 mode='quota';await prepare();check('Exhausted allowance disables sending',!(await state()).configured&&sms.length===1);
 mode='success';await reset();await prepare();await p.evaluate(iso=>{daily821Session(iso).prepared.at-=121000;},iso);await p.evaluate(async iso=>await daily821Send(daily821Session(iso)),iso);check('Old preview blocks publish and send',cards.length===1&&sms.length===1&&/two minutes/.test((await state()).message));
 await reset();await prepare();mode='timeout';await p.evaluate(async iso=>await daily821Send(daily821Session(iso)),iso);check('Uncertain send locks retry',(await state()).locked&&(await state()).rows[0].delivery_status==='unknown');await p.evaluate(async iso=>await daily821Send(daily821Session(iso)),iso);check('Locked unknown cannot repeat POST',sms.length===2);
 await p.evaluate(iso=>{DAILY821.days.delete(iso);daily821Session(iso);},iso);check('Unknown lock survives session restoration',(await state()).locked);
 await reset();mode='success';await prepare();mode='rejected';await p.evaluate(async iso=>await daily821Send(daily821Session(iso)),iso);check('Definite rejection is failed and never called delivered',!(await state()).locked&&(await state()).rows[0].rejected&&(await state()).rows[0].delivery_status==='failed');
 await reset();mode='success';await prepare();mode='missing';await p.evaluate(async iso=>await daily821Send(daily821Session(iso)),iso);check('Missing recipient result remains unknown and locked',(await state()).locked&&(await state()).rows[0].delivery_status==='unknown');
 await reset();mode='success';await prepare();await p.evaluate(iso=>{daily821Session(iso).recipient=daily821Contacts()[1].id;},iso);const pre={cards:cards.length,sms:sms.length};await p.evaluate(async iso=>await daily821Send(daily821Session(iso)),iso);check('Recipient change invalidates prepared send',cards.length===pre.cards&&sms.length===pre.sms);
 await p.evaluate(iso=>{daily821Session(iso).recipient=daily821Contacts()[0].id;daily821Refresh(daily821Session(iso));},iso);
 await reset();mode='success';const beforeOne=sms.length;await p.evaluate(async iso=>await daily821Send(daily821Session(iso)),iso);check('Explicit Text works without a Preview click',sms.length===beforeOne+1&&(await state()).locked);
 for(const width of [1440,390,320]){await p.setViewportSize({width,height:1000});await p.waitForTimeout(150);const size=await p.evaluate(()=>{const x=document.querySelector('#pane-timeline');return {scroll:document.documentElement.scrollWidth,width:innerWidth,panel:x.querySelector('.daily821-panel').getBoundingClientRect().width};});check('No document overflow at '+width,size.scroll<=width+1);await p.locator('.daily821-panel').screenshot({path:path.join(out,'daily-panel-'+width+'.png')});}
 check('No page errors',h.errors.length===0);check('No unmocked writes escaped',h.counts.blocked===0);
 fs.writeFileSync(path.join(out,'browser-report.json'),JSON.stringify({author:'Andrew Fisher',checks,passed:checks.length,errors:h.errors,counts:h.counts,mockPosts:{cards:cards.length,sms:sms.length},statusGets},null,2));console.log(JSON.stringify({passed:checks.length,errors:h.errors,counts:h.counts,mockPosts:{cards:cards.length,sms:sms.length}}));
 }finally{await h.browser.close();}})().catch(e=>{console.error(e.stack);process.exitCode=1;});
