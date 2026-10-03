const {chromium} = require('playwright'); const fs = require('fs'); const AXE = fs.readFileSync(require.resolve('axe-core/axe.min.js'), 'utf8');
(async () => { const b = await chromium.launch({executablePath: '/opt/pw-browsers/chromium', args: ['--no-sandbox']}); const p = await (await b.newContext({viewport: {width: 1366, height: 768}})).newPage();
  await p.goto(process.argv[2] + '#today', {waitUntil: 'load'}); await p.waitForTimeout(2500); await p.addScriptTag({content: AXE});
  const out = {};
  for (const [t, sel] of [['header', 'header.top'], ['progress', '#pane-progress'], ['docs', '#pane-docs'], ['pricing', '#pane-pricing'], ['about', '#pane-about'], ['today', '#pane-today']]) {
    if (t !== 'header') { await p.evaluate(t => go(t), t); await p.waitForTimeout(1200); }
    out[t] = await p.evaluate(async sel => (await axe.run(document.querySelector(sel), {runOnly: ['wcag2a', 'wcag2aa']})).violations.map(v => ({id: v.id, n: v.nodes.length, ex: v.nodes.slice(0, 3).map(x => x.target.join(' ') + ' :: ' + (x.failureSummary || '').slice(0, 160))})), sel); }
  console.log(JSON.stringify(out, null, 1)); await b.close(); })();
