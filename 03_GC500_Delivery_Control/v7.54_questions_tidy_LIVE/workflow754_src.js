/* Author: Andrew Fisher. Keep a Questions note in place while it saves, and retain the reader's place. */
const QFOLD754 = Object.create(null);
// Drafts stay in this browser session only. They are not answers or shared record entries.
const QDRAFT754 = Object.create(null);
function questionDraftValue754(id){
 return Object.prototype.hasOwnProperty.call(QDRAFT754, id) ? QDRAFT754[id] : qAnswer(id);
}
function questionNoteMeta754(id){
 const a = qAnswer(id), who = a ? (stampBy('answers', id) || 'unnamed') : '', when = a ? qWhen(id) : '';
 return a ? who + (when ? ' · ' + when : '') : '';
}
function refreshQuestionNote754(id){
 const hadDraft = Object.prototype.hasOwnProperty.call(QDRAFT754, id);
 delete QDRAFT754[id];
 const pane = $('#pane-questions'); if (!pane) return;
 pane.querySelectorAll('[data-qa]').forEach(input => { if (input.dataset.qa === id) input.value = qAnswer(id); });
 pane.querySelectorAll('[data-qa-meta]').forEach(meta => { if (meta.dataset.qaMeta === id) meta.textContent = questionNoteMeta754(id); });
 if (hadDraft) {
  const rows = [...pane.querySelectorAll('[data-question-draft="true"]')].filter(row => row.querySelector('[data-qa]')?.dataset.qa === id);
  if (rows.length) {
   const current = questionsList().find(q => (q.noteId || q.id) === id && q.archived754), saved = !!qAnswer(id);
   rows.forEach(row => {
    const title = row.querySelector(':scope > b'), why = row.querySelector(':scope > .qwhy');
    if (title) title.textContent = saved ? (current ? current.q : 'Note saved') : 'Note cleared';
    if (why) why.innerHTML = '<em>Retained note:</em> ' + esc(saved ? (current ? current.why : 'The note is saved with its author and time. A note does not establish a rate, delivery or verified cost.') : 'The draft has been cleared. No answer or confirmation was recorded.');
    row.dataset.questionDraft = 'false';
   });
  }
 }
}
function renderQuestions754(){
 const pane = $('#pane-questions'), active = document.activeElement;
 const note = active && pane && pane.contains(active) && active.matches('[data-qa]') ?
  {id: active.dataset.qa, value: active.value, start: active.selectionStart, end: active.selectionEnd} : null;
 if (note) { if (note.value !== qAnswer(note.id)) QDRAFT754[note.id] = note.value; else delete QDRAFT754[note.id]; }
 const foldKey = el => el.dataset.qfold || (el.classList.contains('qorig') && el.closest('[data-question-id]') ? 'original:' + el.closest('[data-question-id]').dataset.questionId : null);
 if (pane) pane.querySelectorAll('details').forEach(el => { const key = foldKey(el); if (key) QFOLD754[key] = el.open; });
 // Replacing a focused input can fire change. Keep its unsaved draft a draft during this redraw.
 const change = note ? active.onchange : null, blur = note ? active.onblur : null;
 if (note) { active.onchange = null; active.onblur = null; }
 let result;
 try { result = holdAssets(renderQuestions_held); }
 finally { if (note && active.isConnected) { active.onchange = change; active.onblur = blur; } }
 if (pane) {
  pane.querySelectorAll('details').forEach(el => { const key = foldKey(el); if (key && Object.prototype.hasOwnProperty.call(QFOLD754, key)) el.open = QFOLD754[key]; });
  if (note) {
   const input = [...pane.querySelectorAll('[data-qa]')].find(el => el.dataset.qa === note.id);
   if (input) {
    input.value = note.value;
    for (let parent = input.parentElement; parent && parent !== pane; parent = parent.parentElement) {
     if (parent.tagName === 'DETAILS' && !parent.open) { parent.open = true; const key = foldKey(parent); if (key) QFOLD754[key] = true; }
    }
    input.focus({preventScroll: true}); if (note.start != null) input.setSelectionRange(note.start, note.end);
   }
  }
 }
 return result;
}
