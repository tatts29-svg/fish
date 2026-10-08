/* Author: Andrew Fisher. Frozen-record, GET-only rate display and money preservation. */
'use strict';
const fs=require('fs'),path=require('path'),Module=require('module'),assert=require('assert/strict'),crypto=require('crypto');
const ROOT=path.resolve(__dirname,'../../toolchain/harness'),hp=ROOT+'/open_page.js';
const modelOnly=process.env.MODEL_ONLY941==='1';
for(const key of [modelOnly?'REFERENCE_MODELS941':'BASE941','PAGE','FROZEN_STATE941','CLOCK941','OUT941'])assert(process.env[key],key+' is required');
const out=path.resolve(process.env.OUT941),snapshot=JSON.parse(fs.readFileSync(process.env.FROZEN_STATE941)),clock=JSON.parse(fs.readFileSync(process.env.CLOCK941)).iso;
fs.mkdirSync(out,{recursive:true,mode:0o700});
const save=(name,obj)=>fs.writeFileSync(path.join(out,name),JSON.stringify(obj,null,2),{mode:0o600});
const sha=file=>crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');
const f=require(ROOT+'/curlfetch'),get=f.curlFetch;
let editPractice=false;
f.curlFetch=async(url,headers,method,body)=>{
 assert.equal(method,'GET');const u=new URL(url);
 if(u.origin==='https://gc500-production.up.railway.app'&&['/api/state','/api/version'].includes(u.pathname))return {status:200,headers:{'content-type':'application/json','cache-control':'no-store'},body:Buffer.from(JSON.stringify(u.pathname==='/api/state'?snapshot:{version:snapshot.version,updated:snapshot.updated,level:editPractice?'edit':(snapshot.level||'view')}))};
 return get(url,headers,method,body);
};
const init=`(()=>{const D=Date,n=D.parse(${JSON.stringify(clock)});window.Date=class extends D{constructor(...a){super(...(a.length?a:[n]));}static now(){return n;}};})();`;
const h=new Module(hp,module);h.filename=hp;h.paths=Module._nodeModulePaths(path.dirname(hp));
h._compile(fs.readFileSync(hp,'utf8').replace(/const okPost = [^;]+;/,'const okPost = false;').replace('counts.blocked++;',"counts.blocked++;(counts.denials||=[]).push({method:r.method(),origin:new URL(u).origin,path:new URL(u).pathname});").replace('const page = await ctx.newPage();',`await ctx.addInitScript({content:${JSON.stringify(init)}}); const page = await ctx.newPage();`),hp);
async function read(file,label,mobile=false){
 const s=await h.exports.open({pageFile:file,hash:'#about',W:mobile?390:1440,H:mobile?844:1000,mobile,dpr:mobile?2:1,gl:true}),p=s.page,warnings=[];
 p.on('console',m=>{if(m.type()==='warning')warnings.push(m.text().slice(0,400));});
 const watchdog=setTimeout(()=>s.browser.close().catch(()=>{}),120000);
 try{
  await p.waitForFunction(()=>SYNC.status==='live'&&SYNC.first.size===Object.keys(SYNC_COLLS).length,null,{timeout:60000});
  const start=await p.evaluate(()=>({state:JSON.stringify(S),version:SYNC.backend.readVersion821(),now:new Date().toISOString()}));assert.equal(start.version,snapshot.version);assert.equal(start.now,clock);
  const data=await p.evaluate(()=>holdAssets(()=>{
   const serial=x=>JSON.parse(JSON.stringify(x,(_,v)=>v instanceof Map?{__map:[...v]}:v instanceof Set?{__set:[...v]}:v));
   const assets=allAssets().filter(a=>!a._cancelled),M={money:moneySummary(),costsJob:cj764Model(),pnl:pl770Model(),branches:pl752Rows(),transport:transport888View(),reconciliation:recon888Model(),rehire:rh766Model(),contracts:contractFigures(ONHIRE_ROWS),quotes:DATA.rehire_quotes,labourRevenue:labourRevenue858(),labourAllowance:labourAllowance858(),forecastBuildings:buildingTransportModel831(),handover:fh866Model(),costRows:allCosts(),costTotals:costTotals(allCosts()),assets:assets.map(a=>({key:a.key,totals:assetTotal(a)}))};
   const lines=M.assets.flatMap(a=>a.totals.lines.filter(l=>l.per==='day'&&l.days!=null).map(l=>({ref:a.key,line:l,display:window.Rate941?Rate941.rate(l):null,formula:window.Rate941?Rate941.formula(l):null})));
   return {models:serial(M),lines:serial(lines)};
  }));
  save(label+'-models.json',data.models);save(label+'-formulas.json',data.lines);
  if(label.startsWith('after')){
   editPractice=true; // Local read-only practice capability survives native polling.
   assert(data.lines.length>0);assert(data.lines.filter(r=>r.line.total!=null&&Number.isFinite(r.line.rate)&&Number.isFinite(r.line.qty)).every(r=>r.display.matched||r.display.note),'Every shown formula reconciles or explains its limitation');
   for(const ref of ['GN23','P10','WC20']){
    await p.evaluate(ref=>holdAssets(()=>{window.capability=()=> 'edit';window.mayWrite=()=>true;SYNC.readonly=false;SYNC.level='edit';openAsset(ref);applyCapability();}),ref);
    await p.waitForTimeout(500); // Native per-item enhancement redraws the open drawer asynchronously.
    await p.evaluate(()=>document.querySelectorAll('#drawer .rate941-formula').forEach(e=>{for(let n=e.parentElement;n&&n.id!=='drawer';n=n.parentElement)if(n.tagName==='DETAILS')n.open=true;}));
    await p.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));
    const rows=await p.locator('#drawer .rate941-formula').allTextContents();const expected=data.lines.filter(x=>x.ref===ref).map(x=>x.formula);assert(expected.length>0);assert(expected.every(t=>rows.some(row=>row.includes(t))),'Actual drawer must render the new formula');
    await p.locator('#drawer .rate941-formula').first().evaluate(e=>{const d=document.querySelector('#drawer'),b=d.querySelector('.db'),sc=d.scrollHeight>d.clientHeight+1?d:b;sc.scrollTop+=e.getBoundingClientRect().top-innerHeight*.5;});
    await p.waitForTimeout(200);
    const geometry=await p.locator('#drawer .rate941-formula').first().evaluate(e=>{const b=e.getBoundingClientRect();return {top:b.top,bottom:b.bottom,height:b.height,viewport:innerHeight,ancestors:[...function*(n){for(;n;n=n.parentElement)yield n;}(e)].map(n=>({tag:n.tagName,id:n.id,top:n.scrollTop,height:n.clientHeight,scroll:n.scrollHeight}))};});
    save(label+'-'+ref+'-geometry.json',geometry);
    await p.screenshot({path:path.join(out,label+'-'+ref+'.png')});
    assert(geometry.height>0&&geometry.top>=0&&geometry.bottom<=geometry.viewport,'Shown formula must be in the screenshot');
    assert(await p.locator('#drawer').evaluate(d=>d.scrollWidth<=d.clientWidth+2),'Rate precision must not overflow the drawer');
   }
  }
  const end=await p.evaluate(()=>({state:JSON.stringify(S),version:SYNC.backend.readVersion821()}));assert.equal(start.state,end.state);assert.equal(start.version,end.version);assert.deepEqual(s.errors,[]);
  assert((s.counts.denials||[]).every(r=>r.method==='POST'&&r.origin==='https://tile.googleapis.com'&&r.path==='/v1/createSession'));
  return {models:data.models,state:start.state,formulas:data.lines.length,withExtraPrecision:data.lines.filter(l=>l.display?.digits>2).length,fallbacks:data.lines.filter(l=>l.display&&!l.display.matched).length,requests:s.counts,errors:s.errors,warnings};
 }finally{editPractice=false;clearTimeout(watchdog);await s.browser.close();}
}
(async()=>{
 if(modelOnly){
  const final=await read(process.env.PAGE,'final'),reference=JSON.parse(fs.readFileSync(process.env.REFERENCE_MODELS941));
  assert.deepEqual(final.models,reference,'Financial model output changed from the frozen audited reference');
  const summary={author:'Andrew Fisher',passed:true,candidateSha256:sha(process.env.PAGE),record:snapshot.version,clock,financialModelResults:Object.keys(final.models).length,financialModelsUnchanged:true,nativeRecordUnchanged:true,pageErrors:0,operationalWrites:0};save('summary.json',summary);console.log(JSON.stringify(summary));return;
 }
 const before=await read(process.env.BASE941,'before'),after=await read(process.env.PAGE,'after'),phone=await read(process.env.PAGE,'after-phone',true);
 assert.deepEqual(before.models,after.models,'Financial model output changed');assert.deepEqual(after.models,phone.models);assert.equal(before.state,after.state);assert.equal(after.state,phone.state);
 const summary={author:'Andrew Fisher',passed:true,baseSha256:sha(process.env.BASE941),candidateSha256:sha(process.env.PAGE),record:snapshot.version,clock,financialModelResults:Object.keys(after.models).length,financialModelsUnchanged:true,nativeRecordUnchanged:true,formulasChecked:after.formulas,extraPrecision:after.withExtraPrecision,explicitLimitations:after.fallbacks,desktopAndPhone:true,pageErrors:0,operationalWrites:0};save('summary.json',summary);console.log(JSON.stringify(summary));
})().catch(e=>{save('failure.json',{message:e.message,stack:e.stack});console.error('FAIL display test; detailed evidence is in the private output folder.');process.exitCode=1;});
