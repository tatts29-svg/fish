/* Author: Andrew Fisher. Supplier charges retain their original evidence and separate site quantities. */
const supplierPreviousLocation1088 = supplierLocation1014;
function supplierLink1088(source, label) {
 if (!source || !source.source_id) return esc(label);
 const link = fenceTraceLink837(photoFor({id:source.source_id}), label, source.page || null);
 return link ? '<a class="fp-paper" href="'+esc(link.url)+'" target="_blank" rel="noopener noreferrer">'+esc(link.label)+'</a>' : esc(label);
}
function supplierOriginal1088(source) {
 if (!source || !source.file) return '';
 const where = [source.part ? 'part '+source.part : '', source.page ? 'page '+source.page : ''].filter(Boolean).join(' · ');
 return '<br><small>Original: '+esc(source.file)+(where?' · '+esc(where):'')+'</small>';
}
supplierLocation1014 = function(r) {
 const link = r.linkage;
 if (!link) return supplierPreviousLocation1088(r)+supplierOriginal1088(r.original_source);
 let out = '<span>'+esc(r.current_location || 'Area not recorded')+'</span>';
 if (r.current_reference) out += '<br><span>Reference: '+esc(r.current_reference)+'</span>';
 for (const s of link.schedule || []) {
  const label = [s.sheet, s.row != null ? 'row '+s.row : '', s.description, s.date].filter(Boolean).join(' · ');
  out += '<br><small>Schedule'+(s.status && s.status !== 'confirmed' ? ' · '+esc(s.status) : '')+': '+supplierLink1088(s,label)+'</small>';
 }
 for (const m of link.maps || []) {
  const label = [m.label || m.source_id, m.page ? 'page '+m.page : '', m.scope || 'location context'].filter(Boolean).join(' · ');
  out += '<br><small>Map'+(m.status && m.status !== 'confirmed' ? ' · '+esc(m.status) : '')+': '+supplierLink1088(m,label)+'</small>';
 }
 for (const note of link.notes || []) out += '<br><small>'+esc(note)+'</small>';
 return out+supplierOriginal1088(r.original_source);
};
function supplierUnmatched1088(source) {
 const entries = Array.isArray(source?.review_items) ? source.review_items : [];
 if (!entries.length) return '';
 const notes = serviceNoteRows();
 const items = entries.map(x => {
  const note = x.book === 'green' ? notes.find(n => n.id === x.id && String(n.note_no || n.docket_no) === String(x.number)) : null;
  const assigned = note && supplierEntry1014('green', note.id);
  const estimate = note && !assigned && note.cost != null ? ' · separate docket estimate '+money(note.cost) : '';
  const evidence = x.linkage ? '<br>'+supplierLocation1014({...x,current_location:note?.location || 'Area from linked evidence'}) : supplierOriginal1088(x.original_source);
  return '<li>Docket '+esc(x.number || x.id)+': '+esc(x.reason || 'Billing evidence needs review')+esc(estimate)+evidence+'</li>';
 }).join('');
 return '<p class="todo">Items outside this supplier allocation</p><ul>'+items+'</ul>';
}
poSupplierBlock1014 = function(number) {
 const p = supplierPricing1014().orders.find(o => o.number === String(number));
 if (!p) return '';
 const label = !p.valid ? 'Supplier pricing needs review' : p.difference === 0 ? '✓ Supplier charges match P/O to the cent' : p.difference == null ? 'Supplier priced · P/O value needed' : 'P/O difference '+money(p.difference);
 const rows = p.records.map(r => '<tr><td>'+esc(r.number)+' · '+esc(r.book==='red'?'Hire agreement':r.book==='green'?'Labour note':'Collection')+'</td><td>'+esc(r.date)+'</td><td>'+supplierLocation1014(r)+'</td><td>'+(r.lines.length?r.lines.map(l=>esc(l.name)+' · '+esc(fmtQty(l.qty,l.unit))+' × '+esc(rateMoney(l.rate))+' = '+esc(money(l.paid))).join('<br>'):'Component collection only · no charge in this allocation')+'</td><td class="num">'+esc(money(r.amount))+'</td></tr>').join('');
 const extras = p.extras.map(x => {
  const gear = SupplierPo1014.GEAR.includes(x.column);
  const evidence = gear ? 'Docket '+esc(x.source?.reference || '')+'<br>'+supplierLocation1014({...x,current_location:x.location || 'Area from linked evidence',original_source:x.source}) : 'Daily crew cost';
  return '<tr><td>'+esc(x.name || (gear?'Supplier materials':'Team leader'))+'</td><td>'+esc(x.date)+'</td><td>'+evidence+'</td><td>'+esc(fmtQty(x.qty,x.unit))+' × '+esc(rateMoney(x.rate))+'</td><td class="num">'+esc(money(x.paid))+'</td></tr>';
 }).join('');
 const caveats = [p.source.tax_basis_note,p.source.invoice_status].filter(Boolean).map(x=>'<p>'+esc(x)+'</p>').join('');
 return '<div class="po-supplier1014"><b class="'+(p.valid&&p.difference===0?'':'todo')+'">'+esc(label)+'</b><details><summary>More info · supplier pricing</summary>'+(p.errors.length?'<p class="todo">'+p.errors.map(esc).join('<br>')+' · source allocation is not applied.</p>':'')+'<p>'+esc(p.source.file || 'Source not recorded')+' · '+esc(p.source.date || '')+' · '+esc(p.branch || 'Branch needed')+' · AUD ex GST</p>'+caveats+'<div class="tblwrap"><table><thead><tr><th>Source</th><th>Work date</th><th>Current area / reference</th><th>Supplier billed quantities</th><th>Direct cost</th></tr></thead><tbody>'+rows+extras+'</tbody></table></div><p>Hire agreements '+esc(money(p.red))+' + labour notes '+esc(money(p.green))+' + separate supplier items '+esc(money(p.extrasTotal))+' = <b>'+esc(money(p.total))+'</b>.</p>'+supplierUnmatched1088(p.source)+'<p>Supplier billed quantities are shown alongside the original docket and schedule evidence. A matching financial total does not certify every physical quantity or map location. Receipt and payment status remain separate.</p></details></div>';
};
if (typeof sharedCache975 === 'function') sharedCache975();
