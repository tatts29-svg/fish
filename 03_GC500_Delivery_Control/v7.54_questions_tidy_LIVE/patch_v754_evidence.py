#!/usr/bin/env python3
"""Author: Andrew Fisher. Evidence context only; source papers, charges and progress are unchanged."""
import os
import sys
here = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, os.path.join(here, '..', 'toolchain'))
from rep import rep
path = sys.argv[1]
text = open(path, encoding='utf-8').read()
if 'function decorateQuestionEvidence754(' in text:
    sys.exit('v7.54 Questions evidence already applied')
if 'function questionHistory753(' not in text:
    sys.exit('v7.54 Questions evidence requires v7.53 Questions')
source = open(os.path.join(here, 'evidence754_src.js'), encoding='utf-8').read()
text = rep(text, 'function questionHistory753(){', source + '\nfunction questionHistoryBefore754(){', 'retain history and correct drawing evidence', path, True)
open(path, 'w', encoding='utf-8').write(text)
print('ok', path, 'v7.54 Questions evidence context')
