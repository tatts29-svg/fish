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
  return '<section class="card nosfold units925" data-subhire975-plan><h3>Event Portables · remaining deliveries</h3>'+'<p class="units925-note">'+rows.reduce((n,r)=>n+r.remaining,0)+' scheduled items still to arrive</p>'+(rows.length?groups.map(date=>'<details class="units925-edit" open><summary>'+esc(epDay819(date))+' · '+rows.filter(r=>r.date===date).reduce((n,r)=>n+r.remaining,0)+' remaining</summary><button class="btn" type="button" data-subhire975-print="'+esc(date)+'">Print / Save run sheet</button>'+rows.filter(r=>r.date===date).map(r=>'<button class="units925-company-unit" type="button" data-unit925-open="'+esc(r.ref)+'" data-unit925-item="'+esc(r.item)+'"><span><b>'+esc(r.ref)+' · '+esc(r.item)+'</b><small>'+r.received+' received · '+r.installed+' installed</small></span><span>'+r.remaining+' to arrive →</span></button>').join('')+'</details>').join(''):'<p class="units925-note">No outstanding deliveries on the current schedule.</p>')+'<details class="units925-edit"><summary>Original supplier plan · history</summary>'+ep819Html()+'</details></section>';
 }
 return {active,remainingRows,html};
})();
async function subhirePdf975(date,alive){
 await pdf7Sync();const rows=holdAssets(()=>Subhire975.remainingRows().filter(r=>r.date===date)),fingerprint=JSON.stringify(rows),lib=await pdf7Lib();
 if(!alive())return null;if(!rows.length)throw new Error('No outstanding deliveries remain for this date');
 if(JSON.stringify(holdAssets(()=>Subhire975.remainingRows().filter(r=>r.date===date)))!==fingerprint)throw new Error('Shared deliveries changed; reopen the run sheet');
 const title='GC500 - Event Portables remaining deliveries - '+date,doc=new lib.jsPDF({unit:'mm',format:'a4',compress:true});doc.setProperties({title,author:'Andrew Fisher',creator:'GC500 Delivery Control'});let y=26,page=1;
 const head=()=>{doc.setFont('helvetica','bold');doc.setFontSize(14);doc.text('Event Portables - remaining deliveries',10,14);doc.setFontSize(10);doc.text(epText860(epDay819(date)),10,21);y=29;};head();
 for(const r of rows){const a=assetOf(r.ref),w=whereText(a)||{},text=[r.ref+' | '+r.item+' | '+r.remaining+' to arrive',r.received+' received | '+r.installed+' installed',[w.main,w.also].filter(Boolean).join(' | ')].map(epText860),lines=doc.splitTextToSize(text.join('\n'),188),height=lines.length*4.4+8;if(y+height>280){doc.addPage();page++;head();}doc.setFont('helvetica','normal');doc.setFontSize(10);doc.text(lines,10,y);y+=height;}
 const pages=doc.getNumberOfPages();for(let i=1;i<=pages;i++){doc.setPage(i);doc.setFontSize(8);doc.text('Author: Andrew Fisher | Current shared record | '+todayIso(),10,291);doc.text(i+' / '+pages,184,291);}
 return epFile860(doc.output('blob'),'GC500_Event_Portables_Remaining_'+date+'.pdf',pages,title,'Current outstanding deliveries only.');
}
document.addEventListener('click',e=>{const b=e.target.closest?.('[data-subhire975-print]');if(!b)return;e.preventDefault();epDocuments860('remaining',b.dataset.subhire975Print,b);});
