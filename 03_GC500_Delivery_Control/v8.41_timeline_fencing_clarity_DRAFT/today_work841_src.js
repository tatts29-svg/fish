/* Author: Andrew Fisher. Clear Today work instruments with visible-card motion, v8.41. */
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
  let areas = [], fencing = null, installed = false, selected = null, running = null, printing = false, observer = null;
  let motionMode = 'auto';
  let healthTimer = 0, healthKey = '', renderedDay = null;
  let observed = [], dialog = null, detail = null, returnFocus = null, returnScroll = null, skipReturn = false;
  const mq = typeof matchMedia === 'function' ? matchMedia('(prefers-reduced-motion: reduce)') : null;

  function digits(value, id, caption) {
    const known = number(value), reading = known ? String(Math.round(Math.max(0, Math.min(100, value)))) : '—';
    return '<span class="tw840-sr">' + (known ? reading + '% ' + escape(caption || 'recorded complete') : 'Completion percentage unavailable') + '</span><div class="tw840-reading" aria-hidden="true"><span>' + reading + '</span>' + (known ? '<small>%</small>' : '') + '</div>';
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
    const done = mode === 'done', value = area.loading ? null : done ? area.done : area.remaining;
    const label = area.id === 'fencing' ? (done ? 'Work recorded' : 'Left to record') : done ? 'Recorded complete' : 'Left to record complete';
    return '<button type="button" data-tw840-detail="' + escape(area.id) + '" data-tw840-mode="' + mode + '" data-tw840-focus="' + escape(area.id + '-' + mode) + '" aria-label="' + escape(area.name + ': ' + format(value) + ' ' + area.unit + ' ' + label.toLowerCase() + '. Review details.') + '"><span>' + label + '</span><strong>' + format(value) + (area.unit === 'm' ? '<small>m</small>' : '') + '</strong><span class="tw840-count-link">' + (done ? area.id === 'fencing' ? 'Review recorded' : 'Review complete' : 'See what’s left') + arrow + '</span></button>';
  }
  function fencingRows() {
    const rows = fencing?.summaryRows || [];
    return '<div class="tw841-fence-summary"><div class="tw841-fence-head" aria-hidden="true"><span>Work type</span><span>Recorded</span><span>Left to record</span></div>' + rows.map(row => {
      const reading = value => '<strong>' + format(value) + '</strong><small>' + escape(row.unit) + '</small>';
      return '<button type="button" class="tw841-fence-row" data-tw840-fence-row="' + escape(row.id) + '" data-tw840-fence-detail="' + escape(row.id) + '" data-tw840-focus="fence-' + escape(row.id) + '" aria-label="' + escape(row.label + ': ' + format(row.recorded) + ' ' + row.unit + ' recorded; ' + format(row.remaining) + ' ' + row.unit + ' left to record. Review basis.') + '"><span class="tw841-fence-label">' + escape(row.label) + '</span><span class="tw841-fence-value tw841-recorded">' + reading(row.recorded) + '</span><span class="tw841-fence-value tw841-remaining">' + reading(row.remaining) + '</span></button>';
    }).join('') + '</div><p class="tw841-fence-note">Separate work types and units. Open a row for its programme quantity and basis.</p><button type="button" class="tw841-fence-source" data-tw840-detail="fencing" data-tw840-mode="done" data-tw840-focus="fencing-done">Review clean-fence dockets ' + arrow + '</button>';
  }
  function card(area) {
    const fence = area.id === 'fencing', pct = area.loading ? null : area.pct;
    const lit = number(pct) ? Math.round(Math.max(0, Math.min(100, pct)) / 100 * 24) : 0;
    const scope = fence ? 'Build programme · separate work types' : number(area.total) ? format(area.total) + ' ' + area.unit + ' in scope' : 'Scope quantity unconfirmed';
    const healthLabel = area.loading ? 'Loading' : area.health && !area.health.ready ? 'Record unavailable' : area.health?.stale ? 'Last received' : 'Shared record';
    const body = fence ? fencingRows() : '<div class="tw840-display"><div class="tw840-leds" aria-hidden="true">' + Array.from({length:24}, (_, n) => '<i' + (n < lit ? ' class="lit"' : '') + '></i>').join('') + '</div><div class="tw840-percent">' + digits(pct, area.id, 'recorded complete') + '</div><p class="tw840-caption">' + (area.loading ? 'Loading record' : number(pct) ? 'Recorded complete' : 'Percentage unconfirmed') + '</p><div class="tw840-scale" aria-hidden="true"><span>0</span><span>50</span><span>100</span></div></div><div class="tw840-counts">' + countButton(area, 'done') + countButton(area, 'left') + '</div><div class="tw840-preview"><span>' + (area.issues && area.issues.length ? 'Record to review' : 'Remaining work') + '</span><p>' + escape(noteFor(area)) + '</p></div>';
    return '<article class="tw840-card' + (fence ? ' tw841-fence-card' : '') + '" id="tw840-card-' + escape(area.id) + '" data-tw840-area="' + escape(area.id) + '"><header class="tw840-top"><div class="tw840-name">' + icon(area.id) + '<h3 tabindex="-1" data-tw840-focus="' + escape(area.id + '-heading') + '">' + escape(area.name) + '</h3></div><button type="button" class="tw840-motion" data-tw840-motion="' + escape(area.id) + '" data-tw840-focus="' + escape(area.id + '-motion') + '" aria-pressed="false" aria-label="Play ' + escape(area.name) + ' display animation" title="Display animation only">' + icon('', 'M8 5L19 12L8 19Z') + '<span>Play</span></button></header><p class="tw840-scope">' + escape(fence ? 'Recorded work by type · Build programme' : area.scope) + '</p><div class="tw841-motion-track" aria-hidden="true"><i></i></div>' + body + '<footer class="tw840-footer"><span>' + escape(scope) + '</span><span>' + escape(healthLabel) + '</span></footer></article>';
  }
  function build(asOf) {
    areas = todayWorkMetrics840(asOf);
    fencing = todayFencingSummary841(asOf);
    renderedDay = asOf; healthKey = JSON.stringify(areas.health || {});
    return '<section id="' + boardId + '" aria-labelledby="tw840-title"><div class="tw840-heading"><div><h2 id="tw840-title">Work progress</h2><p>Completed and remaining</p></div><span>Open a count to see the work behind it</span></div><nav class="tw840-nav" aria-label="Work categories">' + areas.map(area => '<button type="button" data-tw840-jump="' + escape(area.id) + '" data-tw840-focus="' + escape(area.id + '-jump') + '">' + icon(area.id) + escape(area.name) + '</button>').join('') + '</nav><div class="tw840-grid">' + areas.map(card).join('') + '</div><p class="tw840-basis">Completion uses the recorded work status for each category. Delivery, levelling and steps remain separate records. Open a count for its basis and any gaps.</p></section>';
  }
  function board() { return document.getElementById(boardId); }
  function pane() { return document.getElementById('pane-today'); }
  function motionOff() {
    if (mq && mq.matches || document.documentElement.dataset.motion === 'off') return true;
    try { return typeof window.motionOff === 'function' && window.motionOff(); } catch (_) { return false; }
  }
  function visible(node) {
    const p = pane();
    if (!node || !node.isConnected || !p || p.hidden || document.hidden || printing || dialog && dialog.open || getComputedStyle(p).display === 'none') return false;
    // Use the visible decorative track, not a card footer, to choose the running instrument.
    const rect = (node.querySelector('.tw841-motion-track') || node).getBoundingClientRect(), main = p.closest('main');
    const clip = main ? main.getBoundingClientRect() : {top:0, left:0, bottom:innerHeight, right:innerWidth};
    return rect.width > 0 && rect.height > 0 && rect.bottom > Math.max(0, clip.top) && rect.top < Math.min(innerHeight, clip.bottom) && rect.right > Math.max(0, clip.left) && rect.left < Math.min(innerWidth, clip.right);
  }
  function controls() {
    const root = board(); if (!root) return;
    const off = motionOff();
    root.querySelectorAll('[data-tw840-area]').forEach(node => {
      const id = node.dataset.tw840Area, active = id === running;
      node.classList.toggle('tw840-selected', id === selected);
      node.classList.toggle('tw840-running', active);
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
    if (motionMode === 'paused' || motionOff() || document.hidden || printing || dialog?.open || window.TodayMotion820?.report().running) {
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
      const health = typeof todayWorkHealth840 === 'function' ? todayWorkHealth840() : areas.health;
      if (JSON.stringify(health || {}) !== healthKey && board()) {
        const saved = capture();
        board().outerHTML = build(renderedDay);
        restore(saved);
      } else scheduleHealth();
    }, areas.health?.ready ? 2000 : 500);
  }
  function restore(saved) {
    mount();
    if (!saved) return;
    if (!dialog?.open) {
      const node = resolveFocus(saved.focus, pane());
      if (node) { node.focus({preventScroll:true}); if (saved.start != null && typeof node.setSelectionRange === 'function') node.setSelectionRange(saved.start, saved.end); }
    }
    restoreScroll(saved.scroll);
  }
  function detailHtml(area, mode) {
    const done = mode === 'done', quantity = area.loading ? null : done ? area.done : area.remaining;
    const fence = area.id === 'fencing';
    const rows = (fence && !done ? [] : area.rows || []).filter(row => done ? row.complete || number(row.done) && row.done > 0 : !row.complete || number(row.remaining) && row.remaining > 0);
    const destination = area.drilldown || {tab:area.id === 'fencing' ? 'fencing' : 'plant', group:null};
    const emptyMessage = area.health && !area.health.ready ? area.health.basis : area.loading ? 'Loading the shared record.' : !number(quantity) ? (done ? 'Recorded quantity is unconfirmed. Review scope and records below.' : 'Remaining quantity is unconfirmed. Review scope and records below.') : done ? (fence ? 'No clean fence work is recorded in this scope.' : 'No completed work is recorded in this scope.') : fence ? 'The remaining programme quantity is not allocated to individual runs in these dockets; physical completion is not inferred.' : 'No remaining work is listed in this recorded scope.';
    const notes = [...(area.issues || []), ...(area.notes || []), area.health?.stale ? area.health.basis : ''].map(textOf).filter(Boolean);
    return '<div class="tw840-dialog-top"><div><span class="tw840-kicker">RECORDED WORK BREAKDOWN</span><h2 id="tw840-dialog-title">' + escape(fence ? 'Clean fence' : area.name) + ' · ' + (fence ? (done ? 'work recorded' : 'left to record') : done ? 'recorded complete' : 'left to record complete') + '</h2><p>' + format(quantity) + ' ' + escape(area.unit) + (fence ? (done ? ' of clean work recorded' : ' of clean programme work left to record') : done ? ' recorded complete' : ' awaiting a completion record') + '</p></div><button type="button" class="tw840-close" data-tw840-close data-tw840-focus="dialog-close" aria-label="Close work breakdown">×</button></div><div class="tw840-detail-summary"><strong>' + (number(area.pct) && !area.loading ? format(Math.round(area.pct)) + '<small>%</small>' : '—') + '</strong><span>' + (number(area.pct) && !area.loading ? fence ? 'clean work recorded' : 'recorded complete' : 'percentage unconfirmed') + '<br>' + format(area.loading ? null : area.done) + ' of ' + format(area.total) + ' ' + escape(area.unit) + '</span></div><div class="tw840-detail-lines">' + (rows.length ? rows.map((row, index) => {
      const value = done ? row.done : row.remaining;
      const share = number(value) && number(quantity) && quantity > 0 ? Math.max(0, Math.min(100, value / quantity * 100)) : 0;
      return '<div class="tw840-detail-row" style="--tw840-row-share:' + share + '%"><div>' + (row.key ? '<button type="button" class="tw840-reference" data-tw840-reference="' + escape(row.key) + '" data-tw840-focus="reference-' + escape(row.key) + '">' + escape(row.key) + ' →</button>' : '') + '<span>' + escape(row.label || row.name || row.key || 'Recorded work') + '</span>' + (row.detail || row.status ? '<small>' + escape([row.status, row.detail].filter(Boolean).join(' · ')) + '</small>' : '') + '</div><strong>' + format(value) + '<small>' + (area.unit === 'm' ? ' m' : '') + '</small></strong></div>';
    }).join('') : '<p class="tw840-empty">' + escape(emptyMessage) + '</p>') + '</div><div class="tw840-definition"><h3>What the figure means</h3><p>' + escape(area.basis) + '</p>' + (notes.length ? '<ul>' + [...new Set(notes)].map(note => '<li>' + escape(note) + '</li>').join('') + '</ul>' : '') + '</div><button type="button" class="tw840-destination" data-tw840-destination="' + escape(destination.tab) + '" data-tw840-group="' + escape(destination.group || '') + '" data-tw840-focus="dialog-destination">' + (area.id === 'fencing' ? 'Open Fencing' : 'Open Equipment · ' + escape(area.name)) + ' →</button>';
  }
  function fencingDetailHtml(row) {
    const notes = [row.note, ...(row.issues || []), ...(fencing?.issues || []), fencing?.health?.stale ? fencing.health.basis : ''].map(textOf).filter(Boolean);
    return '<div class="tw840-dialog-top"><div><span class="tw840-kicker">FENCING · RECORDED WORK</span><h2 id="tw840-dialog-title">' + escape(row.label) + '</h2><p>Work quantities in ' + escape(row.unit) + '</p></div><button type="button" class="tw840-close" data-tw840-close data-tw840-focus="dialog-close" aria-label="Close work breakdown">×</button></div><dl class="tw841-fence-totals"><div><dt>Programme quantity</dt><dd>' + format(row.planned) + '<small>' + escape(row.unit) + '</small></dd></div><div><dt>Recorded work</dt><dd>' + format(row.recorded) + '<small>' + escape(row.unit) + '</small></dd></div><div><dt>Left to record</dt><dd>' + format(row.remaining) + '<small>' + escape(row.unit) + '</small></dd></div></dl><div class="tw840-definition"><h3>What the figures mean</h3><p>' + escape(fencing?.basis || '') + '</p>' + (notes.length ? '<ul>' + [...new Set(notes)].map(note => '<li>' + escape(note) + '</li>').join('') + '</ul>' : '') + '<p class="tw841-source-count">' + (number(row.recordCount) ? format(row.recordCount) + ' supporting work record' + (row.recordCount === 1 ? '' : 's') + '.' : '') + ' Source records remain available in Fencing.</p></div><button type="button" class="tw840-destination" data-tw840-destination="fencing" data-tw840-focus="dialog-destination">Open Fencing →</button>';
  }
  function updateDialog() {
    if (!dialog?.open || !detail) return;
    const area = detail.type === 'fence-type' ? fencing?.summaryRows.find(row => row.id === detail.id) : areas.find(item => item.id === detail.id);
    if (!area) { dialog.close(); return; }
    const content = detail.type === 'fence-type' ? fencingDetailHtml(area) : detailHtml(area, detail.mode);
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
    if (target.closest('#' + boardId)) {
      const action = target.closest('[data-tw840-motion],[data-tw840-detail],[data-tw840-jump],[data-tw840-fence-detail]');
      if (!action) return;
      event.preventDefault();
      if (action.hasAttribute('data-tw840-motion')) toggleMotion(action.dataset.tw840Motion);
      else if (action.hasAttribute('data-tw840-jump')) jump(action.dataset.tw840Jump);
      else if (action.hasAttribute('data-tw840-fence-detail')) openFencingDetails(action.dataset.tw840FenceDetail);
      else openDetails(action.dataset.tw840Detail, action.dataset.tw840Mode);
    } else if (target.closest('#' + dialogId)) {
      const action = target.closest('[data-tw840-close],[data-tw840-reference],[data-tw840-destination]');
      if (!action) return;
      event.preventDefault();
      if (action.hasAttribute('data-tw840-close')) dialog.close();
      else {
        skipReturn = true; dialog.close();
        if (action.hasAttribute('data-tw840-reference')) openAsset(action.dataset.tw840Reference);
        else { if (typeof state !== 'undefined') { state.plantGroup = action.dataset.tw840Group || null; state.light = null; state.q = ''; } go(action.dataset.tw840Destination); }
      }
    }
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
    document.addEventListener('todaymotionselection', event => { if (!String(event.detail?.card || '').startsWith('work840-')) { running = null; controls(); } });
    for (const name of ['visibilitychange','gc500motionchange']) document.addEventListener(name, () => { checkMotion(); scheduleHealth(); });
    for (const name of ['resize','hashchange']) window.addEventListener(name, checkMotion, {passive:true});
    window.addEventListener('scroll', checkMotion, {passive:true, capture:true});
    window.addEventListener('pagehide', () => { running = null; controls(); if (healthTimer) clearTimeout(healthTimer); healthTimer = 0; });
    window.addEventListener('beforeprint', () => { printing = true; checkMotion(); });
    window.addEventListener('afterprint', () => { printing = false; checkMotion(); });
    window.addEventListener('pageshow', checkMotion);
    if (mq?.addEventListener) mq.addEventListener('change', checkMotion); else if (mq?.addListener) mq.addListener(checkMotion);
    const stateWatch = new MutationObserver(() => { checkMotion(); scheduleHealth(); });
    stateWatch.observe(document.documentElement, {attributes:true, attributeFilter:['data-motion']});
    if (pane()) stateWatch.observe(pane(), {attributes:true, attributeFilter:['class','style','hidden']});
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
  return {build, capture, restore, mount, stop, report:() => ({version:'v8.41', mode:motionMode, selected, running, cards:observed.length, dialog:dialog?.open || false, reduced:motionOff()})};
})();
function todayWorkBoard840(asOf) { return TodayWork840.build(asOf); }
