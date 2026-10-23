// Author: Andrew Fisher. Native HTML-only tracker update with exact configuration/history guards.
// Default captures the native request and sends nothing. --execute requires the reviewed page live.
'use strict';
const fs=require('node:fs'),path=require('node:path'),cp=require('node:child_process'),crypto=require('node:crypto'),assert=require('node:assert/strict');
const {chromium}=require('playwright');
const HOST='https://gc500-production.up.railway.app',LOAD='servicing-tracker:GC500-2026';
const EDIT=process.env.GC500_EDIT_TOKEN||'',EXECUTE=process.argv.includes('--execute');
const PAGE=process.env.PAGE,ROOT=process.env.EVIDENCE;
const sha=v=>crypto.createHash('sha256').update(v).digest('hex');
const stable=v=>JSON.stringify(v&&typeof v==='object'?(Array.isArray(v)?v.map(x=>JSON.parse(stable(x))):Object.fromEntries(Object.keys(v).sort().map(k=>[k,JSON.parse(stable(v[k]))]))):v);
const eq=(a,b)=>stable(a)===stable(b);
let token,runDir,browser,payload,postCount=0,livePosts=0,unexpected=0,errors=0,stage='init';
const checks=[];
function guard(v,msg){assert(v,msg);checks.push(msg);}
function save(name,data){const b=Buffer.isBuffer(data)?data:Buffer.from(typeof data==='string'?data:JSON.stringify(data,null,2));guard(!b.includes(EDIT),'no_edit_key_in_artifact');fs.writeFileSync(path.join(runDir,name),b,{mode:0o600});}
function bridge(url,headers={},method='GET',body){return new Promise((resolve,reject)=>{
 const child=cp.spawn('python3',[path.join(__dirname,'native_bridge1170.py')],{env:process.env,stdio:['pipe','pipe','pipe']}),chunks=[];
 child.stdout.on('data',d=>chunks.push(d));child.stderr.resume();child.on('error',()=>reject(Error('bridge unavailable')));
 child.on('close',code=>{try{const r=JSON.parse(Buffer.concat(chunks));if(code||!r.ok)throw Error();resolve({status:r.status,headers:r.headers,body:Buffer.from(r.body,'base64')});}catch(e){reject(Error('bounded bridge failed'));}});
 child.stdin.end(JSON.stringify({url,headers,method,body,tracker:token,permitCardsWrite:EXECUTE&&method==='POST'}));
});}
async function get(route,auth=true){const r=await bridge(HOST+route,auth?{'x-gc500-token':EDIT}:{});guard(r.status===200,'GET succeeded');return r.body;}
async function json(route){return JSON.parse(await get(route));}
async function snapshot(label){
 stage=label;const version=await json('/api/version');guard(version.level==='edit','edit access verified');
 const cards=await json('/api/cards'),listing=await json('/api/ticks');
 const matches=cards.cards.filter(c=>c.load===LOAD&&!c.expired),active=listing.trackers.filter(c=>c.load===LOAD&&!c.expired&&!c.card_withdrawn&&c.tracker);
 guard(matches.length===1&&active.length===1&&matches[0].token===active[0].token,'unique existing tracker');
 if(token)guard(token===matches[0].token,'same tracker token');else token=matches[0].token;
 const pages=[];let since=0;
 for(let i=0;i<100;i++){
  const m=await json('/api/ticks?'+new URLSearchParams({token,links:'1',since:String(since),voided:'1',voids:'1'}));pages.push(m);
  guard(!m.void_more,'complete void history');if(!m.more)break;guard(m.seq>since&&i<99,'bounded pagination');since=m.seq;
 }
 const meta=pages[0],ticks=pages.flatMap(p=>p.ticks),fields=['token','load','tracker','key_kept','epoch','total_seq','historical_ticks','links','voids','void_seq'];
 guard(meta.key_kept&&pages.every(p=>fields.every(k=>eq(p[k],meta[k])))&&pages.at(-1).seq===meta.total_seq&&ticks.length===meta.historical_ticks,'coherent complete tick snapshot');
 const state=await json('/api/state'),html=await get('/d/'+token,false);
 guard(state.version===version.version,'record stable during snapshot');
 const snap={version,state,card:matches[0],meta,ticks,html_sha256:sha(html)};save(label+'.json',snap);save(label+'.html',html);return snap;
}
function historyPreserved(a,b){return a.meta.epoch===b.meta.epoch&&a.ticks.every(t=>b.ticks.some(x=>x.id===t.id&&eq(t,x)))&&(a.meta.voids||[]).every(v=>(b.meta.voids||[]).some(x=>eq(v,x)));}
function crewData(html){const start=html.indexOf('var D = ')+8;guard(start>8,'crew data marker');let depth=0,quoted=false,escaped=false;
 for(let i=start;i<html.length;i++){const c=html[i];if(quoted){if(escaped)escaped=false;else if(c==='\\')escaped=true;else if(c==='"')quoted=false;}else if(c==='"')quoted=true;else if(c==='{')depth++;else if(c==='}'&&--depth===0)return JSON.parse(html.slice(start,i+1));}throw Error('crew data parse');}
(async()=>{
 process.umask(0o077);guard(EDIT&&PAGE&&ROOT,'configured private execution inputs');guard(!EXECUTE||process.env.GC500_NATIVE_TRACKER_EXECUTE==='1','explicit execution gate');
 fs.mkdirSync(ROOT,{recursive:true});runDir=fs.mkdtempSync(path.join(ROOT,EXECUTE?'execute-':'dry-'));
 const candidate=fs.readFileSync(PAGE),candidateHash=sha(candidate);
 guard(candidate.includes('var SvcScope1170 =')&&candidate.includes("+' · v11.70';"),'expected release candidate');
 const liveHash=sha(await get('/v/Coates-GC500-2026',false));
 guard(EXECUTE?liveHash===candidateHash:['1a0c2dc11be081cae5a792662a4fcdd3854212e0fb6bc9174cef7143dc2948a7',candidateHash].includes(liveHash),'live base matches phase');
 const before=await snapshot('before'),oldHtml=fs.readFileSync(path.join(runDir,'before.html'),'utf8');
 const env=Object.fromEntries(Object.entries(process.env).filter(([k])=>!['GC500_EDIT_TOKEN','GC500_NATIVE_TRACKER_EXECUTE'].includes(k)));
 browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH,args:['--no-sandbox'],env});
 const ctx=await browser.newContext({viewport:{width:1300,height:950},timezoneId:'Australia/Brisbane',serviceWorkers:'block'});
 await ctx.route('**/*',async route=>{
  const r=route.request(),u=new URL(r.url());if(u.origin!==HOST)return route.abort();
  if(r.method()==='GET'&&u.pathname==='/e/'+EDIT)return route.fulfill({contentType:'text/html',body:candidate});
  if(r.method()!=='GET'){
   if(r.method()!=='POST'||u.pathname!=='/api/cards'||postCount){unexpected++;return route.abort();}
   postCount++;stage='validate native request';
   try{
    guard(r.headers()['x-gc500-who']==='Andrew Fisher via Codex','native operator attribution');payload=JSON.parse(r.postData());
    guard(eq(Object.keys(payload).sort(),['load','title','run_date','expires','keys','contact','tracker','token','html'].sort()),'exact payload fields');
    guard(payload.token===token&&payload.load===LOAD&&!payload.rekey&&eq(payload.keys,[]),'same token no rekey');
    guard(eq(payload.contact,before.card.contact)&&['title','run_date','expires'].every(k=>payload[k]===before.card[k]),'metadata unchanged');
    guard(eq(payload.tracker,before.meta.tracker),'tracker configuration unchanged');
    guard(eq(crewData(payload.html),crewData(oldHtml)),'crew reference data unchanged');
    guard(payload.html.includes('var SvcScope1170 =')&&!oldHtml.includes('var SvcScope1170 ='),'new scope template replaces old template');
    save('native-payload.json',payload);save('candidate-crew.html',payload.html);
    if(!EXECUTE)return route.fulfill({status:409,contentType:'application/json',body:'{"error":"Dry run captured; nothing sent"}'});
    guard(unexpected===0&&sha(await get('/v/Coates-GC500-2026',false))===candidateHash,'candidate still live before update');
    const fresh=await snapshot('immediate-before');
    guard(eq(fresh.meta.tracker,before.meta.tracker)&&eq(fresh.meta.links,before.meta.links)&&fresh.html_sha256===before.html_sha256&&eq(fresh.card,before.card)&&historyPreserved(before,fresh),'tracker unchanged before update');
    livePosts++;return route.fulfill(await bridge(r.url(),r.headers(),'POST',r.postData()));
   }catch(e){stage=e.message;return route.fulfill({status:409,contentType:'application/json',body:'{"error":"Guard stopped update"}'});}
  }
  const allowed=['/api/version','/api/state','/api/cards','/api/ticks'].includes(u.pathname)||u.pathname==='/d/'+token||u.pathname==='/d/'+token+'/ticks'||u.pathname.startsWith('/m/');
  if(!allowed)return route.abort();try{return route.fulfill(await bridge(r.url(),r.headers()));}catch(e){return route.abort();}
 });
 const p=await ctx.newPage();p.on('pageerror',()=>errors++);
 p.on('dialog',async d=>{if(d.type()==='confirm'&&d.message()==='Update the existing event tracker? Its printed completion codes will stay the same.')return d.accept();unexpected++;return d.dismiss();});
 await p.goto(HOST+'/e/'+EDIT+'#servicing',{waitUntil:'domcontentloaded',timeout:90000});
 await p.waitForFunction(()=>typeof SYNC!=='undefined'&&SYNC.status==='live'&&SYNC.level==='edit'&&!SYNC.readonly,null,{timeout:90000});
 await p.evaluate(()=>{document.getElementById('who').value='Andrew Fisher via Codex';});
 await p.locator('.svc1067-admin summary').click();
 await p.waitForFunction(()=>document.querySelector('[data-contact-name]')?.value&&document.querySelector('[data-contact-phone]')?.value);
 await p.locator('[data-test-checked]').check();await p.locator('[data-site-checked]').check();await p.locator('[data-make="event"]').click();
 await p.waitForFunction(()=>/Dry run captured|saved and read back|Guard stopped update/.test(document.querySelector('[data-admin-status]')?.textContent),null,{timeout:120000});
 const status=await p.locator('[data-admin-status]').textContent();guard(status.includes(EXECUTE?'saved and read back':'Dry run captured'),'native result '+stage);
 guard(postCount===1&&livePosts===(EXECUTE?1:0)&&unexpected===0,'one native attempt, no other writes');
 await browser.close();browser=null;
 const after=await snapshot('after');
 guard(eq(after.meta.tracker,before.meta.tracker)&&eq(after.meta.links,before.meta.links),'exact configuration and QR signatures retained');
 guard(historyPreserved(before,after),'all prior completion history retained');
 guard(eq(after.state,before.state)&&eq(after.version,before.version),'job record and version unchanged');
 guard(after.html_sha256===(EXECUTE?sha(payload.html):before.html_sha256),'exact crew HTML readback');
 guard(errors===0,'no page errors');
 const receipt={author:'Author: Andrew Fisher',status:'passed',mode:EXECUTE?'native publication':'dry capture',at:new Date().toISOString(),candidate_sha256:candidateHash,crew_sha256:sha(payload.html),captured_posts:postCount,live_posts:livePosts,unexpected_writes:unexpected,errors,checks};
 save('receipt.json',receipt);console.log(JSON.stringify({status:'passed',mode:receipt.mode,receipt:path.join(runDir,'receipt.json'),livePosts,checks:checks.length}));
})().catch(e=>{console.error(JSON.stringify({status:'blocked',stage,reason:e.message.includes(EDIT)?'redacted':e.message,captured_posts:postCount,live_posts:livePosts,unexpected_writes:unexpected}));process.exitCode=1;}).finally(async()=>{if(browser)await browser.close();});
