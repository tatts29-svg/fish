#!/usr/bin/env python3
# -*- coding: utf-8 -*-
# =====================================================================
#  COATES | ZEBRA ITEM LABELS - QR stickers straight to the printer
#  Cement Australia K2 Shutdown 2026 - Gladstone
#  Author: Andrew Fisher | POWERED BY SITEIQ
#
#  WHY (Andrew, 30 Jul 2026): the stores sheets now carry a QR per
#  item number - this puts the SAME code on a sticker, printed on the
#  store's own Zebra (ZT230), so the shelf and the gear scan like the
#  paperwork. Stick it on the shelf edge or the item itself.
#
#  HOW IT TALKS TO THE PRINTER: raw ZPL over the network, port 9100 -
#  the language every ZT-series Zebra speaks natively. No driver, no
#  install, no IT: the printer just has to be plugged into YOUR store
#  router (the My Gear one), and its IP written into zebra_printer.txt
#  once. The QR is drawn BY THE PRINTER (ZPL ^BQ) and encodes the item
#  number exactly as typed - same content as the sheet QRs, so one
#  scanner setup reads everything.
#
#  ALWAYS print the test label first (option 1) - it proves the IP,
#  the label size and the darkness before a batch runs.
# =====================================================================
import datetime as dt
import glob
import os
import re
import socket
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
CFG = os.path.join(HERE, 'zebra_printer.txt')
DOTS_MM = 8          # ZT230 is a 203 dpi head = 8 dots per millimetre

CFG_SEED = """\
# The store's Zebra printer - fill in the two lines below, save, and
# run 55_PRINT_ITEM_LABELS again.
#
# IP: plug the printer into YOUR store router (any spare LAN port),
#     then hold the FEED button until the light flashes and let go -
#     the config label it prints carries its IP address. Reserve that
#     IP in the router so it never changes.
IP =
#
# Label size on the roll, millimetres, width x height (measure one)
LABEL_MM = 50x25
#
# Print darkness 0-30. Leave blank to use the printer's own setting.
DARKNESS =
"""


def read_cfg():
    if not os.path.isfile(CFG):
        with open(CFG, 'w', encoding='utf-8') as f:
            f.write(CFG_SEED)
        return {}
    out = {}
    with open(CFG, encoding='utf-8-sig') as f:
        for ln in f:
            ln = ln.strip()
            if not ln or ln.startswith('#') or '=' not in ln:
                continue
            k, v = ln.split('=', 1)
            out[k.strip().upper()] = v.strip()
    return out


def zdata(s):
    """Text made safe for a ZPL ^FD field: the three characters ZPL
    treats as commands are stripped, never printed wrong."""
    return str(s or '').replace('^', ' ').replace('~', ' ').replace('\\', ' ')[:80]


def label_zpl(num, desc, w_mm, h_mm, darkness):
    """One sticker: QR on the left (the item number, drawn by the
    printer), the number big beside it, the description under, the
    site line at the foot. Sized off the roll dimensions."""
    pw, ll = int(w_mm * DOTS_MM), int(h_mm * DOTS_MM)
    #  QR side: up to 33 modules (version 3) + quiet zone, fit inside
    #  the label height with a little air
    mag = max(2, min(8, (ll - 16) // 41))
    qside = 41 * mag
    qx, qy = 8, max(4, (ll - qside) // 2)
    tx = qx + qside + 10
    tw = max(60, pw - tx - 8)
    num = zdata(num)
    desc = zdata(desc)
    h1 = max(20, min(34, (tw * 17) // (10 * max(6, len(num)))))
    z = ['^XA', '^PW{}'.format(pw), '^LL{}'.format(ll), '^LH0,0', '^CI28']
    if darkness != '':
        z.append('^MD{}'.format(darkness))
    z.append('^FO{},{}^BQN,2,{}^FDMA,{}^FS'.format(qx, qy, mag, num))
    z.append('^FO{},{}^A0N,{h},{h}^FB{},1,0,L^FD{}^FS'.format(
        tx, max(6, qy), tw, num, h=h1))
    z.append('^FO{},{}^A0N,20,20^FB{},2,0,L^FD{}^FS'.format(
        tx, max(6, qy) + h1 + 6, tw, desc[:60]))
    z.append('^FO{},{}^A0N,18,18^FD{}^FS'.format(
        tx, ll - 26, 'COATES K2 TOOL STORE'))
    z.append('^XZ')
    return ''.join(z)


def test_zpl(w_mm, h_mm, darkness):
    """The proving label: a border you can check against the roll
    edges, a QR that must scan as TEST123, and today's date."""
    pw, ll = int(w_mm * DOTS_MM), int(h_mm * DOTS_MM)
    mag = max(2, min(8, (ll - 16) // 41))
    z = ['^XA', '^PW{}'.format(pw), '^LL{}'.format(ll), '^LH0,0', '^CI28']
    if darkness != '':
        z.append('^MD{}'.format(darkness))
    z.append('^FO2,2^GB{},{},2^FS'.format(pw - 4, ll - 4))
    z.append('^FO8,{}^BQN,2,{}^FDMA,TEST123^FS'.format(max(4, (ll - 41 * mag) // 2), mag))
    tx = 8 + 41 * mag + 10
    z.append('^FO{},8^A0N,26,26^FDCOATES K2 TEST^FS'.format(tx))
    z.append('^FO{},40^A0N,20,20^FDScan me: TEST123^FS'.format(tx))
    z.append('^FO{},{}^A0N,18,18^FDBorder should sit just inside the label^FS'.format(
        tx, ll - 26))
    z.append('^XZ')
    return ''.join(z)


def send(ip, payload, count):
    """Raw ZPL to port 9100. One socket, chunked writes, honest errors."""
    if not ip:
        out = os.path.join(HERE, 'ZEBRA_PREVIEW.zpl')
        with open(out, 'w', encoding='utf-8') as f:
            f.write(payload)
        print('')
        print(' No IP in zebra_printer.txt yet, so nothing was sent.')
        print(' The {} label(s) were written to ZEBRA_PREVIEW.zpl instead -'.format(count))
        print(' fill the IP in (the printer\'s config label shows it) and rerun.')
        return False
    try:
        s = socket.create_connection((ip, 9100), timeout=6)
        s.sendall(payload.encode('utf-8'))
        s.close()
        print(' Sent {} label(s) to the Zebra at {}.'.format(count, ip))
        return True
    except OSError as e:
        print('')
        print(' Could not reach the printer at {} (port 9100): {}'.format(ip, e))
        print(' - Is it powered on, with the cable into YOUR store router?')
        print(' - Is the IP right? Hold FEED till the light flashes - the')
        print('   config label it prints shows the current IP.')
        print(' Nothing was printed.')
        return False


def read_items():
    """Every physical item on the register: number, description, aisle.
    From the newest RENTAL_STOCK export - the same truth as the board."""
    try:
        import openpyxl
    except ImportError:
        return None
    hits = []
    for d in (os.path.join(HERE, 'Data_SiteIQ'), HERE):
        hits += [p for p in glob.glob(os.path.join(d, 'RENTAL_STOCK*.xlsx'))
                 if not os.path.basename(p).startswith('~$')]
    if not hits:
        return None
    wb = openpyxl.load_workbook(max(hits, key=os.path.getmtime),
                                read_only=True, data_only=True)
    rows = list(wb['RENTAL_STOCK'].iter_rows(values_only=True))
    wb.close()
    hdr = {str(v).strip(): i for i, v in enumerate(rows[0]) if v}
    items = []
    for r in rows[1:]:
        num = str(r[hdr.get('ITEM_NUMBER', -1)] or '').strip()
        if not num:
            continue
        items.append({'i': num,
                      'n': str(r[hdr.get('ITEM_DESCRIPTION', -1)] or '').strip(),
                      'u': str(r[hdr.get('STORAGE_UNIT', -1)] or 'Unfiled').strip()})
    return items


def main():
    print('=' * 66)
    print(' COATES | ZEBRA ITEM LABELS - QR stickers, straight to the printer')
    print('=' * 66)
    cfg = read_cfg()
    ip = cfg.get('IP', '')
    m = re.match(r'^(\d+(?:\.\d+)?)\s*[xX]\s*(\d+(?:\.\d+)?)$',
                 cfg.get('LABEL_MM', '50x25') or '50x25')
    w_mm, h_mm = (float(m.group(1)), float(m.group(2))) if m else (50.0, 25.0)
    darkness = cfg.get('DARKNESS', '')
    print(' Printer : {}'.format(ip or 'NO IP YET - fill in zebra_printer.txt'))
    print(' Labels  : {:g} x {:g} mm  (change in zebra_printer.txt)'.format(w_mm, h_mm))
    if not os.path.isfile(CFG):
        pass
    if not ip:
        print('')
        print(' zebra_printer.txt is beside this script - open it in Notepad,')
        print(' put the printer\'s IP in, save, run me again. You can still')
        print(' preview labels below; they go to a file instead of the printer.')

    items = read_items()
    if items is None:
        print(' RENTAL_STOCK export not found - run the morning downloads first.')

    print('')
    print(' What do you want to print?')
    print('   1  Test label (ALWAYS do this first on a new roll or IP)')
    print('   2  One item - type or scan its number')
    print('   3  One aisle - a label for every item that lives there')
    print('   4  Nothing - just checking the settings')
    choice = input(' Pick 1-4: ').strip()

    if choice == '1':
        send(ip, test_zpl(w_mm, h_mm, darkness), 1)
        print(' If the border runs off the sticker, fix LABEL_MM in')
        print(' zebra_printer.txt. If it is faint, set DARKNESS = 20.')
        return 0

    if choice == '2':
        num = input(' Item number: ').strip()
        if not num:
            return 0
        desc, found = '', False
        for x in (items or []):
            if x['i'].upper() == num.upper():
                desc, num, found = x['n'], x['i'], True
                break
        if not found:
            print(' Not on the register - printing the number as given, no description.')
        send(ip, label_zpl(num, desc, w_mm, h_mm, darkness), 1)
        return 0

    if choice == '3':
        if not items:
            print(' No register to read aisles from.')
            return 1
        units = {}
        for x in items:
            units[x['u']] = units.get(x['u'], 0) + 1
        ulist = sorted(units)
        for i, u in enumerate(ulist, 1):
            print('  {:>2}  {} ({} items)'.format(i, u, units[u]))
        pick = input(' Which aisle (number): ').strip()
        try:
            unit = ulist[int(pick) - 1]
        except (ValueError, IndexError):
            print(' Not a number on the list - nothing printed.')
            return 1
        batch = [x for x in items if x['u'] == unit]
        print(' {} label(s) for {} - about {:.1f} m of roll.'.format(
            len(batch), unit, len(batch) * (h_mm + 3) / 1000.0))
        if input(' Type YES to print them: ').strip().upper() != 'YES':
            print(' Nothing printed.')
            return 0
        payload = ''.join(label_zpl(x['i'], x['n'], w_mm, h_mm, darkness)
                          for x in batch)
        send(ip, payload, len(batch))
        return 0

    print(' Nothing printed.')
    return 0


if __name__ == '__main__':
    sys.exit(main())
