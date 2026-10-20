/* Author: Andrew Fisher. Planned carrier allowances; no booking, invoice or record is created. */
function transport953Leg(r){return r.leg==='event'&&r.movement==='place'?'inbound':r.leg;}
function transport953Quantity(r){const v=r.e&&r.e.quantity_raw!=null?r.e.quantity_raw:r.qty;return /^\d+$/.test(String(v).trim())&&Number(v)>0?Number(v):null;}
function transport953Reconcile(T,env){
 const cents=n=>Math.round(n*100)/100, all=T.rows.concat(T.planned), active=r=>!r.cancelled&&!r.off&&!r.rest_of&&!env.off(r.task)&&!env.off(r.key), paid=r=>r.counted||r.byOurLine||(r.t&&(r.t.amount!=null||r.t.internal)), cash=r=>r.forecast&&['card','average'].includes(r.forecast.kind);
 const signature=r=>[r.key||'',r.task||r.id,transport953Leg(r)].join('|'), scope=r=>[r.item,transport953Quantity(r),r.date].join('|'), sameTask=(x,r)=>x.task&&x.task===r.task&&transport953Leg(x)===transport953Leg(r)&&(x.key===r.key||x.standin||r.standin||x.src==='unref');
 const initial=T.forecast.total, excluded=[], additions=[], canonical=[], seen=new Map();
 for(const r of T.rows)canonical.push(r);
 for(const r of T.planned){
  r.forecast={kind:'planned',raw:0,amount:0};delete r.demobCard;
  const prior=T.rows.find(x=>active(x)&&sameTask(x,r));
  if(prior){if(scope(prior)!==scope(r)){r.conflict953=true;r.forecast={kind:'held',raw:0,amount:0,reason928:'Source task also appears with a different item, quantity or date. Confirm its allocation; no second allowance.'};if(active(r))canonical.push(r);}else r.forecast={kind:'represented953',raw:0,amount:0,reason953:'Same source task and movement already appears in the transport rows; no second allowance.'};continue;}
  const key=signature(r), before=seen.get(key);
  if(before){if(scope(before)!==scope(r)){before.forecast={kind:'held',raw:0,amount:0,reason928:'Conflicting duplicate source task; confirm the movement and quantity.'};before.conflict953=true;r.conflict953=true;r.forecast={kind:'held',raw:0,amount:0,reason928:before.forecast.reason928};}else r.forecast={kind:'represented953',raw:0,amount:0,reason953:'Duplicate source task and movement; shown once in the forecast.'};continue;}
  seen.set(key,r);if(active(r))canonical.push(r);
 }
 for(const r of canonical){
  const planned=r.src==='planned', f=r.forecast||{}, leg=transport953Leg(r);
  if(!active(r)||paid(r)||T.ourRefs.has(r.key)||r.conflict953)continue;
  const ctx=canonical.filter(x=>active(x)&&(r.key?x.key===r.key:x.task===r.task)&&transport953Leg(x)===leg&&x.item===r.item), quote=env.coverage(r,ctx);
  if(quote&&quote.state==='covered'){
   if(cash(r))excluded.push({id:r.id,key:r.key,task:r.task,leg,kind:f.kind,raw:f.raw||0});
   r.forecast={kind:'quote953',raw:0,amount:0,reason953:quote.reason};continue;
  }
  if(!planned){if(quote&&quote.state==='review')r.forecast.review953=quote.reason;continue;}
  if(r.conflict953)continue;
  let reason=quote&&quote.state==='review'?quote.reason:null;
  if(!['inbound','demob'].includes(leg)||r.movement==='relocate'||r.e&&r.e.relocation)reason='Movement is not a uniquely scoped delivery or pickup; confirm its carrier cost.';
  if(transport953Quantity(r)==null)reason='A positive whole equipment quantity is needed; no quantity is inferred.';
  if(reason){r.forecast={kind:'held',raw:0,amount:0,reason928:reason};continue;}
  const demand=env.demand(r,canonical.filter(x=>x.key===r.key));
  if(!demand.known){r.forecast={kind:'held',raw:0,amount:0,reason928:demand.reason};continue;}
  r.forecast={kind:'card',raw:demand.amount,amount:cents(demand.amount),ref:cents(demand.amount),loads:1,scope928:'load',planned953:true,reason928:'Planned '+(leg==='demob'?'demob':'delivery')+' allowance — '+demand.reason+'; carrier not booked or invoiced.'};additions.push(r);
 }
 const counted=canonical.filter(cash), cards=counted.filter(r=>r.forecast.kind==='card'), averages=counted.filter(r=>r.forecast.kind==='average');
 // Preserve the legacy average amount; restore card precision before allocating the combined residual cent once.
 cards.forEach(r=>{r.forecast.amount=cents(r.forecast.raw||0);delete r.forecast.rounding;});
 const cardCost=cards.reduce((s,r)=>s+(r.forecast.raw||0),0), avgPart=cents(averages.reduce((s,r)=>s+(r.forecast.amount||0),0)), total=cents(cardCost+avgPart), residual=cents(total-counted.reduce((s,r)=>s+(r.forecast.amount||0),0));
 if(residual&&cards.length){const top=cards.slice().sort((a,b)=>b.forecast.amount-a.forecast.amount)[0];top.forecast.amount=cents(top.forecast.amount+residual);top.forecast.rounding=residual;}
 const bump=(o,k,v)=>{o[k]=cents((o[k]||0)+v);};
 T.weights.toCome={};T.weights.toComeNone=0;
 counted.forEach(r=>{if(r.branch)bump(T.weights.toCome,r.branch,r.forecast.amount);else T.weights.toComeNone=cents(T.weights.toComeNone+r.forecast.amount);});
 Object.assign(T.forecast,{cardCost,cardRefs:new Set(cards.map(r=>r.key||r.task)).size,avgPart,total,loadsNoFigNoCard:averages.length,heldLoads928:canonical.filter(r=>r.forecast.kind==='held').length,cardLoads953:cards.filter(r=>!r.forecast.planned953).length,plannedAllowances953:additions.length,plannedInbound953:additions.filter(r=>transport953Leg(r)==='inbound').length,plannedDemob953:additions.filter(r=>transport953Leg(r)==='demob').length,heldPlanned953:canonical.filter(r=>r.src==='planned'&&r.forecast.kind==='held').length,quoteCovered953:canonical.filter(r=>r.forecast.kind==='quote953').length});
 const demob={by:{},byKnown:{},total:0,noBasis:0,legs:0,covered953:0,notInPl:{legs:0,refs:0,by:{},total:0}}, missing=new Set();
 canonical.filter(r=>active(r)&&transport953Leg(r)==='demob').forEach(r=>{demob.legs++;const amount=(r.counted?r.actual:0)+(cash(r)?r.forecast.amount:0);if(amount){bump(demob.by,r.branch||'—',amount);if(r.branch)bump(demob.byKnown,r.branch,amount);}if(r.forecast.kind==='quote953'){demob.covered953++;return;}if(paid(r)||T.ourRefs.has(r.key)||cash(r))return;demob.noBasis++;demob.notInPl.legs++;if(r.key)missing.add(r.key);});
 demob.notInPl.refs=missing.size;demob.total=cents(Object.values(demob.by).reduce((s,n)=>s+n,0));T.demob=demob;
 T.audit953={before:initial,delta:cents(total-initial),added:additions.map(r=>({id:r.id,key:r.key,task:r.task,leg:transport953Leg(r),raw:r.forecast.raw})),excluded,actualUnchanged:true};return T;
}
// Exact allocations from the supplied 3 Oct v10 supplier plan. Original retained privately; no source names are parsed.
const transport953Source={sha256:'a3b4d75214389586a1b9ec68fe398e82d176bb52b839e0e62d4fdab068d075bc',onSite:{WC33:17,WC41:10,WC42:1,WC43:10,WC44:2,WC56:12,WC59:7,WC67:2,WC71:8},tasks:{T0089:{load:1,qty:1,date:'2026-10-06'},T0162:{load:4,qty:1,date:'2026-10-19'},T0176:{load:4,qty:2,date:'2026-10-22'}}};
function transport953Coverage(r,context){
 const rq=DATA.rehire_quotes||{},q=(rq.quotes||[]).find(q=>q.quote==='Q6845');
 if(!q||!rq.authorisation||rq.authorisation.state!=='approved'||!EP819.quote||EP819.quote.quote!=='Q6845')return null;
 const qty=transport953Quantity(r),leg=transport953Leg(r),field=r.item==='FWF'?'fwf':r.item==='Pee Panel'?'pee_panels':null;
 const drops=field?EP819.loads.flatMap(l=>l.stops.flatMap(s=>s.drops.filter(d=>r.key&&d.ref===r.key).map(d=>({n:l.n,qty:Number(d[field])||0})))):[];
 if(field==='fwf'&&EP819.version==='v10'){
  if(transport953Source.onSite[r.key])drops.push({n:'on site in the supplier plan',qty:transport953Source.onSite[r.key]});
  const t=transport953Source.tasks[r.task];if(t&&(!r.key||r.key===r.task)){if(r.date!==t.date)return {state:'review',reason:'Supplier plan and schedule disagree on this source task’s date. Confirm that it is the same quoted movement before removing the existing allowance.'};drops.push({n:t.load,qty:t.qty});}
 }
 const covered=drops.reduce((s,d)=>s+d.qty,0),required=context.reduce((s,x)=>s+(transport953Quantity(x)||Infinity),0),freight=leg==='demob'?q.pickup:q.delivery_charge;
 if(covered&&qty&&required<=covered&&typeof freight==='number')return {state:'covered',reason:'Q6845 '+(leg==='demob'?'pickup':'delivery')+' is already in approved Event Portables costs; exact '+r.item+' allocation in Load '+[...new Set(drops.filter(d=>d.qty).map(d=>d.n))].join(', ')+'. No second carrier allowance.'};
 if(r.key==='WC31'&&r.item==='16Pan Block')return {state:'review',reason:'Q6845 quotes one 16-pan block; the schedule requires two. Confirm the second block and any additional transport cost; no price is inferred.'};
 const supplier=!!(r.a&&typeof gcModel925==='function'&&gcModel925(r.a).rows.some(u=>u.item===r.item&&u.owner==='event-portables'));
 if((field&&covered)||supplier||r.key==='WC81')return {state:'review',reason:'Review Event Portables quote coverage for this exact equipment movement. Its approved quotes include delivery and pickup; no additional carrier cost is inferred.'};
 return null;
}
function transport953Build(){
 return transport953Reconcile(transport953Base(),{off:k=>!!(k&&rowOff(k)),coverage:transport953Coverage,demand:(r,context)=>finance928LoadDemands([Object.assign({},r,{leg:transport953Leg(r)})],assetTotal(r.a).lines||[],context.map(x=>Object.assign({},x,{leg:transport953Leg(x)})))[0]});
}
const transport953Base=transport888Build;transport888Build=transport953Build;
function transport953QuoteWords(){const q=((DATA.rehire_quotes||{}).quotes||[]).find(q=>q.quote==='Q6846');return q&&q.start_date&&q.end_date?'Q6846 hire dates: '+fmtDate(q.start_date)+' to '+fmtDate(q.end_date):'Q6846 hire dates need confirmation';}
function transport953SupplierGap(gap){
 const a=assetOf('WC31');if(a&&!a._cancelled){const q=((DATA.rehire_quotes||{}).quotes||[]).find(q=>q.quote==='Q6845'),line=q&&q.groups.flatMap(g=>g.lines||[]).find(l=>l.description==='16 Pan Toilet Block'),n=(assetTotal(a).lines||[]).filter(l=>l.item==='16Pan Block').reduce((s,l)=>s+(l.qty||0),0);if(line&&n>line.qty)gap('WC31 — second 16-pan block: supplier cost to confirm','The schedule requires '+n+' blocks; Q6845 prices '+line.qty+'. The additional hire and any additional transport cost remain unknown, not free.','Event Portables — confirm the quote variation');}
}
function transport953PlanHtml(T){
 const rs=T.planned.filter(r=>!r.cancelled&&!r.off&&!r.rest_of&&!rowOff(r.task)),n=T.forecast.plannedAllowances953||0;
 return `<details class="plfold765 tr888-fold transport953" data-sfold="costs765|tr953plan"${SFOLD_OPEN.has('costs765|tr953plan')?' open':''}><summary>Planned movements — carrier cost forecast<small>${esc(String(n))} card allowances · ${esc(String(T.forecast.heldPlanned953||0))} unpriced or awaiting scope · not bookings or invoices</small></summary><p class="fin745-basis">Explicit equipment quantities use the card’s each-way cost. Approved supplier delivery and pickup are not added again. Existing carrier figures or Coates-truck records replace the allowance; uncertain quantities and POA stay visible without a made-up cost.</p><div class="fin745-table tr888-table"><table class="tr888-stack"><thead><tr><th>Reference / source task</th><th>Date / leg</th><th>Equipment</th><th>Qty</th><th>Branch</th><th>Forecast / basis</th></tr></thead><tbody>${rs.map(r=>`<tr><td data-l="Reference / task"><b>${esc(r.key||r.task)}</b><br>${esc(r.task||'')}</td><td data-l="Date / leg">${esc(fmtDate(r.date))}<br>${esc(transport953Leg(r))}</td><td data-l="Equipment">${esc(r.item)}</td><td data-l="Qty">${esc(r.qty)}</td><td data-l="Branch">${esc(r.branch||'Unconfirmed')}</td><td data-l="Forecast / basis">${tr888ForecastCell(r)}</td></tr>`).join('')}</tbody></table></div></details>`;
}
function transport953Csv(rows,T){rows.push([],['5. Planned movements — not booked or invoiced','Reference','Source task','Date','Leg','Equipment','Qty','Branch','Forecast kind','Allowance AUD ex GST','Basis']);T.planned.filter(r=>!r.cancelled&&!r.off&&!r.rest_of&&!rowOff(r.task)).forEach(r=>rows.push(['Planned',r.key||'',r.task||'',r.date||'',transport953Leg(r),r.item,r.qty,r.branch||'Unconfirmed',r.forecast.kind,r.forecast.kind==='card'?r.forecast.amount:'',r.forecast.reason928||r.forecast.reason953||'Not forecast']));}
