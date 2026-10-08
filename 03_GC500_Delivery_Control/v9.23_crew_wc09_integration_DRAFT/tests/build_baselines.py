#!/usr/bin/env python3
"""Author: Andrew Fisher. Build comparison pages with one integration part absent.

Run with the same private V900_TEAM/V900_TAKE inputs as the final build.
Each comparison retains all other parts and the final footer, so the single-part
checks cannot mistake an unrelated integration change for their own effect.
"""
import pathlib, re, shutil, subprocess, sys
candidate = pathlib.Path(sys.argv[1]).resolve()
base = candidate.parent / 'base_live.html'
source = pathlib.Path(__file__).resolve().parents[1]
footer = re.search(r" · v\d+\.\d+'; /\* v8\.19", candidate.read_text()).group(0)
for omitted in ('split', 'lines', 'vms'):
    target = candidate.parent / ('base_without_' + omitted + '.html')
    shutil.copyfile(base, target)
    for part in ('crew', 'broadcast', 'split', 'lines', 'vms'):
        if part != omitted:
            subprocess.run([sys.executable, str(source / ('patch_v900_' + part + '.py')), str(target)], check=True)
    text, n = re.subn(r" · v\d+\.\d+'; /\* v8\.19", lambda _: footer, target.read_text())
    assert n == 1, 'one release footer'
    target.write_text(text)
