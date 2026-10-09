#!/usr/bin/env python3
"""v7.53 — preserve map records and task references; keep refused placements unchanged.
Author: Andrew Fisher
Usage: python3 patch_v753_runtime.py <page.html>
"""
import os
import sys

sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'toolchain'))
from rep import rep

path = sys.argv[1]
with open(path, encoding='utf-8') as handle:
    text = handle.read()
marker = '/* v7.53 — map and task records survive every import form. */'
if marker in text:
    sys.exit('v7.53 runtime already applied')
if 'function ldGo751(' not in text or 'function fin745ModelMarker(' not in text:
    sys.exit('needs v7.51 with monthly financial control')

text = rep(text, 'moves:{}, hireStart:{}, mapRef:{},',
           'moves:{}, hireStart:{}, mapRef:{}, givenRefs:{},', 'initial task references', path, True)
text = rep(text, "function recordsFrom(j){", marker + '\nfunction recordsFrom(j){', 'runtime marker', path, True)
text = rep(text, "moves: (j && j.moves) || {}, hireStart: (j && j.hireStart) || {}, mapRef: (j && j.mapRef) || {},",
           "moves: (j && j.moves) || {}, hireStart: (j && j.hireStart) || {}, mapRef: (j && j.mapRef) || {},\n"
           " fixes: (j && j.fixes) || {}, entries: (j && j.entries) || {}, places: (j && j.places) || {}, givenRefs: (j && j.givenRefs) || {},",
           'bare import keeps map positions and task references', path, True)
text = rep(text, "'fixes', 'entries','places','runRules','answers', 'spares', 'subhire', 'finance745'].forEach(f => { out[f] = {};",
           "'fixes', 'entries','places','givenRefs','runRules','answers', 'spares', 'subhire', 'finance745'].forEach(f => { out[f] = {};",
           'task references merge with their stamps', path, True)
text = rep(text, "'minDays', 'runRules', 'answers', 'finance745'].forEach(k => { if (k in rec && !isObj(rec[k]))",
           "'minDays', 'runRules', 'answers', 'finance745', 'fixes', 'entries', 'places', 'givenRefs'].forEach(k => { if (k in rec && !isObj(rec[k]))",
           'validate map record containers', path, True)

text = rep(text, " /* recording it again after taking it out is a putting-back, and is recorded as one */\n untomb(unitTombId(ref, {asset_no, label}));\n /* ONE PLACE, ONE THING.",
           " /* ONE PLACE, ONE THING.", 'refused placements cannot put a unit back', path, True)
text = rep(text, " if (clash && clash !== same) out = out.filter(x => x !== clash);\n unitsSet(ref, out);",
           " if (clash && clash !== same) out = out.filter(x => x !== clash);\n"
           " /* Put back only after every placement check passed; a refusal changes no unit record. */\n"
           " untomb(unitTombId(ref, {asset_no, label}));\n unitsSet(ref, out);",
           'restore accepted units only', path, True)

with open(path, 'w', encoding='utf-8') as handle:
    handle.write(text)
print('ok', path)
