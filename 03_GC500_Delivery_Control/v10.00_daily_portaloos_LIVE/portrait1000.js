/* Author: Andrew Fisher. A4 portrait: one remaining-delivery page per day. */
(function(){
'use strict';
const S1000=Supplier996,previous=S1000.pdf;
S1000.pdf=async function(kind,day,alive=()=>true){
 if(kind!=='remaining')return previous.apply(this,arguments);
 await pdf7Sync();const M=S1000.model(),fingerprint=JSON.stringify(M),dates=[...new Set(M.remaining.filter(r=>day?r.date===day:true).map(r=>r.date))].sort();
 if(!dates.length)throw Error('No deliveries remain for this selection');
 const lib=await pdf7Lib();if(!alive())return null;if(JSON.stringify(S1000.model())!==fingerprint)throw Error('Shared records changed; reopen the document');
 const doc=new lib.jsPDF({orientation:'portrait',unit:'mm',format:'a4',compress:true}),title='GC500 - Event Portables - Remaining delivery run sheets';doc.setProperties({title,author:'Andrew Fisher',creator:'GC500 Delivery Control'});
 const columns=[{label:'Reference / item',w:45},{label:'Qty',w:12},{label:'Asset numbers',w:35},{label:'Destination',w:102}];
 const printable=r=>[S1000.displayRef(r)+'\n'+r.item,String(r.remaining),r.received===0&&r.numbers.length===r.remaining?r.numbers.join(', '):'—',[r.location,r.locationBasis].filter(Boolean).join('\n')];
 for(let page=0;page<dates.length;page++){
  if(page)doc.addPage('a4','portrait');const iso=dates[page],rows=M.remaining.filter(r=>r.date===iso),portaloo=rows.filter(r=>S1000.family(r.item)==='single').reduce((n,r)=>n+r.remaining,0),other=rows.filter(r=>S1000.family(r.item)!=='single').map(r=>r.remaining+' x '+r.item);
  if(iso&&portaloo>24)throw Error('Daily portaloo limit exceeded');
  doc.setFillColor(255,106,19);doc.rect(8,8,194,2,'F');doc.setTextColor(20,26,29);doc.setFont('helvetica','bold');doc.setFontSize(16);doc.text('GC500 - Event Portables',8,20);doc.setFontSize(11);doc.text('Remaining delivery run sheet',8,27);doc.setFontSize(13);doc.text(epText860(iso?epDay819(iso):'Delivery date not recorded'),8,37);doc.setFont('helvetica','normal');doc.setFontSize(9);doc.text(epText860([portaloo+' portaloos',...other,'Proposed','Maximum 24 portaloos per day'].join(' | ')),8,44);
  let formatted,chosen;
  for(const size of [9,8.5,8]){doc.setFontSize(size);const line=size*0.46;const candidate=rows.map(r=>{const cells=printable(r).map((v,i)=>doc.splitTextToSize(epText860(v),columns[i].w-4));return {cells,h:Math.max(13,...cells.map(c=>c.length*line+5))};});if(candidate.reduce((n,r)=>n+r.h,0)<=207){formatted=candidate;chosen={size,line};break;}}
  if(!formatted)throw Error('This day exceeds a legible A4 portrait page; review the delivery grouping');
  let y=51,x=8;doc.setFillColor(30,42,48);doc.rect(8,y,194,9,'F');doc.setTextColor(255,255,255);doc.setFont('helvetica','bold');doc.setFontSize(9);for(const col of columns){doc.text(col.label,x+2,y+5.7);x+=col.w;}y+=9;
  doc.setTextColor(20,26,29);doc.setFont('helvetica','normal');doc.setFontSize(chosen.size);
  formatted.forEach((row,index)=>{let left=8;if(index%2===0){doc.setFillColor(245,247,248);doc.rect(8,y,194,row.h,'F');}for(let c=0;c<columns.length;c++){doc.setDrawColor(190,198,202);doc.rect(left,y,columns[c].w,row.h);doc.text(row.cells[c],left+2,y+4.5,{lineHeightFactor:1.3});left+=columns[c].w;}y+=row.h;});
  doc.setFont('helvetica','bold');doc.setFontSize(9);doc.text('TOTAL: '+rows.reduce((n,r)=>n+r.remaining,0)+' items',8,y+7);
  doc.setFont('helvetica','normal');doc.setFontSize(7.8);doc.setTextColor(65,75,80);doc.text('Asset numbers: dash = not yet recorded for this delivery. Proposed schedule - not a transport booking.',8,277);
  doc.text(epText860('Supplier FWF: '+M.summary.fwf.received+' received | '+M.summary.fwf.pending+' scheduled | '+M.summary.fwf.unallocated+' unallocated'),8,282);
  doc.text(epText860('As at '+epDay819(M.asAt)+' | Author: Andrew Fisher'),8,289);doc.text((page+1)+' / '+dates.length,202,289,{align:'right'});
 }
 return epFile860(doc.output('blob'),'GC500_Event_Portables_Remaining_'+(day||'All_dates_'+M.asAt)+'.pdf',dates.length,title,'Hi team,\n\nAttached are the current proposed Event Portables deliveries: maximum 24 portaloos per day, one A4 portrait page per day.\n\nAndrew Fisher\nCoates Industrial Solutions');
};
})();
