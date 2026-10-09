/* Author: Andrew Fisher. Supplier work projected from current shared item records. */
const Subhire975=(()=>{
 const active=(rows)=>rows.filter(r=>r.remaining>0).sort((a,b)=>a.date.localeCompare(b.date)||a.ref.localeCompare(b.ref,undefined,{numeric:true}));
 function remainingRows(){
  const seen=new Set(),rows=[];
  programmeDays().forEach(d=>(d.deliveries||[]).forEach(row=>{
   const a=row.a;if(!a||a._cancelled||movedAway(a.key))return;
   chargeLines(a).filter(l=>l.item&&epLine909(a,l.item)).forEach(l=>{
    const key=a.key+'|'+l.item;if(seen.has(key))return;seen.add(key);
    const p=toiletItem962(a,l.item,deliveryAsOf(a.key,todayIso()),todayIso());if(!p)return;
    rows.push({ref:a.key,item:l.item,date:d.iso,quantity:p.quantity,received:p.arrived,installed:p.done,remaining:Math.max(0,p.quantity-p.arrived)});
   });
  }));return active(rows);
 }
 function html(){const rows=remainingRows(),groups=[...new Set(rows.map(r=>r.date))];
  return '<section class="card nosfold" data-subhire975-plan><h3>Event Portables · remaining deliveries</h3>'+'<p class="units925-note">'+rows.reduce((n,r)=>n+r.remaining,0)+' scheduled items still to arrive</p>'+(rows.length?groups.map(date=>'<details class="units925-edit" open><summary>'+esc(epDay819(date))+' · '+rows.filter(r=>r.date===date).reduce((n,r)=>n+r.remaining,0)+' remaining</summary>'+rows.filter(r=>r.date===date).map(r=>'<button class="units925-company-unit" type="button" data-unit925-open="'+esc(r.ref)+'" data-unit925-item="'+esc(r.item)+'"><span><b>'+esc(r.ref)+' · '+esc(r.item)+'</b><small>'+r.received+' received · '+r.installed+' installed</small></span><span>'+r.remaining+' to arrive →</span></button>').join('')+'</details>').join(''):'<p class="units925-note">No outstanding deliveries on the current schedule.</p>')+'<details class="units925-edit"><summary>Original supplier plan · history</summary>'+ep819Html()+'</details></section>';
 }
 return {active,remainingRows,html};
})();
