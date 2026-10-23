/* Author: Andrew Fisher. Native GET-only Servicing review and operational-day regression. No crew routes or record writes. */
'use strict';
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),cp=require('node:child_process'),vm=require('node:vm');
const {chromium}=require('playwright');
const HOST='https://gc500-production.up.railway.app',EDIT=process.env.GC500_EDIT_TOKEN||'';
const BRIDGE=path.join(__dirname,'read_get.py');
const checks=[],requests=[]; let token='',browser,stage='prepare',writes=0;
const sha=b=>crypto.createHash('sha256').update(b).digest('hex');
function guard(ok,code){if(!ok)throw Object.assign(new Error(code),{safeCode:code});checks.push(code);}
function save(name,value){const bytes=Buffer.isBuffer(value)?value:Buffer.from(JSON.stringify(value,null,2));guard(!EDIT||!bytes.includes(EDIT),'no_edit_key_in_artifact');fs.writeFileSync(path.join(OUT,name),bytes,{mode:0o600});}
const OUT=process.env.OUT;guard(OUT&&path.isAbsolute(OUT),'private_evidence_folder_required');fs.mkdirSync(OUT,{recursive:true,mode:0o700});
const PAGE=process.env.PAGE,MOB=process.env.MOB==='1';
function bridge(url,headers={}){
 return new Promise((resolve,reject)=>{
  const env={...process.env};delete env.GC500_NATIVE_TRACKER_EXECUTE;
  const child=cp.spawn('python3',[BRIDGE],{stdio:['pipe','pipe','pipe'],env});let out='',size=0;
  child.stdout.on('data',b=>{size+=b.length;if(size>48e6)child.kill();else out+=b;});child.stderr.resume();
  child.on('error',()=>reject(Object.assign(new Error(),{safeCode:'read_bridge_spawn_failed'})));
  child.on('close',code=>{try{const r=JSON.parse(out);if(code||!r.ok)throw Error();resolve({status:r.status,headers:r.headers,body:Buffer.from(r.body,'base64')});}catch(e){reject(Object.assign(new Error(),{safeCode:'read_bridge_failed'}));}});
  child.stdin.end(JSON.stringify({url,headers,method:'GET',tracker:token,permitCardsWrite:false}));
 });
}
async function get(route,auth=true){const r=await bridge(HOST+route,auth?{'x-gc500-token':EDIT}:{});guard(r.status===200,'get_http_200');requests.push({method:'GET',route:route.split('?')[0],status:r.status});return r.body;}
async function json(route){return JSON.parse(await get(route));}

function inspectProgress(){
 const M=window.__svcReviewModel, m=window.__svcReviewMap, S=SvcState, D=M.D;
 const st=S.jobStates(M.events,M.now), cfg={plans:D.plans,days:D.days,extras:D.extras};
 const refs=D.areas.flatMap(a=>a.refs), total=S.groupStats(cfg,refs,M.day,st);
 const failures=[];
 const same=(a,b)=>JSON.stringify(a)===JSON.stringify(b);
 if(!same(total,m.overall))failures.push('overall_model');
 for(const a of D.areas){
  const expected=S.groupStats(cfg,a.refs,M.day,st), found=m.areas.find(x=>x.id===String(a.n));
  const tile=document.querySelector('[data-svc1099-area="'+a.n+'"]');
  if(!found||!same(found.stats,expected)||!tile||Number(tile.dataset.pct)!==expected.pct)failures.push('area');
 }
 for(const e of document.querySelectorAll('#svc1067 .svc1102-meter')){
  const key=e.getAttribute('data-svc1102-key'), a=key.match(/(?:panel|map)-area-(.+)/);
  const chosen=a?D.areas.find(x=>String(x.n)===a[1]):null;
  const expected=S.groupStats(cfg,chosen?chosen.refs:refs,M.day,st);
  if(Number(e.dataset.pct)!==expected.pct||Number(e.dataset.d)!==expected.d||Number(e.dataset.w)!==expected.w)failures.push('meter');
 }
 const jobs={pump:{d:0,w:0},clean:{d:0,w:0},refill:{d:0,w:0}};
 for(const r of refs)for(const l of r.lines)for(const task of S.tasksFor(cfg,l,M.day))if(jobs[task]){jobs[task].w+=l.qty;if(st[S.jobKey(l.id,task,M.day)])jobs[task].d+=l.qty;}
 const shown=[...document.querySelectorAll('#svc1067 .svc1123-jobs')][0];
 if(shown)for(const task of Object.keys(jobs)){
  const el=shown.querySelector('.svc1123-job.'+task), j=jobs[task];
  if(j.w&&(!el||el.querySelector('.pct').textContent!==S.pct(j.d,j.w)+'%'))failures.push('job_percentage');
 }
 return {ok:!failures.length,failures,day:M.day,lastRead:M.lastRead,draws:window.__svcReviewDraws,
  active:[...document.querySelectorAll('[data-svc1102-key="panel-days"] [data-svc-day]')].map(e=>e.dataset.svcDay),
  past:[...document.querySelectorAll('[data-svc-history] [data-svc-day]')].map(e=>e.dataset.svcDay),
  historyOpen:!!document.querySelector('[data-svc-history]')?.open,
  cur:S.svcDay(M.now),mapDay:document.querySelector('.svc1099')?.getAttribute('data-svc1099-day')};
}

(async()=>{
 process.umask(0o077);guard(EDIT.length>0,'native_read_access_available');
 const bytes=PAGE?fs.readFileSync(PAGE):await get('/v/Coates-GC500-2026',false);
 guard(bytes.includes("+' · v11.60';"),'expected_release');
 if(PAGE){
  const base=fs.readFileSync(path.join(path.dirname(PAGE),'base_live.html')).toString();
  const next=bytes.toString();
  for(const name of ['SVC1067_CARD','SVC1067_DATA']){
   const line=t=>t.split('\n').find(l=>l.startsWith('var '+name+'='));
   guard(line(base)===line(next),name.toLowerCase()+'_unchanged');
  }
 }
 const listing=await json('/api/ticks');
 const tracker=listing.trackers.find(t=>t.load==='servicing-tracker:GC500-2026'&&!t.expired&&!t.card_withdrawn);
 guard(!!tracker,'event_tracker_available');token=tracker.token;
 const before=await json('/api/ticks?'+new URLSearchParams({token,links:'1',since:'0'}));
 save('tracker_before_private.json',before);
 let overrideClock=null,reads=0,held=false;const errors=[];
 const env=Object.fromEntries(Object.entries(process.env).filter(([k])=>!/TOKEN|SECRET|PASSWORD|KEY/i.test(k)));
 browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH,headless:true,args:['--no-sandbox'],env});
 const context=await browser.newContext({viewport:MOB?{width:390,height:844}:{width:1440,height:1000},isMobile:MOB,hasTouch:MOB,locale:'en-AU',timezoneId:'Australia/Brisbane',serviceWorkers:'block'});
 let page;
 await context.route('**/*',async route=>{
  const request=route.request(),u=new URL(request.url());
  if(request.method()!=='GET'){writes++;return route.abort();}
  if(u.origin!==HOST)return route.abort();
  if(u.pathname==='/e/'+EDIT&&!u.search)return route.fulfill({status:200,contentType:'text/html',body:bytes});
  if(!['/api/state','/api/version','/api/cards','/api/ticks'].includes(u.pathname)&&!u.pathname.startsWith('/m/'))return route.abort();
  if(u.pathname==='/api/state'&&!held){
   await page.evaluate(()=>{if(SYNC.first.size)throw Error('late_sender_hold');syncSend=function(){clearTimeout(SYNC.timer);SYNC.timer=null;syncStage();};});held=true;
  }
  try{
   const response=await bridge(request.url(),request.headers());
   if(u.pathname==='/api/ticks'&&u.searchParams.get('token')===token){reads++;if(overrideClock){const j=JSON.parse(response.body);j.now=overrideClock;response.body=Buffer.from(JSON.stringify(j));}}
   return route.fulfill(response);
  }catch(e){errors.push('read_bridge');return route.abort();}
 });
 page=await context.newPage();page.on('pageerror',()=>errors.push('page_error'));
 stage='native_load';await page.goto(HOST+'/e/'+EDIT+'#servicing',{waitUntil:'domcontentloaded',timeout:90000});
 await page.waitForFunction(()=>typeof SYNC==='object'&&SYNC.status==='live'&&SYNC.level==='edit'&&SYNC.first.size===Object.keys(SYNC_COLLS).length,null,{timeout:90000});
 await page.evaluate(()=>{const original=SvcMap1099.update;SvcMap1099.update=function(host,M){window.__svcReviewModel=M;window.__svcReviewMap=original(host,M);window.__svcReviewDraws=(window.__svcReviewDraws||0)+1;return window.__svcReviewMap;};renderServicing1084();});
 await page.waitForFunction(()=>!!window.__svcReviewModel,null,{timeout:60000});
 guard(held,'sender_held_before_hydration');
 let current=await page.evaluate(inspectProgress);save('initial_sanitized.json',current);
 guard(current.ok,'native_percentages_agree_with_saved_tick_model');
 guard(current.active.every(d=>d>=current.cur)&&current.past.every(d=>d<current.cur),'past_nights_only_in_history');
 guard(!current.historyOpen&&current.day===current.cur,'current_operational_night_selected');
  guard(await page.evaluate(()=>{const a=document.querySelector('[data-svc1102-key="panel-days"]').getBoundingClientRect(),b=document.querySelector('[data-svc-history]').getBoundingClientRect();return b.top>=a.bottom-1;}),'history_follows_operational_selector_on_screen');
 await page.locator('[data-svc1102-key="panel-days"]').scrollIntoViewIfNeeded();
 await page.screenshot({path:path.join(OUT,'operational_'+(MOB?'phone':'desktop')+'.png')});
 stage='history_and_refresh';
 const history=page.locator('[data-svc-history]');
 await history.locator('summary').click();
 const old=current.past.at(-1);await history.locator('[data-svc-day="'+old+'"]').click();
 current=await page.evaluate(inspectProgress);guard(current.day===old&&current.mapDay===old&&current.ok,'history_reads_its_own_saved_percentages');
 await page.evaluate(()=>{window.__reviewStableNodes=[document.querySelector('.svc1099'),document.querySelector('.svc1099-world'),document.querySelector('[data-svc1102-key="panel-overall"]')];});
 const oldRead=current.lastRead;await page.locator('[data-map-refresh]').click();
 await page.waitForFunction(n=>window.__svcReviewModel.lastRead>n,oldRead,{timeout:45000});
 current=await page.evaluate(inspectProgress);
 guard(current.historyOpen&&current.day===old&&current.ok,'refresh_preserves_history_selection_and_percentages');
 guard(await page.evaluate(()=>window.__reviewStableNodes.every(n=>n&&n.isConnected)),'refresh_keeps_map_and_meter_nodes');
 await history.locator('summary').click();
 await page.waitForFunction(()=>window.__svcReviewModel.day===SvcState.svcDay(window.__svcReviewModel.now));
 current=await page.evaluate(inspectProgress);guard(!current.historyOpen&&current.ok,'closing_history_returns_to_operational_night');
 for(const day of current.active){
  await page.locator('[data-svc1102-key="panel-days"] [data-svc-day="'+day+'"]').click();
  const selected=await page.evaluate(inspectProgress);guard(selected.day===day&&selected.mapDay===day&&selected.ok,'operational_night_map_and_percentages_agree');
 }
 stage='rollover';
 async function clock(now){overrideClock=now;const n=await page.evaluate(()=>window.__svcReviewModel.lastRead);await page.locator('[data-map-refresh]').click();await page.waitForFunction(n=>window.__svcReviewModel.lastRead!==n,n,{timeout:45000});}
 await clock('2026-10-23T21:59:00.000Z');
 await page.locator('[data-svc1102-key="panel-days"] [data-svc-day="2026-10-23"]').click();
 current=await page.evaluate(inspectProgress);guard(current.day==='2026-10-23'&&current.active.includes('2026-10-23'),'friday_night_retained_until_saturday_0800_aest');
 await clock('2026-10-23T22:00:00.000Z');
 current=await page.evaluate(inspectProgress);guard(current.day==='2026-10-24'&&current.mapDay===current.day&&!current.active.includes('2026-10-23')&&current.past.includes('2026-10-23')&&!current.historyOpen,'0800_rollover_moves_ended_night_to_history');
 await clock('2026-10-24T22:00:00.000Z');
 current=await page.evaluate(inspectProgress);guard(current.active.length===1&&current.day==='2026-10-25'&&current.ok,'final_night_uses_its_own_plan');
 await clock('2026-10-25T22:00:00.000Z');
 current=await page.evaluate(inspectProgress);guard(!current.active.length&&current.day==='2026-10-25'&&current.ok,'after_event_keeps_saved_final_results_without_active_nights');
 guard(await page.locator('#svc1067').innerText().then(t=>t.includes('Event servicing has ended.')),'after_event_explained');
 guard(errors.length===0,'no_page_or_bridge_errors');guard(writes===0,'zero_network_write_attempts');
 await browser.close();browser=null;
 const after=await json('/api/ticks?'+new URLSearchParams({token,links:'1',since:'0'}));save('tracker_after_private.json',after);
 for(const key of ['token','load','tracker','key_kept','epoch','links'])guard(JSON.stringify(before[key])===JSON.stringify(after[key]),'tracker_'+key+'_unchanged');
 const receipt={author:'Andrew Fisher',status:'passed',at:new Date().toISOString(),page_sha256:sha(bytes),page_bytes:bytes.length,mobile:MOB,mode:PAGE?'candidate at live origin':'live public bytes at native edit origin',checks,writes,tracker_reads:reads,saved_ticks_changed_during_review:JSON.stringify(before.ticks)!==JSON.stringify(after.ticks)};
 save('receipt_sanitized.json',receipt);console.log(JSON.stringify({status:'passed',checks:checks.length,writes,page_sha256:receipt.page_sha256}));
})().catch(e=>{console.log(JSON.stringify({status:'failed',stage,code:e.safeCode||e.name,writes}));process.exitCode=1;}).finally(async()=>{if(browser)await browser.close();});

