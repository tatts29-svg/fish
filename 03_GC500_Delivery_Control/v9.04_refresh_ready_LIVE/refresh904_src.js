/* Author: Andrew Fisher. First shared-record draw only; the merge/write paths are unchanged. */
const Refresh904 = window.GC500Refresh904 = (() => {
 const root = document.documentElement;
 const hosted = DATA.edition === 'hosted' && /^\/(?:v|e)\/[A-Za-z0-9_-]+/.test(location.pathname);
 let settled = !hosted, drawing = false, timer = null;
 const complete = () => document.readyState !== 'loading' && !!SYNC.on && SYNC.status === 'live' && Object.keys(SYNC_COLLS).every(k => SYNC.first.has(k));
 function show(kind) {
  if (!hosted) { root.removeAttribute('data-refresh904'); return; }
  root.setAttribute('data-refresh904', kind);
  const main = document.querySelector('.app > main'), panel = document.getElementById('refresh904');
  if (main) main.setAttribute('aria-busy', String(kind === 'loading'));
  if (!panel) return;
  const heading = panel.querySelector('[data-refresh904-heading]');
  const detail = panel.querySelector('[data-refresh904-detail]');
  if (kind === 'loading') {
   heading.textContent = 'Loading the current shared record';
   detail.textContent = 'Checking the latest deliveries, assets and progress…';
  } else if (kind === 'saved') {
   heading.textContent = 'Saved copy — current record not confirmed';
   detail.textContent = 'The connection is taking longer than expected. Information below may be out of date; it will update when the shared record is available.';
  }
 }
 function update() {
  if (!hosted || settled) return;
  if (complete()) {
   // The first snapshot has landed; reveal only after its render, not the old DOM.
   if (!drawing) { drawing = true; syncRedraw(); }
  } else if (SYNC.status === 'unreachable' || SYNC.status === 'revoked') show('saved');
 }
 function drawn() {
  drawing = false;
  if (!hosted || settled || !complete()) return;
  settled = true; clearTimeout(timer); show('ready');
  // Native responsive scenes observe visibility and size once their real pane is revealed.
  window.dispatchEvent(new Event('resize'));
 }
 function retry() {
  if (SYNC.on && SYNC.backend && typeof SYNC.backend.pull === 'function') {
   const detail = document.querySelector('#refresh904 [data-refresh904-detail]');
   if (detail) detail.textContent = 'Checking the connection again. This copy remains available below.';
   Promise.resolve(SYNC.backend.pull(true)).then(update).catch(update);
  } else location.reload();
 }
 if (hosted) {
  show('loading');
  timer = setTimeout(() => { if (!settled) { show('saved'); update(); } }, 12000);
  const retryButton = document.querySelector('[data-refresh904-retry]');
  if (retryButton) retryButton.addEventListener('click', retry);
 } else show('ready');
 return {update, drawn, report: () => ({hosted, settled, drawing, complete: complete(), state: root.getAttribute('data-refresh904')})};
})();
