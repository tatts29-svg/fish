/* Author: Andrew Fisher. One A4 portrait day, geographic stops and adjacent verified navigation QR. */
(function(){
'use strict';
const S1000=Supplier996,previous=S1000.pdf;
S1000.pdf=async function(kind,day,alive=()=>true){
 if(kind!=='remaining')return previous.apply(this,arguments);
 await pdf7Sync();const M=S1000.model(),fingerprint=JSON.stringify(M),dates=[...new Set(M.remaining.filter(r=>day?r.date===day:true).map(r=>r.date))].sort();
 if(!dates.length)throw Error('No deliveries remain for this selection');
 const lib=await pdf7Lib();if(!alive())return null;if(JSON.stringify(S1000.model())!==fingerprint)throw Error('Shared records changed; reopen the document');
 const doc=new lib.jsPDF({orientation:'portrait',unit:'mm',format:'a4',compress:true}),title='GC500 - Event Portables - Remaining delivery run sheets';doc.setProperties({title,author:'Author: Andrew Fisher'.slice(8),creator:'GC500 Delivery Control'});
 const columns=[{label:'Stop',w:10},{label:'Reference / item',w:39},{label:'Qty',w:11},{label:'Destination',w:111},{label:'Map QR',w:23}];
 const printable=(r,i)=>{
  const nums=r.received===0&&r.numbers.length===r.remaining?r.numbers:[],basis=r.dispatchBasis||r.locationBasis||'',showBasis=!/^(Master plan reference position|Confirmed reference position|Recorded site pin)$/.test(basis);
  return [String(i+1),[S1000.displayRef(r),r.item,nums.length?'Assets: '+nums.join(', '):''].filter(Boolean).join('\n'),String(r.remaining),[r.location,showBasis?basis:''].filter(Boolean).join('\n'),r.dispatchUrl||r.url?'':'No verified QR'];
 };
 for(let page=0;page<dates.length;page++){
  if(page)doc.addPage('a4','portrait');const iso=dates[page],rows=M.remaining.filter(r=>r.date===iso),portaloo=rows.filter(r=>S1000.family(r.item)==='single').reduce((n,r)=>n+r.remaining,0),other=rows.filter(r=>S1000.family(r.item)!=='single').map(r=>r.remaining+' x '+r.item);
  if(iso&&portaloo>24)throw Error('Daily portaloo limit exceeded');
  doc.setFillColor(255,106,19);doc.rect(8,8,194,2,'F');doc.setTextColor(20,26,29);doc.setFont('helvetica','bold');doc.setFontSize(16);doc.text('GC500 - Event Portables',8,18);doc.setFontSize(10);doc.text('Remaining delivery run sheet',8,24);doc.setFontSize(13);doc.text(epText860(iso?epDay819(iso):'Delivery date not recorded'),8,32);doc.setFont('helvetica','normal');doc.setFontSize(9);doc.text(epText860([portaloo+' portaloos',...other,'Proposed','Maximum 24 per day'].join(' | ')),8,38);
  doc.setFontSize(8);doc.text(epText860([...new Set(rows.map(r=>(r.routeArea||'').replace(/→/g,'to')).filter(Boolean))].join(' / ')||'Current remaining deliveries'),8,43);
  const formatted=rows.map((r,i)=>{const cells=printable(r,i).map((v,c)=>doc.splitTextToSize(epText860(v),columns[c].w-4));return {cells,h:Math.max(19.6,...cells.map(c=>c.length*3.7+4)),url:r.dispatchUrl||r.url||''};});
  if(formatted.reduce((n,r)=>n+r.h,0)>216)throw Error('This day exceeds a legible A4 portrait page; review the delivery grouping');
  let y=46,x=8;doc.setFillColor(30,42,48);doc.rect(8,y,194,7,'F');doc.setTextColor(255,255,255);doc.setFont('helvetica','bold');doc.setFontSize(8);for(const col of columns){doc.text(col.label,x+2,y+4.7);x+=col.w;}y+=7;
  formatted.forEach((row,index)=>{let left=8;if(index%2===0){doc.setFillColor(245,247,248);doc.rect(8,y,194,row.h,'F');}for(let c=0;c<columns.length;c++){doc.setDrawColor(190,198,202);doc.rect(left,y,columns[c].w,row.h);doc.setTextColor(20,26,29);doc.setFont('helvetica',c<3?'bold':'normal');doc.setFontSize(c===2?10:8);doc.text(row.cells[c],left+2,y+4.5,{lineHeightFactor:1.3});if(c===4&&row.url)epQrPdf860(doc,row.url,left+2.5,y+(row.h-18)/2,18);left+=columns[c].w;}y+=row.h;});
  doc.setTextColor(20,26,29);doc.setFont('helvetica','bold');doc.setFontSize(9);doc.text('TOTAL: '+rows.reduce((n,r)=>n+r.remaining,0)+' items',8,y+6);
  doc.setFont('helvetica','normal');doc.setFontSize(7.5);doc.setTextColor(65,75,80);doc.text('Park: stop at entry. No trucks in west parkland. Coates directs placement.',8,279);
  doc.text(epText860('Proposed schedule - not a booking. Supplier balance: '+M.summary.fwf.unallocated+' unallocated FWF outside these runs.'),8,283);
  doc.text(epText860('As at '+epDay819(M.asAt)+' | Author: Andrew Fisher'),8,289);doc.text((page+1)+' / '+dates.length,202,289,{align:'right'});
 }
 return epFile860(doc.output('blob'),'GC500_Event_Portables_Remaining_'+(day||'All_dates_'+M.asAt)+'.pdf',dates.length,title,'Hi team,\n\nAttached are the current proposed Event Portables deliveries: 24 portaloos daily with the smaller balance last, one A4 portrait page per day. Location and meet-point QR codes are beside each stop.\n\nAndrew Fisher\nCoates Industrial Solutions');
};
})();
