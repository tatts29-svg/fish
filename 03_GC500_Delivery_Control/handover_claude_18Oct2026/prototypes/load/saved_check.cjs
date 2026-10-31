// Fallback path: the first /api/state answer is held back 16 s, so the page must show its saved copy at 12 s, then the record.
const {open} = require('./popen.cjs');
(async () => { const s = await open({pageFile: process.env.PAGE}); const p = s.page; const out = {};
  const snap = async label => out[label] = await p.evaluate(() => ({state: document.documentElement.getAttribute('data-refresh904'), tab: state.tab, hash: location.hash, sync: SYNC.status, docs: DOCS.state,
    text: ((document.getElementById('pane-' + state.tab) || {}).innerText || '').replace(/\b\d{1,2}:\d{2}(:\d{2})?\b/g, '#:#'), visible: !!(document.getElementById('pane-' + state.tab) || {getClientRects: () => []}).getClientRects().length}));
  await p.waitForTimeout(13500); await snap('at13s'); await p.waitForTimeout(16000); await snap('at30s');
  for (const k of Object.keys(out)) { const o = out[k]; console.log(k, o.state, o.tab, o.hash, o.sync, o.docs, 'visible', o.visible, 'textLen', o.text.length); }
  require('fs').writeFileSync(process.env.OUT, JSON.stringify(out)); console.log('errors', JSON.stringify(s.errors)); await s.browser.close(); })();
