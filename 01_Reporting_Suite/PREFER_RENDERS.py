#!/usr/bin/env python3
# -*- coding: utf-8 -*-
# =====================================================================
#  COATES | PREFER THE RENDER - set a photo aside, let the render in
#  Cement Australia K2 Shutdown 2026 - Gladstone
#  Author: Andrew Fisher | POWERED BY SITEIQ
#
#  Andrew, 6 Aug 2026: "can I delete the photos and then get it to
#  generate again?"
#
#  Yes - but deleting the thumbnail alone does not stick: thumbs are
#  REGENERATED from the source photos in Photos\ on every My Gear
#  build, so a deleted thumb comes straight back over the render. For
#  a render to hold the spot, the source photo has to step aside.
#
#  This does that, and DESTROYS NOTHING: the source photo moves to
#  Photos_Set_Aside\ (created beside Photos\), the old thumb comes
#  off, and the next thumbnail install fills the code with its
#  approved render. Want the photo back? Move it from Photos_Set_Aside
#  back into Photos\, delete the render thumb for that code, rebuild -
#  the photo wins again, exactly as the rule says.
#
#  Run it:
#    py PREFER_RENDERS.py CODE [CODE ...]   set named codes to render
#    py PREFER_RENDERS.py --all             set EVERY photographed code
#                                           to its render
#    py PREFER_RENDERS.py                   show what it would touch,
#                                           change nothing
#
#  After it runs: 82_INSTALL_THUMBNAILS (the drop zips still in
#  Data_Thumbnail_Drops fill the gaps), then 07 / BUILD_MY_GEAR.
# =====================================================================
import io
import os
import shutil
import sys

import mygear_thumbs as MT

HERE = os.path.dirname(os.path.abspath(__file__))
THUMBS = os.path.join(HERE, 'Gear_Lookup', 'thumbs')
ASIDE = os.path.join(HERE, 'Photos_Set_Aside')


def _mapping():
    """code -> source photo path, exactly as the thumb builder sees it."""
    photos = MT._photo_files(HERE)
    try:
        reg = MT.variant_register(HERE)
        photos = MT.alias_photos(photos, reg.keys(),
                                 loose={c: v.get('n', '')
                                        for c, v in reg.items()
                                        if v.get('drv')})
    except Exception:
        pass
    return photos


def main(argv):
    print('=' * 66)
    print(' COATES | PREFER THE RENDER')
    print('=' * 66)
    photos = _mapping()
    if not photos:
        print(' No source photos on this machine - every code already')
        print(' shows its render. Nothing to do.')
        return 0
    args = [a for a in argv if a != '--all']
    do_all = '--all' in argv
    if not argv:
        print(' {} photographed code(s) on this machine. Run with --all'
              .format(len(photos)))
        print(' to set every one aside for its render, or name codes:')
        for c in sorted(photos)[:15]:
            print('   ' + c)
        if len(photos) > 15:
            print('   ... and {} more'.format(len(photos) - 15))
        print(' NOTHING was changed on this run.')
        return 0
    if do_all:
        targets = sorted(photos)
    else:
        up = {MT.safe_name(str(c).strip().upper()): c for c in photos}
        targets, unknown = [], []
        for a in args:
            k = MT.safe_name(a.strip().upper())
            if k in up:
                targets.append(up[k])
            else:
                unknown.append(a)
        for u in unknown:
            print(' NOT PHOTOGRAPHED HERE (nothing to set aside): ' + u)
    if not targets:
        print(' Nothing to do.')
        return 0
    os.makedirs(ASIDE, exist_ok=True)
    moved, thumbed = 0, 0
    for code in targets:
        src = photos[code]
        try:
            if os.path.isfile(src):
                dest = os.path.join(ASIDE, os.path.basename(src))
                n = 1
                while os.path.isfile(dest):
                    root, ext = os.path.splitext(os.path.basename(src))
                    dest = os.path.join(ASIDE,
                                        '{}__{}{}'.format(root, n, ext))
                    n += 1
                shutil.move(src, dest)
                moved += 1
        except OSError as e:
            print(' could not move {}: {}'.format(os.path.basename(src),
                                                  e))
            continue
        tp = os.path.join(THUMBS,
                          MT.safe_name(str(code).strip().upper()) + '.jpg')
        try:
            if os.path.isfile(tp):
                os.remove(tp)
                thumbed += 1
        except OSError:
            pass
    print(' Source photos set aside : {:,}  (Photos_Set_Aside\\ - '
          'nothing deleted)'.format(moved))
    print(' Old thumbs removed      : {:,}'.format(thumbed))
    print('')
    print(' Now run 82_INSTALL_THUMBNAILS - the drop zips already in')
    print(' Data_Thumbnail_Drops fill every one of those codes with its')
    print(' approved render - then 07 / BUILD_MY_GEAR.')
    print(' Changed your mind on a code? Move its photo back from')
    print(' Photos_Set_Aside\\ into Photos\\, delete that one thumb, and')
    print(' rebuild - the photo wins again.')
    return 0


if __name__ == '__main__':
    sys.exit(main(sys.argv[1:]))
