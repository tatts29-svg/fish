/* Author: Andrew Fisher. Bounded GET-only native source, financial and day-view proof. */
'use strict';
const fs=require('fs'),path=require('path'),Module=require('module'),assert=require('assert/strict'),crypto=require('crypto');
for(const k of ['BASE950','PAGE','STATE950','OUT950'])assert(process.env[k],k+' required');
const root=path.resolve(__dirname,'../../toolchain/harness'),file=root+'/open_page.js',snapshot=JSON.parse(fs.readFileSync(process.env.STATE950)),out=process.env.OUT950;
fs.mkdirSync(out,{recursive:true,mode:0o700});const save=(n,x)=>fs.writeFileSync(path.join(out,n+'.json'),JSON.stringify(x,null,2),{mode:0o600});
const fetcher=require(root+'/curlfetch'),get=fetcher.curlFetch;fetcher.curlFetch=async(u,h,m,b)=>{assert.equal(m,'GET');const x=new URL(u);if(x.origin==='https://gc500-production.up.railway.app'&&['/api/state','/api/version'].includes(x.pathname))return {status:200,headers:{'content-type':'application/json'},body:Buffer.from(JSON.stringify(x.pathname==='/api/state'?snapshot:{version:snapshot.version,updated:snapshot.updated,level:'view'}))};return get(u,h,m,b);};
const init=`(()=>{const D=Date,n=D.parse('2026-10-08T23:00:00Z');window.Date=class extends D{constructor(...a){super(...(a.length?a:[n]));}static now(){return n;}};})();`;
const mod=new Module(file,module);mod.filename=file;mod.paths=Module._nodeModulePaths(root);
mod._compile(fs.readFileSync(file,'utf8').replace(/const okPost = [^;]+;/,'const okPost = false;').replace('counts.blocked++;',"counts.blocked++;(counts.denials||=[]).push({method:r.method(),origin:new URL(u).origin,path:new URL(u).pathname});").replace('const page = await ctx.newPage();',`await ctx.addInitScript({content:${JSON.stringify(init)}}); const page = await ctx.newPage();`),file);
async function read(candidate,label,mobile){
 const s=await mod.exports.open({pageFile:candidate,hash:'#about',W:mobile?390:1440,H:mobile?844:1000,mobile,gl:true}),p=s.page;const timer=setTimeout(()=>s.browser.close().catch(()=>{}),180000);
 try{
 await p.waitForFunction(()=>SYNC.status==='live'&&SYNC.first.size===Object.keys(SYNC_COLLS).length,null,{timeout:60000});
 const before=await p.evaluate(()=>{(SYNC.unsub||[]).forEach(f=>f());SYNC.unsub=[];window.__writes950=[];window.bump=()=>{__writes950.push('bump');throw Error('Test refuses native writes');};return JSON.stringify(S);});
 const result=await p.evaluate(()=>holdAssets(()=>{
 const clone=x=>JSON.parse(JSON.stringify(x)),aa=allAssets();return clone({state:S,specs:FLOW891.specs,models:{money:moneySummary(),costs:cj764Model(),pnl:pl770Model(),branches:pl752Rows(),reconciliation:recon888Model(),rehire:rh766Model(),contracts:contractFigures(ONHIRE_ROWS),quotes:DATA.rehire_quotes,labour:labourRevenue858(),allowance:labourAllowance858(),building:buildingTransportModel831(),costRows:allCosts(),costTotals:costTotals(allCosts()),assets:aa.map(a=>({key:a.key,total:assetTotal(a)})),accounts:Object.fromEntries(['2026-09','2026-10','2026-11'].map(m=>[m,acc761Model(m)]))},transport:transport888Build(),units:aa.map(a=>({ref:a.key,rows:gcModel925(a,{loading:false}).rows})),photos:aa.map(a=>{const m=gcModel925(a,{loading:false});return {ref:a.key,rows:m.rows.map(u=>({id:u.id,photos:Units925.photos(u,m.rows,dropPhotosOf(a.key)).map(p=>p.id).sort()}))};}),programme:programmeDays().map(d=>({iso:d.iso,unref:d.unref.map(r=>({id:r.task_id,qty:r.quantity_display,notes:r.notes,sub:r.subhired950||false})),loads:(d.loads||[]).map(l=>({id:l.id,rows:(l.rows||[]).map(r=>({ref:r.a&&r.a.key,dd:(r.events||[]).map(e=>e.dd)}))}))})),facts:{P45:assetOf('P45').events,T0266:assetOf('T0266').events,T0109:assetOf('T0109').events},arrival:arrival943Model()});}));save(label,result);
 if(label==='after'){
  await p.evaluate(()=>{state.day='2026-10-21';state.tlView='day';go('timeline');});
  const rows=p.locator('#pane-timeline tr.unref').filter({hasText:/T0273|T0274/});assert.equal(await rows.count(),2,'Both new WAU requests appear on21Oct');
  const words=await rows.allTextContents();assert(words.every(x=>x.includes('WAU')));assert(words.some(x=>/SUB-HIRED/.test(x)&&/supplier not specified/.test(x)));assert(words.every(x=>!x.includes('owner to confirm')));
  await p.locator('#pane-timeline details[data-ldsec="unref"] > summary').click();await rows.first().waitFor({state:'visible'});
  await rows.first().scrollIntoViewIfNeeded();await p.screenshot({path:path.join(out,'phone-WAU.png')});
  await rows.last().scrollIntoViewIfNeeded();await p.screenshot({path:path.join(out,'phone-WAU-aircon.png')});
  assert(await p.locator('#pane-timeline').evaluate(x=>x.scrollWidth<=x.clientWidth+2),'Timeline does not overflow phone');
  await p.setViewportSize({width:1440,height:1000});await rows.first().scrollIntoViewIfNeeded();await p.screenshot({path:path.join(out,'desktop-WAU.png')});
  const html=await p.evaluate(()=>holdAssets(()=>unrefBlock(programmeDays().find(d=>d.iso==='2026-10-21'),false)));assert(html.includes('T0273')&&html.includes('T0274')&&html.includes('WAU')&&html.includes('SUB-HIRED'));
  await p.evaluate(()=>{state.day='2026-10-13';renderTimeline();});
  const text=await p.locator('#pane-timeline').textContent();save('container-day',{text,details:await p.locator('#pane-timeline details').evaluateAll(ds=>ds.map(d=>({open:d.open,text:d.querySelector('summary')?.textContent})))});assert(text.includes('26121442'),'Container docket on its day');
  await p.evaluate(()=>{state.day='2026-10-12';renderTimeline();});const twelve=await p.locator('#pane-timeline').textContent();assert(twelve.includes('26122823'),'Corrected P45 docket on its day');
  assert(result.facts.T0109[0].note.includes('26122181')&&result.facts.T0109[0].note.includes('tynes'),'Events source requirements retained');
  const driver=await p.evaluate(()=>holdAssets(()=>{const text=iso=>{const d=programmeDays().find(d=>d.iso===iso),box=document.createElement('div');box.innerHTML=dpSheet(d,{});return box.textContent;};return {p45:text('2026-10-12'),container:text('2026-10-13')};}));
  assert(driver.p45.includes('26122823')&&!driver.p45.includes('26120528'),'Driver paper uses corrected P45 docket');assert(driver.container.includes('26121442'),'Driver paper includes container docket');save('driver-source',driver);
 }
 assert.equal(await p.evaluate(()=>JSON.stringify(S)),before,'Native record unchanged');assert.deepEqual(await p.evaluate(()=>__writes950),[]);assert.deepEqual(s.errors,[]);assert((s.counts.denials||[]).every(r=>r.method==='POST'&&r.origin==='https://tile.googleapis.com'&&r.path==='/v1/createSession'));save(label+'-requests',s.counts);return result;
 }finally{clearTimeout(timer);await s.browser.close();}
}
(async()=>{const b=await read(process.env.BASE950,'before',false),a=await read(process.env.PAGE,'after',true);
 assert.deepEqual(a.state,b.state);assert.deepEqual(a.specs,b.specs);assert.deepEqual(a.units,b.units);assert.deepEqual(a.photos,b.photos);assert.deepEqual(a.arrival,b.arrival);
 const diffs=[];for(const k of Object.keys(b.models)){try{assert.deepEqual(a.models[k],b.models[k]);}catch(e){diffs.push(k);}}save('changed-models',diffs);assert.deepEqual(diffs,[],'No financial model change is permitted');
 assert(a.models.reconciliation.ties.every(x=>x.ok));
 const newRows=a.transport.rows.filter(r=>['T0273','T0274'].includes(r.task));assert.equal(newRows.length,0,'Unallocated product demands are not invented transport loads');
 const summary={author:'Andrew Fisher',passed:true,sourceSha256:crypto.createHash('sha256').update(fs.readFileSync(process.env.PAGE)).digest('hex'),record:snapshot.version,modelsUnchanged:Object.keys(b.models).length,physicalUnitsAndPhotosUnchanged:true,nativeRecordUnchanged:true,arrivalInstructionsUnchanged:true,newScheduledRows:2,newRequestedItems:3,additionalCharges:0,phoneAndDesktop:true,errors:0,writes:0};save('summary',summary);console.log(JSON.stringify(summary));
})().catch(e=>{save('failure',{message:e.message,stack:e.stack});console.error('Schedule950 check failed; inspect private failure.json');process.exitCode=1;});
