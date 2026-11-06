// CPU-profile N Today renders on a settled page (frozen record); print self/inclusive top functions.
// usage: FREEZE=dir PAGE=file [N=5] [EXPR='render()'] node prof_render.cjs
const {open} = require('./popen.cjs'); const fs = require('fs');
const html = fs.readFileSync(process.env.PAGE, 'utf8'); const scripts = [];
{ const re = /<script\b([^>]*)>/g; let m, line = 0, pos = 0; const lineAt = off => { for (; pos < off; pos++) if (html.charCodeAt(pos) === 10) line++; return line; };
  while ((m = re.exec(html))) { const st = m.index; const l0 = lineAt(st); const en = html.indexOf('</script>', m.index + m[0].length); const l1 = lineAt(en); const id = (m[1].match(/id="([^"]+)"/) || [])[1] || ''; scripts.push({l0, l1, id: id || 'S' + scripts.length, plain: /text\/plain/.test(m[1])}); re.lastIndex = en; } }
const tag = (url, line) => { if (!url) return '(native)'; if (!/railway/.test(url)) return url.slice(-30); let b = null; for (const s of scripts) if (!s.plain && line >= s.l0 && line <= s.l1) b = s; return b ? b.id : 'L' + line; };
(async () => {
  const N = +(process.env.N || 5), EXPR = process.env.EXPR || 'render()';
  const s = await open({pageFile: process.env.PAGE});
  const p = s.page;
  await p.waitForFunction(() => typeof SYNC !== 'undefined' && SYNC.status === 'live' && document.documentElement.getAttribute('data-refresh904') !== 'loading', null, {timeout: 300000, polling: 500});
  await p.waitForTimeout(6000); await p.evaluate(() => { if (state.tab !== 'today') go('today'); }); await p.waitForTimeout(3000);
  const c = await p.context().newCDPSession(p); await c.send('Profiler.enable'); await c.send('Profiler.setSamplingInterval', {interval: 200});
  await c.send('Profiler.start');
  const t = await p.evaluate(async ([N, EXPR]) => { const r = []; for (let i = 0; i < N; i++) { const t0 = performance.now(); (0, eval)(EXPR); r.push(Math.round(performance.now() - t0)); await new Promise(res => setTimeout(res, 50)); } return r; }, [N, EXPR]);
  const {profile} = await c.send('Profiler.stop');
  const nodes = new Map(profile.nodes.map(n => [n.id, n])), parent = new Map(); profile.nodes.forEach(n => (n.children || []).forEach(ch => parent.set(ch, n.id)));
  const self = {}, incl = {}; const dt = profile.timeDeltas; let tot = 0;
  profile.samples.forEach((id, i) => { const d = (dt[i + 1] || 0) / 1000; const n = nodes.get(id); const cf = n.callFrame; if (cf.functionName === '(idle)') return; tot += d;
    const k = `${cf.functionName || '(anon)'} @${tag(cf.url, cf.lineNumber)}:${cf.lineNumber + 1}`; self[k] = (self[k] || 0) + d; const seen = new Set();
    for (let x = id; x != null; x = parent.get(x)) { const f = nodes.get(x).callFrame; if (f.functionName === '(root)') continue; const kk = `${f.functionName || '(anon)'} @${tag(f.url, f.lineNumber)}:${f.lineNumber + 1}`; if (!seen.has(kk)) { seen.add(kk); incl[kk] = (incl[kk] || 0) + d; } } });
  const top = (o, n) => Object.entries(o).sort((a, b) => b[1] - a[1]).slice(0, n).map(([k, v]) => (v / N).toFixed(1).padStart(8) + ' ms/render  ' + k).join('\n');
  console.log('page', process.env.PAGE, 'expr', EXPR, 'times', t.join(' '), 'sampled ms/render', (tot / N).toFixed(0));
  console.log('--- self'); console.log(top(self, 30)); console.log('--- inclusive'); console.log(top(incl, 45));
  await s.browser.close();
})();
