// Author: Andrew Fisher. v8.94: the Lighting basis is stated wherever its reading is shown; numbers unchanged; no writes.
const {open} = require('../../toolchain/harness/open_page');
(async () => { let s; try {
 const mob = !!process.env.MOB, W = +(process.env.W || (mob ? 390 : 1440));
 s = await open({pageFile: process.env.PAGE, W, H: mob ? 844 : 1000, mobile: mob, dpr: mob ? 2 : 1});
 const p = s.page, R = []; const ok = (n, v) => R.push({name: n, pass: !!v});
 await p.waitForFunction(() => typeof SYNC !== 'undefined' && SYNC.status === 'live' && document.getElementById('where885'), null, {timeout: 120000});
 await p.waitForTimeout(1600);
 // the card counts up to its figure; data-text holds the settled reading
 const read = () => p.evaluate(() => {
  const el = document.getElementById('where885'), chip = document.getElementById('w885-jump-lighting'), card = document.getElementById('tw840-card-lighting');
  const day = todayWorkDay841(), m = progress881Model(day), row = m.rows.find(r => r.id === 'lighting');
  const sum = todayWorkSummary848(day), fence = fenceOverall853(day, sum), ids = ['buildings','toilets','fencing','generators','lighting','vms','equipment'];
  const parts = ids.map(id => id === 'fencing' ? {min: fence.pct?.min, lower: (fence.pct?.max ?? fence.pct?.min) > fence.pct?.min} : {min: sum.byId[id].pct, lower: sum.byId[id].pctKind === 'lower-bound'});
  const known = parts.every(x => typeof x.min === 'number'), mean = known ? parts.reduce((n, x) => n + x.min, 0) / 7 : null, lower = parts.some(x => x.lower);
  const expected = known ? (lower ? Math.floor((mean + 1e-9) * 100) / 100 : mean).toLocaleString('en-AU', {maximumFractionDigits: 2}) : '—';
  return {
   chipTag: chip?.querySelectorAll('.w894-scope').length, chipLabel: chip?.getAttribute('aria-label') || '', chipTitle: chip?.title || '',
   chipValue: chip?.querySelector('b')?.textContent, cardValue: card?.querySelector('.tw840-reading')?.textContent,
   cardNote: card?.querySelectorAll('.w894-card-scope').length, cardNoteText: card?.querySelector('.w894-card-scope')?.textContent || '',
   basis: el?.querySelector('.w885-basis p')?.textContent || '',
   notes: [...(el?.querySelectorAll('.w885-note') || [])].map(n => n.textContent),
   shown: el?.querySelector('[data-w885-pct]')?.dataset.text, expected, bound: !!el?.querySelector('.w885-reading .w885-bound'), lower,
   rowProvisional: row?.provisional, rowScope: row?.scope894, rowBasis: row?.basis || '', rowPct: [row?.min, row?.max], sumPct: sum.byId.lighting.pct, sumKind: sum.byId.lighting.pctKind,
   allGreen: m.allGreen, provisional: m.provisional,
   overflow: document.documentElement.scrollWidth <= innerWidth + 2
  };
 });
 const a = await read();
 ok('Lighting chip says it is unconfirmed, and why (once)', a.chipTag === 1 && /Lighting unconfirmed: scope audit pending/.test(a.chipLabel) && a.chipTitle.includes('scope audit pending'));
 ok('Lighting group card carries the same note (once)', a.cardNote === 1 && /Lighting unconfirmed: scope audit pending/.test(a.cardNoteText));
 ok('the whole-job basis explains the Lighting scope', /Lighting counts confirmed completion over the register’s lighting towers/.test(a.basis) && /unconfirmed until that audit is done/.test(a.basis));
 ok('Where we are says the whole job is unconfirmed until the Lighting scope audit is done (once)', a.notes.filter(n => /Whole job unconfirmed until the Lighting scope audit is done/.test(n)).length === 1);
 ok('the Lighting reading is unchanged (row = record, chip = card)', a.rowPct[0] === a.sumPct && a.rowScope === 'pending' && a.chipValue === a.cardValue);
 ok('the whole-job number is unchanged (' + a.shown + ' = ' + a.expected + ')', a.shown === a.expected && a.bound === a.lower);
 ok('all five lights cannot turn green on an unconfirmed scope', a.allGreen === false && a.provisional === true);
 // a Today redraw keeps exactly one note in each place
 await p.evaluate(() => { renderToday(); renderToday(); });
 await p.waitForTimeout(800);
 const b = await read();
 ok('redraws keep one note in each place', b.chipTag === 1 && b.cardNote === 1 && b.notes.filter(n => /Whole job unconfirmed/.test(n)).length === 1 && (b.basis.match(/Lighting counts confirmed completion/g) || []).length === 1);
 ok('no horizontal overflow', b.overflow);
 ok('no runtime errors', s.errors.length === 0);
 ok('no attempted live writes', s.counts.blocked === 0);
 R.forEach(r => console.log((r.pass ? 'PASS ' : 'FAIL ') + r.name));
 if (R.some(r => !r.pass)) console.log(JSON.stringify(a));
 console.log((mob ? 'phone' : W + ' px') + ': ' + R.filter(r => r.pass).length + '/' + R.length);
 if (R.some(r => !r.pass)) process.exitCode = 1;
} finally { if (s) await s.browser.close(); } })().catch(e => { console.error(e); process.exitCode = 1; });
