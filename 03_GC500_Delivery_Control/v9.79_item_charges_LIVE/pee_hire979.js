/* Author: Andrew Fisher. Customer hire forecast from the original 2026 Hire Rate, never the supplier quote. */
(function(root){'use strict';
const source={file:'Rate Card 2026 (1).xlsx',sheet:'Street Rate Card 2026',row:22,cells:'A22:D22',sha256:'60a62f37d9d91634ca617f3b2840809e64ebc1f000303857f1abb5e00691d7d6',description:'Pee Panel',uom:'EA',daily:9.5996,hire:672.1677000000001};
const norm=x=>String(x||'').trim().toLowerCase(),cents=x=>Math.round((x+Number.EPSILON)*100)/100;
function card(disc,item,existing){if(disc!=='Toilets & amenities'||norm(item)!=='pee panel'||existing?.rate!=null)return existing;return Object.assign({},existing,{kind:'flat',rate:source.hire,line:source.description,state:'matched',source:'card',basis:'2026 Street Rate Card D22 · Hire Rate 2026 · whole event',hire_rate:source.hire,minimum_hire:{days:null,from:null,basis:'Hire Rate 2026 is the stated whole-event figure'},source979:source});}
function forecast(items,contracts){
 const rows=(items||[]).filter(r=>r.ref==='WC09'&&norm(r.item)==='pee panel'&&r.quantity===6&&r.arrived===6);
 if(rows.length!==1)return {amount:0,quantity:0,state:'scope changed',source};
 const covered=(contracts||[]).filter(r=>!r.charge_line&&/\bpee\s*panel\b/i.test(r.description||r.register_type||''));
 if(covered.length)return {amount:0,quantity:0,state:'contract coverage needs allocation',source};
 return {id:'hire979|WC09|Pee Panel',ref:'WC09',item:'Pee Panel',branch:'KINP',quantity:6,rate:source.hire,amount:cents(6*source.hire),state:'forecast',ledger:'1010',supplierCostAdditional:0,source,basis:'Six installed Event Portables pee panels; existing approved quote covers supplier hire cost. Customer hire not present in Baseplan; Hire Rate 2026 D22 forecast once.'};
}
function modelExtra(input,F){const out=structuredClone(input);if(!(F.amount>0))return out;
 if(out.revenue){out.revenue.job=cents(out.revenue.job+F.amount);out.revenue.hireUncontracted979=F.amount;}
 return out;
}
const api={source,card,forecast,modelExtra};if(typeof module!=='undefined'&&module.exports)module.exports=api;if(root)root.PeeHire979=api;
})(typeof window!=='undefined'?window:null);
