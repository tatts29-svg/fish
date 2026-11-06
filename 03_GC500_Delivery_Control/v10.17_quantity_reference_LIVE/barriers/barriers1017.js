/* Author: Andrew Fisher. Original schedule explicitly marks these workfronts Reinstate.
   Classification affects physical-supply presentation only. It does not create receipts,
   transfers, completion, hire credits or financial postings. All workfronts stay available. */
function waterBarrierPlacement1017(a, supplied) {
 const links = {
  WB19:{sourceRef:'WB02',task:'T0217',sourceTask:'T0045',sourceQuantity:34,sheet:'Demob Week 2',row:2},
  WB20:{sourceRef:'WB03',task:'T0178',sourceTask:'T0040',sourceQuantity:30,sheet:'Demob Week 1',row:2}
 };
 const link = a && links[String(a.key)];
 if (!link || a._cancelled || a.relocation) return null;
 const sourceAsset = supplied?.sourceAsset || (typeof assetOf === 'function' ? assetOf(link.sourceRef) : null);
 const clean = value => String(value || '').trim().toLowerCase();
 const event = (a.events || []).filter(row => row && row.task_id === link.task);
 const origin = (sourceAsset?.events || []).filter(row => row && row.task_id === link.sourceTask);
 // Keep the source assertion bounded to the two reviewed operations and original quantities.
 if (event.length !== 1 || origin.length !== 1 || clean(event[0].activity) !== 'reinstate' || clean(origin[0].activity) !== 'install' ||
     clean(event[0].item) !== 'tl2' || clean(origin[0].item) !== 'tl2' ||
     event[0].quantity_raw !== link.sourceQuantity || origin[0].quantity_raw !== link.sourceQuantity) return null;
 const lines = supplied?.lines || chargeLines(a), quantity = lines.reduce((sum,line) => {
  const q = qtyOf(line);
  return sum != null && clean(line.item) === 'tl2' && Number.isSafeInteger(q) && q >= 0 ? sum + q : null;
 },0);
 if (!lines.length || quantity == null) return null;
 const dates = supplied?.dates || effectiveDates(a);
 return {kind:'reinstatement',key:String(a.key),sourceRef:link.sourceRef,item:'TL2',quantity,
  sourceQuantity:link.sourceQuantity,date:dates?.in || null,label:'Reinstate existing barriers',
  source:{file:'GC500 26 Schedule (8)',sheet:link.sheet,row:link.row,operationCell:'G'+link.row,operation:'Reinstate',task:link.task}};
}
function waterBarrierPlacements1017(assets) {
 return (assets || allAssets()).map(a => waterBarrierPlacement1017(a)).filter(Boolean)
  .sort((a,b) => String(a.date || '').localeCompare(String(b.date || '')) || a.key.localeCompare(b.key));
}
function waterBarrierPlacementsNote1017(rows, print) {
 rows = Array.isArray(rows) ? rows : waterBarrierPlacements1017();
 if (!rows.length) return '';
 const total = rows.reduce((sum,row) => sum + row.quantity,0);
 const ref = key => print ? '<b>'+esc(key)+'</b>' : '<button type="button" class="linkish" data-open="'+esc(key)+'">'+esc(key)+'</button>';
 if (print) return '<p class="wb1017-reinstatement-print"><b>Reinstatement work · '+total+' barriers:</b> '+rows.map(row => ref(row.key)+' '+row.quantity+' TL2'+(row.date?' · '+esc(fmtDate(row.date)):'')+' · from '+ref(row.sourceRef)).join('; ')+'.</p>';
 return '<div class="notice info wb1017-reinstatement"><b>Reinstatement work · '+total+' barriers</b><p>'+rows.map(row =>
  ref(row.key)+' · '+row.quantity+' TL2'+(row.date?' · '+esc(fmtDate(row.date)):'')+' · existing '+ref(row.sourceRef)+' barriers'
 ).join('<br>')+'</p><details><summary>More info</summary><p>The source schedule calls these operations Reinstate. They remain on the work schedule and are separate from new supply. A planned reinstatement does not record an arrival, transfer or completion.</p></details></div>';
}
