// compare whole-run self time per function (from analyze.cjs output: report.whole is top-N only, so recompute here)
// usage: node selfcmp.cjs a.an.json b.an.json
const [a, b] = process.argv.slice(2).map(f => require(require('path').resolve(f)));
const m = r => Object.fromEntries(r.whole.self.map(([v, k]) => [k, v]));
const A = m(a), B = m(b); const keys = [...new Set([...Object.keys(A), ...Object.keys(B)])];
keys.sort((x, y) => (A[y] || 0) - (A[x] || 0)).forEach(k => console.log(String(A[k] ?? '-').padStart(7), String(B[k] ?? '-').padStart(7), k));
console.log('long tasks A', JSON.stringify(a.allLong.filter(x => x[1] >= 300)));
console.log('long tasks B', JSON.stringify(b.allLong.filter(x => x[1] >= 300)));
