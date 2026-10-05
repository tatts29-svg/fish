// Author: Andrew Fisher. Native supplier-sheet preview and print wiring with all service writes blocked.
// PAGE candidate and private OUT required. window.print is a capture; no real print or record action occurs.
'use strict';
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const root=path.dirname(__dirname),out=process.env.OUT,pageFile=process.env.PAGE;if(!out||!pageFile)throw Error('PAGE and private OUT required');fs.mkdirSync(out,{recursive:true});
const {installWriteGuard,ready840}=require(path.join(root,'v8.40_today_work_progress_LIVE/test_today840.cjs')),guard=installWriteGuard();
const {open}=require(path.join(process.env.GC500_TOOLCHAIN||path.join(root,'toolchain'),'harness/open_page.js'));const checks=[],details=[];
const check=(name,ok,detail)=>{checks.push({name,ok:!!ok,detail});if(!ok)console.error('FAIL',name);};
(async()=>{try{for(const view of [{name:'desktop',W:1700,H:1100},{name:'phone',W:390,H:844,mobile:true,dpr:2}]){
 const s=await open({...view,pageFile,hash:'#timeline'}),p=s.page;await ready840(p,false);
 const snapshot=await p.evaluate(()=>{window.__supplier841Test={nativePrint:window.print,prints:[],delivery:JSON.stringify(S.delivery)};window.print=()=>{const w=document.querySelector('#ep819print');window.__supplier841Test.prints.push({sheet:w?.querySelector('.rs819')?.dataset.ep819Sheet,text:w?.querySelector('.rs819')?.textContent});window.dispatchEvent(new Event('afterprint'));};
  const load=EP819.loads[0],w=ep819Print(load.n,{hold:true});return {n:load.n,date:load.date,refs:w.__supplierPrint841.refs,printedRefs:load.stops.flatMap(s=>s.drops.map(d=>d.ref).filter(Boolean)),disclosure:epRecLine819(load),pageText:w.querySelector('.rs819').textContent,prints:window.__supplier841Test.prints.length,readonly:SYNC.readonly,capability:capability()};});details.push({view:view.name,snapshot});
 check(view.name+' held native preview makes no print or record change',snapshot.prints===0&&await p.evaluate(()=>JSON.stringify(S.delivery)===window.__supplier841Test.delivery));
 check(view.name+' snapshot uses only references printed on this sheet',snapshot.refs.every(k=>snapshot.printedRefs.includes(k)));
 check(view.name+' supplier date discrepancy remains on the sheet',!snapshot.disclosure||snapshot.pageText.includes(snapshot.disclosure));
 check(view.name+' genuine view-only capability retained',snapshot.readonly&&snapshot.capability==='view');
 await p.screenshot({path:path.join(out,view.name+'-supplier-preview.png')});
 await p.locator('[data-ep819-go]').click();await p.waitForTimeout(120);
 const manual=await p.evaluate(()=>({prints:window.__supplier841Test.prints.length,unchanged:JSON.stringify(S.delivery)===window.__supplier841Test.delivery}));check(view.name+' native preview Print button calls captured print once without writes',manual.prints===1&&manual.unchanged,manual);await p.evaluate(()=>ep819Close());
 const crossover=await p.evaluate(()=>{ep819Print(EP819.loads[0].n,{hold:true});const day=programmeDays().find(d=>dpLoads(d).some(g=>g.kind==='deliveries'));dpFromLink('drivers',day.iso);const result={supplierOpen:epOpen819(),supplierPrintClass:document.body.classList.contains('ep819-printing'),supplierHidden:document.querySelector('#ep819print').hidden};dpBarClose();return result;});
 check(view.name+' native driver link dismisses supplier print content before preparation',!crossover.supplierOpen&&!crossover.supplierPrintClass&&crossover.supplierHidden,crossover);
 const reverse=await p.evaluate(()=>{document.body.classList.add('printing-day','pdf7-make');const stale=document.createElement('style');stale.id='dayPage';stale.textContent='@page{size:A4}';document.head.appendChild(stale);ep819Print(EP819.loads[0].n,{hold:true});const result={supplier:epOpen819(),native:document.body.classList.contains('printing-day'),pdf:document.body.classList.contains('pdf7-make'),oldPage:!!document.getElementById('dayPage')};ep819Close();return result;});
 check(view.name+' supplier preview clears inherited native print presentation',reverse.supplier&&!reverse.native&&!reverse.pdf&&!reverse.oldPage,reverse);
 const after=await p.evaluate(()=>{const before=window.__supplier841Test.prints.length;ep819Print(EP819.loads[0].n);ep819Close();return before;});await p.waitForTimeout(150);check(view.name+' closing before native print timer prevents a late print',await p.evaluate(n=>window.__supplier841Test.prints.length===n,after));
 await p.evaluate(()=>ep819Print(EP819.loads[0].n));await p.waitForTimeout(180);
 const auto=await p.evaluate(()=>({prints:window.__supplier841Test.prints.length,open:epOpen819(),unchanged:JSON.stringify(S.delivery)===window.__supplier841Test.delivery}));check(view.name+' native automatic print and natural afterprint close preserve records',auto.prints===after+1&&!auto.open&&auto.unchanged,auto);
 await p.evaluate(()=>{ep819Close();window.print=window.__supplier841Test.nativePrint;delete window.__supplier841Test;});check(view.name+' no runtime exception',s.errors.length===0,s.errors);await s.browser.close();
 }check('zero operational write attempts',!guard.nonGetSeen.some(x=>x.operational),guard.nonGetSeen);
 }catch(e){checks.push({name:'fatal',ok:false,detail:e.stack});}finally{await guard.closeAll();fs.writeFileSync(path.join(out,'supplier-print841-browser.json'),JSON.stringify({author:'Andrew Fisher',sha:crypto.createHash('sha256').update(fs.readFileSync(pageFile)).digest('hex'),checks,details,guard},null,2));console.log(JSON.stringify({passed:checks.filter(x=>x.ok).length,total:checks.length,failures:checks.filter(x=>!x.ok),out}));if(checks.some(x=>!x.ok))process.exitCode=1;}})();
