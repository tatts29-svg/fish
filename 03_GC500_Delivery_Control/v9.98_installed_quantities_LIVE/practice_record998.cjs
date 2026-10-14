// Author: Andrew Fisher. Practice captures native saves locally; never writes the service.
const fs=require('fs'),path=require('path'),{open}=require('../toolchain/harness/open_page'),{apply998}=require('./record_native998.cjs');
const out=process.env.AUDIT_DIR||'/workspace/private-gc500-ep998',plan=JSON.parse(fs.readFileSync(path.join(out,'correction-plan.json')));
(async()=>{const h=await open({pageFile:process.env.PAGE,hash:'#subhired'});try{
 await h.page.waitForFunction(()=>SYNC.status==='live'&&SYNC.first.size===Object.keys(SYNC_COLLS).length&&DOCS.state==='ready'&&document.documentElement.dataset.refresh904==='ready',null,{timeout:180000});
 await h.page.evaluate(()=>{window.capability=()=> 'edit';window.mayWrite=()=>true;SYNC.readonly=false;SYNC.level='edit';S.operator='Andrew Fisher via Codex';window.record998Captured=[];SYNC.db.doc=k=>({set:b=>{const [c,id]=k.split('/');window.record998Captured.push({collection:c,id,body:b});return Promise.resolve();},delete:()=>Promise.reject(Error('Deletion forbidden'))});});
 const result=await h.page.evaluate(apply998,plan);await h.page.waitForFunction(()=>syncWaiting()===0,null,{timeout:15000});
 const captured=await h.page.evaluate(()=>record998Captured);fs.writeFileSync(path.join(out,'practice-inspect.json'),JSON.stringify({result,captured},null,2));if(h.errors.length||h.counts.blocked)throw Error('Browser errors or write attempts');
 if(captured.length!==result.writes.length)throw Error('Save count differs');
 for(const w of result.writes){const c=captured.find(c=>c.collection===w.collection&&c.id===w.id);if(!c||JSON.stringify(c.body)!==JSON.stringify(w.body))throw Error('Intermediate payload or missing native save');}
 fs.writeFileSync(path.join(out,'practice.json'),JSON.stringify({...result,captured,errors:h.errors,counts:h.counts},null,2));console.log(JSON.stringify({pass:true,writes:captured.length,before:result.beforeSummary,after:result.afterSummary}));
 }finally{await h.browser.close();}})().catch(e=>{console.error(e.stack);process.exitCode=1;});
