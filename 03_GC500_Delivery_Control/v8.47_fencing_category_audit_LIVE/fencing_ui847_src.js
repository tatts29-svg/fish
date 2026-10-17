/* Author: Andrew Fisher. Qualify CCB allocations without changing charges or records. */
function fenceCcbBadge847(d) {
  const review = fenceCcbReview847(d);
  if (review.state === 'not-applicable') return '';
  return '<span class="fp-review-state ' + (review.state === 'confirmed' ? '' : 'fp-review-query') + '" data-tw847-classification="' + review.state + '">' + (review.state === 'confirmed' ? 'CCB category confirmed' : 'CCB category needs review') + '</span>';
}
function fenceCcbDetail847(d) {
  const review = fenceCcbReview847(d);
  if (review.state === 'not-applicable') return '';
  return '<div class="fp-review-detail" data-tw847-category-detail><p><b>' + (review.state === 'confirmed' ? 'CCB category confirmed.' : 'CCB category needs review.') + '</b> ' + esc(review.reason) + '</p>' + (review.state === 'confirmed' ? '' : '<p>The recorded metres remain included. The current Event or Demarcation allocation is not confirmed completion or proof of the applicable customer rate.</p>') + '</div>';
}
function fenceCcbOverview847() {
  const rows = allDockets().filter(d => d.usable), summary = fenceCcbSummary847(rows);
  if (!summary.rows.length) return '';
  return '<p class="fp-book-note" data-tw847-category-overview><b>Crowd-control barriers (CCB)</b> are separate from temporary fence. Event and Demarcation are usage categories; Event does not mean all fencing for the race.' + (summary.pendingCount ? ' <b>' + esc(fmtQty(summary.pendingMetres, 'm')) + '</b> across ' + summary.pendingCount + (summary.pendingCount === 1 ? ' docket needs' : ' dockets need') + ' category review. Their metres stay in the recorded total; category completion and remaining quantities are unconfirmed.' : ' Current CCB category reviews are confirmed.') + '</p>';
}
function fenceCcbWeekLine847(line, week) {
  const key = line.column || line.key;
  if (!['ccb_event','ccb_demarc'].includes(key)) return line;
  const summary = fenceCcbSummary847(allDockets().filter(d => d.usable && d.week === week && (d.scope || 'programme') === 'programme'));
  return summary.pendingCount ? {...line, remaining:null, ccbPending:true} : line;
}
