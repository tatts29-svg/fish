#!/usr/bin/env python3
"""Assemble the standalone preview of the v7.53 circuit for Andrew to open on his own screen: the engine's five
parts, the circuit and Surfers Paradise data lifted from the live page, the race-control CSS, and a small control
strip. Decoration only: no record, no sync, no key. python3 assemble.py <data.js> -> GC500_Circuit_Preview.html"""
import os, sys
here = os.path.dirname(os.path.abspath(__file__)); src = os.path.join(here, '..', 'src')
JS = '\n'.join(open(os.path.join(src, f), encoding='utf-8').read() for f in sorted(os.listdir(src)) if f.endswith('.js'))
CSS = open(os.path.join(here, '..', 'gc3dx.css'), encoding='utf-8').read()
DATA = open(sys.argv[1], encoding='utf-8').read()
page = open(os.path.join(here, 'shell.html'), encoding='utf-8').read()
page = page.replace('/*__CSS__*/', CSS).replace('/*__DATA__*/', DATA).replace('/*__ENGINE__*/', JS)
out = os.path.join(here, 'GC500_Circuit_Preview.html'); open(out, 'w', encoding='utf-8').write(page); print('ok', out, len(page), 'bytes')
