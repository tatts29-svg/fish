#!/usr/bin/env python3
"""Author: Andrew Fisher. Apply the v5.86 messaging status change to the exact v5.85 server."""
import hashlib
from pathlib import Path
import sys

base = Path(sys.argv[1])
source = base.read_text()
expected = '76afbd997a9fcfd6e796eea4ead641a5249a1bad23114417c861fd1559057684'
if hashlib.sha256(base.read_bytes()).hexdigest() != expected:
    raise SystemExit('Expected the verified v5.85 server; refusing another base or second application.')

def rep(old, new, count=1):
    global source
    actual = source.count(old)
    if actual != count:
        raise SystemExit(f'Expected {count} matches, got {actual}: {old[:100]}')
    source = source.replace(old, new)

rep("function smsWent(r) { return !!(r && String(r.status || '').toUpperCase().indexOf('SUCCESS') >= 0); }",
    "function smsWent(r) { return smsSubmission(r) === 'accepted'; }\n\n" + Path(__file__).with_name('delivery_status.js').read_text())
rep("build: 'v5.85'", "build: 'v5.86'")
rep("const BUILD = 'server v5.84", "const BUILD = 'server v5.86 — MESSAGE DELIVERY STATUS (accepted separately from delivered; read-only receipt lookup, own messages only; Andrew Fisher, 1 Oct 2026) + v5.85 MAP PICTURE MMS + v5.84")
rep("      if (p === '/api/sms' && req.method === 'GET') {", """      if (p === '/api/sms/status' && req.method === 'GET') {
        if (lv !== 'edit') return send(res, 403, { error: 'This link cannot check text delivery.' });
        return smsStatus(req, res, url);
      }
      if (p === '/api/sms' && req.method === 'GET') {""")

# A request that timed out may still have been accepted. Keep the existing durable UNKNOWN log and cap.
for separator in ['—', '-']:
    rep("return send(res, 502, { error: why + '. These are counted against today and marked unknown " + separator + " check ClickSend before sending them again.', today: smsToday(), to });",
        "return send(res, 502, Object.assign(smsSubmissionSummary(entry), { error: 'The provider did not confirm the submission. Check delivery before sending again.', today: smsToday(), to }));")

# Explicit rejections restore the cap; unfamiliar/internal/timeout states stay counted.
rep("entries.filter(e => String(e.status).toUpperCase() === 'FAILED').length", "entries.filter(e => smsSubmission(e) === 'rejected').length", 2)
rep("(out.status === 200 ? 'UNKNOWN' : 'FAILED')",
    "(SMS_REJECTED.has(smsCode(out.json && out.json.response_code)) ? smsCode(out.json.response_code) : 'UNKNOWN')", 2)
rep("(results || []).forEach(r => { if (r.to) byNumber[String(r.to).replace(/[^\\d+]/g, '')] = r; });",
    "(results || []).forEach(r => { const n = smsNumber(r.to); if (n.ok) byNumber[n.e164] = byNumber[n.e164] ? { status: 'UNKNOWN' } : r; });", 2)
rep("const r = byNumber[n] || (results && results.length === to.length ? results[to.indexOf(n)] : null);",
    "const r = byNumber[n] || null;", 2)

start = "  const went = entries.filter(e => smsWent(e)).length;\n  return send(res, out.status === 200 && went ? 200 : 502, {"
for kind in ['sms', 'mms']:
    i = source.index(start)
    end = source.index('\n  });', i) + len('\n  });')
    picture = ', picture: plan.picture' if kind == 'mms' else ''
    source = source[:i] + """  const summary = smsSubmissionSummary(entries);
  return send(res, out.status === 200 && summary.accepted ? 200 : 502,
    Object.assign(summary, { today: smsToday(), clicksend: smsProviderSummary(out)""" + picture + " }));" + source[end:]

base.write_text(source)
print('v5.86 server:', len(source.encode()), 'bytes; SHA256', hashlib.sha256(source.encode()).hexdigest())
