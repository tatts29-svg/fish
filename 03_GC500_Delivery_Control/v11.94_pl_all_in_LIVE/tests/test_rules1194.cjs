// Author: Andrew Fisher. v11.94 rules: the build is the live page plus the P&L all-in block, the two label-map lines and the footer
// only; the statement on today's own figures, to the cent; a statement that does not tie is never shown; what is not in it yet.
//   PAGE=build/GC500_v11.94/GC500_Delivery_Control_hosted.html BASE=build/GC500_v11.94/base_live.html node tests/test_rules1194.cjs
const assert = require('node:assert/strict'), fs = require('node:fs'), vm = require('node:vm'), path = require('node:path');
const dir = path.resolve(__dirname, '..'), page = fs.readFileSync(process.env.PAGE, 'utf8'), base = fs.readFileSync(process.env.BASE, 'utf8');
let checks = 0; const check = (ok, msg) => { assert(ok, msg); checks++; };
const i = page.indexOf('<style id="pl1194-style">'), j = page.indexOf('<script id="steady1143-script">', i);
check(i > 0 && j > i, 'one v11.94 block, before the anchor');
const src = fs.readFileSync(path.join(dir, 'pl1194_src.js'), 'utf8'), css = fs.readFileSync(path.join(dir, 'pl1194.css'), 'utf8');
const block = page.slice(i, j);
check(block === '<style id="pl1194-style">\n' + css + '</style>\n<script id="pl1194-script">\n' + src + '\n</script>\n', 'the block is this folder\'s css and source exactly');
const MAP1_OLD = "    'Still to come': 'Additional forecast', 'To job end': 'Job forecast', 'Of which to date': 'Current record',";
const MAP1_NEW = "    'Still to come': 'Rest of the job', 'To job end': 'Job total', 'Of which to date': 'Current record', 'Additional forecast': 'Rest of the job', 'Job forecast': 'Job total', 'Still to come — forecast': 'Rest of the job', /* v11.94 - all in */";
const MAP2_OLD = "    'Charged so far': 'Current record', 'Forecast to job end': 'Job forecast'};", MAP2_NEW = "    'Charged so far': 'Current record', 'Forecast to job end': 'Job total'};";
for (const [a, b, what] of [[MAP1_OLD, MAP1_NEW, 'the first label line'], [MAP2_OLD, MAP2_NEW, 'the second label line']])
  check(base.split(a).length === 2 && page.split(b).length === 2 && !page.includes(a), what + ': the one copy is replaced');
const back = page.replace(block, '').replace(MAP1_NEW, MAP1_OLD).replace(MAP2_NEW, MAP2_OLD).replace("+' · v11.94'; /* v8.19 release922", "+' · v11.93'; /* v8.19 release922");
check(back === base, 'the build is the live page plus the block, the two label lines and the footer only');
check(page.indexOf('pl770Card = function () {') < i && page.indexOf('<script id="pnl-clarity981-script">') < i, 'the P&L card and its clarity wrapper load before it, so this wrapper is the outermost');
check(!/pl770Model\(\)\s*=|cj764Model\(\)\s*=|S\.\w+\s*=|save\(|persist\(/.test(src.replace(/\/\*[\s\S]*?\*\//g, '')), 'presentation only: no model, record or storage is written');

// Today's own figures (pl770Model, cj764Model and branchFinancial978 on the live record, 25 Oct 2026 00:5x AEST).
const ctx = {module: {exports: {}}}; vm.runInNewContext(src, ctx); const PL = ctx.module.exports;
const m = {
  rev: [{code: '1005', job: 223277.89}, {code: '1010', job: 462981.91}, {code: '1030 · 1031', job: 125030.34}, {code: '1032', job: 80585.79}, {code: '1020', job: 4350},
    {code: '1047', job: 99306.9}, {code: '—', job: 19101.6}, {code: '1025', job: 8328}, {code: '1015', job: 0}],
  cost: [{code: '2126', job: 301283.18}, {code: '3325', job: 51372}, {code: '2144', job: 4850}, {code: '2120 · 2140', job: 56810.65}, {code: '2142', job: 21100}],
  revJob: 1022962.43, directJob: 435415.83, wagesJob: 82964.27, overJob: 29273.55, differenceJob: 475308.78, fenceRevenue: 26522.4, fenceCost: 10350, hoursText: '1,471.5'};
const R = PL.rows(m), by = Object.fromEntries(R.filter(r => r.label).map(r => [r.label, r]));
check(PL.checks(m).all, 'today\'s statement ties: revenue, direct costs and the difference to the cent');
check(by['Hire Revenue'].job === 223277.89 && by['Rehire Revenue'].job === 462981.91 && by['Transport Revenue'].job === 205616.13 && by['Other Revenue'].job === 111984.9 && by['Revenue · allocation pending'].job === 19101.6, 'the revenue lines, each the P&L card\'s own grouping');
check(by['Transport'].job === 108182.65 && by['Rehire'].job === 301283.18 && by['Other Direct Costs'].job === 25950, 'the direct-cost lines');
check(by['Total Revenue'].job === 1022962.43 && by['Total Direct Costs'].job === 435415.83 && by['Gross Margin · all in'].job === 587546.6 && by['Difference · all in, not a margin yet'].job === 475308.78, 'the totals: $1,022,962.43 · $435,415.83 · $587,546.60 · $475,308.78');
check(Math.abs(by['Gross Margin · all in'].pct - 0.5744) < 0.0001, 'Gross Margin 57.4% of Revenue');
const fenced = R.filter(r => r.fence).map(r => r.label + ' ' + r.fence);
check(JSON.stringify(fenced) === JSON.stringify(['Rehire Revenue 26522.4', 'Total Revenue 26522.4', 'Rehire 10350', 'Total Direct Costs 10350', 'Gross Margin · all in 16172.4', 'Difference · all in, not a margin yet 16172.4']), 'fencing is the only figure still to come: ' + fenced.join(' | '));
check(R.filter(r => r.label && !r.text && !r.fence).every(r => ['Hire Revenue', 'Transport Revenue', 'Other Revenue', 'Revenue · allocation pending', 'Transport', 'Other Direct Costs', 'Labour hire and salary allowance', 'Travel, accommodation, meals and printing'].includes(r.label)), 'every other line\'s still-to-come is nil');
check(by['Coates wages and salary'].text === '1,471.5 h on the running sheet, hours only, not priced (the project manager, 23 Oct 2026)', 'Coates wages stay hours, never dollars');
const bad = Object.assign({}, m, {revJob: m.revJob + 0.01}), badCost = Object.assign({}, m, {cost: m.cost.slice(1)}), badDiff = Object.assign({}, m, {differenceJob: m.differenceJob + 1});
check(!PL.checks(bad).all && !PL.checks(badCost).all && !PL.checks(badDiff).all, 'a cent out on revenue, a missing cost line or a difference that does not add up: the card is left as it was');
check(PL.checks(Object.assign({}, m, {fenceRevenue: undefined, fenceCost: undefined})).all && PL.rows(Object.assign({}, m, {fenceRevenue: undefined, fenceCost: undefined})).every(r => !r.fence), 'no fencing figure: nothing is still to come');
const named = PL.notYet([{what: '17 demob movements still unpriced'}, {what: ' Transport — final carrier figures '}, {why: 'no name'}, null], '1,471.5');
check(JSON.stringify(named) === JSON.stringify(['17 demob movements still unpriced', 'Transport — final carrier figures', 'Coates wages and salary, 1,471.5 h, hours only']), 'what is not in it yet, named from the cost gaps');
console.log(JSON.stringify({checks}));
