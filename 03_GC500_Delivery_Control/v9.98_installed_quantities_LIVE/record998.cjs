// Author: Andrew Fisher. Two user-confirmed installations; defaults to local validation only.
const fs=require('fs'),path=require('path'),crypto=require('crypto'),os=require('os'),{spawn}=require('child_process');
const {capture998,apply998}=require('./record_native998.cjs');
const PRIVATE=process.env.AUDIT_DIR||'/workspace/private-gc500-ep998';
const plan=JSON.parse(fs.readFileSync(path.join(PRIVATE,'correction-plan.json')));
const hash=x=>crypto.createHash('sha256').update(x).digest('hex');
const canon=x=>JSON.stringify((function sort(v){return Array.isArray(v)?v.map(sort):v&&typeof v==='object'?Object.fromEntries(Object.keys(v).sort().map(k=>[k,sort(v[k])])):v})(x));
if(plan.schema!==1||plan.scope!=='confirmed-ep-installations-998'||plan.operator!=='Andrew Fisher via Codex'||canon(plan.operations.map(o=>[o.ref,o.received,o.planned]))!==canon([['WC61',8,8],['WC69',6,12]]))throw Error('Reviewed correction scope changed');
if(hash(canon(plan))!=='02571b55805b71684dcd196612c37e71637885f9a948ed0cfd58e0f2f86fc473')throw Error('Private reviewed correction plan changed');
const args=process.argv.slice(2),validation={author:'Andrew Fisher',pass:true,operations:2,networkCalls:0,mutations:0,proposalSha256:hash(canon(plan)),scope:plan.scope};
if(!args.length){console.log(JSON.stringify(validation,null,2));process.exit(0);}
if(canon(args)!==canon(['--apply','--scope','confirmed-ep-installations-998']))throw Error('No accepted apply scope supplied');
const token=process.env.GC500_EDIT_TOKEN,expectedPage=process.env.GC500_EXPECTED_PAGE_SHA;
if(!token||!/^([a-f0-9]{64})$/.test(expectedPage||''))throw Error('Named edit credential and reviewed current page SHA are required');
const {chromium}=require('playwright'),HOST='https://gc500-production.up.railway.app';
const OUT=path.join(PRIVATE,'record_12Oct2026_confirmed_EP_'+new Date().toISOString().replace(/[:.]/g,'-'));fs.mkdirSync(OUT,{recursive:false});
const redact=s=>String(s).split(token).join('[redacted]'),save=(name,value)=>fs.writeFileSync(path.join(OUT,name),redact(JSON.stringify(value,null,2))+'\n');
let writesAllowed=false,fatal=null,current=null;const requests=[];
const stop=s=>{writesAllowed=false;fatal=fatal||Error(redact(s));};
const quote=s=>'"'+String(s).replace(/\\/g,'\\\\').replace(/"/g,'\\"').replace(/\r/g,'\\r').replace(/\n/g,'\\n')+'"';
let seq=0;
async function fetchSafe(url,headers={},method='GET',body=null){
 const id=++seq,tmp=path.join(os.tmpdir(),'gc500-ep998-'+process.pid+'-'+id),hf=tmp+'.headers',bf=tmp+'.body';
 const config=['url = '+quote(url),'request = '+quote(method),'silent','show-error','compressed','max-time = 90','dump-header = '+quote(hf),'output = '+quote(bf)];
 for(const [k,v] of Object.entries(headers))if(!/^(host|connection|content-length|accept-encoding)$/i.test(k))config.push('header = '+quote(k+': '+v));
 if(body!=null)config.push('data-binary = '+quote(body));
 await new Promise((resolve,reject)=>{const child=spawn('curl',['--config','-'],{stdio:['pipe','ignore','pipe']});let err='';child.stderr.on('data',b=>err+=b);child.on('error',reject);child.on('close',code=>code?reject(Error(redact(err)||'Request failed')):resolve());child.stdin.end(config.join('\n')+'\n');});
 try{const raw=fs.readFileSync(hf,'utf8').split(/\r?\n\r?\n/).filter(x=>/^HTTP\//.test(x)).at(-1),lines=raw.split(/\r?\n/),status=Number(lines.shift().split(' ')[1]);const hd={};for(const l of lines){const i=l.indexOf(':');if(i>0&&!/^(content-length|content-encoding|transfer-encoding|set-cookie)$/i.test(l.slice(0,i)))hd[l.slice(0,i).toLowerCase()]=l.slice(i+1).trim();}return{status,headers:hd,body:fs.readFileSync(bf)};}finally{fs.rmSync(hf,{force:true});fs.rmSync(bf,{force:true});}
}
async function getPublic(name){const r=await fetchSafe(HOST+'/api/'+name,{'x-gc500-token':'Coates-GC500-2026','cache-control':'no-cache'});if(r.status!==200)throw Error('Public '+name+' returned '+r.status);return JSON.parse(r.body);}
function verifyDocs(actual,expected){if(canon(actual)!==canon(expected))throw Error('Fresh shared record differs from expected corrections');}
function verifyPageDocs(actual,expected){const compact=d=>Object.fromEntries(Object.entries(d).filter(([,v])=>Object.keys(v||{}).length));verifyDocs(compact(actual),compact(expected));}

(async()=>{let browser;try{
 save('validation.json',validation);save('proposal.json',plan);
 const live=await fetchSafe(HOST+'/v/Coates-GC500-2026',{'cache-control':'no-cache'});if(live.status!==200||hash(live.body)!==expectedPage)throw Error('Current page differs from reviewed release');
 
 save('page-proof.json',{sha256:expectedPage,bytes:live.body.length});
 const before=await getPublic('state');save('before-public.json',before);
 for(const o of plan.operations)for(const c of ['delivery','supplied'])if(canon(before.docs[c]?.[o.ref]??null)!==canon(o.before[c]??null))throw Error('Owned shared record changed: '+o.ref+'/'+c);
 browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||'/usr/bin/chromium',args:['--no-sandbox']});
 const ctx=await browser.newContext({viewport:{width:1280,height:900},locale:'en-AU',timezoneId:'Australia/Brisbane'});
 await ctx.route('**/*',async route=>{const request=route.request(),url=request.url(),method=request.method();if(url.startsWith('data:')||url.startsWith('blob:'))return route.continue();let proof;
 try{
  if(method==='POST'&&new URL(url).origin==='https://tile.googleapis.com'&&new URL(url).pathname==='/v1/createSession')return route.abort();
  if(method!=='GET'){
   const m=new URL(url).origin===HOST&&new URL(url).pathname.match(/^\/api\/doc\/([^/]+)\/([^/]+)$/);
   if(!writesAllowed||!current||method!=='PUT'||!m)throw Error('Blocked out-of-scope mutation');
   await current.ready;if(fatal||!writesAllowed)throw Error('Write gate closed');
   const collection=decodeURIComponent(m[1]),id=decodeURIComponent(m[2]),key=collection+'/'+id,body=JSON.parse(request.postData()||'null');
   if(!current.expected.has(key)||canon(body)!==canon(current.expected.get(key)))throw Error('Unexpected mutation payload: '+key);
   if(current.attempted.has(key))throw Error('Automatic retry refused: '+key);current.attempted.add(key);
   proof={collection,id,body,started:new Date().toISOString(),status:null};requests.push(proof);save('write-requests.json',requests);
  }
  const response=await fetchSafe(url,request.headers(),method,request.postData());
  if(proof){proof.status=response.status;proof.finished=new Date().toISOString();save('write-requests.json',requests);if(response.status!==200)throw Error('Owned correction returned '+response.status);current.receipts.add(proof.collection+'/'+proof.id);}
  await route.fulfill(response);
 }catch(e){stop(e.message);save('transport-failure.json',{message:fatal.message,requests});await route.abort();}});
 const p=await ctx.newPage();p.on('pageerror',e=>stop('Page error: '+e.message));
 await p.goto(HOST+'/e/'+token,{waitUntil:'load',timeout:180000});
 await p.waitForFunction(()=>SYNC.status==='live'&&!SYNC.readonly&&!SYNC.unkept&&SYNC.first.size===Object.keys(SYNC_COLLS).length&&syncWaiting()===0,null,{timeout:180000});
 await p.evaluate(()=>{const w=document.getElementById('who');if(!w)throw Error('Native operator control missing');w.value='Andrew Fisher via Codex';w.dispatchEvent(new Event('change',{bubbles:true}));});
 const initial=await p.evaluate(capture998);save('before-page.json',initial);verifyPageDocs(initial.docs,before.docs);
 verifyDocs((await getPublic('state')).docs,before.docs);if(fatal)throw fatal;
 let release;current={ready:new Promise(r=>release=r),expected:new Map(),receipts:new Set(),attempted:new Set()};writesAllowed=true;let applied;
 try{applied=await p.evaluate(apply998,plan);for(const w of applied.writes)current.expected.set(w.collection+'/'+w.id,w.body);save('native-proposal.json',applied);release();}catch(e){stop(e.message);release();throw e;}
 const deadline=Date.now()+120000;
 while(true){if(fatal)throw fatal;const state=await p.evaluate(()=>({on:SYNC.on,status:SYNC.status,unkept:SYNC.unkept,waiting:syncWaiting()}));
  if(!state.on||state.unkept||['offline','unreachable','error','stopped','paused'].includes(state.status))throw Error('Sync no longer healthy; no automatic retry');
  if([...current.expected.keys()].every(k=>current.receipts.has(k))&&state.waiting===0&&state.status==='live')break;
  if(Date.now()>deadline)throw Error('Missing durable acknowledgement; inspect receipts before retry');await new Promise(r=>setTimeout(r,100));}
 writesAllowed=false;
 const expected=JSON.parse(JSON.stringify(before.docs));for(const w of applied.writes){expected[w.collection]||={};expected[w.collection][w.id]=w.body;}
 const after=await getPublic('state');save('after-public.json',after);verifyDocs(after.docs,expected);
 const afterPage=await p.evaluate(capture998);save('after-page.json',afterPage);verifyPageDocs(afterPage.docs,expected);
 save('result.json',{author:'Andrew Fisher',pass:true,beforeVersion:before.version,afterVersion:after.version,operations:2,put200:current.receipts.size,allOtherSharedFieldsUnchanged:true,beforeSummary:applied.beforeSummary,afterSummary:applied.afterSummary});
 console.log(JSON.stringify({pass:true,operations:2,put200:current.receipts.size,beforeVersion:before.version,afterVersion:after.version}));
 }catch(e){stop(e.message);save('failure.json',{message:redact(e.stack),requests,note:'No automatic retry. Root must inspect any partial writes before continuing.'});console.error(redact(e.stack));process.exitCode=1;}
 finally{writesAllowed=false;if(browser)await browser.close();}})();
