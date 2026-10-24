/* Author: Andrew Fisher. Rehire details are included in branch Revenue, not another amount to add. */
function pl754Title(b){
 const parts = ['Revenue detail only: these amounts are already included in the hire columns and branch total.'];
 if (b.rehireLines) parts.push(fmtNum(b.rehireLines) + ' toilet lines (' + fmtNum(b.rehireUnits) + ' units) carry ' + money0(b.rehireCharge) + ' of toilet hire Revenue. The supplier allocation is not established for every unit; ' + fmtNum(b.rehireCoatesNos) + ' lines carry a Coates plant number.');
 if (b.plantLines) parts.push(fmtNum(b.plantLines) + ' plant lines marked hired in: ' + b.plantWhat.join('; ') + '. Their Revenue is included in hire; supplier and Rehire cost remain unrecorded.');
 if (b.subLines) parts.push(fmtNum(b.subLines) + ' SUB lines from ' + (b.suppliers.join(', ') || 'a supplier not named') + ': ' + money0(b.rehire) + ' Rehire Revenue, included in hire by the rate.');
 return parts.join(' ');
}
function pl754Cell(b, RH){
 const out = [];
 if (b.rehireLines) {
  out.push(`<b>Toilet hire Revenue</b> · ${esc(fmtNum(b.rehireLines))} lines · ${esc(fmtNum(b.rehireUnits))} units · <b>${esc(money0(b.rehireCharge))}</b> included in hire${b.rehireUnrated ? ` <span class="pl-todo">+ ${esc(fmtNum(b.rehireUnrated))} unrated</span>` : ''}`);
  out.push('<span class="w">Supplier allocation is not established for every unit; this is the toilet Revenue stream, not a confirmed ownership split.</span>');
  out.push(`<span class="w">${RH && RH.servicing ? `Whole-job servicing ${esc(money0(RH.servicing))} at card or entered rates is outside the branch contract total. ` : ''}${RH && RH.cost != null ? `${esc(RH.co)} Rehire cost ${esc(money0(RH.cost))}${RH.approved ? ' approved' : ' quoted, unsigned'} is a whole-job Direct cost, shown for reference only.` : 'Rehire cost not on the record.'}</span>`);
  out.push(`<span class="w">${esc(fmtNum(b.rehireCoatesNos))} lines carry a Coates plant number · ${esc(fmtNum(RH && RH.marked || 0))} locations marked ${esc(RH && RH.co || 'Event Portables')} gear on the page.</span>`);
 }
 if (b.plantLines) out.push(`<b>Rehire · plant</b> · ${esc(fmtNum(b.plantLines))} lines · <b>${esc(money0(b.plantCharge))}</b> included in hire${b.plantUnrated ? ` <span class="pl-todo">+ ${esc(fmtNum(b.plantUnrated))} unrated</span>` : ''}<br><span class="w">${esc(b.plantWhat.join('; '))} · marked hired in · supplier and cost not on record</span>`);
 if (b.subLines) out.push(`<span class="w"><b>${esc(fmtNum(b.subLines))} SUB lines</b> · ${esc(money0(b.rehire))} included in hire by the rate · ${esc(b.suppliers.join(', ') || 'supplier not named')} · cost not on record</span>`);
 return out.length ? out.join('<br>') : '<span class="pl-none">none recorded</span>';
}
