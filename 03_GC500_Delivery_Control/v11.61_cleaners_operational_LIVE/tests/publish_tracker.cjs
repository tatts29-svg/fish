/* Author: Andrew Fisher. Native tracker update. Dry run captures only; execute permits one guarded POST /api/cards.
   Backups/raw receipts are private. No completion, record, withdrawal or rekey endpoint is permitted. */
'use strict';
const fs=require('fs'),path=require('path'),crypto=require('crypto'),cp=require('child_process');
const {chromium}=require('playwright');
const HOST='https://gc500-production.up.railway.app',EDIT=process.env.GC500_EDIT_TOKEN||'',PAGE=process.env.PAGE,OUT=process.env.OUT;
const EXECUTE=process.argv.includes('--execute'),LOAD='servicing-tracker:GC500-2026';
const BASE='e17bd3d868b00f421f23a249c39f39c94801c05b57533ae8d4bfcd7674cf683f';
let token='',browser,stage='start',posts=0,sent=0,writes=0,held=false,body,captured=false;
const checks=[],errors=[];const hash=x=>crypto.createHash('sha256').update(x).digest('hex');
const stable=x=>JSON.stringify(x&&typeof x==='object'?(Array.isArray(x)?x.map(v=>JSON.parse(stable(v))):Object.fromEntries(Object.keys(x).sort().map(k=>[k,JSON.parse(stable(x[k]))]))):x);
const eq=(a,b)=>stable(a)===stable(b);
function guard(ok,code){if(!ok)throw Object.assign(new Error(code),{safeCode:code});checks.push(code);}
function save(name,value){const bytes=Buffer.isBuffer(value)?value:Buffer.from(typeof value==='string'?value:JSON.stringify(value,null,2));guard(!EDIT||!bytes.includes(EDIT),'artifact_contains_no_edit_key');fs.writeFileSync(path.join(OUT,name),bytes,{mode:0o600});}
function bridge(url,headers={},method='GET',data){return new Promise((resolve,reject)=>{
 const c=cp.spawn('python3',[path.join(__dirname,'native_bridge.py')],{stdio:['pipe','pipe','pipe'],env:process.env});let out='',size=0;c.stdout.on('data',b=>{size+=b.length;if(size>48e6)c.kill();else out+=b});c.stderr.resume();c.on('error',()=>reject(Error('bridge_spawn')));c.on('close',code=>{try{const r=JSON.parse(out);if(code||!r.ok)throw Error();resolve({status:r.status,headers:r.headers,body:Buffer.from(r.body,'base64')});}catch(e){reject(Error('bridge_failed'))}});c.stdin.end(JSON.stringify({url,headers,method,body:data,tracker:token,permitCardsWrite:EXECUTE&&method==='POST'}));});}
async function get(route,auth=true){const r=await bridge(HOST+route,auth?{'x-gc500-token':EDIT}:{});guard(r.status===200,'read_200');return r.body;}
async function json(route){return JSON.parse(await get(route));}
async function snapshot(label){
 const cards=await json('/api/cards'),list=await json('/api/ticks');const cs=cards.cards.filter(x=>x.load===LOAD&&!x.expired),ts=list.trackers.filter(x=>x.load===LOAD&&!x.expired&&!x.card_withdrawn);
 guard(cs.length===1&&ts.length===1&&cs[0].token===token&&ts[0].token===token,'unique_existing_event_tracker');
 const pages=[];let since=0;for(let i=0;i<100;i++){const m=await json('/api/ticks?'+new URLSearchParams({token,links:'1',since:String(since),voided:'1',voids:'1'}));pages.push(m);guard(!m.void_more,'complete_void_history');if(!m.more)break;guard(m.seq>since&&i<99,'bounded_tick_pages');since=m.seq;}
 const meta=pages[0],ticks=pages.flatMap(x=>x.ticks);guard(meta.key_kept&&!meta.card_withdrawn&&!meta.expired,'completion_key_available');guard(ticks.length===meta.historical_ticks&&pages.at(-1).seq===meta.total_seq,'complete_ticks');
 const state=await json('/api/state'),snap={card:cs[0],meta,ticks,state};save(label+'.json',snap);return snap;
}
function preserved(a,b){const m=new Map(b.ticks.map(t=>[t.id,t]));return a.meta.epoch===b.meta.epoch&&a.ticks.every(t=>eq(t,m.get(t.id)))&&(a.meta.voids||[]).every(v=>(b.meta.voids||[]).some(w=>eq(v,w)))&&b.meta.total_seq>=a.meta.total_seq;}
function dataFrom(html){const at=html.indexOf('var D = ')+8;let depth=0,quoted=false,esc=false;for(let i=at;i<html.length;i++){const c=html[i];if(quoted){if(esc)esc=false;else if(c==='\\')esc=true;else if(c==='"')quoted=false;}else if(c==='"')quoted=true;else if(c==='{')depth++;else if(c==='}'&&!--depth)return JSON.parse(html.slice(at,i+1));}throw Error('card_data');}
(async()=>{
 process.umask(0o077);guard(EDIT&&PAGE&&OUT&&path.isAbsolute(OUT),'required_private_inputs');fs.mkdirSync(OUT,{recursive:true,mode:0o700});if(EXECUTE)guard(process.env.GC500_NATIVE_TRACKER_EXECUTE==='1','explicit_execute_gate');
 const candidate=fs.readFileSync(PAGE),candidateHash=hash(candidate);const text=candidate.toString();guard(text.includes("+' · v11.61';"),'candidate_release');
 const start=text.indexOf('var SVC1067_CARD=')+'var SVC1067_CARD='.length,pkg=JSON.parse(text.slice(start,text.indexOf('\n',start)).replace(/;\s*$/,''));
 const liveHash=hash(await get('/v/Coates-GC500-2026',false));guard(EXECUTE?liveHash===candidateHash:liveHash===BASE||liveHash===candidateHash,'live_page_guard');
 const list=await json('/api/ticks');const event=list.trackers.filter(x=>x.load===LOAD&&!x.expired&&!x.card_withdrawn);guard(event.length===1,'event_tracker_found');token=event[0].token;
 const before=await snapshot('before');let oldHtml;if(EXECUTE){oldHtml=await get('/d/'+token,false);save('before_crew.html',oldHtml);}
 const browserEnv=Object.fromEntries(Object.entries(process.env).filter(([k])=>!/TOKEN|SECRET|PASSWORD|KEY/.test(k)));
 browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||'/usr/bin/chromium',args:['--no-sandbox'],env:browserEnv});const ctx=await browser.newContext({viewport:{width:1440,height:1000},locale:'en-AU',timezoneId:'Australia/Brisbane',serviceWorkers:'block'});let page,prePost,readBack;
 await ctx.route('**/*',async route=>{const r=route.request(),u=new URL(r.url());if(u.origin!==HOST)return route.abort();
  if(r.method()==='GET'&&u.pathname==='/e/'+EDIT)return route.fulfill({status:200,contentType:'text/html',body:candidate});
  if(r.method()!=='GET'){
   if(r.method()!=='POST'||u.pathname!=='/api/cards'||posts){writes++;return route.abort();}posts++;stage='validate_payload';
   try{
    body=JSON.parse(r.postData());const h=r.headers();guard(h['x-gc500-token']===EDIT&&h['x-gc500-who']==='Andrew Fisher via Codex','native_operator');
    guard(eq(Object.keys(body).sort(),['load','title','run_date','expires','keys','contact','tracker','token','html'].sort()),'exact_native_fields');
    guard(body.token===token&&body.load===LOAD&&!body.rekey&&eq(body.keys,[]),'same_token_no_rekey');
    guard(eq(body.contact,before.card.contact)&&body.title===before.card.title&&body.run_date===before.card.run_date&&body.expires===before.card.expires,'contact_and_metadata_unchanged');
    guard(eq(body.tracker,before.meta.tracker),'tracker_configuration_unchanged');
    const expected={...pkg.data,contact:before.card.contact};guard(eq(dataFrom(body.html),expected),'exact_candidate_data');
    if(oldHtml)guard(eq(dataFrom(body.html),dataFrom(oldHtml.toString())),'published_crew_data_unchanged');
    const expectedHtml=await page.evaluate(({html,data})=>SvcTrackerAdmin1067.cardHtml(html,data,false),{html:pkg.html,data:expected});guard(body.html===expectedHtml,'exact_candidate_template');
    save('native_payload_private.json',body);save('candidate_crew.html',body.html);captured=true;
    if(!EXECUTE)return route.fulfill({status:409,contentType:'application/json',body:'{"error":"Dry run: captured and not sent"}'});
    guard(hash(await get('/v/Coates-GC500-2026',false))===candidateHash,'page_still_matches_before_post');
    prePost=await snapshot('immediate_before');guard(eq(prePost.meta.links,before.meta.links)&&eq(prePost.meta.tracker,before.meta.tracker)&&prePost.meta.updated===before.meta.updated&&eq(prePost.card.contact,before.card.contact)&&preserved(before,prePost),'tracker_unchanged_before_post');
    guard(writes===0,'no_other_writes');sent++;stage='native_post';const response=await bridge(r.url(),h,'POST',r.postData());save('response_private.json',JSON.parse(response.body));return route.fulfill(response);
   }catch(e){stage=e.safeCode||'payload_guard_failed';return route.fulfill({status:409,contentType:'application/json',body:'{"error":"Guarded update stopped"}'});}
  }
  const allowed=['/api/state','/api/version','/api/cards','/api/ticks'].includes(u.pathname)||u.pathname.startsWith('/m/')||(EXECUTE&&u.pathname==='/d/'+token);
  if(!allowed)return route.abort();
  if(u.pathname==='/api/state'&&!held){await page.evaluate(()=>{if(SYNC.first.size)throw Error('late_hold');syncSend=function(){clearTimeout(SYNC.timer);SYNC.timer=null;syncStage();};});held=true;}
  try{const response=await bridge(r.url(),r.headers());if(u.pathname==='/d/'+token){readBack=response.body;save('readback_crew.html',readBack);}return route.fulfill(response);}catch(e){errors.push('read_bridge');return route.abort();}
 });
 page=await ctx.newPage();page.on('pageerror',()=>errors.push('page_error'));page.on('dialog',async d=>{if(d.type()==='confirm'&&d.message()==='Update the existing event tracker? Its printed completion codes will stay the same.')return d.accept();return d.dismiss();});
 stage='native_page';await page.goto(HOST+'/e/'+EDIT+'#servicing',{waitUntil:'domcontentloaded',timeout:90000});await page.waitForFunction(()=>SYNC.status==='live'&&SYNC.level==='edit'&&SYNC.first.size===Object.keys(SYNC_COLLS).length,null,{timeout:90000});guard(held,'sender_held_before_hydration');
 await page.evaluate(()=>{document.getElementById('who').value='Andrew Fisher via Codex';renderServicing1084();});await page.locator('.svc1067-admin summary').click();await page.waitForFunction(()=>document.querySelector('[data-contact-name]')?.value&&document.querySelector('[data-contact-phone]')?.value);
 await page.locator('[data-test-checked]').check();await page.locator('[data-site-checked]').check();await page.locator('[data-make="event"]').click();await page.waitForFunction(()=>/captured and not sent|saved and read back|Guarded update stopped/.test(document.querySelector('[data-admin-status]').textContent),null,{timeout:90000});
 guard(captured&&posts===1&&writes===0,'one_validated_native_attempt');
 if(EXECUTE){guard((await page.locator('[data-admin-status]').textContent()).includes('saved and read back'),'native_saved_readback');guard(readBack&&readBack.equals(Buffer.from(body.html)),'exact_served_crew_bytes');}else guard(sent===0,'dry_run_sent_nothing');
 await browser.close();browser=null;const after=await snapshot('after'),ref=prePost||before;
 guard(eq(after.meta.links,before.meta.links)&&eq(after.meta.tracker,before.meta.tracker),'all_codes_and_configuration_preserved');guard(preserved(ref,after),'all_prior_ticks_preserved');guard(errors.length===0,'no_page_errors');
 const receipt={author:'Andrew Fisher',at:new Date().toISOString(),status:'passed',mode:EXECUTE?'published':'dry_run',candidate_sha256:candidateHash,base_sha256:BASE,crew_sha256:hash(body.html),live_posts:sent,record_writes:0,completion_writes:0,existing_links:Object.keys(before.meta.links).length,prior_ticks:ref.ticks.length,concurrent_ticks:after.ticks.length-ref.ticks.length,record_unchanged:eq(ref.state,after.state),page_errors:errors.length,checks};save('receipt_sanitized.json',receipt);console.log(JSON.stringify(receipt));
})().catch(e=>{const receipt={status:'blocked',stage,code:e.safeCode||e.name,posts,sent,writes,errors};if(OUT)try{save('blocker_sanitized.json',receipt)}catch(_){}console.log(JSON.stringify(receipt));process.exitCode=1}).finally(async()=>{if(browser)await browser.close()});
