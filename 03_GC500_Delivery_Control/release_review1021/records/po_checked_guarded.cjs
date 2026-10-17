#!/usr/bin/env node
/* Author: Andrew Fisher. Native P/O checked-state operation with a durable backup and exact request gate.
   Default is practice: all document PUTs are simulated locally, never sent. --apply requires the reviewed live
   page SHA, the edit token and a private --audit-dir outside any checkout. No pre-start files are uploaded. */
'use strict';
const fs = require('fs'), path = require('path'), os = require('os'), crypto = require('crypto'), Module = require('module');
const {spawn} = require('child_process');
const G = require('./record_guard.cjs');
const ROOT = path.resolve(__dirname,'../..');
const original = path.join(ROOT,'record_15Oct2026_prestarts_signed/po_checked.cjs');
const args = process.argv.slice(2), value = flag => args.includes(flag) ? args[args.indexOf(flag)+1] : null;
const applying = args.includes('--apply'), token = process.env.GC500_EDIT_TOKEN || '';
const redact = s => token ? String(s).split(token).join('[key]') : String(s);
const sha = b => crypto.createHash('sha256').update(b).digest('hex');
const originalText = fs.readFileSync(original,'utf8');
if (sha(originalText) !== '4c4f565d7d50f3740280c9df85517a281d35e36a1159c77f099388da7f95d503') throw Error('Original helper changed; review the import again');
// Reuse the original read-only inspection/queue helpers without executing its weaker top-level write runner.
const cut = originalText.indexOf('(async () => {');
if (cut < 0 || originalText.indexOf('(async () => {',cut+1) >= 0) throw Error('Original runner boundary changed');
const imported = new Module(original,module); imported.filename=original; imported.paths=Module._nodeModulePaths(path.dirname(original));
imported._compile(originalText.slice(0,cut) + '\nmodule.exports={publicState,curlGet,pageReady,pageHasControls,pageDocs,pageSnapshot,holdSender,releaseSender,alignStartupQueue,playwright,spec,HOST,VIEW_TOKEN};',original);
const H = imported.exports;
if (!G.same(H.spec.numbers,G.NUMBERS) || H.spec.by !== 'Andrew Fisher') throw Error('Only the reviewed four-order confirmation spec is supported');
const spec = {numbers:G.NUMBERS, checkedBy:H.spec.by, actor:'Andrew Fisher via Codex', at:H.spec.at, note:H.spec.note};
let audit = value('--audit-dir');
if (!audit || !path.isAbsolute(audit)) throw Error('--audit-dir must be an absolute private folder outside any checkout');
audit=path.resolve(audit);
for(let p=audit;;p=path.dirname(p)) {
  if (fs.existsSync(path.join(p,'.git'))) throw Error('Private evidence must stay outside a Git checkout');
  if (path.dirname(p) === p) break;
}
fs.mkdirSync(audit,{recursive:true,mode:0o700}); fs.chmodSync(audit,0o700);
if (fs.existsSync(path.join(audit,'report.json'))) throw Error('Use a new private audit folder for every run');
const report = {author:'Andrew Fisher',executor:spec.actor,started:new Date().toISOString(),mode:applying?'apply':'practice',spec,sourceSha256:sha(originalText),stage:'started',requests:[],errors:[],verification:null};
const writeReport=()=>G.durableJson(path.join(audit,'report.json'),report,redact);
const log=s=>console.log(redact(s));
writeReport();

// Credentials and request bodies travel to curl over stdin, never command arguments or a retained config file.
let sequence=0;
function transfer(url,headers,method='GET',body=null) {
  const stem=path.join(os.tmpdir(),'gc500-guarded-po-'+process.pid+'-'+(++sequence));
  const hf=stem+'.headers', bf=stem+'.body';
  const quote=s=>'"'+String(s).replace(/\\/g,'\\\\').replace(/"/g,'\\"').replace(/\r/g,'\\r').replace(/\n/g,'\\n')+'"';
  const cfg=['url = '+quote(url),'request = '+quote(method),'silent','show-error','compressed','max-time = 60','dump-header = '+quote(hf),'output = '+quote(bf)];
  for(const [k,v] of Object.entries(headers||{})) if(!/^(host|connection|content-length|accept-encoding)$/i.test(k))cfg.push('header = '+quote(k+': '+v));
  if(body!==null)cfg.push('data-binary = '+quote(body));
  return new Promise((resolve,reject)=>{
    const c=spawn('curl',['--config','-'],{stdio:['pipe','ignore','pipe']});let err='';
    c.stderr.on('data',d=>err+=d);c.on('error',reject);
    c.on('close',code=>{
      try {
        if(code)throw Error(redact(err)||'curl failed');
        const blocks=fs.readFileSync(hf,'utf8').split(/\r?\n\r?\n/).filter(b=>/^HTTP\//.test(b));
        const lines=(blocks.at(-1)||'HTTP/1.1 0').split(/\r?\n/),status=Number(lines[0].split(' ')[1]),hd={};
        for(const line of lines.slice(1)){const i=line.indexOf(':');if(i>0){const key=line.slice(0,i).trim().toLowerCase();if(!/^(content-length|content-encoding|transfer-encoding|set-cookie)$/.test(key))hd[key]=line.slice(i+1).trim();}}
        resolve({status,headers:hd,body:fs.readFileSync(bf)});
      }catch(e){reject(e);}finally{fs.rmSync(hf,{force:true});fs.rmSync(bf,{force:true});}
    });
    c.stdin.end(cfg.join('\n')+'\n');
  });
}
function applyNative(spec) {
  if(typeof poReviewBasis1021!=='function'||typeof poReviewCurrent1021!=='function')throw Error('Reviewed P/O basis fix is not on this page');
  if(!window.__heldSend)throw Error('Native sender was not held');
  if(spec.practice){capability=()=> 'edit';mayWrite=()=>true;SYNC.readonly=false;SYNC.level='edit';}
  S.operator=spec.actor;
  if(whoAmI()!==spec.actor||!mayWrite('the purchase order'))throw Error('Native editor identity is not available');
  for(const no of spec.numbers){
    if(!(S.purchaseOrders||{})[no]||!poOf(no))throw Error('Missing recorded P/O '+no);
    if(!setPo(no,{checked:{by:spec.checkedBy,at:spec.at}}))throw Error('Native setPo refused '+no);
    const record=S.purchaseOrders[no];
    if(!record.checked||record.checked.basis!==poReviewBasis1021(poOf(no))||!poReviewCurrent1021(poOf(no)))throw Error('Native reviewed basis missing or stale for '+no);
  }
  syncStage();
  return true;
}

(async()=>{
  let browser=null,page=null,before=null,plan=[],fatal=null,released=false,held=false,forwarding=Promise.resolve();
  let expected=new Map(),seen=new Set(),simulated=new Set(),lastAckVersion=0,passed=false;
  const stop=e=>{released=false;const msg=redact(e&&e.message||e);if(!fatal)fatal=Error(msg);report.errors.push(msg);writeReport();};
  try{
    if(applying&&(!token||!/^[a-f0-9]{64}$/.test(process.env.GC500_EXPECTED_PAGE_SHA||'')))throw Error('Apply needs GC500_EDIT_TOKEN and GC500_EXPECTED_PAGE_SHA');
    if(applying&&(value('--page')||process.env.PAGE))throw Error('Apply must use the reviewed public page, not a local substitution');
    before=await H.publicState();lastAckVersion=before.version;
    G.durableJson(path.join(audit,'before-state.json'),before,redact);
    report.before={version:before.version,updated:before.updated,sha256:sha(G.canon(before)),file:'before-state.json'};report.stage='backup-durable';writeReport();
    const localPage=value('--page')||process.env.PAGE;
    let pageBody;
    if(localPage)pageBody=fs.readFileSync(localPage);
    else{const r=await H.curlGet(H.HOST+'/v/'+H.VIEW_TOKEN,{'cache-control':'no-cache'});if(r.status!==200)throw Error('Public page unavailable');pageBody=r.body;}
    report.pageSha256=sha(pageBody);writeReport();
    if(applying&&report.pageSha256!==process.env.GC500_EXPECTED_PAGE_SHA)throw Error('Public page differs from the reviewed release');
    const {chromium}=H.playwright(),launch={args:['--no-sandbox','--lang=en-AU']};
    if(process.env.CHROMIUM_PATH)launch.executablePath=process.env.CHROMIUM_PATH;
    browser=await chromium.launch(launch);
    const context=await browser.newContext({viewport:{width:1280,height:900},locale:'en-AU',timezoneId:'Australia/Brisbane'});page=await context.newPage();
    page.on('pageerror',e=>stop('Page error: '+e.message));
    await context.route('**/*',async route=>{
      const req=route.request();let u;try{u=new URL(req.url());}catch(_){return route.abort();}
      if(u.protocol==='data:'||u.protocol==='blob:')return route.continue();
      if(req.method()==='GET'){
        try{
          const isPage=u.origin===H.HOST&&(u.pathname==='/v/'+H.VIEW_TOKEN||u.pathname==='/v/'+H.VIEW_TOKEN+'/'||(applying&&u.pathname==='/e/'+token));
          if(isPage)return route.fulfill({status:200,contentType:'text/html; charset=utf-8',body:pageBody});
          if(u.origin===H.HOST&&u.pathname==='/api/state'&&!held){await page.evaluate(H.holdSender);held=true;}
          const response=await transfer(req.url(),req.headers());
          if(!applying&&u.origin===H.HOST&&u.pathname==='/api/version'&&response.status===200){const b=JSON.parse(response.body);b.level='edit';response.body=Buffer.from(JSON.stringify(b));}
          return route.fulfill(response);
        }catch(e){if(u.origin===H.HOST&&u.pathname.startsWith('/api/'))stop(e);return route.abort();}
      }
      if(req.method()==='POST'&&u.origin==='https://tile.googleapis.com'&&u.pathname==='/v1/createSession')return route.abort();
      // Serialize the native sender's requests so a failed acknowledgement prevents any later PUT reaching the server.
      const handle=async()=>{
        let key;
        try{
          key=G.requestKey(req.url(),req.method(),H.HOST);
          const body=JSON.parse(req.postData()||'null');
          if(!released||fatal||!expected.has(key)||!G.same(body,expected.get(key)))throw Error('Native request differs from the durable request plan: '+key);
          if(seen.has(key))throw Error('Automatic retry refused: '+key);
          seen.add(key);
          const record={key,attempted:new Date().toISOString(),mode:applying?'sent':'simulated',http:null,ackVersion:null};
          report.requests.push(record);writeReport();
          let response;
          if(applying){
            response=await transfer(req.url(),req.headers(),'PUT',req.postData());
            record.http=response.status;
            record.ackVersion=G.checkAck(response.status,response.body,lastAckVersion);lastAckVersion=record.ackVersion;
          }else{
            simulated.add(key);record.http=200;record.ackVersion=++lastAckVersion;
            response={status:200,contentType:'application/json',body:JSON.stringify({version:lastAckVersion})};
          }
          record.acknowledged=new Date().toISOString();writeReport();
          return route.fulfill(response);
        }catch(e){stop(e);return route.abort();}
      };
      forwarding=forwarding.then(handle,handle);await forwarding;
    });
    await page.goto(H.HOST+(applying?'/e/'+token:'/v/'+H.VIEW_TOKEN)+'#fencing',{waitUntil:'load',timeout:180000});
    await page.waitForFunction(H.pageReady,null,{timeout:180000});
    if(fatal)throw fatal;
    const controls=await page.evaluate(H.pageHasControls);
    if(controls.missing.length||!controls.hasS||!controls.hasColls)throw Error('Required native page controls missing');
    if(applying&&(controls.level!=='edit'||controls.readonly))throw Error('Service did not grant edit access');
    const pageBefore=await page.evaluate(H.pageDocs);
    // The service omits unused collections; pageDocs includes every SYNC_COLLS key with {}.
    // Compare all document paths and values, retaining the exact snapshots for diagnosis.
    const startupDiff=G.changed(before.docs,pageBefore);
    G.durableJson(path.join(audit,'page-before-state.json'),{docs:pageBefore},redact);
    report.startupComparison={file:'page-before-state.json',changedDocuments:startupDiff,
      emptyCollectionsOnlyOnPage:Object.keys(pageBefore).filter(k=>!(k in before.docs)&&!Object.keys(pageBefore[k]).length),
      emptyCollectionsOnlyOnService:Object.keys(before.docs).filter(k=>!(k in pageBefore)&&!Object.keys(before.docs[k]).length)};
    writeReport();
    if(startupDiff.length)throw Error('Page and saved native documents differ ('+startupDiff.slice(0,8).join(', ')+'); no changes released');
    report.startupAlignment=await page.evaluate(H.alignStartupQueue,before.docs);
    await page.evaluate(applyNative,{...spec,practice:!applying});
    const pageAfter=await page.evaluate(H.pageDocs);
    plan=G.makePlan(before.docs,pageAfter,spec);expected=new Map(plan.map(p=>[p.key,p.body]));
    const queued=(await page.evaluate(H.pageSnapshot,G.NUMBERS)).queue;
    const queuedPlan=Object.entries(queued).flatMap(([c,docs])=>Object.entries(docs).map(([id,body])=>({key:c+'/'+id,body}))).sort((a,b)=>a.key.localeCompare(b.key));
    if(!G.same(queuedPlan,plan.slice().sort((a,b)=>a.key.localeCompare(b.key))))throw Error('Native queue is not exactly the reviewed diff');
    G.durableJson(path.join(audit,'request-plan.json'),{author:'Andrew Fisher',mode:report.mode,spec,pageSha256:report.pageSha256,beforeSha256:report.before.sha256,requests:plan},redact);
    report.plan={file:'request-plan.json',count:plan.length,keys:plan.map(p=>p.key)};report.stage='plan-durable';writeReport();
    const current=await H.publicState();
    if(!G.same(current.docs,before.docs)||current.version!==before.version)throw Error('Native record changed before release; no writes sent');
    if(applying){const currentPage=await H.curlGet(H.HOST+'/v/'+H.VIEW_TOKEN,{'cache-control':'no-cache'});if(currentPage.status!==200||sha(currentPage.body)!==report.pageSha256)throw Error('Public page changed before release');}
    if(fatal)throw fatal;
    report.stage=applying?'releasing':'simulating';writeReport();released=true;
    await page.evaluate(H.releaseSender);
    const deadline=Date.now()+90000;
    while(true){
      if(fatal)throw fatal;
      const st=await page.evaluate(()=>({waiting:syncWaiting(),inflight:Object.keys(SYNC.inflight||{}).length,unkept:!!SYNC.unkept,status:SYNC.status}));
      const acknowledged=report.requests.filter(r=>r.acknowledged).length;
      if(acknowledged===plan.length&&!st.waiting&&!st.inflight)break;
      if(st.unkept||Date.now()>deadline)throw Error('Native writes did not settle; inspect partial report before any retry');
      await new Promise(r=>setTimeout(r,150));
    }
    released=false;passed=true;report.stage='native-sender-settled';writeReport();
  }catch(e){stop(e);}
  finally{
    released=false;
    // Wait for an already admitted native request before closing. Unreleased requests can never pass the gate.
    await forwarding.catch(()=>{});
    if(browser)await browser.close().catch(e=>stop(e));
    if(before){
      try{
        const after=await H.publicState();G.durableJson(path.join(audit,'after-state.json'),after,redact);
        report.after={version:after.version,updated:after.updated,file:'after-state.json',sha256:sha(G.canon(after))};
        report.verification=applying?G.verify(before.docs,after.docs,plan,passed):G.verify(before.docs,after.docs,[],true);
        if(!report.verification.ok){passed=false;report.errors.push('Fresh whole-native verification failed; no automatic repair or retry');}
        if(!applying&&after.version!==before.version){passed=false;report.errors.push('Native record version changed during practice');}
      }catch(e){passed=false;report.errors.push('Fresh whole-native readback failed: '+redact(e.message));}
    }
    report.finished=new Date().toISOString();report.result=passed&&!fatal?'VERIFIED':'INCOMPLETE';report.stage='finished';writeReport();
    log(report.result+' '+report.mode+': '+report.requests.filter(r=>r.acknowledged).length+' acknowledged native document requests; '+audit+'/report.json');
    if(report.errors.length)log(report.errors.join('\n'));
    process.exitCode=report.result==='VERIFIED'?0:1;
  }
})();
