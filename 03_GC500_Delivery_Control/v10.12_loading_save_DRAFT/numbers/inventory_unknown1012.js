/* Author: Andrew Fisher. Inventory counts known quantities; unknown scope is never one or zero by assumption. */
(function(root){'use strict';
 const valid=n=>typeof n==='number'&&Number.isFinite(n)&&n>=0;
 function unknown(row,col){return col==='asked'?!!row.unknownAsked1012:col==='togo'?!!(row.unknownAsked1012||row.unknownOn1012):col==='on'||col==='total'?!!row.unknownOn1012:false;}
 function remaining(row){return unknown(row,'togo')?row.knownRemaining1012||0:Math.max(0,(row.asked||0)-(row.on||0));}
 function number(row,col){return col==='total'?(row.on||0)+(row.spares||0):col==='togo'?remaining(row):row[col]||0;}
 function words(n,missing){return missing?(n>0?n+' known + unknown':'Quantity unknown'):String(n);}
 function text(row,col){return words(number(row,col),unknown(row,col));}
 function total(rows,col){const missing=rows.some(r=>unknown(r,col)),n=col==='togo'&&!missing?Math.max(0,rows.reduce((s,r)=>s+(r.asked||0)-(r.on||0),0)):rows.reduce((s,r)=>s+number(r,col),0);return words(n,missing);}
 function pending(row){return remaining(row)>0||unknown(row,'togo');}
 function pendingText(row,item){const n=remaining(row);return unknown(row,'togo')?(n>0?n+' known × '+item+' · quantity to confirm':item+' · quantity unknown'):n+' × '+item;}
 function record(row,ref,line){
  for(const r of [row,ref]){
   if(!valid(line.asked))r.unknownAsked1012=(r.unknownAsked1012||0)+1;
   if(!valid(line.onq))r.unknownOn1012=(r.unknownOn1012||0)+1;
   r.knownRemaining1012=(r.knownRemaining1012||0)+(valid(line.asked)&&valid(line.onq)?Math.max(0,line.asked-line.onq):0);
  }
 }
 function badge(row,col,n){return '<span data-inv-unknown1012>'+words(n,unknown(row,col))+'</span>';}
 const api={valid,unknown,remaining,number,words,text,total,pending,pendingText,record,badge};
 if(typeof module!=='undefined'&&module.exports)module.exports=api;if(root)root.InventoryUnknown1012=api;
})(typeof window!=='undefined'?window:globalThis);
