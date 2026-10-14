/* Author: Andrew Fisher. Read-only browser check; synthetic in-memory edits never save to the service. */
'use strict';
const fs=require('node:fs'),path=require('node:path');
const rig=path.resolve(__dirname,'../../toolchain/harness'),fetcher=require(rig+'/curlfetch');
const fixture=JSON.parse(fs.readFileSync(process.env.STATE,'utf8')),fetchBefore=fetcher.curlFetch;
let attemptedWrites=0;
fetcher.curlFetch=async function(url,headers,method='GET',body){
 if(method!=='GET'){if(new URL(url).pathname.startsWith('/api/'))attemptedWrites++;return{status:405,headers:{'content-type':'text/plain'},body:'Read-only test'};}
 const p=new URL(url).pathname;
 if(p==='/api/state'||p==='/api/version')return{status:200,headers:{'content-type':'application/json'},body:JSON.stringify(p==='/api/state'?fixture:{version:fixture.version,level:'view',updated:fixture.updated})};
 return fetchBefore.call(this,url,headers,method,body);
};
const {open}=require(rig+'/open_page');let h;
(async()=>{try{
 h=await open({pageFile:process.env.PAGE,hash:'#fencing',W:390,H:844,mobile:true});
 await h.page.waitForFunction(()=>SYNC.status==='live'&&SYNC.first.size===Object.keys(SYNC_COLLS).length,null,{timeout:180000});
 await h.page.clock.install({time:new Date('2026-10-14T03:00:00Z')});
 const result=await h.page.evaluate(()=>{
  const prior=JSON.stringify(S),checks=[],ck=(name,pass)=>{checks.push({name,pass:!!pass});if(!pass)throw Error(name);};
  const dom=html=>{const t=document.createElement('template');t.innerHTML=html;return t.content;};
  const reset=()=>{S=JSON.parse(prior);sharedCache975();};
  const snapshot=()=>holdAssets(()=>{const m=moneySummary(),p=pl770Model();return JSON.stringify({revenue:m.charge.total,cost:m.cost.known,revNow:p.revNow,revJob:p.revJob,direct:p.direct,directJob:p.directJob});});
  const no=poAll().find(o=>o.amount==null&&!o.invoice_no)?.number;if(!no)throw Error('Need an unvalued source P/O for this isolated check');
  const before=snapshot(),beforeCount=poAll().length,beforeReceipt=JSON.stringify(fh866Receipt(poOf(no))),originalPo=JSON.stringify(S.purchaseOrders||{});
  try{
   const apply=amount=>{S.purchaseOrders={...S.purchaseOrders,[no]:{...(S.purchaseOrders?.[no]||{}),amount}};sharedCache975();};
   apply(1234.56);
   const expected=no+' · $1,234.56',f=dom(poCard(fenceByWeek(allDockets()))),finance=dom(fh866Html()),h=fh866Model();
   ck('fencing reference shows dollars and cents',f.querySelector('[data-po-amt="'+no+'"]').closest('tr').cells[0].textContent.includes(expected));
   ck('Finance reference shows same dollars and cents',finance.querySelector('[data-fh866-row="'+no+'"]').cells[0].textContent.includes(expected));
   ck('Finance cost stream references read shared amount',[...finance.querySelectorAll('.mono')].some(n=>n.tagName==='SPAN'&&n.textContent===expected));
   ck('shared trace heading reads the live order',dom(GC500FencingTraceView837.orderHtml({number:no,amount:1234.56,record_keys:[],area_ids:[]})).querySelector('h4').textContent.includes(expected));
   ck('existing numeric input preserved',Number(f.querySelector('[data-po-amt="'+no+'"]').value)===1234.56&&Number(finance.querySelector('[data-fh866-row="'+no+'"] [data-fh866="amount"]').value)===1234.56);
   ck('both native Save buttons remain',!!f.querySelector('[data-po-save="'+no+'"]')&&!!finance.querySelector('[data-fh866-save="'+no+'"]'));
   ck('copy for Finance carries cents',fh866Text(h).split('\n').some(l=>l.includes('PO '+no)&&l.includes('$1,234.56')));
   ck('Finance CSV carries numeric amount',fh866Csv(h).split('\r\n').some(l=>l.includes(no)&&l.includes('1234.56')));
   ck('PO identity remains single',poAll().length===beforeCount&&poAll().filter(o=>o.number===no).length===1);
   ck('receipting unchanged',JSON.stringify(fh866Receipt(poOf(no)))===beforeReceipt);
   ck('customer Revenue and Direct costs unchanged',snapshot()===before);
   apply(987.65);ck('editing once updates subsequent labels',poLabel1014(no)===no+' · $987.65'&&dom(fh866Html()).querySelector('[data-fh866-row="'+no+'"]').cells[0].textContent.includes('$987.65'));
   apply(0);ck('explicit zero shows currency',poLabel1014(no)===no+' · $0.00');
   apply(null);ck('unknown amount stays reference alone',poLabel1014(no)===no);
  }finally{reset();}
  ck('full record and purchase orders restored',JSON.stringify(S)===prior&&JSON.stringify(S.purchaseOrders||{})===originalPo);
  return{pass:checks.every(c=>c.pass),checks};
 });
 const out={author:'Andrew Fisher',...result,pageErrors:h.errors,attemptedNativeWrites:attemptedWrites+h.counts.blocked};
 if(process.env.OUT){fs.mkdirSync(path.dirname(process.env.OUT),{recursive:true});fs.writeFileSync(process.env.OUT,JSON.stringify(out,null,2)+'\n');}
 console.log(JSON.stringify(out));if(!out.pass||out.pageErrors.length||out.attemptedNativeWrites)process.exitCode=1;
}finally{if(h)await h.browser.close();}})().catch(e=>{console.error(e.stack);process.exitCode=1;});
