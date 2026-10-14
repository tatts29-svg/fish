// Author: Andrew Fisher. Private GET-only Schedule 6 source comparison.
const fs=require('fs'),path=require('path'),Module=require('module'),assert=require('assert');
const dir=process.env.EVIDENCE927,root=path.resolve(__dirname,'../..');
if(!dir||!process.env.BASELINE927||!process.env.PAGE)throw Error('Set private EVIDENCE927, BASELINE927 and PAGE paths.');
fs.mkdirSync(dir,{recursive:true,mode:0o700});
const hp=root+'/toolchain/harness/open_page.js',h=new Module(hp,module);
h.filename=hp;h.paths=Module._nodeModulePaths(path.dirname(hp));
h._compile(fs.readFileSync(hp,'utf8').replace("const okPost = r.method() === 'POST' && u.startsWith('https://tile.googleapis.com/v1/createSession');","const okPost = false;"),hp);
const baseline=process.env.BASELINE927;
async function read(pageFile){
 const s=await h.exports.open({pageFile,hash:'#timeline',gl:true});
 try{
  await s.page.waitForFunction(()=>typeof SYNC!=='undefined'&&SYNC.status==='live',null,{timeout:180000});
  const out=await s.page.evaluate(()=>holdAssets(()=>{
   const clone=x=>JSON.parse(JSON.stringify(x));const V=transport888View(),M=moneySummary(),R=recon888Model();
   const days=programmeDays().filter(d=>['2026-10-12','2026-10-13','2026-10-15'].includes(d.iso));
   return {version:SYNC.backend.readVersion821(),state:clone(S),M:clone(M),V:clone(V),R:clone(R),days:days.map(d=>({day:d.iso,loads:dpLoads(d).map(g=>({refs:g.rows?.map(r=>r.a.key),dd:g.dds,clock:g.timeRaw,carrier:g.carrier,order:g.departure_order,truck:g.truck_id,quantities:g.rows?.flatMap(r=>r.events?.map(e=>e.quantity_raw))}))}))};
  }));
  return {...out,errors:s.errors,counts:s.counts};
 }finally{await s.browser.close();}
}
(async()=>{
 const saved=process.env.RECHECK_EVIDENCE?JSON.parse(fs.readFileSync(dir+'/native-financial-comparison.json','utf8')):null;
 const before=saved?saved.before:await read(baseline),after=saved&&!process.env.RECHECK_CANDIDATE?saved.after:await read(process.env.PAGE);
 fs.writeFileSync(dir+'/native-financial-comparison.json',JSON.stringify({before,after},null,2),{mode:0o600});
 assert.equal(before.version,after.version,'record changed during comparison');
 assert.deepEqual(before.state,after.state,'record changed');
 assert.equal(before.errors.length+after.errors.length,0,'page errors');
 assert.equal(before.V.tot.actual,after.V.tot.actual,'actual transport changed');
 assert.equal(before.V.tot.revenue,after.V.tot.revenue,'transport Revenue changed');
 assert.equal(before.V.tot.provisional,after.V.tot.provisional,'provisional Revenue changed');
 assert.deepEqual(before.M.charge,after.M.charge,'Revenue changed');
 assert.deepEqual(before.M.cost,after.M.cost,'known Direct costs changed');
 assert.equal(after.R.bad,0,'tie-outs fail');
 assert.equal(after.V.T.doubleCounted.length||after.V.T.doubleCounted,0,'double counting');
 const rows=x=>Object.fromEntries(x.V.T.rows.map(r=>[r.id,{task:r.task,key:r.key,forecast:r.forecast,actual:r.actual}]));
 const a=rows(before),b=rows(after),changes=[];
 for(const id of new Set([...Object.keys(a),...Object.keys(b)]))if(JSON.stringify(a[id])!==JSON.stringify(b[id]))changes.push({id,before:a[id],after:b[id]});
 const allowed=new Set(['T0260','T0105','T0106','T0261','T0266','WC31']);
 assert(changes.every(c=>allowed.has((c.after||c.before).task)||allowed.has((c.after||c.before).key)),'unexpected financial row');
 const day=after.days.find(x=>x.day==='2026-10-12');
 const booked=day.loads.filter(l=>l.truck?.startsWith('schedule6-'));
 assert.equal(booked.length,4);assert.deepEqual(booked.map(l=>l.dd[0]),['26120528','26120550','26121298','26121310']);
 assert.deepEqual(booked.map(l=>l.clock),['08:30','09:30','11:00','11:30']);
 assert(day.loads.some(l=>l.refs?.includes('GN13')&&l.carrier==='SFL'),'GN13 carrier missing');
 assert(after.days.find(x=>x.day==='2026-10-13').loads.some(l=>l.refs?.includes('T0266')&&l.clock==='12:00'),'container loading clock missing on Timeline');
 const summary={version:after.version,before:before.V.tot,after:after.V.tot,changes,days:after.days,errors:[...before.errors,...after.errors],counts:{before:before.counts,after:after.counts}};
 fs.writeFileSync(dir+'/native-comparison-summary.json',JSON.stringify(summary,null,2),{mode:0o600});
 console.log(JSON.stringify({passed:true,record:after.version,changedForecastRows:changes.length,loads:booked.length,pageErrors:0}));
})().catch(e=>{console.error(e.stack);process.exitCode=1;});
