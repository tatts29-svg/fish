// Author: Andrew Fisher. v9.00 part B: the race call names the new member of the fencing crew (turn 17, the roll call).
// Reads the built page as a file, then opens it at the live address (harness/open_page.js: every request the page makes other
// than a GET is aborted, so the live record is never written), serves the new take from a local folder the way v8.93 served its
// media, and plays it: the Broadcast is started by a press, then the programme is put on slot 17 and must play that take from
// the local copy to its end and move on to slot 18. The new name is read from the private input, bound by SHA-256, and is
// never written to the log.
//   PAGE=<built page> V900_TEAM=<private input> MEDIA=<folder holding <sha>.mp3> [MANIFEST=<media_manifest_v900.json>]
//   [MOB=1] [OUT=<evidence dir>] node tests/test_broadcast900.cjs
const {open} = require('../../toolchain/harness/open_page');
const fs = require('fs'), path = require('path'), crypto = require('crypto');
const here = __dirname;
const TEAM_SHA = 'ee576e40d18d144038d3e0eefe0b1013042c72e05f47d51fff20888def84154a';
const NEW = 'c1f296379a281e22516d8f86a7d7f24097f7e5b47b4c6aa135dcb6e0dc352893', NEW_BYTES = 192428, NEW_SECS = 16.03;
const OLD = '91ddb4349a2ffa075f7b6cd2b9f6ee99f2e8967df81723d6d346cd44366adb50';
const OLD_TEXT_SHA = '4c0ac428cc398d1657d911694e55b5a36932e137ab12bea03489efc4623fd0ac';   // the live roll call before the name
const LIVE_MANIFEST = 'd01b619abe6fac3d56d077abaf8a2cdcbbc4c9e69bd725a4a84c01849c83fa1f';
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

(async () => {
  // ---- the inputs
  const teamRaw = fs.readFileSync(process.env.V900_TEAM || '/nonexistent-V900_TEAM');
  if (sha(teamRaw) !== TEAM_SHA) throw new Error('V900_TEAM: checksum mismatch');
  const NAME = JSON.parse(teamRaw.toString('utf8')).person.name;
  const take = path.join(MEDIA, NEW + '.mp3'); const takeRaw = fs.existsSync(take) ? fs.readFileSync(take) : Buffer.alloc(0);
  ok('the new take is in MEDIA as <sha>.mp3, by its SHA-256 and size', sha(takeRaw) === NEW && takeRaw.length === NEW_BYTES, {bytes: takeRaw.length});

  // ---- 1. the page as built (DATA before the page's own resolvers run)
  const html = fs.readFileSync(process.env.PAGE, 'utf8').replace(/^﻿/, '');
  const i = html.indexOf('const DATA = '), j = html.indexOf('\n', i), line = html.slice(i + 13, j);
  const D = JSON.parse(line.replace(/;$/, '')), B = D.broadcast, T = B.turns;
  const unresolved = T.filter(t => { const m = t.audio && D.media[t.audio.media];
    return !(m && t.sha256 === t.audio.media && m.sha256 === t.sha256 && m.type === 'audio/mpeg' && m.file === t.sha256 + '.mp3' && m.bytes === t.bytes); }).map(t => t.slot);
  ok('all 35 turns resolve to their take in DATA.media (sha256, file, type, bytes)', T.length === 35 && unresolved.length === 0, {turns: T.length, unresolved});
  const t17 = T.find(t => t.slot === 17), suffix = ' ' + NAME + '!';
  ok("slot 17's text ends with the new name (Andrew's spelling), called once, after the live roll call unchanged",
    t17.text.endsWith(suffix) && t17.text.split(NAME).length === 2 && sha(t17.text.slice(0, -suffix.length)) === OLD_TEXT_SHA, {endsWithName: t17.text.endsWith(suffix)});
  ok('slot 17 carries the new take: sha256, audio.media, bytes, secs and measured_s', t17.sha256 === NEW && t17.audio.media === NEW && t17.bytes === NEW_BYTES && t17.secs === NEW_SECS && t17.measured_s === NEW_SECS,
    {sha256: t17.sha256.slice(0, 12), bytes: t17.bytes, secs: t17.secs, measured_s: t17.measured_s});
  ok('the old slot-17 take is gone from the page (named nowhere)', !html.includes(OLD) && !(OLD in D.media), {});
  ok('the revision carries the dated sentence naming the new crew member once', /; turn 17 re-voiced 8 Oct 2026 in the same voice, flow and mix to add .+ to the fencing crew as named in the call$/.test(B.revision) && B.revision.split(NAME).length === 2 && !/Andrew Fisher/.test(B.revision), {});
  const man = JSON.parse(fs.readFileSync(MANIFEST, 'utf8'));
  const manDigest = sha(canonical({schema: man.schema, assets: man.assets}));
  ok('media_manifest_v900.json: its digest is its own canonical form, and its assets are exactly DATA.media',
    man.schema === 'gc500-media-v1' && manDigest === man.sha256 && manifestOf(D.media) === man.sha256 && man.assets.length === Object.keys(D.media).length && man.assets.some(a => a.sha256 === NEW && a.file === NEW + '.mp3' && a.type === 'audio/mpeg' && a.scope === 'view' && a.bytes === NEW_BYTES),
    {assets: man.assets.length, media: Object.keys(D.media).length, digest: man.sha256.slice(0, 12)});
  ok('manifest digest on the page equals media_manifest_v900.json and has moved off the live one', D.hostedMedia.manifest === man.sha256 && man.sha256 !== LIVE_MANIFEST, {page: D.hostedMedia.manifest.slice(0, 12), file: man.sha256.slice(0, 12)});

  // ---- 2. the page in a browser, at the live address, the take served from MEDIA
  const s = await open(MOB ? {pageFile: process.env.PAGE, W: 390, H: 844, dpr: 2, mobile: true} : {pageFile: process.env.PAGE, W: 1440, H: 900});
  const p = s.page, served = {}, fellBack = [], consoleErrors = [];
  p.on('console', m => { if (m.type() === 'error') consoleErrors.push(m.text().slice(0, 200)); });
  await p.route('**/m/Coates-GC500-2026/*.mp3', async route => { const f = path.basename(new URL(route.request().url()).pathname), fp = path.join(MEDIA, f);
    if (MEDIA && fs.existsSync(fp)) { const body = fs.readFileSync(fp), rg = /bytes=(\d*)-(\d*)/.exec(route.request().headers()['range'] || ''); served[f] = (served[f] || 0) + 1;
      if (rg) { const a = rg[1] ? +rg[1] : 0, z = rg[2] ? Math.min(+rg[2], body.length - 1) : body.length - 1;
        return route.fulfill({status: 206, headers: {'content-type': 'audio/mpeg', 'accept-ranges': 'bytes', 'content-range': `bytes ${a}-${z}/${body.length}`, 'content-length': String(z - a + 1)}, body: body.subarray(a, z + 1)}); }
      return route.fulfill({status: 200, headers: {'content-type': 'audio/mpeg', 'accept-ranges': 'bytes'}, body}); }
    fellBack.push(f.slice(0, 12)); return route.fallback(); });
  try {
    await p.waitForFunction(() => typeof bcPlay === 'function' && typeof showOpen === 'function' && typeof SYNC !== 'undefined' && SYNC.status === 'live', null, {timeout: 180000});
    await p.waitForTimeout(1500);
    const rt = await p.evaluate(({NEW, suffix}) => { const T = bcTurns();
      return {n: T.length, urls: T.filter(t => typeof t.audio === 'string' && t.audio === DATA.media[t.sha256] && /^\/m\/Coates-GC500-2026\/[0-9a-f]{64}\.mp3$/.test(t.audio)).length,
        a17: (T.find(t => t.slot === 17) || {}).audio, ends: (T.find(t => t.slot === 17) || {text: ''}).text.endsWith(suffix), manifest: DATA.hostedMedia.manifest,
        footer: ((document.getElementById('footL') || {}).textContent || '').slice(-8).trim()}; }, {NEW, suffix});
    ok('in the browser every turn resolves to a hosted take URL from DATA.media; slot 17 points at the new file and its text ends with the name',
      rt.n === 35 && rt.urls === 35 && rt.a17 === '/m/Coates-GC500-2026/' + NEW + '.mp3' && rt.ends, {n: rt.n, urls: rt.urls, a17: String(rt.a17).slice(-20), footer: rt.footer});
    ok('in the browser the manifest digest equals media_manifest_v900.json', rt.manifest === man.sha256, {page: String(rt.manifest).slice(0, 12)});

    // the Broadcast, started by a press, then put on slot 17
    await p.evaluate(() => showOpen());
    await p.waitForFunction(() => { const b = document.getElementById('showBroadcast'); return b && !b.hidden && b.offsetParent !== null; }, null, {timeout: 30000});
    await p.click('#showBroadcast', {timeout: 15000});
    const started = await p.evaluate(() => ({on: BC.on, i: BC.i, pressed: document.getElementById('showBroadcast').getAttribute('aria-pressed')}));
    ok('Broadcast starts from its button (programme on, aria-pressed true)', started.on && started.pressed === 'true' && started.i >= 1, started);
    const jump = await p.evaluate(() => { bcStop(); BC.on = true; bcPlay(17); window.__bc900 = BC.el; return {on: BC.on, i: BC.i, src: BC.el ? BC.el.src : ''}; });
    await p.waitForFunction(() => window.__bc900 && window.__bc900.currentTime > 1.5 && !window.__bc900.paused, null, {timeout: 30000}).catch(() => {});
    const playing = await p.evaluate(() => { const a = window.__bc900; return {i: BC.i, t: a.currentTime, paused: a.paused, dur: a.duration, err: a.error ? a.error.code : null, ready: a.readyState}; });
    ok('slot 17 plays from the new media: the programme is on slot 17, the take is the local copy, it is playing with no media error and its length is 16.03 s',
      jump.on && jump.i === 17 && jump.src.endsWith('/m/Coates-GC500-2026/' + NEW + '.mp3') && playing.i === 17 && playing.t > 1.5 && !playing.paused && playing.err === null && Math.abs(playing.dur - NEW_SECS) < 0.15 && (served[NEW + '.mp3'] || 0) >= 1,
      {src: jump.src.slice(-24), t: +playing.t.toFixed(2), dur: playing.dur, err: playing.err, ready: playing.ready, served: served[NEW + '.mp3'] || 0});
    if (OUT) await p.screenshot({path: path.join(OUT, `broadcast900_${MOB ? 'phone' : 'laptop'}_slot17.png`)});
    await p.waitForFunction(() => window.__bc900.ended || BC.i !== 17, null, {timeout: 40000}).catch(() => {});
    const after = await p.evaluate(() => { const a = window.__bc900; return {ended: a.ended, err: a.error ? a.error.code : null, i: BC.i, on: BC.on, t: a.currentTime}; });
    ok('the take plays to its end (ended, no error) and the programme moves on to slot 18', after.ended && after.err === null && after.on && after.i === 18 && after.t > NEW_SECS - 0.2, after);
    await p.evaluate(() => { bcStop(); });
    ok('the old slot-17 take was never asked for', !Object.keys(served).includes(OLD + '.mp3') && !fellBack.includes(OLD.slice(0, 12)), {fellBack: fellBack.length});
    ok('no script errors and no console errors', s.errors.length === 0 && consoleErrors.length === 0, {errors: s.errors, console: consoleErrors});
    ok('no writes: every non-GET the page tried was counted, and there were none', s.counts.blocked === 0, s.counts);
  } finally { await s.browser.close(); }

  const pass = R.filter(r => r.pass).length;
  for (const r of R) console.log((r.pass ? 'PASS ' : 'FAIL ') + r.name + (r.pass ? '' : '  ' + JSON.stringify(r.detail)));
  console.log(`broadcast900 ${MOB ? 'phone' : 'laptop'}: ${pass}/${R.length}`);
  if (OUT) fs.writeFileSync(path.join(OUT, `broadcast900_${MOB ? 'phone' : 'laptop'}.json`), JSON.stringify({author: 'Andrew Fisher', page: sha(fs.readFileSync(process.env.PAGE)), results: R}, null, 1));
  process.exitCode = pass === R.length ? 0 : 1;
})().catch(e => { console.error('TEST FAIL', String(e && e.stack || e).slice(0, 600)); process.exit(2); });
