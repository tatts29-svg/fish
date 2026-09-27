const {execFile} = require('child_process'), fs = require('fs'), path = require('path'), os = require('os'), crypto = require('crypto');
const CACHE = '/tmp/claude-0/stage/work/cache'; fs.mkdirSync(CACHE, {recursive: true}); let n = 0;
function curlFetch(url, headers, method, body) {
  const cacheable = method === 'GET' && !/\/api\/|createSession|session=/.test(url), key = crypto.createHash('sha1').update(url).digest('hex'), cf = path.join(CACHE, key);
  if (cacheable && fs.existsSync(cf + '.json')) return Promise.resolve({...JSON.parse(fs.readFileSync(cf + '.json', 'utf8')), body: fs.readFileSync(cf + '.body')});
  const id = ++n, hf = path.join(os.tmpdir(), 'lh_h' + process.pid + '_' + id), bf = path.join(os.tmpdir(), 'lh_b' + process.pid + '_' + id);
  const args = ['-sS', '--compressed', '-D', hf, '-o', bf, '--max-time', '60', '-X', method];
  for (const [k, v] of Object.entries(headers)) { if (/^(accept-encoding|host|connection|content-length)$/i.test(k)) continue; args.push('-H', k + ': ' + v); }
  if (body != null) args.push('--data-binary', body); args.push(url);
  return new Promise((res, rej) => execFile('curl', args, {maxBuffer: 1 << 26}, err => { try { if (err) return rej(err);
    const raw = fs.readFileSync(hf, 'utf8').split(/\r?\n\r?\n/).filter(b => /^HTTP\//.test(b)), last = raw[raw.length - 1] || 'HTTP/1.1 502', lines = last.split(/\r?\n/), status = +lines[0].split(' ')[1], hd = {};
    for (const l of lines.slice(1)) { const i = l.indexOf(':'); if (i > 0) { const k = l.slice(0, i).trim().toLowerCase(); if (/^(content-encoding|content-length|transfer-encoding|set-cookie)$/.test(k)) continue; hd[k] = l.slice(i + 1).trim(); } }
    hd['access-control-allow-origin'] = hd['access-control-allow-origin'] || '*'; const b = fs.readFileSync(bf);
    if (cacheable && status === 200) { fs.writeFileSync(cf + '.body', b); fs.writeFileSync(cf + '.json', JSON.stringify({status, headers: hd})); }
    res({status, headers: hd, body: b}); } finally { try { fs.unlinkSync(hf); fs.unlinkSync(bf); } catch (_) {} } })); }
module.exports = {curlFetch};
