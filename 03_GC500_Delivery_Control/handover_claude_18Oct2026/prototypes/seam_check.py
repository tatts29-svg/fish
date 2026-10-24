"""Author: Andrew Fisher. Does the boot/header set (flicker parts A, B, C, E) land cleanly with the v10.61 load and idle
patches in either order? Every hunk must be found exactly once at its turn, and the two results must be the same page.
Read-only: works on copies in a temporary folder.      python3 seam_check.py live.html
"""
import hashlib, sys
import hunk_map as H

page = open(sys.argv[1], encoding='utf-8').read()
P = H.PATCHES
ok = True
for other in ('load', 'idle'):
    outs = []
    for order in (('flicker', other), (other, 'flicker')):
        rec = H.Recorder(); t = page
        for name in order:
            t = H.run_patch(rec, name, *P[name], t, parts='ABCE' if name == 'flicker' else None)
        bad = [(r['patch'], r['what'], r.get('in_sequence')) for r in rec.rows if r.get('stopped') or r.get('in_sequence') != 1]
        outs.append(hashlib.sha256(t.encode()).hexdigest())
        print(' then '.join(order), '-', len(rec.rows), 'hunks,', 'all found once' if not bad else 'PROBLEMS ' + repr(bad), outs[-1][:12])
        ok = ok and not bad
    same = outs[0] == outs[1]
    print('  same page either order:', same); ok = ok and same
print('SEAM OK' if ok else 'SEAM PROBLEM'); sys.exit(0 if ok else 1)
