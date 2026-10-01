// v7.80 - the Fencing card follows a typed paid rate. Author: Andrew Fisher.
// Opens a built page through the harness (GETs only; every write the page tries is aborted), waits for the shared
// record, opens Fencing and types a paid rate through the box's own change handler, as an editor would. For this check
// only, the editor path is opened (SYNC.readonly off; mayWrite, whoAmI, the shared-record push, the folder write and
// browser storage stubbed); everything is put back and the record left as found.
//   F1 the typed rate changes what the dockets paid (the test moves a real figure)
//   F2 straight after the handler, the kept fencePaidSplit equals a fresh one (on the live page it is the old one)
//   F3 the card's "Paid to Advanced — known so far" total on screen shows the new figure
//   F4 the rate put back: the card shows the original total again; S is as found
//   F5 a draw with no save keeps its memo (fencePaidSplit worked out once per draw, as before)
//   PAGE=<built page> [MOB=1] [OUT=<results.json>] node fencing_card_fresh_tests.js
const {open} = require('../../toolchain/harness/open_page');
const fs = require('fs');
(async () => {
  const MOB = !!process.env.MOB;
  const s = await open(MOB ? {pageFile: process.env.PAGE, W: 390, H: 844, dpr: 2, mobile: true} : {pageFile: process.env.PAGE, W: 1440, H: 900});
  const p = s.page;
  await p.waitForFunction(() => typeof go === 'function' && typeof fencePaidSplit === 'function' && typeof SYNC !== 'undefined' && SYNC.status === 'live' && SYNC.first && SYNC.first.size === Object.keys(SYNC_COLLS).length, null, {timeout: 240000});
  await p.evaluate(() => go('fencing')); await p.waitForTimeout(1200);
  const R = await p.evaluate(() => {
    const out = [], ok = (name, pass, detail) => out.push({name, pass: !!pass, detail: String(detail)});
    const snap = JSON.stringify(S);
    const keep = {ro: SYNC.readonly, push: typeof syncPush === 'function' ? syncPush : null, folder: typeof folderWrite === 'function' ? folderWrite : null, persist: typeof persist === 'function' ? persist : null, may: mayWrite, who: whoAmI};
    const pane = document.getElementById('pane-fencing');
    const cardTotal = () => { const h = [...pane.querySelectorAll('h3')].find(x => /by P&(amp;)?L line/.test(x.textContent)); const card = h && h.closest('.card, section, div');
      const tot = card && [...card.querySelectorAll('.ln.total')].find(x => /Paid to Advanced/.test(x.textContent)); return tot ? tot.querySelector('.amt').textContent.trim() : null; };
    const fresh = () => { const kept = RENDER_MEMO.get('fencePaidSplit'); RENDER_MEMO.delete('fencePaidSplit'); const f = fencePaidSplit(); if (kept) RENDER_MEMO.set('fencePaidSplit', kept); return f; };
    const res = {};
    try {
      SYNC.readonly = false; syncPush = () => {}; folderWrite = () => {}; persist = () => true; mayWrite = () => true; whoAmI = () => 'probe';
      /* F5 first: a plain draw works the split out once */
      const orig = fencePaidSplit; let calls = 0, built = 0;
      res.total0 = cardTotal(); res.paid0 = fencePaidSplit().paid;
      /* pick the box whose rate moves the paid total */
      const boxes = [...pane.querySelectorAll('[data-fck]')];
      let pick = null;
      for (const b of boxes) { const k = b.dataset.fck, was = S.fenceCosts && Object.prototype.hasOwnProperty.call(S.fenceCosts, k) ? S.fenceCosts[k] : undefined;
        S.fenceCosts = S.fenceCosts || {}; S.fenceCosts[k] = String((Number(b.value) || 0) + 7);
        RENDER_MEMO.delete('fencePaidSplit'); const moved = fencePaidSplit().paid !== res.paid0;
        if (was === undefined) delete S.fenceCosts[k]; else S.fenceCosts[k] = was; RENDER_MEMO.delete('fencePaidSplit'); fencePaidSplit();
        if (moved) { pick = {k, was, value: b.value}; break; } }
      res.boxes = boxes.length; res.pick = pick && pick.k;
      if (pick) {
        const b = pane.querySelector(`[data-fck="${CSS.escape(pick.k)}"]`);
        b.value = String((Number(pick.value) || 0) + 7); b.dispatchEvent(new Event('change'));
        const kept = RENDER_MEMO.get('fencePaidSplit'), f = fresh();
        res.paid1 = f.paid; res.keptPaid = kept && kept.paid; res.total1 = cardTotal(); res.want1 = money(Math.round((f.paid + f.green) * 100) / 100);
        const b2 = pane.querySelector(`[data-fck="${CSS.escape(pick.k)}"]`);
        b2.value = pick.value; b2.dispatchEvent(new Event('change'));
        res.total2 = cardTotal(); res.paid2 = fresh().paid;
      }
      /* F5: one renderPass, how many times is the split worked out */
      fencePaidSplit = function () { calls++; if (!RENDER_MEMO.has('fencePaidSplit')) built++; return orig.apply(this, arguments); };
      try { go('costs'); go('fencing'); } finally { fencePaidSplit = orig; }
      res.calls = calls; res.built = built;
    } finally {
      SYNC.readonly = keep.ro; if (keep.push) syncPush = keep.push; if (keep.folder) folderWrite = keep.folder; if (keep.persist) persist = keep.persist; mayWrite = keep.may; whoAmI = keep.who;
      const back = JSON.parse(snap); Object.keys(S).forEach(k => delete S[k]); Object.assign(S, back); render();
    }
    ok('F1 the typed rate moves what the dockets paid', res.pick && res.paid1 !== res.paid0, JSON.stringify(res));
    ok('F2 straight after the handler the kept split is the fresh one', res.pick && res.keptPaid === res.paid1, `kept ${res.keptPaid} · fresh ${res.paid1} · before ${res.paid0}`);
    ok('F3 the card on screen shows the new total', res.pick && res.total1 === res.want1 && res.total1 !== res.total0, `screen ${res.total1} · want ${res.want1} · before ${res.total0}`);
    ok('F4 the rate put back: the card shows the original total and S is as found', res.total2 === res.total0 && res.paid2 === res.paid0 && JSON.stringify(S) === snap, `${res.total2} vs ${res.total0}`);
    ok('F5 a draw with no save works the split out once at most per tab change', res.built <= 2 && res.calls >= 1, `calls ${res.calls} · built ${res.built} over two tab changes`);
    return {tests: out, v780: /RENDER_MEMO\.clear\(\); \/\* v7\.80/.test(save.toString())};
  });
  const passed = R.tests.filter(t => t.pass).length;
  R.tests.forEach(t => console.log(`${t.pass ? 'PASS' : 'FAIL'} ${t.name} — ${t.detail.slice(0, 200)}`));
  console.log(`${passed}/${R.tests.length} ${MOB ? 'phone' : 'desktop'} · page errors ${s.errors.length}${R.v780 ? '' : ' · (page without v7.80)'}`);
  if (process.env.OUT) fs.writeFileSync(process.env.OUT, JSON.stringify({page: process.env.PAGE, mobile: MOB, passed, of: R.tests.length, errors: s.errors, tests: R.tests}, null, 1));
  await s.browser.close();
  process.exit(passed === R.tests.length && !s.errors.length ? 0 : 1);
})().catch(e => { console.error('FAIL', e.message); process.exit(1); });
