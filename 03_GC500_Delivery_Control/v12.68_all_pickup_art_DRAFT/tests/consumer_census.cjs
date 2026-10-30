/* Author: Andrew Fisher. Read-only coverage of every native reference and supplier context. */
'use strict';
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),assert=require('node:assert/strict');
const {openCandidate}=require('../../v12.43.1_offsite_pictures_LIVE/tests/native_harness.cjs');
const hash=p=>crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex');
(async()=>{
 for(const k of ['CANDIDATE','STATE','OUT','EXPECTED_PAGE_SHA'])assert(process.env[k],k+' required');
 const out=path.resolve(process.env.OUT);assert(!out.startsWith(path.resolve(__dirname,'../../..')+path.sep),'OUT must remain private');
 assert.equal(hash(process.env.CANDIDATE),process.env.EXPECTED_PAGE_SHA,'Exact final candidate required');
 process.env.PAGE=process.env.CANDIDATE;process.env.INITIAL_HASH='#demob';
 const h=await openCandidate();
 try{
  await h.page.clock.setFixedTime(new Date('2026-10-30T22:45:00Z'));
  const rows=await h.page.evaluate(()=>holdAssets(()=>{
   const cards=Singles1238.model().cards;
   const inspect=(html,expected)=>{const t=document.createElement('template');t.innerHTML=html;return{stamps:t.content.querySelectorAll('.stamp1232').length,kinds:[...t.content.querySelectorAll('[data-artwork1268]')].map(n=>n.dataset.artwork1268),expected};};
   return allAssets().map(a=>{
    const status=Departure1211.status(a.key),left=Stamp1232.left(a.key),context=Artwork1268.reference(a.key),expected=Artwork1268.resolveAll(context),units=gcUnits925(a,{loading:false});
    const groups=[...new Set([...cards.filter(c=>c.key===a.key&&c.group).map(c=>c.item),...(status?.items||[]).map(i=>i.type),...(status?.events||[]).flatMap(e=>(e.items||[]).map(i=>i.type))].filter(Boolean))];
    return{key:a.key,inSingles:cards.some(c=>c.key===a.key),complete:!!left,context,types:[...new Set((status?.events||[]).flatMap(e=>(e.items||[]).map(i=>i.type)).filter(Boolean))],legacy:inspect(Ready1231.cells({key:a.key}),expected),build:inspect(BuildDeparture1248.stamp(a,{departed1248:!!left}),expected),drawer:inspect(left?Stamp1232.html(left,context):'',expected),units:units.map(u=>({item:u.item,id:u.id,render:inspect(Subhired1248.unitHtml(a.key,u.id,u.item,u.physical),Artwork1268.resolveAll({item:u.item}))})),quantities:groups.map(item=>({item,render:inspect(Subhired1248.quantityHtml(a.key,item),Artwork1268.resolveAll({item}))}))};
   });
  }));
  const gaps=[];let totalStamps=0;const byCaller={legacy:0,build:0,drawer:0,units:0,quantities:0};
  for(const row of rows){
   if(row.complete&&!row.context)gaps.push({key:row.key,caller:'reference',reason:'complete reference has no explicit safe context',types:row.types});
   const inspect=(caller,render,item)=>{totalStamps+=render.stamps;byCaller[caller]+=render.stamps;if(render.stamps&&(!render.expected.length||JSON.stringify(render.kinds)!==JSON.stringify(render.expected)))gaps.push({key:row.key,caller,item,render});};
   for(const caller of ['legacy','build','drawer'])inspect(caller,row[caller]);
   for(const caller of ['units','quantities'])for(const item of row[caller])inspect(caller,item.render,item.item);
  }
  const retained=await h.page.evaluate(()=>({docs:JSON.parse(JSON.stringify(Object.fromEntries(Object.keys(SYNC_COLLS).map(k=>[k,toDocs(k)])))),queued:Object.values(SYNC.queue||{}).reduce((n,q)=>n+Object.keys(q).length,0),inflight:Object.keys(SYNC.inflight||{}).length}));
  const canonical=x=>Array.isArray(x)?x.map(canonical):x&&typeof x==='object'?Object.fromEntries(Object.keys(x).sort().map(k=>[k,canonical(x[k])])):x;
  const populated=d=>Object.fromEntries(Object.entries(d).filter(([,v])=>Object.keys(v||{}).length));
  assert.deepEqual(canonical(populated(retained.docs)),canonical(populated(JSON.parse(fs.readFileSync(process.env.STATE)).docs)),'All persisted documents preserved');
  assert.equal(retained.queued+retained.inflight,0,'No queued or inflight operational writes');
  fs.mkdirSync(out,{recursive:true});
  const report={author:'Andrew Fisher',status:gaps.length?'FAIL':'PASS',pageSha256:hash(process.env.CANDIDATE),stateSha256:hash(process.env.STATE),baseline:h.baseline,references:rows.length,complete:rows.filter(r=>r.complete).length,completeOutsideSingles:rows.filter(r=>r.complete&&!r.inSingles).length,totalStamps,byCaller,gaps,rows,errors:h.errors,consoleErrors:h.consoleErrors,counts:h.counts};
  fs.writeFileSync(path.join(out,'all-reference-consumer-census.json'),JSON.stringify(report,null,2)+'\n');
  assert.equal(gaps.length,0,'Every existing completed stamp must resolve to its exact typed artwork; see private census gaps');
  assert.equal(h.errors.length+h.consoleErrors.length+h.counts.blocked,0,'Zero runtime/console errors or operational write attempts');
  console.log(JSON.stringify({status:'PASS',scope:'all native references and supplier contexts',writes:0}));
 }finally{await h.browser.close();}
})().catch(e=>{console.error(e.stack);process.exitCode=1;});
