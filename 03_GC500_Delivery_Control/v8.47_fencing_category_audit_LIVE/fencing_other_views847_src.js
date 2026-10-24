/* Author: Andrew Fisher. Read-only qualifiers for legacy programme views and drafts.
 * Native programme and financial calculations stay unchanged. Unknown CCB
 * allocations must not become a green progress verdict or a definite shortfall.
 */
function fenceCcbDisplaySummary847(P) {
  const day = P && P.asOf || todayIso();
  const rows = typeof docketsAsOf === 'function' ? docketsAsOf(day)
    : allDockets().filter(d => !d.date || d.date <= day);
  return fenceCcbSummary847(rows.filter(d => d.usable));
}
function fenceCcbDisplayTypes847(P) {
  const pending = fenceCcbDisplaySummary847(P).pendingCount > 0;
  return fenceTypes(P).map(row => pending && ['ccb_event','ccb_demarc'].includes(row.key)
    ? {...row, ccbPending:true, plannedRecorded:row.planned, planned:null, name:row.name + ' · category needs review'} : row);
}
function fenceCcbDisplayLines847(P) {
  const pending = fenceCcbDisplaySummary847(P).pendingCount > 0;
  return (P.fenceLines || []).map(row => pending && ['ccb_event','ccb_demarc'].includes(row.column)
    ? {...row, ccbPending:true, behind:null} : row);
}
function fenceCcbDisplayWords847(P) {
  const summary = fenceCcbDisplaySummary847(P);
  return summary.pendingCount ? 'CCB categories need review: ' + fmtNum(summary.pendingMetres) + ' m across ' + summary.pendingCount + ' dockets. Recorded column allocations are not confirmed subtype completion or plan position.' : '';
}
