/* Author: Andrew Fisher. Actual built page + actual v5.90, local temporary stores only.
   PAGE_FILE, GC500_FIXTURE and GC500_CACHE are private local inputs. All outside networking is intercepted.
   Only explicit /api/cards POSTs reach the disposable localhost server; every record write is blocked. */
'use strict';
const fs=require('fs'),path=require('path'),os=require('os'),http=require('http'),crypto=require('crypto'),{spawn}=require('child_process');
const {isDeepStrictEqual}=require('node:util');
const {chromium}=require('playwright');
const HERE=path.resolve(__dirname,'..'), ROOT=path.resolve(HERE,'..'), HOST='https://gc500-production.up.railway.app';
const {cardScriptHash}=require(path.join(ROOT,'servicing_tracker_DRAFT/card/build_card.js'));
const PAGE=process.env.PAGE_FILE, FIXTURE=process.env.GC500_FIXTURE, CACHE=process.env.GC500_CACHE;
if(!PAGE||!FIXTURE||!CACHE)throw new Error('PAGE_FILE, GC500_FIXTURE, GC500_CACHE required');
const hash=(s,a='sha256')=>crypto.createHash(a).update(s).digest('hex');
const E='local-edit-panel-integration',V='local-view-panel-integration',wait=ms=>new Promise(r=>setTimeout(r,ms));
const dir=fs.mkdtempSync(path.join(os.tmpdir(),'gc500-panel-local-'));
const frozen=url=>{const f=path.join(FIXTURE,hash(url));return fs.existsSync(f+'.json')?{...JSON.parse(fs.readFileSync(f+'.json')),body:fs.readFileSync(f+'.body')}:null;};
const initial=frozen(HOST+'/api/state');if(!initial)throw new Error('Frozen state missing');
fs.writeFileSync(path.join(dir,'records.json'),initial.body);fs.copyFileSync(PAGE,path.join(dir,'app.html'));
if(process.env.GC500_DEBUG_BOOT==='1'){
 const anchor='const deliver = coll => (listeners[coll] || []).forEach(fn => { try { fn(snapOf(coll)); } catch (e) {} });';
 let html=fs.readFileSync(path.join(dir,'app.html'),'utf8');if(html.split(anchor).length!==2)throw new Error('Debug delivery anchor missing');
 html=html.replace(anchor,anchor.replace('catch (e) {}','catch (e) { console.error("SYNC_DELIVER_ERROR", String(e.stack || e)); }'));
 fs.writeFileSync(path.join(dir,'app.html'),html);
}
let server,browser,exited=false,port,pass=0,authority='edit',failTicks=false,blocked=[],posts=[],requests=[],missing=[],errors=[];
const check=(s,ok)=>{if(!ok)throw new Error(s);pass++;console.log('PASS '+s);};
const req=(p,token=E)=>new Promise((resolve,reject)=>{http.get({hostname:'127.0.0.1',port,path:p,headers:{'x-gc500-token':token}},r=>{let a=[];r.on('data',x=>a.push(x));r.on('end',()=>resolve({status:r.statusCode,headers:r.headers,body:Buffer.concat(a)}));}).on('error',reject);});
async function context(mobile,view){
 const ctx=await browser.newContext({viewport:{width:mobile?390:1280,height:844},deviceScaleFactor:mobile?2:1,isMobile:mobile,hasTouch:mobile,locale:'en-AU',timezoneId:'Australia/Brisbane'});
 await ctx.route('**/*',async route=>{
  const r=route.request(),u=new URL(r.url()),method=r.method();requests.push([u.pathname,method]);
  if(u.protocol==='data:'||u.protocol==='blob:')return route.continue();
  const local=u.hostname==='127.0.0.1'&&Number(u.port)===port;
  if(method!=='GET'){
   if(local&&method==='POST'&&u.pathname==='/api/cards'){posts.push(r.postDataJSON());return route.continue();}
   blocked.push(u.pathname+':'+method);return route.abort();
  }
  if(local&&u.pathname==='/api/version'&&authority==='view'){
   const j=await req('/api/version',V);return route.fulfill({status:j.status,headers:j.headers,body:j.body});
  }
  if(local&&u.pathname==='/api/ticks'&&failTicks)return route.fulfill({status:503,contentType:'application/json',body:'{"error":"Local connection fixture"}'});
  if(local&&(/^\/(e|v|d)\//.test(u.pathname)||['/api/version','/api/state','/api/files','/api/cards','/api/ticks','/api/reports','/api/map-key','/api/machine'].includes(u.pathname)))return route.continue();
  const publicUrl=local?HOST+u.pathname+u.search:u.href;
  let value=frozen(publicUrl);
  if(!value){const f=path.join(CACHE,hash(publicUrl,'sha1'));if(fs.existsSync(f+'.json'))value={...JSON.parse(fs.readFileSync(f+'.json')),body:fs.readFileSync(f+'.body')};}
  if(value)return route.fulfill(value);
  // Nonessential resources absent from the retained fixture are intentionally empty; never go online.
  missing.push(u.pathname);
  return route.fulfill({status:200,contentType:r.resourceType()==='image'?'image/svg+xml':r.resourceType()==='stylesheet'?'text/css':'application/json',body:r.resourceType()==='image'?'<svg xmlns="http://www.w3.org/2000/svg" width="1" height="1"/>':r.resourceType()==='stylesheet'?'':'{}'});
 });
 const page=await ctx.newPage();page.on('pageerror',e=>errors.push(e.message));page.on('dialog',d=>d.accept());
 page.on('console',m=>{if(m.text().startsWith('SYNC_DELIVER_ERROR'))console.log(m.text());});
 await page.goto('http://127.0.0.1:'+port+'/'+(view?'v/'+V:'e/'+E)+'#nights',{waitUntil:'load',timeout:180000});
 try{await page.waitForFunction(()=>SYNC.status==='live'&&DOCS.state==='ready'&&state.tab==='nights'&&SYNC.first.size===Object.keys(SYNC_COLLS).length&&document.documentElement.getAttribute('data-refresh904')==='ready',null,{timeout:20000});}
 catch(e){console.log('Boot diagnostics '+JSON.stringify(await page.evaluate(()=>({sync:SYNC.status,docs:DOCS.state,tab:state.tab,first:SYNC.first.size,expected:Object.keys(SYNC_COLLS).length,pending:Object.keys(SYNC.pending).length,refresh:document.documentElement.getAttribute('data-refresh904')}))));throw e;}
 return {ctx,page};
}
(async()=>{
 let recHash=hash(fs.readFileSync(path.join(dir,'records.json')));
 try{
  port=await new Promise(resolve=>{const s=http.createServer();s.listen(0,'127.0.0.1',()=>{const p=s.address().port;s.close(()=>resolve(p));});});
  const log=fs.openSync(path.join(dir,'server.log'),'a');
  server=spawn(process.execPath,['-r',path.join(ROOT,'server_v5.89_servicing_tracker_DRAFT/fake_clock.js'),path.join(ROOT,'server_v5.90_servicing_tracker_DRAFT/server.js')],{env:{PATH:process.env.PATH,PORT:String(port),DATA_DIR:dir,VIEW_TOKEN:V,EDIT_TOKEN:E,FAKE_NOW:'2026-10-18T11:00:00+10:00'},stdio:['ignore',log,log]});server.on('exit',()=>{exited=true;});
  for(let n=0;n<100;n++){try{if((await req('/health')).status===200)break;}catch(e){}await wait(100);}
  browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||'/usr/bin/chromium',headless:true,args:['--no-sandbox']});
  let {ctx,page}=await context(true,false);
  await page.waitForSelector('#svc1067-host:not([hidden])');
  check('actual page boots with connected edit authority',await page.evaluate(()=>capability()==='edit'&&SYNC.level==='edit'&&SYNC.backend.rest));
  check('no tracker writes on boot',posts.length===0);
  // Establish the native redelivery baseline before any tracker operation. Initial mergeRecords omits
  // empty mapKeys; syncFold later supplies {}. Verify that exact value-level change, never exclude a field.
  const firstState=await page.evaluate(()=>JSON.parse(JSON.stringify(S)));
  await page.evaluate(()=>SYNC.backend.redeliver());await wait(500);
  const foldedState=await page.evaluate(()=>JSON.parse(JSON.stringify(S)));
  if(!isDeepStrictEqual(firstState,foldedState)){
   const changed=Object.keys({...firstState,...foldedState}).filter(k=>!isDeepStrictEqual(firstState[k],foldedState[k]));
   check('native setup changes only absent mapKeys to an empty object',changed.length===1&&changed[0]==='mapKeys'&&!Object.prototype.hasOwnProperty.call(firstState,'mapKeys')&&isDeepStrictEqual(foldedState.mapKeys,{}));
  }else check('native setup already has the same complete state',true);
  await page.evaluate(()=>SYNC.backend.redeliver());await wait(500);
  check('second native redelivery is value-stable with zero record writes',isDeepStrictEqual(foldedState,await page.evaluate(()=>JSON.parse(JSON.stringify(S))))&&blocked.length===0);
  await page.locator('.svc1067-admin summary').click();await page.locator('[data-contact-name]').fill('Local fixture supervisor');await page.locator('[data-contact-phone]').fill('0400 000 000');
  await page.evaluate(()=>{document.getElementById('who').value='Local fixture operator';});
  const sBefore=await page.evaluate(()=>JSON.stringify(S));
  await page.locator('[data-make="test"]').click();await page.waitForFunction(()=>document.querySelector('[data-admin-status]').textContent.includes('saved and read back'),null,{timeout:30000});
  check('actual backend creates TEST card and verifies read-back',posts.length===1&&posts[0].load==='servicing-tracker:TEST');
  const list=JSON.parse((await req('/api/ticks')).body),token=list.trackers.find(t=>t.load==='servicing-tracker:TEST').token;
  const meta=JSON.parse((await req('/api/ticks?token='+token+'&links=1')).body),card=await req('/d/'+token);
  check('TEST uses current server day with valid next-day window',meta.tracker.days[0].id==='2026-10-18'&&card.body.toString().includes('"to":"Mon 19"'));
  check('served TEST card is exact posted bytes and CSP matches',card.body.toString()===posts[0].html&&card.headers['content-security-policy'].includes(cardScriptHash(card.body.toString())));
  await page.waitForFunction(()=>document.querySelector('#svc1067').textContent.includes('TEST / other tracker'));
  check('actual panel renders TEST progress and per-job totals',await page.locator('#svc1067').innerText().then(t=>t.includes('Pumped out')&&t.includes('Fresh water refilled')&&t.includes('Cleaned & restocked')));
  check('TEST creation leaves the hydrated main-page state unchanged',isDeepStrictEqual(JSON.parse(sBefore),await page.evaluate(()=>JSON.parse(JSON.stringify(S)))));
  await page.locator('details[data-svc-area="5"]').evaluate(e=>e.open=true);
  await page.evaluate(()=>{window.renderNights1022();SYNC.backend.redeliver();});await wait(500);
  check('native run-sheet redraw preserves admin and open area',await page.locator('details[data-svc-area="5"]').evaluate(e=>e.open)&&await page.locator('[data-contact-name]').inputValue()==='Local fixture supervisor');
  await page.locator('[data-make="test"]').click();await page.waitForFunction(()=>document.querySelector('[data-admin-status]').textContent.includes('saved and read back'),null,{timeout:30000});
  check('actual update explicitly reuses same token',posts.length===2&&posts[1].token===token);
  const meta2=JSON.parse((await req('/api/ticks?token='+token+'&links=1')).body);
  check('same-token update preserves printed signatures',JSON.stringify(meta.links)===JSON.stringify(meta2.links));
  const downloaded=page.waitForEvent('download');await page.locator('[data-download-links]').click();const download=await downloaded;
  const file=path.join(dir,'downloaded_test_links.json');await download.saveAs(file);const bundle=JSON.parse(fs.readFileSync(file));
  check('downloaded QR bundle preserves published TEST days and contact',bundle.token===token&&bundle.mode==='test'&&JSON.parse(bundle.data_json).days[0].id==='2026-10-18'&&bundle.contact.name==='Local fixture supervisor');
  await page.locator('[data-test-checked]').check();await page.locator('[data-site-checked]').check();await page.locator('[data-make="event"]').click();
  await page.waitForFunction(()=>document.querySelector('[data-admin-status]').textContent.includes('Event tracker saved and read back'),null,{timeout:30000});
  const all=JSON.parse((await req('/api/ticks')).body).trackers;
  check('event tracker is deliberate and separate from TEST',posts.length===3&&all.filter(t=>t.load==='servicing-tracker:GC500-2026').length===1&&all.length===2&&posts[2].tracker.days.length===4&&posts[2].tracker.days[0].id==='2026-10-22');
  await page.waitForFunction(()=>document.querySelector('#svc1067').textContent.includes('Thu 22'));
  failTicks=true;await page.evaluate(()=>window.dispatchEvent(new HashChangeEvent('hashchange')));
  await page.waitForFunction(()=>document.querySelector('#svc1067').textContent.includes('Showing the last verified progress.'));
  check('failed progress read keeps verified totals with an explicit stale label',await page.locator('#svc1067').innerText().then(t=>t.includes('Pumped out')&&t.includes('Showing the last verified progress.')));
  failTicks=false;await page.evaluate(()=>window.dispatchEvent(new HashChangeEvent('hashchange')));
  await page.waitForFunction(()=>!document.querySelector('#svc1067').textContent.includes('Showing the last verified progress.'));
  const beforeState=JSON.parse(sBefore),afterState=await page.evaluate(()=>JSON.parse(JSON.stringify(S))),sameState=isDeepStrictEqual(beforeState,afterState);
  if(!sameState)console.log('Changed local S keys: '+Object.keys({...beforeState,...afterState}).filter(k=>!isDeepStrictEqual(beforeState[k],afterState[k])).join(', '));
  check('tracker actions do not mutate main-page record values (object order ignored)',sameState);
  check('phone viewport has no horizontal overflow',await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
  await page.locator('#svc1067-host').scrollIntoViewIfNeeded();await page.screenshot({path:path.join(dir,'actual_panel_390.png'),fullPage:false});
  authority='view';await page.evaluate(()=>SYNC.backend.pull(true));await page.waitForFunction(()=>SYNC.level==='view');
  check('real REST permission change clears private panel immediately',await page.locator('#svc1067-host').evaluate(e=>e.hidden&&e.textContent.trim()===''));
  const before=posts.length,refusal=await page.evaluate(async()=>{try{await SYNC.backend.makeTracker({});return false;}catch(e){return /edit link/.test(e.message);}});
  check('backend blocks revoked authority before HTTP write',refusal&&posts.length===before);
  await ctx.close();authority='edit';const tickAt=requests.filter(r=>r[0]==='/api/ticks').length;let v=await context(false,true);
  check('fresh view page never shows tracker controls or requests tokens',await v.page.locator('#svc1067-host').evaluate(e=>e.hidden&&e.textContent.trim()==='')&&requests.filter(r=>r[0]==='/api/ticks').length===tickAt);await v.ctx.close();
  check('zero attempted main-record writes and zero page errors',blocked.length===0&&errors.length===0);
  check('server job record file remains byte-for-byte unchanged',hash(fs.readFileSync(path.join(dir,'records.json')))===recHash);
  console.log(JSON.stringify({passed:pass,failed:0,page_sha256:hash(fs.readFileSync(PAGE)),server_sha256:hash(fs.readFileSync(path.join(ROOT,'server_v5.90_servicing_tracker_DRAFT/server.js'))),local_only:true,nonessential_stubbed_paths:[...new Set(missing)],evidence:dir}));
 }catch(e){console.error(e);console.error(JSON.stringify({errors,blocked,private_evidence:dir}));process.exitCode=1;}
 finally{if(browser)await browser.close();if(server&&!exited){server.kill('SIGTERM');for(let n=0;n<100&&!exited;n++)await wait(50);}}
})();
