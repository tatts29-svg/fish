// Author: Andrew Fisher. Isolated native print previews; all operational writes blocked.
// PAGE=<candidate> STATE_ROOT=<private snapshot directory> OUT=<private evidence directory> node this-file
const fs=require('fs'),path=require('path');const {chromium}=require('playwright');const {curlFetch}=require('/workspace/gc500-showcase-full-lap/03_GC500_Delivery_Control/toolchain/harness/curlfetch');
const ROOT=process.env.STATE_ROOT||'/workspace/private-nextweek-followup',OUT=process.env.OUT||'/workspace/private-v808-review',HOST='https://gc500-production.up.railway.app';
(async()=>{const browser=await chromium.launch({executablePath:'/usr/bin/chromium',args:['--no-sandbox','--lang=en-AU']}),meta={author:'Andrew Fisher',candidate_sha256:require('crypto').createHash('sha256').update(fs.readFileSync(process.env.PAGE||path.join(OUT,'candidate.html'))).digest('hex'),errors:[],blocked:[],at:new Date().toISOString()};try{
const ctx=await browser.newContext({viewport:{width:1440,height:1000},locale:'en-AU',timezoneId:'Australia/Brisbane'});await ctx.route('**/*',async route=>{const r=route.request(),u=r.url();if(u.startsWith('data:')||u.startsWith('blob:'))return route.continue();if(r.method()!=='GET'){meta.blocked.push({method:r.method(),path:new URL(u).pathname});return route.abort();}const p=new URL(u).pathname;if(new URL(u).origin===HOST){const file=p.startsWith('/v/Coates-GC500-2026')?'page.html':p==='/api/state'?'state.json':p==='/api/version'?'version.json':null;if(file)return route.fulfill({status:200,contentType:file.endsWith('html')?'text/html':'application/json',body:fs.readFileSync(file==='page.html'?(process.env.PAGE||path.join(OUT,'candidate.html')):path.join(ROOT,file))});}try{return route.fulfill(await curlFetch(u,r.headers(),'GET'));}catch{return route.abort();}});
const p=await ctx.newPage();p.on('pageerror',e=>meta.errors.push(e.message));await p.goto(HOST+'/v/Coates-GC500-2026/#timeline',{waitUntil:'load',timeout:180000});await p.waitForFunction(()=>SYNC.status==='live'&&SYNC.first.size===Object.keys(SYNC_COLLS).length,null,{timeout:180000});
const assertions=[];const check=(name,ok,detail)=>{assertions.push({name,pass:!!ok,detail});if(!ok)throw Error(name+': '+JSON.stringify(detail));};
const result=await p.evaluate(()=>{
 const text=h=>{const t=document.createElement('div');t.innerHTML=h;return t.textContent.replace(/\s+/g,' ').trim()};
 const day=iso=>programmeDays().find(d=>d.iso===iso), wd=day('2026-10-07'),th=day('2026-10-08');
 const one=(d,key)=>dpLoads(d).find(g=>g.rows.some(r=>r.a.key===key));
 const current=[...dpLoads(wd),...dpLoads(th)].map(g=>({keys:g.rows.map(r=>r.a.key),dd:g.dds,rank:g.departure_order,rows:g.rows.map(r=>sheet808Record(r)),driver:text(dpPage(g.booking801?wd:th,g,'drv',1,1)),install:text(dpPage(g.booking801?wd:th,g,'ins',1,1))}));
 const before=JSON.stringify(S), rows=[];
 const fixture={key:'PRINT808_FIXTURE',item_types:['FWF'],accessories:[],charge_lines:[{item:'FWF',quantity:2}],events:[]},r={a:fixture,events:[{item:'FWF',quantity_display:'2'}]};
 const run=(label,sup,units,delivery,asset=fixture)=>{S.supplied.PRINT808_FIXTURE=sup;S.units.PRINT808_FIXTURE={units};S.delivery.PRINT808_FIXTURE=delivery;rows.push({label,record:sheet808Record({...r,a:asset})});};
 const numbered=[{label:'Sub-hire: Event Portables',asset_no:'101'},{label:'Sub-hire: Event Portables',asset_no:'102'}],onsite={state:'on site',done:true,by:'Fixture',set_at:'2026-10-01T00:00:00Z'};
 const restore={supplied:S.supplied.PRINT808_FIXTURE,units:S.units.PRINT808_FIXTURE,delivery:S.delivery.PRINT808_FIXTURE};
 run('blank count remains unknown',{},[],{});
 run('green Complete without units remains unknown',{},[],onsite);
 run('single numbered FWF counted',{},numbered,onsite);
 run('numbers without recorded arrival remain unknown',{},numbered,{});
 run('duplicate serial counted once',{},[numbered[0],numbered[0]],onsite);
 run('blank serial cannot count',{},[numbered[0],{label:'Sub-hire: Event Portables',asset_no:''}],onsite);
 run('mixed types cannot infer receipt',{},numbered,onsite,{...fixture,item_types:['FWF','Waste tank'],charge_lines:[...fixture.charge_lines,{item:'Waste tank',quantity:1}]});
 run('accessories cannot infer receipt',{},numbered,onsite,{...fixture,accessories:[{type:'Pee Panel',qty:1}]});
 run('negative typed quantity unknown despite units',{items:[{asked:'FWF',qty_supplied:-1}]},numbered,onsite);
 run('typed zero retained',{items:[{asked:'FWF',qty_supplied:0}]},[],{});
 run('different supplied type unconfirmed',{items:[{asked:'FWF',supplied:'Accessible Toilet',qty_supplied:1}]},[],{});
 run('typed and numbered disagreement unconfirmed',{items:[{asked:'FWF',qty_supplied:1}]},numbered,onsite);
 run('placeholder serial not a receipt',{},[{label:'Sub-hire: Event Portables',asset_no:'UNALLOCATED'}],onsite);
 run('decimal explicit count does not fall back',{items:[{asked:'FWF',qty_supplied:1.5}]},numbered,onsite);
 run('boolean explicit count does not fall back',{items:[{asked:'FWF',qty_supplied:true}]},numbered,onsite);
 run('over receipt flagged',{items:[{asked:'FWF',qty_supplied:3}]},[],{});
 ['supplied','units','delivery'].forEach(k=>{if(restore[k]===undefined)delete S[k].PRINT808_FIXTURE;else S[k].PRINT808_FIXTURE=restore[k]});
 const wc=S.supplied.WC20,wu=S.units.WC20;
 S.supplied.WC20={items:[{asked:'Waste tank',qty_supplied:1},{asked:'Toilet Block 6m',qty_supplied:1}]};
 S.units.WC20={units:[{label:'Sub-hire: Event Portables',asset_no:'1327228'},{label:'Sub-hire: Event Portables',asset_no:'1327225'},{label:'Sub-hire: Event Portables',asset_no:'UNALLOCATED'}]};
 const split=dpLoads(wd).filter(g=>g.rows.some(r=>r.a.key==='WC20')).map(g=>({dds:g.dds,model:sheet808Record(g.rows[0]),html:text(dpPage(wd,g,'drv',1,1))}));
 if(wc===undefined)delete S.supplied.WC20;else S.supplied.WC20=wc;if(wu===undefined)delete S.units.WC20;else S.units.WC20=wu;
 return {current,fixtures:rows,split,stateRestored:JSON.stringify(S)===before,wednesdayGroups:dpLoads(wd).length,thursdayGroups:dpLoads(th).length};
});
check('all 15 Wednesday groups retained',result.wednesdayGroups===15);check('all 6 Thursday groups retained',result.thursdayGroups===6);check('isolated fixture state restored exactly',result.stateRestored);
const find=k=>result.current.find(g=>g.keys.includes(k));let x=find('WC33');check('completed WC33 17 recorded and 0 remaining',x.rows[0].lines[0].recorded===17&&x.rows[0].lines[0].remaining===0);check('WC33 planned headings on both sheets',x.driver.includes('Planned delivery')&&x.install.includes('Planned installation')&&x.driver.includes('Remaining: 0'));
x=find('WC31');check('mixed WC31 per-type shortages',JSON.stringify(x.rows[0].lines.map(l=>[l.item,l.recorded,l.remaining]))===JSON.stringify([['Accessible Toilet',0,1],['16Pan Block',1,1]]));check('WC31 reference Complete is explicitly scoped',x.driver.includes('Reference status: on site · Complete recorded'));
check('WC32 discrepancy visible on both sheets',find('WC32').driver.includes('row 39 (8 Oct 2026), marks cancelled; current system active')&&find('WC32').install.includes('Confirm before dispatch'));
check('unknown FWF is not zero',find('WC38').rows[0].lines[0].remaining===null);
const expected=[null,null,0,null,1,null,null,null,null,2,null,null,null,null,null,0];result.fixtures.forEach((f,i)=>check(f.label,f.record.lines[0].remaining===expected[i],f.record.lines[0]));
check('WC20 four separate sheets',result.split.length===4);result.split.forEach((s,i)=>{const l=s.model.lines[0];check('split '+i+' preserves1 planned vs2 reference',l.planned===1&&l.total===2&&l.recorded===1&&l.remaining===1&&l.split);check('split '+i+' no receipt assigned to DD',s.html.includes('Receipt allocation to this load is not recorded')&&!s.html.includes('UNALLOCATED'));if(l.item==='Waste tank')check('tank '+i+' no block asset numbers',!s.html.includes('1327228')&&!s.html.includes('1327225'));else check('block '+i+' exact one booked number',s.html.includes('1327228')!==s.html.includes('1327225'));});
fs.writeFileSync(path.join(OUT,'projection.json'),JSON.stringify(result,null,2));
await p.evaluate(()=>{window.print=()=>{};});
for(const doc of ['drv','ins']){for(const key of ['WC31','WC33','WC32']){
await p.evaluate(({doc,key})=>{const d=programmeDays().find(x=>x.iso==='2026-10-08'),i=dpLoads(d).findIndex(g=>g.rows.some(r=>r.a.key===key));dpPrint(d.iso,doc,{link:true,only:i})},{doc,key});
await p.waitForFunction(()=>document.querySelector('#dayprint')?.dataset.dpReady==='1',null,{timeout:90000});
const actual=await p.locator('#dayprint .dp-page').first().innerText();check('native '+doc+' '+key+' current supply shown',actual.toLowerCase().includes('planned equipment and current supply'));
const fit=await p.evaluate(()=>({over:window.__dpLast?.over,k:document.querySelector('#dayprint .dp-page')?.style.getPropertyValue('--k')}));check('native '+doc+' '+key+' fits A4',!fit.over?.length,fit);
await p.screenshot({path:path.join(OUT,doc+'-'+key+'.png')});
await p.evaluate(()=>{DPBAR.done?.();document.getElementById('dayprint')?.remove();});
}}
for(const doc of ['drv','ins']){
 await p.evaluate(doc=>dpPrint('2026-10-07',doc,{link:true}),doc);await p.waitForFunction(()=>document.querySelector('#dayprint')?.dataset.dpReady==='1',null,{timeout:90000});
 check('all15Wednesday '+doc+' A4 sheets fit',await p.evaluate(()=>!window.__dpLast.over.length));
 check('all15Wednesday '+doc+' rendered',await p.locator('#dayprint .dp-'+doc).count()===15);
 if(doc==='drv'){await p.locator('#dayprint .dp-drv').nth(6).screenshot({path:path.join(OUT,'driver-WC20-tank.png')});await p.locator('#dayprint .dp-drv').nth(8).screenshot({path:path.join(OUT,'driver-WC20-block.png')});}
 await p.evaluate(()=>{DPBAR.done?.();document.getElementById('dayprint')?.remove();});
}
await p.setViewportSize({width:390,height:844});await p.evaluate(()=>{const d=programmeDays().find(x=>x.iso==='2026-10-08'),i=dpLoads(d).findIndex(g=>g.rows.some(r=>r.a.key==='WC31'));dpFromLink('install',d.iso,i)});await p.waitForFunction(()=>document.querySelector('#dayprint')?.dataset.dpReady==='1',null,{timeout:90000});
await p.screenshot({path:path.join(OUT,'phone-WC31.png')});check('native phone preview page fits viewport',await p.evaluate(()=>{const r=document.querySelector('#dayprint .dp-page').getBoundingClientRect();return r.width<=innerWidth+1&&r.right<=innerWidth+1}));
await p.pdf({path:path.join(OUT,'installer-WC31.pdf'),preferCSSPageSize:true,printBackground:true});
fs.writeFileSync(path.join(OUT,'checks.json'),JSON.stringify({author:'Andrew Fisher',assertions,...meta},null,2));console.log(JSON.stringify({checks:assertions.length,...meta}));
}finally{await browser.close();fs.writeFileSync(path.join(OUT,'runtime_meta.json'),JSON.stringify(meta,null,2));}})().catch(e=>{console.error(e);process.exitCode=1});
