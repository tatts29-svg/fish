// Author: Andrew Fisher. v12.76 - the P&L job position's Print, through to the PDF (v12.75's checks with the new headings; no twin-steer rule on the P&L's paper, and the whole rule on the page's other prints, plain and with "Checked by"). On the real tab, reading the live record, writing
// nothing. The browser's print is stood in for by a recorder installed before the page's own scripts (the twin-steer module wraps
// it as it wraps the real one): the button's own code sets the page up for paper and calls print, and the PDF is made from the page
// as it stands at that moment, the state a person's printer receives. Then the print closes (afterprint) and the page tidies.
// Checks: Print reaches the browser's print with the flag, the costs page and the folds open, no question asked; the PDF is A4
// landscape and carries every figure of the final P&L (tiles, branches, suppliers, every cost line, each branch's lines, the
// journals and moves) and every open item; the live model stays on the screen (none of its face on the paper); not one word of the
// refusal page; no twin-steer rule on the P&L's paper, the whole rule on the page's other prints; after the print the page tidies and the flag stays.
//   PAGE=build/GC500_v12.76/GC500_Delivery_Control_hosted.html PLF_JSON=<pack dir>/GC500_PL_final.json [OUT=dir] node tests/print_v1276.cjs
const assert = require('node:assert/strict'), fs = require('node:fs'), path = require('node:path'), os = require('node:os'), {execSync} = require('node:child_process');
const {open} = require('../../toolchain/harness/open_page');
const RECORDER = `(() => { window.__prints = []; window.print = function () { const D = document, H = D.documentElement;
  window.__prints.push({armed: H.classList.contains('ts1053-armed'), costPage: !!D.getElementById('costPage'), printingCosts: !!(D.body && D.body.classList.contains('printing-costs')),
    foldsOpen: [...D.querySelectorAll('#pl1267-fp details.plfold765')].every(d => d.open), ask: !!D.getElementById('ts1053'), strip: (D.getElementById('ts1053-strip') || {}).textContent || ''}); }; })();`;
const RULE = 'NO TWIN-STEER TRUCKS: not on the track, the Esplanade or inside Macintosh Island Park · Week 3, Week 2, Week 1, Race Week and demob · nowhere to park or unload';
/* the words down the left edge of each page: the vertical lines there, first column first, joined and with spaces evened out */
const edge = file => JSON.parse(execSync(`python3 -I - "${file}" <<'PY'
import sys, json, pymupdf
doc = pymupdf.open(sys.argv[1]); out = []
for pg in doc:
    ls = []; hz = []
    for b in pg.get_text('dict')['blocks']:
        for l in b.get('lines', []):
            d = l.get('dir', (1, 0)); t = ''.join(sp['text'] for sp in l['spans'])
            if t.strip() and abs(d[0]) < 0.01 and l['bbox'][0] < 0.12 * pg.rect.width: ls.append((round(l['bbox'][0], 1), -l['bbox'][3], t, l['bbox']))
            elif t.strip() and abs(d[0]) > 0.5: hz.append(pymupdf.Rect(l['bbox']))
    ls.sort(); cols = len({x[0] for x in ls}); hit = sum(1 for x in ls for h in hz if pymupdf.Rect(x[3]).intersects(h))
    out.append([' '.join(' '.join(x[2] for x in ls).split()), cols, hit])
print(json.dumps(out))
PY`, {encoding: 'utf-8'}));
const f2 = v => (v < -0.004 ? '−' : '') + Math.abs(v).toFixed(2).split('.').map((p, i) => i ? p : p.replace(/\B(?=(\d{3})+(?!\d))/g, ',')).join('.');
(async () => {
  const J = JSON.parse(fs.readFileSync(process.env.PLF_JSON, 'utf-8'));
  const out = process.env.OUT || fs.mkdtempSync(path.join(os.tmpdir(), 'plf1272-')); fs.mkdirSync(out, {recursive: true});
  const s = await open({pageFile: process.env.PAGE, hash: '#costs', W: 1440, H: 1000, init: RECORDER}), p = s.page;
  const cons = []; p.on('console', m => { if (m.type() === 'error') cons.push(m.text().slice(0, 200)); });
  let checks = 0; const check = (v, msg) => { assert(v, msg); checks++; };
  try {
    await p.waitForFunction(() => typeof SYNC !== 'undefined' && SYNC.status === 'live', null, {timeout: 150000});
    await p.waitForFunction(() => document.getElementById('pl1267-fp-print') && document.getElementById('pl1267-live'), null, {timeout: 60000});
    await p.waitForTimeout(2000);
    check(await p.evaluate(() => document.documentElement.classList.contains('ts1053-armed')), 'the print flag is on from load');
    await p.click('#pl1267-fp-print');
    await p.waitForFunction(() => window.__prints.length >= 1, null, {timeout: 10000});
    const at = await p.evaluate(() => window.__prints[0]);
    check(at.armed && at.costPage && at.printingCosts && at.foldsOpen && !at.ask, 'the final P&L’s Print reached the browser’s print with the flag, the costs page and its folds open, no question asked: ' + JSON.stringify(at));
    const file = path.join(out, 'print_final_pl.pdf');
    await p.pdf({path: file, format: 'A4', landscape: true, printBackground: true, preferCSSPageSize: true});
    const text = execSync(`pdftotext -layout "${file}" -`, {encoding: 'utf-8'}), flat = text.replace(/\s+/g, ' '), tight = text.replace(/\s+/g, '');
    const info = execSync(`pdfinfo "${file}"`, {encoding: 'utf-8'}), pages = Number((info.match(/Pages:\s+(\d+)/) || [])[1]);
    check(/Page size:\s+841\.\d+ x 59[45]\.\d+ pts \(A4\)/.test(info), 'the PDF is A4 landscape: ' + (info.match(/Page size:[^\n]*/) || [''])[0]);
    const want = [J.revenue.total, J.revenue.invoices, J.revenue.novForecast, J.costs.total, J.costs.sep, J.costs.oct, J.costs.nov, J.difference, J.accrue]
      .concat(...J.branches.map(b => [b.invoiced, b.revenue, b.costs, b.difference]))
      .concat(...J.suppliers.map(x => [x.sep, x.oct, x.nov, x.total, x.accrue]))
      .concat(...J.lines.map(l => [l.sep, l.oct, l.nov, l.accrue]))
      .concat(...Object.values(J.branchLines).map(L => L.map(x => x[1])))
      .concat(J.journals.map(j => j.amount), J.moves.map(j => j.amount))
      .concat(...J.labourCharged.branches.map(b => [b.charged, b.installLabourHire, b.left]), [J.labourCharged.total, J.labourCharged.installTotal, J.labourCharged.leftTotal], J.labourCharged.lines.map(x => x.amount))
      .concat(...J.schedule17.changes.map(x => [x.figure, x.change]), [J.schedule17.added, J.schedule17.forecastsReplaced, J.schedule17.net])
      .concat(J.invoices.map(x => x.ex), J.contracts.map(x => x.costTotal), J.purchaseOrders.map(x => x.amount), J.noPO.map(x => x.amount), [J.matchTotals.tied, J.matchTotals.notTied, J.poTotals.withPO, J.poTotals.noPO])
      .filter(v => Math.abs(v) >= 0.005).map(f2);
    const missing = [...new Set(want)].filter(v => !flat.includes(v));
    check(!missing.length, `every figure of the final P&L is on the paper (${new Set(want).size} distinct figures): missing ` + JSON.stringify(missing.slice(0, 8)));
    const lcMiss = J.labourCharged.notes.filter(o => !tight.includes(o.slice(0, 40).replace(/\s+/g, '')) || !tight.includes(o.slice(-40).replace(/\s+/g, '')));
    check(!lcMiss.length, `every labour note prints in full (${J.labourCharged.notes.length}): ` + JSON.stringify(lcMiss.map(o => o.slice(0, 50))));
    check(tight.includes('LABOURWECHARGEDTHEV8S,BYBRANCH'), 'the labour-charged heading is on the paper');
    const s7Miss = J.schedule17.notes.filter(o => !tight.includes(o.slice(0, 40).replace(/\s+/g, '')) || !tight.includes(o.slice(-40).replace(/\s+/g, '')));
    check(!s7Miss.length && tight.includes('TransportcheckedagainstSchedule17') && J.schedule17.changes.every(x => tight.includes((x.contractDocket + '·' + x.row).replace(/\s+/g, ''))), `the Schedule 17 fold prints: heading, every row's docket and Schedule 17 row, and every note in full (${J.schedule17.notes.length}): ` + JSON.stringify(s7Miss.map(o => o.slice(0, 50))));
    const heads = ['Everycostline', 'Costsbybranch,linebyline', 'Revenuebyinvoice', 'Byhirecontract', 'Everypurchaseorderinthecosts', 'Everylabourlineontheinvoices', 'TransportcheckedagainstSchedule17', 'JournalspreparedforFinance,through31Oct', 'Openitems'];
    check(J.purchaseOrders.every(x => tight.includes(x.po)) && J.invoices.every(x => tight.includes(x.inv) && tight.includes(x.contract) && tight.includes(String(x.customerPO).split(' ')[0])), 'every PO number, invoice, hire contract and the V8s’ PO is on the paper');
    check(heads.every(h => tight.includes(h)), 'every section of the final P&L has its heading on the paper: missing ' + JSON.stringify(heads.filter(h => !tight.includes(h))));
    const openMiss = J.open.filter(o => !tight.includes(o.slice(0, 40).replace(/\s+/g, '')) || !tight.includes(o.slice(-40).replace(/\s+/g, '')));
    check(!openMiss.length, `every open item prints in full (${J.open.length}): ` + JSON.stringify(openMiss.map(o => o.slice(0, 50))));
    check(tight.includes('THEP&L·JOBPOSITION·AUDEXGST·ASAT31OCT2026') && tight.includes('TheP&L,jobpositionat31Oct2026') && !/THE P&L · FINAL|The P&L, final|To accrue/.test(flat.replace(/\s*·\s*/g, ' · ')), 'the dated job-position heading is on the paper, and no “final” or “To accrue”');
    const low = tight.toLowerCase();   /* the tile labels print in capitals */
    check(low.includes('differencesofar') && low.includes('notamarginyet') && low.includes('accrualsthrough31oct') && low.includes('thejournalspreparedforfinance'), 'the tiles’ new names are on the paper');
    check(!tight.includes('WHATWECHARGETHEV8S') && !tight.includes('worksfromtherecordasitstands'), 'the live model stays on the screen: none of its face on the paper');
    check(!/Not printed|tick the twin-steer check/i.test(flat), 'not one word of the refusal page in the PDF');
    /* v12.76 (Andrew, 1 Nov 2026: "I dont want the no twin steer on here"): the P&L's print carries no twin-steer rule */
    const e1 = edge(file);
    check(at.strip.replace(/\s+/g, ' ').trim() === RULE && e1.length === pages && e1.every(x => x[0] === '') && !/TWIN-STEER/.test(text), `the P&L's paper carries no twin-steer rule on any page (${e1.filter(x => x[0] === '').length} of ${pages} pages clear), though the page keeps it for its other prints`);
    /* the page's other prints (A4 landscape, 12 mm margins, no costs page) still carry the whole rule: in one line, plain; wrapped, never cut off, with "Checked by" */
    await p.evaluate(() => { window.dispatchEvent(new Event('afterprint')); }); await p.waitForTimeout(800);
    const file3 = path.join(out, 'print_general.pdf');
    const g = await p.evaluate(() => ({costPage: !!document.getElementById('costPage'), printing: document.body.classList.contains('printing-costs'), armed: document.documentElement.classList.contains('ts1053-armed'), strip: (document.getElementById('ts1053-strip') || {}).textContent || ''}));
    await p.pdf({path: file3, format: 'A4', landscape: true, printBackground: true, preferCSSPageSize: true, pageRanges: '1-6'});
    const e3 = edge(file3);
    check(!g.costPage && !g.printing && g.armed && g.strip.replace(/\s+/g, ' ').trim() === RULE && e3.length >= 1 && e3.every(x => x[0] === RULE && x[1] === 1), `on the page's other prints the whole rule prints in one line (${e3.filter(x => x[0] === RULE && x[1] === 1).length} of ${e3.length} pages): ` + JSON.stringify({g: {costPage: g.costPage, printing: g.printing, armed: g.armed}, bad: e3.filter(x => x[0] !== RULE || x[1] !== 1).slice(0, 2)}));
    await p.evaluate(() => ts1053.arm('Andrew Fisher', 600000)); await p.waitForTimeout(300);
    const want4 = (await p.evaluate(() => (document.getElementById('ts1053-strip') || {}).textContent || '')).replace(/\s+/g, ' ').trim();
    const file4 = path.join(out, 'print_general_checked.pdf');
    await p.pdf({path: file4, format: 'A4', landscape: true, printBackground: true, preferCSSPageSize: true, pageRanges: '1-6'});
    const e4 = edge(file4);
    check(want4.startsWith(RULE + ' · Checked by Andrew Fisher, ') && e4.length >= 1 && e4.every(x => x[0] === want4), `with “Checked by”, the other prints carry the whole rule and the stamp on every page (${e4.filter(x => x[0] === want4).length} of ${e4.length}): ` + JSON.stringify(e4.filter(x => x[0] !== want4).slice(0, 2)));
    await p.evaluate(() => window.dispatchEvent(new Event('afterprint'))); await p.waitForTimeout(800);
    const after = await p.evaluate(() => ({armed: document.documentElement.classList.contains('ts1053-armed'), printing: document.body.classList.contains('printing-costs'), fp: !!document.getElementById('pl1267-fp'), live: !!document.getElementById('pl1267-live')}));
    check(after.armed && !after.printing && after.fp && after.live, 'after the prints the page tidies, keeps the flag, and the final P&L and the live model are still there: ' + JSON.stringify(after));
    check(!cons.length && !s.errors.length && s.counts.blocked === 0, 'no console or page error, no write: ' + JSON.stringify({cons: cons.slice(0, 2), errors: s.errors.slice(0, 2), blocked: s.counts.blocked}));
    console.log(`PASS ${checks}/${checks} print · ${pages} pages A4 landscape · ${file}`);
  } catch (e) { console.error('FAIL print', e.message); process.exitCode = 1; } finally { await s.browser.close(); }
})();
