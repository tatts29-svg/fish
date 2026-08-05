#!/usr/bin/env python3
# -*- coding: utf-8 -*-
# =====================================================================
#  COATES | ARE THE THUMBNAILS REAL? - the 20-second answer
#  Cement Australia K2 Shutdown 2026 - Gladstone
#  Author: Andrew Fisher | POWERED BY SITEIQ
#
#  Born 06 Aug 2026, the day "33 real photos" turned out to be ONE
#  cartoon placeholder under 33 names - counted as coverage, reported
#  as coverage, and nearly defended against a genuine render by the
#  installer's own protection rule. The render production side caught
#  it; this machine's suite did not, because nothing ever OPENED the
#  files it was counting.
#
#  This opens them. Run it on ANY machine before trusting what is in
#  Gear_Lookup\thumbs:
#
#    py VERIFY_THUMBS_ARE_REAL.py
#
#  It hashes every thumb and answers three questions out loud:
#    1. How many are DISTINCT images (each one can be a real picture)?
#    2. How many are BYTE-IDENTICAL COPIES of each other? 33 different
#       crowsfeet cannot be one file - identical copies are stand-ins,
#       never photographs, and they are named here one by one.
#    3. Is the known 06-Aug placeholder among them (by hash)?
#
#  It changes nothing. It only tells the truth about the folder.
# =====================================================================
import glob
import hashlib
import os
from collections import Counter, defaultdict

HERE = os.path.dirname(os.path.abspath(__file__))
THUMBS = os.path.join(HERE, 'Gear_Lookup', 'thumbs')
KNOWN_PLACEHOLDER = ('5797e41730a8aa1a8a55ae639f73ba7eaa0c5c7cfb684e'
                     'ca6e4e83116126c61a')  # the 06 Aug cartoon, full hash

#  CORRECTED 06 AUG 2026, SAME DAY IT WAS BORN: the render production
#  side pointed out that approved FAMILY RENDERS are deliberately one
#  image shared across size codes - so byte-identical thumbs are NOT
#  automatically stand-ins, and unique bytes are NOT automatically
#  photographs. This checker therefore CONDEMNS only the known
#  placeholder hash; everything else it reports as shared-image
#  groups for a human eye, and a release is validated properly with
#  VERIFY_THUMBNAIL_RELEASE.py against its own manifest.


def main():
    print('=' * 66)
    print(' COATES | ARE THE THUMBNAILS REAL?')
    print('=' * 66)
    files = sorted(glob.glob(os.path.join(THUMBS, '*.jpg')))
    if not files:
        print(' Gear_Lookup\\thumbs holds no JPGs at all - nothing to')
        print(' verify, and nothing pretending to be a photo. Coverage')
        print(' comes from render drops (button 82) and the counter')
        print(' booth from here.')
        return
    by_hash = defaultdict(list)
    for p in files:
        with open(p, 'rb') as fh:
            by_hash[hashlib.sha256(fh.read()).hexdigest()].append(
                os.path.basename(p))
    dupes = {h: n for h, n in by_hash.items() if len(n) > 1}
    distinct = sum(1 for n in by_hash.values() if len(n) == 1)
    print(' Thumbs on disk     : {:,}'.format(len(files)))
    print(' Distinct images    : {:,}'.format(distinct))
    print(' Shared-image groups: {} image(s) across {:,} files - '
          'family renders share'.format(
              len(dupes), sum(len(n) for n in dupes.values())))
    print('     bytes BY DESIGN; sharing proves nothing either way. '
          'Only the known')
    print('     placeholder hash below condemns a file by itself.')
    if KNOWN_PLACEHOLDER in by_hash:
        print(' *** The known 06-Aug cartoon placeholder is HERE, '
              'under {} name(s). ***'.format(
                  len(by_hash[KNOWN_PLACEHOLDER])))
    for h, names in sorted(dupes.items(), key=lambda x: -len(x[1])):
        tag = '  <- the 06-Aug placeholder - QUARANTINE THESE' \
            if h == KNOWN_PLACEHOLDER else '  (family sharing is normal)'
        print('')
        print(' One image, {} names ({}){}:'.format(
            len(names), h[:12], tag))
        for n in names[:40]:
            print('   ' + n)
        if len(names) > 40:
            print('   ... and {} more'.format(len(names) - 40))
    if KNOWN_PLACEHOLDER in by_hash:
        print('')
        print(' WHAT TO DO: quarantine the placeholder copies (move')
        print(' them out of thumbs\\), rebuild My Gear so those codes')
        print(' fall back to their honest two-letter tiles, and let')
        print(' render drops (button 82) and the counter booth fill')
        print(' them properly. A wrong picture is worse than no')
        print(' picture.')
    else:
        print('')
        print(' No known placeholder here. To validate a render release')
        print(' against its own manifest, run:')
        print('   py VERIFY_THUMBNAIL_RELEASE.py --thumbs-dir '
              'Gear_Lookup\\thumbs \\')
        print('     --release-manifest '
              'Coates_K2_Road2_649_Release_Manifest.csv')


if __name__ == '__main__':
    main()
