#!/usr/bin/env python3
"""Author: Andrew Fisher. Questions tidy-up with evidence-backed closure and retained notes."""
import sys
from pathlib import Path
here = Path(__file__).resolve().parent
sys.path.insert(0, str(here.parent / 'toolchain'))
from rep import rep
p = Path(sys.argv[1]); t = p.read_text()
if 'function retainedQuestion754(' in t: sys.exit('v7.54 Questions already applied')
if 'function sourceRehire754(' not in t or 'function decorateQuestionEvidence754(' not in t:
    sys.exit('Apply the v7.54 assets and evidence patches first')
t = rep(t, 'function questionsList(){', 'function questionsList_753(){', 'keep the established Questions rules', str(p), True)
t = rep(t, 'function renderQuestions_held(){', (here/'questions754_src.js').read_text()+'\nfunction renderQuestions_held(){', 'install evidence review and saved-note history', str(p), True)
t = rep(t, '+ answersOverview753Html(Q) +', '+ answersOverview754Html(Q) +', 'compact current review overview', str(p), True)
t = rep(t, 'Each one says what it is, why it matters and exactly what we need. A question goes away when the answer lands in the record - a rate typed, a docket in, a date confirmed. A note typed here is kept with your name and time, but it doesn’t close the question.', 'Each item explains the remaining decision or evidence needed. Resolved checks leave the active list; confirmed answers and saved notes stay below. Writing a note keeps your name and time but does not replace a rate, delivery record or confirmation.', 'explain evidence-based closure', str(p), True)
p.write_text(t); print('ok', p, 'v7.54 Questions tidy-up')
