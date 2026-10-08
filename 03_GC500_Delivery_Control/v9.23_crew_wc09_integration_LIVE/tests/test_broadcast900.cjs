// Author: Andrew Fisher. v9.00 part B: the race call names the new member of the fencing crew (turn 17, the roll call).
// Reads the built page and the live page it was built from (build.sh keeps it as base_live.html beside the build), then
// opens the build at the live address (harness/open_page.js: every request the page makes other than a GET is aborted, so
// the live record is never written), serves the takes from a local folder the way v8.93 served its media, and plays it: the
// Broadcast is started by a press on its button (on a phone, behind Options), then the programme is put on slot 17 and must
// play the new take from the local copy to its end and move on to slot 18. Nothing about the base is assumed: its slot-17
// take, its roll call and its manifest are read from base_live.html. The new name is read from the private input, bound by
// SHA-256, and is never written to the log.
//   PAGE=<built page> V900_TEAM=<private input> MEDIA=<folder holding <sha>.mp3> [BASE=<the live page it was built from>]
//   [MANIFEST=<media_manifest_v900.json>] [MOB=1] [OUT=<evidence dir>] [STATIC_ONLY=1] node tests/test_broadcast900.cjs
const {open} = require('../../toolchain/harness/open_page');
const fs = require('fs'), path = require('path'), crypto = require('crypto');
const here = __dirname;
const TEAM_SHA = 'ee576e40d18d144038d3e0eefe0b1013042c72e05f47d51fff20888def84154a';
const NEW = 'c1f296379a281e22516d8f86a7d7f24097f7e5b47b4c6aa135dcb6e0dc352893', NEW_BYTES = 192428, NEW_SECS = 16.03;
const PAGE = process.env.PAGE, BASE = process.env.BASE || path.join(path.dirname(PAGE || '.'), 'base_live.html');
const MEDIA = process.env.MEDIA || '', MANIFEST = process.env.MANIFEST || path.join(here, '..', 'media_manifest_v900.json');
const OUT = process.env.OUT || ''; if (OUT) fs.mkdirSync(OUT, {recursive: true});
const MOB = !!process.env.MOB;
const sha = b => crypto.createHash('sha256').update(b).digest('hex');
const R = [], ok = (name, pass, detail) => { R.push({name, pass: !!pass, detail}); };
// v7.22's canonical form (Python json.dumps(ensure_ascii=False) for scalars; keys sorted; no spaces)
const canonical = v => Array.isArray(v) ? '[' + v.map(canonical).join(',') + ']'
  : (v && typeof v === 'object') ? '{' + Object.keys(v).sort().map(k => JSON.stringify(k) + ':' + canonical(v[k])).join(',') + '}' : JSON.stringify(v);
const manifestOf = media => { const assets = Object.values(media).map(x => ({bytes: x.bytes, file: x.file, scope: x.scope, sha256: x.sha256, type: x.type}))
  .sort((a, b) => a.file < b.file ? -1 : a.file > b.file ? 1 : 0); return sha(canonical({schema: 'gc500-media-v1', assets})); };
const dataOf = file => { const h = fs.readFileSync(file, 'utf8').replace(/^﻿/, ''), i = h.indexOf('const DATA = '), j = h.indexOf('\n', i);
  return {html: h, D: JSON.parse(h.slice(i + 13, j).replace(/;$/, ''))}; };

function report(R, label) {
  const pass = R.filter(r => r.pass).length;
  for (const r of R) console.log((r.pass ? 'PASS ' : 'FAIL ') + r.name + (r.pass ? '' : '  ' + JSON.stringify(r.detail)));
  console.log(`broadcast900 ${label}: ${pass}/${R.length}`);
  if (OUT) fs.writeFileSync(path.join(OUT, `broadcast900_${label}.json`), JSON.stringify({author: 'Andrew Fisher', page: sha(fs.readFileSync(PAGE)), base: sha(fs.readFileSync(BASE)), results: R}, null, 1));
  process.exitCode = pass === R.length ? 0 : 1;
}

(async () => {
  // ---- the inputs
  const teamRaw = fs.readFileSync(process.env.V900_TEAM || '/nonexistent-V900_TEAM');
  if (sha(teamRaw) !== TEAM_SHA) throw new Error('V900_TEAM: checksum mismatch');
  const NAME = JSON.parse(teamRaw.toString('utf8')).person.name, suffix = ' ' + NAME + '!';
  const take = path.join(MEDIA, NEW + '.mp3'); const takeRaw = fs.existsSync(take) ? fs.readFileSync(take) : Buffer.alloc(0);
  ok('the new take is in MEDIA as <sha>.mp3, by its SHA-256 and size', sha(takeRaw) === NEW && takeRaw.length === NEW_BYTES, {bytes: takeRaw.length});

  // ---- 1. the base and the build, as files (DATA before the page's own resolvers run)
  const {D: B0} = dataOf(BASE), {html, D} = dataOf(PAGE);
  const b17 = B0.broadcast.turns.find(t => t.slot === 17), OLD = b17.sha256;
  ok("the base's manifest digest is the canonical form of the base's own DATA.media (the live manifest, proven)", manifestOf(B0.media) === B0.hostedMedia.manifest,
    {base: B0.hostedMedia.manifest.slice(0, 12)});
  const T = D.broadcast.turns;
  const unresolved = T.filter(t => { const m = t.audio && D.media[t.audio.media];
    return !(m && t.sha256 === t.audio.media && m.sha256 === t.sha256 && m.type === 'audio/mpeg' && m.file === t.sha256 + '.mp3' && m.bytes === t.bytes); }).map(t => t.slot);
  ok('all 35 turns resolve to their take in DATA.media (sha256, file, type, bytes)', T.length === 35 && unresolved.length === 0, {turns: T.length, unresolved});
  const t17 = T.find(t => t.slot === 17);
  ok("slot 17's text is the base's roll call with the new name (Andrew's spelling) called once at the end", t17.text === b17.text + suffix && t17.text.split(NAME).length === 2,
    {endsWithName: t17.text.endsWith(suffix), baseKept: t17.text.startsWith(b17.text)});
  ok('slot 17 carries the new take: sha256, audio.media, bytes, secs and measured_s', t17.sha256 === NEW && t17.audio.media === NEW && t17.bytes === NEW_BYTES && t17.secs === NEW_SECS && t17.measured_s === NEW_SECS,
    {sha256: t17.sha256.slice(0, 12), bytes: t17.bytes, secs: t17.secs, measured_s: t17.measured_s});
  ok('every other turn is exactly as the base has it', T.filter(t => t.slot !== 17).every(t => JSON.stringify(t) === JSON.stringify(B0.broadcast.turns.find(x => x.slot === t.slot))), {});
  ok("the base's slot-17 take is gone from the page (named nowhere) and nothing else in the media list changed",
    OLD !== NEW && !html.includes(OLD) && !(OLD in D.media) && Object.keys(D.media).length === Object.keys(B0.media).length
    && Object.keys(B0.media).filter(k => k !== OLD).every(k => JSON.stringify(D.media[k]) === JSON.stringify(B0.media[k])), {old: OLD.slice(0, 12)});
  ok('the revision is the base revision plus one dated sentence naming the new crew member once',
    D.broadcast.revision.startsWith(B0.broadcast.revision) && /^; turn 17 re-voiced 8 Oct 2026 in the same voice, flow and mix to add .+ to the fencing crew as named in the call$/.test(D.broadcast.revision.slice(B0.broadcast.revision.length))
    && D.broadcast.revision.split(NAME).length === 2 && !/Andrew Fisher/.test(D.broadcast.revision), {});
  const man = JSON.parse(fs.readFileSync(MANIFEST, 'utf8'));
  const manDigest = sha(canonical({schema: man.schema, assets: man.assets}));
  ok('media_manifest_v900.json: its digest is its own canonical form, and its assets are exactly the page DATA.media',
    man.schema === 'gc500-media-v1' && manDigest === man.sha256 && manifestOf(D.media) === man.sha256 && man.assets.length === Object.keys(D.media).length && man.assets.some(a => a.sha256 === NEW && a.file === NEW + '.mp3' && a.type === 'audio/mpeg' && a.scope === 'view' && a.bytes === NEW_BYTES),
    {assets: man.assets.length, media: Object.keys(D.media).length, digest: man.sha256.slice(0, 12)});
  ok("manifest digest on the page equals media_manifest_v900.json and has moved off the base's", D.hostedMedia.manifest === man.sha256 && man.sha256 !== B0.hostedMedia.manifest,
    {page: D.hostedMedia.manifest.slice(0, 12), file: man.sha256.slice(0, 12), base: B0.hostedMedia.manifest.slice(0, 12)});

  // ---- 2. the page in a browser, at the live address, the takes served from MEDIA (STATIC_ONLY=1 stops before the browser)
  if (process.env.STATIC_ONLY) { report(R, 'static'); return; }
  const s = await open(MOB ? {pageFile: PAGE, W: 390, H: 844, dpr: 2, mobile: true} : {pageFile: PAGE, W: 1440, H: 900});
  const p = s.page, served = {}, fellBack = [], consoleErrors = [];
  p.on('console', m => { if (m.type() === 'error') consoleErrors.push(m.text().slice(0, 200)); });
  await p.route('**/m/Coates-GC500-2026/*.mp3', async route => { const f = path.basename(new URL(route.request().url()).pathname), fp = path.join(MEDIA, f);
    if (MEDIA && fs.existsSync(fp)) { const body = fs.readFileSync(fp), rg = /bytes=(\d*)-(\d*)/.exec(route.request().headers()['range'] || ''); served[f] = (served[f] || 0) + 1;
      if (rg) { const a = rg[1] ? +rg[1] : 0, z = rg[2] ? Math.min(+rg[2], body.length - 1) : body.length - 1;
        return route.fulfill({status: 206, headers: {'content-type': 'audio/mpeg', 'accept-ranges': 'bytes', 'content-range': `bytes ${a}-${z}/${body.length}`, 'content-length': String(z - a + 1)}, body: body.subarray(a, z + 1)}); }
      return route.fulfill({status: 200, headers: {'content-type': 'audio/mpeg', 'accept-ranges': 'bytes'}, body}); }
    fellBack.push(f.slice(0, 12)); return route.fallback(); });
  try {
    await p.waitForFunction(() => typeof bcPlay === 'function' && typeof showOpen === 'function' && typeof SYNC !== 'undefined' && SYNC.status === 'live', null, {timeout: 180000, polling: 250});
    await p.waitForTimeout(1500);
    const rt = await p.evaluate(({suffix}) => { const T = bcTurns();
      return {n: T.length, urls: T.filter(t => typeof t.audio === 'string' && t.audio === DATA.media[t.sha256] && /^\/m\/Coates-GC500-2026\/[0-9a-f]{64}\.mp3$/.test(t.audio)).length,
        a17: (T.find(t => t.slot === 17) || {}).audio, ends: (T.find(t => t.slot === 17) || {text: ''}).text.endsWith(suffix), manifest: DATA.hostedMedia.manifest,
        footer: ((document.getElementById('footL') || {}).textContent || '').slice(-8).trim()}; }, {suffix});
    ok('in the browser every turn resolves to a hosted take URL from DATA.media; slot 17 points at the new file and its text ends with the name',
      rt.n === 35 && rt.urls === 35 && rt.a17 === '/m/Coates-GC500-2026/' + NEW + '.mp3' && rt.ends, {n: rt.n, urls: rt.urls, a17: String(rt.a17).slice(-20), footer: rt.footer});
    ok('in the browser the manifest digest equals media_manifest_v900.json', rt.manifest === man.sha256, {page: String(rt.manifest).slice(0, 12)});

    // the Broadcast, started by a press on its button (a phone folds it behind Options), then put on slot 17
    const diag = () => p.evaluate(() => { const d = id => { const b = document.getElementById(id); if (!b) return null; const r = b.getBoundingClientRect(), cs = getComputedStyle(b);
      return {hidden: b.hidden, w: Math.round(r.width), h: Math.round(r.height), x: Math.round(r.x), y: Math.round(r.y), display: cs.display, vis: cs.visibility}; };
      return {open: SHOW.open, launch: SHOW.launch, reduced: SHOW.reduced, motionOff: motionOff(), sc: d('showcase'), bc: d('showBroadcast'), opt: d('showOptions794'), cls: (document.getElementById('showcase') || {}).className}; });
    const visible = sel => p.evaluate(sel => { const b = document.querySelector(sel); if (!b || b.hidden) return false; const r = b.getBoundingClientRect(), cs = getComputedStyle(b);
      return r.width > 0 && r.height > 0 && cs.display !== 'none' && cs.visibility !== 'hidden'; }, sel);
    // WAITS AND PRESSES NEVER DEPEND ON A FRAME. With the showcase's 3D scene running, headless Chromium may deliver few or no
    // animation frames, and Playwright's waitForFunction polling, selector polling and click actionability checks all wait on
    // frames - so they time out with the button plainly on screen (8 Oct: three runs failed that way). Waits here are node-side
    // loops over evaluate; a press is a real mouse click at the button's centre, after checking the button is what is there.
    const frames = () => p.evaluate(() => new Promise(res => { let n = 0; const f = () => { n++; requestAnimationFrame(f); }; requestAnimationFrame(f); setTimeout(() => res(n), 1000); }));
    const until = async (what, cond, ms = 30000) => { const t0 = Date.now(); while (Date.now() - t0 < ms) { if (await cond()) return true; await p.waitForTimeout(250); }
      throw new Error(what + ' not reached in ' + ms + ' ms: ' + JSON.stringify(await diag())); };
    const press = async sel => { const at = await p.evaluate(sel => { const b = document.querySelector(sel); b.scrollIntoView({block: 'nearest'}); const r = b.getBoundingClientRect();
      const x = r.left + r.width / 2, y = r.top + r.height / 2, top = document.elementFromPoint(x, y); return {x, y, hit: !!top && (top === b || b.contains(top))}; }, sel);
      if (!at.hit) throw new Error(sel + ' is covered at its centre: ' + JSON.stringify(await diag()));
      await p.mouse.click(at.x, at.y); return at; };
    const framesBefore = await frames();
    await p.evaluate(() => showOpen());
    const framesAfter = await frames();
    await until('Broadcast or Options button shown', async () => (await visible('#showBroadcast')) || (await visible('#showOptions794')));
    let via = 'button';
    if (!(await visible('#showBroadcast')) && await visible('#showOptions794')) { await press('#showOptions794'); via = 'Options, then button'; }
    await until('Broadcast button shown', () => visible('#showBroadcast'));
    await press('#showBroadcast');
    await until('Broadcast on', () => p.evaluate(() => BC.on), 10000).catch(() => {});
    const started = await p.evaluate(() => ({on: BC.on, i: BC.i, pressed: document.getElementById('showBroadcast').getAttribute('aria-pressed')}));
    ok('Broadcast starts from a press on its button (programme on, aria-pressed true)', started.on && started.pressed === 'true' && started.i >= 1,
      Object.assign({via, framesPerSecondBeforeShowOpen: framesBefore, framesPerSecondAfterShowOpen: framesAfter}, started));
    const jump = await p.evaluate(() => { bcStop(); BC.on = true; bcPlay(17); window.__bc900 = BC.el; window.__endedSlot17 = false; BC.el.addEventListener('ended', () => { window.__endedSlot17 = true; }, {once:true}); return {on: BC.on, i: BC.i, src: BC.el ? BC.el.src : ''}; });
    await until('slot 17 playing', () => p.evaluate(() => !!(window.__bc900 && window.__bc900.currentTime > 1.5 && !window.__bc900.paused))).catch(() => {});
    const playing = await p.evaluate(() => { const a = window.__bc900; return {i: BC.i, t: a.currentTime, paused: a.paused, dur: a.duration, err: a.error ? a.error.code : null, ready: a.readyState}; });
    ok('slot 17 plays from the new media: the programme is on slot 17, the take is the local copy, it is playing with no media error and its length is 16.03 s',
      jump.on && jump.i === 17 && jump.src.endsWith('/m/Coates-GC500-2026/' + NEW + '.mp3') && playing.i === 17 && playing.t > 1.5 && !playing.paused && playing.err === null && Math.abs(playing.dur - NEW_SECS) < 0.15 && (served[NEW + '.mp3'] || 0) >= 1,
      {src: jump.src.slice(-24), t: +playing.t.toFixed(2), dur: playing.dur, err: playing.err, ready: playing.ready, served: served[NEW + '.mp3'] || 0});
    if (OUT) await p.screenshot({path: path.join(OUT, `broadcast900_${MOB ? 'phone' : 'laptop'}_slot17.png`)});
    await until('slot 17 ended', () => p.evaluate(() => !!(window.__bc900.ended || BC.i !== 17)), 40000).catch(() => {});
    const after = await p.evaluate(() => { const a = window.__bc900; return {ended: window.__endedSlot17, reused: a === BC.el && a === BC.player918, err: a.error ? a.error.code : null, i: BC.i, on: BC.on, src: a.src, t: a.currentTime}; });
    ok('the take ends naturally and the reused v9.18 player advances to slot 18 without error', after.ended && after.reused && after.err === null && after.on && after.i === 18, after);
    await p.evaluate(() => { bcStop(); });
    ok("the base's slot-17 take was never asked for", !Object.keys(served).includes(OLD + '.mp3') && !fellBack.includes(OLD.slice(0, 12)), {fellBack: fellBack.length});
    ok('no script errors and no console errors', s.errors.length === 0 && consoleErrors.length === 0, {errors: s.errors, console: consoleErrors});
    ok('no writes: every non-GET the page tried was counted, and there were none', s.counts.blocked === 0, s.counts);
  } finally { await s.browser.close(); }
  report(R, MOB ? 'phone' : 'laptop');
})().catch(e => { console.error('TEST FAIL', String(e && e.stack || e).slice(0, 600)); process.exit(2); });
