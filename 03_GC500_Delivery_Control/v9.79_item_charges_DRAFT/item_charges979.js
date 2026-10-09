/* Author: Andrew Fisher. Item charge evidence; reads existing prices without posting or repricing. */
(function(root){'use strict';
const norm=x=>String(x||'').trim().toLowerCase().replace(/\s+/g,' '),cents=v=>Math.round(v*100)/100;
function project(ref,item,contracts,readCharge,workCard,costEvidence){
 const seen=new Set(),lines=[];
 for(const r of contracts||[]){if(r.charge_line||r.match?.key!==ref||norm(r.register_type)!==norm(item))continue;const id=r.rental_contract+'|'+r.line;if(seen.has(id))continue;seen.add(id);const price=readCharge(r);lines.push({id,contract:r.rental_contract,line:r.line,description:r.description,quantity:r.quantity,assetNo:r.asset_no_is_plant_number?r.asset_no:null,amount:typeof price?.amount==='number'?price.amount:null,basis:price?.basis||'',included:price?.treatment==='included',ownUse:price?.treatment==='own_use'});}
 const known=lines.filter(r=>r.amount!=null),amount=known.length?cents(known.reduce((s,r)=>s+r.amount,0)):null;
 const included=[...new Set((workCard?.lines||[]).filter(r=>r.money==='included'||/included/i.test(String(r.as_written||'')+' '+String(r.money_note||''))).map(r=>r.heading||'Labour'))].map(name=>({name,state:'Included'}));
 if(!included.length&&/included/i.test(String(workCard?.state||'')+' '+String(workCard?.note||'')))included.push({name:'Installation and handling',state:'Included'});
 const costs=(costEvidence||[]).filter(c=>lines.some(l=>String(c.contract)===String(l.contract)&&Number(c.line)===Number(l.line))).map(c=>({supplier:c.supplier,amount:c.estimate,source:c.source?.sheet||'',basis:c.basis||''}));
 return {lines,amount,incomplete:lines.some(r=>r.amount==null),included,costs};
}
const api={project};if(typeof module!=='undefined'&&module.exports)module.exports=api;if(root)root.ItemCharges979=api;
})(typeof window!=='undefined'?window:null);
function itemChargesHtml979(a,item){
 const card=cardRate(a.discipline,item,a.key),r=ItemCharges979.project(a.key,item,ItemIdentity979.select(a.key,item,ONHIRE_ROWS,gcModel925(a).rows),contractCharge,card.labour_per_piece,typeof Source949!=='undefined'?Source949.model():[]),row=(name,rate,qty,total)=>'<tr data-item979><td>'+esc(name)+'</td><td>'+esc(rate)+'</td><td>'+esc(qty)+'</td><td>'+esc(total)+'</td></tr>';
 const price=v=>v==null?'Rate / allocation pending':money(v);let html='';
 for(const l of r.lines)html+=row('Hire'+(l.assetNo?' · '+l.assetNo:''), l.ownUse?'Coates own use':l.included?'Included':l.amount!=null&&l.quantity>0?chargeRateDisplay977(l.amount/l.quantity):'Contract',String(l.quantity==null?'Pending':l.quantity),l.ownUse?'No client charge':l.included?'Included':price(l.amount));
 const extra=peeHireForecast979();if(!r.lines.length&&extra.amount>0&&a.key===extra.ref&&item===extra.item)html+=row('Hire',chargeRateDisplay977(extra.rate),String(extra.quantity),money(extra.amount));
 if(!r.lines.length&&!(extra.amount>0&&a.key===extra.ref&&item===extra.item))html+='<tr data-item979-unlinked><td colspan="4"><details><summary>Hire · more info</summary><p>Existing hire allocation is not linked to this item. No additional charge has been added.</p></details></td></tr>';
 for(const w of r.included)html+=row(w.name,'Included','—','Included');
 if(r.costs.length)html+='<tr data-item979-cost><td colspan="4"><details class="units925-edit"><summary>Coates supplier costs</summary>'+r.costs.map(c=>'<p>'+esc(c.supplier)+' · '+esc(price(c.amount))+' estimated · '+esc(c.source)+'</p>').join('')+'</details></td></tr>';
 const sources=r.lines.map(l=>'Contract '+l.contract+' line '+l.line+' · '+l.description+' · Existing hire for the contract period; unit value is line total divided by quantity. '+l.basis);if(sources.length)html+='<tr data-item979-source><td colspan="4"><details class="units925-edit"><summary>Hire · more info</summary>'+sources.map(s=>'<p>'+esc(s)+'</p>').join('')+'</details></td></tr>';
 return html;
}
