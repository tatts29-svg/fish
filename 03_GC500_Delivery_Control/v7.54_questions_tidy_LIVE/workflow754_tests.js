// Author: Andrew Fisher. Browser practice: writes are captured in memory; the harness aborts service mutations.
// PAGE=/absolute/candidate.html [ARCHIVE754=1] [OUT=/absolute/evidence] node workflow754_tests.js
const fs = require('fs');
const path = require('path');
const {open} = require('../toolchain/harness/open_page');
const pageFile = process.env.PAGE;
if (!pageFile) throw new Error('PAGE is required');
const outDir = process.env.OUT || path.join(__dirname, 'evidence');
fs.mkdirSync(outDir, {recursive:true});
(async () => {
 const reports = [];
 for (const mobile of [false, true]) {
  const h = await open({pageFile, hash:'#questions', mobile, W:mobile ? 390 : 1440, H:mobile ? 844 : 1000, dpr:1});
  const checks = [], check = (name, pass, details) => checks.push({name, pass:!!pass, ...(!pass ? {details} : {})});
  try {
   const p = h.page;
   await p.waitForFunction(() => typeof SYNC !== 'undefined' && SYNC.status === 'live' && SYNC.first.size === Object.keys(SYNC_COLLS).length, null, {timeout:90000});
   await p.waitForTimeout(1200);
   await p.evaluate(() => {
    window.__workflowOriginal754 = JSON.stringify(S);
    window.__workflowWrites754 = [];
    window.capability = () => 'edit'; window.mayWrite = () => true; window.whoAmI = () => 'Andrew Fisher';
    SYNC.readonly = false; SYNC.level = 'edit'; S.operator = 'Andrew Fisher';
    const oldFetch = window.fetch;
    window.fetch = async (url, options) => {
     const r = await oldFetch(url, options);
     if (/\/api\/(version|state)(\?|$)/.test(String(url)) && r.ok) {
      const j = await r.clone().json(); j.level = 'edit';
      return new Response(JSON.stringify(j), {status:200, headers:{'content-type':'application/json'}});
     }
     return r;
    };
    SYNC.db.doc = key => ({id:key.split('/')[1], path:key,
     set:async body => { window.__workflowWrites754.push({key, body:JSON.parse(JSON.stringify(body))}); },
     delete:async () => { window.__workflowWrites754.push({key, body:null}); }});
    document.body.classList.remove('viewonly'); renderQuestions();
   });
   // Let the one version request that may have begun before the wrapper settle.
   await p.waitForTimeout(4800);
   await p.evaluate(() => { SYNC.readonly = false; SYNC.level = 'edit'; renderQuestions(); });
   const ids = await p.evaluate(() => [...document.querySelectorAll('#pane-questions [id]')].map(el => el.id));
   check('Questions group IDs are unique', new Set(ids).size === ids.length, ids);
   check('A note exposes its existing 600-character limit', await p.locator('[data-qa="fe-quote"]').getAttribute('maxlength') === '600');
   const changesBeforeNote = await p.evaluate(() => S.changes || 0);
   await p.locator('[data-qa="fe-quote"]').fill('  Practice note   for the fencing quote  ');
   await p.locator('[data-question-id="fe-quote"] [data-qgo]').click();
   await p.waitForTimeout(600);
   const nav = await p.evaluate(() => ({changes:S.changes || 0, tab:state.tab, note:qAnswer('fe-quote'), stamp:S.stamps['answers/fe-quote'], author:S.by['answers/fe-quote'], writes:window.__workflowWrites754}));
   check('First Open click after typing a note navigates', nav.tab === 'fencing', nav.tab);
   check('Change and blur save one note only once', nav.changes === changesBeforeNote + 1, {before:changesBeforeNote,after:nav.changes});
   check('The note is normalised and retained', nav.note === 'Practice note for the fencing quote', nav.note);
   check('Saved note retains its author and timestamp', nav.author === 'Andrew Fisher' && !!nav.stamp, {author:nav.author,stamp:nav.stamp});
   check('The existing sync path receives the answer document in memory', nav.writes.some(w => w.key.startsWith('answers/') && JSON.stringify(w.body).includes('Practice note for the fencing quote')), nav.writes.map(w => w.key));
   await p.evaluate(() => { go('questions'); document.querySelector('[data-qfold="pending"]').open = true; });
   await p.locator('[data-qa="br-norate-NVAC"]').fill('Pending practice note');
   await p.locator('[data-question-id="br-norate-NVAC"] b').click();
   await p.waitForTimeout(350);
   const saved = await p.evaluate(() => ({open:document.querySelector('[data-qfold="pending"]').open, note:qAnswer('br-norate-NVAC'), meta:document.querySelector('[data-qa-meta="br-norate-NVAC"]').textContent}));
   check('Saving a Pending note keeps its fold open', saved.open, saved);
   check('Attribution appears without a full redraw', saved.meta.includes('Andrew Fisher') && saved.note === 'Pending practice note', saved);
   await p.evaluate(() => { document.querySelector('[data-qfold="history"]').open = true; const original = document.querySelector('[data-question-id="br-norate-NVAC"] .qorig'); if (original) original.open = true; render(); });
   const folds = await p.evaluate(() => ({pending:document.querySelector('[data-qfold="pending"]').open, history:document.querySelector('[data-qfold="history"]').open, original:document.querySelector('[data-question-id="br-norate-NVAC"] .qorig')?.open}));
   check('Full redraw keeps both reader folds open', folds.pending && folds.history, folds);
   check('Full redraw keeps Original wording open', folds.original === true, folds);
   await p.locator('[data-qa="br-norate-NVAC"]').fill('Unsaved draft kept during redraw');
   await p.locator('[data-qa="br-norate-NVAC"]').evaluate(el => el.setSelectionRange(5,10));
   const draft = await p.evaluate(() => { renderQuestions(); const el = document.activeElement; return {id:el.dataset.qa, value:el.value, start:el.selectionStart, end:el.selectionEnd, saved:qAnswer('br-norate-NVAC')}; });
   check('Redraw preserves the focused note draft and cursor', draft.id === 'br-norate-NVAC' && draft.value === 'Unsaved draft kept during redraw' && draft.start === 5 && draft.end === 10, draft);
   check('Preserving a draft does not save it prematurely', draft.saved === 'Pending practice note', draft.saved);
   await p.locator('[data-qa="br-norate-NVAC"]').fill('');
   await p.locator('[data-question-id="br-norate-NVAC"] b').click();
   const cleared = await p.evaluate(() => ({note:qAnswer('br-norate-NVAC'), meta:document.querySelector('[data-qa-meta="br-norate-NVAC"]').textContent, stamped:!!S.stamps['answers/br-norate-NVAC']}));
   check('Clearing a note clears its visible attribution but keeps the audit stamp', !cleared.note && !cleared.meta && cleared.stamped, cleared);
   if (process.env.ARCHIVE754) {
    // A remote update can resolve a dynamic check while its note is still being typed.
    await p.evaluate(() => { setQAnswer('fe-quote', ''); renderQuestions(); });
    await p.waitForTimeout(250);
    await p.locator('[data-qa="fe-quote"]').fill('Unsaved quote context survives the check closing');
    await p.locator('[data-qa="fe-quote"]').evaluate(el => el.setSelectionRange(7,12));
    const disappearing = await p.evaluate(() => {
     window.__workflowFenceQuote754 = fenceQuote; const writes = window.__workflowWrites754.length;
     window.fenceQuote = () => ({number:'Practice quote'});
     try {
      renderQuestions(); const el = document.activeElement, q = questionsList().find(q => q.id === 'fe-quote');
      return {id:el.dataset.qa, value:el.value, start:el.selectionStart, end:el.selectionEnd,
       saved:qAnswer('fe-quote'), draft:!!q?.draft754, historyOpen:document.querySelector('[data-qfold="history"]').open,
       writesBefore:writes, writesAfter:window.__workflowWrites754.length};
     } catch (e) { window.fenceQuote = window.__workflowFenceQuote754; throw e; }
    });
    check('A disappearing check retains its focused unsaved note and cursor', disappearing.id === 'fe-quote' && disappearing.value === 'Unsaved quote context survives the check closing' && disappearing.start === 7 && disappearing.end === 12, disappearing);
    check('A retained draft is visible and explicitly unsaved', disappearing.draft && disappearing.historyOpen && !disappearing.saved, disappearing);
    check('Closing a check while typing does not send its draft', disappearing.writesBefore === disappearing.writesAfter, disappearing);
    await p.locator('[data-question-id="fe-quote"] > b').click();
    const draftSaved = await p.evaluate(() => ({saved:qAnswer('fe-quote'), draft:questionDraftValue754('fe-quote'), title:document.querySelector('[data-question-id="fe-quote"] > b').textContent, flag:document.querySelector('[data-question-id="fe-quote"]').dataset.questionDraft, meta:document.querySelector('[data-qa-meta="fe-quote"]').textContent}));
    check('Finishing a retained draft saves it and updates its label in place', draftSaved.saved === 'Unsaved quote context survives the check closing' && !/unsaved note retained/.test(draftSaved.title) && draftSaved.flag === 'false' && draftSaved.meta.includes('Andrew Fisher'), draftSaved);
    await p.locator('[data-qa="fe-quote"]').fill('Changed unsaved context over an earlier saved note');
    const editedArchive = await p.evaluate(() => { renderQuestions(); const q = questionsList().find(q => q.id === 'fe-quote'); return {draft:!!q?.draft754, value:document.activeElement.value, saved:qAnswer('fe-quote')}; });
    check('A retained saved note distinguishes a later unsaved edit', editedArchive.draft && editedArchive.value === 'Changed unsaved context over an earlier saved note' && editedArchive.saved === draftSaved.saved, editedArchive);
    await p.evaluate(() => { window.fenceQuote = window.__workflowFenceQuote754; });
    const archive = await p.evaluate(() => {
     const old = locNums;
     S.answers['sp-nums'] = 'Practice note after the number was recorded';
     S.answers['legacy-review754'] = 'Earlier check note retained';
     S.stamps['answers/sp-nums'] = '2026-10-01T00:00:00.000Z'; S.by['answers/sp-nums'] = 'Andrew Fisher';
     window.locNums = a => { const x = old(a); return x ? {...x,n:x.q} : x; };
     try {
      renderQuestions(); const item = document.querySelector('[data-question-id="sp-nums"]');
      const answer = questionsList().find(q => q.id === 'sp-nums');
      return {present:!!item, inHistory:!!(item && item.closest('[data-qfold="history"]')), note:document.querySelector('[data-qa="sp-nums"]')?.value, archived:!!questionsList().find(q => q.id === 'legacy-review754')?.archived754, raw:qAnswer('sp-nums')};
     } finally { window.locNums = old; }
    });
    check('A resolved dynamic check retains its note in history', archive.present && archive.inHistory && archive.note === archive.raw, archive);
    check('Inactive saved notes are explicitly distinguished from live checks', archive.archived, archive);
   }
   if (mobile) {
    await p.evaluate(() => { renderQuestions(); document.querySelector('[data-qfold="pending"]').open = true; });
    await p.locator('[data-question-id="br-norate-NVAC"]').scrollIntoViewIfNeeded();
    await p.waitForTimeout(600);
    await p.screenshot({path:path.join(outDir, 'workflow754_phone_note.png')});
    check('Questions has no horizontal document overflow on phone', await p.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1));
   }
   const restored = await p.evaluate(() => { window.mayWrite = () => false; SYNC.readonly = true; clearTimeout(SYNC.timer); clearTimeout(SYNC.rtimer); S = JSON.parse(window.__workflowOriginal754); return JSON.stringify(S) === window.__workflowOriginal754; });
   check('Practice restores the original browser record', restored);
   check('No page errors', h.errors.length === 0, h.errors);
   check('No service write was attempted', h.counts.blocked === 0, h.counts);
   reports.push({mobile,checks});
  } finally { await h.browser.close(); }
 }
 fs.writeFileSync(path.join(outDir, 'workflow754_results.json'), JSON.stringify(reports,null,2)+'\n');
 const failed = reports.flatMap(r => r.checks.filter(c => !c.pass).map(c => ({mobile:r.mobile,...c})));
 console.log(JSON.stringify({checks:reports.reduce((n,r) => n+r.checks.length,0),failed},null,2));
 if (failed.length) process.exitCode = 1;
})().catch(e => { console.error(e); process.exitCode = 1; });
