// Author: Andrew Fisher. Reviewed duplicate reconciliation; no writes without --apply.
'use strict';
const fs=require('fs'),path=require('path'),crypto=require('crypto'),os=require('os'),{spawn}=require('child_process');
const PRIVATE=process.env.PRIVATE||process.env.AUDIT_DIR||'/workspace/private-gc500-conflict1003';
const PROOF=process.env.GC500_REVIEWED_CORRECTION_DIR||'/workspace/private-gc500-fencing996/correction_2026-10-11T16-38-38-457Z';
const HOST='https://gc500-production.up.railway.app',BASE='F-AFV-0002',OPERATOR='Andrew Fisher via Codex',SCOPE='fencing-duplicate-reconciliation-1003';
const clone=x=>JSON.parse(JSON.stringify(x));
const canon=x=>JSON.stringify((function sort(v){return Array.isArray(v)?v.map(sort):v&&typeof v==='object'?Object.fromEntries(Object.keys(v).sort().map(k=>[k,sort(v[k])])):v})(x));
const hash=x=>crypto.createHash('sha256').update(x).digest('hex');
const same=(a,b)=>canon(a)===canon(b);
const docId=key=>{const enc=[...String(key)].map(ch=>/[A-Za-z0-9_\-.:@+]/.test(ch)?ch:'~'+ch.codePointAt(0).toString(16)+'~').join('');return enc==='.'||enc==='..'||!enc?'~'+enc.length+'~':enc.slice(0,180);};
const reviewed={old:JSON.parse(fs.readFileSync(path.join(PROOF,'before-public.json'))).docs.fenceDockets[BASE],corrected:JSON.parse(fs.readFileSync(path.join(PROOF,'after-public.json'))).docs.fenceDockets[BASE]};
if(hash(canon(reviewed.old))!=='fbd2869c2edf878712332b5401973b557d05a0eceab3014dc8a245c99b2cc0d7'||hash(canon(reviewed.corrected))!=='ddb668fd2e39077ab1b2effe9a1d4dfd77793f5fd294d1f15b142fe29b420a61')throw Error('Reviewed historical snapshots changed');
const variants=[['3529','corrected'],['bed7','old']].map(([suffix,kind])=>{const id=BASE+'·'+suffix;return{key:docId(id),body:{...clone(reviewed[kind]),id,_k:id}};});
function targetDocs(docs){
 const rows=docs.fenceDockets||{},family=Object.entries(rows).filter(([k,v])=>k.startsWith(BASE)||String(v?.id||'').startsWith(BASE)||String(v?.docket_no||'')==='36560');
 if(family.length===1&&family[0][0]===BASE&&same(family[0][1],reviewed.corrected))return{alreadyClean:true,docs:clone(docs),writes:[]};
 if(rows[BASE]||family.length!==2||variants.some(v=>!same(rows[v.key],v.body)))throw Error('Current shared docket is not the exact reviewed pair; no automatic retry or deletion');
 const expected=clone(docs);for(const v of variants)delete expected.fenceDockets[v.key];expected.fenceDockets[BASE]=clone(reviewed.corrected);
 return{alreadyClean:false,docs:expected,writes:[{method:'PUT',collection:'fenceDockets',id:BASE,body:clone(reviewed.corrected)},...variants.map(v=>({method:'DELETE',collection:'fenceDockets',id:v.key,body:null}))]};
}
function compact(docs){return Object.fromEntries(Object.entries(docs).filter(([,v])=>Object.keys(v||{}).length));}
function compareDocs(actual,expected,label){if(!same(compact(actual),compact(expected)))throw Error(label+' differs from expected full shared document set');}
function captureNative(){return JSON.parse(JSON.stringify({docs:Object.fromEntries(Object.keys(SYNC_COLLS).map(k=>[k,toDocs(k)])),state:S,queue:SYNC.queue,inflight:SYNC.inflight,financial:{actual:fenceDerived(),forecast:cj764Fencing()}}));}
function stageNative(input){
 const canonical=value=>fencePaperCanonical898(value),clone=value=>JSON.parse(JSON.stringify(value));
 const compact=docs=>Object.fromEntries(Object.entries(docs).filter(([,v])=>Object.keys(v||{}).length));
 const fail=message=>{throw Error(message);};
 if(input.scope!=='fencing-duplicate-reconciliation-1003'||input.operator!=='Andrew Fisher via Codex'||!mayWrite('reviewed fencing duplicate reconciliation')||whoAmI()!==input.operator)fail('Named correction authority missing');
 if(SYNC.readonly||SYNC.status!=='live'||SYNC.unkept||SYNC.first.size!==Object.keys(SYNC_COLLS).length)fail('Native shared record is not ready');
 const before=clone(S),docs=Object.fromEntries(Object.keys(SYNC_COLLS).map(k=>[k,toDocs(k)]));
 if(canonical(compact(docs))!==canonical(compact(input.projectedDocs)))fail('Native projection changed before correction');
 const rows=(S.fenceDockets||[]).filter(r=>r.id==='F-AFV-0002'||String(r.id||'').startsWith('F-AFV-0002·')||String(r.docket_no||'')==='36560');
 const expected=clone(input.corrected);delete expected._k;
 if(rows.length!==1||canonical(rows[0])!==canonical(expected))fail('Native projection did not retain exactly one corrected docket');
 const financialBefore={actual:fenceDerived(),forecast:cj764Fencing()};
 S.fenceDockets=S.fenceDockets.map(row=>row.id==='F-AFV-0002'?clone(expected):row);
 stampIt('fenceDockets','F-AFV-0002',input.operator);bump();
 if(bump.kept===false||SYNC.unkept)fail('Native save did not keep correction');
 const after=Object.fromEntries(Object.keys(SYNC_COLLS).map(k=>[k,toDocs(k)]));
 const financialAfter={actual:fenceDerived(),forecast:cj764Fencing()};
 if(canonical(financialBefore)!==canonical(financialAfter))fail('Cleaning shared duplicate identities changed the already corrected native projection totals');
 for(const key of new Set([...Object.keys(before),...Object.keys(S)]))if(!['fenceDockets','stamps','by','saved','changes'].includes(key)&&canonical(before[key])!==canonical(S[key]))fail('Unrelated local field changed: '+key);
 return clone({before:docs,after,state:S,queue:SYNC.queue,financialBefore,financialAfter});
}
const args=process.argv.slice(2),validation={author:'Andrew Fisher',scope:SCOPE,pass:true,networkCalls:0,mutations:0,reviewedOldSha256:hash(canon(reviewed.old)),reviewedCorrectedSha256:hash(canon(reviewed.corrected)),deleteIds:variants.map(v=>v.key)};
if(!args.length){console.log(JSON.stringify(validation,null,2));process.exit(0);}
if(!same(args,['--apply','--scope',SCOPE]))throw Error('No accepted apply scope supplied');
const token=process.env.GC500_EDIT_TOKEN,expectedPage=process.env.GC500_EXPECTED_PAGE_SHA;
if(!token||!/^[a-f0-9]{64}$/.test(expectedPage||''))throw Error('Edit credential and reviewed GC500_EXPECTED_PAGE_SHA required');
const {chromium}=require('playwright'),OUT=path.join(PRIVATE,'record_'+new Date().toISOString().replace(/[:.]/g,'-')+'_fencing_duplicate');fs.mkdirSync(OUT,{recursive:false});
const redact=value=>String(value).split(token).join('[redacted]');
const save=(name,value)=>fs.writeFileSync(path.join(OUT,name),redact(JSON.stringify(value,null,2))+'\n');
const requests=[],held=[];let fatal=null,writesAllowed=false,releaseGate;const writeGate=new Promise(resolve=>releaseGate=resolve);
const stop=message=>{writesAllowed=false;fatal=fatal||Error(redact(message));releaseGate();};
const quote=value=>'"'+String(value).replace(/\\/g,'\\\\').replace(/"/g,'\\"').replace(/\r/g,'\\r').replace(/\n/g,'\\n')+'"';let seq=0;
async function fetchSafe(url,headers={},method='GET',body=null){
 const tmp=path.join(os.tmpdir(),'gc500-correction1003-'+process.pid+'-'+(++seq)),hf=tmp+'.headers',bf=tmp+'.body';
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
(async()=>{let browser;const expectedWrites=new Map(),receipts=new Set(),attempted=new Set();try{
 save('validation.json',validation);
 const live=await fetchSafe(HOST+'/v/Coates-GC500-2026',{'cache-control':'no-cache'});
 if(live.status!==200||hash(live.body)!==expectedPage||!live.body.toString().includes('1003'))throw Error('Published page differs from reviewed reconciliation release');
 save('page-proof.json',{author:'Andrew Fisher',sha256:expectedPage,bytes:live.body.length});
 const before=await publicState();save('before-public.json',before);const proposed=targetDocs(before.docs);save('proposal.json',{author:'Andrew Fisher',scope:SCOPE,operator:OPERATOR,...proposed});
 if(proposed.alreadyClean){save('result.json',{author:'Andrew Fisher',pass:true,alreadyClean:true,version:before.version,writes:0});console.log(JSON.stringify({pass:true,alreadyClean:true,version:before.version,writes:0}));return;}
 browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||'/usr/bin/chromium',args:['--no-sandbox']});
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
    if(!expected||expected.method!==method||!same(expected.body,body)||(method==='DELETE'&&req.postData()!=null&&req.postData()!==''))throw Error('Unexpected mutation payload: '+key);
    if(attempted.has(key))throw Error('Automatic retry refused: '+key);attempted.add(key);
    proof={method,collection,id,body,started:new Date().toISOString(),status:null};requests.push(proof);save('write-requests.json',requests);
   }
   const response=await fetchSafe(url,req.headers(),method,req.postData());
   if(proof){proof.status=response.status;proof.finished=new Date().toISOString();save('write-requests.json',requests);if(response.status!==200)throw Error('Correction returned '+response.status);receipts.add(proof.collection+'/'+proof.id);}
   await route.fulfill(response);
  }catch(error){stop(error.message);save('transport-failure.json',{message:fatal.message,requests});await route.abort();}
 });
 const p=await ctx.newPage();p.on('pageerror',error=>stop('Page error: '+error.message));
 await p.goto(HOST+'/e/'+token,{waitUntil:'load',timeout:180000});
 await p.waitForFunction(()=>SYNC.status==='live'&&!SYNC.readonly&&!SYNC.unkept&&SYNC.first.size===Object.keys(SYNC_COLLS).length,null,{timeout:180000});
 if(fatal)throw fatal;
 await p.evaluate(()=>{const control=document.getElementById('who');if(!control)throw Error('Native operator control missing');control.value='Andrew Fisher via Codex';control.dispatchEvent(new Event('change',{bubbles:true}));});
 const pageBefore=await p.evaluate(captureNative);save('before-page.json',pageBefore);compareDocs(pageBefore.docs,proposed.docs,'Initial native projection');
 compareDocs((await publicState()).docs,before.docs,'Fresh pre-write record');if(fatal)throw fatal;
 const staged=await p.evaluate(stageNative,{scope:SCOPE,operator:OPERATOR,projectedDocs:proposed.docs,corrected:reviewed.corrected});save('native-proposal.json',staged);
 const expected=clone(proposed.docs),stampId=docId('fenceDockets/'+BASE),stamp=staged.after.stamps?.[stampId],by=staged.after.by?.[stampId];
 if(!stamp||stamp._k!=='fenceDockets/'+BASE||!Number.isFinite(Date.parse(stamp.v))||Date.now()-Date.parse(stamp.v)>60000||Date.parse(stamp.v)>Date.now()+1000||!by||by._k!=='fenceDockets/'+BASE||by.v!==OPERATOR)throw Error('Native reconciliation stamp or operator missing');
 expected.stamps||={};expected.stamps[stampId]=stamp;expected.by||={};expected.by[stampId]=by;
 compareDocs(staged.after,expected,'Native staged record');
 for(const write of proposed.writes)expectedWrites.set(write.collection+'/'+write.id,write);
 for(const collection of ['stamps','by'])if(!same(before.docs[collection]?.[stampId],expected[collection][stampId]))expectedWrites.set(collection+'/'+stampId,{method:'PUT',collection,id:stampId,body:expected[collection][stampId]});
 for(const [collection,queue]of Object.entries(staged.queue||{}))for(const [id,body]of Object.entries(queue)){
  const want=expectedWrites.get(collection+'/'+id);if(!want||!same(want.body,body))throw Error('Unexpected queued native write: '+collection+'/'+id);
 }
 for(const write of held){const want=expectedWrites.get(write.collection+'/'+write.id);if(!want||want.method!==write.method||!same(want.body,write.body))throw Error('Unexpected held native write');}
 // Confirm the server still matches the backed-up record immediately before releasing writes.
 compareDocs((await publicState()).docs,before.docs,'Final pre-write record');if(fatal)throw fatal;
 save('expected-writes.json',[...expectedWrites.values()]);writesAllowed=true;releaseGate();await p.evaluate(()=>syncSend());
 const deadline=Date.now()+120000;
 while(true){if(fatal)throw fatal;const status=await p.evaluate(()=>({on:SYNC.on,status:SYNC.status,unkept:SYNC.unkept,waiting:syncWaiting()}));
  if(!status.on||status.unkept||['offline','unreachable','error','stopped','paused'].includes(status.status))throw Error('Shared sync became unhealthy; inspect partial receipts before retry');
  if([...expectedWrites.keys()].every(key=>receipts.has(key))&&status.waiting===0&&status.status==='live')break;
  if(Date.now()>deadline)throw Error('Durable acknowledgement missing; no automatic retry');await new Promise(resolve=>setTimeout(resolve,100));
 }
 writesAllowed=false;
 const after=await publicState();save('after-public.json',after);compareDocs(after.docs,expected,'Fresh public readback');
 const pageAfter=await p.evaluate(captureNative);save('after-page.json',pageAfter);compareDocs(pageAfter.docs,expected,'Native readback');
 if(!same(pageAfter.financial,staged.financialAfter))throw Error('Native financial projection changed during reconciliation');
 save('result.json',{author:'Andrew Fisher',pass:true,beforeVersion:before.version,afterVersion:after.version,put200:requests.filter(r=>r.method==='PUT'&&r.status===200).length,delete200:requests.filter(r=>r.method==='DELETE'&&r.status===200).length,allOtherSharedFieldsUnchanged:true,financial:pageAfter.financial});
 console.log(JSON.stringify({pass:true,beforeVersion:before.version,afterVersion:after.version,put200:requests.filter(r=>r.method==='PUT').length,delete200:requests.filter(r=>r.method==='DELETE').length,allOtherSharedFieldsUnchanged:true}));
 }catch(error){stop(error.message);save('failure.json',{message:redact(error.stack),requests,note:'No automatic retry. Inspect partial write receipts before any further action.'});console.error(redact(error.stack));process.exitCode=1;}
 finally{writesAllowed=false;releaseGate();if(browser)await browser.close();}
})();
