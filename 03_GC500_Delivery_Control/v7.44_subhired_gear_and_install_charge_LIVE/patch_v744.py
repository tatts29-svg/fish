#!/usr/bin/env python3
"""Author: Andrew Fisher.

v7.44: add sub-hired gear from a reference and name the missing 350 kVA install rate.
Build from live v7.43 with toolchain/build.sh; this patch changes no shared records.
"""
import os
import subprocess
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, os.path.join(HERE, '..', 'toolchain'))
from rep import rep

page = sys.argv[1]
with open(page, encoding='utf-8') as source:
    text = source.read()
if 'function missingInstall744(' in text:
    sys.exit('v7.44 already applied')
if 'function drawerTidy(' not in text:
    sys.exit('needs v7.43')

subprocess.run([sys.executable, os.path.join(HERE, 'patch_subhire744.py'), page], check=True)
subprocess.run([sys.executable, os.path.join(HERE, 'patch_subhire_numbers744.py'), page], check=True)
with open(page, encoding='utf-8') as source:
    text = source.read()

text = rep(text, 'function labourTicksHtml(a){', '''/* Author: Andrew Fisher. v7.44: explain the 350 kVA install omission without inventing a rate. */
function missingInstall744(a, l, info){
 if (a.key !== 'GN20' || l.discipline !== 'Generators' || !/^350\\s*kva$/i.test(String(l.item || '').trim())) return '';
 if (info.lines.some(line => line.key === 'install')) return '';
 return '<div class="notice warn" data-install-rate-needed="GN20"><b>350 kVA · Install charge needs a rate</b><p>The rate card has no 350 kVA install amount. Confirm the agreed install charge excluding GST before it can be added.</p></div>';
}
function installNotice744(a){
 return chargeLines(a).map(l => missingInstall744(a, l, labourLinesFor(a.key, l.discipline, l.item, a.key, undefined, a))).join('');
}
function labourTicksHtml(a){''', 'explain missing 350 install rate', page, True)
text = rep(text,
    ' ${subhire744DrawerHtml(a)}\n',
    ' ${subhire744DrawerHtml(a)}\n ${installNotice744(a)}\n',
    'show missing install rate in the open drawer', page, True)
with open(page, 'w', encoding='utf-8') as output:
    output.write(text)
print('ok', page)
