#!/usr/bin/env python3
# -*- coding: utf-8 -*-
# =====================================================================
#  COATES | WHO OWNS IT AND WHO BILLS IT
#  Cement Australia K2 Shutdown 2026 - Gladstone
#  Author: Andrew Fisher | POWERED BY SITEIQ
#
#  WHY (Andrew, 2 Aug 2026): "when i run SITEIQ and if there is baseplan
#  running a contract too at the same time, the plant gear or items that
#  go on the contract are generally subhired gear, hence why the item
#  code in there will have a SUB in the name... and when you see the
#  item_number on siteiq you can see how the number reference is a lot
#  different to others. that's how you tell it apart, with that
#  different sequence of numbers and it's 0 cost."
#
#  And on the streams: "anything with CEM generally means it's cement
#  owned gear... the coatestooling, coatesequipment and NRG, if it's
#  within the normal other storage units, it's coates owned gear that
#  currently has 0 and don't charge for."
#
#  ---------------------------------------------------------------
#  $0 IS NOT "EARNED NOTHING"
#  ---------------------------------------------------------------
#  749 assets on the 30 Jul pull carry a 16816- item number and have
#  charged exactly $0.00 - all 749, not one cent between them. 293 of
#  them have been issued. 176 of the 183 radios have been out.
#
#  They are working hard and earning nothing ON THIS CONTRACT, which is
#  a completely different statement from earning nothing. Without this
#  module a fleet of welders on a workfront reads as dead weight on
#  every page in the suite, because the money is on somebody else's
#  invoice.
#
#  ---------------------------------------------------------------
#  THE BARCODE DECIDES, NOT THE STORAGE UNIT
#  ---------------------------------------------------------------
#  The first cut of this read Andrew's "you can also notice it by the
#  storage unit" as "a Cement_ unit means Cement owns it". The data
#  says otherwise and it would have been an expensive mistake: the CEM
#  barcodes all sit in RADIOS, while the Cement_ units hold 388 assets
#  of which 319 charge, $68,219.09 of them. Those are Coates plant on
#  the site plant account, not client gear.
#
#  So the barcode prefix decides. The unit is only used where Andrew
#  named it as a condition - Coates gear counts as Coates gear when it
#  is in one of the ordinary store units, which is what he said.
#
#  ---------------------------------------------------------------
#  WHAT IT CANNOT PLACE, IT SAYS SO
#  ---------------------------------------------------------------
#  Every prefix this module has not been told about comes back UNKNOWN
#  with the prefix named, so it gets asked about rather than guessed
#  at. On this pull that is a handful of small groups.
# =====================================================================
import re

#  Barcode prefixes, longest first so COATESTOOLING is tested before
#  any shorter prefix could swallow it.
PREFIXES = [
    ('COATESEQUIPMENT', 'COATES_FREE'),
    ('COATESTOOLING', 'COATES_FREE'),
    ('COATESSHUT', 'COATES_FREE'),
    ('NRG', 'COATES_FREE'),
    ('CEM', 'CLIENT'),
    ('SUB', 'SUBHIRE'),
]

#  What each stream MEANS, in words a store hand and a manager read the
#  same way. These strings go straight onto the screens.
STREAMS = {
    'CHARGED': ('on this contract',
                'hired and charged on the SiteIQ contract'),
    'CONTRACT': ('store stock',
                 'ordinary hire stock on this contract - it charges '
                 'when it goes out, and has not been out yet'),
    'SUBHIRE': ('sub-hire',
                'hired in from a supplier - billed through Baseplan, '
                'never on the SiteIQ invoice'),
    'CLIENT': ('client owned',
                'Cement Australia\'s own gear, managed in the store'),
    'COATES_FREE': ('Coates, not charged',
                    'Coates gear on site that is not being charged for'),
    'UNKNOWN': ('not charging',
                'no charge on this contract and the stream is not '
                'recorded - worth naming'),
}


def _norm(s):
    return ' '.join(str(s or '').split()).upper()


def prefix_of(barcode):
    """The letters at the front of a barcode, for reporting what could
    not be placed."""
    b = _norm(barcode)
    m = re.match(r'^[A-Z~/]+', b)
    return m.group(0) if m else ''


def is_store_unit(unit):
    """One of the ordinary store units, as opposed to a Cement one.

    Andrew's condition, in his words: Coates gear counts as Coates gear
    "if it's within the normal other storage units".
    """
    return not _norm(unit).startswith('CEMENT')


def zero_cost_sequences(assets, min_size=20):
    """The item-number sequences that never charge, worked out from the
    data instead of typed in.

    Andrew's tell: "you can see how the number reference is a lot
    different to others - that\'s how you tell it apart, with that
    different sequence of numbers and it\'s 0 cost."

    On K2 that sequence is 16816-, but 16816 looks like a contract
    number, and a contract number typed into this file would quietly
    stop being true at the next shutdown. So the leading segment of
    every item number is grouped, and a group qualifies when it is big
    enough to be a real registration sequence AND has taken exactly
    nothing across every asset in it. Here that finds 16816 and nothing
    else. At Ampol it will find whatever Ampol\'s is, with no edit.
    """
    groups = {}
    for a in assets:
        it = str(a.get('item') or '')
        if '-' not in it:
            continue
        head = it.split('-', 1)[0]
        if not head.isdigit():
            continue
        g = groups.setdefault(head, {'n': 0, 'rev': 0.0})
        g['n'] += 1
        g['rev'] += a.get('revenue') or 0.0
    return {h for h, g in groups.items()
            if g['n'] >= min_size and g['rev'] == 0.0}


def in_zero_sequence(asset, seqs):
    it = str(asset.get('item') or '')
    return '-' in it and it.split('-', 1)[0] in seqs


def stream(asset, seqs=None):
    """(code, short, long) - who owns it and who bills it.

    ORDINARY STOCK IS THE DEFAULT, and that matters. A first cut ran
    the barcode test over the whole register and put 3,823 assets in
    "not charging" - almost all of them ordinary hire stock with a
    descriptive barcode like SKT or SPANNER that simply had not been
    issued yet. Only 106 of them had ever gone out. They are not a
    billing stream, they are a shelf.

    So the item-number sequence decides FIRST. Only inside that odd
    sequence does the barcode say which stream, exactly the way Andrew
    described it.
    """
    if (asset.get('revenue') or 0) > 0:
        s, l = STREAMS['CHARGED']
        return 'CHARGED', s, l
    if seqs is None or not in_zero_sequence(asset, seqs):
        s, l = STREAMS['CONTRACT']
        return 'CONTRACT', s, l
    bc = _norm(asset.get('bc'))
    for p, code in PREFIXES:
        if bc.startswith(p):
            if code == 'COATES_FREE' and not is_store_unit(asset.get('unit')):
                break
            s, l = STREAMS[code]
            return code, s, l
    s, l = STREAMS['UNKNOWN']
    return 'UNKNOWN', s, l


def bills_elsewhere(asset, seqs=None):
    """True when the money for this asset lands on another invoice.

    The one test a page needs before it prints $0 against something a
    crew has been using all week.
    """
    return stream(asset, seqs)[0] in ('SUBHIRE', 'CLIENT', 'COATES_FREE',
                                      'UNKNOWN')


def summary(assets):
    """Counts per stream, plus the prefixes nothing could place."""
    assets = list(assets)
    seqs = zero_cost_sequences(assets)
    out, unknown = {}, {}
    for a in assets:
        code, short, _long = stream(a, seqs)
        r = out.setdefault(code, {'code': code, 'label': short, 'assets': 0,
                                  'issued': 0, 'out': 0})
        r['assets'] += 1
        r['issued'] += 1 if a.get('issued') else 0
        r['out'] += 1 if a.get('status') == 'On Hire' else 0
        if code == 'UNKNOWN':
            p = prefix_of(a.get('bc')) or '(no barcode)'
            u = unknown.setdefault(p, {'prefix': p, 'assets': 0, 'units': {}})
            u['assets'] += 1
            un = a.get('unit') or ''
            u['units'][un] = u['units'].get(un, 0) + 1
    return {'streams': sorted(out.values(), key=lambda r: -r['assets']),
            'unknown': sorted(unknown.values(), key=lambda r: -r['assets']),
            'sequences': sorted(seqs)}
