/* Author: Andrew Fisher. Read-only Today work instruments, v8.40. */
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
  let areas = [], installed = false, selected = null, running = null, printing = false, observer = null;
  let healthTimer = 0, healthKey = '', renderedDay = null;
  let observed = [], dialog = null, detail = null, returnFocus = null, returnScroll = null, skipReturn = false;
  const mq = typeof matchMedia === 'function' ? matchMedia('(prefers-reduced-motion: reduce)') : null;

  function digits(value, id, caption) {
    const known = number(value), reading = known ? String(Math.round(Math.max(0, Math.min(100, value)))) : '—';
    const codes = ['abcdef','bc','abdeg','abcdg','bcfg','acdfg','acdefg','abc','abcdefg','abcdfg'];
    const paths = ['8,2 39,2 44,7 39,12 8,12 3,7','42,9 47,14 47,35 42,40 37,35 37,14','42,44 47,49 47,71 42,76 37,71 37,49','8,74 39,74 44,79 39,84 8,84 3,79','5,44 10,49 10,71 5,76 0,71 0,49','5,9 10,14 10,35 5,40 0,35 0,14','8,38 39,38 44,43 39,48 8,48 3,43'];
    const width = reading.length * 56, gradient = 'tw840-oled-' + id;
    return '<span class="tw840-sr">' + (known ? reading + '% ' + escape(caption || 'recorded complete') : 'Completion percentage unavailable') + '</span>' +
      '<svg class="tw840-segments" viewBox="0 0 ' + (width + (known ? 32 : 4)) + ' 88" aria-hidden="true"><defs><linearGradient id="' + escape(gradient) + '" x2="0" y2="1"><stop stop-color="#f2fff8"/><stop offset=".5" stop-color="#c9ffe2"/><stop offset="1" stop-color="#91e9bd"/></linearGradient></defs>' +
      [...reading].map((digit, index) => '<g transform="translate(' + (index * 56 + 3) + ' 0)">' + paths.map((points, part) => {
        const lit = (digit === '—' ? 'g' : codes[Number(digit)]).includes('abcdefg'[part]);
        return '<polygon class="' + (lit ? 'tw840-segment-on' : 'tw840-segment-off') + '" fill="' + (lit ? 'url(#' + escape(gradient) + ')' : '#102624') + '" points="' + points + '"/>';
      }).join('') + '</g>').join('') + (known ? '<g transform="translate(' + width + ' 40)" fill="#b0f0d2"><path d="M3 24L20 3L23 5L6 26Z"/><path fill-rule="evenodd" d="M6 0a5 5 0 1 0 0 10a5 5 0 1 0 0-10M6 3a2 2 0 1 1 0 4a2 2 0 1 1 0-4M21 18a5 5 0 1 0 0 10a5 5 0 1 0 0-10M21 21a2 2 0 1 1 0 4a2 2 0 1 1 0-4"/></g>' : '') + '</svg>';
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
  function card(area) {
    const pct = area.loading ? null : area.pct;
    const lit = number(pct) ? Math.round(Math.max(0, Math.min(100, pct)) / 100 * 24) : 0;
    const scope = number(area.total) ? format(area.total) + ' ' + area.unit + ' in scope' : 'Scope quantity unconfirmed';
    const healthLabel = area.loading ? 'Loading' : area.health && !area.health.ready ? 'Record unavailable' : area.health?.stale ? 'Last received' : 'Shared record';
    return '<article class="tw840-card" id="tw840-card-' + escape(area.id) + '" data-tw840-area="' + escape(area.id) + '"><header class="tw840-top"><div class="tw840-name">' + icon(area.id) + '<h3 tabindex="-1" data-tw840-focus="' + escape(area.id + '-heading') + '">' + escape(area.name) + '</h3></div><button type="button" class="tw840-motion" data-tw840-motion="' + escape(area.id) + '" data-tw840-focus="' + escape(area.id + '-motion') + '" aria-pressed="false" aria-label="Animate ' + escape(area.name) + ' display" title="Display animation">' + icon('', 'M8 5L19 12L8 19Z') + '<span>Motion</span></button></header><p class="tw840-scope">' + escape(area.scope) + '</p><div class="tw840-display"><div class="tw840-leds" aria-hidden="true">' + Array.from({length:24}, (_, n) => '<i' + (n < lit ? ' class="lit"' : '') + '></i>').join('') + '</div><div class="tw840-percent">' + digits(pct, area.id, area.id === 'fencing' ? 'clean work recorded' : 'recorded complete') + '</div><p class="tw840-caption">' + (area.loading ? 'LOADING RECORD' : number(pct) ? area.id === 'fencing' ? 'CLEAN WORK RECORDED' : 'RECORDED COMPLETE' : 'PERCENTAGE UNCONFIRMED') + '</p><div class="tw840-scale" aria-hidden="true"><span>0</span><span>50</span><span>100</span></div></div><div class="tw840-counts">' + countButton(area, 'done') + countButton(area, 'left') + '</div><div class="tw840-preview"><span>' + (area.issues && area.issues.length ? 'Record to review' : 'Remaining work') + '</span><p>' + escape(noteFor(area)) + '</p></div><footer class="tw840-footer"><span>' + escape(scope) + '</span><span>' + escape(healthLabel) + '</span></footer></article>';
  }
  function build(asOf) {
    areas = todayWorkMetrics840(asOf);
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
    const rect = node.getBoundingClientRect(), main = p.closest('main');
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
      button.setAttribute('aria-label', (active ? 'Pause' : 'Animate') + ' ' + name + ' display');
      button.title = off ? 'Animation follows your reduced motion or Motion Off setting' : 'Display animation';
      button.querySelector('path').setAttribute('d', active ? 'M7 5H10V19H7ZM14 5H17V19H14Z' : 'M8 5L19 12L8 19Z');
    });
  }
  function stop() { running = null; controls(); }
  function checkMotion() {
    const active = board()?.querySelector('[data-tw840-area="' + running + '"]');
    if (running && (motionOff() || !visible(active))) running = null;
    controls();
  }
  function pauseNativeMotion() {
    const native = window.TodayMotion820?.report();
    if (native && native.running) pane()?.querySelector('[data-today-card="' + native.running + '"] .today-motion-button')?.click();
  }
  function toggleMotion(id) {
    if (running === id) { stop(); return; }
    selected = id;
    const active = board()?.querySelector('[data-tw840-area="' + id + '"]');
    if (!motionOff() && visible(active)) {
      pauseNativeMotion();
      running = id;
      document.dispatchEvent(new CustomEvent('todaymotionselection', {detail:{card:'work840-' + id, running:true}}));
    } else running = null;
    controls();
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
    return '<div class="tw840-dialog-top"><div><span class="tw840-kicker">RECORDED WORK BREAKDOWN</span><h2 id="tw840-dialog-title">' + escape(area.name) + ' · ' + (fence ? (done ? 'work recorded' : 'left to record') : done ? 'recorded complete' : 'left to record complete') + '</h2><p>' + format(quantity) + ' ' + escape(area.unit) + (fence ? (done ? ' of clean work recorded' : ' of clean programme work left to record') : done ? ' recorded complete' : ' awaiting a completion record') + '</p></div><button type="button" class="tw840-close" data-tw840-close data-tw840-focus="dialog-close" aria-label="Close work breakdown">×</button></div><div class="tw840-detail-summary"><strong>' + (number(area.pct) && !area.loading ? format(Math.round(area.pct)) + '<small>%</small>' : '—') + '</strong><span>' + (number(area.pct) && !area.loading ? fence ? 'clean work recorded' : 'recorded complete' : 'percentage unconfirmed') + '<br>' + format(area.loading ? null : area.done) + ' of ' + format(area.total) + ' ' + escape(area.unit) + '</span></div><div class="tw840-detail-lines">' + (rows.length ? rows.map((row, index) => {
      const value = done ? row.done : row.remaining;
      const share = number(value) && number(quantity) && quantity > 0 ? Math.max(0, Math.min(100, value / quantity * 100)) : 0;
      return '<div class="tw840-detail-row" style="--tw840-row-share:' + share + '%"><div>' + (row.key ? '<button type="button" class="tw840-reference" data-tw840-reference="' + escape(row.key) + '" data-tw840-focus="reference-' + escape(row.key) + '">' + escape(row.key) + ' →</button>' : '') + '<span>' + escape(row.label || row.name || row.key || 'Recorded work') + '</span>' + (row.detail || row.status ? '<small>' + escape([row.status, row.detail].filter(Boolean).join(' · ')) + '</small>' : '') + '</div><strong>' + format(value) + '<small>' + (area.unit === 'm' ? ' m' : '') + '</small></strong></div>';
    }).join('') : '<p class="tw840-empty">' + escape(emptyMessage) + '</p>') + '</div><div class="tw840-definition"><h3>What the figure means</h3><p>' + escape(area.basis) + '</p>' + (notes.length ? '<ul>' + [...new Set(notes)].map(note => '<li>' + escape(note) + '</li>').join('') + '</ul>' : '') + '</div><button type="button" class="tw840-destination" data-tw840-destination="' + escape(destination.tab) + '" data-tw840-group="' + escape(destination.group || '') + '" data-tw840-focus="dialog-destination">' + (area.id === 'fencing' ? 'Open Fencing' : 'Open Equipment · ' + escape(area.name)) + ' →</button>';
  }
  function updateDialog() {
    if (!dialog?.open || !detail) return;
    const area = areas.find(item => item.id === detail.id);
    if (!area) { dialog.close(); return; }
    const content = detailHtml(area, detail.mode);
    if (dialog.__tw840Content === content) return;
    const saved = focusToken(document.activeElement, dialog), top = dialog.scrollTop;
    dialog.innerHTML = content; dialog.__tw840Content = content;
    (resolveFocus(saved, dialog) || dialog.querySelector('[data-tw840-close]'))?.focus({preventScroll:true});
    dialog.scrollTop = top;
  }
  function openDetails(id, mode) {
    const area = areas.find(item => item.id === id); if (!area) return;
    stop(); pauseNativeMotion(); returnFocus = focusToken(document.activeElement, pane()); returnScroll = scrollSnapshot(); skipReturn = false;
    detail = {id, mode}; dialog.dataset.mode = mode;
    dialog.innerHTML = detailHtml(area, mode); dialog.__tw840Content = dialog.innerHTML;
    dialog.showModal(); dialog.scrollTop = 0; dialog.querySelector('[data-tw840-close]')?.focus({preventScroll:true});
  }
  function jump(id) {
    const node = document.getElementById('tw840-card-' + id), main = pane()?.closest('main');
    if (!node) return;
    node.querySelector('h3')?.focus({preventScroll:true});
    const nav = board()?.querySelector('.tw840-nav'), inset = (nav?.getBoundingClientRect().height || 0) + 20;
    if (main) main.scrollTo({top:main.scrollTop + node.getBoundingClientRect().top - main.getBoundingClientRect().top - inset, behavior:motionOff() ? 'instant' : 'smooth'});
    else node.scrollIntoView({block:'start', behavior:motionOff() ? 'instant' : 'smooth'});
  }
  function onClick(event) {
    const target = event.target instanceof Element ? event.target : null;
    if (!target) return;
    if (target.closest('#' + boardId)) {
      const action = target.closest('[data-tw840-motion],[data-tw840-detail],[data-tw840-jump]');
      if (!action) return;
      event.preventDefault();
      if (action.hasAttribute('data-tw840-motion')) toggleMotion(action.dataset.tw840Motion);
      else if (action.hasAttribute('data-tw840-jump')) jump(action.dataset.tw840Jump);
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
    document.addEventListener('todaymotionselection', event => { if (!String(event.detail?.card || '').startsWith('work840-')) stop(); });
    for (const name of ['visibilitychange','gc500motionchange']) document.addEventListener(name, () => { checkMotion(); scheduleHealth(); });
    for (const name of ['resize','hashchange']) window.addEventListener(name, checkMotion, {passive:true});
    window.addEventListener('scroll', checkMotion, {passive:true, capture:true});
    window.addEventListener('pagehide', () => { stop(); if (healthTimer) clearTimeout(healthTimer); healthTimer = 0; });
    window.addEventListener('beforeprint', () => { printing = true; stop(); });
    window.addEventListener('afterprint', () => { printing = false; controls(); });
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
  return {build, capture, restore, mount, stop, report:() => ({version:'v8.40', selected, running, cards:observed.length, dialog:dialog?.open || false, reduced:motionOff()})};
})();
function todayWorkBoard840(asOf) { return TodayWork840.build(asOf); }
