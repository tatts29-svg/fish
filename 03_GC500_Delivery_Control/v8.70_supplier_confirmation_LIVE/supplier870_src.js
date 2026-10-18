/* Author: Andrew Fisher. Supplier confirmation is scope, never an arrival or a replacement contract quantity. */
function epConfirmation870(){
 const r=(S.supplied||{})['SUPPLIER-EVENT-PORTABLES-FWF'];
 return r && r.scope==='supplier-total' && Number.isInteger(r.total) && r.total>=0 ? r : null;
}
function epPlan870(){
 const E=EP819, c=epConfirmation870();if(!c)return E;
 const rows=E.quote.rows.map(r=>{if(!/^FWF\b/.test(r.item))return r;const unallocated=Math.max(0,c.total-Number(r.allocated_to_wc||0));return {...r,original_quote:r.quote,quote:c.total,no_wc_allocation:unallocated,note:'Supplier-confirmed total; location allocation shown separately.'};});
 return {...E,quote:{...E.quote,rows},confirmation:c};
}
function epSupply870(rows){
 const c=epConfirmation870();if(!c)return null;
 if(!rows)return epInventory860().summary.fwfSupply;
 const E=epPlan870(),r=E.quote.rows.find(r=>/^FWF\b/.test(r.item));
 const fwf=rows.filter(r=>r.qty===1 && r.description==='FWF' && r._on),at=fwf.filter(r=>!r._spare).length,spare=fwf.filter(r=>r._spare).length,on=at+spare;
 return {total:c.total,on,at,spare,left:Math.max(0,c.total-on),allocated:Number(r?.allocated_to_wc||0),unallocated:Number(r?.no_wc_allocation||0),inLoads:epTotals819().fwf,over:Math.max(0,on-c.total)};
}
function epSupplyHtml870(){
 const P=epSupply870();if(!P)return '';
 return `<div class="ep870-supply" data-ep870-supply><b>Event Portables · FWF</b><span><strong>${P.total}</strong> confirmed supply</span><span>${P.on} recorded on site · ${P.left} still to arrive</span><details><summary>Location allocation</summary><p>${P.allocated} allocated to WC locations · ${P.unallocated} without a WC allocation. ${P.inLoads} on the remaining load plan. ${P.spare} recorded spare${P.over ? ' · '+P.over+' above confirmed supply' : ''}.</p></details></div>`;
}
function epScopeHtml870(){
 const c=epConfirmation870();return c ? `<details class="tw842-counts-note" data-ep870-scope><summary>Event Portables · ${c.total} FWF confirmed supply</summary><p>Supplier quantity. Completion and the overall job requirement remain separate.</p><a href="#timeline">Open supplier delivery plan</a></details>` : '';
}
