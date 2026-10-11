/* Author: Andrew Fisher. Programme quantities are a record comparison, not a crew-delay verdict. */
function fencingReview994() {
 const confirmation = {date:'2026-10-12', by:'Andrew Fisher', words:'They are not behind in their works'};
 return {confirmation, asOf:todayIso(), rows:fenceCcbDisplayTypes847(progressAsOf(todayIso()))};
}
function fencingComparisonHtml994() {
 const review = fencingReview994();
 const quantities = review.rows.map(row => '<tr><th scope="row">' + esc(row.name) + '</th><td>' +
  (row.planned == null ? 'Unconfirmed' : esc(fmtNum(row.planned))) + '</td><td>' + esc(fmtNum(row.done)) +
  '</td><td>' + esc(row.unit) + '</td></tr>').join('');
 const body = '<p>Andrew Fisher confirmed on 12 Oct 2026: “They are not behind in their works”.</p>' +
  '<p>Programme quantities and docketed work do not establish a crew delay. Docket matching, changed scope and task completion remain separate.</p>' +
  '<div class="tblwrap"><table class="cwpt fencing994-comparison"><caption>Programme and docket comparison · ' + esc(fmtDate(review.asOf)) +
  '</caption><thead><tr><th scope="col">Work type</th><th scope="col">Programme by this day</th><th scope="col">Docketed</th><th scope="col">Unit</th></tr></thead><tbody>' + quantities + '</tbody></table></div>' +
  '<p class="sub">The four pillars, on this job. They only work together — a green Operations column on the back of an unpriced Financials one is not a job going well.</p>';
 return moreInfo('fencing994-record-comparison', body);
}
