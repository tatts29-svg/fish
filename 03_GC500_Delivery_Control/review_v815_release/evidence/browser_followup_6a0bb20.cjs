// Author: Andrew Fisher. Supplemental browser audit.
// Collection observations use holdAssets, matching production renders and avoiding artificial repeated asset rebuilding.
// PAGE=/absolute/candidate.html BASE=/absolute/base.html OUT=/private/output node this-file.cjs
// Requires the shared harness's Playwright setup. Desktop then phone, one browser at a time.
// All service writes are blocked by the harness. No uploads/removals are submitted.
// Screenshots, PDFs and aggregate results go only to the explicit private OUT directory.
'use strict';
const fs = require('node:fs'), path = require('node:path'), crypto = require('node:crypto'), assert = require('node:assert/strict');
const {PAGE, BASE, OUT} = process.env;
for (const [name, value] of Object.entries({PAGE, BASE, OUT})) assert.ok(value && path.isAbsolute(value), name + ' must be an explicit absolute path');
assert.notEqual(path.resolve(PAGE), path.resolve(BASE), 'PAGE and BASE must be different files');
const repo = path.resolve(__dirname, '../../..'), relativeOut = path.relative(repo, path.resolve(OUT));
assert.ok(relativeOut.startsWith('..' + path.sep) || path.isAbsolute(relativeOut), 'OUT must be outside the repository');
const sha = b => crypto.createHash('sha256').update(b).digest('hex');
const candidateBytes = fs.readFileSync(PAGE), baseBytes = fs.readFileSync(BASE);
assert.ok(candidateBytes.includes(Buffer.from('function printList815(')) && candidateBytes.includes(Buffer.from('function twinIds815(')), 'PAGE must contain the corrected Documents implementation');
assert.notEqual(sha(candidateBytes), sha(baseBytes), 'Candidate must differ from baseline');
fs.mkdirSync(OUT, {recursive: true});
const {open} = require('../../toolchain/harness/open_page');
const report = {author: 'Andrew Fisher', auditDesignedForSourceCommit: '6a0bb204d5bf55e4b65be8cf07866e7b3f1402df',
  pageSha256: sha(candidateBytes), baseSha256: sha(baseBytes), devices: []};
const writeReport = () => fs.writeFileSync(path.join(OUT, 'browser_followup_results.json'), JSON.stringify(report, null, 2) + '\n');
const pause = p => p.waitForTimeout(350);

async function device(name, options) {
  const result = {device: name, checks: [], pageErrors: 0, consoleErrors: 0, blockedWrites: 0};
  report.devices.push(result);
  const check = (name, pass, counts) => result.checks.push({name, pass: !!pass, ...(counts ? {counts} : {})});
  const s = await open({pageFile: PAGE, hash: '#docs', ...options}), p = s.page;
  let consoleErrors = 0;
  p.on('console', message => { if (message.type() === 'error') consoleErrors++; });
  async function stage(label, fn) {
    try { await fn(); }
    catch (error) {
      fs.appendFileSync(path.join(OUT, 'private-diagnostics.log'), name + '/' + label + ': ' + String(error?.stack || error) + '\n');
      check(label + ': completed without an execution error', false);
      await p.screenshot({path: path.join(OUT, name + '-' + label + '-failure.png')}).catch(() => {});
    }
    finally { await p.emulateMedia({media: 'screen'}).catch(() => {}); }
    writeReport();
  }
  async function resetDocs() {
    await p.evaluate(() => {
      closeSearch({always: true, noFocus: true});
      state.docQ815 = ''; state.docTile815 = null; state.docsec = null; state.docSel815 = null;
      state.docAdd815 = false; state.docOpen815 = {}; go('docs'); renderDocs();
    });
    await pause(p);
  }
  try {
    await p.waitForFunction(() => typeof DOCS !== 'undefined' && DOCS.state === 'ready' && typeof renderDocs815 === 'function' && SYNC.level === 'view', null, {timeout: 240000});
    await p.emulateMedia({reducedMotion: 'reduce'});

    await stage('keyboard', async () => {
      await resetDocs();
      await p.locator('#docQ815').focus(); await p.keyboard.press('Tab');
      check('Tab reaches the first category control', await p.evaluate(() => document.activeElement?.dataset.tile815 === 'swms'));
      await p.locator('[data-tile815="swms"]').focus(); await p.keyboard.press('Enter'); await pause(p);
      check('Enter opens the safety category', await p.evaluate(() => state.docTile815 === 'swms' && !!document.querySelector('#docsec-swms')));
      check('Keyboard opening keeps focus on its control or inside its content', await p.evaluate(() => {
        const a = document.activeElement, panel = document.querySelector('#docsec-swms');
        return a?.dataset.tile815 === 'swms' || !!(panel && panel.contains(a));
      }));
      // Reacquire the control for the independent Space action even if the preceding focus check fails.
      await p.locator('[data-tile815="swms"]').focus(); await p.keyboard.press('Space'); await pause(p);
      check('Space closes the category and keeps focus on its control', await p.evaluate(() => state.docTile815 === null && document.activeElement?.dataset.tile815 === 'swms'));
      await p.locator('#docQ815').fill('SWMS'); await pause(p);
      check('Typing filters results without losing search focus', await p.evaluate(() => document.activeElement === document.getElementById('docQ815') && !!document.querySelector('#docsec-results')));
      const before = await p.evaluate(() => { const q = document.getElementById('docQ815'); q.setSelectionRange(1, 3); return {value: q.value, start: q.selectionStart, end: q.selectionEnd}; });
      await p.evaluate(() => docsRedraw()); await pause(p);
      check('Registry-driven redraw preserves the active search and caret', await p.evaluate(b => {
        const q = document.getElementById('docQ815');
        return document.activeElement === q && q.value === b.value && q.selectionStart === b.start && q.selectionEnd === b.end;
      }, before));
      await p.screenshot({path: path.join(OUT, name + '-keyboard.png')});
    });

    await stage('notes', async () => {
      await resetDocs();
      const target = await p.evaluate(() => {
        for (const d of holdAssets(() => docCollection()).items.filter(d => d.twin_of && d.note)) {
          const other = [d.title, d.name, d.id, d.doc_ref].filter(Boolean).join(' ');
          const words = ['SWMS', 'safety', 'risk', 'revision', ...(String(d.note).match(/[a-z]{4,}/gi) || [])];
          const word = words.find(w => new RegExp('\\b' + w + '\\b', 'i').test(d.note) && !new RegExp('\\b' + w + '\\b', 'i').test(other));
          if (word) return {id: d.id, query: d.id + ' ' + word};
        }
        return null;
      });
      check('A retained safety-context note is available for the search check', !!target);
      if (!target) return;
      await p.locator('#docQ815').fill(target.query); await pause(p);
      const count = await p.evaluate(id => {
        const rows = [...document.querySelectorAll('#docBody815 [data-doc815]')].filter(e => e.dataset.doc815 === id);
        rows.forEach(e => e.dataset.auditNote815 = '1'); return rows.length;
      }, target.id);
      check('Filename plus a safety term found only in the note finds the merged paper', count === 1, {matchingRows: count});
      if (count !== 1) return;
      const row = p.locator('[data-audit-note815="1"]'), toggle = row.locator('[data-note815]');
      check('Note starts folded', !await row.locator('.note815').isVisible());
      await toggle.click();
      check('Details reveals the full retained safety-context note', await row.evaluate((e, id) => {
        const d = holdAssets(() => docCollection()).items.find(d => d.id === id), n = e.querySelector('.note815'), b = e.querySelector('[data-note815]');
        return !!d?.note && !!n && !n.hidden && n.textContent === d.note && b.getAttribute('aria-expanded') === 'true';
      }, target.id));
      await p.screenshot({path: path.join(OUT, name + '-note-open.png')});
      await toggle.click();
      check('Details closes the note and updates its expanded state', !await row.locator('.note815').isVisible() && await toggle.getAttribute('aria-expanded') === 'false');
    });

    await stage('native-print', async () => {
      await resetDocs(); await p.locator('[data-tile815="packs"]').click(); await pause(p);
      const fold = p.locator('#docsec-packs [data-fold815="prestarts"]');
      check('Pre-start fold exists for the print-state check', await fold.count() === 1);
      if (await fold.count()) {
        if (!await fold.evaluate(e => e.open)) await fold.locator('summary').click();
        await pause(p);
      }
      await p.evaluate(() => {
        window.__printAudit815 = {before: 0, after: 0};
        window.addEventListener('beforeprint', () => window.__printAudit815.before++);
        window.addEventListener('afterprint', () => window.__printAudit815.after++);
      });
      for (const mode of ['folded', 'filtered']) {
        if (mode === 'filtered') { await p.locator('#docQ815').fill('SWMS'); await pause(p); }
        const before = await p.evaluate(() => ({
          signature: JSON.stringify({tile: state.docTile815, q: state.docQ815, folds: state.docOpen815, hash: location.hash,
            visibleFolds: [...document.querySelectorAll('#docBody815 [data-fold815]')].map(e => [e.dataset.fold815, e.open])}),
          beforeEvents: window.__printAudit815.before, afterEvents: window.__printAudit815.after
        }));
        const pdfPath = path.join(OUT, name + '-' + mode + '.pdf');
        await p.pdf({path: pdfPath, format: 'A4', printBackground: true}); await pause(p);
        await p.emulateMedia({media: 'print'});
        const paper = await p.evaluate(() => {
          const visible = e => !!e.getClientRects().length && getComputedStyle(e).display !== 'none';
          const expected = holdAssets(() => docCollection()).items.filter(d => d.category !== 'Photographs').map(d => d.id);
          const rows = [...document.querySelectorAll('#pane-docs .print815 [data-print815]')].filter(visible).map(e => e.dataset.print815);
          const photos = holdAssets(() => docCollection()).items.filter(d => d.category === 'Photographs');
          const photoGroups = new Set(photos.map(d => photoRef815(d) || '')).size;
          const printedGroups = [...document.querySelectorAll('#pane-docs .print815 [data-printref815]')].filter(visible).length;
          return {complete: rows.length === expected.length && new Set(rows).size === rows.length && expected.every(id => rows.includes(id)),
            documentRows: rows.length, expectedRows: expected.length, photoGroups, printedGroups,
            screenHidden: !visible(document.getElementById('docBody815')) && !visible(document.getElementById('docTiles815'))};
        });
        check(mode + ': native print includes the complete document list and photo groups', paper.complete && paper.screenHidden && paper.photoGroups === paper.printedGroups,
          {documentRows: paper.documentRows, expectedRows: paper.expectedRows, photoGroups: paper.photoGroups, printedGroups: paper.printedGroups});
        await p.emulateMedia({media: 'screen'}); await pause(p);
        check(mode + ': category, filter and fold state survive before/after print', await p.evaluate(b => {
          const signature = JSON.stringify({tile: state.docTile815, q: state.docQ815, folds: state.docOpen815, hash: location.hash,
            visibleFolds: [...document.querySelectorAll('#docBody815 [data-fold815]')].map(e => [e.dataset.fold815, e.open])});
          return signature === b.signature && window.__printAudit815.before > b.beforeEvents && window.__printAudit815.after > b.afterEvents;
        }, before));
        check(mode + ': browser generated a PDF', fs.statSync(pdfPath).size > 1000);
      }
      await p.screenshot({path: path.join(OUT, name + '-after-print.png')});
    });

    await stage('missing-finder', async () => {
      await resetDocs();
      const target = await p.evaluate(() => { const d = holdAssets(() => docCollection()).items.find(d => d.availability === 'missing' && d.kind === 'swms'); return d ? {id: d.id, title: d.title} : null; });
      check('A missing safety document is available for header selection', !!target);
      if (!target) return;
      if (!await p.locator('#q').isVisible()) await p.locator('#searchBtn').click();
      await p.locator('#q').fill(target.title);
      await p.waitForFunction(id => typeof FINDER !== 'undefined' && FINDER.list.some(x => x.kind === 'doc' && x.id === id), target.id);
      const index = await p.evaluate(id => FINDER.list.findIndex(x => x.kind === 'doc' && x.id === id), target.id);
      await p.locator('#finder [data-fi="' + index + '"]').click(); await pause(p);
      check('Actual header selection shows and focuses the chosen missing document', await p.evaluate(id => {
        const row = [...document.querySelectorAll('#docBody815 [data-doc815]')].find(e => e.dataset.doc815 === id);
        return state.tab === 'docs' && !!row && row.getAttribute('aria-current') === 'true' && document.activeElement === row && !!row.querySelector('.tl.red');
      }, target.id));
      await p.screenshot({path: path.join(OUT, name + '-missing-result.png')});
    });

    await stage('upload-controls', async () => {
      await resetDocs();
      check('View link has no Add, upload or remove controls', await p.evaluate(() => SYNC.readonly && !document.querySelector('#docAdd815, #docAddCard, #pane-docs [data-delfile]')));
      // Practice edit mode only: preserve the real GET result but override its capability in this browser,
      // so a 4-second version poll cannot undo the controlled UI fixture halfway through a click.
      await p.evaluate(() => {
        const mode = {fetch: window.fetch, capability: window.capability, readonly: SYNC.readonly, level: SYNC.level, active: true};
        window.__formAudit815 = mode;
        window.fetch = async (...args) => {
          const response = await mode.fetch(...args);
          const request = args[0], url = typeof request === 'string' ? request : request.url;
          if (!mode.active || new URL(url, location.href).pathname !== '/api/version' || !response.ok) return response;
          const value = await response.clone().json();
          if (!mode.active) return response;
          return new Response(JSON.stringify({...value, level: 'edit'}), {status: response.status, headers: {'content-type': 'application/json'}});
        };
        window.capability = () => 'edit'; SYNC.readonly = false; SYNC.level = 'edit'; state.docTile815 = 'maps'; renderDocs(); applyCapability();
      });
      try {
        check('Practice edit mode starts with the upload form folded', await p.locator('#docAdd815').isVisible() && !await p.locator('#docAddCard').isVisible());
        await p.locator('#docAdd815').click();
        check('Add opens the form for Drawings and focuses file selection', await p.evaluate(() => {
          const card = document.getElementById('docAddCard');
          return card && !card.hidden && document.getElementById('docKind').value === 'map' && document.activeElement === document.getElementById('docFile') && document.getElementById('docAdd815').getAttribute('aria-expanded') === 'true';
        }));
        await p.locator('#docKind').selectOption('photo');
        check('Photo selection offers its required reference without invoice fields', await p.locator('#docRef').isVisible() && !await p.locator('#docInv').isVisible());
        const invoice = await p.locator('#docKind option').evaluateAll(options => options.find(o => o.value.startsWith('invoice|'))?.value || null);
        check('An invoice kind is available for the field-toggle check', !!invoice);
        if (invoice) { await p.locator('#docKind').selectOption(invoice); check('Invoice selection offers reference and invoice fields', await p.locator('#docRef').isVisible() && await p.locator('#docInv').isVisible()); }
        await p.screenshot({path: path.join(OUT, name + '-upload-form.png')});
        await p.locator('#docAdd815').click();
        check('Add closes the form and resets its expanded state', !await p.locator('#docAddCard').isVisible() && await p.locator('#docAdd815').getAttribute('aria-expanded') === 'false');
      } finally {
        await p.evaluate(() => {
          const old = window.__formAudit815;
          if (old) { old.active = false; window.fetch = old.fetch; window.capability = old.capability; SYNC.readonly = old.readonly; SYNC.level = old.level; delete window.__formAudit815; }
          state.docAdd815 = false; renderDocs(); applyCapability();
        });
      }
      check('Returning to view mode removes every editing control', await p.evaluate(() => SYNC.readonly && !document.querySelector('#docAdd815, #docAddCard, #pane-docs [data-delfile]')));
    });
    result.pageErrors = s.errors.length; result.consoleErrors = consoleErrors; result.blockedWrites = s.counts.blocked;
    check('No page or console errors during supplemental checks', result.pageErrors === 0 && result.consoleErrors === 0);
    check('No attempted service writes', result.blockedWrites === 0);
  } finally {
    await s.browser.close();
    result.passed = result.checks.filter(c => c.pass).length; result.total = result.checks.length;
    writeReport();
  }
}

(async () => {
  for (const [name, options] of [['desktop', {W: 1440, H: 900}], ['phone', {W: 390, H: 844, dpr: 2, mobile: true}]]) await device(name, options);
  const failed = report.devices.reduce((n, d) => n + d.checks.filter(c => !c.pass).length, 0);
  console.log(JSON.stringify({devices: report.devices.map(d => ({device: d.device, passed: d.passed, total: d.total, pageErrors: d.pageErrors, consoleErrors: d.consoleErrors, blockedWrites: d.blockedWrites})), failed}));
  process.exitCode = failed ? 1 : 0;
})().catch(() => { report.executionError = true; writeReport(); console.error('Supplemental browser audit stopped; inspect aggregate results and private screenshots.'); process.exitCode = 1; });
