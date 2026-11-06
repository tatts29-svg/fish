#!/usr/bin/env node
/* Author: Andrew Fisher. Put the photographs of the signed papers on the service as Documents, kind "docket", exactly as the
   page's own Add does (POST /api/files with the file's bytes and the x-file-* headers, then the preview to /api/files/<id>/thumb),
   so the Fencing tab's paper matching finds each one by the number in its name (24475.jpg ...). The originals are sent byte
   for byte and checked against their sha256 afterwards.

     node upload_originals.cjs            DRY RUN: lists what is already on the service and what would go up; nothing written
     node upload_originals.cjs --apply    needs GC500_EDIT_TOKEN in the environment

   The key is never printed, logged or stored. */
'use strict';
const fs = require('fs'), path = require('path'), crypto = require('crypto'), os = require('os'), {spawn} = require('child_process');
const HERE = __dirname, HOST = 'https://gc500-production.up.railway.app', VIEW_TOKEN = 'Coates-GC500-2026';
const applying = process.argv.includes('--apply'), token = process.env.GC500_EDIT_TOKEN || '';
const redact = s => token ? String(s).split(token).join('[key]') : String(s);
const log = (...a) => console.log(...a.map(redact)); const fail = m => { throw new Error(redact(m)); };
const sha256 = b => crypto.createHash('sha256').update(b).digest('hex');
const quote = v => '"' + String(v).replace(/\\/g, '\\\\').replace(/"/g, '\\"') + '"';
let seq = 0;
function curl(method, url, headers, bodyFile) {
  const tmp = path.join(os.tmpdir(), 'gc500-up-' + process.pid + '-' + (++seq)), hf = tmp + '.h', bf = tmp + '.b';
  const cfg = ['url = ' + quote(url), 'silent', 'show-error', 'max-time = 300', 'request = ' + method, 'dump-header = ' + quote(hf), 'output = ' + quote(bf)];
  if (bodyFile) cfg.push('data-binary = ' + quote('@' + bodyFile));
  for (const [k, v] of Object.entries(headers || {})) cfg.push('header = ' + quote(k + ': ' + v));
  return new Promise((resolve, reject) => {
    const c = spawn('curl', ['--config', '-'], {stdio: ['pipe', 'ignore', 'pipe']}); let err = '';
    c.stderr.on('data', d => err += d); c.on('error', reject);
    c.on('close', code => { try { if (code) return reject(new Error(redact(err) || 'curl failed'));
      const blocks = fs.readFileSync(hf, 'utf8').split(/\r?\n\r?\n/).filter(x => /^HTTP\//.test(x));
      const status = Number((blocks.at(-1) || 'HTTP/1.1 0').split(/\r?\n/)[0].split(' ')[1]); resolve({status, body: fs.readFileSync(bf)}); }
      catch (e) { reject(e); } finally { fs.rmSync(hf, {force: true}); fs.rmSync(bf, {force: true}); } });
    c.stdin.end(cfg.join('\n') + '\n');
  });
}
(async () => {
  const originals = fs.readdirSync(path.join(HERE, 'originals')).filter(f => /^\d+\.jpg$/.test(f)).sort();
  if (!originals.length) fail('no originals');
  const list = await curl('GET', HOST + '/api/files', {'x-gc500-token': VIEW_TOKEN, 'cache-control': 'no-cache'});
  if (list.status !== 200) fail('GET /api/files answered ' + list.status);
  const files = JSON.parse(list.body); const held = new Map((Array.isArray(files) ? files : files.files || []).map(f => [f.name || f.id, f]));
  const plan = [];
  for (const name of originals) {
    const bytes = fs.readFileSync(path.join(HERE, 'originals', name)), sha = sha256(bytes), thumb = path.join(HERE, 'thumbs', name.replace(/\.jpg$/, '.webp'));
    if (!fs.existsSync(thumb)) fail('no preview for ' + name + ' - make the thumbs first');
    const h = held.get(name);
    if (h && h.sha256 === sha) { log(`${name}: already on the service, same bytes (${h.bytes} bytes, kind ${h.kind}, thumb ${h.thumb})`); continue; }
    if (h) fail(name + ' is on the service with different bytes (' + h.sha256.slice(0, 12) + ' vs ' + sha.slice(0, 12) + ') - stopping');
    plan.push({name, sha, bytes: bytes.length, thumb});
  }
  log(`${plan.length} of ${originals.length} to upload: ${plan.map(p => p.name + ' (' + p.bytes + ' bytes, ' + p.sha.slice(0, 12) + ')').join(', ')}`);
  if (!applying) { log('DRY RUN - nothing sent'); return; }
  if (!token) fail('GC500_EDIT_TOKEN is not set');
  const v = await curl('GET', HOST + '/api/version', {'x-gc500-token': token}); if (v.status !== 200 || JSON.parse(v.body).level !== 'edit') fail('that key is not the edit key - nothing sent');
  const results = [];
  for (const p of plan) {
    const r = await curl('POST', HOST + '/api/files', {'x-gc500-token': token, 'Content-Type': 'image/jpeg', 'x-file-name': encodeURIComponent(p.name), 'x-file-kind': 'docket', 'x-file-title': '', 'x-file-note': ''}, path.join(HERE, 'originals', p.name));
    let saved = {}; try { saved = JSON.parse(r.body); } catch (_) {}
    if (r.status !== 200 || !saved.id) fail(p.name + ': upload answered ' + r.status + ' ' + String(r.body).slice(0, 160) + ' - stopping (' + results.length + ' already up)');
    if (saved.sha256 !== p.sha) fail(p.name + ': the service holds ' + saved.sha256 + ', not the original ' + p.sha);
    const t = await curl('POST', HOST + '/api/files/' + encodeURIComponent(saved.id) + '/thumb', {'x-gc500-token': token, 'Content-Type': 'image/webp', 'x-file-sha256': saved.sha256}, p.thumb);
    results.push({name: p.name, id: saved.id, sha256: saved.sha256, bytes: saved.bytes, thumb: t.status === 200});
    log(`${p.name}: up as ${saved.id} (${saved.bytes} bytes, sha256 matches) · preview ${t.status === 200 ? 'ok' : 'refused ' + t.status}`);
  }
  const after = await curl('GET', HOST + '/api/files', {'x-gc500-token': VIEW_TOKEN, 'cache-control': 'no-cache'});
  const now = new Map((JSON.parse(after.body).files || JSON.parse(after.body)).map(f => [f.name || f.id, f]));
  const problems = results.filter(r => { const f = now.get(r.name); return !f || f.sha256 !== r.sha256 || !f.thumb; }).map(r => r.name);
  const report = {author: 'Andrew Fisher', at: new Date().toISOString(), uploaded: results, verified: !problems.length, problems, files_before: held.size, files_after: now.size};
  fs.writeFileSync(path.join(HERE, 'photo_upload_' + new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d+Z$/, 'Z') + '.json'), JSON.stringify(report, null, 1) + '\n');
  log(problems.length ? 'PROBLEMS: ' + problems.join(', ') : `VERIFIED - ${results.length} originals on the service with their previews; files ${held.size} -> ${now.size}`);
  if (problems.length) process.exit(1);
})().catch(e => { console.error('STOP: ' + redact(e.message)); process.exit(1); });
