#!/usr/bin/env python3
# -*- coding: utf-8 -*-
# =====================================================================
#  COATES | INSTALL A THUMBNAIL DROP - safely, or not at all
#  Cement Australia K2 Shutdown 2026 - Gladstone
#  Author: Andrew Fisher | POWERED BY SITEIQ
#
#  The Road 2 render delivery (6 Aug 2026) ships as numbered zips of
#  thumbs\<CODE>.jpg. Its own README says "copy into MyGear's thumbs
#  folder" - and following that to the letter would have OVERWRITTEN
#  28 REAL photographs of our own gear (Andrew's crowsfeet shots among
#  them) with generic renders, because 28 of the 641 approved codes
#  already carry a real picture on this machine.
#
#  THE RULE THIS SCRIPT EXISTS FOR: a real photo is never overwritten
#  by a render. Not by accident, not by a zip, not ever. Renders may
#  refresh renders; only a real photograph replaces a real photograph.
#
#  HOW TO USE
#    1. Drop the delivery zips (Coates_K2_*Thumbnails*.zip) into
#       Data_Thumbnail_Drops\  (created on first run).
#    2. Run this (py INSTALL_THUMBNAIL_DROP.py, or 82_INSTALL_THUMBNAILS).
#    3. Read the report. Nothing is deleted; everything replaced is
#       backed up first under Thumbnail_Backups\<stamp>\.
#    4. Rebuild My Gear (07 / BUILD_MY_GEAR) so the pages learn the
#       new pictures, then spot-check each family against the shelf -
#       the delivery's own condition, and the workbook's.
#
#  WHAT GETS REFUSED, BY NAME, WITH THE REASON PRINTED:
#    * any file whose name is not a register code (nothing lands in
#      thumbs\ that the pages will never ask for)
#    * any file over the 96 KB hard cap or not an 800x800 JPG
#      (Pillow present; without Pillow the size cap still holds)
#    * any code whose existing thumb is NOT listed in the render
#      manifest - that is a real photo, and the rule above applies
# =====================================================================
import io
import os
import sys
import glob
import shutil
import zipfile
import datetime as dt

HERE = os.path.dirname(os.path.abspath(__file__))
DROPS = os.path.join(HERE, 'Data_Thumbnail_Drops')
THUMBS = os.path.join(HERE, 'Gear_Lookup', 'thumbs')
BACKUPS = os.path.join(HERE, 'Thumbnail_Backups')
#  Which thumbs arrived from render drops. Anything in thumbs\ NOT in
#  this manifest is treated as a real photograph and protected. The
#  manifest lives beside the thumbs so it travels with them.
MANIFEST = os.path.join(THUMBS, 'RENDER_MANIFEST.txt')
HARD_CAP = 96 * 1024


#  THE TWO LESSONS OF 06 AUG 2026, in the order they were learned:
#
#  1. The protection rule nearly protected a LIE. The "33 real photos"
#     on this machine were one identical 384x384 cartoon placeholder
#     under 33 names - caught by the render production side, not by
#     us. Known placeholders are condemned BY HASH and replaced.
#
#  2. The first fix over-corrected. It treated ANY byte-identical
#     thumbs as placeholders - and the approved release deliberately
#     reuses one family master across size codes (649 files, 95
#     distinct images, by design). Their correction stands: duplicate
#     bytes do not prove a fake, and unique bytes do not prove a
#     photograph. So identity is decided by EVIDENCE ONLY: the known
#     placeholder hash list condemns, the render manifest records
#     what came from drops, and everything else - duplicated or not -
#     is protected, with duplicates flagged for a human to check with
#     VERIFY_THUMBS_ARE_REAL / VERIFY_THUMBNAIL_RELEASE rather than
#     silently judged by an heuristic that has already been wrong.
KNOWN_PLACEHOLDER_SHA256 = {
    #  the 06 Aug cartoon "LAYOUT ONLY" stand-in, full hash
    '5797e41730a8aa1a8a55ae639f73ba7eaa0c5c7cfb684eca6e4e83116126c61a',
}


def _hashes():
    import hashlib
    from collections import Counter
    out = {}
    for p in glob.glob(os.path.join(THUMBS, '*.jpg')):
        with open(p, 'rb') as fh:
            out[os.path.basename(p)] = \
                hashlib.sha256(fh.read()).hexdigest()
    dupes = {h for h, c in Counter(out.values()).items() if c >= 3}
    return out, dupes


def _manifest():
    try:
        with io.open(MANIFEST, encoding='utf-8') as fh:
            return set(x.strip().upper() for x in fh if x.strip())
    except IOError:
        return set()


def _save_manifest(names):
    with io.open(MANIFEST, 'w', encoding='utf-8') as fh:
        fh.write('# Thumbs that arrived from RENDER drops - anything\n'
                 '# not listed here is treated as a real photograph\n'
                 '# and is never overwritten by a render.\n')
        for n in sorted(names):
            fh.write(n + '\n')


def main():
    print('=' * 66)
    print(' COATES | INSTALL A THUMBNAIL DROP')
    print('=' * 66)
    if not os.path.isdir(DROPS):
        os.makedirs(DROPS)
        print(' Created ' + os.path.relpath(DROPS, HERE) + '\\')
        print(' Drop the delivery zips in there and run this again.')
        return
    zips = sorted(glob.glob(os.path.join(DROPS, '*.zip')))
    if not zips:
        print(' No zips in Data_Thumbnail_Drops\\ - drop the delivery')
        print(' files in and run this again. Nothing was changed.')
        return
    if not os.path.isdir(THUMBS):
        os.makedirs(THUMBS)

    import mygear_thumbs as MT
    reg = MT.variant_register(HERE)
    codes = set(MT.safe_name(str(c).strip().upper()) for c in reg)

    try:
        from PIL import Image
        pil = True
    except ImportError:
        pil = False
        print(' (No Pillow on this machine - the 800x800 check is '
              'skipped; the size cap still holds.)')

    stamp = dt.datetime.now().strftime('%Y-%m-%d_%H%M')
    bdir = os.path.join(BACKUPS, stamp)
    manifest = _manifest()
    hashes, dupe_hashes = _hashes()

    def _is_placeholder(fname):
        #  Condemned by KNOWN HASH only - never by duplication, which
        #  the approved family renders share by design.
        return hashes.get(fname, '') in KNOWN_PLACEHOLDER_SHA256

    installed, refreshed, protected, rejected = [], [], [], []
    replaced_ph, dupe_note = [], []
    for zp in zips:
        try:
            zf = zipfile.ZipFile(zp)
        except zipfile.BadZipFile:
            rejected.append((os.path.basename(zp), 'not a readable zip'))
            continue
        for m in zf.infolist():
            base = os.path.basename(m.filename)
            if not base.lower().endswith('.jpg'):
                continue
            stem = base[:-4].upper()
            if stem not in codes:
                rejected.append((base, 'no register code answers to '
                                 'this name'))
                continue
            data = zf.read(m)
            if len(data) > HARD_CAP:
                rejected.append((base, '{:,} bytes - over the {:,} '
                                 'cap'.format(len(data), HARD_CAP)))
                continue
            if pil:
                try:
                    im = Image.open(io.BytesIO(data))
                    if im.size != (800, 800):
                        rejected.append((base, 'is {}x{}, not 800x800'
                                         .format(*im.size)))
                        continue
                except Exception:
                    rejected.append((base, 'not a readable JPG'))
                    continue
            dest = os.path.join(THUMBS, base)
            exists = os.path.isfile(dest)
            if exists and stem not in manifest:
                if _is_placeholder(base):
                    #  The known stand-in, by hash. A render is
                    #  strictly better than a placeholder.
                    replaced_ph.append(base)
                else:
                    #  THE RULE. No render history and not a known
                    #  placeholder: treated as a real photograph of
                    #  our gear, and kept. If its bytes match other
                    #  thumbs it is flagged below for a human check -
                    #  flagged, never judged.
                    protected.append(base)
                    if hashes.get(base, '') in dupe_hashes:
                        dupe_note.append(base)
                    continue
            if exists:
                if not os.path.isdir(bdir):
                    os.makedirs(bdir)
                shutil.copy2(dest, os.path.join(bdir, base))
                if base not in replaced_ph:
                    refreshed.append(base)
            else:
                installed.append(base)
            with open(dest, 'wb') as fh:
                fh.write(data)
            manifest.add(stem)
        zf.close()

    _save_manifest(manifest)
    print(' Delivery zips read : {}'.format(len(zips)))
    print(' Installed new      : {:,}'.format(len(installed)))
    print(' Refreshed renders  : {:,}{}'.format(
        len(refreshed),
        '  (previous copies in Thumbnail_Backups\\{}\\)'.format(stamp)
        if refreshed else ''))
    if replaced_ph:
        print(' Replaced PLACEHOLDERS: {:,} - the known stand-in, by '
              'hash;'.format(len(replaced_ph)))
        print('     a render is strictly better (backups kept).')
    if dupe_note:
        print(' FLAGGED (kept)     : {:,} protected file(s) share bytes '
              'with other thumbs.'.format(len(dupe_note)))
        print('     Duplication proves nothing either way - run '
              'VERIFY_THUMBS_ARE_REAL')
        print('     and decide by eye. Nothing was changed.')
    print(' PROTECTED          : {:,} - real photos a render tried to '
          'replace'.format(len(protected)))
    for p in protected[:30]:
        print('     kept your photo: ' + p)
    if len(protected) > 30:
        print('     ... and {} more'.format(len(protected) - 30))
    print(' Rejected           : {:,}'.format(len(rejected)))
    for b, why in rejected[:15]:
        print('     {} - {}'.format(b, why))
    if len(rejected) > 15:
        print('     ... and {} more'.format(len(rejected) - 15))
    print('')
    print(' Now rebuild My Gear (07 / BUILD_MY_GEAR.py) so the pages')
    print(' learn the new pictures - then spot-check each family')
    print(' against the shelf. That check is the delivery\'s own')
    print(' release condition, not a suggestion.')


if __name__ == '__main__':
    main()
