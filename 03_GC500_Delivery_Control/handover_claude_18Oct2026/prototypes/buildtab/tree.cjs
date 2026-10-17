/* node tree.cjs profile lines.json [minMs=20] [maxDepth=30] [rootRegex] : top-down tree, merged by function per parent */
const fs = require('fs');
const [,, file, linesFile, minS, depthS, rootRe] = process.argv; const MIN = +(minS || 20), MAXD = +(depthS || 30);
const prof = JSON.parse(fs.readFileSync(file, 'utf8')); const LINES = JSON.parse(fs.readFileSync(linesFile, 'utf8'));
const scriptOf = ln => { for (const [i, id, s, e] of LINES) if (ln >= s && ln <= e) return i + ':' + id.replace(/-script$/, ''); return '?'; };
const nodes = new Map(); prof.nodes.forEach(n => nodes.set(n.id, n));
const self = new Map(); for (let i = 0; i < prof.samples.length; i++) { const d = (prof.timeDeltas[i + 1] || 0) / 1000; self.set(prof.samples[i], (self.get(prof.samples[i]) || 0) + d); }
const label = id => { const c = nodes.get(id).callFrame; return (c.functionName || '(anon)') + (c.url ? '@' + scriptOf(c.lineNumber) + ':' + c.lineNumber : ''); };
// build merged tree: key path by labels
function mergeChildren(ids) { const m = new Map(); for (const id of ids) { const l = label(id); if (!m.has(l)) m.set(l, []); m.get(l).push(id); } return m; }
function inclOf(ids) { let t = 0; const st = [...ids]; while (st.length) { const x = st.pop(); t += self.get(x) || 0; st.push(...(nodes.get(x).children || [])); } return t; }
function selfOf(ids) { return ids.reduce((a, x) => a + (self.get(x) || 0), 0); }
function walk(ids, d, ind) { if (d > MAXD) return; const m = mergeChildren(ids.flatMap(x => nodes.get(x).children || []));
  [...m.entries()].map(([l, g]) => [l, g, inclOf(g)]).filter(x => x[2] >= MIN).sort((a, b) => b[2] - a[2]).forEach(([l, g, t]) => { console.log(ind + t.toFixed(0).padStart(6) + ' (' + selfOf(g).toFixed(0) + ') ' + l); walk(g, d + 1, ind + ' '); }); }
let roots = [prof.nodes[0].id];
if (rootRe) { const R = new RegExp(rootRe); const found = prof.nodes.filter(n => R.test(label(n.id))).map(n => n.id);
  // keep only outermost
  const parent = new Map(); prof.nodes.forEach(n => (n.children || []).forEach(c => parent.set(c, n.id)));
  roots = found.filter(id => { let a = parent.get(id); while (a !== undefined) { if (R.test(label(a))) return false; a = parent.get(a); } return true; });
  const m = mergeChildren(roots); for (const [l, g] of m) { console.log(inclOf(g).toFixed(0).padStart(6) + ' ' + l); walk(g, 1, ' '); } }
else walk(roots, 0, '');
