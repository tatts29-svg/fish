const fs = require('fs');
function selfBy(file) { const p = JSON.parse(fs.readFileSync(file)); const nodes = new Map(); p.nodes.forEach(n => nodes.set(n.id, n)); const self = {}; const parent = new Map(); p.nodes.forEach(n => (n.children || []).forEach(c => parent.set(c, n.id)));
  for (let i = 0; i < p.samples.length; i++) { const d = (p.timeDeltas[i + 1] || 0) / 1000; const n = nodes.get(p.samples[i]); const k = n.callFrame.functionName || '(anon)'; self[k] = (self[k] || 0) + d; }
  // inclusive by name (outermost only)
  const incl = {}; const inc = new Map(); const sub = id => { let t = 0; const n = nodes.get(id); for (let i = 0; i < 0; i++); return t; };
  return {self}; }
const a = selfBy(process.argv[2]).self, b = selfBy(process.argv[3]).self;
const names = process.argv[4].split(',');
for (const n of names) console.log(n.padEnd(28), String(Math.round(a[n] || 0)).padStart(6), '->', String(Math.round(b[n] || 0)).padStart(6));
