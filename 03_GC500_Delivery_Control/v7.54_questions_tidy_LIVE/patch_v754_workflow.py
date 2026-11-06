#!/usr/bin/env python3
"""Author: Andrew Fisher. Questions notes save without losing the next click or the reader's place."""
import os
import sys
here = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, os.path.join(here, '..', 'toolchain'))
from rep import rep
path = sys.argv[1]
text = open(path, encoding='utf-8').read()
if 'function questionNoteMeta754(' in text:
    sys.exit('v7.54 Questions workflow already applied')
if 'function questionHistory753(' not in text:
    sys.exit('v7.54 Questions workflow requires v7.53 Questions')
def replace(old, new, label):
    global text
    text = rep(text, old, new, label, path, True)
source = open(os.path.join(here, 'workflow754_src.js'), encoding='utf-8').read()
replace('function renderQuestions(){ return holdAssets(renderQuestions_held); }',
        source + '\nfunction renderQuestions(){ return renderQuestions754(); }',
        'retain Questions folds, draft and cursor across redraws')
replace("stampIt('answers', id, who); save(); render();", "stampIt('answers', id, who); const kept = save(); if (kept !== false) refreshQuestionNote754(id); return kept;", 'save a note without destroying its next click target')
replace('<input data-qa="${esc(q.noteId || q.id)}" value="${esc(a)}" placeholder="Add a note - it keeps your name and time">',
        '<input data-qa="${esc(q.noteId || q.id)}" maxlength="600" value="${esc(questionDraftValue754(id))}" placeholder="Add a note - it keeps your name and time">',
        'make the existing note length limit visible to the input')
replace("+ (a ? `<span class=\"edby\">${esc(who)}${when ? ' · ' + esc(when) : ''}</span>` : ''); };",
        "+ (ed || a ? `<span class=\"edby\" data-qa-meta=\"${esc(id)}\">${a ? esc(who) + (when ? ' · ' + esc(when) : '') : ''}</span>` : ''); };",
        'give note attribution a stable in-place update target')
replace('<li data-question-id="${esc(q.id)}" data-question-state="${esc(q.st)}">',
        '<li data-question-id="${esc(q.id)}" data-question-state="${esc(q.st)}" data-question-draft="${q.draft754 ? \'true\' : \'false\'}">',
        'identify retained drafts for an in-place saved-state update')
replace("pane.querySelectorAll('[data-qa]').forEach(i => i.onchange = () => setQAnswer(i.dataset.qa, i.value));",
        "pane.querySelectorAll('[data-qa]').forEach(i => { const finish = () => { if (i.value !== qAnswer(i.dataset.qa)) setQAnswer(i.dataset.qa, i.value); }; i.onchange = finish; i.onblur = finish; });",
        'save a restored draft when the user finishes editing it')
replace("const list = L => groups.map(g =>", "const list = (L, section) => groups.map(g =>", 'separate open and pending group identifiers')
replace('id="qg-${esc(ourSlug(g))}"', 'id="qg-${esc(section)}-${esc(ourSlug(g))}"', 'unique Questions group ids')
replace("${list(now) || '<p class=\"sub\">Nothing needs an answer right now.</p>'}", "${list(now, 'open') || '<p class=\"sub\">Nothing needs an answer right now.</p>'}", 'identify open groups')
replace('${list(later)}</details>', "${list(later, 'pending')}</details>", 'identify pending groups')
replace('<details class="card qcard qfold"><summary><h3>Pending confirmation / later', '<details class="card qcard qfold" data-qfold="pending"><summary><h3>Pending confirmation / later', 'remember the pending fold')
replace('<details class="card qcard qfold"><summary><h3>Answered or history', '<details class="card qcard qfold" data-qfold="history"><summary><h3>Answered or history', 'remember the history fold')
replace("document.getElementById('qg-' + ourSlug(a.dataset.qg))", "document.getElementById('qg-open-' + ourSlug(a.dataset.qg))", 'jump to the open group only')
open(path, 'w', encoding='utf-8').write(text)
print('ok', path, 'v7.54 Questions note workflow')
