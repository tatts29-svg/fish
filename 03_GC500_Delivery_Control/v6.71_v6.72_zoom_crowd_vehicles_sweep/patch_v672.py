#!/usr/bin/env python3
"""v6.72 - the crowd as people with shape, and the Special Editions finished (crowd_v672.js, vehdetail_v672.js); plus the
fixed test camera (S.camDebug) used to check them.
  python3 patch_v672.py <page.html> <bundle gc3d_bundle.js> <crowd_v672.js> <vehdetail_v672.js>"""
import os, sys
page, bundle, crowd, veh = sys.argv[1:5]; CROWD = open(crowd, encoding='utf-8').read(); VEH = open(veh, encoding='utf-8').read()
CAM_A = "if(S.fw&&S.fw.cam&&G.fireworksShot){if(!S._fwCut){S._fwCut=true;S.camBase=null;}name='fireworks';cur=G.fireworksShot(S);}"
CAM_B = CAM_A + "\n  if(S.camDebug){name='debug';cur=S.camDebug;S.camBase=null;}   /* v6.72 - a fixed camera for checking detail, set only by tests */"
for path in [bundle, page]:
    t = open(path, encoding='utf-8').read(); bom = t.startswith('﻿'); t = t.lstrip('﻿'); n0 = len(t)
    a = t.find("G.meshPerson=function(S,mesh,foot,rnd,s,shirt,skin){"); b = t.find("mesh.people=(mesh.people||0)+1;\n};", a)
    if a < 0 or b < 0 or t.count("G.meshPerson=function(") != 1: sys.exit('meshPerson not found once in ' + path)
    # keep the v6.64 comment above; replace the function itself
    t = t[:a] + CROWD.split('*/', 1)[1].lstrip('\n') + t[b + len("mesh.people=(mesh.people||0)+1;\n};"):]
    t = t.replace("G.meshPerson=function", "/* v6.72 - rebuilt to human proportions: see crowd_v672.js */\nG.meshPerson=function", 1)
    for anchor, new, after in [
        ("G.plantModel=function(kind,quality){", VEH, False),
        ("return (cache[key]=G.finishModel(K.parts,level,'original parametric '+kind));", "if(G.plantDetail)G.plantDetail(kind,K);   /* v6.72 */\n", False),
        ("return (cache[level]=G.finishModel(K.parts,level,'original parametric VMS trailer'));", "  if(G.trailerDetail)G.trailerDetail(K,L,.41);   /* v6.72 */\n", False),
        ("return (cache[level]=G.finishModel(K.parts,level,'original parametric portaloo trailer'));", "  if(G.trailerDetail)G.trailerDetail(K,L,.45);   /* v6.72 */\n", False)]:
        if t.count(anchor) != 1: sys.exit(f'anchor {anchor[:50]!r}: {t.count(anchor)} in {os.path.basename(path)}')
        t = t.replace(anchor, anchor + new if after else new + anchor, 1)
    if 'S.camDebug' not in t:
        if t.count(CAM_A) != 1: sys.exit('cam anchor')
        t = t.replace(CAM_A, CAM_B, 1)
    open(path, 'w', encoding='utf-8').write(('﻿' if bom else '') + t); print('ok', os.path.basename(path), n0, '->', len(t))
