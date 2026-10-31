/* Author: Andrew Fisher. Independent read-only P&L capture; output must stay private.
 * PAGE=/absolute/page.html STATE=/absolute/state.json OUT=/private/output node capture_models.cjs
 * Optional PL_AUDIT_FACE_API=PL1267 (a versioned facade retaining model() and ledger()).
 * Run under the shared browser flock. The native harness denies operational writes.
 */
'use strict';
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),cp=require('node:child_process');
const {openCandidate}=require('../../v12.43.1_offsite_pictures_LIVE/tests/native_harness.cjs');
const hash=file=>crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');
function privateOutput(){
  const out=process.env.OUT;
  if(!out||!path.isAbsolute(out))throw new Error('OUT must be an absolute private directory');
  fs.mkdirSync(out,{recursive:true,mode:0o700});
  try{cp.execFileSync('git',['-C',out,'rev-parse','--show-toplevel'],{stdio:'ignore'});}
  catch(e){if(e.status===128)return fs.realpathSync(out);throw e;}
  throw new Error('OUT must be outside every Git worktree');
}
function changedDocuments(before,after){
  const same=require('node:util').isDeepStrictEqual,changed=[];
  for(const c of new Set([...Object.keys(before),...Object.keys(after)]))
    for(const id of new Set([...Object.keys(before[c]||{}),...Object.keys(after[c]||{})]))
      if(!same(before[c]?.[id]??null,after[c]?.[id]??null))changed.push(c+'/'+id);
  return changed;
}
(async()=>{
  let out,h,stage='configuration';
  try{
    out=privateOutput();
    for(const key of ['PAGE','STATE'])if(!process.env[key]||!path.isAbsolute(process.env[key])||!fs.existsSync(process.env[key]))throw new Error(key+' must name an existing absolute local file');
    const facade=process.env.PL_AUDIT_FACE_API||'PL1267';
    if(!/^[A-Za-z_$][\w$]*$/.test(facade))throw new Error('PL_AUDIT_FACE_API must be one JavaScript identifier');
    const frozen=JSON.parse(fs.readFileSync(process.env.STATE,'utf8'));
    process.env.INITIAL_HASH='#costs';stage='browser capture';h=await openCandidate();
    await h.page.waitForFunction(name=>{try{return !!window[name]&&typeof window[name].model==='function'&&typeof window[name].ledger==='function';}catch(_){return false;}},facade,{timeout:60000});
    const data=await h.page.evaluate(name=>holdAssets(()=>{
      const out={asAt:todayIso(),record:SYNC.backend.readVersion821(),faceApi:name};
      const readers={
        'PL1267.model':()=>window[name].model(), 'PL1267.ledger':()=>window[name].ledger(),
        pl770Model:()=>pl770Model(),moneySummary:()=>moneySummary(),fh866Model:()=>fh866Model(),
        cj764Model:()=>cj764Model(),labourHireSoFar1267:()=>labourHireSoFar1267(todayIso()),
        scopeBranchAllocation978:()=>scopeBranchAllocation978(),recon888Model:()=>recon888Model()
      };
      for(const [key,read] of Object.entries(readers))out[key]=read();
      // Keep only source fields needed for independent rate × weighted-hour arithmetic.
      out.finRows=fin745Rows(todayIso()).map(r=>({id:r.id,type:r.type,date:r.date,paid:r.paid,
        rate:r.rate,calculatedCost:r.calculatedCost,actualCost:r.actualCost,status:r.status,
        source:{split:r.source?.split},auditIsCrew:typeof RaceCrew1227!=='undefined'&&RaceCrew1227.isCrew(r)}));
      out.persisted=JSON.parse(JSON.stringify(Object.fromEntries(Object.keys(SYNC_COLLS).map(k=>[k,toDocs(k)]))));
      return JSON.parse(JSON.stringify(out));
    }),facade);
    data.capture={author:'Andrew Fisher',pageSha256:hash(process.env.PAGE),stateSha256:hash(process.env.STATE),
      capturedAt:new Date().toISOString(),facade,method:'native read-only page; frozen record',
      modelKeysUseLegacyStableNames:true};
    const changed=changedDocuments(frozen.docs,data.persisted);delete data.persisted;
    const evidence={author:'Andrew Fisher',baseline:h.baseline,errors:h.errors,consoleErrors:h.consoleErrors,
      requests:h.counts,changedDocuments:changed,pass:!changed.length&&!h.errors.length&&!h.consoleErrors.length&&!h.counts.blocked};
    fs.writeFileSync(path.join(out,'models.json'),JSON.stringify(data,null,2),{mode:0o600});
    fs.writeFileSync(path.join(out,'capture-checks.json'),JSON.stringify(evidence,null,2),{mode:0o600});
    if(!evidence.pass)throw new Error('Read-only capture checks failed; see private capture-checks.json');
    console.log('PASS: model capture; zero changed documents, errors or operational writes.');
  }catch(e){
    if(out)fs.writeFileSync(path.join(out,'capture-failure.json'),JSON.stringify({stage,error:String(e),stack:e.stack},null,2),{mode:0o600});
    console.error('FAIL: '+stage+' (details in private output).');process.exitCode=1;
  }finally{if(h)await h.browser.close();}
})();
