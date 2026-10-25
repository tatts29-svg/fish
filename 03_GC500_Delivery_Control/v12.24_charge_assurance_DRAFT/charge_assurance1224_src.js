/* Author: Andrew Fisher. Charge assurance reads existing shared models; it never prices or changes a record. */
(function(root){
'use strict';
const C=typeof module!=='undefined'&&module.exports?require('./charge_checks1224_src.js'):root.ChargeChecks1224;
function project(m){
 m=m&&typeof m==='object'?m:{};
 const array=v=>Array.isArray(v)?v:[];
 const p=m.pnl||{},money=m.money||{},c=money.charge||{},x=m.closeout?.revenue||{},b=m.branchFinancial||{};
 const checks=[],add=(label,expected,parts)=>checks.push(C.reconcile(label,expected,parts));
 add('Recorded charge components',c.total,[c.contracts,c.labour,c.fencing,c.other,c.servicing,c.transportArrived1006,c.uncontractedHire1007,c.uncontractedHire1013,c.race?.amount]);
 add('Recorded charges and ledger',c.total,[p.revNow]);
 add('Recorded Revenue ledger',p.revNow,Array.isArray(p.rev)?p.rev.map(r=>r.now):[null]);
 add('Job-end Revenue ledger',p.revJob,Array.isArray(p.rev)?p.rev.map(r=>r.job):[null]);
 add('Recorded Revenue by branch',p.revNow,Array.isArray(b.rows)?b.rows.map(r=>r.revenue):[null]);
 add('Job-end Revenue by branch',p.revJob,Array.isArray(b.rows)?b.rows.map(r=>r.revenueJob):[null]);
 add('Job-end forecast agrees',p.revJob,[x.job]);
 add('Forecast starts at recorded charges',c.total,[x.record]);
 add('Difference retains cents',money.difference,[p.diff?.now]);
 const remaining=[x.fenceToCome,x.transportToCome,x.labourToCome,x.cleaningToCome,x.hireToCome979,x.sourceHire996?.amount,x.generators1004?.remaining,x.allocationForecast1010?.total,x.additionalHire1013?.remainingAmount];
 add('Recorded-to-job-end bridge',x.job,[x.record,...remaining]);
 const actual=C.cents(c.total),job=C.cents(p.revJob),fence=C.cents(x.fenceToCome);
 const difference=(a,b)=>a!==null&&b!==null&&Number.isSafeInteger(a-b)?a-b:null;
 const priced=difference(job,fence),remainingOther=difference(priced,actual);
 const issues=new Map(), key=r=>[r.ref||'Job',r.item||'',r.charge||'Scope'].join('|');
 const include=r=>{const k=key(r),old=issues.get(k);issues.set(k,{...old,...r,reason:r.reason||old?.reason||'Confirm the applicable scope, quantity, rate or existing coverage before finalising.'});};
 for(const h of array(m.onsiteComplete?.holds))include(h);
 for(const h of array(m.pricingHolds))include(h);
 for(const h of array(m.workPricing))if(h.state==='unpriced')include({ref:h.ref,item:h.item,charge:h.name,reason:h.why});
 for(const t of array(m.closeout?.buildingTransport?.rows))if(t.state==='held')include({ref:t.ref,item:t.item,charge:t.leg==='pickup'?'Pickup':'Delivery',reason:(t.reasons||[]).join(' · ')});
 for(const g of array(x.generators1004?.rows))if(!g.treatment&&(g.issues?.length||g.forecast==null))include({ref:g.ref||g.refLabel||'Generator',item:g.item,charge:'Hire location / period',reason:(g.issues||['Hire price or period needs review']).join(' · ')});
 for(const s of array(x.sourceHire996?.issues))include({ref:s.ref||s.request,item:'Source hire',charge:'Source coverage',reason:s.state});
 for(const l of array(p.rev))if(l.code==='—'&&(l.now||l.job))include({ref:'Job',item:l.line,charge:'Ledger allocation',reason:'The amount is already included in Revenue. Confirm its ledger allocation; do not add it again.'});
 const sourceAvailable=Array.isArray(m.onsiteComplete?.holds)&&Array.isArray(m.pricingHolds)&&Array.isArray(m.workPricing)&&Array.isArray(m.closeout?.buildingTransport?.rows)&&Array.isArray(x.generators1004?.rows)&&Array.isArray(x.sourceHire996?.issues);
 const state=checks.some(r=>r.status==='fail')?'fail':checks.some(r=>r.status==='unavailable')?'unavailable':'pass';
 const scope=m.eventScope;
 const roleCheck=scope&&Array.isArray(scope.lines)?C.reconcile('Event role display rounding',scope.people,scope.lines.map(r=>r.amount)):null;
 return {actual,job,fence,priced,remainingOther,checks,state,sourceAvailable,issues:[...issues.values()],roleRounding:roleCheck?.status==='fail'?-roleCheck.variance:0,branches:array(b.rows)};
}
const api={project};if(typeof module!=='undefined'&&module.exports)module.exports=api;if(!root)return;
function model(){return holdAssets(()=>project({money:moneySummary(),pnl:pl770Model(),closeout:cj764Model(),branchFinancial:branchFinancial978(pl752Rows(),moneySummary()),onsiteComplete:onsiteComplete979(),pricingHolds:pricingReviewHolds1010(),workPricing:workPricing1007(),eventScope:scopeFigures()}));}
const format=n=>n===null?'Unavailable':new Intl.NumberFormat('en-AU',{style:'currency',currency:'AUD',minimumFractionDigits:2,maximumFractionDigits:2}).format(n/100);
const opened=new Set();
function detail(id,label,body){return '<details data-charge1224-detail="'+id+'"'+(opened.has(id)?' open':'')+'><summary>'+esc(label)+'</summary>'+body+'</details>';}
function card(){
 let m;try{m=model();}catch(e){return '<section class="card charge1224" id="charge1224"><h3>Charge checks</h3><p role="status">Checks unavailable. Reload the current record before reviewing charges.</p></section>';}
 const badge=m.state==='pass'?'Figures reconcile':m.state==='fail'?'Calculation mismatch':'Checks unavailable';
 const table='<div class="charge1224-table"><table><thead><tr><th>Check</th><th>Result</th><th>Variance</th></tr></thead><tbody>'+m.checks.map(r=>'<tr><th scope="row">'+esc(r.label)+'</th><td>'+esc(r.status==='pass'?'Matches':r.status==='fail'?'Review':'Unavailable')+'</td><td>'+esc(format(r.variance))+'</td></tr>').join('')+'</tbody></table></div>';
 const bridge='<dl class="charge1224-bridge"><dt>Recorded charges</dt><dd>'+esc(format(m.actual))+'</dd><dt>Other remaining forecast</dt><dd>'+esc(format(m.remainingOther))+'</dd><dt>Priced job end, excluding fencing demob</dt><dd>'+esc(format(m.priced))+'</dd><dt>Fencing demob estimate, excluded above</dt><dd>'+esc(format(m.fence))+'</dd><dt>Full job-end forecast</dt><dd>'+esc(format(m.job))+'</dd></dl><p>Remaining forecast is not proof of delivery or completed work. All amounts are ex GST. No damage waiver is added.</p>';
 const issues=m.issues.map(r=>'<li><div>'+(assetOf(r.ref)?'<button type="button" class="btn ghost" data-charge1224-ref="'+esc(r.ref)+'">'+esc(r.ref)+'</button>':'<b>'+esc(r.ref)+'</b>')+' <strong>'+esc(r.item)+'</strong></div><b>'+esc(r.charge)+'</b><p>'+esc(r.reason)+'</p></li>').join('');
 const branches='<div class="charge1224-table"><table><thead><tr><th>Revenue branch</th><th>Recorded</th><th>Full job end</th></tr></thead><tbody>'+m.branches.map(r=>'<tr><th scope="row">'+esc(r.code)+'</th><td>'+esc(format(C.cents(r.revenue)))+'</td><td>'+esc(format(C.cents(r.revenueJob)))+'</td></tr>').join('')+'</tbody></table></div><p>Full job-end branch figures include the fencing demob estimate. Existing branch attribution is retained.</p>';
 return '<section class="card charge1224" id="charge1224" aria-labelledby="charge1224-title"><header><div><span class="charge1224-eyebrow">Charged to the V8s · ex GST</span><h3 id="charge1224-title">Charge checks</h3></div><span class="charge1224-status" data-result="'+m.state+'">'+badge+'</span></header><div class="charge1224-figures"><div><span>Recorded charges</span><strong>'+esc(format(m.actual))+'</strong></div><div><span>Priced job end · excluding fencing demob</span><strong>'+esc(format(m.priced))+'</strong></div></div><p class="charge1224-review">'+(m.sourceAvailable?m.issues.length+' scope / coverage checks to review':'Source checks unavailable')+' · source review required before finalising.</p><p class="charge1224-note">Calculation checks do not certify the bill. Confirm site quantities, charging periods, agreed rates and existing contract coverage. Supplier invoices still outstanding are a separate Direct-cost review.</p>'+detail('bridge','Show the charge bridge',bridge)+detail('checks','Show the cent checks',table+(m.roleRounding?'<p>Event role displays have a '+esc(format(m.roleRounding))+' rounding reconciliation to the source total. The source adds unrounded role amounts before rounding; its total is retained.</p>':''))+detail('issues','Review scope and coverage', '<p>These are review items, not extra charges. Check existing coverage before adding any amount. Open a reference for its current evidence.</p><ul class="charge1224-issues">'+issues+'</ul>')+detail('branches','Show Revenue by branch',branches)+'<div class="charge1224-actions"><button class="btn" data-finance857="pricing">Customer rates &amp; charges</button><button class="btn" data-finance857="handover">Finance handover</button></div></section>';
}
const previous=pl752Card;pl752Card=function(){return card()+previous.apply(this,arguments);};
document.addEventListener('toggle',e=>{const id=e.target?.getAttribute?.('data-charge1224-detail');if(id)e.target.open?opened.add(id):opened.delete(id);},true);
document.addEventListener('click',e=>{const b=e.target?.closest?.('[data-charge1224-ref]');if(b){e.preventDefault();openAsset(b.dataset.charge1224Ref);}});
root.ChargeAssurance1224=Object.freeze({...api,model,card});
})(typeof window!=='undefined'?window:null);
