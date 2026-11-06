/* Author: Andrew Fisher. Run with the release owner's GET-only harness and final candidate. Native setters use isolated in-memory state and no-op persistence. */
'use strict';
const fs=require('fs'),path=require('path');
const harness=process.env.GC500_READONLY_HARNESS;
if(!harness||!process.env.PAGE||!process.env.OUT)throw Error('GC500_READONLY_HARNESS, PAGE and private OUT required');
const {open}=require(path.resolve(harness));
(async()=>{let h;const report={author:'Andrew Fisher',checks:[]};try{
 h=await open({pageFile:process.env.PAGE,hash:'#fencing',W:process.env.MOB?390:1440,H:900});
 await h.page.waitForFunction(()=>typeof poReviewPatch1021==='function'&&SYNC.status==='live'&&SYNC.first&&SYNC.first.size===Object.keys(SYNC_COLLS).length,null,{timeout:180000});
 const before=await h.page.evaluate(()=>({version:SYNC.backend.readVersion821(),native:JSON.stringify(S)}));
 report.checks=await h.page.evaluate(()=>{
  const checks=[],check=(name,pass)=>{checks.push({name,pass:!!pass});};
  const original={S,save,bump,stampIt,mayWrite,whoAmI,flash};
  const initial=JSON.stringify(S);let bumps=0,notices=[];
  try{
   S=JSON.parse(initial);save=()=>true;bump=()=>{bumps++;};stampIt=()=>{};mayWrite=()=>true;whoAmI=()=>'Andrew Fisher';flash=message=>notices.push(message);
   if(typeof sharedCache975==='function')sharedCache975();
   const no='4647517', raw=JSON.parse(JSON.stringify(S.purchaseOrders[no]));
   const existing=poOf(no),review={by:'Andrew Fisher',at:new Date().toISOString()};
   check('native Mark checked succeeds',setPo(no,{checked:review}));
   if(typeof sharedCache975==='function')sharedCache975();
   check('native check has reviewed values',poReviewCurrent1021(poOf(no))&&!!S.purchaseOrders[no].checked.basis);
   const originalCheck=JSON.stringify(S.purchaseOrders[no].checked);
   check('same-value native Save succeeds',setPo(no,{amount:existing.amount,period:existing.period}));
   check('same-value native Save retains check',JSON.stringify(S.purchaseOrders[no].checked)===originalCheck);
   check('native amount edit succeeds',setPo(no,{amount:Number(existing.amount)+1}));
   if(typeof sharedCache975==='function')sharedCache975();
   check('native amount edit clears current check',S.purchaseOrders[no].checked===null&&!poReviewCurrent1021(poOf(no)));
   check('recheck is available after material change',poCheckButton1019(poOf(no)).includes('data-po-check1019'));
   const expected={...raw,amount:Number(existing.amount)+1,checked:null,updated_by:'Andrew Fisher',updated_at:S.purchaseOrders[no].updated_at};
   check('native edit preserves all unrelated order fields',JSON.stringify(Object.keys(expected).sort().map(k=>[k,expected[k]]))===JSON.stringify(Object.keys(S.purchaseOrders[no]).sort().map(k=>[k,S.purchaseOrders[no][k]])));
   const pane=document.createElement('section'),o=poOf(no);
   for(const [key,value] of [['period',o.period||''],['inv',o.invoice_no||''],['amt',o.amount==null?'':money(Number(o.amount))],['note',o.note||'']]){const input=document.createElement('input');input.setAttribute('data-po-'+key,no);input.value=value;pane.append(input);}
   const button=document.createElement('button');button.dataset.poCheck1019=no;pane.append(button);wirePoCard(pane);
   const amount=pane.querySelector('[data-po-amt]');amount.value=String(Number(o.amount)+1);const draft=amount.value,record=JSON.stringify(S.purchaseOrders[no]);bumps=0;notices=[];button.click();
   check('dirty Mark checked leaves saved order untouched',JSON.stringify(S.purchaseOrders[no])===record);
   check('dirty Mark checked retains typed value and reading position',amount.value===draft&&bumps===0);
   check('dirty Mark checked asks for Save',notices.some(message=>message.includes('Save this purchase order')));
   amount.value=money(Number(o.amount));notices=[];button.click();
   if(typeof sharedCache975==='function')sharedCache975();
   check('saved clean form can be marked checked',poReviewCurrent1021(poOf(no))&&bumps===1);
   check('reviewed check is shown and button removed',poCheckedBlock1019(poOf(no)).includes('P/O checked')&&!poCheckButton1019(poOf(no)));
   S.purchaseOrders[no].amount=Number(o.amount)+2;
   if(typeof sharedCache975==='function')sharedCache975();
   check('shared changed values cannot show stale checked label',!poCheckedBlock1019(poOf(no))&&poCheckButton1019(poOf(no)).includes('Mark checked'));
  }finally{S=original.S;save=original.save;bump=original.bump;stampIt=original.stampIt;mayWrite=original.mayWrite;whoAmI=original.whoAmI;flash=original.flash;if(typeof sharedCache975==='function')sharedCache975();}
  check('in-memory record restored exactly',JSON.stringify(S)===initial);
  return checks;
 });
 const after=await h.page.evaluate(()=>({version:SYNC.backend.readVersion821(),native:JSON.stringify(S)}));
 report.checks.push({name:'native version and full record unchanged',pass:before.version===after.version&&before.native===after.native});
 report.checks.push({name:'no application errors or attempted operational writes',pass:!h.errors.length&&!h.counts.blocked});report.requests=h.counts;report.errors=h.errors;report.nativeVersion=after.version;
}catch(error){report.checks.push({name:'regression completed',pass:false,error:String(error.message||error)});}finally{if(h)await h.browser.close();}
report.pass=report.checks.length>0&&report.checks.every(x=>x.pass);fs.writeFileSync(process.env.OUT,JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify({pass:report.pass,checks:report.checks.length,failed:report.checks.filter(x=>!x.pass)}));process.exitCode=report.pass?0:1;
})();
