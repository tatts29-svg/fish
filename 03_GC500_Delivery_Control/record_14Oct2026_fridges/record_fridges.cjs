// Author: Andrew Fisher. User-requested native record changes with backup, exact write gate and readback.
'use strict';
const fs=require('fs'),path=require('path'),crypto=require('crypto'),os=require('os'),{spawn}=require('child_process');
const args=process.argv.slice(2),scope='fridges';
if(!['--practice','--apply'].includes(args[0])||args.length!==1)throw Error('Use --practice|--apply');
const modulePath=path.join(__dirname,'native_fridges.cjs');
const {prepare,apply,verify}=require(modulePath);
const token=process.env.GC500_EDIT_TOKEN,expectedPage=process.env.GC500_EXPECTED_PAGE_SHA;
const applying=args[0]==='--apply';
if(applying&&(!token||!/^[a-f0-9]{64}$/.test(expectedPage||'')))throw Error('Private edit credential and exact published page hash required');
const HOST='https://gc500-production.up.railway.app',OPERATOR='Andrew Fisher via Codex';
const OUT=path.join('/workspace/private-fridges14Oct2026','record_14Oct2026_'+scope+'_'+new Date().toISOString().replace(/[:.]/g,'-'));fs.mkdirSync(OUT,{recursive:false,mode:0o700});
const canon=x=>JSON.stringify((function sort(v){return Array.isArray(v)?v.map(sort):v&&typeof v==='object'?Object.fromEntries(Object.keys(v).sort().map(k=>[k,sort(v[k])])):v})(x));
const same=(a,b)=>canon(a)===canon(b),clone=x=>JSON.parse(JSON.stringify(x)),hash=x=>crypto.createHash('sha256').update(x).digest('hex');
const compact=docs=>Object.fromEntries(Object.entries(docs).filter(([,v])=>Object.keys(v||{}).length));
function compareDocs(actual,expected,label){if(!same(compact(actual),compact(expected)))throw Error(label+' differs from full expected record');}
const redact=value=>token?String(value).split(token).join('[redacted]'):String(value);
const save=(name,value)=>fs.writeFileSync(path.join(OUT,name),redact(JSON.stringify(value,null,2))+'\n',{mode:0o600});
const requests=[],held=[];let fatal=null,writesAllowed=false,releaseGate;const writeGate=new Promise(resolve=>releaseGate=resolve);
const stop=message=>{writesAllowed=false;fatal=fatal||Error(redact(message));releaseGate();};
const quote=value=>'"'+String(value).replace(/\\/g,'\\\\').replace(/"/g,'\\"').replace(/\r/g,'\\r').replace(/\n/g,'\\n')+'"';let seq=0;
function captureNative(){return JSON.parse(JSON.stringify({docs:Object.fromEntries(Object.keys(SYNC_COLLS).map(k=>[k,toDocs(k)])),state:S,queue:SYNC.queue,inflight:SYNC.inflight,summary:Supplier996.model().summary}));}
function restoreUnchangedNative(input){
 const canonical=value=>fencePaperCanonical898(value),clone=value=>JSON.parse(JSON.stringify(value));
 const fail=message=>{throw Error(message);};
 if(!window.__nativeCorrectionSendFridges||Object.keys(SYNC.inflight||{}).length)fail('Native writer was not paused before startup writes');
 const before=Object.fromEntries(Object.keys(SYNC_COLLS).map(k=>[k,toDocs(k)])),restored=[];
 for(const [name,queue]of Object.entries(SYNC.queue||{})){
  if(!Object.keys(queue).length||false)continue;
  const original=input.beforeDocs[name]||{};
  // Only JSON property order may differ. Real concurrent edits never pass this guard.
  if(canonical(before[name]||{})!==canonical(original))fail('Unrelated queued collection has changed values: '+name);
  for(const [id,body]of Object.entries(queue))if(body===null||canonical(body)!==canonical(original[id]))fail('Queued document is not a serialization-only no-op: '+name+'/'+id);
  SYNC_COLLS[name].set(fromDocs(name,clone(original)));restored.push(name);
 }
 const after=Object.fromEntries(Object.keys(SYNC_COLLS).map(k=>[k,toDocs(k)]));
 if(canonical(before)!==canonical(after))fail('Restoring server key order changed record values');
 if(!persist()||SYNC.unkept)fail('Could not retain native serialization alignment');
 syncStage();
 for(const [name,queue]of Object.entries(SYNC.queue||{}))if(!false&&Object.keys(queue).length)fail('Unrelated queue remains after native serialization alignment: '+name);
 return clone({restored,docs:after,queue:SYNC.queue});
}
async function fetchSafe(url,headers={},method='GET',body=null){
 const tmp=path.join(os.tmpdir(),'gc500-fridges-'+process.pid+'-'+(++seq)),hf=tmp+'.headers',bf=tmp+'.body';
 const config=['url = '+quote(url),'request = '+quote(method),'silent','show-error','compressed','max-time = 60','dump-header = '+quote(hf),'output = '+quote(bf)];
 for(const [k,v]of Object.entries(headers))if(!/^(host|connection|content-length|accept-encoding)$/i.test(k))config.push('header = '+quote(k+': '+v));
 if(body!=null)config.push('data-binary = '+quote(body));
 try{
  await new Promise((resolve,reject)=>{const child=spawn('curl',['--config','-'],{stdio:['pipe','ignore','pipe']});let error='';child.stderr.on('data',data=>error+=data);child.on('error',reject);child.on('close',code=>code?reject(Error(redact(error)||'Request failed')):resolve());child.stdin.end(config.join('\n')+'\n');});
  const blocks=fs.readFileSync(hf,'utf8').split(/\r?\n\r?\n/).filter(x=>/^HTTP\//.test(x)),lines=blocks.at(-1).split(/\r?\n/),status=Number(lines.shift().split(' ')[1]),hd={};
  for(const line of lines){const i=line.indexOf(':');if(i>0&&!/^(content-length|content-encoding|transfer-encoding|set-cookie)$/i.test(line.slice(0,i)))hd[line.slice(0,i).toLowerCase()]=line.slice(i+1).trim();}
  return{status,headers:hd,body:fs.readFileSync(bf)};
 }finally{fs.rmSync(hf,{force:true});fs.rmSync(bf,{force:true});}
}
async function publicState(){const response=await fetchSafe(HOST+'/api/state',{'x-gc500-token':'Coates-GC500-2026','cache-control':'no-cache'});if(response.status!==200)throw Error('Public record read failed: '+response.status);return JSON.parse(response.body);}

(async()=>{let browser,p,h;const expectedWrites=new Map(),receipts=new Set(),attempted=new Set();try{
 const before=await publicState();save('before-public.json',before);
 if(applying){
  const live=await fetchSafe(HOST+'/v/Coates-GC500-2026',{'cache-control':'no-cache'});
  if(live.status!==200||hash(live.body)!==expectedPage)throw Error('Published page differs from reviewed release');
  save('page-proof.json',{author:'Andrew Fisher',sha256:expectedPage,bytes:live.body.length});
  const {chromium}=require('playwright');browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||'/usr/bin/chromium',args:['--no-sandbox']});
  const ctx=await browser.newContext({viewport:{width:1280,height:900},locale:'en-AU',timezoneId:'Australia/Brisbane'});
  await ctx.route('**/*',async route=>{const req=route.request(),url=req.url(),method=req.method();if(url.startsWith('data:')||url.startsWith('blob:'))return route.continue();let proof;
   try{
    if(method==='POST'&&new URL(url).origin==='https://tile.googleapis.com'&&new URL(url).pathname==='/v1/createSession')return route.abort();
    if(method!=='GET'){
     const match=new URL(url).origin===HOST&&new URL(url).pathname.match(/^\/api\/doc\/([^/]+)\/([^/]+)$/);
     if(!match||!['PUT','DELETE'].includes(method))throw Error('Blocked non-document mutation');
     const collection=decodeURIComponent(match[1]),id=decodeURIComponent(match[2]),key=collection+'/'+id,body=method==='DELETE'?null:JSON.parse(req.postData()||'null');
     held.push({method,collection,id,body});await writeGate;
     if(fatal||!writesAllowed)throw Error('Write gate is closed');
     const expected=expectedWrites.get(key);
     if(!expected||expected.method!==method||!same(expected.body,body))throw Error('Unexpected native mutation: '+key);
     if(attempted.has(key))throw Error('Automatic retry refused: '+key);attempted.add(key);
     proof={method,collection,id,body,started:new Date().toISOString(),status:null};requests.push(proof);save('write-requests.json',requests);
    }
    const response=await fetchSafe(url,req.headers(),method,req.postData());
    if(proof){proof.status=response.status;proof.finished=new Date().toISOString();save('write-requests.json',requests);if(response.status!==200)throw Error('Correction returned '+response.status);receipts.add(proof.collection+'/'+proof.id);}
    if(!writesAllowed&&method==='GET'&&new URL(url).origin===HOST&&new URL(url).pathname==='/api/state'){
     await p.evaluate(()=>{if(!window.__nativeCorrectionSendFridges){if(typeof syncSend!=='function')throw Error('Native writer unavailable');window.__nativeCorrectionSendFridges=syncSend;syncSend=function(){clearTimeout(SYNC.timer);SYNC.timer=null;syncStage();};}});
    }
    await route.fulfill(response);
   }catch(error){stop(error.message);save('transport-failure.json',{message:fatal.message,requests});await route.abort();}
  });
  p=await ctx.newPage();p.on('pageerror',error=>stop('Page error: '+error.message));
  await p.goto(HOST+'/e/'+token,{waitUntil:'load',timeout:180000});
 }else{
  const {open}=require('/workspace/gc500-current-release/03_GC500_Delivery_Control/toolchain/harness/open_page');
  h=await open({pageFile:process.env.PAGE,hash:'#runsheet'});browser=h.browser;p=h.page;
 }
 await p.waitForFunction(()=>SYNC.status==='live'&&SYNC.first.size===Object.keys(SYNC_COLLS).length,null,{timeout:180000});
 if(fatal)throw fatal;
 if(applying)await p.evaluate(()=>{const control=document.getElementById('who');if(!control)throw Error('Native operator control missing');control.value='Andrew Fisher via Codex';control.dispatchEvent(new Event('change',{bubbles:true}));});
 else await p.evaluate(()=>{S.operator='Andrew Fisher via Codex';capability=()=> 'edit';mayWrite=()=>true;whoAmI=()=> 'Andrew Fisher via Codex';SYNC.readonly=false;SYNC.level='edit';window.__nativeCorrectionSendFridges=syncSend;syncSend=function(){clearTimeout(SYNC.timer);SYNC.timer=null;syncStage();};});
 const pageBefore=await p.evaluate(captureNative);save('before-page.json',pageBefore);compareDocs(pageBefore.docs,before.docs,'Initial native read');
 compareDocs((await publicState()).docs,before.docs,'Fresh record before staging');
 const aligned=await p.evaluate(restoreUnchangedNative,{beforeDocs:before.docs});save('serialization-alignment.json',aligned);
 const plan=await p.evaluate(prepare);save('proposal.json',plan);
 const applyHere=applying?apply:new Function('return function(plan){SYNC.readonly=false;SYNC.level=\'edit\';return ('+apply.toString()+')(plan);}')();
 const staged=await p.evaluate(applyHere,plan);save('native-proposal.json',staged);
 const check=verify(staged,plan);save('verification.json',check);if(!check.pass)throw Error('Native proposal verification failed');
 const after=staged.after;for(const c of new Set([...Object.keys(before.docs),...Object.keys(after)]))for(const id of new Set([...Object.keys(before.docs[c]||{}),...Object.keys(after[c]||{})])){
  const was=before.docs[c]?.[id]??null,next=after[c]?.[id]??null;if(same(was,next))continue;expectedWrites.set(c+'/'+id,{method:next===null?'DELETE':'PUT',collection:c,id,body:next});
 }
 for(const [c,queue]of Object.entries(staged.queue||{}))for(const [id,value]of Object.entries(queue)){const want=expectedWrites.get(c+'/'+id);if(!want||!same(want.body,value))throw Error('Unexpected queued write: '+c+'/'+id);}
 for(const w of held){const want=expectedWrites.get(w.collection+'/'+w.id);if(!want||want.method!==w.method||!same(want.body,w.body))throw Error('Unexpected held write');}
 save('expected-writes.json',[...expectedWrites.values()]);
 if(!applying){if(h.errors.length||h.counts.blocked)throw Error('Practice browser had errors or attempted writes');save('result.json',{author:'Andrew Fisher',pass:true,practice:true,plannedWrites:expectedWrites.size,serverWrites:0});console.log(JSON.stringify({pass:true,practice:true,plannedWrites:expectedWrites.size,serverWrites:0,out:OUT}));return;}
 compareDocs((await publicState()).docs,before.docs,'Final pre-write record');if(fatal)throw fatal;
 writesAllowed=true;releaseGate();await p.evaluate(()=>{syncSend=window.__nativeCorrectionSendFridges;delete window.__nativeCorrectionSendFridges;syncSend();});
 const deadline=Date.now()+120000;
 while(true){if(fatal)throw fatal;const status=await p.evaluate(()=>({on:SYNC.on,status:SYNC.status,unkept:SYNC.unkept,waiting:syncWaiting()}));
  if(!status.on||status.unkept||['offline','unreachable','error','stopped','paused'].includes(status.status))throw Error('Sync unhealthy; inspect receipts before retry');
  if([...expectedWrites.keys()].every(key=>receipts.has(key))&&status.waiting===0&&status.status==='live')break;
  if(Date.now()>deadline)throw Error('Durable acknowledgement missing; no automatic retry');await new Promise(resolve=>setTimeout(resolve,100));
 }
 writesAllowed=false;
 const readback=await publicState();save('after-public.json',readback);compareDocs(readback.docs,after,'Fresh public readback');
 const pageAfter=await p.evaluate(captureNative);save('after-page.json',pageAfter);compareDocs(pageAfter.docs,after,'Native readback');
 save('result.json',{author:'Andrew Fisher',pass:true,scope,beforeVersion:before.version,afterVersion:readback.version,writes:receipts.size,allOtherSharedFieldsUnchanged:true});
 console.log(JSON.stringify({pass:true,scope,beforeVersion:before.version,afterVersion:readback.version,writes:receipts.size,out:OUT}));
 }catch(error){stop(error.message);save('failure.json',{message:redact(error.stack),requests,note:'No automatic retry. Inspect partial receipts first.'});console.error(redact(error.stack));process.exitCode=1;}
 finally{writesAllowed=false;releaseGate();if(browser)await browser.close();}
})();
