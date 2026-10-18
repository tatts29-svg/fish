/* node callers.cjs profile.cpuprofile lines.json 'regex on fn@line' [depth=6] : stacks (callers) leading to matching frames, by time spent under them */
const fs = require('fs');
const [,, file, linesFile, re, depthS] = process.argv; const depth = +(depthS || 6);
const prof = JSON.parse(fs.readFileSync(file, 'utf8')); const LINES = JSON.parse(fs.readFileSync(linesFile, 'utf8'));
const scriptOf = ln => { for (const [i, id, s, e] of LINES) if (ln >= s && ln <= e) return i + ':' + id; return '?'; };
const nodes = new Map(); prof.nodes.forEach(n => nodes.set(n.id, n)); const parent = new Map(); prof.nodes.forEach(n => (n.children || []).forEach(c => parent.set(c, n.id)));
const self = new Map(); for (let i = 0; i < prof.samples.length; i++) { const d = (prof.timeDeltas[i + 1] || 0) / 1000; self.set(prof.samples[i], (self.get(prof.samples[i]) || 0) + d); }
const label = id => { const c = nodes.get(id).callFrame; return (c.functionName || '(anon)') + (c.url ? '@' + scriptOf(c.lineNumber) + ':' + c.lineNumber : ''); };
// inclusive time per node
const incl = new Map(); const sub = id => { let t = self.get(id) || 0; for (const c of nodes.get(id).children || []) t += sub(c); incl.set(id, t); return t; }; sub(prof.nodes[0].id);
const R = new RegExp(re); const agg = {};
for (const n of prof.nodes) { if (!R.test(label(n.id))) continue; // skip if an ancestor also matches (avoid double count)
  let a = parent.get(n.id), dup = false; while (a !== undefined) { if (R.test(label(a))) { dup = true; break; } a = parent.get(a); } if (dup) continue;
  const chain = []; let x = n.id; for (let i = 0; i < depth && x !== undefined; i++) { chain.push(label(x)); x = parent.get(x); }
  const k = chain.join(' < '); agg[k] = (agg[k] || 0) + incl.get(n.id); }
Object.entries(agg).sort((a, b) => b[1] - a[1]).slice(0, 25).forEach(([k, v]) => console.log(v.toFixed(1).padStart(8), k));
