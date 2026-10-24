/* Author: Andrew Fisher. Item transport display from the existing forecast; no additional pricing or records. */
(function(root){
'use strict';
const list=x=>Array.isArray(x)?x:[],norm=x=>String(x||'').trim().toLowerCase().replace(/\s+/g,' ');
function rows(all,ref,item){return list(all).filter(r=>r.ref===ref&&norm(r.item)===norm(item)).map(r=>({id:r.id,leg:r.leg,rate:r.rate,quantity:r.quantity,state:r.state,additional:r.additional,coveredQuantity:r.coveredQuantity,uncoveredQuantity:r.uncoveredQuantity,coverage:list(r.coverage).map(c=>({...c})),reasons:list(r.reasons).slice(),rateSource:r.rateSource||''}));}
function stateText(r,price){if(r.state==='held')return 'Rate / allocation pending';if(r.state==='included')return 'Included';if(r.state==='excluded')return 'Not applicable';if(r.state==='covered')return 'On contract';return price(r.additional)+(r.coveredQuantity?' + on contract':'')+' additional';}
function html(selected,esc,price){
 if(!selected.length)return '<tr data-transport-item977-empty><td colspan="4" style="overflow-wrap:anywhere">Transport: no item-linked row</td></tr>';
 return selected.map(r=>{const sources=[r.rateSource,...r.reasons,...r.coverage.map(c=>'Contract '+c.id+' · '+c.quantity+' units'+(c.sharedCharge?' · shared contract':'')+(c.basis?' · '+c.basis:''))].filter(Boolean),state=stateText(r,price),rate=r.state==='included'?'Included':r.state==='excluded'?'—':price(r.rate);
 return '<tr data-transport-item977="'+esc(r.id)+'"><td style="overflow-wrap:anywhere">'+(r.leg==='delivery'?'Delivery':'Pickup')+'<small style="display:block;font-size:10px">Transport · ordered scope</small></td><td style="overflow-wrap:anywhere">'+esc(rate)+'</td><td>'+esc(r.quantity==null?'Pending':String(r.quantity))+'</td><td style="overflow-wrap:anywhere">'+esc(state)+'</td></tr>'+(sources.length?'<tr data-transport-item977-source><td colspan="4"><details class="units925-edit"><summary>Transport '+(r.leg==='delivery'?'delivery':'pickup')+' · more info</summary><div style="overflow-wrap:anywhere">'+sources.map(s=>'<p>'+esc(s)+'</p>').join('')+'</div></details></td></tr>':'');}).join('');
}
const api={rows,stateText,html};if(typeof module!=='undefined'&&module.exports)module.exports=api;if(root)root.TransportItem977=api;
})(typeof window!=='undefined'?window:null);
function transportRowsHtml977(a,item){return holdAssets(()=>{const T=cj764Model().buildingTransport;return TransportItem977.html(TransportItem977.rows(T&&T.rows,a.key,item),esc,v=>v==null?'Rate pending':money(v));});}

function chargeRateDisplay977(v){return v==null?"Rate pending":new Intl.NumberFormat("en-AU",{style:"currency",currency:"AUD",minimumFractionDigits:2,maximumFractionDigits:5}).format(v);}
