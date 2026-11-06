// Author: Andrew Fisher. v12.73 - the final P&L's Print, through to the PDF (v12.72's checks plus labour charged by branch). On the real tab, reading the live record, writing
// nothing. The browser's print is stood in for by a recorder installed before the page's own scripts (the twin-steer module wraps
// it as it wraps the real one): the button's own code sets the page up for paper and calls print, and the PDF is made from the page
// as it stands at that moment, the state a person's printer receives. Then the print closes (afterprint) and the page tidies.
// Checks: Print reaches the browser's print with the flag, the costs page and the folds open, no question asked; the PDF is A4
// landscape and carries every figure of the final P&L (tiles, branches, suppliers, every cost line, each branch's lines, the
// journals and moves) and every open item; the live model stays on the screen (none of its face on the paper); not one word of the
// refusal page; the twin-steer rule down the edge of every page; after the print the page tidies and the flag stays for the next.
//   PAGE=build/GC500_v12.73/GC500_Delivery_Control_hosted.html PLF_JSON=<pack dir>/GC500_PL_final.json [OUT=dir] node tests/print_v1272.cjs
const assert = require('node:assert/strict'), fs = require('node:fs'), path = require('node:path'), os = require('node:os'), {execSync} = require('node:child_process');
const {open} = require('../../toolchain/harness/open_page');
const RECORDER = `(() => { window.__prints = []; window.print = function () { const D = document, H = D.documentElement;
  window.__prints.push({armed: H.classList.contains('ts1053-armed'), costPage: !!D.getElementById('costPage'), printingCosts: !!(D.body && D.body.classList.contains('printing-costs')),
    foldsOpen: [...D.querySelectorAll('#pl1267-fp details.plfold765')].every(d => d.open), ask: !!D.getElementById('ts1053')}); }; })();`;
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
      .filter(v => Math.abs(v) >= 0.005).map(f2);
    const missing = [...new Set(want)].filter(v => !flat.includes(v));
    check(!missing.length, `every figure of the final P&L is on the paper (${new Set(want).size} distinct figures): missing ` + JSON.stringify(missing.slice(0, 8)));
    const lcMiss = J.labourCharged.notes.filter(o => !tight.includes(o.slice(0, 40).replace(/\s+/g, '')) || !tight.includes(o.slice(-40).replace(/\s+/g, '')));
    check(!lcMiss.length, `every labour note prints in full (${J.labourCharged.notes.length}): ` + JSON.stringify(lcMiss.map(o => o.slice(0, 50))));
    check(tight.includes('LABOURWECHARGEDTHEV8S,BYBRANCH'), 'the labour-charged heading is on the paper');
    const openMiss = J.open.filter(o => !tight.includes(o.slice(0, 40).replace(/\s+/g, '')) || !tight.includes(o.slice(-40).replace(/\s+/g, '')));
    check(!openMiss.length, `every open item prints in full (${J.open.length}): ` + JSON.stringify(openMiss.map(o => o.slice(0, 50))));
    check(/THE P&L · FINAL/.test(flat.replace(/\s*·\s*/g, ' · ')) || tight.includes('THEP&L·FINAL'), 'the heading is on the paper');
    check(!/Difference so far/.test(flat) && !tight.includes('WHATWECHARGETHEV8S'), 'the live model stays on the screen: none of its face on the paper');
    check(!/Not printed|tick the twin-steer check/i.test(flat), 'not one word of the refusal page in the PDF');
    const strip = execSync(`python3 -I - "${file}" <<'PY'
import sys, pymupdf
doc = pymupdf.open(sys.argv[1]); out = []
for pg in doc:
    hit = 0
    for b in pg.get_text('dict')['blocks']:
        for l in b.get('lines', []):
            d = l.get('dir', (1, 0)); t = ''.join(sp['text'] for sp in l['spans'])
            if 'TWIN-STEER' in t and abs(d[0]) < 0.01: hit += 1
    out.append(hit)
print(sum(1 for h in out if h > 0), len(doc))
PY`, {encoding: 'utf-8'}).trim().split(' ').map(Number);
    check(strip[1] === pages && strip[0] === pages, `the twin-steer rule runs down the edge of every page (${strip[0]} of ${pages})`);
    await p.evaluate(() => window.dispatchEvent(new Event('afterprint'))); await p.waitForTimeout(800);
    const after = await p.evaluate(() => ({armed: document.documentElement.classList.contains('ts1053-armed'), printing: document.body.classList.contains('printing-costs'), fp: !!document.getElementById('pl1267-fp'), live: !!document.getElementById('pl1267-live')}));
    check(after.armed && !after.printing && after.fp && after.live, 'after the print the page tidies, keeps the flag, and the final P&L and the live model are still there: ' + JSON.stringify(after));
    check(!cons.length && !s.errors.length && s.counts.blocked === 0, 'no console or page error, no write: ' + JSON.stringify({cons: cons.slice(0, 2), errors: s.errors.slice(0, 2), blocked: s.counts.blocked}));
    console.log(`PASS ${checks}/${checks} print · ${pages} pages A4 landscape · ${file}`);
  } catch (e) { console.error('FAIL print', e.message); process.exitCode = 1; } finally { await s.browser.close(); }
})();
