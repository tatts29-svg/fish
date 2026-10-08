// Author: Andrew Fisher. v9.16 showcase audit, M3: one table from the history probe's results (evidence/m3/*.json).
//   node tests/m3_summarise.cjs [evidence/m3] > evidence/m3/summary.json   (also prints a plain table)
// Per build and profile, the median over the repeats (and the min-max spread) of each figure. The device-independent
// figures (draws, vertices and GL calls per frame, upload bytes, compiles, intervals, heap, nodes) come first; wall
// frames and JS ms are relative only (SwiftShader software GL, shared CPU).
const fs = require('fs'), path = require('path');
const DIR = process.argv[2] || path.join(__dirname, '..', 'evidence', 'm3');
const files = fs.readdirSync(DIR).filter(f => /^(laptop|phone)\d_.+_r\d+\.json$/.test(f));
const med = a => { const s = a.filter(x => x != null && !Number.isNaN(x)).sort((x, y) => x - y); if (!s.length) return null; const m = s.length >> 1; return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2; };
const r = x => x == null ? null : Math.round(x * 100) / 100;
const groups = {};
for (const f of files) { const R = JSON.parse(fs.readFileSync(path.join(DIR, f), 'utf8')); const k = `${R.profile}${R.dpr}|${R.tag}`; (groups[k] = groups[k] || []).push(R); }
const ph = (R, n) => (R.phases || []).find(p => p.phase === n) || null;
const firstStep = R => { const p = (R.poll || []).find(x => x.step); return p ? p.at : null; };
const failAt = R => { const p = (R.poll || []).find(x => x.failed); return p ? p.at : null; };
const metrics = {
  'open: draws/frame (med)': R => ph(R, 'open') && ph(R, 'open').up3d.drawsPerFrame.med,
  'open: vertices/frame (med)': R => ph(R, 'open') && ph(R, 'open').up3d.vertsPerFrame.med,
  'open: GL calls/frame (med)': R => ph(R, 'open') && ph(R, 'open').up3d.glCallsPerFrame.med,
  'open: frames in window (wall, relative)': R => ph(R, 'open') && ph(R, 'open').frames,
  'open: frames with 3D up': R => ph(R, 'open') && ph(R, 'open').framesWith3dUp,
  'open: JS ms/frame (med)': R => ph(R, 'open') && ph(R, 'open').jsMsPerFrame.med,
  'open: JS ms/frame (max)': R => ph(R, 'open') && ph(R, 'open').jsMsPerFrame.max,
  'open: script ms/frame ex-GL (med)': R => ph(R, 'open') && ph(R, 'open').scriptMsExGlPerFrame.med,
  'open: main-thread busy %': R => ph(R, 'open') && ph(R, 'open').cdp.mainThreadBusyPct,
  'open: long tasks (n)': R => ph(R, 'open') && ph(R, 'open').longTasks.n,
  'open: long tasks total ms': R => ph(R, 'open') && ph(R, 'open').longTasks.totalMs,
  'open: longest task ms': R => ph(R, 'open') && ph(R, 'open').longTasks.maxMs,
  'open: buffer upload MB (phase)': R => ph(R, 'open') && ph(R, 'open').glTotals ? ph(R, 'open').glTotals.bufB / 1048576 : null,
  'open: texture upload MB (phase)': R => ph(R, 'open') && ph(R, 'open').glTotals ? ph(R, 'open').glTotals.texB / 1048576 : null,
  'open: shader compiles (phase)': R => ph(R, 'open') && ph(R, 'open').glTotals ? ph(R, 'open').glTotals.compiles : null,
  'showOpen() ms (sync)': R => R.showOpenMs,
  'open: heap MB at end': R => ph(R, 'open') && ph(R, 'open').cdp.heapUsedMB1,
  'open: DOM nodes at end': R => ph(R, 'open') && ph(R, 'open').cdp.nodes1,
  'open: live intervals': R => ph(R, 'open') && (ph(R, 'open').intervals || []).length,
  'open: first quality step at s': firstStep,
  'open: 3D handed back (failed) at s': failAt,
  'before: main-thread busy %': R => ph(R, 'before') && ph(R, 'before').cdp.mainThreadBusyPct,
  'before: frames (wall)': R => ph(R, 'before') && ph(R, 'before').frames,
  'before: heap MB': R => ph(R, 'before') && ph(R, 'before').cdp.heapUsedMB1,
  'before: DOM nodes': R => ph(R, 'before') && ph(R, 'before').cdp.nodes1,
  'before: live intervals': R => ph(R, 'before') && (ph(R, 'before').intervals || []).length,
  'load to ready s': R => R.loadS,
  'page MB': R => R.page.bytes / 1048576,
  'blocked writes': R => R.counts && R.counts.blocked,
  'page errors': R => (R.pageErrors || []).length};
const out = {author: 'Andrew Fisher', tool: 'v9.16 m3_summarise.cjs', note: 'median over repeats [min-max]; SwiftShader software GL, shared CPU: wall frames and ms are relative only', groups: {}};
for (const [k, Rs] of Object.entries(groups).sort()) {
  const g = out.groups[k] = {repeats: Rs.length, rounds: Rs.map(R => R.round), sha: Rs[0].page.sha256.slice(0, 12), final: Rs.map(R => R.final && {q: R.final.q, step: R.final.step, failed: R.final.failed, up: R.final.up}), metrics: {}};
  for (const [name, fn] of Object.entries(metrics)) { const v = Rs.map(R => { try { return fn(R); } catch (e) { return null; } }).filter(x => x != null);
    g.metrics[name] = v.length ? {med: r(med(v)), min: r(Math.min(...v)), max: r(Math.max(...v))} : null; }
  const open = Rs.map(R => ph(R, 'open')).filter(Boolean);
  const raf = {}, tim = {}; for (const p of open) { for (const x of p.rafTop || []) { raf[x.label] = (raf[x.label] || 0) + x.ms / open.length; } for (const x of p.timerTop || []) { tim[x.label] = (tim[x.label] || 0) + x.ms / open.length; } }
  g.openRafMs = Object.entries(raf).sort((a, b) => b[1] - a[1]).slice(0, 8).map(([l, v]) => [l, r(v)]);
  g.openTimerMs = Object.entries(tim).sort((a, b) => b[1] - a[1]).slice(0, 10).map(([l, v]) => [l, r(v)]);
  g.openIntervals = (open[0] && open[0].intervals || []).map(x => x[0] + ' every ' + x[1] + ' ms');
  g.captured = Rs.map(R => R.captured).filter(Boolean)[0] || null;
}
fs.writeFileSync(path.join(DIR, 'summary.json'), JSON.stringify(out, null, 1));
const keys = Object.keys(out.groups);
const fmt = m => m == null ? '-' : (m.min === m.max ? String(m.med) : `${m.med} [${m.min}-${m.max}]`);
for (const prof of [...new Set(keys.map(k => k.split('|')[0]))]) {
  const ks = keys.filter(k => k.startsWith(prof + '|'));
  console.log('\n=== ' + prof + '   ' + ks.map(k => k.split('|')[1] + ' (n=' + out.groups[k].repeats + ')').join('   '));
  for (const name of Object.keys(metrics)) console.log(name.padEnd(42) + ks.map(k => fmt(out.groups[k].metrics[name]).padEnd(30)).join(''));
}
