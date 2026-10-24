// Author: Andrew Fisher. v11.91 rules: the build is the live page plus the build-fold block, the slim-header fix and the footer only;
// the bar's words; the slim header's rule.
//   PAGE=build/GC500_v11.91/GC500_Delivery_Control_hosted.html BASE=build/GC500_v11.91/base_live.html node tests/test_rules1191.cjs
const assert = require('node:assert/strict'), fs = require('node:fs'), vm = require('node:vm'), path = require('node:path');
const dir = path.resolve(__dirname, '..'), page = fs.readFileSync(process.env.PAGE, 'utf8'), base = fs.readFileSync(process.env.BASE, 'utf8');
let checks = 0; const check = (ok, msg) => { assert(ok, msg); checks++; };
const i = page.indexOf('<style id="build1191-style">'), j = page.indexOf('<script id="steady1143-script">', i);
check(i > 0 && j > i, 'one v11.91 block, before the anchor');
const src = fs.readFileSync(path.join(dir, 'build1191_src.js'), 'utf8'), css = fs.readFileSync(path.join(dir, 'build1191.css'), 'utf8');
const block = page.slice(i, j);
check(block === '<style id="build1191-style">\n' + css + '</style>\n<script id="build1191-script">\n' + src + '\n</script>\n', 'the block is this folder\'s css and source exactly');
const SLIM_OLD = " let slim = false; const on = () => { const y = m.scrollTop; if (!slim && y > 90) { slim = true; h.classList.add('slim89'); } else if (slim && y < 12) { slim = false; h.classList.remove('slim89'); } };\n";
const SLIM_NEW = " let slim = false, short = ''; const on = () => { const y = m.scrollTop, size = m.scrollHeight + 'x' + m.clientHeight; if (!slim && y > 90 && size !== short) { slim = true; h.classList.add('slim89'); if (m.scrollHeight - m.clientHeight < 12) { slim = false; h.classList.remove('slim89'); short = size; m.scrollTop = y; } } else if (slim && y < 12) { slim = false; h.classList.remove('slim89'); } }; /* v11.91 - a page too short to stay scrolled once the header slims keeps the full header (it flipped back and forth) */\n";
check(base.split(SLIM_OLD).length === 2 && page.split(SLIM_NEW).length === 2 && !page.includes(SLIM_OLD), 'the one v7.89 slim-header line is replaced');
check(page.replace(block, '').replace(SLIM_NEW, SLIM_OLD).replace("+' · v11.91'; /* v8.19 release922", "+' · v11.90'; /* v8.19 release922") === base, 'the build is the live page plus the block, the slim-header line and the footer only');
check(page.indexOf('var TodayWork840 = (() => {') < i && page.indexOf('function go(tab){') < i, 'Today\'s board and go() load before it');

// The hiding is the screen only, for the four parts on Today, and only while the fold is not open.
check(/@media screen \{[\s\S]*#pane-today > #where885,[\s\S]*#pane-today > #gc500-work-board840,[\s\S]*#pane-today > #ms1025,[\s\S]*#pane-today > #pane-progress \{ display: none !important; \}/.test(css), 'four parts hidden on the screen only');
check((css.match(/html:not\(\[data-build1191="open"\]\)/g) || []).length === 4, 'every hiding rule depends on the fold being closed');
check(/@media print \{ #build1191 \{ display: none !important; \} \}/.test(css) && !/@media print[\s\S]*#gc500-work-board840/.test(css), 'paper: the bar is left off, the build parts print as before');

const ctx = {module: {exports: {}}}; vm.runInNewContext(src, ctx); const B = ctx.module.exports;
check(B.PARTS.join() === 'where885,gc500-work-board840,ms1025,pane-progress' && B.KEY === 'gc500.build1191', 'the four parts and the device key');
const all = B.facts(7, 0), some = B.facts(7, 2), none = B.facts(0, 0);
check(all.done && all.reached === 7 && some.reached === 5 && !some.done && !none.done && none.areas === 0, 'the count is the Milestones section\'s own');
check(B.facts(3, 9).reached === 0 && B.facts(-2, 0).areas === 0, 'odd counts stay sensible');
const w1 = B.words(all, false), w2 = B.words(some, true), w3 = B.words(none, false);
check(w1.title === 'Build complete' && w1.sub === '7 of 7 areas at 100% · Where we are, Work progress, Milestones and By group' && w1.act === 'Show', 'all done: Build complete, 7 of 7');
check(w2.title === 'Build progress' && w2.sub.startsWith('5 of 7 areas at 100%') && w2.act === 'Hide', 'not all done: Build progress, never "complete"');
check(w3.title === 'Build progress' && w3.sub === 'Where we are, Work progress, Milestones and By group', 'no count to show: no number made up');

// The slim header, run on a stand-in main and header: as before where there is room; never flipping where there is not.
const slimLine = SLIM_NEW.slice(0, SLIM_NEW.indexOf(' /* v11.91'));
function stand(full, slimmed, client) {                 // content heights; the client height grows by 170 px when the header slims
  const cls = new Set(), h = {classList: {add: c => cls.add(c), remove: c => cls.delete(c), contains: c => cls.has(c)}};
  const m = {_t: 0, get clientHeight() { return client + (cls.has('slim89') ? 170 : 0); }, get scrollHeight() { return cls.has('slim89') ? slimmed : full; },
    get scrollTop() { return this._t; }, set scrollTop(v) { this._t = Math.max(0, Math.min(v, this.scrollHeight - this.clientHeight)); }};
  const on = new Function('m', 'h', slimLine + ' return on;')(m, h);
  return {m, h, cls, scroll(v) { m.scrollTop = v; on(); on(); }};
}
const roomy = stand(2000, 2000, 660); roomy.scroll(300);
check(roomy.cls.has('slim89') && roomy.m.scrollTop === 300, 'a long page: the header slims past 90 px, as before');
roomy.scroll(5); check(!roomy.cls.has('slim89'), 'and comes back at the top, as before');
const tight = stand(800, 800, 660); tight.scroll(120);
check(!tight.cls.has('slim89') && tight.m.scrollTop === 120, 'a page with 140 px to scroll: the full header stays and the scroll holds at 120 px');
tight.scroll(140); check(!tight.cls.has('slim89') && tight.m.scrollTop === 140, 'and scrolls to its foot without flipping');
console.log(JSON.stringify({checks}));
