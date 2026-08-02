#!/usr/bin/env python3
# -*- coding: utf-8 -*-
# =====================================================================
#  COATES | WHERE THE GEAR ACTUALLY SITS - RACKS.txt
#  Cement Australia K2 Shutdown 2026 - Gladstone
#  Author: Andrew Fisher | POWERED BY SITEIQ
#
#  WHY (Andrew, 2 Aug 2026): his Fleet Details design shows
#  "Main Store . Rack B3" against the asset a store hand should issue
#  next. It is the most useful line on the screen - a number and a
#  percentage tell you WHICH one, the rack tells you where to walk.
#
#  ---------------------------------------------------------------
#  SITEIQ DOES NOT CARRY IT
#  ---------------------------------------------------------------
#  Checked on the 30 Jul pull. RENTAL_STOCK has TOOLSTORE, which is a
#  single value for all 5,337 assets ("Cement Tool Store 2026"), and
#  STORAGE_UNIT, which is the category - Tooling, Electrical, Rigging.
#  Neither is a shelf. There is no bin location anywhere in the export,
#  so this cannot be derived and must not be invented.
#
#  So it is Andrew's file, on exactly the pattern HIDDEN_ITEMS.txt
#  already uses: he writes it, updates never overwrite it, and nothing
#  in this suite chooses an entry for him. Empty is fine - the rack
#  line simply does not appear, which is honest, rather than a page
#  guessing at a shelf and sending a bloke to the wrong end of the
#  store.
#
#  ---------------------------------------------------------------
#  THE FORMAT
#  ---------------------------------------------------------------
#    1120347 | Rack B3            one asset, one place
#    COA~60593 | Rack B4          barcodes work too
#    HYDCYL45TLH60MM | Rack B     a whole variant at once
#
#  Item number wins over barcode, barcode wins over variant - most
#  specific first, so a shelf-wide default can be set for a product and
#  a single asset moved off it without editing two lines.
# =====================================================================
import io
import os

HERE = os.path.dirname(os.path.abspath(__file__))
LIST_FILE = os.path.join(HERE, 'RACKS.txt')

_CACHE = None

TEMPLATE = """# WHERE THE GEAR SITS - Andrew's file. Updates never overwrite it.
#
# SiteIQ does not carry a shelf or bin location, so this is the only
# place it can come from. Anything not listed here simply shows no rack
# on the Fleet Details screen - which is better than a guess.
#
# One per line:      <item number, barcode or variant> | <where>
#
#   1120347         | Rack B3
#   COA~60593       | Rack B4
#   HYDCYL45TLH60MM | Rack B
#
# Most specific wins: item number, then barcode, then variant.
# Lines starting with # are ignored. Blank lines are fine.
"""


def _norm(s):
    return ' '.join(str(s or '').split()).upper()


def load(path=None):
    """{key: place}. Cached - a build asks this thousands of times."""
    global _CACHE
    if _CACHE is not None and path is None:
        return _CACHE
    out = {}
    p = path or LIST_FILE
    try:
        with io.open(p, 'r', encoding='utf-8-sig', errors='replace') as fh:
            for line in fh:
                line = line.strip()
                if not line or line.startswith('#') or '|' not in line:
                    continue
                key, where = line.split('|', 1)
                key, where = _norm(key), ' '.join(where.split())
                if key and where:
                    out[key] = where
    except Exception:
        #  A missing or broken list shows no racks. It never stops a
        #  build - losing a line off a screen is a nuisance, a screen
        #  that will not build is a store with nothing on the wall.
        pass
    if path is None:
        _CACHE = out
    return out


def where(item='', barcode='', variant=''):
    """Most specific first. Empty string means 'not recorded', which
    the screen prints as nothing at all rather than as a location."""
    r = load()
    if not r:
        return ''
    for k in (item, barcode, variant):
        if k:
            hit = r.get(_norm(k))
            if hit:
                return hit
    return ''


def count():
    return len(load())


def ensure_file():
    """Write the template if there is no list yet. NEVER touches an
    existing one - it is Andrew's file and his edits are the point."""
    if os.path.exists(LIST_FILE):
        return False
    try:
        with io.open(LIST_FILE, 'w', encoding='utf-8') as fh:
            fh.write(TEMPLATE)
        return True
    except Exception:
        return False
