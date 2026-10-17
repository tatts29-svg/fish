/* Author: Andrew Fisher. Native Save practice captures transport; never writes the live record. */
const fs=require('fs'),path=require('path'),assert=require('assert');
const {open}=require(path.resolve(__dirname,'../../toolchain/harness/open_page'));
const out=process.env.OUT||'/workspace/private-gc5001010-pricing-ui';fs.mkdirSync(out,{recursive:true});
const report={author:'Andrew Fisher',checks:[],errors:[],blocked:0};
function check(name,ok,detail){report.checks.push({name,ok,detail});assert(ok,name+': '+JSON.stringify(detail));}
(async()=>{
 for(const mobile of [true,false]){
  const label=mobile?'phone':'desktop',h=await open({pageFile:process.env.PAGE,mobile,W:mobile?390:1440,H:mobile?844:1000,dpr:1});
  try{
   const p=h.page;await p.waitForFunction(()=>SYNC.status==='live'&&GC500Refresh904.report().settled,null,{timeout:120000});
   const version=await p.evaluate(()=>SYNC.backend.readVersion821());
   await p.route('**/api/version',r=>r.fulfill({status:200,contentType:'application/json',body:JSON.stringify({version,level:'edit'})}));
   await p.evaluate(()=>{
    capability=()=> 'edit';canEdit=()=>true;mayWrite=()=>true;whoAmI=()=> 'Practice operator';SYNC.readonly=false;SYNC.level='edit';
    window.__pee1010writes=[];
    SYNC.db.doc=path=>({set:body=>{window.__pee1010writes.push({path,body});return new Promise(()=>{});},delete:()=>{window.__pee1010writes.push({path,body:null});return new Promise(()=>{});}});
    go('timeline');openAsset('WC09');
    document.querySelector('#drawer [data-profile1006-item="Pee Panel"]').open=true;
    document.querySelector('[data-pee1010-info]').open=true;
   });
   const field=p.locator('#pee1010-rate'),form=p.locator('[data-pee1010-editor]'),result=p.locator('[data-pee1010-result]');
   check(label+' full hire basis displayed beside rate',(await p.locator('#drawer [data-profile1006-item="Pee Panel"] .pee1010-basis').textContent())==='Full hire / panel');
   check(label+' daily reference is explicitly separate',(await p.locator('[data-pee1010-info]').textContent()).includes('Daily reference only · not added to full hire'));
   const before=await p.evaluate(()=>({rate:S.lineRates?.['hire|WC09|Pee Panel']??null,price:peePrice1010().fullHireRate,actual:peePrice1010().actualAmount}));
   await field.fill('700');await field.blur();
   const typed=await p.evaluate(()=>({rate:S.lineRates?.['hire|WC09|Pee Panel']??null,price:peePrice1010().fullHireRate,count:__pee1010writes.length}));
   check(label+' typing and blurring never saves or changes charge',typed.rate===before.rate&&typed.price===before.price&&typed.count===0,{before,typed});
   await p.evaluate(()=>Idle1006.refreshDrawer());
   check(label+' unsaved draft survives live drawer refresh',await field.inputValue()==='700'&&(await result.textContent())==='Unsaved changes');
   await field.fill('449.99');await form.locator('[type="submit"]').click();
   check(label+' below-floor rate refused before native save',(await result.textContent()).includes('at least $450')&&await p.evaluate(()=>__pee1010writes.length===0));
   await field.fill('not a number');await form.locator('[type="submit"]').click();
   check(label+' malformed rate refused',(await result.textContent()).includes('valid full hire rate')&&await p.evaluate(()=>__pee1010writes.length===0));
   await field.fill('700');await form.locator('[type="submit"]').click();
   const saved=await p.evaluate(()=>({value:S.lineRates['hire|WC09|Pee Panel'],price:peePrice1010().fullHireRate,actual:peePrice1010().actualAmount,received:peePrice1010().arrivedQuantity,text:document.querySelector('[data-pee1010-result]').textContent}));
   check(label+' Save uses native rate and shared price once',saved.value==='700'&&saved.price===700&&saved.actual===700*saved.received,saved);
   check(label+' native Save does not claim shared confirmation early',saved.text.includes('syncing')&&!saved.text.startsWith('SAVED'),saved.text);
   await p.waitForFunction(()=>__pee1010writes.some(w=>w.path.startsWith('lineRates/')),null,{timeout:10000});
   const fields=await p.evaluate(()=>__pee1010writes.filter(w=>['lineRates','stamps','by'].includes(w.path.split('/')[0])).map(w=>w.path.split('/')[0]));
   check(label+' rate and stamped author transport were captured',['lineRates','stamps','by'].every(k=>fields.includes(k)),fields);
   await p.evaluate(()=>{
    for(const w of __pee1010writes){const [collection,id]=w.path.split('/');if(!SYNC.last[collection])SYNC.last[collection]={};if(w.body===null)delete SYNC.last[collection][id];else SYNC.last[collection][id]=JSON.stringify(w.body);delete SYNC.inflight[w.path];delete SYNC.queue[collection]?.[id];}
    SYNC.status='live';syncFooter();
   });
   check(label+' exact acknowledgement reports shared save',(await result.textContent())==='SAVED · shared record updated');
   await field.fill('710');
   await p.evaluate(()=>{S.lineRates['hire|WC09|Pee Panel']='720';S.stamps['lineRates/hire|WC09|Pee Panel']='2099-01-01T00:00:00.000Z';sharedCache975();Idle1006.refreshDrawer();});
   await form.locator('[type="submit"]').click();
   check(label+' stale draft refuses to overwrite current shared rate',await p.evaluate(()=>S.lineRates['hire|WC09|Pee Panel']==='720')&&(await result.textContent()).includes('changed elsewhere'));
   await p.locator('[data-pee1010-reload]').click();
   check(label+' explicit Reload replaces stale draft',await field.inputValue()==='720');
   await field.fill('');await form.locator('[type="submit"]').click();
   check(label+' blank reset removes only full override',await p.evaluate(()=>!Object.hasOwn(S.lineRates,'hire|WC09|Pee Panel')));
   check(label+' reset awaits deletion and fresh stamp acknowledgement',!(await result.textContent()).startsWith('SAVED'));
   await p.locator('[data-pee1010-info]').scrollIntoViewIfNeeded();
   await p.screenshot({path:out+'/'+label+'-rate-save.png'});
   report.errors.push(...h.errors);report.blocked+=h.counts.blocked;
  }finally{await h.browser.close();}
 }
 check('zero browser errors',report.errors.length===0,report.errors);check('zero live operational writes',report.blocked===0,report.blocked);
 fs.writeFileSync(out+'/review.json',JSON.stringify(report,null,2));console.log(JSON.stringify({passed:true,checks:report.checks.length,errors:report.errors,blocked:report.blocked,out}));
})().catch(e=>{report.failure=String(e);fs.writeFileSync(out+'/review.json',JSON.stringify(report,null,2));console.error(e);process.exitCode=1;});
