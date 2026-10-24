#!/usr/bin/env python3
"""v6.63 - RACE-DAY DRESSING, EVERYWHERE (Andrew Fisher, 26 Sep 2026: "improve the detail everywhere - track, and buildings,
and stands and crowds and barriers and signs").

dress_v663.js adds G.dressCircuit, run once when the stands are built, into the stands' own batches (no new draw call):
  * tyre walls - stacks of four tyres with an orange-and-white Coates belt - across the outside of the six sharpest corners;
  * Coates / GC500 2026 banners along the catch fence, facing the track;
  * braking boards (150, 100, 50) on the approach to each of those corners;
  * COATES GC500 2026 across both faces of the start gantry;
  * rooftop plant on the buildings beside the track, and Coates billboards on a few roofs facing the circuit;
  * the crowd two deep along the fence at every corner and down the grid straight.
All placed by rule and nominal, like the stands; the credit line already says the backdrop is decoration.

  python3 patch_v663.py <page.html> <bundle gc3d_bundle.js> <dress_v663.js>
"""
import os, re, sys
page, bundle, dress = sys.argv[1:4]; DRESS = open(dress, encoding='utf-8').read()

def rep(text, old, new, what, path):
    pat = '\n'.join('[ \t]*' + r'\s+'.join(re.escape(tok) for tok in l.split()) if l.split() else '[ \t]*' for l in old.split('\n'))
    ms = list(re.finditer(pat, text))
    if len(ms) != 1: sys.exit(f'{what} in {os.path.basename(path)}: expected once, found {len(ms)}: {old[:90]!r}')
    m = ms[0]; return text[:m.start()] + new + text[m.end():]

EDITS = [
 ('dress on build',
  "  mesh.upload();ed.upload();cw.upload();pp.upload();dec.upload();\n  return S.standStats.drawn;",
  "  /* v6.63 - race-day dressing, into these same batches */\n  if(G.dressCircuit){try{G.dressCircuit(S,{dquad:dquad,person:person,ed:ed,H:H,CL:CL});}catch(err){S.dressError=String(err);}}\n  mesh.upload();ed.upload();cw.upload();pp.upload();dec.upload();\n  return S.standStats.drawn;"),
 ('dress function',
  "G.inPoly=function(p,P){",
  DRESS + "G.inPoly=function(p,P){"),
]
for path in [bundle, page]:
    t = open(path, encoding='utf-8').read(); bom = t.startswith('﻿'); t = t.lstrip('﻿'); n0 = len(t)
    for what, old, new in EDITS: t = rep(t, old, new, what, path) if what != 'dress function' else t.replace(old, new, 1) if t.count(old) == 1 else sys.exit('inPoly anchor')
    open(path, 'w', encoding='utf-8').write(('﻿' if bom else '') + t); print('ok', os.path.basename(path), n0, '->', len(t))
