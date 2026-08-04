#!/usr/bin/env python3
# -*- coding: utf-8 -*-
# =====================================================================
#  COATES | SERIAL NUMBERS - what the export gave us, and what it did not
#  Cement Australia K2 Shutdown 2026 - Gladstone
#  Author: Andrew Fisher | POWERED BY SITEIQ
#
#  Andrew, 3 Aug 2026: "Fleet_No = Item_Number, and then the column
#  Serial_No is the Item_Number's serial number."
#
#  This prints what that join is actually worth on this store, split
#  three ways rather than rolled into one comfortable percentage:
#  assets with a real serial, assets whose serial field is filled in
#  with something that is not a serial, and assets the export has never
#  heard of.
#
#  The middle number is the point of the screen. A serial that reads
#  Coates1302153 or TBA looks like data until the day it has to prove
#  which machine came back damaged. Those are listed by plant number so
#  they can be fixed in Baseplan.
#
#  Run it:  py serial_report.py      (or 70_SERIAL_NUMBERS)
# =====================================================================
import csv
import io
import os

import forecast as FC
import mygear_intel as MI
import serials as SR

BASE = os.path.dirname(os.path.abspath(__file__))


def report():
    #  Make the folder if it is not there, so "drop it in Data_Serials\"
    #  points at something that exists rather than at an instruction.
    if not os.path.isdir(SR.FOLDER):
        os.makedirs(SR.FOLDER)
    path = SR.newest()
    print('=' * 66)
    print(' COATES | SERIAL NUMBERS')
    print('=' * 66)
    print('')
    if not path:
        print(' No export in Data_Serials\\.')
        print('')
        print(' Drop the Baseplan serial listing in there - the one with')
        print(' FLEET_NO, MODEL and SERIAL_NO across the top - and run this')
        print(' again. Nothing breaks without it; the screens simply carry')
        print(' no serial numbers.')
        return
    recs = SR.load()
    real = sum(1 for r in recs.values() if r['serial'])
    place = sum(1 for r in recs.values() if not r['serial'] and r['stated'])
    print(' Export       : {}'.format(os.path.basename(path)))
    print(' Plant records: {:,}'.format(len(recs)))
    print(' Real serials : {:,}'.format(real))
    print(' Filled in but not a serial: {:,}'.format(place))
    print('')

    rental, txn = (FC._newest('RENTAL_STOCK*.xlsx'),
                   FC._newest('TRANSACTIONS*.xlsx'))
    if not rental or not txn:
        print(' No RENTAL_STOCK / TRANSACTIONS export, so no store to')
        print(' measure it against. The file itself reads fine.')
        return
    data = MI.read(rental, txn, FC._newest('ON_HIRE*.xlsx'))
    assets = list(data['assets'].values())
    onhire = [a for a in assets if a.get('status') == MI.OUT_STATUS]

    for name, pool in (('THE WHOLE STORE', assets), ('ON HIRE RIGHT NOW',
                                                     onhire)):
        c = SR.coverage(a.get('item') or '' for a in pool)
        print(' ' + name)
        print('   {:,} assets, of which {:,} carry a plant number'.format(
            c['assets'], c['plant']))
        print('   {:,} have a real serial'.format(c['serial']))
        print('   {:,} have a plant number but only a placeholder'.format(
            c['placeholder']))
        print('   {:,} are not in the export at all'.format(c['absent']))
        print('')

    #  WHY THE BIG ABSENT NUMBER IS NOT A PROBLEM. Said plainly, because
    #  "4,395 missing" reads like a broken file until you know what they
    #  are.
    tool = sum(1 for a in assets if not (a.get('item') or '').isdigit())
    print(' {:,} of the assets in this store are barcode-suffixed tooling'
          .format(tool))
    print(' - DUCTING300MMR-0308, SPANNERPMM 32MM-0009. They have no')
    print(' serial number because a length of ducting does not have one,')
    print(' so the export not listing them is correct, not a gap.')
    print('')

    #  THE FIXABLE LIST. Only for gear that is actually in this store -
    #  no point handing him 600 plant numbers from another branch.
    ours = {(a.get('item') or ''): a for a in assets}
    bad = [(k, recs[k]) for k in sorted(ours)
           if k in recs and not recs[k]['serial'] and recs[k]['stated']]
    if bad:
        print(' NEEDS A REAL SERIAL IN BASEPLAN - {:,} asset(s) here'
              .format(len(bad)))
        print(' ' + '-' * 60)
        for k, r in bad[:25]:
            print('   {:<10} {:<32} says {!r}'.format(
                k, (ours[k].get('desc') or '')[:32], r['stated'][:18]))
        if len(bad) > 25:
            print('   ... and {:,} more'.format(len(bad) - 25))
        #  25 on screen is a look; 270 in a spreadsheet is a job that can
        #  be done. Written next to the reports rather than into
        #  Gear_Lookup - it is a housekeeping list, not a store screen.
        csv_p = os.path.join(BASE, 'SERIALS_TO_FIX.csv')
        with io.open(csv_p, 'w', encoding='utf-8-sig', newline='') as fh:
            w = csv.writer(fh)
            w.writerow(['Plant_Number', 'Description', 'Currently_Says',
                        'Status', 'Held_By'])
            for k, r in bad:
                a = ours[k]
                w.writerow([k, a.get('desc') or '', r['stated'],
                            a.get('status') or '', a.get('holder') or ''])
        print('')
        print('   Full list: {}'.format(csv_p))
        print('')

    #  CONFLICTS. Reported even when the answer is "none of ours", because
    #  printing nothing reads as "there are none" - and there are four.
    allcon = SR.conflicts()
    con = {s: v for s, v in allcon.items() if any(k in ours for k in v)}
    if con:
        print(' ONE SERIAL AGAINST MORE THAN ONE PLANT NUMBER')
        print(' One of each pair is wrong. Nothing here guesses which.')
        for s, v in list(con.items())[:8]:
            print('   {!r:<28} -> {}'.format(s[:26], ', '.join(v)))
        print('')
    elif allcon:
        print(' {} serial(s) in the export are recorded against two'
              .format(len(allcon)))
        print(' different plant numbers, so one of each pair is wrong -')
        print(' but none of them are assets in this store, so nothing on')
        print(' any screen here is affected.')
        print('')

    print(' Serial numbers now show on Fleet Details (68) and on the')
    print(' supervisor screen (69), beside the plant number - our name')
    print(' for the machine and the manufacturer\'s, together.')


def page(date_tag=None):
    """THE SERIAL REGISTER, AS A PAGE. (Andrew, 4 Aug 2026 - 70 on the
    phone. It wrote a CSV, which is the right thing for a laptop and no
    use at all standing in front of a machine.)

    Our number and the manufacturer's, side by side. That is the pair
    anybody arguing about a damaged machine needs, and it is the pair
    nobody can ever find."""
    import datetime as _dt
    import page_style as PS

    path = SR.newest()
    if not path:
        blocks = [PS.note(
            '<b>No serial export on this machine.</b> Drop the Baseplan '
            'serial listing into <b>Data_Serials\\</b> - the one with '
            'FLEET_NO, MODEL and SERIAL_NO across the top - and run 70 '
            'again. Nothing breaks without it; the screens simply carry '
            'no serial numbers.')]
        return PS.write('Coates_K2_Serial_Numbers', 'Serial numbers',
                        'Our plant number and the maker&rsquo;s, side by '
                        'side.', blocks, date_tag=date_tag)

    recs = SR.load()
    real = [r for r in recs.values() if r.get('serial')]
    place = [r for r in recs.values()
             if not r.get('serial') and r.get('stated')]
    none = len(recs) - len(real) - len(place)

    rows = []
    for r in sorted(real, key=lambda x: (x.get('desc') or '').lower()):
        rows.append([r.get('item') or '', r.get('desc') or '',
                     r.get('serial') or ''])
    blocks = [PS.tiles([
        ('{:,}'.format(len(recs)), 'plant records', ''),
        ('{:,}'.format(len(real)), 'carry a real serial', 'g'),
        ('{:,}'.format(len(place)), 'filled in, but not a serial', 'a'),
        ('{:,}'.format(none), 'blank', ''),
    ])]
    if rows:
        blocks.append("<h2>OUR NUMBER, AND THE MAKER&rsquo;S"
                      "<span>{} machine(s)</span></h2>".format(len(rows)))
        blocks.append(PS.table(['Plant no', 'What it is', 'Serial'],
                               rows))
    if place:
        blocks.append("<h2>SAYS A SERIAL, IS NOT ONE"
                      "<span>{} line(s)</span></h2>".format(len(place)))
        blocks.append("<p>The column is filled in, but what is in it is our "
                      "own plant number handed back to us. Putting that on "
                      "a damage claim proves nothing, so these are counted "
                      "apart rather than folded in.</p>")
        blocks.append(PS.table(
            ['Plant no', 'What it is', 'What it says'],
            [[r.get('item') or '', r.get('desc') or '', r.get('stated') or '']
             for r in sorted(place,
                             key=lambda x: (x.get('desc') or '').lower())[:200]]))
        if len(place) > 200:
            blocks.append(PS.note(
                'Showing the first 200 of {:,} - the rest are in the CSV '
                'this button also writes.'.format(len(place))))
    blocks.append(PS.note(
        'From <b>' + PS.esc(os.path.basename(path)) + '</b>. Drop a newer '
        'Baseplan listing into Data_Serials\\ and it wins from then on.'))

    return PS.write('Coates_K2_Serial_Numbers', 'Serial numbers',
                    'Our plant number and the maker&rsquo;s, side by side '
                    '&mdash; the pair anybody arguing about a damaged '
                    'machine needs.', blocks,
                    asof='Built ' + _dt.date.today().strftime('%d %b %Y'),
                    date_tag=date_tag)


if __name__ == '__main__':
    report()
    try:
        print(' Page: ' + page())
    except Exception as _e:
        print(' (page not built: {})'.format(_e))
