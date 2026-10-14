/* Author: Andrew Fisher. Read-only delayed shared-record routing and drawer-history regressions. */
'use strict';
const fs=require('fs'),path=require('path'),crypto=require('crypto');
const {open}=require('../../record_14Oct2026_purchase_order/readonly_page.cjs');
const pageFile=process.env.PAGE,out=process.env.OUT||'/workspace/private-gc500-audit14Oct2026/flows/focused';
if(!pageFile)throw new Error('PAGE must name a candidate file');fs.mkdirSync(out,{recursive:true});
const checks=[],results=[],check=(name,pass,details)=>{checks.push({name,pass:!!pass,details});console.log(JSON.stringify({name,pass:!!pass}));};
const gate=`<script>window.__routeAuditGate={held:true,waiting:[],release(){this.held=false;for(const task of this.waiting.splice(0))task.resolve();},fail(){for(const task of this.waiting.splice(0))task.reject(new TypeError('Simulated read outage'));}};const routeAuditFetch=window.fetch;window.fetch=async function(input,options){if(window.__routeAuditGate.held&&new URL(typeof input==='string'?input:input.url,location.href).pathname.startsWith('/api/'))await new Promise((resolve,reject)=>window.__routeAuditGate.waiting.push({resolve,reject}));return routeAuditFetch.apply(this,arguments);};</script>`;
const controlled=path.join(out,'controlled.html');fs.writeFileSync(controlled,fs.readFileSync(pageFile,'utf8').replace('</head>',gate+'</head>'));
const settled=p=>p.waitForFunction(()=>SYNC.status==='live'&&GC500Refresh904.report().settled&&Routes1016.ready(),null,{timeout:150000});
async function scenario(name,hash,fn){const h=await open({pageFile:controlled,hash,mobile:true,W:390,H:844});try{await fn(h.page);check(name+' has no runtime errors',!h.errors.length,h.errors);check(name+' has no operational writes',h.counts.blocked===0,h.counts);results.push({name,errors:h.errors,requests:h.counts});}finally{await h.browser.close();}}
(async()=>{try{
 await scenario('Cold shared reference','#asset/FL01',async p=>{
  const before=await p.evaluate(()=>({hash:location.hash,pending:Routes1016.pending(),drawer:document.querySelector('#drawer').classList.contains('on'),status:SYNC.status}));
  check('Missing cold reference retains requested address before shared data arrives',before.hash==='#asset/FL01'&&before.pending?.key==='FL01'&&!before.drawer,before);
  await p.evaluate(()=>__routeAuditGate.release());await settled(p);await p.waitForTimeout(500);
  const after=await p.evaluate(()=>({hash:location.hash,sel:state.sel,on:document.querySelector('#drawer').classList.contains('on'),pending:Routes1016.pending(),version:SYNC.backend.readVersion821()}));
  check('Shared reference opens automatically after its current record arrives',after.hash==='#asset/FL01'&&after.sel==='FL01'&&after.on&&!after.pending,after);
  await p.screenshot({path:out+'/shared-reference-phone.png'});
  await p.locator('#drawer [data-nav934-back]').click();await p.evaluate(()=>go('map'));await p.waitForTimeout(500);await p.evaluate(()=>openAsset('WC57'));await p.waitForTimeout(250);
  const initial=await p.evaluate(()=>({hash:location.hash,gc:history.state.gc,record:JSON.stringify(S)}));
  const refreshed=await p.evaluate(()=>{renderMap();Idle1006.redraw();photoRedraw();return {hash:location.hash,gc:history.state.gc,on:document.querySelector('#drawer').classList.contains('on'),sameRecord:JSON.stringify(S)};});
  check('Map updates keep the open reference address and create no phantom history',initial.hash==='#asset/WC57'&&refreshed.hash===initial.hash&&refreshed.gc===initial.gc&&refreshed.on,{before:{hash:initial.hash,gc:initial.gc},after:{hash:refreshed.hash,gc:refreshed.gc,on:refreshed.on}});
  check('Routing and refresh leave operational records untouched',initial.record===refreshed.sameRecord);
  await p.goBack();await p.waitForTimeout(350);const back=await p.evaluate(()=>({hash:location.hash,tab:state.tab,on:document.querySelector('#drawer').classList.contains('on')}));
  check('One browser Back closes reference and returns to its map',back.tab==='map'&&!back.on&&!back.hash.startsWith('#asset/'),back);
  await p.evaluate(()=>openAsset('WC57'));
  const mapAction=await p.evaluate(()=>{const b=document.querySelector('#showOnMap');if(!b)return {found:false};b.click();return {found:true,tab:state.tab,hash:location.hash,on:document.querySelector('#drawer').classList.contains('on')};});
  check('Explicit Show on map closes drawer and changes address normally',mapAction.found&&mapAction.tab==='map'&&mapAction.hash.startsWith('#sheet/')&&!mapAction.on,mapAction);
  await p.evaluate(()=>{openAsset('WC57');location.hash='#sheet/MASTER';});
  await p.waitForFunction(()=>state.tab==='map'&&!document.querySelector('#drawer').classList.contains('on'));
  const sheetAction=await p.evaluate(()=>({selected:state.sheet,tab:state.tab,hash:location.hash,on:document.querySelector('#drawer').classList.contains('on')}));
  check('Explicit sheet hash navigation closes drawer and opens requested sheet',sheetAction.selected==='MASTER'&&sheetAction.hash==='#sheet/MASTER'&&!sheetAction.on,sheetAction);

 });
 await scenario('Newer navigation','#asset/FL01',async p=>{
  await p.evaluate(()=>go('subhired'));const before=await p.evaluate(()=>({hash:location.hash,pending:Routes1016.pending()}));
  check('Explicit navigation cancels pending reference request',before.hash==='#subhired'&&!before.pending,before);
  await p.evaluate(()=>__routeAuditGate.release());await settled(p);await p.waitForTimeout(400);
  const after=await p.evaluate(()=>({hash:location.hash,tab:state.tab,on:document.querySelector('#drawer').classList.contains('on')}));
  check('Late shared data never pulls user back to abandoned reference',after.hash==='#subhired'&&after.tab==='subhired'&&!after.on,after);
 });
 await scenario('Newer asset request','#asset/FL01',async p=>{
  await p.evaluate(()=>{location.hash='#asset/WC57';});
  await p.waitForFunction(()=>state.sel==='WC57'&&document.querySelector('#drawer').classList.contains('on'));
  check('Selecting a different asset cancels the pending cold request',await p.evaluate(()=>location.hash==='#asset/WC57'&&!Routes1016.pending()));
  await p.evaluate(()=>__routeAuditGate.release());await settled(p);await p.waitForTimeout(400);
  check('Shared-data completion preserves the newer selected asset',await p.evaluate(()=>location.hash==='#asset/WC57'&&state.sel==='WC57'&&document.querySelector('#drawer').classList.contains('on')&&!Routes1016.pending()));
 });
 await scenario('Unknown reference','#asset/AUDIT-NOT-A-REFERENCE',async p=>{
  check('Unverified cold missing reference is not rejected early',await p.evaluate(()=>location.hash==='#asset/AUDIT-NOT-A-REFERENCE'&&!!Routes1016.pending()));
  await p.evaluate(()=>__routeAuditGate.release());await settled(p);await p.waitForTimeout(300);
  const after=await p.evaluate(()=>({hash:location.hash,tab:state.tab,on:document.querySelector('#drawer').classList.contains('on'),pending:Routes1016.pending()}));
  check('Truly unknown reference uses native rejection after shared data is ready',after.hash==='#plant'&&after.tab==='plant'&&!after.on&&!after.pending,after);
 });
 await scenario('Read failure and recovery','#asset/FL01',async p=>{
  await p.evaluate(()=>__routeAuditGate.fail());await p.waitForTimeout(12300);
  const outage=await p.evaluate(()=>({hash:location.hash,status:SYNC.status,pending:Routes1016.pending(),notice:document.querySelector('[data-route1016-waiting]')?.textContent}));
  check('Slow or failed shared read preserves requested reference with visible waiting status',outage.hash==='#asset/FL01'&&outage.pending?.key==='FL01'&&outage.status==='unreachable'&&outage.notice?.includes('FL01'),outage);
  await p.evaluate(()=>__routeAuditGate.release());await settled(p);await p.waitForTimeout(300);
  check('Recovery opens the original requested reference once',await p.evaluate(()=>location.hash==='#asset/FL01'&&state.sel==='FL01'&&document.querySelector('#drawer').classList.contains('on')&&!Routes1016.pending()));
 });
 await scenario('Cold embedded reference','#asset/WC57',async p=>{
  check('Existing embedded reference still opens before shared data arrives',await p.evaluate(()=>state.sel==='WC57'&&document.querySelector('#drawer').classList.contains('on')&&!Routes1016.pending()));
  await p.evaluate(()=>__routeAuditGate.release());await settled(p);await p.waitForTimeout(1500);
  check('Async map setup preserves cold embedded reference address',await p.evaluate(()=>location.hash==='#asset/WC57'&&state.sel==='WC57'&&document.querySelector('#drawer').classList.contains('on')));
 });
 }catch(error){check('Regression runner completed',false,String(error.stack||error));}finally{const report={author:'Andrew Fisher',sha256:crypto.createHash('sha256').update(fs.readFileSync(pageFile)).digest('hex'),checks,results,result:{checks:checks.length,passed:checks.filter(c=>c.pass).length},limitations:'GET-only current record; native writes are blocked. Network delay/outage is simulated solely in the test browser.'};fs.writeFileSync(out+'/review.json',JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify({result:report.result,failed:checks.filter(c=>!c.pass)}));if(checks.some(c=>!c.pass))process.exitCode=1;}})();
