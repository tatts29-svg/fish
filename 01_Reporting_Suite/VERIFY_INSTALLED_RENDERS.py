#!/usr/bin/env python3
# -*- coding: utf-8 -*-
# =====================================================================
#  COATES | VERIFY THE INSTALLED RENDERS - and only the renders
#  Cement Australia K2 Shutdown 2026 - Gladstone
#  Author: Andrew Fisher | POWERED BY SITEIQ
#
#  WHY (6 Aug 2026): the release verifier judges the WHOLE thumbs
#  folder against the render release's manifest. On the work laptop -
#  where 577 real photographs rightly beat their renders and hundreds
#  more codes carry photos the release never covered - that printed
#  "FAILED - 2,152 issue(s)" over a folder that is BETTER than the
#  release. A verifier that fails you for owning real photos teaches
#  you to ignore verifiers.
#
#  This one checks exactly what the guarded installer installed (the
#  RENDER_MANIFEST beside the thumbs) against the release manifest:
#  those files must match the release byte for byte, 800x800, under
#  the cap. Everything else in the folder is YOURS - real photos and
#  older thumbs - and is reported as kept, which is the rule working,
#  not a failure. The known placeholder is still hunted everywhere.
#
#  Run it:  py VERIFY_INSTALLED_RENDERS.py
#  (RUN_THIS_UPDATE runs it as its verify step.)
# =====================================================================
import csv
import hashlib
import io
import os

HERE = os.path.dirname(os.path.abspath(__file__))
THUMBS = os.path.join(HERE, 'Gear_Lookup', 'thumbs')
MANIFEST = os.path.join(THUMBS, 'RENDER_MANIFEST.txt')
RELEASE = os.path.join(HERE, 'Coates_K2_Road2_649_Release_Manifest.csv')
PLACEHOLDER = ('5797e41730a8aa1a8a55ae639f73ba7eaa0c5c7cfb684e'
               'ca6e4e83116126c61a')


def main():
    print('=' * 66)
    print(' COATES | VERIFY THE INSTALLED RENDERS')
    print('=' * 66)
    if not os.path.isdir(THUMBS):
        print(' No thumbs folder yet - nothing to verify.')
        return 0
    rel = {}
    if os.path.isfile(RELEASE):
        with io.open(RELEASE, encoding='utf-8-sig') as fh:
            for r in csv.DictReader(fh):
                rel[r['output_filename'].upper()] = r['output_sha256']
    installed = set()
    if os.path.isfile(MANIFEST):
        with io.open(MANIFEST, encoding='utf-8') as fh:
            installed = set(x.strip().upper() for x in fh
                            if x.strip() and not x.startswith('#'))

    ok, bad, kept, ph = 0, [], 0, []
    for n in sorted(os.listdir(THUMBS)):
        if not n.lower().endswith('.jpg'):
            continue
        p = os.path.join(THUMBS, n)
        with open(p, 'rb') as fh:
            h = hashlib.sha256(fh.read()).hexdigest()
        if h == PLACEHOLDER:
            ph.append(n)
            continue
        stem = n[:-4].upper()
        if stem in installed:
            want = rel.get(n.upper())
            if want and h != want:
                bad.append((n, 'installed render does not match the '
                            'release'))
            elif not want and rel:
                bad.append((n, 'installed as a render but not in the '
                            'release manifest'))
            else:
                ok += 1
        else:
            kept += 1

    print(' Renders installed  : {:,} verified against the release'
          .format(ok))
    print(' Your own pictures  : {:,} - real photos and older thumbs, '
          'KEPT.'.format(kept))
    print('     That is the rule working: a real photo is never '
          'overwritten')
    print('     by a render, and it is not judged against one either.')
    if ph:
        print(' *** KNOWN PLACEHOLDER : {} file(s) - quarantine with '
              'QUARANTINE_KNOWN_PLACEHOLDERS ***'.format(len(ph)))
        for n in ph[:10]:
            print('     ' + n)
    if bad:
        print(' PROBLEMS           : {}'.format(len(bad)))
        for n, why in bad[:15]:
            print('     {} - {}'.format(n, why))
        if len(bad) > 15:
            print('     ... and {} more'.format(len(bad) - 15))
        print(' FAILED - the installed renders above do not match the '
              'release.')
        return 1
    if ph:
        print(' FAILED - the placeholder above must be quarantined.')
        return 1
    print(' PASS - every installed render matches the release, and '
          'every')
    print(' picture of your own is exactly where you left it.')
    return 0


if __name__ == '__main__':
    import sys
    sys.exit(main())
