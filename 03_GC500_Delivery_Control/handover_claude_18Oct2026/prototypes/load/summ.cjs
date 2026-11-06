const fs = require('fs'); const rows = fs.readFileSync(process.argv[2], 'utf8').split('\n').filter(l => l.startsWith('{')).map(JSON.parse);
const by = {}; rows.forEach(r => (by[r.page] = by[r.page] || []).push(r));
const med = a => { const s = a.filter(x => x != null && !isNaN(x)).sort((x, y) => x - y), n = s.length; return !n ? null : n % 2 ? s[(n - 1) / 2] : Math.round((s[n / 2 - 1] + s[n / 2]) / 2); };
for (const [pg, L] of Object.entries(by)) {
  const f = k => L.map(k);
  console.log(pg.padEnd(22), 'n=' + L.length, 'dcl', med(f(r => r.marks.dcl)), 'load', med(f(r => r.marks.load)), 'reveal', med(f(r => r.marks.reveal)), 'settled', med(f(r => r.settled)),
    'ltTotal', med(f(r => r.ltTotal)), 'big>=300', med(f(r => r.bigTotal)), 'n', med(f(r => r.bigN)), 'max', med(f(r => r.max)), "cls", f(r => r.cls).sort()[Math.floor(L.length/2)], 'err', L.map(r => r.errors).join('/'), 'tmo', L.filter(r => r.timeout).length);
  L.forEach(r => console.log('    reveal', r.marks.reveal, 'settled', r.settled, 'big', r.big, 'tabs', JSON.stringify(r.tabs)));
}
