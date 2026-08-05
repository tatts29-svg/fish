#!/usr/bin/env python3
# -*- coding: utf-8 -*-
# =====================================================================
#  COATES | QUARANTINE KNOWN PLACEHOLDERS - by hash, nothing else
#  Cement Australia K2 Shutdown 2026 - Gladstone
#  Author: Andrew Fisher | POWERED BY SITEIQ
#
#  The 06 Aug cartoon ("LAYOUT ONLY", one image under 35 names) went
#  out to the store machine in an earlier update zip, so it may be
#  sitting in Gear_Lookup\thumbs there too. This moves every copy -
#  identified by its FULL sha256, never by guesswork - into
#  Quarantine_Placeholder_Thumbs\ so those codes draw their honest
#  two-letter tiles until a real picture lands.
#
#  It touches nothing else. Run it before installing a thumbnail
#  drop; RUN_THIS_UPDATE.bat does exactly that.
# =====================================================================
import glob
import hashlib
import os
import shutil

HERE = os.path.dirname(os.path.abspath(__file__))
THUMBS = os.path.join(HERE, 'Gear_Lookup', 'thumbs')
QUAR = os.path.join(HERE, 'Quarantine_Placeholder_Thumbs')
KNOWN = {
    '5797e41730a8aa1a8a55ae639f73ba7eaa0c5c7cfb684eca6e4e83116126c61a',
}


def main():
    print('=' * 66)
    print(' COATES | QUARANTINE KNOWN PLACEHOLDERS')
    print('=' * 66)
    moved = 0
    for p in sorted(glob.glob(os.path.join(THUMBS, '*.jpg'))):
        with open(p, 'rb') as fh:
            if hashlib.sha256(fh.read()).hexdigest() not in KNOWN:
                continue
        if not os.path.isdir(QUAR):
            os.makedirs(QUAR)
        shutil.move(p, os.path.join(QUAR, os.path.basename(p)))
        print('   quarantined: ' + os.path.basename(p))
        moved += 1
    if moved:
        print(' {} placeholder cop{} moved to '
              'Quarantine_Placeholder_Thumbs\\.'.format(
                  moved, 'y' if moved == 1 else 'ies'))
        print(' Those codes draw their two-letter tiles until a real')
        print(' picture or an approved render lands.')
    else:
        print(' No known placeholder in Gear_Lookup\\thumbs. Nothing '
              'moved.')


if __name__ == '__main__':
    main()
