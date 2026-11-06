// Every request the test browser makes is fetched with curl, so tests see the real service through whatever proxy the
// machine has. Static GETs (pictures, tiles, the page's own files) are cached on disk to keep a sweep quick; anything
// under /api/ is always fetched fresh. Set GC500_CACHE to move the cache; delete it to start clean.
const {execFile} = require('child_process'), fs = require('fs'), path = require('path'), os = require('os'), crypto = require('crypto');
const resolveCandidateMedia = require('./candidate_media.cjs').fromEnvironment();
const CACHE = process.env.GC500_CACHE || path.join(os.tmpdir(), 'gc500-fetch-cache'); fs.mkdirSync(CACHE, {recursive: true}); let n = 0;
function curlFetch(url, headers, method, body) {
  // Resolve reviewed candidate pictures before disk/network cache, including the initial page load.
  // Both open_page and xembed use this route; APIs and non-GET requests bypass it.
  try { const local = resolveCandidateMedia(url, headers, method); if (local) return Promise.resolve(local); }
  catch (error) { if (error.code === 'GC500_CANDIDATE_MEDIA') console.error('FAIL candidate media: ' + error.message); return Promise.reject(error); }
  const cacheable = method === 'GET' && !/\/api\/|createSession|session=|googleapis\.com|\/v\/Coates-GC500-2026\/?(\?|#|$)|\/e\//.test(url), key = crypto.createHash('sha1').update(url).digest('hex'), cf = path.join(CACHE, key);
  if (cacheable && fs.existsSync(cf + '.json')) return Promise.resolve({...JSON.parse(fs.readFileSync(cf + '.json', 'utf8')), body: fs.readFileSync(cf + '.body')});
  const id = ++n, hf = path.join(os.tmpdir(), 'gc_h' + process.pid + '_' + id), bf = path.join(os.tmpdir(), 'gc_b' + process.pid + '_' + id);
  const args = ['-sS', '--compressed', '-D', hf, '-o', bf, '--max-time', '60', '-X', method];
  for (const [k, v] of Object.entries(headers || {})) { if (/^(accept-encoding|host|connection|content-length)$/i.test(k)) continue; args.push('-H', k + ': ' + v); }
  if (body != null) args.push('--data-binary', body); args.push(url);
  return new Promise((res, rej) => execFile('curl', args, {maxBuffer: 1 << 27}, err => { try { if (err) return rej(err);
    const raw = fs.readFileSync(hf, 'utf8').split(/\r?\n\r?\n/).filter(b => /^HTTP\//.test(b)), last = raw[raw.length - 1] || 'HTTP/1.1 502', lines = last.split(/\r?\n/), status = +lines[0].split(' ')[1] || 502, hd = {};
    for (const l of lines.slice(1)) { const i = l.indexOf(':'); if (i > 0) { const k = l.slice(0, i).trim().toLowerCase(); if (/^(content-encoding|content-length|transfer-encoding|set-cookie)$/.test(k)) continue; hd[k] = l.slice(i + 1).trim(); } }
    hd['access-control-allow-origin'] = hd['access-control-allow-origin'] || '*'; const b = fs.readFileSync(bf);
    if (cacheable && status === 200) { fs.writeFileSync(cf + '.body', b); fs.writeFileSync(cf + '.json', JSON.stringify({status, headers: hd})); }
    res({status, headers: hd, body: b}); } finally { try { fs.unlinkSync(hf); fs.unlinkSync(bf); } catch (_) {} } })); }
/* a read-only request that fails (a network drop, a proxy hiccup) is tried once more before the page is told it
   failed - otherwise a sweep reports the test rig's network as a fault in the page */
const once = curlFetch;
function curlFetchRetry(url, headers, method, body) {
  return once(url, headers, method, body).catch(e => method === 'GET' && e.code !== 'GC500_CANDIDATE_MEDIA' ? new Promise(r => setTimeout(r, 700)).then(() => once(url, headers, method, body)) : Promise.reject(e));
}
module.exports = {curlFetch: curlFetchRetry};
