#!/usr/bin/env python3
# -*- coding: utf-8 -*-
# =====================================================================
#  COATES | ASSET FACTS - everything the store is allowed to know
#  Cement Australia K2 Shutdown 2026 - Gladstone
#  Author: Andrew Fisher | POWERED BY SITEIQ
#
#  WHY (Andrew, 3 Aug 2026): "The stores area should show every bit of
#  detail about that asset no. Including Utilisation, how many times
#  its been out ... as well as the serial number. We dont need to know
#  revenue on assets but we can know utilisation."
#
#  So this is the one place that answers "what do we know about this
#  asset number", and it is deliberately the ONLY thing the store board
#  asks. Utilisation, times out, serial, where it lives, what shape it
#  is in - and no money, ever.
#
#  ---------------------------------------------------------------
#  IT DOES NOT INVENT A SECOND UTILISATION
#  ---------------------------------------------------------------
#  The percentage here is the SAME number Fleet Details prints, taken
#  from fleet_detail.py rather than worked out again. That matters: the
#  client-issued figure has rules behind it that Andrew set - branch
#  reservations, tracked gear, open hires that never closed - and a
#  second implementation would drift from the first within a fortnight
#  and leave two screens arguing about the same grinder.
#
#  ---------------------------------------------------------------
#  NO MONEY. NOT EVEN ACCIDENTALLY
#  ---------------------------------------------------------------
#  Every fleet is read with with_money=False, and what this returns is
#  then SEARCHED for a money field before it is handed over. The store
#  board goes on the store Wi-Fi; a revenue figure reaching it is the
#  one fault that cannot be walked back once a phone has loaded it.
# =====================================================================
import re

import fleet_detail as FD
import serials as SR

#  Anything that smells of money. Checked against the finished payload,
#  not trusted to the callers upstream.
MONEY = re.compile(r'(revenue|charge|rate|price|cost|\$)', re.IGNORECASE)


def vkey(v):
    """A product code with the punctuation taken out.

    The store register and the transaction feed do not spell a product
    code the same way - the same lesson that bit the utilisation report,
    where "Rubbish Chute 1M" and RUBCHUTE1M shared not one spelling.
    Joining on the raw string matched 788 of the store's 1,052 product
    groups; joining on this matches 903. The other 149 genuinely have no
    fleet behind them - tracked and client-owned gear, mostly - and they
    correctly show no utilisation rather than a made-up nought.

    IT IS NOT SAFE ON ITS OWN, WHICH IS WHY IT IS ONLY EVER A FALLBACK.
    Stripping punctuation makes SPANNERCOM15/16 and SPANNERCOM1-5/16
    identical - a 15/16 spanner and a 1-5/16 spanner, which are not the
    same tool and are not the same fleet. Seven such pairs exist in this
    store. So the exact code is tried first, and a normalised key that
    two different fleets share is thrown away rather than answered with
    whichever one happened to be written last.
    """
    return re.sub(r'[^A-Z0-9]', '', str(v or '').upper())


def _pct(v):
    """A percentage a phone can print. None stays None - an asset with
    no window to measure against must not read as a confident 0%."""
    return None if v is None else int(v + 0.5)


def build(data):
    """{'item': {...}, 'variant': {...}} for the whole store.

    Keys are short because this rides inside the encrypted store
    payload and every byte is downloaded over the store Wi-Fi:
        u  client-issued utilisation, whole percent
        c  hires that finished inside the window
        o  hires still open right now
        s  serial number, only when it is a real one
        w  USE NEXT / HIGH USE / the band word
        b  band, for the colour of the bar
    """
    by_item, by_var = {}, {}
    for v in FD.variants(data):
        f = FD.fleet(data, v['variant'], with_money=False)
        if not f:
            continue
        by_var[v['variant']] = _clean({
            'u': _pct(f.get('client')),
            'm': _pct(f.get('commercial')),
            'n': v.get('assets') or 0,
            'rd': v.get('ready') or 0,
            'out': v.get('out') or 0,
            'nv': v.get('neverIssued') or 0,
            'c': v.get('cycles') or 0,
            'w': v.get('word') or '',
            'b': v.get('band') or '',
        })
        for r in f['rows']:
            it = r.get('item') or ''
            if not it:
                continue
            by_item[it] = _clean({
                'u': None if r.get('excluded') else _pct(r.get('score')),
                'c': r.get('cycles') or 0,
                'o': r.get('open') or 0,
                's': r.get('serial') or SR.serial_of(it),
                'w': '' if r.get('excluded') else (r.get('word') or ''),
                'b': '' if r.get('excluded') else (r.get('band') or ''),
                'x': r.get('why') or '',
            })
    #  THE FALLBACK INDEX. Exact code first, this second, and any
    #  normalised key claimed by two different fleets is dropped - see
    #  vkey(). Only aliases that actually differ from the real key are
    #  carried, so the phone downloads 384 of these, not all 830.
    seen, alias = {}, {}
    for k in by_var:
        n = vkey(k)
        seen[n] = None if n in seen else k
    for n, k in seen.items():
        if k and n != k:
            alias[n] = k
    out = {'item': by_item, 'variant': by_var, 'valias': alias}

    #  THE GUARD. Same rule and the same kind of check as the counter
    #  screens: searched before it is handed over, so a later edit that
    #  adds a rate here cannot ship quietly onto the store Wi-Fi.
    import json
    if MONEY.search(json.dumps(out)):
        raise SystemExit('\n  REFUSED - a money field reached the asset '
                         'facts.\n  These go on the store Wi-Fi. Fix '
                         'asset_facts.build().')
    return out


def _clean(d):
    """Drop what says nothing. Most assets have no serial and no
    exclusion, and "s":"" on 4,961 of them is bytes a phone downloads
    and parses to learn nothing."""
    return {k: v for k, v in d.items() if v not in ('', None, 0)}
