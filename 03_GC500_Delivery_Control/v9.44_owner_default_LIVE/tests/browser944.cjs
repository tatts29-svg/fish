/* Author: Andrew Fisher. Frozen-record, GET-only ownership and money reconciliation. */
'use strict';
const fs=require('fs'),path=require('path'),Module=require('module'),assert=require('assert/strict'),crypto=require('crypto');
const ROOT=path.resolve(__dirname,'../../toolchain/harness'),hp=ROOT+'/open_page.js';
for(const key of ['BASE944','PAGE','FROZEN_STATE944','CLOCK944','OUT944'])assert(process.env[key],key+' is required');
const out=path.resolve(process.env.OUT944),clock=JSON.parse(fs.readFileSync(process.env.CLOCK944)).iso;
let snapshot=process.env.CAPTURE944==='1'?null:JSON.parse(fs.readFileSync(process.env.FROZEN_STATE944));
fs.mkdirSync(out,{recursive:true,mode:0o700});
const save=(name,obj)=>fs.writeFileSync(path.join(out,name),JSON.stringify(obj,null,2),{mode:0o600});
const sha=file=>crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');
const f=require(ROOT+'/curlfetch'),get=f.curlFetch;
let editPractice=false;
f.curlFetch=async(url,headers,method,body)=>{
 assert.equal(method,'GET');const u=new URL(url);
 if(snapshot&&u.origin==='https://gc500-production.up.railway.app'&&['/api/state','/api/version'].includes(u.pathname))return {status:200,headers:{'content-type':'application/json','cache-control':'no-store'},body:Buffer.from(JSON.stringify(u.pathname==='/api/state'?snapshot:{version:snapshot.version,updated:snapshot.updated,level:editPractice?'edit':(snapshot.level||'view')}))};
 const res=await get(url,headers,method,body);
 if(!snapshot&&u.origin==='https://gc500-production.up.railway.app'&&u.pathname==='/api/state'&&res.status===200){snapshot=JSON.parse(res.body.toString());fs.writeFileSync(process.env.FROZEN_STATE944,JSON.stringify(snapshot),{mode:0o600});}
 return res;
};
const init=`(()=>{const D=Date,n=D.parse(${JSON.stringify(clock)});window.Date=class extends D{constructor(...a){super(...(a.length?a:[n]));}static now(){return n;}};})();`;
const h=new Module(hp,module);h.filename=hp;h.paths=Module._nodeModulePaths(path.dirname(hp));
h._compile(fs.readFileSync(hp,'utf8').replace(/const okPost = [^;]+;/,'const okPost = false;').replace('counts.blocked++;',"counts.blocked++;(counts.denials||=[]).push({method:r.method(),origin:new URL(u).origin,path:new URL(u).pathname});").replace('const page = await ctx.newPage();',`await ctx.addInitScript({content:${JSON.stringify(init)}}); const page = await ctx.newPage();`),hp);

const {auditFinancial944}=require('./financial944.cjs');
async function read(file,label,mobile=false){
 const s=await h.exports.open({pageFile:file,hash:'#about',W:mobile?390:1440,H:mobile?844:1000,mobile,dpr:mobile?2:1,gl:true}),p=s.page;
 const watchdog=setTimeout(()=>s.browser.close().catch(()=>{}),180000);
 try{
 await p.waitForFunction(()=>SYNC.status==='live'&&SYNC.first.size===Object.keys(SYNC_COLLS).length,null,{timeout:60000});
 const start=await p.evaluate(()=>({state:JSON.stringify(S),version:SYNC.backend.readVersion821(),now:new Date().toISOString()}));assert.equal(start.version,snapshot.version);assert.equal(start.now,clock);
 const result=await p.evaluate(()=>holdAssets(()=>{
  const serial=x=>JSON.parse(JSON.stringify(x,(_,v)=>v instanceof Map?{__map:[...v]}:v instanceof Set?{__set:[...v]}:v));
  const assets=allAssets().filter(a=>!a._cancelled),models={money:moneySummary(),costsJob:cj764Model(),pnl:pl770Model(),branches:pl752Rows(),transport:transport888View(),reconciliation:recon888Model(),rehire:rh766Model(),contracts:contractFigures(ONHIRE_ROWS),quotes:DATA.rehire_quotes,labourRevenue:labourRevenue858(),labourAllowance:labourAllowance858(),forecastBuildings:buildingTransportModel831(),handover:fh866Model(),costRows:allCosts(),costTotals:costTotals(allCosts()),assets:assets.map(a=>({key:a.key,totals:assetTotal(a)}))};
  const units=assets.flatMap(a=>gcModel925(a,{loading:false}).rows),photos=assets.map(a=>{const m=gcModel925(a,{loading:false}),ps=dropPhotosOf(a.key);return {ref:a.key,rows:m.rows.map(u=>({id:u.id,photos:Units925.photos(u,m.rows,ps).map(p=>p.id).sort()}))};});
  const contracts=ONHIRE_ROWS.map(r=>({rental:r.rental_contract,line:r.line,owner:finance928ContractOwner(r),charge:contractCharge(r)}));
  const accounts=Object.fromEntries(['2026-09','2026-10','2026-11'].map(month=>[month,acc761Model(month)]));
  const demob=assets.map(a=>{const us=units816(a),evtN=us.filter(x=>x.evt).reduce((n,x)=>n+x.n,0),evtUnk=us.some(x=>x.evt&&x.unknown);return {ref:a.key,evtN,evtUnk,parts:us,ownership:owner816(a,us,evtN,evtUnk)};});
  const loading=['FL01','GN23','WC09','WC20','WC31','T0103'].map(ref=>{const a=assetOf(ref);return {ref,products:Loading931.referenceProducts931(a).map(p=>({item:p.item,owner:p.owner,qty:p.qty,ids:p.units.map(u=>u.id)}))};});
  const partial=Loading931.products931(assetOf('WC31'),[{item:'16Pan Block',qty:'2'}],ONHIRE_ROWS,{load:true}).map(p=>({item:p.item,qty:p.qty,owner:p.owner,ids:p.units.map(u=>u.id)}));
  return serial({models,contracts,units,photos,accounts,demob,loading,partial,inventory:inventory(),record:SYNC.backend.readVersion821()});
 }));
 save(label+'.json',result);
 if(label!=='before'){
  assert(result.units.every(u=>!OwnershipUnavailable(u.owner)),'No current unidentified owner remains');
  await p.evaluate(()=>holdAssets(()=>go('subhired')));
  const labels=await p.locator('[data-supplier932-company]').allTextContents();assert(labels.length>0&&labels.every(x=>!/owner to confirm|supplier not named/i.test(x)));save(label+'-companies.json',labels);
  await p.screenshot({path:path.join(out,label+'-companies.png')});
  for(const [ref,item] of [['GN23','Distribution Board Lifeguard 17'],['FL01','Forklift 5T'],['T0103','VMS']]){
   await p.evaluate(ref=>holdAssets(()=>openAsset(ref)),ref);await p.waitForTimeout(350);
   await p.evaluate(({ref,item})=>holdAssets(()=>{const select=document.querySelector('#drawer [data-unit925-description]'),group=gcModel925(assetOf(ref)).groups.find(g=>g.item===item||g.units.some(u=>u.item===item));if(select&&group){select.value=group.item;select.dispatchEvent(new Event('change',{bubbles:true}));}}),{ref,item});
   const cards=await p.locator('#drawer .item933-card').allTextContents();assert(cards.length>0);
   if(ref==='T0103'){assert.equal(cards.length,2);assert(cards.some(t=>/Coates/.test(t))&&cards.some(t=>/SUB-HIRED.*PremAir/.test(t)));}
   else assert(cards.every(t=>/Coates/.test(t)&&!/Owner to confirm|SUB-HIRED/.test(t)));
   if(ref==='GN23')assert(cards.some(t=>t.includes('1189078')&&t.includes('Distribution Board')),'The corrected accessory must be visible, not merely the existing generator');
   await p.locator('#drawer .item933-card').first().evaluate(e=>{const d=document.querySelector('#drawer'),b=d.querySelector('.db'),sc=d.scrollHeight>d.clientHeight+1?d:b;sc.scrollTop+=e.getBoundingClientRect().top-180;});await p.waitForTimeout(100);await p.screenshot({path:path.join(out,label+'-'+ref+'.png')});
   assert(await p.locator('#drawer').evaluate(d=>d.scrollWidth<=d.clientWidth+2));
  }
 }
 assert.equal(await p.evaluate(()=>JSON.stringify(S)),start.state);assert.deepEqual(s.errors,[]);assert((s.counts.denials||[]).every(r=>r.method==='POST'&&r.origin==='https://tile.googleapis.com'&&r.path==='/v1/createSession'));
 save(label+'-requests.json',s.counts);return result;
 }finally{clearTimeout(watchdog);await s.browser.close();}
}
function OwnershipUnavailable(o){return /^(unknown|other:supplier-not-named|)$/i.test(String(o||''));}
(async()=>{
 if(!snapshot){const seed=await h.exports.open({pageFile:process.env.BASE944,hash:'#about',W:1440,H:1000,gl:true});try{await seed.page.waitForFunction(()=>SYNC.status==='live'&&SYNC.first.size===Object.keys(SYNC_COLLS).length,null,{timeout:60000});assert(snapshot,'Native authenticated GET did not return the shared record');}finally{await seed.browser.close();}}
 const before=await read(process.env.BASE944,'before'),after=await read(process.env.PAGE,'after'),report=auditFinancial944(before,after);save('financial.json',report);assert(report.summary.ok,'Financial ownership reconciliation failed');
 assert.deepEqual(after.photos,before.photos,'Canonical per-item photo bindings changed');
 assert.deepEqual(after.units.map(u=>u.id).sort(),before.units.map(u=>u.id).sort(),'Physical IDs changed');
 const b=new Map(before.units.map(u=>[u.id,u]));for(const u of after.units){const prior=b.get(u.id);if(OwnershipUnavailable(prior.owner))assert.equal(u.owner,'coates');else assert.equal(u.owner,prior.owner);}
 for(const a of after.demob){const old=before.demob.find(x=>x.ref===a.ref);assert.deepEqual(a.parts,old.parts);assert.equal(a.evtN,old.evtN);assert.equal(a.evtUnk,old.evtUnk);assert.equal(a.ownership.ownerUnk,0);assert.equal(a.ownership.streams.reduce((n,s)=>n+s.n,0),a.evtN);}
 const ep=after.demob.find(r=>r.ref==='WC09');assert.equal(ep.ownership.streams.find(s=>s.s==='sub').n,10);
 const wc31=after.loading.find(r=>r.ref==='WC31').products.filter(p=>/16\s*pan/i.test(p.item));assert(wc31.length&&wc31.every(p=>p.owner==='event-portables'));
 assert(after.partial.length===1&&after.partial[0].qty==='2'&&after.partial[0].owner==='event-portables'&&after.partial[0].ids.length===0,'Incomplete WC31 allocation retains its explicit supplier plan without invented IDs');
 const accountRows=after.accounts['2026-10'].revenue;assert(accountRows.some(r=>r.stream==='Toilet Hire Revenue — event allocation'&&(r.extra.sources||[]).some(s=>/^Toilet Block/.test(s.basis))),'Coates toilet contracts use Hire accounting labels');assert(accountRows.some(r=>/^Rehire Revenue/.test(r.stream)&&(r.extra.sources||[]).some(s=>/Premiair/i.test(s.basis))),'Named PremAir contracts retain Rehire accounting labels');
 const phone=await read(process.env.PAGE,'phone',true);assert.deepEqual(phone.models,after.models);assert.deepEqual(phone.photos,after.photos);
 const summary={author:'Andrew Fisher',passed:true,candidateSha256:sha(process.env.PAGE),record:snapshot.version,financial:report.summary,correctedUnits:before.units.filter(u=>OwnershipUnavailable(u.owner)).length,canonicalPhotoBindingsUnchanged:true,unitIdsUnchanged:true,sourceRecordsUnchanged:true,desktopAndPhone:true,pageErrors:0,operationalWrites:0};save('summary.json',summary);console.log(JSON.stringify(summary));
})().catch(e=>{save('failure.json',{message:e.message,stack:e.stack});console.error('FAIL ownership proof; private output contains detail.');process.exitCode=1;});
