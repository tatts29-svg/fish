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
KNOWN_PLACEHOLDER = '5797e41730a8'   # the 06 Aug "LAYOUT ONLY" cartoon


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
            by_hash[hashlib.sha256(fh.read()).hexdigest()[:12]].append(
                os.path.basename(p))
    dupes = {h: n for h, n in by_hash.items() if len(n) > 1}
    distinct = sum(1 for n in by_hash.values() if len(n) == 1)
    print(' Thumbs on disk     : {:,}'.format(len(files)))
    print(' Distinct images    : {:,} - each of these CAN be a real '
          'picture'.format(distinct))
    print(' Identical copies   : {:,} files sharing {} image(s) - '
          'these are stand-ins, not photographs'.format(
              sum(len(n) for n in dupes.values()), len(dupes)))
    if KNOWN_PLACEHOLDER in by_hash:
        print(' *** The known 06-Aug cartoon placeholder is HERE, '
              'under {} name(s). ***'.format(
                  len(by_hash[KNOWN_PLACEHOLDER])))
    for h, names in sorted(dupes.items(), key=lambda x: -len(x[1])):
        tag = '  <- the 06-Aug placeholder' \
            if h == KNOWN_PLACEHOLDER else ''
        print('')
        print(' One image, {} names ({}){}:'.format(len(names), h, tag))
        for n in names[:40]:
            print('   ' + n)
        if len(names) > 40:
            print('   ... and {} more'.format(len(names) - 40))
    if dupes:
        print('')
        print(' WHAT TO DO: quarantine the identical copies (move them')
        print(' out of thumbs\\), rebuild My Gear so the pages fall')
        print(' back to their honest two-letter tiles, and let render')
        print(' drops (button 82) and the counter booth fill the codes')
        print(' properly. A wrong picture is worse than no picture.')
    else:
        print('')
        print(' Every thumb is a distinct image. The protection rule in')
        print(' button 82 will defend all of them, and it should.')


if __name__ == '__main__':
    main()
