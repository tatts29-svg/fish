/* Author: Andrew Fisher. Actual public page, native source and rendered P/O proof. */
'use strict';
const fs=require('fs'),path=require('path'),{open}=require('./readonly_page.cjs');
const price=JSON.parse(fs.readFileSync(process.env.GC500_PRICING_SPEC,'utf8')),docket=JSON.parse(fs.readFileSync(process.env.GC500_DOCKET_SPEC,'utf8'));
(async()=>{let h;try{
 h=await open({hash:'#fencing',W:390,H:844,mobile:true});
 await h.page.waitForFunction(()=>SYNC.status==='live'&&SYNC.first.size===Object.keys(SYNC_COLLS).length,null,{timeout:180000});
 // Shared records can settle before the document registry used by source-verified forecast credits.
 await h.page.waitForFunction(()=>photoIndex().state==='ready',null,{timeout:60000});
 const result=await h.page.evaluate(({price,docket})=>holdAssets(()=>{
  const checks={},cent=n=>Math.round(Number(n)*100),po=poOf(price.number),pricing=supplierPricing1014(),p=pricing.orders.find(o=>o.number===price.number),d=allDockets().find(x=>x.id===docket.record_id),split=fencePaidSplit();
  checks['existing P/O value equals authorised amount']=cent(po.amount)===cent(price.expected_po.amount);
  checks['saved supplier source matches the authorised specification']=fencePaperCanonical898(po.supplier_pricing)===fencePaperCanonical898(price.supplier_pricing);
  checks['supplier source is valid and difference is zero']=!!p&&p.valid&&p.difference===0&&cent(p.total)===cent(po.amount);
  checks['source dockets and daily costs counted once']=p.records.length===price.expected.records&&new Set(p.records.map(r=>r.key)).size===p.records.length&&p.extras.length===price.expected.extras;
  checks['source book totals reconcile']=cent(p.red)===cent(price.expected.red_total)&&cent(p.green)===cent(price.expected.green_total)&&cent(p.extrasTotal)===cent(price.expected.extra_total);
  checks['correct supplier and cost branch']=po.supplier_code===price.expected_po.supplier_code&&po.branch===price.expected_po.branch&&p.branch===po.branch;
  checks['approval did not invent invoice receipt or payment']=!po.invoice_no&&!po.receipted&&po.receipted_amount==null;
  checks['supplier categories close to the cent']=split.clean&&cent(split.gear+split.installation)===cent(fenceDerived().cost+greenBookTotals().amount);
  checks['corrected physical quantities are saved']=d.quantities.clean===docket.changes.quantities.clean&&d.components.mesh_panel===docket.changes.components.mesh_panel;
  checks['bases and clamps preserved']=d.components.base===docket.before.components.base&&d.components.clamp===docket.before.components.clamp;
  checks['customer line rounded at current card']=cent(d.cost_total)===cent(docket.revenue_after)&&fenceRateFor('clean').value===docket.customer_rate;
  checks['supplier price unchanged by physical correction']=cent(d.paid_total)===cent(docket.supplier_amount);
  const reviews=fenceProgrammeReviews958(allDockets()),review=reviews.find(x=>x.row.record_id===docket.record_id);
  checks['existing programme link retained']=review?.state==='matched'&&review.row.attribution.target_id==='cw1-51'&&review.row.attribution.credit.clean===135;
  checks['all linked source locations available']=p.records.every(r=>r.current_location);
  return {checks,version:SYNC.backend.readVersion821(),coverage:{sourceRecords:p.records.length,recordedLocations:p.records.filter(r=>r.current_location).length,reviewedScheduleLinks:p.records.filter(r=>reviews.some(x=>x.row.record_id===r.id&&x.state==='matched')).length,nativeMapReferences:p.records.filter(r=>r.current_reference).length}};
 }),{price,docket});
 const input=h.page.locator('[data-po-amt="'+price.number+'"]');
 await input.evaluate(el=>{for(let n=el;n;n=n.parentElement)if(n.tagName==='DETAILS')n.open=true;});
 const display=await input.evaluate((el,price)=>{const row=el.closest('tr');return{label:row.cells[0].textContent,blocks:row.querySelectorAll('.po-supplier1014').length,save:!!row.querySelector('[data-po-save]'),nativeAmount:Number(el.value)};},price);
 result.checks['actual rendered P/O shows amount and matching result']=display.label.includes(price.number)&&display.label.includes('$'+price.expected_po.amount.toLocaleString('en-AU',{minimumFractionDigits:2,maximumFractionDigits:2}))&&display.label.includes('Supplier dockets match P/O')&&display.blocks===1;
 result.checks['native amount editor and Save remain']=display.save&&display.nativeAmount===price.expected_po.amount;
 await input.locator('xpath=ancestor::tr/td[1]').scrollIntoViewIfNeeded();
 await h.page.evaluate(()=>{for(const el of document.querySelectorAll('.tblwrap'))el.scrollLeft=0;window.scrollTo(0,window.scrollY);});
 if(process.env.SHOT)await h.page.screenshot({path:process.env.SHOT});
 result.checks['actual public page with no replacement']=h.counts.page===0;
 result.checks['no browser errors or operational write attempts']=h.errors.length===0&&h.counts.blocked===0;
 result.pass=Object.values(result.checks).every(Boolean);result.requests=h.counts;
 fs.writeFileSync(process.env.OUT,JSON.stringify(result,null,2)+'\n');
 console.log(JSON.stringify({pass:result.pass,checks:Object.keys(result.checks).length,failed:Object.entries(result.checks).filter(([,v])=>!v).map(([k])=>k),version:result.version,coverage:result.coverage}));if(!result.pass)process.exitCode=1;
}finally{if(h)await h.browser.close();}})().catch(e=>{console.error(e.message);process.exitCode=1;});
