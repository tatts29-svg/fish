#!/usr/bin/env python3
"""v8.10: truthful invalid reference/day arrivals. Author: Andrew Fisher.

Apply after the frozen v8.05 patch on live v8.07. The release marker is a separate
root integration step. No DATA, figures, records, CSS or valid route body changes.
"""
import os
import sys
from pathlib import Path

sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'toolchain'))
from rep import rep

p = sys.argv[1]
t = Path(p).read_text(encoding='utf-8')
if 'function routeDayValid810(' in t:
    sys.exit('v8.10 already applied')
if 'v8.05 - links' not in t or 'function jump799(' not in t:
    sys.exit('v8.10 requires the READY v8.05 navigation patch on v8.07')
src = Path(__file__).with_name('navigation810_src.js').read_text(encoding='utf-8')
t = rep(t, 'function route(){\n let h;', src + '\nfunction route(){\n let h, malformed810 = false;', 'v8.10 address guards', p)
t = rep(t,
    "catch (e) { h = ''; flash('That link contains an invalid escape. Today has been opened.'); }",
    "catch (e) { h = ''; malformed810 = true; }",
    'malformed address handled within routing', p)
t = rep(t,
    "if ((m = h.match(/^asset\\/(.+)$/))) {\n const key = m[1], a = allAssets().find(x => x.key === key);\n if (!a) { go('register'); flash(key + ' is not a reference in this file.'); return; }",
    "if (malformed810) { if (/^#day\\//.test(location.hash)) state.day = null; routeReject810('today', 'That link contains an invalid escape. Today has been opened.'); }\n else if ((m = h.match(/^asset\\/([\\s\\S]*)$/))) {\n const key = m[1], a = allAssets().find(x => x.key === key);\n if (!a) { routeReject810('register', key ? key + ' is not a reference in this file. Equipment has been opened.' : 'That asset link does not name a reference. Equipment has been opened.'); }\n else {",
    'missing reference closes stale drawer and completes routing', p)
t = rep(t,
    "openAsset(key);\n } else if ((m = h.match(/^day\\/(\\d{4}-\\d{2}-\\d{2})$/))) { state.day = m[1]; state.tlView = 'day'; go('timeline'); }",
    " openAsset(key);\n }\n } else if ((m = h.match(/^day\\/([\\s\\S]*)$/))) {\n if (!routeDayValid810(m[1])) { state.day = null; routeReject810('today', 'That day link has an invalid date. Today has been opened.'); }\n else if (!calendarDays().some(d => d.iso === m[1])) { state.day = null; routeReject810('today', 'That date is outside this programme. Today has been opened.'); }\n else { state.day = m[1]; state.tlView = 'day'; go('timeline'); }\n }",
    'reject invalid and unavailable day without displaying different deliveries', p)
Path(p).write_text(t, encoding='utf-8')
print('v8.10 applied: rejected reference/day addresses have a truthful destination')
