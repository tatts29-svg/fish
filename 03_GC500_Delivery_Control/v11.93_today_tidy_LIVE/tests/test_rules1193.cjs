// Author: Andrew Fisher. v11.93 rules: the build is the live page plus the Today part 2 block, the three one-line changes and the
// footer only; the name rule; what the device remembers; the count the Build complete bar takes.
//   PAGE=build/GC500_v11.93/GC500_Delivery_Control_hosted.html BASE=build/GC500_v11.93/base_live.html node tests/test_rules1193.cjs
const assert = require('node:assert/strict'), fs = require('node:fs'), vm = require('node:vm'), path = require('node:path');
const dir = path.resolve(__dirname, '..'), page = fs.readFileSync(process.env.PAGE, 'utf8'), base = fs.readFileSync(process.env.BASE, 'utf8');
let checks = 0; const check = (ok, msg) => { assert(ok, msg); checks++; };
const i = page.indexOf('<style id="today1193-style">'), j = page.indexOf('<script id="steady1143-script">', i);
check(i > 0 && j > i, 'one v11.93 block, before the anchor');
const src = fs.readFileSync(path.join(dir, 'today1193_src.js'), 'utf8'), css = fs.readFileSync(path.join(dir, 'today1193.css'), 'utf8');
const block = page.slice(i, j);
check(block === '<style id="today1193-style">\n' + css + '</style>\n<script id="today1193-script">\n' + src + '\n</script>\n', 'the block is this folder\'s css and source exactly');

const MS_OLD = " board.insertAdjacentHTML('afterend', sectionHtml(asOf));";
const MS_NEW = " /* v11.93 - the Milestones section is no longer drawn on Today (Andrew, 25 Oct 2026: \"Milestpne remove\"); the board's 100% badges and the celebration stay */";
const WORDS_OLD = "'Where we are, Work progress, Milestones and By group'", WORDS_NEW = "'Where we are, Work progress and By group'";
const COUNT_OLD = "  var ms = document.getElementById('ms1025');\n  var F = B.facts(ms ? ms.querySelectorAll('.ms1025-area').length : 0, ms ? ms.querySelectorAll('.ms1025-rest .ms1025-area').length : 0);";
const COUNT_NEW = "  var ms = document.getElementById('ms1025'), c = W.__ms1193; /* v11.93 - the Milestones code's own figures from Today's last redraw */\n  var F = c ? B.facts(c.total, c.rest) : B.facts(ms ? ms.querySelectorAll('.ms1025-area').length : 0, ms ? ms.querySelectorAll('.ms1025-rest .ms1025-area').length : 0);";
for (const [a, b, what] of [[MS_OLD, MS_NEW, 'the Milestones line'], [WORDS_OLD, WORDS_NEW, 'the bar\'s words'], [COUNT_OLD, COUNT_NEW, 'the bar\'s count']])
  check(base.split(a).length === 2 && page.split(b).length === 2 && !page.includes(a), what + ': the one copy is replaced');
const back = page.replace(block, '').replace(MS_NEW, MS_OLD).replace(WORDS_NEW, WORDS_OLD).replace(COUNT_NEW, COUNT_OLD)
  .replace("+' · v11.93'; /* v8.19 release922", "+' · v11.92'; /* v8.19 release922");
check(back === base, 'the build is the live page plus the block, the three lines and the footer only');
check(page.indexOf('W.MS1025 = {FORM') < i && page.indexOf('<script id="build1191-script">') < i && page.indexOf('function whoFocus(){') < i, 'Milestones, the Build complete bar and whoFocus load before it');

// The folds are the screen's only, for the two cards' bodies, and only while closed; paper leaves out only the buttons.
check(/@media screen \{[\s\S]*html:not\(\[data-t1193-staff="open"\]\) #pane-today > \.staff988 > :not\(\.staff988-heading\) \{ display: none !important; \}/.test(css), 'Available staff: everything below its heading folds on the screen');
check(/html:not\(\[data-t1193-team="open"\]\) #pane-today > \.hub > \.teamhub > :not\(\.hubtitle\) \{ display: none !important; \}/.test(css), 'Who to call: everything below its title folds on the screen');
check(/@media print \{ #pane-today \.t1193-btn \{ display: none !important; \} \}/.test(css) && !/@media print[^}]*staff988/.test(css), 'paper: only the buttons are left off');
check(!/save\(\)/.test(src.replace(/\/\*[\s\S]*?\*\//g, '')) && /persist\(\)/.test(src), 'the name is put right with persist() (this device) and never save() (the record)');

const ctx = {module: {exports: {}}}; vm.runInNewContext(src, ctx); const T = ctx.module.exports;
check(T.fixName('Andrew Fisherp') === 'Andrew Fisher' && T.fixName(' Andrew Fisherp ') === 'Andrew Fisher', 'the misspelt name is put right');
check(T.fixName('Andrew Fisher') === 'Andrew Fisher' && T.fixName('Kyle Gover') === 'Kyle Gover' && T.fixName('') === '' && T.fixName(null) === '', 'every other name is left as it is');
const r0 = T.remembered(null), r1 = T.remembered('{"staff":"open","team":"closed"}'), r2 = T.remembered('{bad json'), r3 = T.remembered('{"staff":true,"team":"open"}');
check(!r0.staff && !r0.team && r1.staff && !r1.team && !r2.staff && !r2.team && !r3.staff && r3.team, 'closed unless the device says "open"');
check(T.stored({staff: true, team: false}) === '{"staff":"open","team":"closed"}' && JSON.stringify(T.remembered(T.stored({staff: false, team: true}))) === '{"staff":false,"team":true}', 'what is kept reads back the same');
const c7 = T.count([{reached: true, total: 5}, {reached: true, total: 2}, {reached: false, total: 4}, {reached: false, total: 0}, null]);
check(c7.total === 3 && c7.rest === 1, 'the count: areas with a total, and those short of 100%');
check(JSON.stringify(T.count(undefined)) === '{"total":0,"rest":0}' && T.act(true) === 'Hide' && T.act(false) === 'Show', 'nothing to count is nothing; the button says Show / Hide');
console.log(JSON.stringify({checks}));
