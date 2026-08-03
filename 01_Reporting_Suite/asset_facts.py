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
    by_item, by_var, iv = {}, {}, {}
    for v in FD.variants(data):
        f = FD.fleet(data, v['variant'], with_money=False)
        if not f:
            continue
        #  THE UNIT TO ISSUE NEXT (Andrew, 3 Aug 2026: "does it tell
        #  you another item_Number to use"). Fleet Details already
        #  ranks every asset and flags the pick; carrying its item
        #  number here means the card for a tool that is OUT can name
        #  the exact unit to hand over instead - an answer, not a
        #  shrug. Only ever an asset that is on the shelf and not
        #  excluded, because "use next" pointing at a reserved machine
        #  sends a bloke to a shelf he cannot take from.
        ux = ''
        for r in f['rows']:
            if r.get('useNext') and not r.get('out') \
                    and not r.get('excluded'):
                ux = r.get('item') or ''
                break
        if not ux:
            for r in f['rows']:
                if not r.get('out') and not r.get('excluded'):
                    ux = r.get('item') or ''
                    break
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
            'ux': ux,
        })
        for r in f['rows']:
            it = r.get('item') or ''
            if not it:
                continue
            iv[it] = v['variant']
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
    #  'iv' is ITEM -> FLEET, the join that beats every spelling
    #  problem. Where neither the exact code nor a safe alias answers -
    #  the seven colliding spanner pairs, and 149 groups whose store
    #  code shares nothing with the fleet code - the group's own member
    #  item numbers say which fleet it is, because an asset belongs to
    #  exactly one. Andrew, 3 Aug 2026: "does it tell you another
    #  item_Number to use". Build-time only: resolve_groups() uses it
    #  and BUILD_MY_GEAR strips it before the payload ships, so the
    #  phone never downloads it.
    out = {'item': by_item, 'variant': by_var, 'valias': alias, 'iv': iv}

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
    and parses to learn nothing.

    'u' is the one key where 0 survives: a measured 0% is a fact - the
    thing sat on the shelf all shutdown - and dropping it made the card
    show a utilisation section at 1% but nothing at all at 0%, which
    reads as "page broken", not "never hired". None still goes: that is
    "cannot be measured", which is a different statement to "nought".
    """
    out = {}
    for k, v in d.items():
        if v in ('', None):
            continue
        if v == 0 and k != 'u':
            continue
        out[k] = v
    return out


def resolve_groups(sd, af):
    """Pin every store product group to its fleet, three ways in order:

      1. the exact product code,
      2. the punctuation-stripped alias, where only one fleet claims it,
      3. the group's own member item numbers - the fix Andrew named:
         a 15/16 and a 1-5/16 spanner may collide as strings, but every
         asset number belongs to exactly one fleet, so the members vote
         and an absolute majority decides. No majority, no answer - a
         split vote means the store group genuinely straddles fleets,
         and a wrong percentage is worse than none.

    Writes g['fv'] only where it differs from g['v'] (the page tries
    the exact code first anyway), and returns (answered, total) so the
    build can print what the join is actually worth instead of assuming.
    """
    fav = (sd.get('find') or {}).get('av') or {}
    iv = af.get('iv') or {}
    answered = total = 0
    for g in sd.get('groups') or []:
        total += 1
        fv = ''
        if g.get('v') in af['variant']:
            fv = g['v']
        if not fv:
            fv = af['valias'].get(vkey(g.get('v'))) or ''
        if not fv:
            members = []
            for u in (g.get('u') or {}):
                members += fav.get((g.get('n') or '') + '\x1f' + u, [])
            members += [w.get('i') for w in (g.get('who') or [])
                        if w.get('i')]
            votes = {}
            for it in members:
                k = iv.get(it)
                if k:
                    votes[k] = votes.get(k, 0) + 1
            if votes:
                best = max(votes.items(), key=lambda x: x[1])
                if best[1] * 2 > sum(votes.values()):
                    fv = best[0]
        if fv:
            answered += 1
            if fv != g.get('v'):
                g['fv'] = fv
    return answered, total
