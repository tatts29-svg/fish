/* Author: Andrew Fisher. v8.92 A+ pass — speed and smoothness.
   Nothing here reads the record differently or works a figure out differently: every model and every drawing function is the
   one the page already had. What changes is HOW OFTEN a thing is worked out inside one draw, and WHEN the page measures the
   screen against writing to it. Measured on 8 Oct 2026 (headless Chromium, phone 390x844, laptop 1440x900, wide 2560x1370):
   - the service's file index (dropFileIndex) was rebuilt once per photograph: Fencing built it 300 times a draw (612 ms);
   - a paper's docket number (docketNoInName) rebuilt the book numbers and scanned every asset's numbers per file name
     (Documents: 650 ms a draw);
   - the Finance month-end events (fin745Events) were filtered again for every labour line (Costs: 490 ms a draw);
   - the tables that scroll sideways were measured and written one at a time after every draw (a forced layout each);
   - the Timeline's lamps were measured and set one gantry at a time on every scroll frame (a forced layout each);
   - Today's instrument check ran on every scroll event, rewriting every card's controls each time;
   - a redraw on the Timeline moved the reading position 47 px.
   Inside a draw the record cannot change, so a figure worked out once is kept until the draw ends (holdAssets' own memo,
   emptied at the end of every hold and whenever a save lands mid-draw). Outside a draw nothing is kept, as before. */
(function () {
 'use strict';
 const W = window;
 const held = (k, f) => heldMemo('aplus892:' + k, f);

 /* 1. the service's file index: once per draw, not once per photograph */
 if (typeof dropFileIndex === 'function') { const raw = dropFileIndex; W.dropFileIndex = function () { return held('dropFileIndex', raw); }; }

 /* 2. the docket number a file name carries: the book numbers and the asset-number set once per draw, each name once.
    The same tests in the same order as the original: a 4–7 digit number standing on its own, not an asset number on this job,
    the first book number that matches wins. */
 if (typeof bookNumbers === 'function' && typeof docketNoInName === 'function') {
  const rawBook = bookNumbers, rawNo = docketNoInName;
  W.bookNumbers = function () { return held('bookNumbers', rawBook); };
  W.docketNoInName = function (nm) {
   if (!ASSETS_HELD) return rawNo(nm);
   const s = String(nm || ''); if (!s) return null;
   const memo = held('docketNoInName', () => new Map());
   if (memo.has(s)) return memo.get(s);
   const cands = held('docketNoInName:numbers', () => {
    const assetNos = new Set(); allAssets().forEach(a => (a.asset_numbers || []).forEach(x => assetNos.add(String(x).trim())));
    return bookNumbers().map(n => String(n || '').trim()).filter(no => /^\d{4,7}$/.test(no) && !assetNos.has(no)).map(no => ({no, rx: new RegExp('(^|\\D)' + no + '(\\D|$)')}));
   });
   const got = cands.find(c => c.rx.test(s)); const v = got ? got.no : null; memo.set(s, v); return v;
  };
 }

 /* 2b. a docket's papers by name: Fencing tested every file's name and title against every docket's number (90 dockets x 390
    files x 2 regular expressions a draw). The files are indexed once per draw by every whole number in their names and titles;
    a docket then looks its number up. The original test — the number standing on its own, not inside a longer one — is exactly
    "a maximal run of digits equal to the number", which is what the index holds; the filters and the order of the files are kept. */
 if (typeof docketPapersByName === 'function' && typeof photoIndex === 'function' && typeof docketPapersOf === 'function') {
  const raw = docketPapersByName;
  W.docketPapersByName = function (d) {
   if (!ASSETS_HELD) return raw(d);
   const no = String((d && d.docket_no) || '').trim(); if (!/^\d{4,7}$/.test(no)) return [];
   const idx = photoIndex(); const files = idx.state === 'ready' ? idx.files : (idx.state === 'none' ? DOCS.files : null); if (!files) return [];
   const byNo = held('papersByNo:' + idx.state, () => { const m = new Map(); Object.values(files).forEach(f => { if (!f) return; const runs = new Set((String(f.name || '').match(/\d+/g) || []).concat(String(f.title || '').match(/\d+/g) || [])); runs.forEach(r => { const l = m.get(r) || []; l.push(f); m.set(r, l); }); }); return m; });
   const assetNos = held('assetNos', () => { const s = new Set(); allAssets().forEach(a => (a.asset_numbers || []).forEach(n => s.add(String(n).trim()))); return s; });
   const isAssetNo = assetNos.has(no), linked = new Set(docketPapersOf(d.id).map(p => p.id));
   return (byNo.get(no) || []).filter(f => !linked.has(f.id) && (f.kind === 'docket' || !isAssetNo)).map(f => ({id: f.id, by: f.by || null, at: f.uploaded || null, byName: true, filedAs: f.kind && f.kind !== 'docket' ? f.kind : null}));
  };
 }

 /* 3. the Finance month-end events: the list once per draw, each key's history once */
 if (typeof fin745Events === 'function' && typeof fin745History === 'function') {
  const rawEv = fin745Events, rawHist = fin745History;
  W.fin745Events = function () { return held('fin745Events', rawEv); };
  W.fin745History = function (kind, key) { return ASSETS_HELD ? held('fin745History:' + kind + '|' + key, () => rawHist(kind, key)) : rawHist(kind, key); };
 }

 /* 4. the labour plan once per draw (the drawer, the P&L cards and the Finance handover each asked for it), and the Finance
    month-end rows once per day asked for (Costs & P&L asked for them six times a draw) */
 if (typeof labourPlan === 'function') { const raw = labourPlan; W.labourPlan = function () { return held('labourPlan', raw); }; }
 if (typeof fin745Rows === 'function') { const raw = fin745Rows; W.fin745Rows = function (asOf) { if (!ASSETS_HELD) return raw(asOf); const day = asOf || todayIso(); return held('fin745Rows:' + day, () => raw(day)); }; }

 /* 5. after a draw: every table's width read first, every attribute written after (one layout, not one per table) */
 if (typeof tblFocusSoon === 'function') W.tblFocusSoon = function () {
  cancelAnimationFrame(TBLF);
  TBLF = requestAnimationFrame(() => { try {
   const wide = [...document.querySelectorAll('.pane.on .tblwrap:not([tabindex])')].filter(w => w.scrollWidth > w.clientWidth + 2);
   wide.forEach(w => { w.tabIndex = 0; w.setAttribute('role', 'region'); w.setAttribute('aria-label', 'Table — scrolls sideways'); });
  } catch (e) {} });
 };

 /* 6. the Timeline's lamps on a scroll frame: every gantry measured, then every class set */
 if (typeof timeline841Motion === 'function') W.timeline841Motion = function () {
  TIMELINE841_FRAME = 0;
  const pane = document.querySelector('#pane-timeline'), main = document.querySelector('main'), mr = main && main.getBoundingClientRect();
  const modal = timeline841ModalOpen();
  const allow = !!pane && pane.classList.contains('on') && !document.hidden && !motionOff() && !modal;
  const top = mr ? mr.top : 0, bottom = Math.min(innerHeight, mr ? mr.bottom : innerHeight);
  const all = [...document.querySelectorAll('.tl841-gantry')];
  const live = all.map(e => { if (!allow || !e.closest('#pane-timeline')) return false; const r = e.getBoundingClientRect(); return r.width > 0 && r.bottom > top && r.top < bottom; });
  all.forEach((e, i) => e.classList.toggle('tl841-live', live[i]));
 };

 /* 7. a redraw keeps the reading position. A record refresh redraws the open page; the Timeline's came back 47 px lower
    because the browser guessed a new anchor while the pane was being rebuilt. A change of tab is not a redraw and keeps
    its own rule (a tab remembers where you were on it). */
 let keep892 = null;
 if (typeof render === 'function') { const raw = render; W.render = function () {
  if (GO_CHANGED) return raw.apply(this, arguments); /* a change of tab sets its own position (a tab remembers where you were); reading the scroll here would only force a layout of the half-changed page */
  const m = document.querySelector('main'), y = m ? m.scrollTop : 0;
  const r = raw.apply(this, arguments);
  if (m && !GO_CHANGED && y > 0 && Math.abs(m.scrollTop - y) > 1) {
   m.scrollTop = y;
   /* a pane that fills in behind (the Equipment register draws its rows in batches) is shorter for a few frames, so the
      position is clamped; it is put back as the height returns, for up to 1500 ms or until the person scrolls */
   if (Math.abs(m.scrollTop - y) > 1) { if (keep892) keep892();
    const until = performance.now() + 1500, evs = ['wheel', 'touchstart', 'pointerdown', 'keydown']; let frame = 0;
    const stop = () => { cancelAnimationFrame(frame); evs.forEach(n => W.removeEventListener(n, stop, true)); if (keep892 === stop) keep892 = null; };
    const tick = () => { if (performance.now() > until || !m.isConnected) return stop(); if (m.scrollHeight - m.clientHeight >= y) { m.scrollTop = y; if (Math.abs(m.scrollTop - y) <= 1) return stop(); } frame = requestAnimationFrame(tick); };
    keep892 = stop; evs.forEach(n => W.addEventListener(n, stop, {capture: true, passive: true})); frame = requestAnimationFrame(tick); }
  }
  return r; }; }

 /* 8. typing in the search box. The finder answers every keystroke (that list is the answer). The redraw of the page behind it,
    160 ms after the typing pauses, filters the tabs that read the search text — Equipment, Costs & P&L, Fencing, Timeline, the map
    and the set-aside registers. Today, Documents, Demob, Pre-starts, the Coates Way, Questions, Change deliveries and About never
    read it, so on those the redraw (650–800 ms on a phone) drew the same page again for nothing; it is skipped there. A tab
    opened afterwards is drawn with the search text as before. */
 if (typeof searchRender === 'function') { const raw = searchRender, NO_Q = new Set(['today', 'docs', 'demob', 'prestarts', 'coatesway', 'questions', 'change', 'about']);
  W.searchRender = function (now) { if (NO_Q.has(state.tab)) { if (searchTimer) { clearTimeout(searchTimer); searchTimer = null; } return; } return raw(now); }; }

 W.aplus892 = {version: 'v8.92', held: ['dropFileIndex', 'bookNumbers', 'docketNoInName', 'docketPapersByName', 'fin745Events', 'fin745History', 'fin745Rows', 'labourPlan'], batched: ['tblFocusSoon', 'timeline841Motion'], keeps: ['render scroll'], skips: ['search redraw on tabs that never read it']};
})();
