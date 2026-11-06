// diff two parity captures pane by pane (line level), printing differing lines
const [A, B] = process.argv.slice(2).map(f => require(require('path').resolve(f)));
const norm = s => String(s == null ? '' : s).split('\n');
let total = 0;
const cmp = (name, a, b) => { const x = norm(a), y = norm(b); if (a === b) return; const sx = new Set(x), sy = new Set(y);
  const onlyA = x.filter(l => !sy.has(l)), onlyB = y.filter(l => !sx.has(l)); total++;
  console.log(`--- ${name}: lines ${x.length} vs ${y.length}; only-A ${onlyA.length}, only-B ${onlyB.length}`);
  onlyA.slice(0, 6).forEach(l => console.log('   A: ' + l.slice(0, 200))); onlyB.slice(0, 6).forEach(l => console.log('   B: ' + l.slice(0, 200))); };
cmp('first.text', A.first.text, B.first.text); cmp('first.head', A.first.head, B.first.head); cmp('first.foot', A.first.foot, B.first.foot);
for (const k of A.tabs) cmp('pane ' + k, A.panes[k], B.panes[k]);
if (A.full && B.full) for (const k of A.tabs) { const a = A.full[k] || '', b = B.full[k] || ''; if (a !== b) { let i = 0; while (i < a.length && a[i] === b[i]) i++; console.log('--- FULL textContent ' + k + ': ' + a.length + ' vs ' + b.length + ' first diff at ' + i + '\n   A: ' + a.slice(Math.max(0, i - 80), i + 120) + '\n   B: ' + b.slice(Math.max(0, i - 80), i + 120)); total++; } }
console.log('differing:', total, 'errors A', A.errors.length, 'B', B.errors.length, JSON.stringify(A.errors).slice(0, 300), JSON.stringify(B.errors).slice(0, 300));
console.log('sizes', A.tabs.map(k => k + ':' + String(A.panes[k] || '').length + '/' + String(B.panes[k] || '').length).join(' '));
