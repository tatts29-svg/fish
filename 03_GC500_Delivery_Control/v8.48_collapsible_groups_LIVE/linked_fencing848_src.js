/* Author: Andrew Fisher. Reviewed physical work linked to its original source.
 * Supplements existing docket links without inventing fence geometry or payments.
 */
function todayLinkedFencing848(typeId, asOf) {
  const result = todayLinkedFencing844(typeId, asOf);
  if (result.state !== 'ready') return result;
  const evidence = fenceProgressEvidence848(asOf || todayIso());
  const safe = (value, thumb) => {
    if (typeof value !== 'string' || /[\u0000-\u001f\u007f]/.test(value)) return null;
    if (thumb && /^data:image\/(?:png|jpe?g|webp|gif|avif);base64,[A-Za-z0-9+/]+={0,2}$/i.test(value)) return value;
    try { const url = new URL(value, location.href); return /^https?:$/.test(url.protocol) && !url.username && !url.password ? url.href : null; } catch (_) { return null; }
  };
  for (const operation of evidence.operations.filter(row => row.type === result.typeId)) {
    const pointers = operation.paperSources || (operation.paperSourceIds || []).map(id => ({id}));
    const papers = pointers.map(pointer => {
      let media = {state:'unchecked'};
      try { media = photoFor({id:pointer.id}); } catch (_) {}
      let url = media.state === 'ready' ? safe(media.url) : null;
      if (url && Number.isInteger(pointer.page) && pointer.page > 0) url = url.split('#')[0] + '#page=' + pointer.page;
      return {id:pointer.id, name:media.file?.title || media.file?.name || pointer.id,
        state:url ? 'ready' : media.state === 'ready' ? 'unavailable' : media.state,
        url, thumb:media.state === 'ready' ? safe(media.thumb, true) : null};
    });
    result.dockets.push({key:'physical-work848:' + operation.id, id:operation.recordId,
      number:operation.number, recordLabel:operation.book === 'green' ? 'Service note' : 'Collection form',
      date:operation.date, quantity:operation.quantity, unit:operation.unit, location:operation.location,
      areaStatus:null, recordAction:{kind:'fencing'}, areas:[], papers,
      papersState:papers.every(paper => paper.state === 'ready') ? 'ready' : 'unchecked',
      mapState:'unmapped', mapNote:operation.basis + ' No exact fence section is inferred from this work record.', sourceLinks:[]});
  }
  result.issues = [...new Set(result.issues.concat(evidence.issues))];
  result.basis = 'Recorded work includes dated installation dockets and reviewed service and collection records. Each physical operation is counted once; different work types are not unique fence stock.';
  return result;
}
