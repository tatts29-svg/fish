const [a, b] = process.argv.slice(2).map(f => require(f));
let diffs = 0; const say = (...x) => { diffs++; console.log(...x); };
// clock
if (a.clock.length !== b.clock.length) say('clock length', a.clock.length, b.clock.length);
a.clock.forEach((x, i) => { const y = b.clock[i]; x[2].forEach((h, j) => { if (h !== y[2][j]) say('CLOCK DIFF', x[0], x[1], j, '\n  A', (h || '').slice(0, 300), '\n  B', (y[2][j] || '').slice(0, 300)); }); });
console.log('clock snapshots compared:', a.clock.length * 5);
// tabs
const ks = new Set([...Object.keys(a.tabs), ...Object.keys(b.tabs)]);
for (const k of ks) { const x = a.tabs[k], y = b.tabs[k]; if (!x || !y) { say('tab missing', k); continue; }
 for (const f of ['text', 'full', 'n', 'bars', 'barsShown']) if (x[f] !== y[f]) { if (typeof x[f] === 'string') { let i = 0; while (i < x[f].length && x[f][i] === y[f][i]) i++; say('TAB DIFF', k, f, 'at', i, '\n  A', JSON.stringify(x[f].slice(Math.max(0, i - 80), i + 120)), '\n  B', JSON.stringify(y[f].slice(Math.max(0, i - 80), i + 120))); } else say('TAB DIFF', k, f, x[f], y[f]); } }
console.log('tabs compared:', ks.size, Object.keys(a.tabs).map(k => k + ':' + (a.tabs[k] ? a.tabs[k].text.length : 0)).join(' '));
if (a.footer !== b.footer) say('FOOTER', a.footer, '|', b.footer);
console.log('bars A', JSON.stringify(a.bars.map(x => [x[0], x[1].n, x[1].shown])), '\nbars B', JSON.stringify(b.bars.map(x => [x[0], x[1].n, x[1].shown])));
a.bars.forEach((x, i) => { const y = b.bars[i]; if (JSON.stringify(x) !== JSON.stringify(y)) say('BARS DIFF', x[0], JSON.stringify(x[1]).slice(0, 300), JSON.stringify(y[1]).slice(0, 300)); });
console.log('fold A', JSON.stringify(a.fold), '\nfold B', JSON.stringify(b.fold), 'versions', a.version, a.version2, b.version, b.version2);
if (a.fold.hash !== b.fold.hash) say('RECORD DIFF');
console.log(diffs ? 'DIFFS ' + diffs : 'PARITY OK');
