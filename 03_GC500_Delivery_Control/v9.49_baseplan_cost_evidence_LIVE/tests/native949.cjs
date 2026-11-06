/* Author: Andrew Fisher. Final combined release model-only proof; private outputs. */
'use strict';
const fs=require('fs'),path=require('path'),Module=require('module'),assert=require('assert/strict'),crypto=require('crypto');
for(const key of ['PAGE','OUT949','STATE949','CLOCK949','BASELINE949','ORACLE949','EXPECTED949'])assert(process.env[key],key+' required');
const snapshot=JSON.parse(fs.readFileSync(process.env.STATE949));
const clock=JSON.parse(fs.readFileSync(process.env.CLOCK949)).iso;
const baseline=JSON.parse(fs.readFileSync(process.env.BASELINE949));
const accepted=baseline;
const sourceRoot=path.resolve(__dirname,'../..');

const root=sourceRoot+'/toolchain/harness',hp=root+'/open_page.js',out=process.env.OUT949;
fs.mkdirSync(out,{recursive:true,mode:0o700});
const save=(name,value)=>fs.writeFileSync(path.join(out,name),JSON.stringify(value,null,2),{mode:0o600});
const sha=filename=>crypto.createHash('sha256').update(fs.readFileSync(filename)).digest('hex');
const f=require(root+'/curlfetch'),get=f.curlFetch;
f.curlFetch=async(url,headers,method,body)=>{
 assert.equal(method,'GET');const u=new URL(url);
 if(u.origin==='https://gc500-production.up.railway.app'&&['/api/state','/api/version'].includes(u.pathname))return {status:200,headers:{'content-type':'application/json','cache-control':'no-store'},body:Buffer.from(JSON.stringify(u.pathname==='/api/state'?snapshot:{version:snapshot.version,updated:snapshot.updated,level:snapshot.level||'view'}))};
 return get(url,headers,method,body);
};
const init=`(()=>{const D=Date,n=D.parse(${JSON.stringify(clock)});window.Date=class extends D{constructor(...a){super(...(a.length?a:[n]));}static now(){return n;}};})();`;
const h=new Module(hp,module);h.filename=hp;h.paths=Module._nodeModulePaths(path.dirname(hp));
h._compile(fs.readFileSync(hp,'utf8').replace(/const okPost = [^;]+;/,'const okPost = false;').replace('counts.blocked++;',"counts.blocked++;(counts.denials||=[]).push({method:r.method(),origin:new URL(u).origin,path:new URL(u).pathname});").replace('const page = await ctx.newPage();',`await ctx.addInitScript({content:${JSON.stringify(init)}}); const page = await ctx.newPage();`),hp);
async function read(mobile){
 const label=mobile?'phone':'desktop';
 const s=await h.exports.open({pageFile:process.env.PAGE,hash:'#about',W:mobile?390:1440,H:mobile?844:1000,mobile,dpr:mobile?2:1,gl:true}),p=s.page;
 const watchdog=setTimeout(()=>s.browser.close().catch(()=>{}),180000);
 try{
 save(label+'-initial.json',{errors:s.errors,counts:s.counts});
 await p.waitForFunction(()=>typeof SYNC!=='undefined'&&SYNC.status==='live'&&SYNC.first.size===Object.keys(SYNC_COLLS).length,null,{timeout:60000});
 const start=await p.evaluate(()=>({state:JSON.stringify(S),version:SYNC.backend.readVersion821(),now:new Date().toISOString()}));assert.equal(start.version,snapshot.version);assert.equal(start.now,clock);
 const result=await p.evaluate(()=>holdAssets(()=>{
  const serial=x=>JSON.parse(JSON.stringify(x,(_,v)=>v instanceof Map?{__map:[...v]}:v instanceof Set?{__set:[...v]}:v));
  const assets=allAssets().filter(a=>!a._cancelled),models={money:moneySummary(),costsJob:cj764Model(),pnl:pl770Model(),branches:pl752Rows(),transport:transport888View(),reconciliation:recon888Model(),rehire:rh766Model(),contracts:contractFigures(ONHIRE_ROWS),quotes:DATA.rehire_quotes,labourRevenue:labourRevenue858(),labourAllowance:labourAllowance858(),forecastBuildings:buildingTransportModel831(),handover:fh866Model(),costRows:allCosts(),costTotals:costTotals(allCosts()),assets:assets.map(a=>({key:a.key,totals:assetTotal(a)}))};
  const units=assets.flatMap(a=>gcModel925(a,{loading:false}).rows),photos=assets.map(a=>{const m=gcModel925(a,{loading:false}),ps=dropPhotosOf(a.key);return {ref:a.key,rows:m.rows.map(u=>({id:u.id,photos:Units925.photos(u,m.rows,ps).map(p=>p.id).sort()}))};});
  const nativeExpense949=gradeOurs({id:'TEST949',side:'ours',kind:'misc',category:'Misc and other expenses',date:'2026-10-09',supplier:'PRE808',description:'Rehire contract 9961265 line 13',note:'period 2026-10-08 to 2026-10-11',amount:1,recorded_by:'Andrew Fisher'});if(!nativeExpense949.usable)throw Error('native expense fixture invalid');const nrow949=ONHIRE_ROWS.find(r=>r.rental_contract==='9961265'&&r.line===13),nf949=Source949.calculate(nrow949,Source949.evidence(nrow949),contractCharge(nrow949),[nativeExpense949]);if(nf949.remaining!==16)throw Error('native expense coverage failed');
  const contracts=ONHIRE_ROWS.map(r=>({rental:r.rental_contract,line:r.line,owner:finance928ContractOwner(r),charge:contractCharge(r)}));
  const accounts=Object.fromEntries(['2026-09','2026-10','2026-11'].map(month=>[month,acc761Model(month)]));
  const demob=assets.map(a=>{const us=units816(a),evtN=us.filter(x=>x.evt).reduce((n,x)=>n+x.n,0),evtUnk=us.some(x=>x.evt&&x.unknown);return {ref:a.key,evtN,evtUnk,parts:us,ownership:owner816(a,us,evtN,evtUnk)};});
  const loading=['FL01','GN23','WC09','WC20','WC31','T0103'].map(ref=>{const a=assetOf(ref);return {ref,products:Loading931.referenceProducts931(a).map(p=>({item:p.item,owner:p.owner,qty:p.qty,ids:p.units.map(u=>u.id)}))};});
  const partial=Loading931.products931(assetOf('WC31'),[{item:'16Pan Block',qty:'2'}],ONHIRE_ROWS,{load:true}).map(p=>({item:p.item,qty:p.qty,owner:p.owner,ids:p.units.map(u=>u.id)}));
  return serial({models,contracts,units,photos,accounts,demob,loading,partial,inventory:inventory(),source:ONHIRE_ROWS,estimates:typeof Source949==='undefined'?[]:Source949.model(),record:SYNC.backend.readVersion821()});
 }));

 save(label+'.json',result);
 await p.evaluate(()=>{document.getElementById('pane-about').innerHTML=holdAssets(()=>rh766Card());});await p.locator('.source949-cost').first().scrollIntoViewIfNeeded();await p.screenshot({path:path.join(out,label+'-rehire.png')});
 const financial={summary:require(path.join(__dirname,'financial949.cjs'))(baseline,result,JSON.parse(fs.readFileSync(process.env.ORACLE949)),JSON.parse(fs.readFileSync(process.env.EXPECTED949)))};financial.summary.ok=financial.summary.passed;
 const ties=result.models.reconciliation.ties;assert(ties.length>=17&&ties.every(t=>t.ok),'Native reconciliation tie-out failure');
 assert.deepEqual(result.photos,accepted.photos,'Canonical photo bindings changed');
 assert.deepEqual(result.units.map(u=>u.id).sort(),accepted.units.map(u=>u.id).sort(),'Physical identities changed');
 assert.equal(await p.evaluate(()=>JSON.stringify(S)),start.state,'Native record changed');
 assert.deepEqual(s.errors,[]);assert((s.counts.denials||[]).every(r=>r.method==='POST'&&r.origin==='https://tile.googleapis.com'&&r.path==='/v1/createSession'));
 save(label+'-requests.json',s.counts);
 return {data:result,summary:{financial:financial.summary,nativeTieouts:ties.length,nativeTieoutsPassed:ties.filter(t=>t.ok).length,canonicalPhotoBindingsUnchanged:true,physicalIdentitiesUnchanged:true,recordUnchanged:true,pageErrors:0,operationalWrites:0}};
 }finally{clearTimeout(watchdog);await s.browser.close();}
}
(async()=>{
 const desktop=await read(false),phone=await read(true);
 assert.deepEqual(phone.data.models,desktop.data.models,'Mobile and desktop financial models differ');
 const summary={author:'Andrew Fisher',passed:desktop.summary.financial.ok&&phone.summary.financial.ok,candidateSha256:sha(process.env.PAGE),record:snapshot.version,clock,desktop:desktop.summary,phone:phone.summary};
 save('summary.json',summary);console.log(JSON.stringify(summary));assert(summary.passed,'Final financial proof has differences; see private reports');
})().catch(e=>{save('failure.json',{message:e.message,stack:e.stack});console.error('FAIL final combined proof; private output contains detail.');process.exitCode=1});
