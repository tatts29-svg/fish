// Attribute long tasks in a trace to inline scripts / functions using the trace's own CPU samples.
// usage: node analyze.cjs trace.json page.html [minMs=300] [topN=15]
const fs = require('fs');
const [TR, PAGE, MIN = '300', TOPN = '15'] = process.argv.slice(2);
const minUs = +MIN * 1000, topN = +TOPN;
// script map: line -> script idx/id
const html = fs.readFileSync(PAGE, 'utf8'); const scripts = [];
{ const re = /<script\b([^>]*)>/g; let m, line = 0, pos = 0; const lineAt = off => { for (; pos < off; pos++) if (html.charCodeAt(pos) === 10) line++; return line; };
  while ((m = re.exec(html))) { const a = m[1]; const st = m.index; const l0 = lineAt(st); const en = html.indexOf('</script>', m.index + m[0].length); const l1 = lineAt(en);
    const id = (a.match(/id="([^"]+)"/) || [])[1] || ''; const head = html.slice(m.index + m[0].length, m.index + m[0].length + 140).replace(/\s+/g, ' ');
    const ver = (head.match(/v(\d+\.\d+)/) || [])[1] || ''; scripts.push({i: scripts.length, l0, l1, id, ver, plain: /text\/plain/.test(a)}); re.lastIndex = en; } }
const scriptOf = line => { let best = null; for (const s of scripts) if (!s.plain && line >= s.l0 && line <= s.l1) best = s; return best; };
const tag = (url, line) => { if (!url || !/railway|Coates-GC500/.test(url)) return url ? url.replace(/^https?:\/\/[^/]+/, '').slice(0, 40) : '(native)'; const s = scriptOf(line); return s ? `S${s.i}${s.id ? '#' + s.id : ''}${s.ver ? ' v' + s.ver : ''}` : 'L' + line; };
let raw = fs.readFileSync(TR, 'utf8'); let J = JSON.parse(raw); raw = null; const E = Array.isArray(J) ? J : J.traceEvents; J = null;
// main thread of the renderer showing our page
const tnames = {}; E.forEach(e => { if (e.ph === 'M' && e.name === 'thread_name') tnames[e.pid + ':' + e.tid] = e.args.name; });
const mains = Object.keys(tnames).filter(k => tnames[k] === 'CrRendererMain');
const cnt = {}; E.forEach(e => { const k = e.pid + ':' + e.tid; if (mains.includes(k) && e.dur) cnt[k] = (cnt[k] || 0) + e.dur; });
const MAIN = Object.keys(cnt).sort((a, b) => cnt[b] - cnt[a])[0]; const [MP, MT] = MAIN.split(':').map(Number);
const ev = E.filter(e => e.pid === MP && e.tid === MT);
const navStart = (ev.find(e => e.name === 'navigationStart') || E.find(e => e.name === 'navigationStart' && e.pid === MP) || {}).ts || ev.filter(e => e.ts).reduce((a, e) => Math.min(a, e.ts), Infinity);
const rel = ts => Math.round((ts - navStart) / 1000);
// CPU profile
const profs = {}; E.forEach(e => { if (e.name === 'Profile' && e.pid === MP) profs[e.id] = {start: e.args.data.startTime, tid: e.tid, nodes: new Map(), samples: [], times: []}; });
E.forEach(e => { if (e.name === 'ProfileChunk' && e.pid === MP && profs[e.id]) { const P = profs[e.id], d = e.args.data; const cp = d.cpuProfile || {};
  (cp.nodes || []).forEach(n => P.nodes.set(n.id, n)); const td = d.timeDeltas || []; let t = P.times.length ? P.times[P.times.length - 1] : P.start;
  (cp.samples || []).forEach((s, i) => { t += td[i] || 0; P.samples.push(s); P.times.push(t); }); } });
const prof = Object.values(profs).sort((a, b) => b.samples.length - a.samples.length)[0];
const nodes = prof.nodes; const fkey = cf => `${cf.functionName || '(anon)'} @${tag(cf.url, cf.lineNumber)}:${cf.lineNumber + 1}`;
for (const n of nodes.values()) { if (n.parent != null) continue; } // parent given
const parentOf = new Map(); for (const n of nodes.values()) { if (n.parent != null) parentOf.set(n.id, n.parent); (n.children || []).forEach(c => parentOf.set(c, n.id)); }
const stackOf = id => { const st = []; for (let x = id; x != null; x = parentOf.get(x)) st.push(nodes.get(x)); return st; }; // leaf first
const sampleDur = []; for (let i = 0; i < prof.times.length; i++) sampleDur.push(i + 1 < prof.times.length ? Math.min(prof.times[i + 1] - prof.times[i], 20000) : 0);
function attribute(t0, t1) { const self = {}, incl = {}, scr = {}; let tot = 0;
  for (let i = 0; i < prof.times.length; i++) { const t = prof.times[i]; if (t < t0 || t >= t1) continue; const d = sampleDur[i]; const st = stackOf(prof.samples[i]); const leaf = st[0]; if (!leaf) continue; const lcf = leaf.callFrame;
    if (['(idle)', '(program)', '(root)'].includes(lcf.functionName) && !lcf.url) { const k = lcf.functionName; self[k] = (self[k] || 0) + d; tot += d; continue; }
    tot += d; const ks = fkey(lcf); self[ks] = (self[ks] || 0) + d; const seen = new Set(), seenS = new Set();
    for (const n of st) { const cf = n.callFrame; if (cf.functionName === '(root)') continue; const k = fkey(cf); if (!seen.has(k)) { seen.add(k); incl[k] = (incl[k] || 0) + d; }
      const sk = tag(cf.url, cf.lineNumber); if (cf.url && !seenS.has(sk)) { seenS.add(sk); scr[sk] = (scr[sk] || 0) + d; } } }
  const top = (o, n) => Object.entries(o).sort((a, b) => b[1] - a[1]).slice(0, n).map(([k, v]) => [Math.round(v / 1000), k]);
  return {sampledMs: Math.round(tot / 1000), self: top(self, topN), incl: top(incl, topN + 10), scripts: top(scr, 12)}; }
// long tasks
const tasks = ev.filter(e => (e.name === 'RunTask' || e.name === 'ThreadControllerImpl::RunTask') && e.ph === 'X' && e.dur >= 50000);
const uniq = []; tasks.sort((a, b) => a.ts - b.ts || b.dur - a.dur).forEach(t => { if (!uniq.length || t.ts >= uniq[uniq.length - 1].ts + uniq[uniq.length - 1].dur) uniq.push(t); });
const INTEREST = /^(EvaluateScript|FunctionCall|TimerFire|EventDispatch|FireAnimationFrame|FireIdleCallback|ParseHTML|Layout|UpdateLayoutTree|MajorGC|MinorGC|V8\.GC.*|v8\.compile|v8\.parseOnBackground|XHRReadyStateChange|XHRLoad|ResourceReceivedData|ResourceFinish|v8\.callFunction|PrePaint|Paint|Layerize|v8\.run|HitTest|RecalculateStyles|ScheduleStyleRecalculation|ParseAuthorStyleSheet|Decode.*|RunMicrotasks|v8\.evaluateModule|BlinkGC.*)$/;
const report = {main: MAIN, navStart, longTasks: []};
const timerInstalls = {}; ev.forEach(e => { if (e.name === 'TimerInstall') { const k = e.args.data.frame + ':' + e.args.data.timerId; (timerInstalls[k] = timerInstalls[k] || []).push(e); } });
const installOf = (d, ts) => { const L = timerInstalls[d.frame + ':' + d.timerId] || []; let b = null; for (const e of L) if (e.ts <= ts) b = e; return b; };
const rafReq = {}; ev.forEach(e => { if (e.name === 'RequestAnimationFrame') rafReq[e.args.data.id] = e; });
for (const t of uniq) { if (t.dur < minUs) continue;
  const kids = ev.filter(e => e.ph === 'X' && e.ts >= t.ts && e.ts < t.ts + t.dur && INTEREST.test(e.name) && e.dur >= 15000).map(e => { const d = e.args && (e.args.data || e.args.beginData) || {};
    let x = `${rel(e.ts)}ms +${Math.round(e.dur / 1000)} ${e.name}`;
    if (d.functionName != null || d.url) x += ` ${d.functionName || ''} ${tag(d.url, d.lineNumber)}:${(d.lineNumber || 0) + 1}`;
    if (d.timerId != null) { const ti = installOf(d, e.ts); x += ` timer#${d.timerId}`; if (ti) { const td = ti.args.data; x += ` (installed ${rel(ti.ts)}ms timeout=${td.timeout} single=${td.singleShot}` + (td.stackTrace ? ' by ' + td.stackTrace.slice(0, 4).map(f => `${f.functionName || '(anon)'}@${tag(f.url, f.lineNumber)}:${f.lineNumber + 1}`).join(' < ') : '') + ')'; } }
    if (d.type) x += ' ' + d.type; if (d.id != null && e.name === 'FireAnimationFrame') { const rq = rafReq[d.id]; if (rq && rq.args.data.stackTrace) x += ' raf by ' + rq.args.data.stackTrace.slice(0, 3).map(f => `${f.functionName || '(anon)'}@${tag(f.url, f.lineNumber)}:${f.lineNumber + 1}`).join(' < '); }
    if (e.name === 'ParseHTML' && d.startLine != null) x += ` lines ${d.startLine}-${(e.args.endData || {}).endLine}`;
    if (e.name === 'Layout' && e.args.beginData) x += ` dirty=${e.args.beginData.dirtyObjects}/${e.args.beginData.totalObjects}`;
    if (e.name === 'UpdateLayoutTree' && e.args.elementCount) x += ` elements=${e.args.elementCount}`;
    if (d.stackTrace && e.name !== 'TimerFire') x += ' by ' + d.stackTrace.slice(0, 3).map(f => `${f.functionName || '(anon)'}@${tag(f.url, f.lineNumber)}:${f.lineNumber + 1}`).join(' < ');
    return x; });
  // initiators for UpdateLayoutTree/Layout (forced sync layouts) inside
  const forced = {}; ev.filter(e => e.ph === 'X' && e.ts >= t.ts && e.ts < t.ts + t.dur && (e.name === 'Layout' || e.name === 'UpdateLayoutTree')).forEach(e => { const st = (e.args.beginData || {}).stackTrace || (e.args.data || {}).stackTrace || (e.args.beginData || {}).stack; const k = st && st.length ? `${e.name} by ${st[0].functionName || '(anon)'}@${tag(st[0].url, st[0].lineNumber)}:${st[0].lineNumber + 1}` : e.name + ' (no js)'; forced[k] = forced[k] || [0, 0]; forced[k][0]++; forced[k][1] += e.dur; });
  const forcedTop = Object.entries(forced).sort((a, b) => b[1][1] - a[1][1]).slice(0, 10).map(([k, v]) => `${Math.round(v[1] / 1000)}ms x${v[0]} ${k}`);
  report.longTasks.push({start: rel(t.ts), dur: Math.round(t.dur / 1000), events: kids.slice(0, 60), layout: forcedTop, cpu: attribute(t.ts, t.ts + t.dur)}); }
report.allLong = uniq.map(t => [rel(t.ts), Math.round(t.dur / 1000)]);
report.whole = attribute(navStart, Infinity);
console.log(JSON.stringify(report, null, 1));
