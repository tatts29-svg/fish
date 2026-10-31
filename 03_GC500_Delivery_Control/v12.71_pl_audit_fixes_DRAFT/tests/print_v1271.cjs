// Author: Andrew Fisher. v12.71 - the Costs & P&L Print buttons, through to the PDF. On the real tab, reading the live record,
// writing nothing. The browser's print is stood in for by a recorder (installed before the page's own scripts, so the twin-steer
// module wraps it as it wraps the real one): the button's own code sets the page up for paper and calls print, and the PDF is made
// from the page exactly as it stands at that moment - the state a person's printer receives. Then the print is closed (afterprint)
// and the page must tidy itself and keep the flag for the next print.
// Checks: the print flag is on from load; the face's Print and the Workings' Print both reach the browser's print with the flag,
// the costs rule and the landscape page on, no question asked; each PDF carries every heading, every tile figure, every cost line's
// so-far figure, every branch figure and Finance's view, the twin-steer rule down the edge of every page, and not one word of the
// refusal page; after each print the page tidies and the flag stays; Ctrl+P reaches the print with the flag on.
//   PAGE=build/GC500_v12.71/GC500_Delivery_Control_hosted.html [EVIDENCE=dir] node tests/print_v1271.cjs
const assert = require('node:assert/strict'), fs = require('node:fs'), path = require('node:path'), os = require('node:os'), {execSync} = require('node:child_process');
const {open} = require('../../toolchain/harness/open_page');
const RECORDER = `(() => { window.__prints = []; window.print = function () { const D = document, H = D.documentElement;
  window.__prints.push({armed: H.classList.contains('ts1053-armed'), costPage: !!D.getElementById('costPage'), printingCosts: !!(D.body && D.body.classList.contains('printing-costs')),
    foldsOpen: [...D.querySelectorAll('#pane-costs details.plfold765')].every(d => d.open), ask: !!D.getElementById('ts1053')}); }; })();`;
(async () => {
  const dir = process.env.EVIDENCE;
  const s = await open({pageFile: process.env.PAGE, hash: '#costs', W: 1440, H: 1000, init: RECORDER}), p = s.page;
  const cons = []; p.on('console', m => { if (m.type() === 'error') cons.push(m.text().slice(0, 200)); });
  let checks = 0; const check = (v, msg) => { assert(v, msg); checks++; };
  const lines = [], out = dir || fs.mkdtempSync(path.join(os.tmpdir(), 'pl1271-'));
  fs.mkdirSync(out, {recursive: true});
  const pdfText = file => execSync(`pdftotext -layout "${file}" -`, {encoding: 'utf-8'});
  const stripByPage = file => execSync(`python3 -I - "${file}" <<'PY'
import sys, pymupdf
doc = pymupdf.open(sys.argv[1]); out = []
for pg in doc:
    hit = 0
    for b in pg.get_text('dict')['blocks']:
        for l in b.get('lines', []):
            d = l.get('dir', (1, 0)); t = ''.join(sp['text'] for sp in l['spans'])
            if 'TWIN-STEER' in t and abs(d[0]) < 0.01: hit += 1
    out.append(hit)
print(len(doc), out)
PY`, {encoding: 'utf-8'}).trim();
  try {
    await p.waitForFunction(() => typeof SYNC !== 'undefined' && SYNC.status === 'live', null, {timeout: 150000});
    await p.waitForFunction(() => document.getElementById('pl1267-print') && document.getElementById('pl1267-branch'), null, {timeout: 60000});
    await p.waitForTimeout(2000);
    const load = await p.evaluate(() => ({armed: document.documentElement.classList.contains('ts1053-armed'), flagFn: typeof (window.ts1053 || {}).flag === 'function', askOff: !!(window.ts1053 && window.ts1053.armed()), lock: !!document.getElementById('ts1053-lock'), strip: (document.getElementById('ts1053-strip') || {}).textContent || '', faceBtn: (() => { const b = document.getElementById('pl1267-print'); if (!b) return null; const r = b.getBoundingClientRect(); return {w: Math.round(r.width), h: Math.round(r.height), inFace: !!b.closest('#pl1267')}; })()}));
    check(load.armed && load.flagFn && load.askOff, 'the print flag is on the page from load, the ask still off: ' + JSON.stringify(load));
    check(/NO TWIN-STEER TRUCKS/.test(load.strip) && !/Checked by/.test(load.strip) && load.lock, 'the strip says the rule, and the refusal page is still on the page for the print stylesheet: ' + load.strip.slice(0, 60));
    check(load.faceBtn && load.faceBtn.inFace && load.faceBtn.w > 20 && load.faceBtn.h > 10, 'Print is on the face, in view: ' + JSON.stringify(load.faceBtn));
    const Mo = await p.evaluate(() => { const Mo = holdAssets(() => PL1267.model()); const f = v => money(v); return {tiles: [Mo.revNow, Mo.costNow, Mo.diffNow, Mo.revJob, Mo.costJob, Mo.diffJob].map(f), lines: Mo.groups.flatMap(g => g.lines).filter(l => !l.hours && l.now).map(l => f(l.now)), branches: Mo.branches.flatMap(b => [b.rev, b.cost, b.diff]).map(f), fin: Mo.L.cols.map(c => f(Mo.L.finCost[c])).concat(Mo.L.cols.map(c => f(Mo.L.finRev[c])))}; });
    /* one print: press the button, the recorder sees the state, the PDF is made from it, then the print closes */
    const onePrint = async (label, press, n) => {
      await press();
      await p.waitForFunction(k => window.__prints.length >= k, n, {timeout: 10000});
      const at = await p.evaluate(k => window.__prints[k - 1], n);
      check(at.armed && at.costPage && at.printingCosts && at.foldsOpen && !at.ask, `${label}: the browser’s print was reached with the flag, the costs rule, the landscape page and the working open, no question asked: ` + JSON.stringify(at));
      const file = path.join(out, `print_${label}.pdf`);
      await p.pdf({path: file, format: 'A4', landscape: true, printBackground: true, preferCSSPageSize: true});
      const text = pdfText(file), flat = text.replace(/\s+/g, ' '), pages = text.split('\f').filter(x => x.trim()).length;
      /* the eyebrows are letter-spaced, so the PDF's text reads them a letter at a time: headings are matched with the spaces out */
      const tight = text.replace(/\s+/g, ''), has = h => tight.includes(h.replace(/\s+/g, ''));
      const missing = [...Mo.tiles, ...Mo.lines, ...Mo.branches, ...Mo.fin].filter(v => !flat.includes(v));
      check(!/Not printed|tick the twin-steer check/i.test(flat), `${label}: not one word of the refusal page in the PDF`);
      const heads = ['P&L · WHOLE JOB', 'WHAT WE CHARGE THE V8S', 'WHERE THE COSTS ARE', 'BY BRANCH · JOB END · THE MANAGEMENT VIEW', 'NOT IN IT YET', 'Finance’s invoicing view, and the bridge to the management view'];
      check(heads.every(has), `${label}: every heading of the face and the bridge are on the paper: missing ` + JSON.stringify(heads.filter(h => !has(h))));
      check(/AUD\s+EX\s+GST/.test(flat) && /AS AT \w+ \d+ \w+ \d{4}/i.test(flat) && /WHAT WE CHARGE THE V8S/.test(flat), `${label}: the PDF's text reads the basis and the headings as words (for searching and copying): ` + (flat.match(/P&\s?L[^$]{0,80}/) || [''])[0]);
      check(missing.length === 0, `${label}: every tile figure, every cost line so far, every branch figure and Finance’s view are on the paper: missing ` + JSON.stringify(missing));
      check(!/Workings|Finance’s lines|Fencing, everything included|THE SAME FIGURES ON THE LEDGER/.test(flat) && !has('THESAMEFIGURESONTHELEDGER'), `${label}: the folds stay on the screen`);
      const strip = stripByPage(file), sm = strip.match(/^(\d+) \[([\d, ]+)\]$/);
      check(sm && Number(sm[1]) === pages && sm[2].split(',').every(x => Number(x) >= 1), `${label}: the twin-steer rule runs down the edge of every page: ` + strip);
      check(pages >= 1 && pages <= 4, `${label}: the P&L prints on a few landscape pages: ` + pages);
      await p.evaluate(() => window.dispatchEvent(new Event('afterprint')));
      await p.waitForTimeout(1300);
      const after = await p.evaluate(() => ({armed: document.documentElement.classList.contains('ts1053-armed'), costPage: !!document.getElementById('costPage'), printingCosts: document.body.classList.contains('printing-costs'), work: document.getElementById('pl1267-work').open, fin: document.getElementById('pl1267-finance').open, strip: (document.getElementById('ts1053-strip') || {}).textContent || ''}));
      check(after.armed && !after.costPage && !after.printingCosts && !/Checked by/.test(after.strip), `${label}: after the print the page tidies and the flag stays for the next one: ` + JSON.stringify(after));
      lines.push(`${label}: ${pages} pages, ${fs.statSync(file).size} bytes · strip ${strip} · at print ${JSON.stringify(at)} · after ${JSON.stringify(after)}`);
      if (dir) { fs.writeFileSync(path.join(dir, `print_${label}.txt`), text);
        execSync(`python3 -I - "${file}" "${dir}" "${label}" <<'PY'
import sys, pymupdf
doc = pymupdf.open(sys.argv[1])
for i, pg in enumerate(doc): pg.get_pixmap(dpi=110).save(f'{sys.argv[2]}/print_{sys.argv[3]}_p{i + 1}.png')
PY`); }
      return after;
    };
    /* 1. the face's Print */
    await onePrint('face', () => p.click('#pl1267-print'), 1);
    /* 2. the Workings' Print, where it has always been (Workings open, as a person would have it) */
    const after1 = await p.evaluate(() => document.getElementById('pl1267-work').open);
    check(after1 === false, 'Workings closed again after the face’s print, as it was before');
    await p.evaluate(() => { document.getElementById('pl1267-work').open = true; });
    await p.waitForTimeout(300);
    const a2 = await onePrint('workings', () => p.click('#printCosts'), 2);
    check(a2.work === true, 'Workings stays open after its own print, as the person left it');
    /* 3. Ctrl+P reaches the print with the flag on */
    await p.keyboard.press('Control+KeyP');
    await p.waitForFunction(() => window.__prints.length >= 3, null, {timeout: 10000});
    const ctrl = await p.evaluate(() => window.__prints[2]);
    check(ctrl.armed && !ctrl.ask, 'Ctrl+P reaches the print with the flag on: ' + JSON.stringify(ctrl));
    check(s.errors.length === 0 && cons.length === 0, 'no page errors or console errors: ' + JSON.stringify(s.errors.slice(0, 2)) + JSON.stringify(cons.slice(0, 2)));
    check(s.counts.blocked === 0, 'no write attempted: ' + s.counts.blocked);
    lines.unshift(`v12.71 print: ${checks}/${checks} checks passed`);
    lines.push('load: ' + JSON.stringify(load));
    if (dir) fs.writeFileSync(path.join(dir, 'test_print.txt'), lines.join('\n') + '\n');
    console.log(lines[0]);
  } catch (e) {
    console.error(`v12.71 print: FAILED after ${checks} checks: ${e.message}`); process.exitCode = 1;
    if (dir) { try { fs.writeFileSync(path.join(dir, 'test_print_FAILED.txt'), e.message + '\n' + lines.join('\n') + '\n'); } catch (_) {} }
  } finally { await s.browser.close(); }
})();
