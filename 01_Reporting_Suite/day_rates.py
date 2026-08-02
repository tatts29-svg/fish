#!/usr/bin/env python3
# -*- coding: utf-8 -*-
# =====================================================================
#  COATES | DAY RATES - what the job was quoted, per item, per day
#  Cement Australia K2 Shutdown 2026 - Gladstone
#  Author: Andrew Fisher | POWERED BY SITEIQ
#
#  WHY: no SiteIQ export carries a per-asset day rate, so every report
#  in this suite that wants to put a dollar against idle time has had
#  to write TBC. The quote has them. Drop it in and they fill in.
#
#  PER EACH (Andrew, 2 Aug 2026). A quoted rate is per item per day,
#  not per the quoted quantity - so 50 crash barriers at $2.07 is
#  $103.50 a day, not $2.07. Every sum in here multiplies by quantity
#  AND by days, in that order, and says so on the page.
#
#  WHERE TO PUT IT:
#      Data_Quote\   <- drop the quote in here. Newest .xlsx wins.
#                       Anything with an item or description column and
#                       a rate column will read; the header names vary
#                       between quotes and this tries the usual ones.
#
#  TWO INVOICE STREAMS, TWO RATE CARDS, AND THEY NEVER CROSS.
#  Baseplan bills its own 16 lines - radios, gas, two welders, fridges,
#  freezer, ice, tables, chairs and their transport - and carries its
#  own Rate 1. build_baseplan_costs.py owns that and its rule is
#  absolute: no Baseplan total ever feeds a SiteIQ report. So this
#  module reads the QUOTE, for the SiteIQ-billed gear, and it will not
#  silently reach into Data_Baseplan to fill a gap.
#
#  WHAT IT WILL NOT DO: invent a rate. An item with no quoted rate
#  prices as None and every report shows it as TBC, never as $0. A zero
#  would say "this earned nothing", which is a different claim and a
#  wrong one.
# =====================================================================
import glob
import os
import re

BASE = os.path.dirname(os.path.abspath(__file__))
QUOTE_DIR = 'Data_Quote'

#  Header names seen on quotes, lowest-fuss first. Matched loosely
#  because a quote is a human document and nobody spells these twice.
ITEM_COLS = ('item number', 'item no', 'item', 'asset no', 'asset number',
             'sku', 'product code', 'code')
DESC_COLS = ('description', 'item description', 'equipment', 'asset',
             'bundle equipment', 'product')
RATE_COLS = ('day rate', 'daily rate', 'rate per day', 'rate 1', 'rate',
             'unit rate', 'price per day')
QTY_COLS = ('quantity', 'qty')


def _norm(s):
    """Descriptions match on words, not on punctuation and case."""
    s = re.sub(r'[^a-z0-9]+', ' ', str(s or '').lower())
    return ' '.join(s.split())


def _num(v):
    if isinstance(v, (int, float)):
        return float(v)
    s = re.sub(r'[^0-9.\-]', '', str(v or ''))
    try:
        return float(s)
    except ValueError:
        return 0.0


def _pick(hdr, wanted):
    """Index of the first header that looks like one of `wanted`."""
    low = [_norm(h) for h in hdr]
    for w in wanted:
        for i, h in enumerate(low):
            if h == _norm(w):
                return i
    for w in wanted:
        for i, h in enumerate(low):
            if h and _norm(w) in h:
                return i
    return None


def quote_path(here=None):
    """The quote, and ONLY something meant to be the quote.

    Anything sitting in Data_Quote\ is there on purpose, so any .xlsx
    in it counts. In the suite folder itself it must be NAMED like a
    quote - the first cut fell back to *.xlsx there and cheerfully
    picked up STOCKTAKE.xlsx, which is exactly the kind of silent wrong
    source that puts a confident number on a page.
    """
    here = here or BASE
    hits = [p for p in glob.glob(os.path.join(here, QUOTE_DIR, '*.xlsx'))
            if not os.path.basename(p).startswith('~')]
    if not hits:
        for pat in ('*QUOTE*.xlsx', '*RATE*.xlsx', '*quote*.xlsx',
                    '*rate*.xlsx'):
            hits += [p for p in glob.glob(os.path.join(here, pat))
                     if not os.path.basename(p).startswith('~')]
    return max(hits, key=os.path.getmtime) if hits else None


def load(here=None):
    """{'byItem':{}, 'byDesc':{}, 'lines':n, 'path':..., 'problem':...}

    Empty and harmless when there is no quote yet - every caller then
    shows TBC exactly as it did before this module existed.
    """
    out = {'byItem': {}, 'byDesc': {}, 'lines': 0, 'path': '',
           'problem': '', 'skipped': []}
    p = quote_path(here)
    if not p:
        out['problem'] = ('no quote found - drop it in {}\\ and the day '
                          'rates fill in'.format(QUOTE_DIR))
        return out
    out['path'] = p
    try:
        import openpyxl
        wb = openpyxl.load_workbook(p, read_only=True, data_only=True)
    except Exception as e:
        out['problem'] = 'could not read {} ({})'.format(
            os.path.basename(p), e)
        return out

    for sn in wb.sheetnames:
        ws = wb[sn]
        rows = list(ws.iter_rows(values_only=True))
        #  a quote usually has a title block above the table, so hunt
        #  for the row that actually looks like headers
        head_at, hdr = None, []
        for i, r in enumerate(rows[:25]):
            cand = [('' if c is None else str(c)) for c in r]
            if _pick(cand, RATE_COLS) is not None and (
                    _pick(cand, ITEM_COLS) is not None
                    or _pick(cand, DESC_COLS) is not None):
                head_at, hdr = i, cand
                break
        if head_at is None:
            continue
        ii = _pick(hdr, ITEM_COLS)
        di = _pick(hdr, DESC_COLS)
        ri = _pick(hdr, RATE_COLS)
        qi = _pick(hdr, QTY_COLS)
        for r in rows[head_at + 1:]:
            if not r or not any(c not in (None, '') for c in r):
                continue
            rate = _num(r[ri]) if ri is not None and ri < len(r) else 0.0
            item = (str(r[ii]).strip()
                    if ii is not None and ii < len(r) and r[ii] else '')
            desc = (str(r[di]).strip()
                    if di is not None and di < len(r) and r[di] else '')
            qty = _num(r[qi]) if qi is not None and qi < len(r) else 0.0
            if not (item or desc):
                continue
            if rate <= 0:
                #  a line with no rate is REPORTED, not read as free
                out['skipped'].append(item or desc)
                continue
            rec = {'rate': rate, 'qty': qty, 'desc': desc, 'item': item}
            if item:
                out['byItem'][item] = rec
            if desc:
                out['byDesc'].setdefault(_norm(desc), rec)
            out['lines'] += 1
    wb.close()
    if not out['lines'] and not out['problem']:
        out['problem'] = ('read {} but found no rate lines in it - check '
                          'it has an item or description column and a rate '
                          'column'.format(os.path.basename(p)))
    return out


def rate_for(rates, item='', desc=''):
    """The day rate for one item, or None. Never a guess, never zero."""
    if not rates:
        return None
    if item:
        r = rates['byItem'].get(str(item).strip())
        if r:
            return r['rate']
    if desc:
        n = _norm(desc)
        r = rates['byDesc'].get(n)
        if r:
            return r['rate']
        #  a quote writes "Barrier - Crash Rated Water filled" where the
        #  register writes "Barrier - Crash Rated Water filled -
        #  Armorzone". Longest containing match wins, and only if it is
        #  a real prefix - never a two-word coincidence.
        best = None
        for k, v in rates['byDesc'].items():
            if len(k) < 8:
                continue
            if n.startswith(k) or k.startswith(n):
                if best is None or len(k) > len(best[0]):
                    best = (k, v)
        if best:
            return best[1]['rate']
    return None


def money(rate, qty, days):
    """PER EACH: rate x quantity x days. None in, None out."""
    if rate is None:
        return None
    return float(rate) * max(1, int(qty or 1)) * float(days or 0)


if __name__ == '__main__':
    r = load()
    if r['problem']:
        print('  ' + r['problem'])
    else:
        print('  Quote: {}'.format(os.path.basename(r['path'])))
        print('  {} rate line(s) read'.format(r['lines']))
        for k, v in list(r['byItem'].items())[:8]:
            print('     {:<14} ${:>9.2f}/day  {}'.format(
                k, v['rate'], v['desc'][:34]))
    if r['skipped']:
        print('  {} line(s) had no rate and were skipped: {}'.format(
            len(r['skipped']), ', '.join(str(x)[:24] for x in r['skipped'][:5])))
