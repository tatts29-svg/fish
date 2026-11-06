// Author: Andrew Fisher. Read-only browser regression against the shared record.
const fs=require('fs'),assert=require('assert/strict');
const {open}=require('../toolchain/harness/open_page');
(async()=>{let h;try{
 h=await open({pageFile:process.env.PAGE,hash:'#fencing',...(process.env.MOB?{W:390,H:844,dpr:2,mobile:true}:{})});
 await h.page.waitForFunction(()=>SYNC.status==='live'&&SYNC.first.size===Object.keys(SYNC_COLLS).length&&DOCS.state==='ready',null,{timeout:180000});
 const results=await h.page.evaluate(async()=>{
  const canonical=recordCanonical1003,raw=fromDocs('fenceDockets',Object.fromEntries(Object.entries(SYNC.last.fenceDockets).map(([k,v])=>[k,JSON.parse(v)])));
  const relevant=r=>String(r.id).replace(/·[0-9a-f]{4}$/,'')==='F-AFV-0002';
  const projected=allDockets().filter(relevant),expected=fenceDockets1003(raw,S.deleted).filter(relevant),cost=costDocket(expected[0]);
  const result={version:SYNC.backend.readVersion821(),raw:raw.filter(relevant).map(r=>({id:r.id,quantities:r.quantities})),native:S.fenceDockets.filter(relevant),projected:projected.map(r=>({id:r.id,quantities:r.quantities,cost_total:r.cost_total,paid_total:r.paid_total})),expectedCost:cost,rawCost:raw.filter(relevant).map(costDocket),beforeDialogs:document.querySelectorAll('[aria-label="Import clashes"]').length};
  // Exercise the real editor-startup function with native writes/redraw fully isolated.
  const saved={S,persist,syncSend,syncRedraw,clashDialog,sharedCache975,readonly:SYNC.readonly,last:SYNC.last,pending:SYNC.pending,first:SYNC.first,ftimer:SYNC.ftimer};
  let notices=0,sends=0,kept=0;
  try{
   S=JSON.parse(JSON.stringify(S));S.fenceDockets=raw;
   SYNC.readonly=false;SYNC.last={...SYNC.last};SYNC.first=new Set(SYNC.first);SYNC.pending={fenceDockets:Object.fromEntries(raw.map(r=>[r.id,{...r,_k:r.id}]))};SYNC.ftimer=null;
   persist=()=>{kept++;};syncSend=()=>{sends++;};syncRedraw=()=>{};sharedCache975=()=>{};clashDialog=()=>{notices++;};
   syncFirst();await new Promise(r=>setTimeout(r,650));
   result.firstSync={rows:S.fenceDockets.filter(relevant),notices,sends,kept,clashes:S.lastImport?.clashes||[]};
   SYNC.pending={fenceDockets:Object.fromEntries(raw.map(r=>[r.id,{...r,_k:r.id}]))};syncFirst();await new Promise(r=>setTimeout(r,650));
   result.repeat={rows:S.fenceDockets.filter(relevant),notices};
  }finally{S=saved.S;persist=saved.persist;syncSend=saved.syncSend;syncRedraw=saved.syncRedraw;clashDialog=saved.clashDialog;sharedCache975=saved.sharedCache975;Object.assign(SYNC,{readonly:saved.readonly,last:saved.last,pending:saved.pending,first:saved.first,ftimer:saved.ftimer});sharedCache975();}
  return result;
 });
 assert.equal(results.projected.length,1);assert.equal(results.native.length,results.raw.length);assert.equal(results.projected[0].id,'F-AFV-0002');assert.equal(results.projected[0].quantities.ped_gates,1);
 assert.equal(results.projected[0].cost_total,results.expectedCost.cost_total);assert.equal(results.projected[0].paid_total,results.expectedCost.paid_total);
 assert.equal(results.firstSync.rows.length,1);assert.equal(results.firstSync.notices,0);assert.equal(results.repeat.rows.length,1);assert.equal(results.repeat.notices,0);assert.equal(results.beforeDialogs,0);
 await h.page.evaluate(()=>go('fencing'));await h.page.waitForTimeout(500);
 await h.page.screenshot({path:process.env.SHOT||'/workspace/private-gc500-conflict1003/browser.png',fullPage:false});
 assert.deepEqual(h.errors,[]);assert.equal(h.counts.blocked,0);
 console.log(JSON.stringify({author:'Andrew Fisher',pass:true,mobile:!!process.env.MOB,results,errors:h.errors,writes:h.counts.blocked}));
 }finally{if(h)await h.browser.close();}})().catch(e=>{console.error(e.stack);process.exitCode=1;});
