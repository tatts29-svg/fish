/* Author: Andrew Fisher. Current shared inventory and proposed supplier run sheets; no email is sent. */
(function(){
'use strict';
const S996=window.Supplier996;
async function pdf(kind,day,alive=()=>true){
 await pdf7Sync();const M=S996.model(),loads=kind==='demob'?S996.demobLoads():kind==='remaining'?S996.inboundLoads(day):[],fingerprint=JSON.stringify({M,loads}),lib=await pdf7Lib();
 if(!alive())return null;if(JSON.stringify({M:S996.model(),loads:kind==='demob'?S996.demobLoads():kind==='remaining'?S996.inboundLoads(day):[]})!==fingerprint)throw new Error('Shared records changed; reopen the document');
 if(kind!=='inventory'&&!loads.length)throw new Error('No loads remain for this selection');
 const label=kind==='inventory'?'Current inventory':kind==='demob'?'Proposed demob run sheets':'Remaining delivery run sheets',title='GC500 - Event Portables - '+label,doc=new lib.jsPDF({orientation:'landscape',unit:'mm',format:'a4',compress:true});doc.setProperties({title,author:'Andrew Fisher',creator:'GC500 Delivery Control'});
 const cols=[{label:'Reference / item',w:38},{label:'Qty / status',w:27},{label:'Asset numbers',w:72},{label:'Destination / basis',w:89},{label:'Location QR',w:25},{label:'Checks',w:30}];let y=0,pages=0,section='';
 function head(sub){section=sub;pages++;doc.setFillColor(255,106,19);doc.rect(8,8,281,2,'F');doc.setFont('helvetica','bold');doc.setFontSize(16);doc.setTextColor(20,26,29);doc.text(epText860(title),8,20);doc.setFontSize(10);doc.text(epText860(sub),8,27);doc.setFont('helvetica','normal');doc.setFontSize(8);doc.text(epText860('As at '+epDay819(M.asAt)+' | '+M.summary.onSite+' on site | '+M.summary.remaining+' scheduled to arrive | Author: Andrew Fisher'),8,33);y=38;let x=8;doc.setFillColor(30,42,48);doc.rect(8,y,281,8,'F');doc.setTextColor(255,255,255);doc.setFont('helvetica','bold');for(const c of cols){doc.text(c.label,x+2,y+5);x+=c.w;}y+=8;doc.setTextColor(20,26,29);}
 function row(r,mode){
  const ns=r.numbers||[],recorded=r.recordedNumbers||[],numbers=r.quantityOnly?'Quantity only - no fleet numbers':ns.length?ns.join(', '):recorded.length?'Recorded allocation: '+recorded.join(', ')+'\nLoad asset assignment pending':'Asset numbers not recorded';
  const count=mode==='inventory'?r.received+' received\n'+(r.onSite===null?'On-site status unclear':r.onSite+' on site'):r.count+' '+(mode==='demob'?'on site':'to arrive');
  const checks=[r.locationConflict?'Asset location conflict - HOLD':'',r.dispatchHold?'Record needs review - HOLD':'',r.identityPending?'Load numbers not allocated':'',mode==='demob'?(r.emptied?'Pump-out recorded':'Pump-out not recorded'):'',mode==='demob'?(r.outDate?'Recorded pickup '+epDay819(r.outDate):'Pickup date not recorded'):''].filter(Boolean).join('\n');
  const vals=[r.ref+'\n'+r.item,count,numbers,[r.location,r.locationBasis].filter(Boolean).join('\n'),r.url?'':'No exact QR',checks];doc.setFont('helvetica','normal');doc.setFontSize(8.5);const lines=vals.map((v,i)=>doc.splitTextToSize(epText860(v),cols[i].w-4)),h=Math.max(26,...lines.map(l=>l.length*3.7+6));if(h>130)throw new Error('A supplier row is too long to print');if(y+h>185){doc.addPage('a4','landscape');head(section);doc.setFont('helvetica','normal');doc.setFontSize(8.5);}let x=8;
  for(let i=0;i<cols.length;i++){doc.setDrawColor(174,184,189);doc.rect(x,y,cols[i].w,h);if(i===4&&r.url){epQrPdf860(doc,r.url,x+3,y+2,19);doc.setFontSize(6.5);doc.text('Location basis shown',x+1,y+24);doc.setFontSize(8.5);}else doc.text(lines[i],x+2,y+4.5);x+=cols[i].w;}y+=h;
 }
 if(kind==='inventory'){head('Recorded inventory - asset allocation and received quantities shown separately');M.inventory.forEach(r=>row(r,'inventory'));}
 else for(const L of loads){if(pages)doc.addPage('a4','landscape');head((kind==='remaining'?epDay819(day)+' | ':'Outside island first | ')+'Proposed load '+L.n+' | '+S996.loadText(L));L.stops.forEach(r=>row(r,kind==='demob'?'demob':'remaining'));doc.setFontSize(8);doc.text(epText860(L.capacity+' | Proposed grouping - not a transport booking'),8,Math.min(190,y+6));}
 const total=doc.getNumberOfPages();for(let i=1;i<=total;i++){doc.setPage(i);doc.setFont('helvetica','normal');doc.setFontSize(8);doc.setTextColor(70,80,85);doc.text('Author: Andrew Fisher | Event Portables | Current shared records',8,201);doc.text(i+' / '+total,289,201,{align:'right'});}
 const filename='GC500_Event_Portables_'+(kind==='inventory'?'Inventory':kind==='demob'?'Demob_Proposed':'Remaining')+'_'+(day||M.asAt)+'.pdf';
 return epFile860(doc.output('blob'),filename,total,title+' - '+(day||M.asAt),'Hi team,\n\nAttached is the current Event Portables '+label.toLowerCase()+' as at '+epDay819(M.asAt)+'.\n\n'+(kind==='inventory'?M.summary.onSite+' items are recorded on site. Identified units awaiting arrival are shown separately.':'Proposed truck groupings follow the recorded quantities and current destinations. Please review dates and fleet allocations before booking.')+'\n\nAndrew Fisher\nCoates Industrial Solutions');
}
S996.pdf=pdf;
})();
