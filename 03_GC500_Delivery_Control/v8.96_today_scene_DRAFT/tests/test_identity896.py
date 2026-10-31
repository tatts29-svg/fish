#!/usr/bin/env python3
"""v8.96 changes presentation only. Against the same chain without it, the page differs in exactly four places: the release
footer, the eight media entries and the manifest hash in DATA, the v8.96 style block and the v8.96 script block. Everything
else is byte for byte the base's: every record, every figure, every pin, every other script.
    python3 v8.96_today_scene_DRAFT/tests/test_identity896.py <base page (chain without v8.96)> <v8.96 page>"""
import json, re, sys
from pathlib import Path

here = Path(__file__).resolve().parent.parent
A = json.loads((here / 'atlas896.json').read_text())
MINE = {c['sha256'] for c in A['cells']}


def data_of(s):
    m = re.search(r'const DATA = (\{.*?\});\n', s); assert m, 'no DATA'
    return m, json.loads(m.group(1))


def main(base_path, cand_path):
    base, cand = Path(base_path).read_text(), Path(cand_path).read_text()
    fails = []
    # 1. the footer
    fb = re.findall(r' · v8\.(?:89|9[0-6])\b', base); fc = re.findall(r' · v8\.(?:89|9[0-6])\b', cand)
    if not (len(fb) == 1 and fc == [' · v8.96']): fails.append('footer: base %r, candidate %r' % (fb, fc))
    # 2. DATA: only media (+8) and hostedMedia.manifest
    mb, DB = data_of(base); mc, DC = data_of(cand)
    added = set(DC['media']) - set(DB['media']); removed = set(DB['media']) - set(DC['media'])
    if added != MINE or removed: fails.append('media: added %d (expected the 8 pictures: %s), removed %d' % (len(added), added == MINE, len(removed)))
    for sha in MINE:
        c = next(x for x in A['cells'] if x['sha256'] == sha)
        if DC['media'].get(sha) != {k: c[k] for k in ('file', 'sha256', 'type', 'bytes', 'scope')}: fails.append('media entry differs: ' + sha[:12])
    DC2 = json.loads(json.dumps(DC))
    for sha in MINE: DC2['media'].pop(sha, None)
    if DC2['hostedMedia'].get('manifest') == DB['hostedMedia'].get('manifest'): fails.append('manifest hash did not change')
    DC2['hostedMedia']['manifest'] = DB['hostedMedia'].get('manifest')
    if json.dumps(DC2, sort_keys=True, ensure_ascii=False) != json.dumps(DB, sort_keys=True, ensure_ascii=False):
        diff = [k for k in set(DB) | set(DC2) if json.dumps(DB.get(k), sort_keys=True) != json.dumps(DC2.get(k), sort_keys=True)]
        fails.append('DATA differs beyond media and manifest in: %r' % diff)
    manifest_file = Path(cand_path).parent / 'media_manifest_v896.json'
    if manifest_file.exists():
        man = json.loads(manifest_file.read_text())
        if man.get('sha256') != DC['hostedMedia'].get('manifest'): fails.append('media_manifest_v896.json does not carry the page\'s manifest hash')
        if len(man.get('assets', [])) != len(DC['media']): fails.append('manifest lists %d files, the page names %d' % (len(man.get('assets', [])), len(DC['media'])))
    else: fails.append('media_manifest_v896.json is not beside the page')
    # 3. the rest of the page, with the four v8.96 pieces taken out, is the base
    rest = cand[:mc.start(1)] + mb.group(1) + cand[mc.end(1):]
    rest = rest.replace(' · v8.96', fb[0] if fb else ' · v8.96', 1)
    n1 = len(re.findall(r'<style id="scene896-style">.*?</style>\n', rest, re.S)); rest = re.sub(r'<style id="scene896-style">.*?</style>\n', '', rest, count=1, flags=re.S)
    n2 = len(re.findall(r'<script id="scene896-script">\n.*?</script>\n', rest, re.S)); rest = re.sub(r'<script id="scene896-script">\n.*?</script>\n', '', rest, count=1, flags=re.S)
    if n1 != 1 or n2 != 1: fails.append('style blocks %d, script blocks %d (expected one each)' % (n1, n2))
    if rest != base:
        i = next((k for k in range(min(len(rest), len(base))) if rest[k] != base[k]), min(len(rest), len(base)))
        fails.append('the page differs beyond the four v8.96 pieces at byte %d: %r vs %r' % (i, rest[i:i + 60], base[i:i + 60]))
    print('base %s (%d bytes) -> v8.96 %s (%d bytes): media +%d, manifest %s -> %s' % (Path(base_path).name, len(base.encode()), Path(cand_path).name, len(cand.encode()), len(added), DB['hostedMedia'].get('manifest', '')[:12], DC['hostedMedia'].get('manifest', '')[:12]))
    for f in fails: print('FAIL ' + f)
    print('PASS: DATA, MASTER_LOC and every script are the base\'s; only the footer, the eight pictures, the manifest hash and the v8.96 style and script differ' if not fails else 'FAILED %d' % len(fails))
    return 1 if fails else 0


if __name__ == '__main__':
    sys.exit(main(*sys.argv[1:3]))
