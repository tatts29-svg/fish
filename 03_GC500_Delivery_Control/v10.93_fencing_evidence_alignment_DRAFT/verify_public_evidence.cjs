// Author: Andrew Fisher. Read-only verification of the actual public page after the reviewed native correction.
'use strict';
const fs=require('fs'),path=require('path'),crypto=require('crypto');
for(const key of ['PAGE','GC500_MEDIA_BASE','MEDIA','MEDIA893','MEDIA889','ATLAS896'])
 if(process.env[key])throw Error('Actual-public verification forbids local page or media replacement');
const {open}=require('../record_20Oct2026_fencing_alignment/readonly_page.cjs');
const {curlFetch}=require('../toolchain/harness/curlfetch');
const {read,verify}=require('./native_evidence.cjs');
const HOST='https://gc500-production.up.railway.app';
const canonical=x=>JSON.stringify((function sort(v){return Array.isArray(v)?v.map(sort):v&&typeof v==='object'?Object.fromEntries(Object.keys(v).sort().map(k=>[k,sort(v[k])])):v})(x));
const same=(a,b)=>canonical(a)===canonical(b),hash=b=>crypto.createHash('sha256').update(b).digest('hex');
// The public transport omits empty collections; compare every actual document.
const compact=docs=>Object.fromEntries(Object.entries(docs).filter(([,v])=>Object.keys(v||{}).length));
const sameDocs=(a,b)=>same(compact(a),compact(b));
const load=f=>JSON.parse(fs.readFileSync(f,'utf8'));
function privateDirectory(value,label){
 if(!value||!path.isAbsolute(value))throw Error(label+' must be an absolute private directory');
 const p=fs.realpathSync(value);
 for(let q=p;;q=path.dirname(q)){if(fs.existsSync(path.join(q,'.git')))throw Error(label+' must be outside every Git checkout');if(path.dirname(q)===q)break;}
 return p;
}
const applyDir=privateDirectory(process.env.GC500_APPLY_EVIDENCE_DIR,'Apply evidence');
const outRoot=privateDirectory(process.env.GC500_RECORD_OUT,'Verification output');
const rawSpec=fs.readFileSync(process.env.GC500_FENCING_EVIDENCE_SPEC),spec=JSON.parse(rawSpec);
const expectedPage=process.env.GC500_EXPECTED_PAGE_SHA,expectedSpec=process.env.GC500_EXPECTED_SPEC_SHA;
if(!/^[a-f0-9]{64}$/.test(expectedPage||'')||spec.reviewed_page_sha!==expectedPage)throw Error('Exact reviewed public page hash required');
if(!/^[a-f0-9]{64}$/.test(expectedSpec||'')||hash(rawSpec)!==expectedSpec)throw Error('Exact frozen specification hash required');
const applied=load(path.join(applyDir,'result.json'));
if(applied.pass!==true||applied.practice||applied.scope!=='fencing_evidence'||!Number.isInteger(applied.writes)||applied.writes<1)throw Error('Successful actual apply receipt required');
const expected=load(path.join(applyDir,'after-public.json')),plan=load(path.join(applyDir,'proposal.json'));
if(!same(plan.spec,spec)||expected.version!==applied.afterVersion)throw Error('Apply evidence does not match the reviewed specification');
const OUT=path.join(outRoot,'public_fencing_evidence_'+new Date().toISOString().replace(/[:.]/g,'-'));
fs.mkdirSync(OUT,{mode:0o700});
const save=(name,value)=>fs.writeFileSync(path.join(OUT,name),JSON.stringify(value,null,2)+'\n',{mode:0o600});
async function get(pathname,headers={}){
 const response=await curlFetch(HOST+pathname,{'cache-control':'no-cache',...headers},'GET',null);
 if(response.status!==200)throw Error('Public GET failed: '+pathname+' ('+response.status+')');
 return response.body;
}
async function publicState(){return JSON.parse(await get('/api/state',{'x-gc500-token':'Coates-GC500-2026'}));}
(async()=>{
 let h;
 try{
  const pageBefore=await get('/v/Coates-GC500-2026');
  if(hash(pageBefore)!==expectedPage)throw Error('Actual public page differs from reviewed release');
  const before=await publicState();save('before-public.json',before);
  if(!sameDocs(before.docs,expected.docs))throw Error('Fresh public documents differ from verified apply receipt');
  h=await open({hash:'#fencing',mobile:true,W:390,H:844,dpr:2});
  await h.page.waitForFunction(()=>SYNC.status==='live'&&SYNC.first.size===Object.keys(SYNC_COLLS).length&&photoIndex().state==='ready'&&!DOCS.busy,null,{timeout:180000});
  const record=await h.page.evaluate(read,spec);save('public-page-record.json',record);
  if(!sameDocs(record.docs,expected.docs))throw Error('Actual public page documents differ from verified apply receipt');
  const checks=verify({record,after:record.docs},plan);
  checks.checks['actual public page loaded without replacement']=h.counts.page===0;
  checks.checks['public browser made no native mutation attempt']=h.counts.blocked===0;
  checks.checks['public browser has no page errors']=h.errors.length===0;
  checks.pass=Object.values(checks.checks).every(Boolean);save('verification.json',checks);
  if(!checks.pass)throw Error('Actual-public native projection verification failed');
  const after=await publicState();save('after-public.json',after);
  if(!sameDocs(after.docs,expected.docs)||after.version!==before.version)throw Error('Native record changed during public verification');
  const pageAfter=await get('/v/Coates-GC500-2026');
  if(hash(pageAfter)!==expectedPage)throw Error('Public page changed during verification');
  save('result.json',{pass:true,readonly:true,pageSha256:expectedPage,pageBytes:pageAfter.length,specSha256:expectedSpec,version:after.version,checks:checks.checks,requests:h.counts,errors:h.errors});
  console.log(JSON.stringify({pass:true,readonly:true,checks:Object.keys(checks.checks).length,localPageReplacements:h.counts.page,nativeMutationAttempts:h.counts.blocked,out:OUT}));
 }catch(error){save('failure.json',{message:String(error.stack||error)});console.error(String(error.stack||error));process.exitCode=1;}
 finally{if(h)await h.browser.close();}
})();
