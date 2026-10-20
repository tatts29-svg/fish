#!/usr/bin/env python3
"""Author: Andrew Fisher. Carry reviewed visuals forward from the booking release."""
from pathlib import Path
import sys

HERE = Path(__file__).resolve().parent
PROJECT = HERE.parent
sys.path[:0] = [str(PROJECT / 'toolchain'),
               str(PROJECT / 'v7.94_showcase_lap_cameras_LIVE'),
               str(PROJECT / 'v8.00_vehicle_visuals_LIVE')]
from rep import rep
import patch_v794
import patch_v800
import patch_aa802

MARKER = '<!-- Showcase and vehicle finish v8.02 -->'

def apply(text, path='GC500 page'):
    if MARKER in text or 'G.raceCarVisual800=' in text:
        raise SystemExit('v8.02 is already or partially applied')
    for required in ['function bookingOrder801(', 'function photoRecordAck797(',
                     'function drawerSync798Word(']:
        if required not in text:
            raise SystemExit('v8.02 requires the verified v8.01 booking and reliability release')
    text = rep(text, '<meta name="gc500-release" content="v8.01">\n', '',
               'consume the prior release tag', path)
    text = patch_v794.apply(text, path)
    text = patch_v800.apply(text, path)
    text = patch_aa802.apply(text, path)
    text = rep(text, '<meta name="gc500-release" content="v8.00">',
               MARKER + '\n<meta name="gc500-release" content="v8.02">',
               'final release tag', path)
    text = rep(text, "G.showcase794={version:'v8.00',paint};",
               "G.showcase794={version:'v8.02',paint};", 'Showcase release report', path)
    text = rep(text, "return Object.assign(report,{version:'v8.00',cameraOverride:",
               "return Object.assign(report,{version:'v8.02',cameraOverride:",
               'full-lap release report', path)
    return text

if __name__ == '__main__':
    page = Path(sys.argv[1])
    page.write_text(apply(page.read_text(), str(page)))
    print('v8.02 applied: reviewed full-lap and vehicle visuals on the booking release')
