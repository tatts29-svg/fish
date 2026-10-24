/* Author: Andrew Fisher. Close checks only from their records; keep saved notes accessible. */
function retainedQuestion754(id, failed){
 const labels = [
  ['sp-nums', 'Asset numbers', 'plant'], ['sp-extra', 'Planned and recorded asset numbers', 'plant'],
  ['sp-short', 'Delivery quantities', 'plant'], ['sp-noqty', 'Schedule quantities', 'plant'],
  ['fe-quote', 'Fencing quote', 'fencing'], ['fe-gap', 'Fencing progress', 'fencing'],
  ['lb-rates', 'Labour cost basis', 'costs'], ['lb-noqty', 'Installation quantities', 'pricing'],
  ['tr-await', 'Transport costs', 'costs']
 ];
 let known = labels.find(x => x[0] === id);
 if (!known && id.startsWith('lb-nights-')) known = [id, 'Accommodation rate', 'runsheet'];
 if (!known && id.startsWith('fe-rate-')) known = [id, 'Fencing rate', 'fencing'];
 if (!known && id.startsWith('br-norate-')) known = [id, id.slice(10) + ' contract rates', 'costs'];
 if (!known && id.startsWith('tr-miss-')) known = [id, 'Transport cost review', 'costs'];
 if (!known && id.startsWith('lb-miss-')) known = [id, 'Event labour review', 'costs'];
 return {id, st: QH_DONE, group: 'History', archived754: true,
  q: (known ? known[1] : 'Earlier question') + ' — saved note retained',
  why: failed ? 'Some current checks could not run. This note is retained for review; the question is not assumed to be resolved.'
   : 'This question is no longer in the current check list. Its note, author and time remain here for reference. A saved note does not establish a rate, delivery or verified cost.',
  need: '', go: known ? known[2] : 'questions'};
}
function questionsList(){
 const Q = questionsList_753();
 decorateQuestionEvidence754(Q);
 const fail = name => { Q.fails = (Q.fails || []).concat(name); };
 try {
  const fleet = sourceRehire754('FL01'), a = assetOf('FL01'), numbered = a && locNums(a);
  if (!(Q.fails || []).length && !Q.some(q => q.id === 'sp-nums') && fleet && numbered && Number.isFinite(numbered.q) && numbered.q > 0 && numbered.n === numbered.q) {
   Q.push({id: 'sp-nums', st: QH_DONE, group: 'Schedule & plant', confirmed754: true,
    q: 'Asset-number check — FL01 answered from the contract',
    why: `FL01 is the adopted T0003 forklift. Contract 9961976, line 31 explicitly records ASSET ${fleet.no} in its location note. The page now shows ${fleet.no} as the supplier fleet number, with its source. The supplier is not named on that line; MISCITEM and the purchase-order number are not asset numbers.`,
    rows: [`FL01 · supplier fleet ${fleet.no} · contract 9961976, line 31`], need: '', go: 'plant',
    original: 'FL01: 0 of 1 numbered. The supplier fleet number was present in the contract location note but was not being shown.'});
  }
 } catch (e) { fail('source-backed fleet answer'); }
 Q.forEach(q => {
  if (q.id === 'sp-extra') {
   q.original = q.original || q.q + '. ' + q.why + ' ' + q.need;
   q.q = 'Planned and recorded asset numbers — allocation to review';
   q.why = 'A planned number and an on-site number can both remain in the source history. Two numbers do not by themselves prove two buildings arrived. The charge quantity remains limited to the order; review the allocation before removing a number.';
   q.need = 'Confirm which number is the current unit at each location and whether an earlier allocation was replaced. Keep the source history; do not remove a number solely because this check flags it.';
   q.rows = (q.rows || []).map(row => row.startsWith('P36 ') && row.includes('1327222') && row.includes('1282487')
    ? row + '. The recorded on-site and rental evidence supports 1282487 as the current unit. Confirm whether the schedule-only 1327222 allocation should be retired here; its physical location is not inferred.' : row);
  }
  if (q.id.startsWith('lb-nights-')) {
   q.original = q.original || q.why;
   q.why = q.why.replace(/(\d+) already stayed, (\d+) still to come\./, '$1 nights scheduled before today; $2 scheduled from today onward. Elapsed dates do not confirm a stay or its cost.');
  }
 });
 const seen = new Set(Q.map(q => q.noteId || q.id));
 questionHistory753().forEach(h => seen.add('oi-' + h[0]));
 Object.entries(S.answers || {}).forEach(([id, value]) => {
  if (typeof value === 'string' && value.trim() && !seen.has(id)) {
   Q.push(retainedQuestion754(id, !!(Q.fails || []).length)); seen.add(id);
  }
 });
 if (typeof QDRAFT754 !== 'undefined') Object.entries(QDRAFT754).forEach(([id, value]) => {
  const existing = Q.find(q => (q.noteId || q.id) === id);
  if (typeof value === 'string' && value.trim() && (!seen.has(id) || existing && existing.archived754)) {
   const draft = existing || retainedQuestion754(id, false);
   draft.draft754 = true; draft.q = draft.q.replace('saved note retained', 'unsaved note retained');
   draft.why = 'The check changed while this note was being edited. This is an unsaved draft, not an answer or confirmation. Finish or clear the note to resolve the draft.';
   if (!existing) Q.push(draft); seen.add(id);
  }
 });
 return Q;
}
function answersOverview754Html(){
 return '<div class="notice" data-answers754><b>Questions reviewed · 01 Oct 2026</b><p>Known answers are below in Answered or history. Remaining items need evidence or a decision; saved notes stay with their questions.</p></div>';
}
