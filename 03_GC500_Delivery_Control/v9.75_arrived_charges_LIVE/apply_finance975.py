# Author: Andrew Fisher. Exact shared financial hooks; root owns release assembly.
def apply_finance975(s,rep):
 s=rep(s,'function labourMoney914base(ref, l, key, asset){','function labourMoney914base975original(ref, l, key, asset){')
 s=rep(s,'function assetTotal(a){','function labourMoney914base(ref,l,key,asset){ const a=asset||allAssets().find(x=>x.key===ref); return typeof ArrivalCharges975!==\'undefined\'?applyStairsMoney975(a,l,labourMoney914base975original(ref,l,key,a)):labourMoney914base975original(ref,l,key,a); }\nfunction assetTotal(a){')
 s=rep(s,'const by = new Map(), put = (x, n) => { const k = by.get(x.key)','const by = new Map(), put = (x, n) => { n=x.chargeQty975 ?? n; const k = by.get(x.key)')
 s=rep(s,'sums[item.key]+=Math.round(qty*item.rate*100)/100;','sums[item.key]+=Math.round((item.key===\'steps\'&&typeof ArrivalCharges975!==\'undefined\'?stairsChargeQty975(a,line,null,qty):qty)*item.rate*100)/100;')
 s=rep(s,'const n = u === LAB_REST ? restN : 1;\n const value = typeof L.rate',"const baseN = u === LAB_REST ? restN : u ? 1 : q;\n const n=L.key==='steps'&&typeof ArrivalCharges975!=='undefined'&&baseN!=null?stairsChargeQty975(a,l,u,baseN):baseN;\n const value = typeof L.rate")
 s=rep(s,'const value = typeof L.rate !== \'number\' ? null : u ? L.rate * n : (q == null ? null : L.rate * q);','const value = typeof L.rate !== \'number\' || n==null ? null : L.rate*n;')
 s=rep(s,'unit: u, rate: L.rate, qty: u ? n : q, value, state','unit: u, rate: L.rate, qty: n, value, state')
 old="if (cleaning) rev.push({key: 'cleaning', code: '1025', line: 'Cleaning', what: 'cleaning ticked per piece — classed as cleaning, not labour', now: cleaning, job: cleaning, basis: `${fmtNum(n(TK.cleaning.ticks))} tick${n(TK.cleaning.ticks) === 1 ? '' : 's'} on references`});"
 new="const clean975=typeof ArrivalCharges975!=='undefined'?cleaningRevenue975():{job:cleaning,remaining:0}; if (clean975.job||cleaning) rev.push({key:'cleaning',code:'1025',line:'Cleaning',what:'Cleaning charged per piece',now:cleaning,job:clean975.job,basis:`${fmtNum(n(TK.cleaning.ticks))} completed ticks · ${money0(clean975.remaining)} forecast remaining from the card`});"
 s=rep(s,old,new)
 s=rep(s,'labourToCome: labourRevenue858().remaining, job: r2((Number(c.total) || 0) + F.revenue + buildingTransport.uncoveredAdditional + labourRevenue858().remaining)',"labourToCome: labourRevenue858().remaining,cleaningToCome: typeof ArrivalCharges975!=='undefined'?cleaningRevenue975().remaining:0, job: r2((Number(c.total) || 0) + F.revenue + buildingTransport.uncoveredAdditional + labourRevenue858().remaining + (typeof ArrivalCharges975!=='undefined'?cleaningRevenue975().remaining:0))")
 s=rep(s,'function charges952Html(a){','function charges952Html975previous(a){')
 s=rep(s,'function mount925(a){','function charges952Html(a){return typeof ArrivalCharges975!=="undefined"?arrivedChargesHtml975(a):charges952Html975previous(a); }\nfunction mount925(a){')
 return s
