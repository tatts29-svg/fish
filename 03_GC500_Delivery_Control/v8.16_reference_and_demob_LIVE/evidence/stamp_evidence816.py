#!/usr/bin/env python3
"""v8.16 - stamp every rerun evidence JSON with what was actually tested (Author: Andrew Fisher).
Codex's fixtures carry the commit each was written against in `sourceCommit` / `source`; that is kept, renamed
`fixtureProvenance`. Added: testedSourceCommit (the commit holding the tested sources), testedJsSha256 (demob816_src.js),
testedDrawerSha256, base (the live page built on) and candidateSha256 (the build tested).
  python3 stamp_evidence816.py <testedSourceCommit> <base sha256> <candidate sha256>"""
import glob, hashlib, json, os, sys
here = os.path.dirname(os.path.abspath(__file__)); src = os.path.dirname(here)
commit, base, cand = sys.argv[1:4]
sha = lambda f: hashlib.sha256(open(os.path.join(src, f), 'rb').read()).hexdigest()
stamp = {'testedSourceCommit': commit, 'testedJsSha256': sha('demob816_src.js'), 'testedDrawerSha256': sha('drawer816_src.js'), 'base': base, 'candidateSha256': cand}
n = 0
for f in sorted(set(glob.glob(os.path.join(here, 'codex_review', '*_now.json')))):  # the reruns on the tested candidate
    try: j = json.load(open(f, encoding='utf-8'))
    except Exception: continue
    if not isinstance(j, dict): continue
    prov = {k: j.pop(k) for k in ('sourceCommit', 'source') if k in j}
    if prov: j['fixtureProvenance'] = prov.get('sourceCommit') or prov.get('source')
    for k in ('demobSha256', 'demob_sha256', 'candidateSha256'):
        if k in j and k != 'candidateSha256': j['fixtureRunDemobSha256'] = j.pop(k)
    j.update(stamp); json.dump(j, open(f, 'w', encoding='utf-8'), indent=2); n += 1
print('stamped', n, 'files', stamp)
