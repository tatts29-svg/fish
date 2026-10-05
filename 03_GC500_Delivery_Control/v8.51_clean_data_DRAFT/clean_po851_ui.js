/* Author: Andrew Fisher. Supplier source quantities alongside unchanged programme readings. */
function renderFencePoEvidence850(day, suppliedScope) {
  const esc = fenceComponentsEscape849, scope = String(suppliedScope || 'today').replace(/[^a-zA-Z0-9_-]/g, '-');
  const key = 'po-quantities', cache = {books:new Map(), links:new Map()};
  let evidence;
  try {
    evidence = typeof fencePoGateEvidence850 === 'function' ? fencePoGateEvidence850(day) : null;
  } catch (_) { evidence = null; }
  if (!evidence) evidence = {state:'unavailable', accepted:[], conflicts:[], pending:[], issues:['Supplier quantity evidence is unavailable.']};
  const count = value => Number.isSafeInteger(value) && value >= 0 ? value.toLocaleString('en-AU') : 'Not confirmed';
  const accepted = Array.isArray(evidence.accepted) ? evidence.accepted : [], conflicts = Array.isArray(evidence.conflicts) ? evidence.conflicts : [];
  const matched = accepted.map(row => '<li class="fc849-source" data-fc850-matched="' + esc(row.id) + '"><div class="fc849-source-title"><strong>' + esc('Docket ' + row.number) + '</strong><span data-fc850-source-quantity>' + esc(count(row.quantity)) + ' supplier units</span></div><p class="fc849-note">' + esc([row.date, row.poNumber ? 'P/O ' + row.poNumber : ''].filter(Boolean).join(' · ')) + '</p>' + fencePresentationFold851(scope, 'po-row-' + row.id, 'More', '<p class="fc849-note">' + esc(row.detail) + '</p>' + (Number.isSafeInteger(row.nativeGateQuantity) && row.nativeGateQuantity > 0 ? '<p class="fc849-note">The recorded gate work column has ' + esc(count(row.nativeGateQuantity)) + ' each on this docket. The supplier quantity is supporting evidence.</p>' : '')) + fenceComponentLinks849(row, cache) + '</li>').join('');
  const differences = conflicts.map(row => '<li class="fc849-source" data-fc850-conflict="' + esc(row.id) + '"><div class="fc849-source-title"><strong>' + esc('Docket ' + row.number) + '</strong><span>' + esc(count(row.supplierQuantity)) + ' supplier units · ' + esc(count(row.originalWheels)) + ' wheels on original</span></div>' + (row.date ? '<p class="fc849-note">' + esc(row.date) + '</p>' : '') + fencePresentationFold851(scope, 'po-row-' + row.id, 'More', '<p class="fc849-note">' + esc(row.reason) + '</p>') + fenceComponentLinks849(row, cache) + '</li>').join('');
  const quantityLine = '<p class="fc849-note"><strong data-fc850-accepted-total>' + esc(count(evidence.acceptedQuantity)) + '</strong> matched supplier gate units across <strong>' + accepted.length + '</strong> docket' + (accepted.length === 1 ? '' : 's') + '.</p>';
  const unitLine = evidence.unitAsWritten ? '<p class="fc849-note"><strong>Supplier unit as written:</strong> ' + esc(evidence.unitAsWritten) + '.</p>' : '';
  const limit = '<p class="fc849-note">The supplier units have no confirmed conversion to planned gate openings. They do not change programme totals, recorded work, percentages, Revenue or Direct costs.</p>';
  const unit = evidence.unitEvidence;
  let programme = '';
  if (unit?.state === 'ready') {
    const links = [];
    for (const pointer of unit.papers || []) {
      try {
        const paper = typeof photoFor === 'function' ? photoFor(pointer) : null;
        const url = paper?.state === 'ready' ? fenceComponentsUrl849(paper.url, pointer.page) : null;
        if (url) links.push('<a href="' + esc(url) + '" target="_blank" rel="noopener noreferrer">Open original programme' + (Number.isSafeInteger(pointer.page) ? ' · page ' + pointer.page : '') + '</a>');
      } catch (_) {}
    }
    programme = '<div class="fc849-source" data-fc850-unit-evidence><strong>Programme gate unit evidence</strong><p class="fc849-note">' + esc([unit.row, count(unit.vehicleGates) + ' planned vehicle gate' + (unit.vehicleGates === 1 ? '' : 's')].filter(Boolean).join(' · ')) + '</p><p class="fc849-note">Source note: “' + esc(unit.noteAsWritten) + '”</p><p class="fc849-note">' + esc(unit.conclusion) + '</p>' + (links.length ? '<div class="fc849-links">' + links.join('') + '</div>' : '<p class="fc849-note">The original programme link is unavailable.</p>') + '</div>';
  } else {
    programme = '<p class="fc849-note" data-fc850-unit-evidence-pending>The original programme unit evidence is not currently verified. No conversion to programme gates is applied.</p>';
  }
  const notes = [...(evidence.issues || []), ...(evidence.pending || []).map(row => row.reason || 'A supplier source check is pending.')];
  const pending = notes.length ? '<ul class="fc849-assumptions" data-fc850-pending>' + [...new Set(notes)].map(note => '<li>' + esc(note) + '</li>').join('') + '</ul>' : '';
  const acceptedBody = matched ? '<p class="fc849-note"><strong>Matched quantities</strong></p><ul class="fc849-sources">' + matched + '</ul>' : '<p class="fc849-note">No verified matching supplier entries are available for this date.</p>';
  const conflictBody = differences ? '<p class="fc849-note"><strong data-fc850-conflict-total>' + esc(count(evidence.conflictQuantity)) + '</strong> supplier units across <strong>' + conflicts.length + '</strong> docket' + (conflicts.length === 1 ? '' : 's') + ' remain outside the matched total because the original counts differ.</p><ul class="fc849-sources">' + differences + '</ul>' : '';
  const opened = FENCE_COMPONENTS_VIEW849.folds.get(scope + ':' + key) ? ' open' : '';
  return '<details class="fc849-fold" data-fc849-fold="' + key + '" data-fc850-evidence data-fc850-state="' + esc(evidence.state) + '"' + opened + '><summary data-tw840-focus="fc850-' + esc(scope) + '-po-quantities">P/O quantities matched to dockets</summary><div class="fc849-fold-body">' + quantityLine + fencePresentationFold851(scope, 'po-unit-notes', 'Units & source notes', unitLine + limit + programme) + pending + acceptedBody + conflictBody + '</div></details>';
}
