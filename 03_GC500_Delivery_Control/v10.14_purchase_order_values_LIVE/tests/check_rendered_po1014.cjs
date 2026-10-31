/* Author: Andrew Fisher. Check the rendered P/O survives operational-page cleanup. */
'use strict';
const fs=require('fs'),path=require('path');
const {open}=require('../../record_14Oct2026_purchase_order/readonly_page.cjs');
const spec=JSON.parse(fs.readFileSync(process.env.PRICING_SPEC,'utf8'));
(async()=>{let h;try{
 h=await open({pageFile:process.env.PAGE,hash:'#today',W:390,H:844,mobile:true});
 await h.page.waitForFunction(()=>SYNC.status==='live'&&SYNC.first.size===Object.keys(SYNC_COLLS).length,null,{timeout:180000});
 await h.page.clock.install();
 await h.page.evaluate(s=>{S.purchaseOrders[s.number]={...S.purchaseOrders[s.number],...s.expected_po,supplier_pricing:s.supplier_pricing};sharedCache975();go('fencing');render();},spec);
 const input=h.page.locator('[data-po-amt="'+spec.number+'"]');
 await input.evaluate(el=>{for(let n=el;n;n=n.parentElement)if(n.tagName==='DETAILS')n.open=true;});
 const result=await input.evaluate((el,s)=>{
  const row=el.closest('tr'),label=s.number+' · '+money(s.expected_po.amount),block=row.querySelector('.po-supplier1014'),more=block?.querySelector('details');
  return {checks:{'P/O number and exact dollars survive rendered cleanup':row.cells[0].textContent.includes(label),'native amount and Save remain':Number(el.value)===s.expected_po.amount&&!!row.querySelector('[data-po-save]'),'matching supplier result visible':!!block&&block.textContent.includes('Supplier dockets match P/O'),'supporting detail stays collapsible':!!more&&!more.open,'all source records and dated extras survive cleanup':more?.querySelectorAll('tbody>tr').length===s.supplier_pricing.records.length+s.supplier_pricing.extras.length,'source total displayed':!!block&&block.textContent.includes(money(s.supplier_pricing.total))}};
 },spec);
 await input.locator('xpath=ancestor::tr/td[1]').scrollIntoViewIfNeeded();
 await h.page.evaluate(()=>{for(const el of document.querySelectorAll('.tblwrap'))el.scrollLeft=0;window.scrollTo(0,window.scrollY);});
 if(process.env.SHOT)await h.page.screenshot({path:process.env.SHOT});
 result.checks['no browser errors or operational writes']=h.errors.length===0&&h.counts.blocked===0;
 result.pass=Object.values(result.checks).every(Boolean);result.requests=h.counts;
 if(process.env.OUT)fs.writeFileSync(process.env.OUT,JSON.stringify(result,null,2)+'\n');
 console.log(JSON.stringify({pass:result.pass,checks:Object.keys(result.checks).length,failed:Object.entries(result.checks).filter(([,v])=>!v).map(([k])=>k)}));
 if(!result.pass)process.exitCode=1;
}finally{if(h)await h.browser.close();}})().catch(e=>{console.error(e.message);process.exitCode=1;});
