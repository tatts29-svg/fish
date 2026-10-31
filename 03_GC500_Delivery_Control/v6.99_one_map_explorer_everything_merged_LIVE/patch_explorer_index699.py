#!/usr/bin/env python3
"""v6.99 - the explorer page: loads explorer-merge.js (3D mode and the reference card), and in its own window its page list
names it the Map explorer and no longer offers the 3D proof as a separate page (it is the 3D mode now).
   python3 patch_explorer_index699.py <explorer/index.html>"""
import sys
p = sys.argv[1]; t = open(p, encoding='utf-8').read()
if 'explorer-merge.js' in t: sys.exit('already applied')
def R(old, new, what):
    global t
    if t.count(old) != 1: sys.exit('%s: %d' % (what, t.count(old)))
    t = t.replace(old, new)
R('<script src="explorer.js"></script>', '<script src="explorer.js"></script>\n<script src="explorer-merge.js"></script>', 'script')
R("['/w/' + t + '/explorer/index.html' + tail, 'Plan on satellite', 'explorer/index.html'], ['/w/' + t + '/poc3d/index.html' + tail, '3D proof', 'poc3d/index.html'], ",
  "['/w/' + t + '/explorer/index.html' + tail, 'Map explorer', 'explorer/index.html'], ", 'nav')
t = t.replace('<title>GC500 Satellite Plan Explorer</title>', '<title>GC500 Map explorer</title>')
t = t.replace('<span class="sub">Satellite Plan Explorer · D001 rev 03 · Master Layout Plan</span>', '<span class="sub">Map explorer · plan, satellite and 3D · D001 rev 03 · Master Layout Plan</span>')
t = t.replace('<h2>Satellite Plan Explorer</h2>', '<h2>Map explorer</h2>')
open(p, 'w', encoding='utf-8').write(t); print('ok', p)
