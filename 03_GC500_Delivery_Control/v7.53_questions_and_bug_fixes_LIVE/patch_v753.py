#!/usr/bin/env python3
"""Author: Andrew Fisher. v7.53 — current Questions and confirmed answers, no record mutations."""
import os
import sys

here = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, os.path.join(here, '..', 'toolchain'))
from rep import rep

path = sys.argv[1]
text = open(path, encoding='utf-8').read()
if 'function questionHistory753(' in text:
    sys.exit('v7.53 already applied')
if 'function forkliftWholeHire748(' not in text or 'function ldGo751(' not in text:
    sys.exit('v7.53 requires the corrected v7.50 charging rules and v7.51 navigation')

def replace(old, new, label):
    global text
    text = rep(text, old, new, label, path, True)

replace('function questionsList(){', 'function questionsList_751(){', 'retain the existing dynamic question checks')
replace('QHIST.forEach(([id, st, title, known, need, go]) => { if (st !== QH_DONE)',
        'questionHistory753().forEach(([id, st, title, known, need, go]) => { if (st !== QH_DONE)',
        'use current context for open historical questions')
replace('const done = QHIST.filter(h => h[1] === QH_DONE)',
        'const done = questionHistory753().filter(h => h[1] === QH_DONE)',
        'show current delivery state beside historical answers')
replace("if (!G.length) return; const ccbE = ft.find(t => /ccb/i.test(t.name) && /event/i.test(t.name));",
        "if (!G.length) return; const ccbE = ft.find(t => /ccb/i.test(t.name) && /event/i.test(t.name)), ccbD = ft.find(t => /ccb/i.test(t.name) && /demarcation/i.test(t.name));",
        'read both recorded CCB classifications')
replace('(${fmtNum(ccbE.done)} m is booked as event CCB and none as demarcation - some dockets leave that split to us)',
        ' (${fmtNum(ccbE.done)} m is booked as event CCB and ${fmtNum(ccbD ? ccbD.done : 0)} m as demarcation; some dockets leave that split to us)',
        'remove the false no-demarcation claim')
replace("+ answersOverview747Html(Q) +", "+ answersOverview753Html(Q) +", 'show the current answers overview')
source = open(os.path.join(here, 'questions753_src.js'), encoding='utf-8').read()
replace('function renderQuestions_held(){', source + '\nfunction renderQuestions_held(){', 'install the evidence-backed Questions review')
open(path, 'w', encoding='utf-8').write(text)
print('ok', path, 'v7.53 Questions and confirmed answers')
