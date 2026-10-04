/* Author: Andrew Fisher. Linked completion and remaining work, v8.46. */
var TodayWork840 = (() => {
  'use strict';
  const boardId = 'gc500-work-board840', dialogId = 'gc500-work-dialog840';
  const iconPaths = {
    buildings: 'M3 21V7L12 3L21 7V21M2 21H22M7 10H10V13H7ZM14 10H17V13H14ZM9 21V16H15V21',
    toilets: 'M5 21V4H19V21ZM8 2H16M8 8H16M9 12V18H15V12ZM2 21H22',
    fencing: 'M3 22V3M21 22V3M3 5H21M3 19H21M7 5V19M12 5V19M17 5V19M3 10H21M3 15H21',
    generators: 'M3 7H21V19H3ZM6 7V4H12V7M6 11H10M6 14H10M15 10L12 15H16L14 18M5 19V22M19 19V22',
    lighting: 'M12 7V21M6 22L12 18L18 22M3 3H9V7H3ZM15 3H21V7H15ZM9 5H15M12 10L5 14M12 10L19 14',
    equipment: 'M2 17H15V20H2ZM4 17V7H12L15 17M6 10H11M18 4V20H22M3 21A2 2 0 1 0 7 21M10 21A2 2 0 1 0 14 21'
  };
  const escape = value => String(value == null ? '' : value).replace(/[&<>"']/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
  const number = value => typeof value === 'number' && Number.isFinite(value);
  const format = value => number(value) ? value.toLocaleString('en-AU', {maximumFractionDigits: 2}) : '—';
  const icon = (id, path) => '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="' + (path || iconPaths[id] || iconPaths.equipment) + '"/></svg>';
  const arrow = '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M3 8H13M9 4L13 8L9 12"/></svg>';
  const textOf = item => typeof item === 'string' ? item : item && (item.message || item.label || item.reason || item.detail) || '';
  let areas = [], fencing = null, groupDetails = null, workSummary = null, typeMetrics = null, installed = false, selected = null, running = null, printing = false, observer = null;
  let motionMode = 'auto';
  let runningInstrument = null;
  let healthTimer = 0, healthKey = '', renderedDay = null;
  let observed = [], dialog = null, detail = null, returnFocus = null, returnScroll = null, skipReturn = false;
  const groupFolds = new Map();
  let printFolds = null, printScroll = null;
  let linkedReturn = null, linkedActions = new Map();
  const mq = typeof matchMedia === 'function' ? matchMedia('(prefers-reduced-motion: reduce)') : null;

  function percentage(value, kind) {
    if (!number(value)) return '—';
    const bounded = Math.max(0, Math.min(100, value));
    return format(kind === 'lower-bound' ? Math.floor((bounded + 1e-9) * 100) / 100 : bounded);
  }
  function digits(value, id, caption, kind) {
    const known = number(value), lower = kind === 'lower-bound', reading = percentage(value, kind);
    return '<span class="tw840-sr">' + (known ? (lower ? 'At least ' : '') + reading + '% ' + escape(caption || 'confirmed complete') : 'Completion percentage unavailable') + '</span><span class="tw840-reading" data-tw842-pct-kind="' + escape(kind || 'unknown') + '" aria-hidden="true">' + (known && lower ? '<span class="tw842-bound">≥</span>' : '') + '<span>' + reading + '</span>' + (known ? '<small>%</small>' : '') + '</span>';
  }
  function noteFor(area) {
    if (area.loading) return 'Loading the shared completion record.';
    if (area.health && !area.health.ready) return area.health.basis;
    const issues = (area.issues || []).map(textOf).filter(Boolean);
    if (issues.length) return issues[0];
    if (area.id === 'fencing') return number(area.remaining) && area.remaining > 0 ? format(area.remaining) + ' m of the clean-fence Build programme remains to be recorded.' : number(area.remaining) ? 'Recorded clean work meets the programme quantity; physical fence completion is not inferred.' : 'Remaining clean-fence programme quantity is unconfirmed.';
    const remaining = (area.rows || []).filter(row => !row.complete);
    if (!remaining.length) return 'All work in this recorded scope is marked complete.';
    return remaining.slice(0, 2).map(row => row.label || row.name || row.key || row.detail).filter(Boolean).join(' · ') + (remaining.length > 2 ? ' · +' + (remaining.length - 2) + ' more' : '');
  }
  function countButton(area, mode) {
    const summary = workSummary?.byId?.[area.id] || {}, value = area.loading ? null : summary[mode === 'total' ? 'total' : mode === 'done' ? 'done' : 'left'];
    const label = mode === 'total' ? 'Total' : mode === 'done' ? 'Done' : 'Left';
    const meaning = mode === 'total' ? 'in scope' : mode === 'done' ? 'confirmed complete' : 'not confirmed complete, including any records needing review';
    return '<button type="button" data-tw840-detail="' + escape(area.id) + '" data-tw840-mode="' + mode + '" data-tw840-focus="' + escape(area.id + '-' + mode) + '" aria-label="' + escape(area.name + ': ' + format(value) + ' ' + area.unit + ' ' + meaning + '. Review details.') + '"><span>' + label + '</span><strong data-tw842-quantity="' + mode + '">' + format(value) + '</strong><span class="tw840-count-link">Review ' + arrow + '</span></button>';
  }
  function planPanel(plan, id) {
    if (!plan) return '';
    const early = number(plan.early) && plan.early > 0 ? '<p class="tw842-plan-early">' + format(plan.early) + ' future-due references already on site, counted separately.</p>' : '';
    const partial = (plan.undatedRefs || []).length ? '<p class="tw842-plan-partial">' + format(plan.undatedRefs.length) + ' references have unconfirmed arrival dates; this comparison is partial.</p>' : '';
    return '<section class="tw842-plan" data-tw842-plan="' + escape(id) + '" data-status="' + escape(plan.status || 'unknown') + '"><div class="tw842-plan-head"><h4>On-site plan · ' + escape(planDate()) + '</h4><strong>' + escape(plan.label || 'Plan position unconfirmed') + '</strong></div><dl><div><dt>References due</dt><dd>' + format(plan.planned) + '</dd></div><div><dt>' + escape(plan.actualLabel || 'Due references on site') + '</dt><dd>' + format(plan.actual) + '</dd></div></dl>' + early + partial + '<p class="tw842-plan-basis">Scheduled arrivals; completion is separate.</p><div class="tw842-plan-actions"><details class="tw842-plan-detail" data-tw842-plan-fold="' + escape(id) + '"' + (groupFolds.get('plan:' + id) || printing ? ' open' : '') + '><summary data-tw840-focus="' + escape(id + '-plan-fold') + '">Plan basis</summary><div><p>' + escape(plan.basis) + '</p>' + groupNotes(plan.issues) + '</div></details>' + groupDestination({tab:'timeline'}, 'Open Timeline', id + '-plan-destination') + '</div></section>';
  }
  function planDate() {
    const day = workSummary?.asOf || renderedDay;
    return /^\d{4}-\d{2}-\d{2}$/.test(day || '') ? new Date(day + 'T00:00:00Z').toLocaleDateString('en-AU', {day:'numeric', month:'short', year:'numeric', timeZone:'UTC'}) : 'selected day';
  }
  function typesReady() { return !!(typeMetrics?.health?.ready && typeMetrics?.coverage?.ready && typeMetrics.coverage.allRepresented); }
  let lampUid846 = 0;
  function raceLights846(pct, kind) {
    const complete = kind === 'confirmed' && number(pct) && pct === 100;
    const reached = complete ? 5 : number(pct) ? Math.min(4, Math.floor(Math.max(0, pct) / 20)) : 0;
    return '<div class="tw846-lights race-lights" role="img" aria-label="' + escape(number(pct) ? (kind === 'lower-bound' ? 'At least ' : '') + percentage(pct, kind) + '% confirmed complete. ' + (complete ? 'All five lights green. Finished.' : 'Red lights show reached completion milestones.') : 'Completion percentage unconfirmed.') + '">' + Array.from({length:5}, (_, i) => {
      let lamp = timeline841Lamp(i < reached, i, complete);
      if (i < reached) {
        const id = 'tw846-sweep-' + (++lampUid846), dots = lamp.match(/<g class="tl841-dots">([\s\S]*?)<\/g>/)[1];
        lamp = lamp.replace('style="', 'style="--race-phase:' + i * .25 + 's;').replace('</defs>', '<clipPath id="' + id + '" clipPathUnits="userSpaceOnUse"><rect class="race-sweep-window" x="-14" y="7" width="11" height="42"/></clipPath></defs>').replace('</svg>', '<g class="race-sweep-dots" clip-path="url(#' + id + ')">' + dots + '</g></svg>');
      }
      return '<span class="tl841-unit' + (i < reached ? ' reached' : '') + '">' + lamp + '<small>' + (i + 1) * 20 + '%</small></span>';
    }).join('') + '</div>';
  }
  function typeCount(item, mode) {
    const meaning = mode === 'done' ? 'confirmed complete' : mode === 'left' ? 'not confirmed complete' : 'in scope';
    return '<button type="button" class="tw846-qty" data-tw843-type-detail="' + escape(item.id) + '" data-tw843-type-mode="' + mode + '" data-tw843-quantity="' + mode + '" data-tw840-focus="' + escape('type-' + item.id + '-' + mode) + '" aria-label="' + escape(item.name + ': ' + format(item[mode]) + ' ' + item.unit + ' ' + meaning + '. Review this type.') + '"><strong>' + format(item[mode]) + '</strong></button>';
  }
  function typeInstrument(item) {
    const known = number(item.pct), review = number(item.reviewQuantity) && item.reviewQuantity > 0 ? format(item.reviewQuantity) + ' ' + item.unit + ' need review; included in Left.' : '';
    const percent = known ? (item.pctKind === 'lower-bound' ? '≥ ' : '') + percentage(item.pct, item.pctKind) + '% confirmed complete' : 'Completion percentage unconfirmed';
    return '<tr class="tw846-type-row" data-tw843-type-id="' + escape(item.id) + '" data-tw843-kind="asset-type"><th scope="row"><button type="button" class="tw846-type-name" data-tw843-type-detail="' + escape(item.id) + '" data-tw843-type-mode="total" data-tw840-focus="' + escape('type-' + item.id + '-indicator') + '">' + escape(item.name) + '</button><span class="tw846-row-note" data-pct-kind="' + escape(item.pctKind) + '">' + escape(percent) + ' · ' + escape(item.unit) + '</span>' + (review ? '<span class="tw846-row-note tw843-type-review">' + escape(review) + '</span>' : '') + (item.scopeNote ? '<span class="tw846-row-note tw843-type-scope">' + escape(item.scopeNote) + '</span>' : '') + '</th>' + ['total','done','left'].map(mode => '<td data-label="' + (mode === 'total' ? 'Total' : mode === 'done' ? 'Done' : 'Left') + '">' + typeCount(item, mode) + '</td>').join('') + '</tr>';
  }
  function typeInstruments(area) {
    if (!typesReady()) return '<p class="tw843-type-pending">' + escape(typeMetrics?.health?.loading ? 'Loading individual type records.' : 'Type detail remains in the group disclosure while its coverage is checked.') + '</p>';
    const items = (typeMetrics.byCard?.[area.id] || []).filter(item => item.kind === 'asset-type');
    if (!items.length) return '';
    const families = new Map();
    items.forEach(item => { if (!families.has(item.groupId)) families.set(item.groupId, {name:item.groupName, items:[]}); families.get(item.groupId).items.push(item); });
    return '<section class="tw846-types"><h4>Every type in this group</h4><table class="tw846-table"><caption class="tw840-sr">' + escape(area.name) + ': total, confirmed done and left by type. Open any count for references, locations and available photos.</caption><thead><tr><th scope="col">Type</th><th scope="col">Total</th><th scope="col">Done</th><th scope="col">Left</th></tr></thead>' + [...families].map(([id, family]) => '<tbody data-tw843-family="' + escape(id) + '">' + (families.size > 1 || area.id === 'equipment' ? '<tr class="tw846-family-row"><th colspan="4">' + escape(family.name) + '</th></tr>' : '') + family.items.map(typeInstrument).join('') + '</tbody>').join('') + '</table></section>';
  }
  function fencingRows() {
    const rows = fencing?.summaryRows || [];
    const plannedRows = rows.filter(row => row.kind !== 'recorded-only'), behind = plannedRows.filter(row => row.plan?.status === 'behind' && !row.plan.provisional).length, provisional = plannedRows.filter(row => row.plan?.provisional).length, unknown = plannedRows.filter(row => !row.plan || row.plan.status === 'unknown').length;
    const overview = fencing?.loading ? 'Loading Build programme' : behind + ' work type' + (behind === 1 ? '' : 's') + ' confirmed behind' + (provisional ? ' · ' + provisional + ' dates need review' : '') + (unknown ? ' · ' + unknown + ' unconfirmed' : '');
    return '<p class="tw842-fence-overview" data-tw842-fence-overview><span>Build plan · ' + escape(planDate()) + '</span><strong>' + escape(overview) + '</strong></p><table class="tw846-table tw846-fence-table"><caption class="tw840-sr">Fencing Build work by type. Each row has its own unit and percentage.</caption><thead><tr><th scope="col">Work type</th><th scope="col">Total</th><th scope="col">Recorded</th><th scope="col">Left</th></tr></thead><tbody>' + rows.map(row => {
      const instrument = typesReady() ? (typeMetrics.byCard?.fencing || []).find(item => item.fenceId === row.id) : null;
      const percent = number(row.pct) ? row.total > 0 && row.done > row.total ? '100% + extra work' : percentage(row.pct, row.pctKind) + '% recorded' : row.loading ? 'Loading programme' : row.kind === 'recorded-only' ? 'Recorded work only' : row.total === 0 ? 'No programme quantity' : 'Programme quantity unconfirmed';
      const plan = row.plan || {}, status = plan.label || 'Plan position unconfirmed';
      const hook = ' data-tw840-fence-detail="' + escape(row.id) + '"';
      return '<tr class="tw846-type-row"' + (instrument ? ' data-tw843-type-id="' + escape(instrument.id) + '" data-tw843-kind="fence-work"' : '') + ' data-tw840-fence-row="' + escape(row.id) + '"><th scope="row"><button type="button" class="tw846-type-name"' + hook + ' data-tw840-focus="fence-' + escape(row.id) + '">' + escape(row.label) + '</button><span class="tw846-row-note tw841-fence-percent" data-known="' + String(number(row.pct)) + '">' + escape(percent) + ' · ' + escape(row.unit) + '</span><span class="tw846-row-note tw842-fence-plan" data-tw842-fence-plan="' + escape(row.id) + '" data-status="' + escape(plan.status || 'unknown') + '" data-provisional="' + String(!!plan.provisional) + '">' + escape(status) + (plan.provisional ? ' · source date check required' : '') + '</span></th>' + ['total','done','left'].map(mode => '<td data-label="' + (mode === 'total' ? 'Total' : mode === 'done' ? 'Recorded' : 'Left') + '"><button type="button" class="tw846-qty"' + hook + ' data-tw842-fence-value="' + mode + '" data-tw840-focus="fence-' + escape(row.id) + '-' + mode + '" aria-label="' + escape(row.label + ': ' + format(row[mode]) + ' ' + row.unit + ' ' + (mode === 'done' ? 'recorded' : mode) + '. Review basis.') + '"><strong>' + format(row[mode]) + '</strong></button></td>').join('') + '</tr>';
    }).join('') + '</tbody></table><p class="tw841-fence-note">Each type has its own Build total and plan. Metres, gates and hours stay separate. Recorded work is not unique standing fence length.</p><button type="button" class="tw841-fence-source" data-tw840-detail="fencing" data-tw840-mode="done" data-tw840-focus="fencing-done">Review clean-fence dockets ' + arrow + '</button>';
  }
  function rememberFolds() {
    if (printing) return;
    board()?.querySelectorAll('[data-tw841-group-card],[data-tw842-plan-fold]').forEach(node => groupFolds.set(foldKey(node), node.open));
  }
  function foldKey(node) { return node.dataset.tw841GroupCard || 'plan:' + node.dataset.tw842PlanFold; }
  function groupNotes(values) {
    const notes = [...new Set((values || []).map(textOf).filter(Boolean))];
    return notes.length ? '<ul class="tw841-group-notes">' + notes.map(note => '<li>' + escape(note) + '</li>').join('') + '</ul>' : '';
  }
  function groupReading(label, value, unit, key) {
    return '<div' + (key ? ' data-tw841-value="' + escape(key) + '"' : '') + '><dt>' + escape(label) + '</dt><dd>' + format(value) + (unit ? '<small>' + escape(unit) + '</small>' : '') + '</dd></div>';
  }
  function groupFacts(facts) {
    return (facts || []).length ? '<dl class="tw841-group-facts">' + facts.map(fact => '<div data-tw841-fact="' + escape(fact.label) + '"><dt>' + escape(fact.label) + '</dt><dd>' + format(fact.value) + (number(fact.total) ? ' / ' + format(fact.total) : '') + (fact.unit ? ' ' + escape(fact.unit) : '') + '</dd>' + (fact.note ? '<p>' + escape(fact.note) + '</p>' : '') + '</div>').join('') + '</dl>' : '';
  }
  function groupDestination(destination, label, token) {
    if (!destination?.tab) return '';
    return '<button type="button" class="tw841-group-link" data-tw840-destination="' + escape(destination.tab) + '" data-tw840-group="' + escape(destination.group || '') + '" data-tw840-focus="' + escape(token) + '">' + escape(label) + ' ' + arrow + '</button>';
  }
  function onSitePercentage(group) {
    const summary = group.summary || {}, types = group.types || [];
    const known = types.length > 0 && types.every(type => type.quantityKnown) && number(summary.onSite) && summary.onSite >= 0 && number(summary.total) && summary.total > 0;
    return known ? format(summary.onSite / summary.total * 100) + '% on site' : 'On-site percentage unconfirmed';
  }
  function groupSection(group, id, showAggregate) {
    const summary = group.summary || {}, token = id + '-group-' + group.id;
    const types = typesReady() ? '' : (group.types || []).map(type => {
      const known = type.quantityKnown && type.completionKnown && number(type.total) && type.total > 0 && number(type.complete);
      const percentage = known ? format(Math.min(100, type.complete / type.total * 100)) + '% complete' : 'Completion percentage unconfirmed';
      return '<section class="tw841-type" data-tw841-type="' + escape(type.name) + '"><h5>' + escape(type.name) + '</h5><p class="tw841-type-unit">' + escape(type.unit) + '</p><p class="tw841-type-percent" data-known="' + String(!!known) + '">' + escape(percentage) + '</p><dl class="tw841-type-values">' + groupReading('Total', type.total, '', 'total') + groupReading('On site', type.onSite, '', 'onSite') + groupReading('Complete', type.complete, '', 'complete') + groupReading('Left to complete', type.remaining, '', 'remaining') + '</dl>' + groupNotes(type.issues) + '</section>';
    }).join('');
    const exclusions = (group.excluded || []).length ? '<div class="tw841-exclusions"><h5>Outside the order total</h5>' + group.excluded.map(row => '<p><button type="button" class="tw841-group-reference" data-tw840-reference="' + escape(row.key) + '" data-tw840-focus="' + escape(token + '-excluded-' + row.key) + '">' + escape(row.key) + '</button> ' + escape(row.name) + ' · ' + escape(row.reason) + '</p>').join('') + '</div>' : '';
    return '<section class="tw841-native-group" data-tw841-group-id="' + escape(group.id) + '"><h4>' + escape(group.name) + '</h4>' + (showAggregate ? '<p class="tw841-onsite"><strong>' + format(summary.onSite) + '</strong> on site / ' + format(summary.total) + ' ' + escape(group.unit) + ' · ' + escape(onSitePercentage(group)) + '</p>' : '') + types + '<h5 class="tw841-subheading">Schedule position</h5><dl class="tw841-type-values tw841-schedule-values">' + groupReading('Due by selected day', summary.due, group.unit, 'due') + groupReading('Overdue', summary.overdue, group.unit, 'overdue') + groupReading('Next' + (number(summary.nextDays) ? ' ' + format(summary.nextDays) + ' days' : ''), summary.next, group.unit, 'next') + groupReading('No delivery record', summary.noRecord, group.unit, 'noRecord') + '</dl>' + groupFacts(group.facts) + groupNotes([...(group.notes || []), ...(group.issues || [])]) + exclusions + groupDestination(group.drilldown, 'Open Equipment · ' + group.name, token + '-destination') + '</section>';
  }
  function groupMoney(card) {
    const currency = value => number(value) ? value.toLocaleString('en-AU', {style:'currency', currency:'AUD', maximumFractionDigits:2}) : 'Not yet priced';
    const rows = (card.money || []).map(row => '<section class="tw841-money" data-tw841-money="' + escape(row.id) + '" data-tw841-money-kind="' + escape(row.kind) + '"><h5>' + escape(row.label) + '</h5><p class="tw841-money-amount">' + currency(row.amount) + '</p>' + (number(row.lines) || number(row.unrated) ? '<p class="tw841-money-counts">' + [number(row.lines) ? format(row.lines) + ' lines or notes' : '', number(row.unrated) ? format(row.unrated) + ' without a recorded rate' : ''].filter(Boolean).join(' · ') + '</p>' : '') + '<p>' + escape(row.basis) + '</p>' + groupDestination(row.drilldown, row.drilldown?.tab === 'fencing' ? 'Open Fencing costs' : 'Open Costs', card.id + '-money-' + row.id) + '</section>').join('');
    const comparisons = (card.comparisons || []).map(row => '<section class="tw841-comparison" data-tw841-comparison="' + escape(row.id) + '"><h5>' + escape(row.group) + '</h5><dl class="tw841-group-facts"><div><dt>Hire estimate</dt><dd>' + currency(row.hire) + '</dd></div><div><dt>Transport estimate</dt><dd>' + currency(row.transport) + '</dd></div></dl><p>' + (number(row.refs) ? format(row.refs) + ' references. ' : '') + escape(row.basis) + '</p>' + groupDestination(row.drilldown, 'Open Pricing', card.id + '-comparison-' + row.id) + '</section>').join('');
    return (rows ? '<section class="tw841-financial"><h4>Revenue and Direct costs</h4><p class="tw841-group-note">Current cumulative records · ex GST. Financial figures do not replay to the selected day.</p>' + rows + '</section>' : '') + (comparisons ? '<section class="tw841-financial"><h4>Card estimates · comparison only</h4>' + comparisons + '</section>' : '');
  }
  function programmeDetails(card) {
    if (!(card.programmeRows || []).length) return '';
    return '<section class="tw841-programme"><h4>Whole 2026 programme · including Demob</h4>' + card.programmeRows.map(row => '<section class="tw841-type" data-tw841-programme-row="' + escape(row.id || row.fullName || row.name) + '"><h5>' + escape(row.fullName || row.name) + '</h5><dl class="tw841-type-values">' + groupReading('Whole programme', row.total, row.unit, 'total') + groupReading('Planned by selected day', row.planned, row.unit, 'planned') + groupReading('Work recorded', row.recorded, row.unit, 'recorded') + groupReading('Left to record', row.remaining, row.unit, 'remaining') + '</dl><p class="tw841-programme-gap">' + (number(row.planned) ? format(row.behind) + ' ' + escape(row.unit) + ' behind the selected-day plan' : 'Selected-day planned quantity unconfirmed') + '</p><p>' + escape(row.basis) + '</p></section>').join('') + groupDestination(card.drilldown, 'Open full Fencing programme', 'fencing-programme-destination') + '</section>';
  }
  function groupFold(area) {
    const card = groupDetails?.[area.id]; if (!card) return '';
    const groups = card.groups || [], one = groups.length === 1 ? groups[0] : null;
    const subtitle = !card.health?.ready ? card.health?.basis || 'Loading group records' : area.id === 'fencing' ? 'Whole programme, areas and costs' : one ? format(one.summary.onSite) + ' / ' + format(one.summary.total) + ' ' + one.unit + ' on site · ' + onSitePercentage(one) : groups.length ? format(groups.length) + ' equipment groups · separate quantities' : 'Recorded quantities and financial scope';
    return '<details class="tw841-group-details" data-tw841-group-card="' + escape(area.id) + '"' + (groupFolds.get(area.id) || printing ? ' open' : '') + '><summary data-tw840-focus="' + escape(area.id + '-group-fold') + '"><span>' + (typesReady() ? 'Source, schedule and costs' : 'By type and costs') + '</span><small>' + escape(subtitle) + '</small></summary><div class="tw841-group-content"><p class="tw841-group-note">' + escape(card.basis) + '</p>' + groups.map(group => groupSection(group, area.id, groups.length !== 1)).join('') + programmeDetails(card) + groupFacts(card.facts) + groupMoney(card) + groupNotes([...(card.notes || []), ...(card.issues || [])]) + '</div></details>';
  }
  function card(area) {
    const fence = area.id === 'fencing', summary = workSummary?.byId?.[area.id] || {}, pct = area.loading ? null : summary.pct;
    const complete = summary.pctKind === 'confirmed' && pct === 100;
    const scope = fence ? 'Build programme · separate work types' : area.unit + ' · confirmed completion';
    const healthLabel = area.loading ? 'Loading' : area.health && !area.health.ready ? 'Record unavailable' : area.health?.stale ? 'Last received' : 'Shared record';
    const caption = area.loading ? 'Loading record' : complete ? 'Finished · confirmed complete' : number(pct) ? summary.pctLabel || 'Confirmed complete' : 'Percentage unconfirmed';
    const review = number(summary.reviewQuantity) && summary.reviewQuantity > 0 ? format(summary.reviewQuantity) + ' ' + area.unit + ' need review and remain in Left.' : number(summary.unquantifiedRefs) && summary.unquantifiedRefs > 0 ? format(summary.unquantifiedRefs) + ' references have unconfirmed quantities.' : '';
    const countsNote = 'Done = confirmed Complete records. Left = not yet confirmed.' + (review ? ' ' + review : '');
    const title = '<h3 class="tw846-title" tabindex="-1" data-tw840-focus="' + escape(area.id + '-heading') + '">' + escape(area.name) + '</h3>';
    const body = fence ? '<div class="tw846-fence-title">' + title + '<p>Every work type · its own total and percentage</p></div>' + fencingRows() : '<div class="tw846-summary"><section class="tw846-display" data-complete="' + String(complete) + '" data-known="' + String(number(pct)) + '">' + raceLights846(pct, summary.pctKind) + title + '<button type="button" class="tw840-display tw846-indicator" data-tw844-indicator data-tw840-detail="' + escape(area.id) + '" data-tw840-mode="total" data-tw840-focus="' + escape(area.id + '-indicator') + '" aria-label="' + escape(area.name + ': open total scope and completion details') + '"><span class="tw840-percent">' + digits(pct, area.id, 'confirmed complete', summary.pctKind) + '</span><span class="tw840-caption">' + escape(caption) + '</span></button></section><div class="tw846-counts tw840-counts">' + countButton(area, 'total') + countButton(area, 'done') + countButton(area, 'left') + '</div></div><p class="tw842-counts-note">' + escape(countsNote) + '</p>' + planPanel(summary.plan, area.id);
    return '<article class="tw840-card tw846-card' + (fence ? ' tw841-fence-card' : '') + '" id="tw840-card-' + escape(area.id) + '" data-tw840-area="' + escape(area.id) + '"><header class="tw840-top"><div class="tw840-name">' + icon(area.id) + '<p class="tw840-scope">' + escape(fence ? 'Recorded Build work' : area.scope) + '</p></div><button type="button" class="tw840-motion" data-tw840-motion="' + escape(area.id) + '" data-tw840-focus="' + escape(area.id + '-motion') + '"' + (fence ? ' hidden' : '') + ' aria-pressed="false" aria-label="Play ' + escape(area.name) + ' display animation" title="Display animation only">' + icon('', 'M8 5L19 12L8 19Z') + '<span>Play</span></button></header>' + body + typeInstruments(area) + groupFold(area) + '<footer class="tw840-footer"><span>' + escape(scope) + '</span><span>' + escape(healthLabel) + '</span></footer></article>';
  }
  function build(asOf) {
    rememberFolds();
    areas = todayWorkMetrics840(asOf);
    fencing = todayFencingSummary841(asOf);
    groupDetails = todayGroupDetails841(asOf, areas);
    workSummary = todayWorkSummary842(asOf, areas, groupDetails, fencing);
    typeMetrics = todayTypeMetrics843(asOf, groupDetails, workSummary);
    fencing = {...fencing, summaryRows:workSummary.fencingRows};
    renderedDay = asOf; healthKey = JSON.stringify({work:areas.health || {}, groups:groupDetails.health || {}});
    const merged = groupDetails.__coverage?.ready && groupDetails.__coverage.allRepresented && areas.every(area => groupDetails[area.id]);
    const dayLabel = /^\d{4}-\d{2}-\d{2}$/.test(asOf || '') ? new Date(asOf + 'T00:00:00Z').toLocaleDateString('en-AU', {day:'numeric', month:'short', year:'numeric', timeZone:'UTC'}) : '';
    return '<section id="' + boardId + '" data-tw841-groups-merged="' + String(!!merged) + '" data-tw843-types-merged="' + String(typesReady()) + '" aria-labelledby="tw840-title"><div class="tw840-heading"><div><h2 id="tw840-title">Work progress</h2><p>Completed and remaining' + (dayLabel ? ' · ' + escape(dayLabel) : '') + '</p></div><span>Open a count or explore by type and costs</span></div><nav class="tw840-nav" aria-label="Work categories">' + areas.map(area => '<button type="button" data-tw840-jump="' + escape(area.id) + '" data-tw840-focus="' + escape(area.id + '-jump') + '">' + icon(area.id) + escape(area.name) + '</button>').join('') + '</nav><div class="tw840-grid">' + areas.map(card).join('') + '</div><p class="tw840-basis">Completion uses the recorded work status for each category. On site, delivery, levelling and steps remain separate readings. Open a count or type detail for its basis and any gaps.</p></section>';
  }
  function board() { return document.getElementById(boardId); }
  function pane() { return document.getElementById('pane-today'); }
  function motionOff() {
    if (mq && mq.matches || document.documentElement.dataset.motion === 'off') return true;
    try { return typeof window.motionOff === 'function' && window.motionOff(); } catch (_) { return false; }
  }
  function modalOpen() {
    if (document.getElementById('drawer')?.classList.contains('on')) return true;
    if (typeof timeline841ModalOpen === 'function') return timeline841ModalOpen();
    return [...document.querySelectorAll('dialog[open],[aria-modal="true"]')].some(node => {
      if (node.hidden || node.closest('[hidden],[aria-hidden="true"]')) return false;
      const style = getComputedStyle(node), rect = node.getBoundingClientRect();
      return style.display !== 'none' && style.visibility !== 'hidden' && rect.width > 0 && rect.height > 0 && rect.right > 0 && rect.left < innerWidth && rect.bottom > 0 && rect.top < innerHeight;
    });
  }
  function visibleMotionTarget(node) {
    const p = pane();
    if (!node || !node.isConnected || !p || p.hidden || document.hidden || printing || modalOpen() || getComputedStyle(p).display === 'none') return null;
    const main = p.closest('main');
    const clip = main ? main.getBoundingClientRect() : {top:0, left:0, bottom:innerHeight, right:innerWidth};
    const nav = board()?.querySelector('.tw840-nav')?.getBoundingClientRect();
    const top = Math.max(0, clip.top, nav && nav.bottom > clip.top && nav.top < clip.bottom ? nav.bottom : 0);
    const visibleBar = element => {
      if (!element) return false;
      const rect = element.getBoundingClientRect();
      return rect.width > 0 && rect.height > 0 && rect.bottom > top && rect.top < Math.min(innerHeight, clip.bottom) && rect.right > Math.max(0, clip.left) && rect.left < Math.min(innerWidth, clip.right);
    };
    const lights = node.querySelector('.tw846-lights');
    return visibleBar(lights) ? lights : null;
  }
  function visible(node) { return !!visibleMotionTarget(node); }
  function controls() {
    const root = board(); if (!root) return;
    runningInstrument = null;
    const off = motionOff();
    root.querySelectorAll('[data-tw840-area]').forEach(node => {
      const id = node.dataset.tw840Area, active = id === running;
      const target = active ? visibleMotionTarget(node) : null, type = target?.closest('[data-tw843-type-id]');
      node.classList.toggle('tw840-selected', id === selected);
      node.classList.toggle('tw840-running', active && !!target && !type);
      node.querySelectorAll('[data-tw843-type-id]').forEach(item => item.classList.toggle('tw843-running', active && item === type));
      if (active && target) runningInstrument = type ? {kind:'type',id:type.dataset.tw843TypeId,cardId:id} : {kind:'parent',id,cardId:id};
      const button = node.querySelector('[data-tw840-motion]'), name = areas.find(area => area.id === id)?.name || id;
      button.disabled = off;
      button.setAttribute('aria-pressed', String(active));
      button.setAttribute('aria-label', (active ? motionMode === 'auto' ? 'Pause automatic ' : 'Pause ' : 'Play ') + name + ' display animation');
      button.querySelector('span').textContent = off ? 'Off' : active ? motionMode === 'auto' ? 'Auto' : 'Pause' : 'Play';
      button.title = off ? 'Animation follows your reduced motion or Motion Off setting' : active ? (motionMode === 'auto' ? 'Automatic display animation · press to pause' : 'Display animation · press to pause') : 'Play display animation; figures stay unchanged';
      button.querySelector('path').setAttribute('d', active ? 'M7 5H10V19H7ZM14 5H17V19H14Z' : 'M8 5L19 12L8 19Z');
    });
  }
  function stop() { motionMode = 'paused'; running = null; controls(); }
  function checkMotion() {
    if (motionMode === 'paused' || motionOff() || document.hidden || printing || modalOpen() || window.TodayMotion820?.report().running) {
      running = null; controls(); return;
    }
    const nodes = [...(board()?.querySelectorAll('[data-tw840-area]') || [])];
    const chosen = nodes.find(node => node.dataset.tw840Area === selected && visible(node)) || nodes.find(visible);
    if (chosen) {
      if (selected !== chosen.dataset.tw840Area) motionMode = 'auto';
      selected = chosen.dataset.tw840Area; running = selected;
    } else running = null;
    controls();
  }
  function pauseNativeMotion() {
    const native = window.TodayMotion820?.report();
    if (native && native.running) pane()?.querySelector('[data-today-card="' + native.running + '"] .today-motion-button')?.click();
  }
  function toggleMotion(id) {
    if (running === id) { stop(); return; }
    selected = id; motionMode = 'selected';
    pauseNativeMotion(); checkMotion();
    if (running) document.dispatchEvent(new CustomEvent('todaymotionselection', {detail:{card:'work840-' + id, running:true}}));
  }
  function scrollSnapshot() {
    const main = pane()?.closest('main');
    return {main, top:main?.scrollTop || 0, left:main?.scrollLeft || 0, x:window.scrollX, y:window.scrollY};
  }
  function restoreScroll(saved) {
    if (!saved) return;
    if (saved.main?.isConnected) { saved.main.scrollTop = saved.top; saved.main.scrollLeft = saved.left; }
    if (window.scrollX !== saved.x || window.scrollY !== saved.y) window.scrollTo({left:saved.x, top:saved.y, behavior:'instant'});
  }
  let cancelPackedScroll = null;
  function restorePackedScroll(saved) {
    cancelPackedScroll?.();
    restoreScroll(saved);
    const main = saved?.main, root = board();
    if (!main?.isConnected || !root || Math.abs(main.scrollTop - saved.top) <= 1) return;
    // Native masonry briefly reduces the scroll range during a redraw. Restore
    // only that clamped position as its height settles; user input takes over.
    let frame = 0;
    const deadline = performance.now() + 500, hadModal = modalOpen();
    const events = ['wheel', 'touchstart', 'pointerdown', 'keydown', 'resize', 'hashchange'];
    const stop = () => {
      cancelAnimationFrame(frame);
      events.forEach(name => window.removeEventListener(name, stop, true));
      if (cancelPackedScroll === stop) cancelPackedScroll = null;
    };
    const tick = () => {
      if (performance.now() >= deadline || !main.isConnected || board() !== root || document.hidden || printing || modalOpen() !== hadModal || getComputedStyle(pane()).display === 'none') return stop();
      restoreScroll(saved);
      if (Math.abs(main.scrollTop - saved.top) <= 1 || performance.now() >= deadline) return stop();
      frame = requestAnimationFrame(tick);
    };
    cancelPackedScroll = stop;
    events.forEach(name => window.addEventListener(name, stop, {capture:true, passive:true}));
    frame = requestAnimationFrame(tick);
  }
  function focusToken(node, root) {
    if (!node || !root?.contains(node)) return null;
    if (node.dataset.tw840Focus) return {work:node.dataset.tw840Focus};
    if (node.id) return {id:node.id};
    const attrs = ['data-k','data-go','data-week-day','data-focus','data-advice','data-today-card','data-qa'];
    for (const name of attrs) if (node.hasAttribute(name)) return {attr:name, value:node.getAttribute(name), tag:node.tagName};
    const path = [];
    for (let part = node; part && part !== root; part = part.parentElement) path.unshift(Array.prototype.indexOf.call(part.parentElement.children, part));
    return {path, tag:node.tagName, text:node.textContent};
  }
  function resolveFocus(token, root) {
    if (!token || !root) return null;
    if (token.work) return [...root.querySelectorAll('[data-tw840-focus]')].find(node => node.dataset.tw840Focus === token.work);
    if (token.id) { const node = document.getElementById(token.id); return root.contains(node) ? node : null; }
    if (token.attr) return [...root.querySelectorAll('[' + token.attr + ']')].find(node => node.tagName === token.tag && node.getAttribute(token.attr) === token.value);
    const node = (token.path || []).reduce((part, index) => part?.children[index], root);
    return node?.tagName === token.tag && node.textContent === token.text ? node : null;
  }
  function capture() {
    rememberFolds();
    const p = pane();
    if (!p || !board() || getComputedStyle(p).display === 'none') return null;
    const active = document.activeElement;
    return {scroll:scrollSnapshot(), focus:focusToken(active, p), start:active?.selectionStart, end:active?.selectionEnd};
  }
  function scheduleHealth() {
    if (healthTimer) clearTimeout(healthTimer);
    healthTimer = 0;
    if (!board() || document.hidden || getComputedStyle(pane()).display === 'none') return;
    healthTimer = setTimeout(() => {
      healthTimer = 0;
      const health = {work:typeof todayWorkHealth840 === 'function' ? todayWorkHealth840() : areas.health,
        groups:typeof todayGroupHealth841 === 'function' ? todayGroupHealth841() : groupDetails?.health};
      if (JSON.stringify(health) !== healthKey && board()) {
        const saved = capture();
        // Readiness can also retire the native By group section beneath this board.
        if (typeof renderToday === 'function') renderToday();
        else board().outerHTML = build(renderedDay);
        restore(saved);
      } else scheduleHealth();
    }, areas.health?.ready && groupDetails?.health?.ready ? 2000 : 500);
  }
  function restore(saved) {
    mount();
    if (!saved) return;
    if (!dialog?.open) {
      const node = resolveFocus(saved.focus, pane());
      if (node) { node.focus({preventScroll:true}); if (saved.start != null && typeof node.setSelectionRange === 'function') node.setSelectionRange(saved.start, saved.end); }
    }
    restorePackedScroll(saved.scroll);
  }
  function linkedActionButton(action, label, token) {
    if (!action) return '';
    const key = encodeURIComponent(JSON.stringify(action)); linkedActions.set(key, action);
    return '<button type="button" data-tw844-source-action="' + escape(key) + '" data-tw840-focus="' + escape(token) + '">' + escape(label) + '</button>';
  }
  function linkedPhoto(photo) {
    const ready = photo.availability === 'ready', loading = ['loading','checking'].includes(photo.availability);
    const caption = photo.caption || 'Reference photograph';
    const picture = ready && photo.src ? '<img src="' + escape(photo.src) + '" alt="' + escape(caption) + '" loading="lazy" decoding="async" width="240" height="160">' : '<span class="tw844-photo-placeholder">' + (ready ? 'Photo available · open to view' : loading ? 'Checking photo availability' : photo.availability === 'unchecked' ? 'Availability could not be checked' : photo.availability === 'ambiguous' ? 'Photo identity needs review' : 'Photo unavailable') + '</span>';
    return '<figure data-tw844-photo="' + escape(photo.id) + '" data-tw844-photo-state="' + escape(photo.availability || 'unavailable') + '">' + (ready && photo.fullSrc ? '<a href="' + escape(photo.fullSrc) + '" target="_blank" rel="noopener noreferrer">' + picture + '</a>' : picture) + '<figcaption>' + escape(caption) + '</figcaption></figure>';
  }
  function linkedRows(rows, mode, unit, itemName, token) {
    const keys = [...new Set(rows.map(row => row.key).filter(Boolean))];
    const linked = todayLinkedReferences844(keys, {itemName:itemName || null, asOf:renderedDay});
    return (rows.length ? '' : '<p class="tw840-empty">No references match this view of the type.</p>') + '<p class="tw844-scope-day" data-tw844-selected-day="' + escape(renderedDay) + '">Breakdown for ' + escape(planDate()) + '. Destinations, photographs and shared status below are the current record.</p>' + rows.map(row => {
      if (!row.key) return '<div class="tw840-detail-row"><span>' + escape(row.label || row.name || 'Recorded work') + '</span><strong>' + format(mode === 'total' ? row.quantity : mode === 'done' ? row.done : row.remaining) + ' ' + escape(unit) + '</strong></div>';
      const entry = linked.rowsByKey?.[row.key] || (linked.rows || []).find(value => value.key === row.key) || {}, destination = entry.destination || {}, current = entry.current || {};
      const review = mode === 'left' && (row.conflict || row.recordedComplete && !row.complete);
      const left = row.left !== undefined ? row.left : review && !number(row.remaining) ? row.quantity : row.remaining;
      const value = mode === 'total' ? row.quantity : mode === 'done' ? row.done : left;
      const label = mode === 'total' ? 'in scope' : mode === 'done' ? 'confirmed complete' : 'not confirmed complete';
      const action = (kind, text) => '<button type="button" data-tw844-action="' + kind + '" data-tw844-key="' + escape(row.key) + '" data-tw840-focus="' + escape(token + '-' + row.key + '-' + kind) + '">' + text + '</button>';
      const ids = (entry.identifiers || []).map(identifier => '<li><strong>' + escape(identifier.value) + '</strong>' + (identifier.label ? ' · ' + escape(identifier.label) : '') + (identifier.itemName ? ' · ' + escape(identifier.itemName) : '') + '</li>').join('');
      const photos = (entry.photos || []).slice(0, 3);
      const photoAvailability = entry.photoState === 'loading' ? 'Checking reference photographs.' : entry.photoState === 'failed' ? 'Reference photographs could not be checked.' : entry.photoState === 'unavailable' ? 'Photo registry unavailable.' : 'No reference photographs recorded.';
      const photoContent = photos.length ? '<div class="tw844-photo-grid">' + photos.map(linkedPhoto).join('') + '</div><p class="tw844-photo-basis">Reference photographs; they do not identify which units remain.</p>' + (entry.photoState && entry.photoState !== 'ready' ? '<p>' + photoAvailability + '</p>' : '') : '<p>' + photoAvailability + '</p>';
      const available = entry.found !== false;
      return '<article class="tw844-linked-item" data-tw844-reference="' + escape(row.key) + '" data-tw843-detail-reference="' + escape(row.key) + '"><header><div><h3>' + escape(row.key) + '</h3><p>' + escape(row.label || row.name || entry.name || itemName) + '</p></div><div class="tw844-item-quantity"><strong data-tw844-quantity="' + mode + '">' + format(value) + '</strong><span>' + escape(unit) + ' ' + label + '</span>' + (review ? '<span class="tw842-review-label">Requiring review</span>' : '') + '</div></header>' + (row.status || row.detail ? '<p class="tw844-breakdown-status">' + escape([row.status, row.detail].filter(Boolean).join(' · ')) + '</p>' : '') + '<section class="tw844-current" data-tw844-current data-tw844-current-day="' + escape(linked.currentDay || '') + '"><h4>Current shared record' + (linked.currentDay ? ' · ' + escape(linked.currentDay) : '') + '</h4><strong>' + escape(current.label || (linked.loading ? 'Loading shared status' : 'Shared status unavailable')) + '</strong><p>' + escape(current.note || current.basis || '') + '</p></section><section class="tw844-destination" data-tw844-destination><h4>Planned destination</h4><strong>' + escape(destination.text || 'Destination not confirmed') + '</strong><p>' + escape([destination.label, destination.note].filter(Boolean).join(' · ')) + '</p></section>' + (ids ? '<details class="tw844-identifiers"><summary>Recorded identifiers · reference context</summary><ul>' + ids + '</ul><p>' + escape(entry.identifierBasis || 'These identify the reference record; they do not establish which individual units remain.') + '</p></details>' : '<p class="tw844-identifiers-note">Individual identifiers are not recorded for this scope. The quantity remains grouped under ' + escape(row.key) + '.</p>') + '<section class="tw844-photos"><h4>Reference photographs' + (number(entry.photoCount) && entry.photoCount > 0 ? ' · ' + format(entry.photoCount) : '') + '</h4>' + photoContent + '</section>' + groupNotes([...(row.issues || []), ...(entry.issues || [])]) + '<div class="tw844-item-actions">' + (available ? action('record', 'Open shared record') + (destination.hasMap && entry.actions?.mapKey ? action('map', 'Plan / map') : '') + action('photos', 'View photos') : '<p>This reference is no longer available in the current record.</p>') + '</div></article>';
    }).join('') + groupNotes(linked.issues);
  }
  function linkedSupplier() {
    const supplier = todayLinkedToiletSupplier844();
    return '<section class="tw844-supplier"><h3>Toilet supplier scope</h3><p>' + escape(supplier.basis) + '</p><div class="tw844-item-actions">' + linkedActionButton(supplier.action, supplier.label, 'toilet-supplier') + '</div></section>';
  }
  function linkedFenceDetails(id) {
    const linked = todayLinkedFencing844(id, renderedDay);
    const dockets = (linked.dockets || []).map(row => '<article class="tw844-linked-item" data-tw844-docket="' + escape(row.key) + '"><header><div><h3>Docket ' + escape(row.number || row.id) + '</h3><p>' + escape(row.date) + ' · ' + escape(row.location || 'Location not stated') + '</p></div><div class="tw844-item-quantity"><strong>' + format(row.quantity) + '</strong><span>' + escape(row.unit) + ' recorded</span></div></header><p>' + escape(row.mapNote) + '</p>' + (row.areaStatus?.done ? '<p>Named area signed off' + (row.areaStatus.by ? ' by ' + escape(row.areaStatus.by) : '') + (row.areaStatus.at ? ' · ' + escape(row.areaStatus.at) : '') + '. This is separate from the type quantity.</p>' : '') + '<div class="tw844-item-actions">' + linkedActionButton(row.recordAction, 'Open source record', 'fence-' + row.key + '-record') + (row.areas || []).map(area => linkedActionButton(area.action, 'Area map · ' + area.label, 'fence-' + row.key + '-area-' + area.id)).join('') + '</div>' + ((row.papers || []).length ? '<div class="tw844-photo-grid">' + row.papers.map(paper => linkedPhoto({id:paper.id, availability:paper.state, src:paper.thumb, fullSrc:paper.url, caption:'Source document · ' + paper.name})).join('') + '</div>' : '<p>' + (row.papersState === 'checking' ? 'Checking linked source documents.' : row.papersState === 'unchecked' ? 'Source document availability could not be checked.' : 'No linked source document is available.') + '</p>') + '</article>').join('');
    const plans = (linked.plannedLocations || []).map(row => '<article class="tw844-linked-item" data-tw844-planned-location="' + escape(row.id) + '"><header><div><h3>' + escape(row.location || 'Planned location not stated') + '</h3><p>' + escape(row.date || 'Date unconfirmed') + '</p></div><div class="tw844-item-quantity"><strong>' + format(row.quantity) + '</strong><span>' + escape(row.unit) + ' planned</span></div></header><p>' + escape(row.description) + '</p>' + (row.note ? '<p>' + escape(row.note) + '</p>' : '') + groupNotes([...(row.requirements || []).map(item => item.text), ...(row.conflicts || [])]) + '<div class="tw844-item-actions">' + linkedActionButton(row.sourceAction, 'Open programme source', 'fence-plan-' + row.id + '-source') + (row.mapIds || []).map((mapId, index) => linkedActionButton({kind:'fencing-map', id:mapId}, 'Plan / map' + (row.mapIds.length > 1 ? ' ' + (index + 1) : ''), 'fence-plan-' + row.id + '-map-' + index)).join('') + '</div></article>').join('');
    return '<section class="tw844-fence-evidence"><h3>Supporting records and planned areas</h3><p>' + escape(linked.basis) + '</p><p>' + escape(linked.qualifier) + '</p>' + groupNotes(linked.issues) + '<h4>Recorded work · ' + escape(planDate()) + '</h4>' + (dockets || '<p>' + (linked.state === 'loading' ? 'Loading supporting records.' : 'No matching recorded work is listed for this selected day.') + '</p>') + '<h4>Planned locations · source context</h4><p>These are programme locations, not a list of the areas left to complete.</p>' + (plans || '<p>No uniquely linked planned locations are available for this work type.</p>') + '</section>';
  }
  function detailHtml(area, mode) {
    const done = mode === 'done', total = mode === 'total', fence = area.id === 'fencing';
    const summary = !fence && workSummary?.byId?.[area.id] || {total:area.total, done:area.done, left:area.remaining, pct:area.pct, pctKind:'confirmed', basis:area.basis};
    const quantity = area.loading ? null : total ? summary.total : done ? summary.done : summary.left;
    const rows = (fence && !done ? [] : area.rows || []).filter(row => total || (done ? row.complete || number(row.done) && row.done > 0 : !row.complete || number(row.remaining) && row.remaining > 0));
    const destination = area.drilldown || {tab:fence ? 'fencing' : 'plant', group:null};
    const label = total ? 'total scope' : fence ? done ? 'work recorded' : 'left to record' : done ? 'confirmed complete' : 'not confirmed complete';
    const emptyMessage = area.health && !area.health.ready ? area.health.basis : area.loading ? 'Loading the shared record.' : !number(quantity) ? 'Quantity is unconfirmed. Review scope and records below.' : total ? 'No work is listed in this scope.' : done ? 'No completed work is recorded in this scope.' : fence ? 'Remaining programme quantity is not allocated to individual runs; physical completion is not inferred.' : 'No remaining work is listed in this recorded scope.';
    const notes = [...(area.issues || []), ...(area.notes || []), ...(summary.issues || []), area.health?.stale ? area.health.basis : ''].map(textOf).filter(Boolean);
    const pct = number(summary.pct) && !area.loading ? (summary.pctKind === 'lower-bound' ? '≥' : '') + percentage(summary.pct, summary.pctKind) + '<small>%</small>' : '—';
    return '<div class="tw840-dialog-top"><div><span class="tw840-kicker">RECORDED WORK BREAKDOWN</span><h2 id="tw840-dialog-title">' + escape(fence ? 'Clean fence' : area.name) + ' · ' + label + '</h2><p>' + format(quantity) + ' ' + escape(area.unit) + ' ' + label + (fence ? '' : ' · across ' + new Set(rows.map(row => row.key).filter(Boolean)).size + ' references') + '</p></div><button type="button" class="tw840-close" data-tw840-close data-tw840-focus="dialog-close" aria-label="Close work breakdown">×</button></div><div class="tw840-detail-summary"><strong>' + pct + '</strong><span>' + (number(summary.pct) ? fence ? 'clean work recorded' : summary.pctKind === 'lower-bound' ? 'at least confirmed complete' : 'confirmed complete' : 'percentage unconfirmed') + '<br>' + format(area.loading ? null : summary.done) + ' of ' + format(summary.total) + ' ' + escape(area.unit) + '</span></div><div class="tw840-detail-lines">' + (fence ? linkedFenceDetails('clean') : rows.length ? linkedRows(rows, mode, area.unit, null, area.id + '-' + mode) : '<p class="tw840-empty">' + escape(emptyMessage) + '</p>') + '</div><div class="tw840-definition"><h3>What the figure means</h3><p>' + escape(summary.basis || area.basis) + '</p>' + (notes.length ? '<ul>' + [...new Set(notes)].map(note => '<li>' + escape(note) + '</li>').join('') + '</ul>' : '') + '</div>' + (area.id === 'toilets' ? linkedSupplier() : '') + '<button type="button" class="tw840-destination" data-tw840-destination="' + escape(destination.tab) + '" data-tw840-group="' + escape(destination.group || '') + '" data-tw840-focus="dialog-destination">' + (fence ? 'Open Fencing' : 'Open Equipment · ' + escape(area.name)) + ' →</button>';
  }
  function fencingDetailHtml(row) {
    const notes = [row.note, ...(row.issues || []), ...(fencing?.issues || []), fencing?.health?.stale ? fencing.health.basis : ''].map(textOf).filter(Boolean), plan = row.plan || {};
    return '<div class="tw840-dialog-top"><div><span class="tw840-kicker">FENCING · RECORDED WORK</span><h2 id="tw840-dialog-title">' + escape(row.label) + '</h2><p>Build work quantities in ' + escape(row.unit) + '</p></div><button type="button" class="tw840-close" data-tw840-close data-tw840-focus="dialog-close" aria-label="Close work breakdown">×</button></div><dl class="tw841-fence-totals"><div><dt>Build total</dt><dd>' + format(row.total) + '<small>' + escape(row.unit) + '</small></dd></div><div><dt>Recorded work</dt><dd>' + format(row.done) + '<small>' + escape(row.unit) + '</small></dd></div><div><dt>Left to record</dt><dd>' + format(row.left) + '<small>' + escape(row.unit) + '</small></dd></div></dl><div class="tw840-definition"><h3>' + escape(plan.label || 'Plan position unconfirmed') + '</h3><p>' + format(plan.planned) + ' ' + escape(row.unit) + ' planned by the selected day; ' + format(plan.actual) + ' ' + escape(row.unit) + ' recorded.</p><p>' + escape(plan.basis) + '</p><h3>What the figures mean</h3><p>' + escape(fencing?.basis || '') + '</p>' + (notes.length ? '<ul>' + [...new Set(notes)].map(note => '<li>' + escape(note) + '</li>').join('') + '</ul>' : '') + '<p class="tw841-source-count">' + (number(row.recordCount) ? format(row.recordCount) + ' supporting work record' + (row.recordCount === 1 ? '' : 's') + '.' : '') + ' Source records remain available in Fencing.</p></div>' + linkedFenceDetails(row.id) + '<button type="button" class="tw840-destination" data-tw840-destination="fencing" data-tw840-focus="dialog-destination">Open Fencing →</button>';
  }
  function typeDetailHtml(item, mode) {
    const total = mode === 'total', done = mode === 'done', label = total ? 'total scope' : done ? 'confirmed complete' : 'not confirmed complete';
    const value = item[total ? 'total' : done ? 'done' : 'left'];
    const rows = (item.rows || []).filter(row => total || (done ? row.complete || number(row.done) && row.done > 0 : !row.complete || !number(row.left) || row.left > 0));
    const plan = item.plan || {}, notes = [...(item.issues || []), ...(plan.issues || [])].map(textOf).filter(Boolean);
    const rowHtml = linkedRows(rows, mode, item.unit, item.name, 'type-' + item.id + '-' + mode);
    const pct = number(item.pct) ? (item.pctKind === 'lower-bound' ? '≥' : '') + percentage(item.pct, item.pctKind) + '<small>%</small>' : '—';
    const sourceFacts = '<dl class="tw843-source-facts"><div><dt>Native schedule total</dt><dd>' + format(item.scheduleTotal) + ' ' + escape(item.unit) + '</dd></div><div><dt>Known physical quantity</dt><dd>' + format(item.knownTotal) + ' ' + escape(item.unit) + '</dd></div><div><dt>On site / on hire</dt><dd>' + format(item.onSite) + ' ' + escape(item.unit) + '</dd></div></dl><p>Schedule quantities retain the source reading, including any native fallback positions. They are not substituted for an unconfirmed physical total.</p>';
    return '<div class="tw840-dialog-top" data-tw843-detail-id="' + escape(item.id) + '" data-tw843-detail-mode="' + mode + '"><div><span class="tw840-kicker">' + escape(item.groupName) + ' · EXACT TYPE</span><h2 id="tw840-dialog-title">' + escape(item.name) + ' · ' + label + '</h2><p>' + format(value) + ' ' + escape(item.unit) + ' ' + label + ' · across ' + new Set(rows.map(row => row.key).filter(Boolean)).size + ' references</p></div><button type="button" class="tw840-close" data-tw840-close data-tw840-focus="dialog-close" aria-label="Close work breakdown">×</button></div><div class="tw840-detail-summary"><strong>' + pct + '</strong><span>' + escape(number(item.pct) ? item.pctLabel : 'Completion percentage unconfirmed') + '<br>' + format(item.done) + ' of ' + format(item.total) + ' ' + escape(item.unit) + '</span></div><div class="tw840-detail-lines">' + (rowHtml || '<p class="tw840-empty">No references match this view of the type.</p>') + '</div><div class="tw840-definition"><h3>What this type includes</h3><p>' + escape(item.basis) + '</p>' + (item.scopeNote ? '<p>' + escape(item.scopeNote) + '</p>' : '') + sourceFacts + '<h3>On-site plan · ' + escape(planDate()) + '</h3><p>' + escape(plan.label || 'Plan position unconfirmed') + '</p><p>' + format(plan.actual) + ' of ' + format(plan.planned) + ' due references have an arrival record.' + (number(plan.early) && plan.early > 0 ? ' ' + format(plan.early) + ' future-due references arrived early, counted separately.' : '') + '</p><p>' + escape(plan.basis) + '</p>' + groupNotes(notes) + '</div>' + (item.cardId === 'toilets' ? linkedSupplier() : '') + '<button type="button" class="tw840-destination" data-tw840-destination="' + escape(item.drilldown?.tab || 'plant') + '" data-tw840-group="' + escape(item.drilldown?.group || '') + '" data-tw840-focus="dialog-destination">Open Equipment · ' + escape(item.groupName) + ' →</button>';
  }
  function updateDialog() {
    if (!dialog?.open || !detail) return;
    const area = detail.type === 'asset-type' ? typesReady() && typeMetrics.instruments.find(item => item.id === detail.id) : detail.type === 'fence-type' ? fencing?.summaryRows.find(row => row.id === detail.id) : areas.find(item => item.id === detail.id);
    if (!area) { dialog.close(); return; }
    const content = detail.type === 'asset-type' ? typeDetailHtml(area, detail.mode) : detail.type === 'fence-type' ? fencingDetailHtml(area) : detailHtml(area, detail.mode);
    if (dialog.__tw840Content === content) return;
    const saved = focusToken(document.activeElement, dialog), top = dialog.scrollTop;
    dialog.innerHTML = content; dialog.__tw840Content = content;
    (resolveFocus(saved, dialog) || dialog.querySelector('[data-tw840-close]'))?.focus({preventScroll:true});
    dialog.scrollTop = top;
  }
  function showDetails(content, descriptor, mode) {
    running = null; controls(); pauseNativeMotion(); returnFocus = focusToken(document.activeElement, pane()); returnScroll = scrollSnapshot(); skipReturn = false;
    detail = descriptor; dialog.dataset.mode = mode || 'done';
    dialog.innerHTML = content; dialog.__tw840Content = dialog.innerHTML;
    dialog.showModal(); dialog.scrollTop = 0; dialog.querySelector('[data-tw840-close]')?.focus({preventScroll:true});
  }
  function openDetails(id, mode) {
    const area = areas.find(item => item.id === id); if (!area) return;
    showDetails(detailHtml(area, mode), {id, mode}, mode);
  }
  function openFencingDetails(id) {
    const row = fencing?.summaryRows.find(item => item.id === id); if (!row) return;
    showDetails(fencingDetailHtml(row), {id, type:'fence-type'}, 'done');
  }
  function openTypeDetails(id, mode) {
    const item = typesReady() && typeMetrics.instruments.find(row => row.id === id && row.kind === 'asset-type');
    if (!item) return;
    showDetails(typeDetailHtml(item, mode), {id, mode, type:'asset-type'}, mode);
  }
  function clearLinkedReturn() {
    linkedReturn = null;
    document.querySelectorAll('[data-tw844-return-strip]').forEach(node => node.remove());
  }
  function refreshLinkedReturn() {
    if (!linkedReturn) return;
    const drawer = document.getElementById('drawer');
    const activeTab = typeof state !== 'undefined' ? state.tab : '';
    const host = linkedReturn.destination === 'record' ? drawer?.classList.contains('on') && drawer.querySelector('.db') : activeTab === linkedReturn.destination && document.getElementById('pane-' + activeTab);
    if (!host) { clearLinkedReturn(); return; }
    document.querySelectorAll('[data-tw844-return-strip]').forEach(node => { if (node.parentElement !== host) node.remove(); });
    if (host.querySelector('[data-tw844-return-strip]')) return;
    const strip = document.createElement('div'); strip.className = 'tw844-return-strip'; strip.dataset.tw844ReturnStrip = '';
    strip.innerHTML = '<button type="button" data-tw844-return>← Back to ' + escape(linkedReturn.label) + ' breakdown</button>';
    host.prepend(strip);
  }
  function linkedReferenceAction(kind, key) {
    const asset = typeof assetOf === 'function' && assetOf(key);
    if (!asset || asset._cancelled) { if (typeof flash === 'function') flash('This reference is unavailable or cancelled. Reopen the breakdown to review its current scope.'); return; }
    leaveLinkedDetails({kind, key});
  }
  function leaveLinkedDetails(action) {
    if (!detail || !dialog?.open) return;
    if (action.kind === 'fencing-source') { window.gc500FencingMapSource?.(action.id, action.page); return; }
    const descriptor = {...detail};
    const item = descriptor.type === 'asset-type' ? typeMetrics?.instruments.find(row => row.id === descriptor.id) : areas.find(row => row.id === descriptor.id);
    clearLinkedReturn();
    linkedReturn = {descriptor, label:item?.name || 'work', focus:focusToken(document.activeElement, dialog), top:dialog.scrollTop, originFocus:returnFocus, originScroll:returnScroll, destination:action.kind === 'record' ? 'record' : action.kind === 'photos' ? 'docs' : action.kind === 'map' || action.kind === 'fencing-map' ? 'map' : action.kind === 'toilet-supplier' ? 'timeline' : 'fencing'};
    skipReturn = true; dialog.close();
    if (action.kind === 'record') openAsset(action.key);
    else if (action.kind === 'map') showOnMap(action.key);
    else if (action.kind === 'photos') { go('docs'); showRef815(action.key); }
    else if (action.kind === 'fencing-map') window.gc500OpenFencingMap?.(action.id);
    else if (action.kind === 'fencing-docket') { if (!window.gc500FencingTraceDocket837?.(action.key)) go('fencing'); }
    else if (action.kind === 'toilet-supplier') {
      go('timeline'); const journey = linkedReturn;
      requestAnimationFrame(() => {
        if (!journey || linkedReturn !== journey || typeof state === 'undefined' || state.tab !== 'timeline') return;
        const target = document.getElementById(action.anchor || 'ep819'), heading = document.getElementById(action.heading || 'ep819h'), main = target?.closest('main');
        if (target && main) main.scrollTo({top:main.scrollTop + target.getBoundingClientRect().top - main.getBoundingClientRect().top, behavior:'instant'});
        if (heading) { heading.setAttribute('tabindex', '-1'); heading.focus({preventScroll:true}); }
      });
    } else go('fencing');
    refreshLinkedReturn();
  }
  function reopenLinkedDetails() {
    const saved = linkedReturn; if (!saved) return;
    clearLinkedReturn();
    if (document.getElementById('drawer')?.classList.contains('on')) document.getElementById('dclose')?.click();
    if (typeof state !== 'undefined' && state.tab !== 'today') go('today');
    restorePackedScroll(saved.originScroll);
    const descriptor = saved.descriptor;
    if (descriptor.type === 'asset-type') openTypeDetails(descriptor.id, descriptor.mode);
    else if (descriptor.type === 'fence-type') openFencingDetails(descriptor.id);
    else openDetails(descriptor.id, descriptor.mode);
    if (!dialog?.open) { restoreScroll(saved.originScroll); return; }
    returnFocus = saved.originFocus; returnScroll = saved.originScroll;
    (resolveFocus(saved.focus, dialog) || dialog.querySelector('[data-tw840-close]'))?.focus({preventScroll:true});
    dialog.scrollTop = saved.top;
  }
  function jump(id) {
    const node = document.getElementById('tw840-card-' + id), main = pane()?.closest('main');
    if (!node) return;
    node.querySelector('h3')?.focus({preventScroll:true});
    const nav = board()?.querySelector('.tw840-nav'), inset = (nav?.getBoundingClientRect().height || 0) + 20;
    // A record refresh can interrupt a smooth scroll before it reaches this category.
    // Land once in the native scroll pane; subsequent refreshes preserve this position.
    if (main) main.scrollTo({top:main.scrollTop + node.getBoundingClientRect().top - main.getBoundingClientRect().top - inset, behavior:'instant'});
    else node.scrollIntoView({block:'start', behavior:'instant'});
  }
  function onClick(event) {
    const target = event.target instanceof Element ? event.target : null;
    if (!target) return;
    if (target.closest('[data-tw844-return]')) { event.preventDefault(); reopenLinkedDetails(); return; }
    if (linkedReturn && target.closest('a[href^="#"],[data-tab]')) clearLinkedReturn();
    if (target.closest('#' + boardId)) {
      const action = target.closest('[data-tw840-motion],[data-tw840-detail],[data-tw840-jump],[data-tw840-fence-detail],[data-tw840-destination],[data-tw840-reference],[data-tw843-type-detail]');
      if (!action) { const group = target.closest('[data-tw840-area]'); if (group && motionMode !== 'paused') { selected = group.dataset.tw840Area; checkMotion(); } return; }
      event.preventDefault();
      if (action.hasAttribute('data-tw840-motion')) toggleMotion(action.dataset.tw840Motion);
      else if (action.hasAttribute('data-tw840-jump')) jump(action.dataset.tw840Jump);
      else if (action.hasAttribute('data-tw840-fence-detail')) openFencingDetails(action.dataset.tw840FenceDetail);
      else if (action.hasAttribute('data-tw843-type-detail')) openTypeDetails(action.dataset.tw843TypeDetail, action.dataset.tw843TypeMode || 'total');
      else if (action.hasAttribute('data-tw840-reference')) openAsset(action.dataset.tw840Reference);
      else if (action.hasAttribute('data-tw840-destination')) navigate(action);
      else openDetails(action.dataset.tw840Detail, action.dataset.tw840Mode);
    } else if (target.closest('#' + dialogId)) {
      const action = target.closest('[data-tw840-close],[data-tw840-reference],[data-tw840-destination],[data-tw844-action],[data-tw844-source-action]');
      if (!action) return;
      event.preventDefault();
      if (action.hasAttribute('data-tw844-action')) linkedReferenceAction(action.dataset.tw844Action, action.dataset.tw844Key);
      else if (action.hasAttribute('data-tw844-source-action')) { const descriptor = linkedActions.get(action.dataset.tw844SourceAction); if (descriptor) leaveLinkedDetails(descriptor); }
      else if (action.hasAttribute('data-tw840-close')) dialog.close();
      else {
        skipReturn = true; dialog.close();
        if (action.hasAttribute('data-tw840-reference')) openAsset(action.dataset.tw840Reference);
        else navigate(action);
      }
    }
  }
  function navigate(action) {
    rememberFolds();
    if (typeof state !== 'undefined' && action.dataset.tw840Destination === 'plant') {
      state.plantGroup = action.dataset.tw840Group || null; state.light = null; state.q = '';
    }
    go(action.dataset.tw840Destination);
  }
  function install() {
    if (installed) return; installed = true;
    dialog = document.createElement('dialog'); dialog.id = dialogId;
    dialog.setAttribute('aria-labelledby', 'tw840-dialog-title'); document.body.appendChild(dialog);
    dialog.addEventListener('close', () => {
      if (!skipReturn) { resolveFocus(returnFocus, pane())?.focus({preventScroll:true}); restoreScroll(returnScroll); }
      detail = null; skipReturn = false; checkMotion();
    });
    dialog.addEventListener('click', event => { if (event.target !== dialog) return; const r = dialog.getBoundingClientRect(); if (event.clientX < r.left || event.clientX > r.right || event.clientY < r.top || event.clientY > r.bottom) dialog.close(); });
    document.addEventListener('click', onClick);
    document.addEventListener('toggle', event => {
      const node = event.target;
      if (!printing && node instanceof Element && node.matches('[data-tw841-group-card],[data-tw842-plan-fold]') && board()?.contains(node)) groupFolds.set(foldKey(node), node.open);
    }, true);
    document.addEventListener('todaymotionselection', event => { if (!String(event.detail?.card || '').startsWith('work840-')) { running = null; controls(); } });
    for (const name of ['visibilitychange','gc500motionchange']) document.addEventListener(name, () => { checkMotion(); scheduleHealth(); });
    for (const name of ['resize','hashchange']) window.addEventListener(name, checkMotion, {passive:true});
    window.addEventListener('scroll', checkMotion, {passive:true, capture:true});
    window.addEventListener('pagehide', () => { running = null; controls(); if (healthTimer) clearTimeout(healthTimer); healthTimer = 0; });
    window.addEventListener('beforeprint', () => {
      if (printing) return;
      rememberFolds(); printFolds = new Map(groupFolds); printScroll = scrollSnapshot();
      printing = true;
      board()?.querySelectorAll('[data-tw841-group-card],[data-tw842-plan-fold]').forEach(node => { node.open = true; });
      checkMotion();
    });
    window.addEventListener('afterprint', () => {
      if (!printing) return;
      board()?.querySelectorAll('[data-tw841-group-card],[data-tw842-plan-fold]').forEach(node => { node.open = printFolds?.get(foldKey(node)) || false; });
      printing = false; printFolds = null; restoreScroll(printScroll); printScroll = null; checkMotion();
    });
    window.addEventListener('pageshow', checkMotion);
    if (mq?.addEventListener) mq.addEventListener('change', checkMotion); else if (mq?.addListener) mq.addListener(checkMotion);
    const stateWatch = new MutationObserver(() => { checkMotion(); scheduleHealth(); });
    stateWatch.observe(document.documentElement, {attributes:true, attributeFilter:['data-motion']});
    if (pane()) stateWatch.observe(pane(), {attributes:true, attributeFilter:['class','style','hidden']});
    const modalSelector = 'dialog,[aria-modal="true"],#drawer';
    const hasModal = node => node.nodeType === 1 && (node.matches(modalSelector) || node.querySelector(modalSelector));
    new MutationObserver(records => {
      if (records.some(record => record.type === 'attributes' ? record.target.matches(modalSelector) : [...record.addedNodes, ...record.removedNodes].some(hasModal))) checkMotion();
      if (linkedReturn && records.some(record => record.type === 'childList' || record.target.matches('#drawer,[id^="pane-"]'))) refreshLinkedReturn();
    }).observe(document.body, {subtree:true, childList:true, attributes:true, attributeFilter:['hidden','aria-hidden','open','class','style']});
    if (typeof IntersectionObserver === 'function') observer = new IntersectionObserver(checkMotion, {threshold:0});
  }
  function mount() {
    install();
    observed.forEach(node => observer?.unobserve(node));
    observed = [...(board()?.querySelectorAll('[data-tw840-area]') || [])];
    observed.forEach(node => observer?.observe(node));
    if (selected && !areas.some(area => area.id === selected)) selected = null;
    checkMotion(); updateDialog(); scheduleHealth();
  }
  return {build, capture, restore, mount, stop, report:() => ({version:'v8.46', asOf:renderedDay, typesMerged:typesReady(), typeCount:typesReady() ? typeMetrics.instruments.length : 0, groupsMerged:board()?.dataset.tw841GroupsMerged === 'true', openGroups:[...(board()?.querySelectorAll('[data-tw841-group-card][open]') || [])].map(node => node.dataset.tw841GroupCard), mode:motionMode, selected, running, runningInstrument, cards:observed.length, dialog:dialog?.open || false, reduced:motionOff()})};
})();
function todayWorkBoard840(asOf) { return TodayWork840.build(asOf); }
