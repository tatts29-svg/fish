/* Author: Andrew Fisher. Read-only programme work metres; original readings stay authoritative. */
function fenceOverall853(asOf, suppliedSummary, suppliedFencing) {
  const day = asOf || todayIso(), fencing = suppliedFencing || todayFencingSummary848(day);
  const summary = suppliedSummary || todayWorkSummary848(day, undefined, undefined, fencing);
  const ids = ['clean', 'scrim', 'ccb_event', 'ccb_demarc', 'relocation', 'removal'];
  const number = value => typeof value === 'number' && Number.isFinite(value);
  const round = value => Math.round(value * 100) / 100;
  const rows = ids.map(id => (summary.fencingRows || []).filter(row => row.id === id));
  const health = fencing.health || summary.health || {ready:false};
  const result = {asOf:day, health, state:'unconfirmed', unit:'m', total:null, recorded:null,
    credited:null, left:null, pct:null, lampPct:null, provisional:false, classificationPending:false,
    allGreen:false, rows:[], gates:[], issues:[],
    basis:'Build + Event programme work metres. Each activity counts up to its own current programme total. Extra work cannot cover another activity’s shortfall. This measures work recorded, not unique standing fence length or whole-job physical completion. Demob, gate counts, components, hours and reinstatement without a programme total are separate.'};
  result.gates = ['v_gates','ped_gates'].map(id => {
    const matches = (summary.fencingRows || []).filter(row => row.id === id);
    const row = matches.length === 1 ? matches[0] : null;
    const ready = health.ready && row?.unit === 'each' && !row.evidencePending && !row.unquantifiedPlan;
    return {id, label:row?.label || (id === 'v_gates' ? 'Vehicle gates' : 'Pedestrian gates'),
      total:ready && number(row.total) && row.total >= 0 && !row.totalRange ? row.total : null,
      done:ready && number(row.done) && row.done >= 0 && !row.doneRange && !row.recordedRange ? row.done : null,
      left:ready && number(row.left) && row.left >= 0 && !row.leftRange ? row.left : null,
      provisional:!!row?.sourceProvisional, unit:'programme gates'};
  });
  if (!health.ready) { result.state = health.loading ? 'loading' : 'unavailable'; result.issues.push(health.basis || 'Waiting for the shared record.'); return result; }
  if (rows.some(matches => matches.length !== 1)) { result.issues.push('All six work types need one unique current reading.'); return result; }
  const current = rows.map(matches => matches[0]);
  const ccbPending = current.some(row => ['ccb_event','ccb_demarc'].includes(row.id) && row.classificationPending);
  result.provisional = current.some(row => row.sourceProvisional);
  result.classificationPending = current.some(row => row.classificationPending);
  result.rows = current.map(row => ({id:row.id, label:row.label, total:row.total, recorded:row.done,
    totalRange:row.totalRange || null, recordedRange:row.doneRange || row.recordedRange || null,
    credited:null, left:null, provisional:!!row.sourceProvisional,
    classificationPending:['ccb_event','ccb_demarc'].includes(row.id) ? ccbPending : !!row.classificationPending}));
  if (current.some(row => row.unit !== 'm' || row.evidencePending || row.unquantifiedPlan || row.totalRange ||
      (!['ccb_event','ccb_demarc'].includes(row.id) || !ccbPending) && (row.doneRange || row.recordedRange) ||
      !number(row.total) || row.total < 0 || !number(row.done) || row.done < 0)) {
    result.issues.push('A current quantity, evidence review or full programme total is unconfirmed. Existing type readings and minimums remain in View details; no type is dropped from the overall scope.');
    return result;
  }
  const other = current.filter(row => !['ccb_event','ccb_demarc'].includes(row.id));
  let low = other.reduce((sum,row) => sum + Math.min(row.done,row.total), 0), high = low;
  const event = current.find(row => row.id === 'ccb_event'), demarc = current.find(row => row.id === 'ccb_demarc');
  if (event.classificationPending || demarc.classificationPending) {
    const classification = fencing.classification || {}, E = classification.confirmedByType?.ccb_event,
      D = classification.confirmedByType?.ccb_demarc, P = classification.pendingMetres;
    if (![E,D,P].every(value => number(value) && value >= 0) || Math.abs(event.done + demarc.done - E - D - P) > 0.005) {
      result.issues.push('The shared CCB category quantity does not reconcile.'); return result;
    }
    for (const [row,confirmed] of [[event,E],[demarc,D]]) {
      const ranges = [row.doneRange,row.recordedRange].filter(Boolean);
      if (row.done < confirmed - 0.005 || row.done > confirmed + P + 0.005 || ranges.some(range =>
          !number(range.min) || !number(range.max) || range.min < 0 || range.min > range.max ||
          Math.abs(range.min-confirmed) > 0.005 || Math.abs(range.max-confirmed-P) > 0.005)) {
        result.issues.push('A CCB allocation or range conflicts with its confirmed and shared pending quantities.'); return result;
      }
      result.rows.find(item => item.id === row.id).recordedRange = {min:confirmed,max:confirmed+P};
    }
    const allocations = [0,P,event.total-E,D+P-demarc.total].map(value => Math.max(0,Math.min(P,value)));
    const credits = allocations.map(value => Math.min(E+value,event.total) + Math.min(D+P-value,demarc.total));
    low += Math.min(...credits); high += Math.max(...credits);
    result.provisional = true;
    result.issues.push('The pending CCB quantity is shared once between Event and Demarcation. The range preserves every possible allocation without counting both upper bounds.');
  } else {
    const credit = Math.min(event.done,event.total) + Math.min(demarc.done,demarc.total);
    low += credit; high += credit;
  }
  const total = current.reduce((sum,row) => sum + row.total, 0);
  const recorded = current.reduce((sum,row) => sum + row.done,0);
  if (!number(total) || !number(recorded) || !number(low) || !number(high) || total <= 0) { result.issues.push('Finite quantities and a positive measured programme total are required.'); return result; }
  result.state = 'ready'; result.total = round(total);
  result.recorded = round(recorded);
  result.credited = {min:round(low),max:round(high)};
  result.left = {min:round(total-high),max:round(total-low)};
  // Floor the conservative bound so rounding cannot light an unreached milestone.
  const lowerPct = Math.floor((low / total * 100 + 1e-9) * 100) / 100;
  result.lampPct = lowerPct;
  result.pct = {min:lowerPct,max:round(high/total*100)};
  if (Math.abs(low-high) < 0.005) result.pct.min = result.pct.max;
  result.excess = {min:round(result.recorded-high),max:round(result.recorded-low)};
  result.rows.forEach(row => {
    if (!row.classificationPending) { row.credited = round(Math.min(row.recorded,row.total)); row.left = round(Math.max(0,row.total-row.recorded)); }
  });
  if (result.provisional) result.issues.push('One or more current programme totals are provisional. This reading is not a confirmed physical completion sign-off.');
  return result;
}
