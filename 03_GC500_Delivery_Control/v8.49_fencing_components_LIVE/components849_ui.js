/* Author: Andrew Fisher. Component evidence and a separate, unsaved planning guide. */
const FENCE_COMPONENTS_VIEW849 = {forms:new Map(), folds:new Map(), bound:new WeakSet()};
function fenceComponentsEscape849(value) {
  return String(value == null ? '' : value).replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
}
function fenceComponentsUrl849(value, page) {
  if (typeof value !== 'string' || /[\u0000-\u001f\u007f]/.test(value)) return null;
  try {
    const url = new URL(value.trim(), typeof location !== 'undefined' ? location.href : 'https://gc500.invalid/');
    if (!value.trim() || !/^https?:$/.test(url.protocol) || url.username || url.password) return null;
    if (Number.isSafeInteger(page) && page > 0) url.hash = 'page=' + page;
    return url.href;
  } catch (_) { return null; }
}
function fenceComponentLinks849(row, suppliedCache) {
  const cache = suppliedCache || {books:new Map(), links:new Map()}, cacheKey = JSON.stringify([row.book || 'red',row.recordId || '',row.papers || []]);
  if (cache.links.has(cacheKey)) return cache.links.get(cacheKey);
  const esc = fenceComponentsEscape849, links = [], seen = new Set();
  const add = (label, url, page) => {
    const safe = fenceComponentsUrl849(url, page);
    if (!safe || seen.has(safe)) return;
    seen.add(safe); links.push('<a href="' + esc(safe) + '" target="_blank" rel="noopener noreferrer">' + esc(label) + '</a>');
  };
  let record = null;
  try {
    const book = row.book === 'blue' ? 'blue' : 'red';
    if (!cache.books.has(book)) cache.books.set(book, book === 'blue' ? typeof collectionRows === 'function' ? collectionRows() : [] : typeof allDockets === 'function' ? allDockets() : []);
    const records = cache.books.get(book);
    const matches = records.filter(item => String(item.id || '') === row.recordId);
    if (matches.length === 1) record = matches[0];
  } catch (_) {}
  if (record) {
    try {
      const review = typeof fenceReviewContext836 === 'function' ? fenceReviewContext836(record) : null;
      if (review?.paper?.result?.state === 'ready') add('Original docket', review.paper.result.url);
      if (review?.state === 'current' && review.po && review.summarySource && typeof photoFor === 'function') {
        const paper = photoFor({id:review.summarySource.id});
        if (paper.state === 'ready') add('P/O ' + review.po.number + ' · supplier summary', paper.url);
      }
    } catch (_) {}
    try {
      const pointers = [...(typeof docketPapersOf === 'function' ? docketPapersOf(record.id) : []), ...(typeof docketPapersByName === 'function' ? docketPapersByName(record) : [])];
      for (const pointer of pointers) {
        const paper = typeof photoFor === 'function' ? photoFor(pointer) : null;
        if (paper?.state === 'ready') add(paper.file?.title || paper.file?.name || 'Attached paper', paper.url, pointer.reviewedPage);
      }
    } catch (_) {}
  }
  for (const pointer of row.papers || []) {
    try {
      const paper = typeof photoFor === 'function' ? photoFor(pointer) : null;
      if (paper?.state === 'ready') add((paper.file?.title || paper.file?.name || 'Reviewed paper') + (Number.isSafeInteger(pointer.page) ? ' · page ' + pointer.page : ''), paper.url, pointer.page);
    } catch (_) {}
  }
  const action = '<button type="button" data-fc849-record="' + esc(row.recordId || '') + '" data-fc849-book="' + esc(row.book || 'red') + '">' + (record ? 'Open record' : 'Open Fencing') + '</button>';
  const html = '<div class="fc849-links">' + action + links.join('') + '</div>';
  cache.links.set(cacheKey, html); return html;
}
function fenceComponentGuideOutput849(values) {
  const esc = fenceComponentsEscape849, input = {};
  for (const key of ['length','panels','panelWidth','gatePanels','gateOpenings','fixedRuns','endGateOpenings','openLineEnds','corners']) {
    const value = String(values[key] == null ? '' : values[key]).trim();
    if (value !== '') input[key] = Number(value);
  }
  input.layout = values.layout; input.braced = !!values.braced; input.ownHingeFeet = !!values.ownHingeFeet;
  const guide = typeof fenceGuide849 === 'function' ? fenceGuide849(input) : {state:'invalid', issues:['Planning guide is unavailable.']};
  if (guide.state === 'invalid') return '<p class="fc849-note" data-fc849-guide-state="invalid">' + esc((guide.issues || []).join(' ')) + '</p>';
  const format = value => value?.quantity != null ? value.quantity.toLocaleString('en-AU') : value?.min != null && value?.max != null ? value.min.toLocaleString('en-AU') + '–' + value.max.toLocaleString('en-AU') : 'Not established';
  const definitions = [['panels','Total panels'],['fixedPanels','Fixed panels'],['lineFeet','Line feet / blocks'],['fixedClamps','Fixed-joint clamps'],['hingeClamps','Gate hinge clamps'],['stays','Braces / stays'],['stayFeet','Stay feet / ballast']];
  const rows = definitions.map(([key, label]) => '<tr><th scope="row">' + esc(label) + '</th><td data-label="Guide allowance" title="' + esc(guide.quantities?.[key]?.basis || '') + '">' + esc(format(guide.quantities?.[key])) + '</td><td data-label="5% spares">' + (guide.spares?.[key] ? esc(format(guide.spares[key])) : '—') + '</td></tr>').join('');
  return '<div data-fc849-guide-state="' + esc(guide.state) + '"><p class="fc849-note"><strong>Planning allowance only · each.</strong> Spares are separate. Nothing here is saved or added to recorded totals.</p><table class="fc849-guide-table"><caption class="fc849-sr">Separate planning quantities and spare stock</caption><thead><tr><th scope="col">Item</th><th scope="col">Guide allowance</th><th scope="col">5% spares</th></tr></thead><tbody>' + rows + '</tbody></table>' + (guide.issues?.length ? '<p class="fc849-note">' + esc(guide.issues.join(' ')) + '</p>' : '') + '<ul class="fc849-assumptions">' + (guide.assumptions || []).map(note => '<li>' + esc(note) + '</li>').join('') + '</ul></div>';
}
function captureFenceComponents849(scope) {
  const active = document.activeElement, form = active?.closest?.('[data-fc849-guide]'), section = form?.closest('[data-fc849-scope]');
  if (!active?.name || !section || section.dataset.fc849Scope !== scope) return null;
  for (const fold of section.querySelectorAll('[data-fc849-fold]')) FENCE_COMPONENTS_VIEW849.folds.set(scope + ':' + fold.dataset.fc849Fold, fold.open);
  const main = section.closest('main');
  return {scope, name:active.name, top:main?.scrollTop || 0, left:main?.scrollLeft || 0, x:window.scrollX, y:window.scrollY};
}
function restoreFenceComponents849(saved) {
  if (!saved) return;
  const section = [...document.querySelectorAll('[data-fc849-scope]')].find(node => node.dataset.fc849Scope === saved.scope);
  const field = [...(section?.querySelectorAll('[data-fc849-guide] [name]') || [])].find(node => node.name === saved.name);
  if (!field || field.disabled) return;
  field.focus({preventScroll:true});
  section.closest('main')?.scrollTo({top:saved.top,left:saved.left,behavior:'instant'});
  window.scrollTo({top:saved.y,left:saved.x,behavior:'instant'});
}
function renderFenceComponents849(day, suppliedScope) {
  const esc = fenceComponentsEscape849, scope = String(suppliedScope || 'today').replace(/[^a-zA-Z0-9_-]/g, '-');
  const sourceCache = {books:new Map(), links:new Map()};
  const ledger = typeof fenceComponents849 === 'function' ? fenceComponents849(day) : {state:'unavailable', recorded:[], collections:[], rows:[], collectionRows:[], issues:['Component records are unavailable.']};
  const opened = key => FENCE_COMPONENTS_VIEW849.folds.get(scope + ':' + key) ? ' open' : '';
  const fold = (key, title, body, className) => '<details class="fc849-fold ' + (className || '') + '" data-fc849-fold="' + esc(key) + '"' + opened(key) + '><summary>' + title + '</summary><div class="fc849-fold-body">' + body + '</div></details>';
  const quantity = value => value == null ? 'Not recorded' : value.toLocaleString('en-AU');
  const sourceRows = (item, rows) => rows.filter(row => row.components?.[item.id] != null || row.missing?.includes(item.id) || row.invalid?.includes(item.id)).map(row => {
    const value = row.components?.[item.id], state = value != null ? quantity(value) + ' each' : row.invalid?.includes(item.id) ? 'Count needs review' : 'Not recorded';
    return '<li class="fc849-source"><div class="fc849-source-title"><strong>' + esc((row.book === 'blue' ? 'Collection ' : 'Docket ') + row.number) + '</strong><span>' + esc(state) + '</span></div><p class="fc849-note">' + esc([row.date, row.location].filter(Boolean).join(' · ')) + '</p>' + fenceComponentLinks849(row, sourceCache) + '</li>';
  }).join('');
  const readings = (items, rows, prefix) => '<div class="fc849-readings">' + items.map(item => {
    const coverage = [item.sourceRecordCount + ' record' + (item.sourceRecordCount === 1 ? '' : 's'), item.missingRecordCount ? item.missingRecordCount + ' unstated' : '', item.invalidRecordCount ? item.invalidRecordCount + ' to review' : ''].filter(Boolean).join(' · ');
    return fold(prefix + '-' + item.id, '<span class="fc849-reading-label">' + esc(item.label) + '</span><strong class="fc849-count" data-fc849-count="' + esc(prefix + '-' + item.id) + '">' + esc(quantity(item.quantity)) + (item.quantity == null ? '' : '<small> each</small>') + '</strong><span class="fc849-coverage">' + esc(coverage) + '</span><span class="fc849-reading-action">Sources <span aria-hidden="true">⌄</span></span>', '<ul class="fc849-sources">' + (sourceRows(item, rows) || '<li class="fc849-note">No applicable dated component record is available.</li>') + '</ul>', 'fc849-reading');
  }).join('') + '</div>';
  let audit = {issues:[], pending:[]};
  try { if (typeof fenceComponentEvidence849 === 'function') audit = fenceComponentEvidence849(day); } catch (_) { audit = {issues:[], pending:['Source reconciliation is unavailable.']}; }
  const issues = (audit.issues || []).map(issue => '<li class="fc849-source"><strong>' + esc(issue.title) + '</strong><p class="fc849-note">' + esc(issue.detail) + '</p>' + fenceComponentLinks849(issue, sourceCache) + '</li>');
  const notes = [...(ledger.issues || []), ...(audit.pending || []).map(item => typeof item === 'string' ? item : item.reason || item.detail || item.title || 'A source check is pending.')];
  const issueFold = issues.length || notes.length ? fold('reconcile', 'What needs reconciling' + (issues.length ? ' · ' + issues.length : ''), '<p class="fc849-note">Source differences are listed for review. They have not changed the recorded quantities, work totals or charges.</p>' + (issues.length ? '<ul class="fc849-sources">' + issues.join('') + '</ul>' : '') + (notes.length ? '<ul class="fc849-assumptions">' + notes.map(note => '<li>' + esc(note) + '</li>').join('') + '</ul>' : '')) : '';
  const defaults = {length:'', panels:'', panelWidth:'2.4', gatePanels:'0', gateOpenings:'0', layout:'straight', fixedRuns:'', endGateOpenings:'0', openLineEnds:'', corners:'0', braced:false, ownHingeFeet:false};
  const values = {...defaults, ...(FENCE_COMPONENTS_VIEW849.forms.get(scope) || {})};
  const numberInput = (key, label, step, placeholder) => '<label for="fc849-' + scope + '-' + key + '"><span>' + esc(label) + '</span><input id="fc849-' + scope + '-' + key + '" name="' + key + '" type="number" min="0" step="' + (step || '1') + '" inputmode="' + (step === 'any' ? 'decimal' : 'numeric') + '" value="' + esc(values[key]) + '"' + (placeholder ? ' placeholder="' + esc(placeholder) + '"' : '') + ' data-tw840-focus="fc849-' + scope + '-' + key + '"></label>';
  const planner = '<p class="fc849-note">Use the 2.4 m panel guide to fill planning gaps. These are hypothetical allowances; existing totals, Revenue and Direct costs remain unchanged.</p><form class="fc849-guide" data-fc849-guide data-ro autocomplete="off"><div class="fc849-inputs">' + numberInput('length','Fence line length · m','any','Enter length or panels') + numberInput('panels','Panels · overrides length','1','Optional') + numberInput('panelWidth','Panel width · m','any') + numberInput('gatePanels','Gate panels · leaves') + numberInput('gateOpenings','Gate openings') + '<label for="fc849-' + scope + '-layout"><span>Layout</span><select id="fc849-' + scope + '-layout" name="layout" data-tw840-focus="fc849-' + scope + '-layout">' + [['straight','Straight line'],['closed','Closed perimeter'],['unknown','Runs / layout uncertain']].map(([value,label]) => '<option value="' + value + '"' + (values.layout === value ? ' selected' : '') + '>' + label + '</option>').join('') + '</select></label>' + numberInput('fixedRuns','Fixed runs','1','Derived from layout') + numberInput('endGateOpenings','Gate openings at line ends') + numberInput('openLineEnds','Open line ends','1','Derived from layout') + numberInput('corners','Extra corner stays') + '</div><label class="fc849-check"><input type="checkbox" name="braced"' + (values.braced ? ' checked' : '') + '> Apply scrim bracing every second joint</label><label class="fc849-check"><input type="checkbox" name="ownHingeFeet"' + (values.ownHingeFeet ? ' checked' : '') + '> Each gate hinge has its own extra foot</label><div class="fc849-guide-output" data-fc849-guide-output aria-live="polite" aria-atomic="true">' + fenceComponentGuideOutput849(values) + '</div></form><p class="fc849-note">A gate’s free end has no foot. The usual hinge shares the adjoining fixed-panel foot. Stay feet / ballast are additional to line feet. Gate wheels do not establish the number of gate openings.</p><p class="fc849-note">Each open line end adds two stays under the supplied rule. For the 100 m example with two single gates, that is four end stays: 27 in the written guide, with up to 28 when each fixed run is rounded separately. Slopes and engineered bracing need their own allowance.</p>';
  return '<section class="fc849-components" data-fc849-scope="' + esc(scope) + '" data-fc849-state="' + esc(ledger.state) + '" aria-labelledby="fc849-' + scope + '-heading"><h4 id="fc849-' + scope + '-heading">What the dockets record</h4><p class="fc849-note">Gross component counts on dated Build + Event hire agreements' + (ledger.asOf ? ' through ' + esc(ledger.asOf) : '') + '. These count recorded activity, not current stock or confirmed installation. Missing counts stay unrecorded.</p>' + readings(ledger.recorded || [], ledger.rows || [], 'recorded') + '<p class="fc849-note">Braces / stays do not prove scrim is fitted. Component feet / blocks are separate from the charged fence-block work column.</p>' + fold('collections', 'Collections — separate activity', '<p class="fc849-note">Collection forms are shown separately. These counts are not subtracted from hire agreements to infer stock on site.</p>' + readings(ledger.collections || [], ledger.collectionRows || [], 'collected')) + issueFold + fold('guide', 'Planning guide — separate estimates', planner) + '</section>';
}
function bindFenceComponents849(root) {
  const host = root || document;
  if (!host?.addEventListener || FENCE_COMPONENTS_VIEW849.bound.has(host)) return;
  FENCE_COMPONENTS_VIEW849.bound.add(host);
  const update = event => {
    const form = event.target?.closest?.('[data-fc849-guide]'), section = form?.closest('[data-fc849-scope]');
    if (!form || !section || !host.contains(section)) return;
    const values = {};
    for (const field of form.querySelectorAll('input[name],select[name]')) values[field.name] = field.type === 'checkbox' ? field.checked : field.value;
    FENCE_COMPONENTS_VIEW849.forms.set(section.dataset.fc849Scope, values);
    const output = form.querySelector('[data-fc849-guide-output]');
    if (output) output.innerHTML = fenceComponentGuideOutput849(values);
  };
  host.addEventListener('input', update);
  host.addEventListener('change', update);
  host.addEventListener('submit', event => { if (event.target?.matches?.('[data-fc849-guide]')) event.preventDefault(); });
  host.addEventListener('toggle', event => {
    const fold = event.target, section = fold?.closest?.('[data-fc849-scope]');
    if (fold?.hasAttribute?.('data-fc849-fold') && section && host.contains(section)) FENCE_COMPONENTS_VIEW849.folds.set(section.dataset.fc849Scope + ':' + fold.dataset.fc849Fold, fold.open);
  }, true);
  host.addEventListener('click', event => {
    const button = event.target?.closest?.('[data-fc849-record]');
    if (!button || !host.contains(button)) return;
    event.preventDefault();
    try {
      const records = button.dataset.fc849Book === 'blue' ? collectionRows() : allDockets();
      const matches = records.filter(record => String(record.id || '') === button.dataset.fc849Record);
      if (matches.length === 1 && typeof window !== 'undefined' && window.GC500FencingTrace837?.key && typeof window.gc500FencingTraceDocket837 === 'function') {
        const key = window.GC500FencingTrace837.key(matches[0]);
        if (key && window.gc500FencingTraceDocket837(key)) return;
      }
    } catch (_) {}
    if (typeof go === 'function') go('fencing');
  });
}
